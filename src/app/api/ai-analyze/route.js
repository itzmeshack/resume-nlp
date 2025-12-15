// src/app/api/ai-analyze/route.js
// Robust hosted-model version: Groq (primary) + Gemini (fallback)
// Deterministic local scoring; strict JSON; input compaction; timeouts/retries; model auto-fallback; health check.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { GoogleGenerativeAI } from '@google/generative-ai';

/* ---------------- Config knobs (can be env-overridden) ---------------- */
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS || 120_000); // hard cap on body size processed
const HEADER_TIMEOUT_MS = Number(process.env.HEADER_TIMEOUT_MS || 25_000);  // wait for headers
const TOTAL_TIMEOUT_MS  = Number(process.env.TOTAL_TIMEOUT_MS  || 60_000);  // overall request timeout
const MAX_SUGGESTIONS   = Number(process.env.MAX_SUGGESTIONS   || 8);
const MAX_REWRITES      = Number(process.env.MAX_REWRITES      || 20);

/* ---------------- Small utils ---------------- */
function normText(s = '') { return (s || '').toLowerCase().replace(/[^a-z0-9+#./\s-]/g, ' '); }
function tokenize(t) { return normText(t).split(/\s+/).filter(Boolean); }
function uniq(arr) { return Array.from(new Set(arr)); }
function normalizeSpaces(s='') { return String(s||'').replace(/[ ]{2,}/g,' ').trim(); }
function safeSlice(s='', n=5000) { return (s||'').slice(0, n); }

/* ---------------- Tiny ATS checks (deterministic) ---------------- */
function atsChecks(text = '') {
  const words = (text.match(/\S+/g) || []).length;
  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const hasPhone = /\+?\d[\d\s().-]{7,}\d/.test(text);
  const hasBullets = /(^|\n)\s*([•\-*]\s+)/.test(text);
  const hasSections = /(experience|education|skills|projects|summary|objective|profile)/i.test(text);
  const longLine = text.split('\n').some(l => l.length > 140);
  const tokens = (text.match(/\S+/g) || []);
  const caps = tokens.filter(w => w.length >= 3 && w === w.toUpperCase()).length;
  const capsRatio = Math.round((caps / Math.max(tokens.length, 1)) * 100);

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

/* ---------------- Deterministic JD coverage ---------------- */
const STOP = new Set([
  'the','and','for','with','you','your','are','was','were','this','that','from','have','has',
  'had','but','not','all','any','can','will','into','onto','our','their','they','them',
  'a','an','of','to','in','on','as','by','at','is','be','or','it','we','i','&'
]);
// Broad, cross-industry phrase bank (aims ~90% coverage).
// Use as a seed; still prefer mining phrases from the JD at runtime.

export const PHRASE_CATEGORIES = {
  customer_service_retail: [
    'customer service','client support','customer support','customer care','call center',
    'issue resolution','complaint handling','order processing','point of sale','pos',
    'cash handling','merchandising','inventory checks','upselling','cross-selling',
    'store operations','loss prevention','visual merchandising','queue management'
  ],
  sales_marketing: [
    'lead generation','pipeline management','account management','crm',
    'sales forecasting','quota attainment','negotiation','contract closing',
    'go to market','gtm','market research','competitive analysis',
    'campaign management','email marketing','content strategy','social media strategy',
    'seo','sem','paid media','performance marketing','brand positioning','event marketing'
  ],
  admin_operations: [
    'office administration','calendar management','travel coordination',
    'meeting facilitation','minutes taking','record keeping','document control',
    'process documentation','standard operating procedures','sop',
    'vendor management','procurement','purchase orders','po processing',
    'facilities coordination','front desk','reception','data entry'
  ],
  finance_accounting: [
    'accounts payable','ap','accounts receivable','ar','reconciliation',
    'month end close','quarter end close','variance analysis','financial modeling',
    'budgeting and forecasting','cash flow management','general ledger','gl',
    'audit support','gaap','ifrs','tax preparation','cost accounting'
  ],
  hr_recruiting: [
    'talent acquisition','candidate sourcing','interview scheduling','offer negotiation',
    'onboarding','employee relations','performance management','hris',
    'benefits administration','payroll processing','policy development',
    'training and development','l&d','compliance training','diversity and inclusion'
  ],
  project_program_product: [
    'project management','program management','product management',
    'requirements gathering','stakeholder management','roadmap planning',
    'backlog grooming','sprint planning','agile ceremonies','scrum',
    'risk management','change management','status reporting','kpi tracking',
    'go live','post mortem','retrospective','continuous improvement'
  ],
  software_it: [
    'software development','full stack','frontend development','backend development',
    'api design','rest api','graphql','microservices','service oriented architecture',
    'soa','monorepo','version control','git flow','code review',
    'system design','scalability','high availability','ha','observability',
    'incident management','it support','help desk','itil','ticket triage'
  ],
  programming_languages_frameworks: [
    'javascript','typescript','python','java','c#','c++','go','rust','php','ruby','kotlin','swift',
    'react','react native','next.js','vue','nuxt','angular','svelte',
    'node.js','express','nestjs','spring boot','django','flask','fastapi','laravel','rails'
  ],
  data_ai_ml: [
    'data engineering','data analysis','data visualization','etl','elt','data pipeline',
    'sql','nosql','data warehousing','data lake','snowflake','bigquery','redshift',
    'feature engineering','model training','model evaluation','model deployment',
    'machine learning','ml ops','mlops','deep learning','nlp','computer vision',
    'a/b testing','experiment design','statistics','hypothesis testing'
  ],
  cloud_devops_infra: [
    'devops','ci/cd','continuous integration','continuous delivery',
    'infrastructure as code','iac','terraform','pulumi','ansible','packer',
    'docker','kubernetes','helm','service mesh','istio','linkerd',
    'cloud architecture','aws','gcp','azure','iam','sso','vpc',
    'monitoring and alerting','prometheus','grafana','datadog','new relic','splunk'
  ],
  cybersecurity_it_risk: [
    'vulnerability management','threat detection','incident response','siem',
    'soc operations','identity and access management','iam','pam',
    'network security','endpoint protection','security hardening',
    'iso 27001','nist csf','gdpr compliance','hipaa compliance','pci dss',
    'risk assessment','penetration testing','secure coding'
  ],
  qa_testing: [
    'test planning','test cases','test automation','unit testing','integration testing',
    'end to end testing','e2e','regression testing','uat','quality assurance',
    'selenium','cypress','playwright','jest','pytest'
  ],
  design_ux: [
    'user research','usability testing','wireframing','prototyping','information architecture',
    'interaction design','visual design','design systems','accessibility','a11y',
    'figma','sketch','adobe xd','illustrator','photoshop'
  ],
  manufacturing_maintenance: [
    'lean manufacturing','six sigma','kaizen','5s','oee',
    'preventive maintenance','predictive maintenance','root cause analysis',
    'quality control','statistical process control','spc',
    'bom management','work instructions','shop floor','plc programming'
  ],
  supply_chain_logistics: [
    'supply chain management','demand planning','s&op','sales and operations planning',
    'inventory management','warehouse operations','wms','tms',
    'order fulfillment','pick and pack','last mile delivery',
    'route optimization','freight management','bill of lading'
  ],
  construction_trades: [
    'site safety','osha 10','osha 30','ppe compliance',
    'reading blueprints','blueprint interpretation','quantity takeoff',
    'concrete placement','rebar installation','formwork','scaffolding',
    'carpentry','masonry','drywall','hvac installation','electrical wiring',
    'heavy equipment operation','surveying','change orders'
  ],
  healthcare_life_sciences: [
    'patient care','clinical protocols','triage','vital signs','medication administration',
    'care plans','electronic health records','ehr','emr','hipaa',
    'laboratory procedures','clinical trials','gcp compliance','gxp','pharmacovigilance',
    'bls','acls','rn','lpn','cna'
  ],
  education_training: [
    'curriculum development','lesson planning','classroom management','assessment design',
    'iep','differentiated instruction','learning outcomes',
    'edtech integration','student engagement','professional development'
  ],
  hospitality_tourism: [
    'front desk operations','reservation management','guest relations',
    'concierge services','housekeeping coordination','banquet operations',
    'food safety','haccp','barista skills','mixology',
    'event planning','venue management'
  ],
  aviation_aerospace: [
    'preflight inspection','flight operations','atc communication',
    'ifr','vfr','faa regulations','easa regulations',
    'ground operations','ramp safety','airworthiness','safety management system','sms'
  ],
  energy_utilities: [
    'power systems','substation operations','grid reliability',
    'renewable energy','solar pv','wind turbines','battery storage',
    'permit compliance','environmental monitoring','hvac balancing','hv switching'
  ],
  legal_compliance: [
    'contract review','contract drafting','legal research',
    'regulatory compliance','policy development','risk mitigation',
    'privacy compliance','ip management','litigation support','ediscovery'
  ],
  real_estate_facilities: [
    'property management','lease negotiation','tenant relations',
    'maintenance scheduling','facility inspections','space planning',
    'cmms','work order management','health and safety compliance'
  ],
  media_communications: [
    'content creation','copywriting','editing','proofreading',
    'public relations','press releases','media outreach',
    'video production','post production','podcast production'
  ],
  research_science: [
    'experimental design','protocol development','literature review',
    'data collection','data analysis','lab safety','glp',
    'manuscript preparation','grant writing','peer review'
  ],
  agriculture_food: [
    'crop management','irrigation scheduling','soil testing',
    'pest management','organic certification','good agricultural practices','gap',
    'food safety','haccp','traceability','cold chain management'
  ],
  transportation_driving: [
    'route planning','dispatch coordination','fleet management',
    'vehicle inspections','dot compliance','cdl',
    'hazmat handling','load securement','logbook management'
  ],
  public_sector_safety: [
    'policy analysis','community outreach','public administration',
    'emergency response','incident command system','ics',
    'report writing','evidence handling','safeguarding','background checks'
  ],
};

// Flattened list (unique)
export const PHRASES = [...new Set(Object.values(PHRASE_CATEGORIES).flat())];


function tokenizeJD(jdText) {
  const toks = normText(jdText).split(/\s+/).filter(w => w && w.length > 2 && !STOP.has(w));
  const freq = new Map(); for (const t of toks) freq.set(t, (freq.get(t) || 0) + 1);
  const topUni = Array.from(freq.entries()).filter(([w])=>!/^\d+$/.test(w))
                   .sort((a,b)=>b[1]-a[1]).slice(0,60).map(([w])=>w);
  const foundPhrases = PHRASES.filter(p => normText(jdText).includes(p));
  return uniq([...foundPhrases, ...topUni]);
}
function deriveCoverage(resumeText, jdText) {
  const pool = tokenizeJD(jdText);
  const resTokens = new Set(tokenize(resumeText));
  const resNorm = normText(resumeText);
  const present = [], missing = [];
  for (const k of pool) {
    const hit = k.includes(' ') ? resNorm.includes(k) : resTokens.has(k);
    (hit ? present : missing).push(k);
  }
  return { present, missing };
}
function coverageScore(present, missing) {
  const denom = present.length + missing.length;
  return denom ? Math.round((present.length / denom) * 100) : 0;
}

/* ---------------- Input compaction (robustness) ---------------- */
function topRelevantLines(text='', jdPool=[], maxLines=180) {
  const lines = (text||'').split('\n').map(x=>x.trim()).filter(Boolean);
  if (lines.length <= maxLines) return lines.join('\n');
  const weights = jdPool.map(w => ({ w, re: new RegExp(`(^|\\W)${w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(\\W|$)`, 'i') }));
  const scored = lines.map(l => {
    let s = 0;
    for (const t of weights) if (t.re.test(l)) s += 1;
    if (/\b\d{2,}(%|[kKmM]?)\b/.test(l)) s += 0.5;
    if (/^[-•*]\s/.test(l)) s += 0.2;
    return { l, s };
  });
  return scored.sort((a,b)=>b.s-a.s).slice(0, maxLines).map(x=>x.l).join('\n');
}

function compactInputs(resumeText, jdText) {
  const r0 = safeSlice(resumeText, MAX_INPUT_CHARS);
  const j0 = safeSlice(jdText, MAX_INPUT_CHARS / 2);
  const pool = tokenizeJD(j0);
  const r = r0.length > 15000 ? topRelevantLines(r0, pool, 220) : r0;
  const j = j0.length > 12000 ? topRelevantLines(j0, pool, 180) : j0;
  return { r, j };
}

/* ---------------- Prompt (tight JSON) ---------------- */
function buildPrompt(resumeText, jdText, mode='focused') {
  const intensity = mode==='comprehensive'
    ? 'Provide concise but comprehensive, section-aware rewrites grounded in the JD.'
    : 'Provide concise, high-impact, section-aware rewrites grounded in the JD.';

  return `
Return ONLY valid JSON (no commentary) with keys exactly:
{
  "present": string[] (optional),
  "missing": string[] (optional),
  "suggestions": string[],             // <= ${MAX_SUGGESTIONS} short items
  "rewrites": [{ "original": string, "suggestion": string }]  // <= ${MAX_REWRITES} items
}

Improve the RESUME to match the JOB DESCRIPTION WITHOUT inventing facts.
- Focus on Summary, Skills, and Experience bullets.
- Use JD terminology only where the resume provides evidence.
- Remove fluff, no fake numbers.
- Rewrites must be materially different (not trivial paraphrases).
- TOTAL JSON text <= ~2000 characters.

Guidance: ${intensity}

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}
`.trim();
}

/* ---------------- JSON Schema for strict outputs ---------------- */
const OutSchema = {
  name: 'resume_tailor_schema',
  schema: {
    type: 'object',
    properties: {
      present: { type: 'array', items: { type: 'string' } },
      missing: { type: 'array', items: { type: 'string' } },
      suggestions: { type: 'array', items: { type: 'string' } },
      rewrites: {
        type: 'array',
        items: {
          type: 'object',
          properties: { original: { type: 'string' }, suggestion: { type: 'string' } },
          required: ['original','suggestion']
        }
      }
    },
    required: ['suggestions','rewrites'],
    additionalProperties: false
  },
  strict_schema: true
};

/* ---------------- Groq caller (primary) with timeouts & model fallback ---------------- */
async function callGroqJSON({ model, apiKey, prompt }) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  async function requestOnce(response_format, useModel, signal) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: useModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 2048,
        response_format
      }),
      signal
    });
    return res;
  }

  const pref = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const candidates = uniq([pref, 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'openai/gpt-oss-20b']).filter(Boolean);

  let lastErr = '';
  for (const m of candidates) {
    let decommissioned = false;

    // Try JSON Schema first, then json_object
    for (const useSchema of [true, false]) {
      const ac = new AbortController();
      const headerTimer = setTimeout(() => ac.abort(), HEADER_TIMEOUT_MS);
      let totalTimer;

      try {
        const totalPromise = new Promise((_, rej) => {
          totalTimer = setTimeout(() => rej(new Error(`Groq total timeout ${TOTAL_TIMEOUT_MS}ms`)), TOTAL_TIMEOUT_MS);
        });

        const resPromise = requestOnce(
          useSchema ? { type: 'json_schema', json_schema: OutSchema } : { type: 'json_object' },
          m,
          ac.signal
        );

        const res = await Promise.race([resPromise, totalPromise]);
        clearTimeout(headerTimer);
        clearTimeout(totalTimer);

        if (!res || !('ok' in res)) {
          lastErr = 'No response (timeout?)';
          continue;
        }

        if (!res.ok) {
          const body = await res.text().catch(()=> '');
          lastErr = body || `HTTP ${res.status}`;
          if (body.includes('model_decommissioned')) { decommissioned = true; break; }
          if ((res.status === 400 || res.status === 404 || res.status === 422) && useSchema) {
            // Try json_object next iteration
            continue;
          }
          // Other errors → try next model
          break;
        }

        const data = await res.json();
        const txt = data?.choices?.[0]?.message?.content?.trim?.() || '';
        if (!txt) { lastErr = 'Empty Groq response'; continue; }

        try { return JSON.parse(txt); }
        catch {
          const mjson = txt.match(/\{[\s\S]*\}$/);
          if (mjson) return JSON.parse(mjson[0]);
          lastErr = `Groq returned non-JSON: ${txt.slice(0,300)}…`;
          // Try next model
          break;
        }
      } catch (e) {
        clearTimeout(headerTimer);
        clearTimeout(totalTimer);
        lastErr = String(e?.message || e);
        // Try next schema mode or next model
      }
    }

    if (decommissioned) {
      // Go to next candidate model
      continue;
    }
  }
  throw new Error(`Groq failed after candidates (${candidates.join(', ')}): ${lastErr || 'no body'}`);
}

/* ---------------- Gemini (fallback) with timeouts ---------------- */
async function callGeminiJSON({ model, apiKey, prompt, useSchema = true, _retry = 0 }) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({
    model,
    generationConfig: useSchema
      ? { temperature: 0, topP: 1, topK: 1, maxOutputTokens: 4096, responseMimeType: 'application/json', responseSchema: OutSchema.schema }
      : { temperature: 0, topP: 1, topK: 1, maxOutputTokens: 4096, responseMimeType: 'application/json' }
  });

  const ac = new AbortController();
  const headerTimer = setTimeout(() => ac.abort(), HEADER_TIMEOUT_MS);
  let totalTimer;

  try {
    const totalPromise = new Promise((_, rej) => {
      totalTimer = setTimeout(() => rej(new Error(`Gemini total timeout ${TOTAL_TIMEOUT_MS}ms`)), TOTAL_TIMEOUT_MS);
    });

    const res = await Promise.race([
      (async () => m.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }))(),
      totalPromise
    ]);

    clearTimeout(headerTimer);
    clearTimeout(totalTimer);

    let txt = (res?.response?.text?.() || '').trim();
    if (!txt) {
      const cands = res?.response?.candidates || [];
      for (const c of cands) {
        const parts = c?.content?.parts || [];
        for (const p of parts) if (p?.text?.trim()) { txt = p.text.trim(); break; }
        if (txt) break;
      }
      if (!txt && useSchema && _retry === 0) {
        return await callGeminiJSON({ model, apiKey, prompt, useSchema: false, _retry: 1 });
      }
      if (!txt) throw new Error('Empty Gemini response');
    }

    try { return JSON.parse(txt); }
    catch {
      const mjson = txt.match(/\{[\s\S]*\}$/);
      if (mjson) return JSON.parse(mjson[0]);
      throw new Error('Gemini returned non-JSON');
    }
  } finally {
    clearTimeout(headerTimer);
    clearTimeout(totalTimer);
  }
}

/* ---------------- Route ---------------- */
export async function POST(req) {
  try {
    // Enforce max incoming body size (rough guard)
    const raw = await req.text();
    if (raw.length > MAX_INPUT_CHARS * 2) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
    }
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 }); }

    const resumeText0 = normalizeSpaces(parsed?.resumeText || '');
    const jdText0     = normalizeSpaces(parsed?.jdText || '');
    const mode        = parsed?.mode === 'comprehensive' ? 'comprehensive' : 'focused';

    if (!resumeText0 || !jdText0) {
      return new Response(JSON.stringify({ error: 'Missing resumeText or jdText' }), { status: 400 });
    }

    // Compact inputs (speed & reliability)
    const { r: resumeText, j: jdText } = compactInputs(resumeText0, jdText0);

    // Deterministic coverage + ATS (no tokens)
    const local = deriveCoverage(resumeText, jdText);
    const stableScore = coverageScore(local.present, local.missing);
    const ats = atsChecks(resumeText);

    // Prompt
    const promptText = buildPrompt(resumeText, jdText, mode);

    // Engine selection: Groq → Gemini
    let out;
    if (process.env.USE_GROQ === 'true') {
      const groqKey = process.env.GROQ_API_KEY;
      const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      if (!groqKey) {
        return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), { status: 500 });
      }
      out = await callGroqJSON({ model: groqModel, apiKey: groqKey, prompt: promptText });
    } else {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY' }), { status: 500 });
      }
      out = await callGeminiJSON({ model, apiKey, prompt: promptText, useSchema: true })
        .catch(() => callGeminiJSON({ model, apiKey, prompt: promptText, useSchema: false }));
    }

    // Clean output (dedupe + caps)
    const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
    const canon = s => norm(s).toLowerCase();

    let suggestions = Array.isArray(out?.suggestions) ? out.suggestions.map(norm).filter(Boolean) : [];
    const seen = new Set();
    suggestions = suggestions.filter(s => { const k = canon(s); if (seen.has(k)) return false; seen.add(k); return true; })
                             .slice(0, MAX_SUGGESTIONS);

    let rewrites = Array.isArray(out?.rewrites) ? out.rewrites : [];
    rewrites = rewrites
      .filter(r => r && r.original && r.suggestion && canon(r.original) !== canon(r.suggestion))
      .map(r => ({ original: norm(r.original), suggestion: norm(r.suggestion) }))
      .slice(0, MAX_REWRITES);

    return new Response(JSON.stringify({
      score: stableScore,
      present: local.present,
      missing: local.missing,
      suggestions,
      rewrites,
      ats,
      engine: process.env.USE_GROQ === 'true' ? 'groq' : 'gemini',
      deterministic: true
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('ai-analyze error:', e?.message || e);
    return new Response(JSON.stringify({ error: 'Analyze failed' }), { status: 500 });
  }
}

/* Health check: confirms API is alive (does not call models) */
export async function GET() {
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
