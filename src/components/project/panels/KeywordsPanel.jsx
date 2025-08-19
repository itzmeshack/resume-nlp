// src/components/project/panels/KeywordsPanel.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Copy, Plus, Search, RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

/* ---------------- stopwords & helpers ---------------- */
const STOP = new Set([
  'the','and','for','with','you','your','are','was','were','this','that','from','have','has',
  'had','but','not','all','any','can','will','into','onto','our','their','they','them',
  'a','an','of','to','in','on','as','by','at','is','be','or','it','we','i','&','–','—'
]);

const PHRASES = [
  'machine learning','data analysis','data science','project management','product management',
  'continuous integration','continuous delivery','unit testing','test automation',
  'customer success','cloud computing','natural language processing','neural networks',
  'statistical modeling','feature engineering','api design','responsive design',
  'microservices architecture','version control','agile methodologies','stakeholder management',
  'requirements gathering','data visualization','model deployment','prompt engineering'
];

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ');
}
function tokenize(text) {
  return normalize(text)
    .split(/\s+/)
    .filter(w => w && w.length > 2 && !STOP.has(w));
}
function countFreq(items) {
  const m = new Map();
  for (const it of items) m.set(it, (m.get(it) || 0) + 1);
  return Array.from(m.entries()).sort((a,b) => b[1] - a[1]);
}
function makeNgrams(tokens, n) {
  const grams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    const slice = tokens.slice(i, i + n);
    const ok = slice.filter(t => !STOP.has(t) && t.length > 2).length >= Math.ceil(n * 0.66);
    if (!ok) continue;
    grams.push(slice.join(' '));
  }
  return grams;
}

/* ---------------- component ---------------- */
export default function KeywordsPanel({ project }) {
  const params = useParams();
  const routeId = typeof params?.id === 'string'
    ? params.id
    : Array.isArray(params?.id) ? params.id[0] : null;

  const [filter, setFilter] = useState('');
  const [view, setView] = useState('all'); // all | present | missing
  const [custom, setCustom] = useState('');
  const [customList, setCustomList] = useState([]);
  const [preferAnalysis, setPreferAnalysis] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fresh, setFresh] = useState(project || null);

  // use project.id if provided, else fall back to route param
  const pid = project?.id || fresh?.id || routeId || null;

  const refresh = async () => {
    if (!pid) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, resume_text, jd_text, analysis')
        .eq('id', pid)
        .single();
      if (error) throw error;
      setFresh(data);
    } catch (e) {
      console.error('KeywordsPanel refresh error:', e);
      toast.error(e.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // initial fetch and whenever pid changes
  useEffect(() => { if (pid) refresh(); }, [pid]);

  const jdText = fresh?.jd_text || '';
  const resumeText = fresh?.resume_text || '';
  const analysis = fresh?.analysis || null;

  const data = useMemo(() => {
    if (!jdText.trim() && !(analysis?.present?.length || analysis?.missing?.length)) {
      return { list: [], present: new Set(), missing: new Set() };
    }

    const resNorm = normalize(resumeText);
    const resTokens = new Set(tokenize(resumeText));

    // Prefer AI-provided keywords if available
    if (preferAnalysis && (analysis?.present?.length || analysis?.missing?.length)) {
      const pool = Array.from(new Set(
        [...(analysis.present || []), ...(analysis.missing || [])]
          .map(s => String(s).toLowerCase().trim())
          .filter(Boolean)
      ));
      const present = new Set();
      const missing = new Set();

      for (const k of pool) {
        const hit = k.includes(' ') ? resNorm.includes(k) : resTokens.has(k);
        (hit ? present : missing).add(k);
      }

      for (const c of customList) {
        const cc = (c || '').trim().toLowerCase();
        if (!cc) continue;
        const hit = cc.includes(' ') ? resNorm.includes(cc) : resTokens.has(cc);
        (hit ? present : missing).add(cc);
        if (!pool.includes(cc)) pool.push(cc);
      }
      return { list: pool, present, missing };
    }

    // Fallback: derive from JD with phrases + ngrams + top unigrams
    const jdTokens = tokenize(jdText);
    const topUni = countFreq(jdTokens).filter(([w]) => !/^\d+$/.test(w)).slice(0, 40).map(([w]) => w);
    const jdNorm = normalize(jdText);
    const jdPhrases = PHRASES.filter(p => jdNorm.includes(p));
    const bigrams = countFreq(makeNgrams(jdTokens, 2)).slice(0, 20).map(([g]) => g);
    const trigrams = countFreq(makeNgrams(jdTokens, 3)).slice(0, 12).map(([g]) => g);

    const keywordPool = Array.from(new Set([...jdPhrases, ...bigrams, ...trigrams, ...topUni]));
    const present = new Set();
    const missing = new Set();

    for (const k of keywordPool) {
      const hit = k.includes(' ') ? resNorm.includes(k) : resTokens.has(k);
      (hit ? present : missing).add(k);
    }

    for (const c of customList) {
      const cc = (c || '').trim().toLowerCase();
      if (!cc) continue;
      const hit = cc.includes(' ') ? resNorm.includes(cc) : resTokens.has(cc);
      (hit ? present : missing).add(cc);
      if (!keywordPool.includes(cc)) keywordPool.push(cc);
    }

    return { list: keywordPool, present, missing };
  }, [jdText, resumeText, analysis?.present, analysis?.missing, customList, preferAnalysis]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const arr = data.list.filter(k =>
      view === 'present' ? data.present.has(k)
      : view === 'missing' ? data.missing.has(k)
      : true
    );
    return q ? arr.filter(k => k.includes(q)) : arr;
  }, [filter, view, data]);

  const presentCount = data.present.size;
  const missingCount = data.missing.size;

  /* ---------------- actions ---------------- */
  const copyMissing = async () => {
    const miss = Array.from(data.missing);
    if (!miss.length) return toast('No missing keywords.', { icon: '✅' });
    await navigator.clipboard.writeText(miss.join(', '));
    toast.success('Missing keywords copied');
  };
  const copyPresent = async () => {
    const arr = Array.from(data.present);
    if (!arr.length) return toast('No present keywords.', { icon: 'ℹ️' });
    await navigator.clipboard.writeText(arr.join(', '));
    toast.success('Present keywords copied');
  };
  const copyAll = async () => {
    const arr = data.list;
    if (!arr.length) return;
    await navigator.clipboard.writeText(arr.join(', '));
    toast.success('All keywords copied');
  };
  const addCustom = () => {
    const v = (custom || '').trim().toLowerCase();
    if (!v) return;
    if (customList.includes(v)) return toast('Already added.', { icon: 'ℹ️' });
    setCustomList(prev => [...prev, v]);
    setCustom('');
  };
  const clearCustom = () => {
    setCustomList([]);
    toast.success('Custom keywords cleared');
  };

  /* ---------------- UI ---------------- */
  if (!pid) {
    return (
      <div className="rounded-xl border border-gray-300 bg-white p-4 text-black">
        <h3 className="font-semibold mb-2">Keywords</h3>
        <p className="text-sm text-gray-700">
          No project id found. Make sure this panel is rendered under <code>/projects/[id]</code> or pass a <code>project</code> prop.
        </p>
      </div>
    );
  }

  const hasAIKeywords = Boolean(analysis?.present?.length || analysis?.missing?.length);

  return (
    <div className="space-y-6 text-black">
      {/* Controls */}
      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <div className="flex flex-col gap-3">
          {/* Top row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`px-3 py-1.5 rounded-lg border text-sm ${view==='all' ? 'bg-black text-white' : 'border-gray-300 hover:bg-gray-100'}`}
              onClick={() => setView('all')}
            >
              All <span className="ml-1 text-xs text-gray-400">({data.list.length})</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg border text-sm ${view==='present' ? 'bg-black text-white' : 'border-gray-300 hover:bg-gray-100'}`}
              onClick={() => setView('present')}
            >
              Present <span className="ml-1 text-xs text-gray-400">({presentCount})</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg border text-sm ${view==='missing' ? 'bg-black text-white' : 'border-gray-300 hover:bg-gray-100'}`}
              onClick={() => setView('missing')}
            >
              Missing <span className="ml-1 text-xs text-gray-400">({missingCount})</span>
            </button>

            <button
              onClick={refresh}
              disabled={loading}
              className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 disabled:opacity-50"
              title="Refresh from database"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>

            {hasAIKeywords && (
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={preferAnalysis}
                  onChange={(e) => setPreferAnalysis(e.target.checked)}
                />
                Use AI keywords
              </label>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter keywords…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          {/* Custom + copy */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Add custom keyword/phrase"
              className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
            <button
              onClick={addCustom}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-black text-white text-sm hover:bg-black/90"
              title="Track an extra keyword"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
            {customList.length > 0 && (
              <button
                onClick={clearCustom}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100"
                title="Clear custom keywords"
              >
                Clear custom
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={copyPresent}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100"
                title="Copy present keywords"
              >
                <Copy className="w-4 h-4" /> Copy Present
              </button>
              <button
                onClick={copyMissing}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100"
                title="Copy missing keywords"
              >
                <Copy className="w-4 h-4" /> Copy Missing
              </button>
              <button
                onClick={copyAll}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100"
                title="Copy all keywords"
              >
                <Copy className="w-4 h-4" /> Copy All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map((k) => {
            const isPresent = data.present.has(k);
            return (
              <span
                key={k}
                className={`text-sm px-3 py-2 rounded-lg border ${
                  isPresent ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                }`}
                title={isPresent ? 'Found in resume' : 'Not found in resume'}
              >
                {k}
              </span>
            );
          })}
          {!filtered.length && (
            <div className="text-sm text-gray-600">No keywords match your filter.</div>
          )}
        </div>

        {/* legend + tiny debug */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <span className="px-2 py-1 rounded border border-green-300 bg-green-50">Present</span>
          <span className="px-2 py-1 rounded border border-red-300 bg-red-50">Missing</span>
          <span className="ml-auto text-gray-400">
            jd:{(fresh?.jd_text||'').length} | resume:{(fresh?.resume_text||'').length} | ai:{(analysis?.present?.length||analysis?.missing?.length)?'yes':'no'}
          </span>
        </div>
      </div>
    </div>
  );
}
