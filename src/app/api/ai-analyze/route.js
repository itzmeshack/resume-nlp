// src/app/api/ai-analyze/route.js
// Gemini-powered analysis with JD-aligned ranking + per-call variety.
// Supports `mode: 'focused' | 'comprehensive'` and `maxSuggestions` override.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from '@google/generative-ai';

/* ---------------- ATS (light heuristics) ---------------- */
function atsChecks(text = '') {
  const words = (text.match(/\S+/g) || []).length;
  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const hasPhone = /\+?\d[\d\s().-]{7,}\d/.test(text);
  const hasBullets = /(^|\n)\s*([•\-*]\s+)/.test(text);
  const hasSections = /(experience|education|skills|projects|summary|objective|profile)/i.test(text);
  const longLine = text.split('\n').some(l => l.length > 140);
  const capsRatio = (() => {
    const tokens = (text.match(/\S+/g) || []);
    const caps = tokens.filter(w => w.length >= 3 && w === w.toUpperCase()).length;
    return Math.round((caps / Math.max(tokens.length, 1)) * 100);
  })();

  const out = [];
  out.push(hasEmail ? { status:'pass', text:'Contact email detected', tip:'Good.' }
                    : { status:'fail', text:'No email detected', tip:'Add a professional email in the header.' });
  out.push(hasPhone ? { status:'pass', text:'Phone number detected', tip:'Good.' }
                    : { status:'warn', text:'No phone number detected', tip:'Add a reachable phone number.' });
  out.push(
    words < 250 ? { status:'warn', text:`Short resume (${words} words)`, tip:'Add a few impact bullets with real metrics.' }
    : words > 1200 ? { status:'warn', text:`Long resume (${words} words)`, tip:'Trim to the most relevant content.' }
    : { status:'pass', text:`Word count looks good (${words})`, tip:'Nice balance.' }
  );
  out.push(hasSections ? { status:'pass', text:'Standard section headings present', tip:'Experience, Education, Skills…' }
                       : { status:'warn', text:'Key section headings missing', tip:'Add standard headings for ATS.' });
  out.push(hasBullets ? { status:'pass', text:'Bullet points detected', tip:'Good readability.' }
                      : { status:'warn', text:'No bullet points', tip:'Use concise bullets for achievements.' });
  out.push(capsRatio > 15 ? { status:'warn', text:`High ALL-CAPS ratio (${capsRatio}%)`, tip:'Prefer bold over ALL CAPS.' }
                          : { status:'pass', text:'Balanced text case', tip:'Good.' });
  out.push(longLine ? { status:'warn', text:'Very long lines detected', tip:'Avoid multi-column PDFs that copy as one long line.' }
                    : { status:'pass', text:'Line lengths look normal', tip:'Good for ATS.' });
  return out;
}

/* ---------------- utils for JD keywording & ranking ---------------- */
const STOP = new Set([
  'the','and','for','with','you','your','are','was','were','this','that','from','have','has','had',
  'but','not','all','any','can','will','into','onto','our','their','they','them','a','an','of','to',
  'in','on','as','by','at','is','be','or','it','we','i','&','—','–','/','\\'
]);

const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
const canon = s => norm(s).toLowerCase();
const normalize = s => (s || '').toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ');
const tokenize = (text) =>
  normalize(text).split(/\s+/).filter(w => w && w.length > 2 && !STOP.has(w));

function countFreq(tokens) {
  const m = new Map();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return Array.from(m.entries()).sort((a,b) => b[1] - a[1]);
}
function topWords(text, cap = 30) {
  const toks = tokenize(text);
  return countFreq(toks).map(([w]) => w).slice(0, cap);
}
function topBigrams(text, cap = 30) {
  const toks = tokenize(text);
  const m = new Map();
  for (let i = 0; i < toks.length - 1; i++) {
    const bg = `${toks[i]} ${toks[i+1]}`;
    m.set(bg, (m.get(bg) || 0) + 1);
  }
  return Array.from(m.entries())
    .filter(([, n]) => n > 1)
    .sort((a,b) => b[1] - a[1])
    .map(([bg]) => bg)
    .slice(0, cap);
}
function jdImportanceScore(s, jdWords, jdPhrases, missing) {
  const low = s.toLowerCase();
  let score = 0;
  for (const p of jdPhrases) if (low.includes(p)) score += 3;
  for (const m of missing)   if (low.includes(m)) score += 2;
  for (const w of jdWords)   if (low.includes(w)) score += 1;
  // Light preference for actionable/section-aware items
  if (/summary|skills|experience|project|education|bullet|header|achievement|metric|kpi/i.test(s)) score += 0.5;
  // Light penalty for generic fluff
  if (/improve|enhance|optimize|leverage|stakeholder/i.test(s) && !/(add|include|replace|quantify|rename|reorder|merge)/i.test(s)) score -= 0.25;
  return score;
}
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

/* ---------------- Prompt ---------------- */
function buildPrompt(resumeText, jdText, variantId, mode, maxSuggestions) {
  const angles = [
    'skill coverage & tools',
    'impact & outcomes',
    'leadership & collaboration',
    'domain/industry alignment',
    'ATS format & clarity',
    'projects & portfolio evidence',
    'metrics & KPIs (real facts only)',
    'keywords & phrasing fit'
  ];
  const angle = angles[Math.abs(hashCode(String(variantId))) % angles.length];

  const minSugs = mode === 'comprehensive' ? 12 : 6;
  const maxSugs = Math.max(minSugs, Math.min(30, maxSuggestions || (mode === 'comprehensive' ? 24 : 10)));
  const maxRewrites = mode === 'comprehensive' ? 10 : 6;

  return `
You are matching a RESUME to a JOB DESCRIPTION and must return **valid JSON only** (no prose).

Hard rules:
- Match strictly to the JD. Do NOT invent facts or numbers not present in resume/JD.
- No placeholders like "X%" or "Y ms".
- Suggestions must be **JD-aligned**, concrete, and non-duplicated.

Return JSON with the following fields:
{
  "score": 0..100 integer (coverage + fit),
  "present": [short keywords/phrases clearly present in resume relevant to JD],
  "missing": [short keywords/phrases important in JD but absent in resume],
  "suggestions": [${minSugs}..${maxSugs} concrete, JD-aligned improvements; no duplicates; no generic fluff],
  "rewrites": [{ "original": "...", "suggestion": "..." }] // up to ${maxRewrites}, only if they materially improve JD-fit
}

Focus angle for variety: ${angle}
Variant ID: ${variantId}

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}
  `.trim();
}

/* ---------------- Gemini (no responseSchema to avoid 400) ---------------- */
async function callGeminiJSON({ apiKey, model, prompt, temperature = 0.5 }) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({
    model,
    generationConfig: {
      temperature,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    }
  });
  const res = await m.generateContent(prompt);
  const txt = (res.response?.text?.() || '').trim();
  try { return JSON.parse(txt); } catch (e) {
    const mjson = txt.match(/\{[\s\S]*\}$/);
    if (mjson) return JSON.parse(mjson[0]);
    throw new Error('Gemini did not return JSON');
  }
}

async function genJSON({ apiKey, prompt }) {
  const primary   = process.env.GEMINI_MODEL || 'gemini-1.5-pro-002';
  const secondary = 'gemini-1.5-flash-002';

  try { return await callGeminiJSON({ apiKey, model: primary, prompt, temperature: 0.55 }); }
  catch (e1) {
    try { return await callGeminiJSON({ apiKey, model: secondary, prompt, temperature: 0.65 }); }
    catch (e2) {
      const err = new Error('All Gemini attempts failed');
      err.details = { e1: String(e1?.message || e1), e2: String(e2?.message || e2) };
      throw err;
    }
  }
}

/* ---------------- Route ---------------- */
export async function POST(req) {
  try {
    const body = await req.json();
    const resumeText = norm(body?.resumeText || '');
    const jdText = norm(body?.jdText || '');
    const variantId = body?.variantId || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const mode = (body?.mode || 'focused').toLowerCase(); // 'focused' | 'comprehensive'
    let maxSuggestions = Number(body?.maxSuggestions || 0) || (mode === 'comprehensive' ? 24 : 10);

    if (!resumeText || !jdText) {
      return new Response(JSON.stringify({ error: 'Missing resumeText or jdText' }), { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY' }), { status: 500 });
    }

    // Build prompt and call Gemini
    const prompt = buildPrompt(resumeText, jdText, variantId, mode, maxSuggestions);
    const out = await genJSON({ apiKey, prompt });

    // JD importance pools (for ranking)
    const jdWords   = topWords(jdText, 30);
    const jdPhrases = topBigrams(jdText, 30);

    // Present/missing
    const present = Array.from(new Set((out.present || []).map(norm))).filter(Boolean);
    const missing = Array.from(new Set((out.missing || []).map(norm))).filter(Boolean);

    // Suggestions: dedupe, JD-align ranking, cap by mode/max
    let suggestions = (out.suggestions || [])
      .map(s => norm(s))
      .filter(Boolean);

    // Remove duplicates (case-insensitive)
    const seen = new Set();
    suggestions = suggestions.filter(s => {
      const key = canon(s);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Keep JD-aligned ones first
    const scored = suggestions.map(s => ({
      s,
      score: jdImportanceScore(s, jdWords, jdPhrases, missing)
    }));
    scored.sort((a,b) => b.score - a.score);

    // Filter out ultra-generic ones (score <= 0), but keep at least a handful
    let filtered = scored.filter(x => x.score > 0).map(x => x.s);
    if (filtered.length < 4) filtered = scored.map(x => x.s); // fallback

    // Final cap
    const hardCap = Math.max(6, Math.min(30, maxSuggestions));
    suggestions = filtered.slice(0, hardCap);

    // Rewrites: only keep those that materially change text, cap by mode
    let rewrites = Array.isArray(out.rewrites) ? out.rewrites : [];
    rewrites = rewrites
      .filter(r => r && r.original && r.suggestion && canon(r.original) !== canon(r.suggestion))
      .map(r => ({ original: norm(r.original), suggestion: norm(r.suggestion) }));

    const maxRewrites = mode === 'comprehensive' ? 10 : 6;
    rewrites = rewrites.slice(0, maxRewrites);

    const payload = {
      score: Math.max(0, Math.min(100, Number(out.score) || 0)),
      present,
      missing,
      suggestions,
      rewrites,
      ats: atsChecks(resumeText),
      engine: 'gemini',
      mode,
      variantId
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('ai-analyze (gemini) error:', e);
    return new Response(JSON.stringify({ error: 'Analyze failed' }), { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
