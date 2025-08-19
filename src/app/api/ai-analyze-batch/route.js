// Batch analyzer: compare one RESUME against many JOBS (targets) at once.
// Local, precise metrics (no fake numbers), focused suggestions (capped).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import keyword_extractor from 'keyword-extractor';
import { pipeline } from '@xenova/transformers';

const MAX_SUGGESTIONS = 5;
const MAX_REWRITES    = 6;
const EMB_MODEL       = 'Xenova/all-MiniLM-L6-v2';

const PHRASES = ['machine learning','data analysis','data science','project management','product management','continuous integration','continuous delivery','unit testing','test automation','customer success','cloud computing','natural language processing','neural networks','statistical modeling','feature engineering','api design','responsive design','microservices','version control','agile','stakeholder management','requirements gathering','data visualization','model deployment','prompt engineering','information retrieval'];

const TECH = ['python','javascript','typescript','react','next.js','node.js','express','flask','django','pandas','numpy','scikit-learn','spacy','transformers','pytorch','tensorflow','docker','kubernetes','aws','gcp','azure','git','postgresql','mysql','mongodb','graphql','rest','ci/cd','jest','cypress','redis'];

const lower = (s) => (s||'').toLowerCase();
const unique = (arr) => Array.from(new Set((arr||[]).map(v=>v?.toString().trim()).filter(Boolean)));
const countOcc = (text, term) => (text.match(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'))||[]).length;

function cosine(a,b){ if(!a?.length||!b?.length) return 0; let dot=0,na=0,nb=0; for(let i=0;i<a.length;i++){ const x=a[i]||0,y=b[i]||0; dot+=x*y; na+=x*x; nb+=y*y;} return dot/(Math.sqrt(na)*Math.sqrt(nb)||1); }
function meanPool(feat){ const arr=feat?.data||feat; const dims=feat.dims?.[2]||384; const tokens=(arr.length/dims)|0; const out=new Float32Array(dims); for(let t=0;t<tokens;t++){ for(let d=0;d<dims;d++){ out[d]+=arr[t*dims+d]; } } for(let d=0;d<dims;d++) out[d]/=Math.max(tokens,1); return out; }
let embedderPromise=null; function getEmbedder(){ if(!embedderPromise){ embedderPromise=pipeline('feature-extraction', EMB_MODEL); } return embedderPromise; }

function extractBullets(text){
  if(!text) return [];
  const lines=text.split(/\r?\n/), out=[];
  for(const raw of lines){
    const line=(raw||'').trim(); if(!line) continue;
    const m=line.match(/^([•\-*–])\s*(.+)$/);
    if(m){ out.push(m[2].trim()); continue; }
    if(line.endsWith('.') || line.length>40) out.push(line);
  }
  return unique(out).filter(b=>b.length>8).slice(0,80);
}
const WEAK_TO_STRONG=[
  [/^\s*(helped|assisted)\b/i,'Supported'],
  [/^\s*(worked on|worked with)\b/i,'Delivered'],
  [/^\s*(responsible for|involved in)\b/i,'Led'],
  [/^\s*(participated in)\b/i,'Contributed to'],
  [/^\s*(using|used)\b/i,'Utilized'],
  [/^\s*(created|made)\b/i,'Built'],
];
const hasRealNumber = (s)=>/\d/.test(s);
function needsRewrite(bullet, jdKeywordsPool){
  const low=lower(bullet);
  const hasJD = jdKeywordsPool.some(k => low.includes(lower(k)));
  const hasNum= hasRealNumber(bullet);
  return !(hasJD && hasNum);
}
function rewriteBullet(original, jdKeywordsPool){
  let b=original.trim();
  for(const [re,repl] of WEAK_TO_STRONG){ if(re.test(b)){ b=b.replace(re,repl); break; } }
  if(!/^[A-Z][a-z]+/.test(b)) b='Implemented '+b.charAt(0).toLowerCase()+b.slice(1);
  if(!hasRealNumber(b)){ b += ' — Add a real metric you already track (%, time saved, revenue/cost impact).'; }
  const low=lower(b); const add=[];
  for(const k of jdKeywordsPool){ const kk=lower(k); if(kk && !low.includes(kk)){ add.push(k); if(add.length>=2) break; } }
  if(add.length){ b += `${hasRealNumber(b)?';':'.'} Aligns with: ${add.join(', ')}.`; }
  return b.replace(/\s{2,}/g,' ').trim();
}
function atsChecks(resumeText){
  const text=resumeText||''; const words=text.split(/\s+/).filter(Boolean); const wc=words.length;
  const hasEmail=/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const hasPhone=/\+?\d[\d\s().-]{7,}\d/.test(text);
  const hasBullets=/(^|\n)\s*([•\-*]\s+)/.test(text);
  const hasSections=/(experience|education|skills|projects|summary|profile)/i.test(text);
  const capsRatio=(()=>{ const caps=words.filter(w=>w.length>=3 && w===w.toUpperCase()).length; return Math.round((caps/Math.max(words.length,1))*100); })();
  const longLine=text.split('\n').some(l=>l.length>140);
  const oddChars=/[^\x09\x0A\x0D\x20-\x7E]/.test(text) && !/[•©®™–—]/.test(text);
  const out=[];
  out.push(hasEmail?{status:'pass',text:'Contact email detected',tip:'—'}:{status:'fail',text:'No email detected',tip:'Add a professional email in the header.'});
  out.push(hasPhone?{status:'pass',text:'Phone number detected',tip:'—'}:{status:'warn',text:'No phone number detected',tip:'Add a reachable number.'});
  out.push(wc<250?{status:'warn',text:`Short resume (${wc} words)`,tip:'Add a few impact bullets with metrics.'}:wc>1000?{status:'warn',text:`Long resume (${wc} words)`,tip:'Trim to the most relevant content.'}:{status:'pass',text:`Word count OK (${wc})`,tip:'—'});
  out.push(hasSections?{status:'pass',text:'Standard section headings present',tip:'—'}:{status:'warn',text:'Key section headings missing',tip:'Add standard headings for ATS.'});
  out.push(hasBullets?{status:'pass',text:'Bullet points detected',tip:'—'}:{status:'warn',text:'No bullet points',tip:'Use concise bullets for achievements.'});
  out.push(capsRatio>15?{status:'warn',text:`High ALL-CAPS ratio (${capsRatio}%)`,tip:'Prefer bold to ALL CAPS.'}:{status:'pass',text:'Balanced text case',tip:'—'});
  out.push(longLine?{status:'warn',text:'Very long lines detected',tip:'Avoid multi-column PDFs that copy as one long line.'}:{status:'pass',text:'Line lengths look normal',tip:'—'});
  out.push(oddChars?{status:'warn',text:'Unusual characters detected',tip:'Export text-based PDF/DOCX, avoid scans/images.'}:{status:'pass',text:'Characters look clean',tip:'—'});
  return out;
}
function buildKeywordPool(jd){
  const jdWords = keyword_extractor.extract(jd, { language:'english', remove_digits:true, return_changed_case:true, remove_duplicates:false }).filter(w=>w.length>2);
  const m=new Map(); for(const w of jdWords){ m.set(w,(m.get(w)||0)+1); }
  const topUni = Array.from(m.entries()).sort((a,b)=>b[1]-a[1]).slice(0,50).map(([w])=>w);
  const jdNorm = lower(jd);
  const poolRaw = unique([...PHRASES, ...TECH, ...topUni]);
  const weighted = poolRaw.map(k => ({
    k,
    weight:(PHRASES.includes(k)?2:0)+(TECH.includes(k)?2:0)+Math.min(3, countOcc(jdNorm, k))
  }));
  return { weighted, list: weighted.map(x=>x.k), jdNorm };
}
function topByWeight(items,n){ return [...items].sort((a,b)=>(b.weight||0)-(a.weight||0)).slice(0,n); }

async function analyzeOne(resume, job){
  const { jdText, title='', industry='' } = job;
  const jd = (jdText||'').trim();
  const resumeNorm = lower(resume);
  const { weighted, list:keywordPool, jdNorm } = buildKeywordPool(jd);

  const present=[], missing=[];
  for(const {k} of weighted){ (resumeNorm.includes(lower(k))?present:missing).push(k); }

  const emb = await getEmbedder();
  const [resFeat, jdFeat] = await Promise.all([
    emb(resume, { pooling:'mean', normalize:true }),
    emb(jd,     { pooling:'mean', normalize:true }),
  ]);
  const resVec = resFeat.embedding ? resFeat.embedding : meanPool(resFeat);
  const jdVec  = jdFeat.embedding  ? jdFeat.embedding  : meanPool(jdFeat);
  const sim    = cosine(resVec, jdVec);

  const coverage = keywordPool.length ? present.length/keywordPool.length : 0;
  const score    = Math.round((0.6*coverage + 0.4*sim)*100);

  const bullets  = extractBullets(resume);
  const needers  = bullets.filter(b => needsRewrite(b, keywordPool));
  const rewrites = needers.slice(0, MAX_REWRITES).map(b => ({ original:b, suggestion: rewriteBullet(b, keywordPool) }));

  const ats = atsChecks(resume);

  const missingRanked = topByWeight(
    missing.map(k => ({
      text:`Add evidence for “${k}” if relevant (tools/tasks/metrics).`,
      weight:(PHRASES.includes(k)?2:0) + (TECH.includes(k)?2:0) + Math.min(3, countOcc(jdNorm, k))
    })), Math.ceil(MAX_SUGGESTIONS*0.7)
  );
  const atsRanked = topByWeight(
    ats.filter(a=>a.status!=='pass').map(a => ({ text:a.tip, weight: a.status==='fail'?3:2 })), Math.floor(MAX_SUGGESTIONS*0.3)
  );

  const suggestions = unique([...missingRanked, ...atsRanked].map(x=>x.text)).slice(0, MAX_SUGGESTIONS);

  return { title, industry, score: Math.max(0, Math.min(100, score)), present: present.slice(0,120), missing: missing.slice(0,120), suggestions, rewrites, ats, engine:'local-batch-v1' };
}

export async function GET() {
  return new Response(JSON.stringify({ ok:true, version:'local-batch-v1' }), { status:200, headers:{'Content-Type':'application/json'} });
}

export async function POST(req){
  try{
    const { resumeText='', jobs=[] } = await req.json();
    const resume = (resumeText||'').trim();
    if(!resume) return new Response(JSON.stringify({ error:'Missing resumeText' }), { status:400, headers:{'Content-Type':'application/json'} });
    if(!Array.isArray(jobs) || jobs.length===0) return new Response(JSON.stringify({ error:'No jobs provided' }), { status:400, headers:{'Content-Type':'application/json'} });

    const results = [];
    for(const job of jobs){
      const jd = (job?.jdText||'').trim();
      if(!jd){ results.push({ error:'Empty JD', title: job?.title||'', industry: job?.industry||'', clientId: job?.id ?? null }); continue; }
      // eslint-disable-next-line no-await-in-loop
      const r = await analyzeOne(resume, job);
      results.push({ ...r, clientId: job?.id ?? null });
    }
    return new Response(JSON.stringify({ results }), { status:200, headers:{'Content-Type':'application/json'} });
  }catch(e){
    console.error('ai-analyze-batch error:', e);
    return new Response(JSON.stringify({ error:'Batch analyze failed' }), { status:500, headers:{'Content-Type':'application/json'} });
  }
}
