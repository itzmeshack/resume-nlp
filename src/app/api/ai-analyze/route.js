// src/app/api/ai-analyze/route.js
// Gemini-powered suggestions/rewrites with a deterministic, locally computed score.
// The score will not change unless you explicitly click Analyze/Regenerate.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from '@google/generative-ai';

/* ---------------- Tiny ATS checks (deterministic) ---------------- */
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

/* ---------------- Deterministic JD keyword extraction ---------------- */
const STOP = new Set([
  'the','and','for','with','you','your','are','was','were','this','that','from','have','has',
  'had','but','not','all','any','can','will','into','onto','our','their','they','them',
  'a','an','of','to','in','on','as','by','at','is','be','or','it','we','i','&'
]);

const PHRASES = [
  'customer service','passenger assistance','airport operations','check in','check-in','boarding',
  'luggage handling','baggage handling','safety procedures','clean and organized',
  'fast-paced environment','teamwork','communication skills'
];

function normalize(s) {
  return (s || '').toLowerCase();
}
function normText(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ');
}
function tokenize(text) {
  return normText(text)
    .split(/\s+/)
    .filter(w => w && w.length > 2 && !STOP.has(w));
}
function countFreq(tokens) {
  const map = new Map();
  for (const t of tokens) map.set(t, (map.get(t) || 0) + 1);
  return Array.from(map.entries()).sort((a,b) => b[1]-a[1]);
}

/** Build a JD keyword pool deterministically, then check presence in resume */
function deriveCoverage(resumeText, jdText, topN = 40) {
  const jdTokens = tokenize(jdText);
  const topUni = countFreq(jdTokens)
    .filter(([w]) => !/^\d+$/.test(w))
    .slice(0, topN)
    .map(([w]) => w);

  const jdNorm = normText(jdText);
  const jdPhrases = PHRASES.filter(p => jdNorm.includes(p));

  const keywordPool = Array.from(new Set([...jdPhrases, ...topUni])); // phrases first
  const resTokens = new Set(tokenize(resumeText));
  const resNorm = normText(resumeText);

  const present = [];
  const missing = [];
  for (const k of keywordPool) {
    const isPhrase = k.includes(' ');
    const hit = isPhrase ? resNorm.includes(k) : resTokens.has(k);
    (hit ? present : missing).push(k);
  }
  return { present, missing };
}

/** Deterministic score = coverage% rounded */
function coverageScore(present, missing) {
  const denom = present.length + missing.length;
  if (!denom) return 0;
  return Math.round((present.length / denom) * 100);
}

/* ---------------- JSON schema (no additionalProperties) ---------------- */
const Schema = {
  type: 'object',
  properties: {
    present: { type: 'array', items: { type: 'string' } },
    missing: { type: 'array', items: { type: 'string' } },
    suggestions: { type: 'array', items: { type: 'string' } },
    rewrites: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          suggestion: { type: 'string' }
        },
        required: ['original', 'suggestion']
      }
    }
  },
  required: ['suggestions', 'rewrites'] // present/missing optional since we compute locally
};

/* ---------------- Prompt (for suggestions/rewrites only) ---------------- */
function buildPrompt(resumeText, jdText, mode = 'focused') {
  const intensity = mode === 'comprehensive'
    ? 'Provide extensive coverage with many precise suggestions grounded in the JD.'
    : 'Provide only the most critical suggestions that materially improve JD match.';

  return `
You will produce JSON ONLY (no commentary).

Task: Improve the RESUME to better match the JOB DESCRIPTION. Do not invent facts or fake numbers.
- Suggestions must align strictly with JD content and resume evidence.
- No placeholders like "X%" — if evidence absent, phrase the rewrite plainly without inventing numbers.
- Rewrites should actually change phrasing to reflect JD terminology (no trivial rewording).
- Avoid duplicate suggestions.

Return JSON with:
{
  "present": string[] (optional),
  "missing": string[] (optional),
  "suggestions": string[],       // concrete, de-duplicated, JD-aligned
  "rewrites": [{ "original": "...", "suggestion": "..." }]  // only where it truly improves JD match
}

Guidance: ${intensity}

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}
  `.trim();
}

/* ---------------- Gemini callers (temperature 0 for stability) ---------------- */
async function callGeminiJSON({ model, apiKey, prompt, useSchema = true }) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({
    model,
    generationConfig: useSchema
      ? {
          temperature: 0,
          topP: 1,
          topK: 1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          responseSchema: Schema
        }
      : {
          temperature: 0,
          topP: 1,
          topK: 1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
  });
  const res = await m.generateContent(prompt);
  const txt = (res?.response?.text?.() || '').trim();
  if (!txt) throw new Error('Empty model response');
  try {
    return JSON.parse(txt);
  } catch {
    const mjson = txt.match(/\{[\s\S]*\}$/);
    if (mjson) return JSON.parse(mjson[0]);
    throw new Error('Model did not return JSON');
  }
}

/* ---------------- Route ---------------- */
export async function POST(req) {
  try {
    const body = await req.json();
    const resumeText = (body?.resumeText || '').trim();
    const jdText = (body?.jdText || '').trim();
    const mode = body?.mode === 'comprehensive' ? 'comprehensive' : 'focused';

    if (!resumeText || !jdText) {
      return new Response(JSON.stringify({ error: 'Missing resumeText or jdText' }), { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro-002';
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY' }), { status: 500 });
    }

    // 1) Deterministic JD coverage (stable present/missing + score)
    const local = deriveCoverage(resumeText, jdText, 40);
    const stableScore = coverageScore(local.present, local.missing);

    // 2) Ask Gemini only for suggestions/rewrites (temperature 0)
    let out;
    try {
      out = await callGeminiJSON({
        model,
        apiKey,
        prompt: buildPrompt(resumeText, jdText, mode),
        useSchema: true
      });
    } catch {
      out = await callGeminiJSON({
        model,
        apiKey,
        prompt: buildPrompt(resumeText, jdText, mode),
        useSchema: false
      });
    }

    // 3) Post-process output (de-dup & meaningful rewrites only)
    const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
    const canon = s => norm(s).toLowerCase();

    let suggestions = Array.isArray(out?.suggestions) ? out.suggestions.map(norm).filter(Boolean) : [];
    const seen = new Set();
    suggestions = suggestions.filter(s => {
      const key = canon(s);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let rewrites = Array.isArray(out?.rewrites) ? out.rewrites : [];
    rewrites = rewrites
      .filter(r => r && r.original && r.suggestion && canon(r.original) !== canon(r.suggestion))
      .map(r => ({ original: norm(r.original), suggestion: norm(r.suggestion) }))
      .slice(0, 10);

    const payload = {
      // Deterministic score (won’t change when switching tabs)
      score: stableScore,
      // Deterministic coverage
      present: local.present,
      missing: local.missing,
      // Model output (cleaned)
      suggestions,
      rewrites,
      // Deterministic ATS checks
      ats: atsChecks(resumeText),
      engine: 'gemini',
      deterministic: true
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('ai-analyze error:', e);
    return new Response(JSON.stringify({ error: 'Analyze failed' }), { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
