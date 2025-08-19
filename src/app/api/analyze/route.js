// src/app/api/analyze/route.js
// Real (non-AI) analyzer: keyword overlap, phrase checks, simple suggestions.

export const dynamic = 'force-dynamic';

const STOP = new Set([
  'the','and','for','with','you','your','are','was','were','this','that','from','have','has',
  'had','but','not','all','any','can','will','into','onto','our','their','they','them',
  'a','an','of','to','in','on','as','by','at','is','be','or','it','we','i','&'
]);

const PHRASES = [
  'machine learning','data analysis','data science','project management','product management',
  'continuous integration','continuous delivery','unit testing','test automation',
  'customer success','cloud computing','natural language processing','neural networks',
  'statistical modeling','feature engineering','api design','responsive design',
  'microservices','version control','agile methodologies','agile'
];

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ');
}
function tokenize(s) {
  return normalize(s).split(/\s+/).filter(w => w && w.length > 2 && !STOP.has(w));
}

export async function POST(req) {
  try {
    const { resumeText = '', jdText = '' } = await req.json();

    if (!resumeText.trim() || !jdText.trim()) {
      return new Response(JSON.stringify({ error: 'Missing resumeText or jdText' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const jdTokens = Array.from(new Set(tokenize(jdText)));
    const resTokens = new Set(tokenize(resumeText));

    // phrase checks
    const jdNorm = normalize(jdText);
    const resNorm = normalize(resumeText);
    const phraseInJD = PHRASES.filter(p => jdNorm.includes(p));
    const phrasePresent = phraseInJD.filter(p => resNorm.includes(p));
    const phraseMissing = phraseInJD.filter(p => !resNorm.includes(p));

    // unigram overlap
    const present = jdTokens.filter(t => resTokens.has(t));
    const missing = jdTokens.filter(t => !resTokens.has(t));

    // scoring: phrases + keywords
    const denom = jdTokens.length + phraseInJD.length || 1;
    const hits = present.length + phrasePresent.length;
    const score = Math.max(0, Math.min(100, Math.round((hits / denom) * 100)));

    const suggestions = [
      ...missing.slice(0, 6).map(k => `Add evidence for "${k}" if applicable (tools, metrics, context).`),
      ...phraseMissing.slice(0, 4).map(p => `Consider mentioning "${p}" if it reflects your experience.`),
    ];

    return new Response(JSON.stringify({
      score,
      present: present.slice(0, 80),
      missing: missing.slice(0, 80),
      phrasePresent,
      phraseMissing,
      suggestions,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('Analyze error:', e);
    return new Response(JSON.stringify({ error: 'Analyze failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
