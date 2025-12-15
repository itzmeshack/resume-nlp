// src/lib/score.js

/* ---------- Text utils ---------- */
export function normalize(text = '') {
  return (text || '').replace(/\r/g, '').replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ').trim();
}
export function toTokens(text = '') {
  return normalize(text).toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}
export function uniq(arr) { return Array.from(new Set(arr)); }

/* ---------- Token-cosine fallback ---------- */
export function cosineSimFromTokens(a = [], b = []) {
  const ma = new Map(); for (const t of a) ma.set(t, (ma.get(t) || 0) + 1);
  const mb = new Map(); for (const t of b) mb.set(t, (mb.get(t) || 0) + 1);
  let dot = 0, a2 = 0, b2 = 0;
  for (const [, c] of ma) a2 += c * c;
  for (const [, c] of mb) b2 += c * c;
  for (const [t, c] of ma) if (mb.has(t)) dot += Math.min(c, mb.get(t));
  const denom = Math.sqrt(a2) * Math.sqrt(b2) || 1;
  return dot / denom;
}

/* ---------- Coverage with simple synonyms ---------- */
const SYN = {
  javascript: ['js', 'node', 'node.js', 'nodejs'],
  python: ['py'],
  react: ['reactjs', 'react.js'],
  typescript: ['ts'],
  postgres: ['postgresql', 'psql'],
  aws: ['amazon web services'],
  gcp: ['google cloud', 'google cloud platform'],
  excel: ['spreadsheets'],
  kpi: ['key performance indicators', 'key-performance-indicators'],
  etl: ['extract transform load'],
};
function expandTerm(t='') {
  const key = t.toLowerCase(); const out = [key];
  if (SYN[key]) out.push(...SYN[key]);
  return uniq(out);
}
function esc(s=''){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

export function coverage(jdTerms = [], resumeText = '') {
  const base = normalize(resumeText).toLowerCase();
  const present = [], missing = [];
  for (const raw of jdTerms) {
    const variants = expandTerm(raw);
    const hit = variants.some(v => new RegExp(`(^|\\W)${esc(v)}(\\W|$)`, 'i').test(base));
    (hit ? present : missing).push(raw);
  }
  const ratio = jdTerms.length ? present.length / jdTerms.length : 0;
  return { present, missing, ratio };
}

/* ---------- Title match & ATS hygiene ---------- */
export function titleMatchScore(jdTitles = [], resume = '') {
  if (!jdTitles?.length) return 0;
  const base = normalize(resume).toLowerCase();
  let hits = 0;
  for (const t of jdTitles) {
    if (new RegExp(`(^|\\W)${esc(String(t).toLowerCase())}(\\W|$)`).test(base)) hits++;
  }
  return Math.min(1, hits / jdTitles.length);
}

export function atsHygiene(resume = '') {
  const text = normalize(resume);
  const bullets = (text.match(/^\s*[-•*]/gm) || []).length;
  const emails  = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).length;
  const phones  = (text.match(/\+?\d[\d\s().-]{7,}\d/g) || []).length;

  let score = 1.0; const tips = [];
  if (text.length < 800)   { score *= 0.9;  tips.push('Resume looks short—expand achievements.'); }
  if (text.length > 10000) { score *= 0.85; tips.push('Resume is very long—trim less relevant parts.'); }
  if (bullets < 5)         { score *= 0.92; tips.push('Use bullet points for readability.'); }
  if (!emails)             { score *= 0.9;  tips.push('Add a professional email in header.'); }
  if (!phones)             { score *= 0.94; tips.push('Add a phone number in header.'); }

  return { score: Math.max(0, Math.min(1, score)), tips };
}

/* ---------- Final weighted score (0..100) ---------- */
export function finalScore({ sim = 0, cover = 0, title = 0, ats = 1 }) {
  const w = { cover: 0.45, sim: 0.35, title: 0.10, ats: 0.10 };
  const s = (w.cover * cover) + (w.sim * sim) + (w.title * title) + (w.ats * ats);
  return Math.round(s * 100);
}
