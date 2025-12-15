// src/app/ai-tools/components/TailorResumeTool.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshCcw,
  Maximize2,
  Download,
  FileText,
  Copy,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

/* -------------------- small helpers -------------------- */

const SHEET_W = 816; // px visual width for the "paper"
function escapeHtml(s = '') {
  return (s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function tokenize(s = '') {
  const re = /([A-Za-z0-9+#./-]+|[^\sA-Za-z0-9]+|\s+)/g;
  const out = []; let m;
  while ((m = re.exec(s)) !== null) out.push(m[0]);
  return out.length ? out : [s];
}
function lcsOps(aTokens, bTokens) {
  const n = aTokens.length, m = bTokens.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    dp[i][j] = (aTokens[i] === bTokens[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const ops = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (aTokens[i] === bTokens[j]) { ops.push({ type: 'equal', text: aTokens[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: 'del', text: aTokens[i++] }); }
    else { ops.push({ type: 'add', text: bTokens[j++] }); }
  }
  while (i < n) ops.push({ type: 'del', text: aTokens[i++] });
  while (j < m) ops.push({ type: 'add', text: bTokens[j++] });
  return ops;
}
/** Greedily apply AI rewrites (longest originals first). */
function applyRewrites(base = '', rewrites = []) {
  const list = [...(rewrites || [])]
    .filter(r => r?.original && r?.suggestion)
    .sort((a, b) => b.original.length - a.original.length);
  let out = base || '';
  for (const r of list) {
    const esc = r.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(esc, 'g'), r.suggestion);
  }
  return out;
}
function htmlFromText(text = '') {
  return escapeHtml(text).replace(/\n/g, '<br/>');
}
function htmlWithAdditions(original = '', improved = '') {
  const ops = lcsOps(tokenize(original), tokenize(improved));
  let html = '';
  for (const op of ops) {
    if (op.type === 'equal') html += escapeHtml(op.text);
    else if (op.type === 'add') html += /^\s+$/.test(op.text)
      ? op.text
      : `<mark style="background:rgba(34,197,94,.25);border-radius:4px;padding:0 2px;">${escapeHtml(op.text)}</mark>`;
  }
  return html.replace(/\n/g, '<br/>');
}

/* -------------------- Full screen HTML viewer (vertical only) -------------------- */

function FullscreenViewer({
  originalHtml,
  tailoredHtml,
  beforeScore,
  afterScore,
  activeView,
  setActiveView,
  showHighlights,
  onToggleHighlights,
  onClose,
}) {
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom(z => Math.min(1.8, parseFloat((z + 0.1).toFixed(2))));
  const zoomOut = () => setZoom(z => Math.max(0.7, parseFloat((z - 0.1).toFixed(2))));
  const resetZoom = () => setZoom(1);

  const headerBadge = activeView === 'original'
    ? (Number.isFinite(beforeScore) ? `Match Score: ${beforeScore}` : 'Original')
    : (Number.isFinite(afterScore) ? `Match Score: ${afterScore}` : 'Tailored');

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      {/* panel */}
      <div className="relative w-[94vw] h-[94vh] mx-auto my-[3vh] rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('original')}
              className={`px-3 py-1.5 text-xs rounded border ${activeView === 'original' ? 'bg-white/15 border-white/20 text-white' : 'border-white/20 text-white/80 hover:bg-white/10'}`}
            >
              Original
            </button>
            <button
              onClick={() => setActiveView('tailored')}
              className={`px-3 py-1.5 text-xs rounded border ${activeView === 'tailored' ? 'bg-white/15 border-white/20 text-white' : 'border-white/20 text-white/80 hover:bg-white/10'}`}
            >
              Tailored
            </button>

            <span className="ml-2 text-xs px-2 py-1 rounded-full border border-white/20 text-white/80">
              {headerBadge}
            </span>

            {activeView === 'tailored' && (
              <label className="ml-3 inline-flex items-center gap-2 text-xs text-white/80 select-none">
                <input
                  type="checkbox"
                  checked={showHighlights}
                  onChange={onToggleHighlights}
                  className="h-4 w-4 rounded border-white/20 bg-white/5"
                />
                Highlight additions
              </label>
            )}
          </div>

          <div className="inline-flex items-center gap-2">
            <button onClick={zoomOut} className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-white hover:bg-white/10" title="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={resetZoom} className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-white hover:bg-white/10" title="Reset">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={zoomIn} className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-white hover:bg-white/10" title="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs text-white hover:bg-white/10">
              <X className="w-4 h-4" /> Close
            </button>
          </div>
        </div>

        {/* viewer: vertical only */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex justify-center py-3">
            <div
              style={{ width: `${SHEET_W}px`, transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              className="bg-white text-black rounded-xl shadow-[0_25px_80px_rgba(0,0,0,0.45)] ring-1 ring-black/5"
            >
              <div className="px-10 py-12 leading-[1.55] text-[13px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="font-extrabold text-blue-600">ResumeAI — {activeView === 'original' ? 'Original' : 'Tailored'}</div>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: activeView === 'original' ? originalHtml : tailoredHtml,
                  }}
                />
              </div>
            </div>
          </div>
          {/* extra bottom spacing so last line isn't flush to edge */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}

/* -------------------- main tool -------------------- */

export default function TailorResumeTool() {
  const [resume, setResume] = useState('');
  const [jd, setJD] = useState('');

  const [busy, setBusy] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');

  const [enhancedText, setEnhancedText] = useState('');
  const [beforeScore, setBeforeScore] = useState(null);
  const [afterScore, setAfterScore] = useState(null);

  const [showHighlights, setShowHighlights] = useState(true);
  const [activeView, setActiveView] = useState('tailored'); // default to tailored on open
  const [fullscreen, setFullscreen] = useState(false);

  const printRef = useRef(null);

  // load projects (optional)
  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;
      const { data, error } = await supabase.from('projects').select('id, name').order('created_at', { ascending: false });
      if (!error && data) setProjects(data);
    })();
  }, []);

  const loadFromProject = async (id) => {
    try {
      setProjectId(id);
      if (!id) return;
      const { data, error } = await supabase
        .from('projects')
        .select('resume_text, jd_text, analysis, latest_score')
        .eq('id', id)
        .single();
      if (error) throw error;
      setResume(data?.resume_text || '');
      setJD(data?.jd_text || '');
      setEnhancedText('');
      setBeforeScore(null);
      setAfterScore(null);
      toast.success('Loaded from project');
    } catch (e) {
      toast.error(e.message || 'Failed to load project');
    }
  };

  const run = async () => {
    try {
      const resumeText = (resume || '').trim();
      const jdText = (jd || '').trim();
      if (!resumeText || !jdText) {
        toast.error('Paste both Resume and Job Description.');
        return;
      }
      setBusy(true);

      // 1) analyze original
      const variantId = `tailor_${Date.now()}`;
      const a1Res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jdText, variantId, mode: 'focused' }),
      });
      const a1 = await a1Res.json();
      if (!a1Res.ok) throw new Error(a1?.error || 'Analyze failed');
      setBeforeScore(a1?.score ?? null);

      // 2) apply rewrites
      const enhanced = applyRewrites(resumeText, a1?.rewrites || []);
      setEnhancedText(enhanced);

      // 3) re-score enhanced
      const a2Res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: enhanced, jdText, variantId: `${variantId}_after`, mode: 'focused' }),
      });
      const a2 = await a2Res.json();
      if (!a2Res.ok) throw new Error(a2?.error || 'Analyze failed');
      setAfterScore(a2?.score ?? null);

      // 4) persist (optional)
      if (projectId) {
        await supabase.from('projects').update({
          analysis: a2,
          latest_score: a2?.score ?? null,
          status: 'Analyzed',
        }).eq('id', projectId);
      }

      // show tailored in viewer by default after run
      setActiveView('tailored');
      toast.success('Resume tailored');
    } catch (e) {
      toast.error(e.message || 'Analyze failed');
    } finally {
      setBusy(false);
    }
  };

  /* -------- viewer HTML (no PDFs) -------- */
  const originalHtml = useMemo(() => htmlFromText(resume), [resume]);
  const tailoredHtml = useMemo(() => {
    if (!enhancedText) return htmlFromText(resume);
    if (showHighlights) return htmlWithAdditions(resume, enhancedText);
    return htmlFromText(enhancedText);
  }, [enhancedText, resume, showHighlights]);

  /* -------- exports (optional) -------- */
  const buildPrintNode = (el, title, score, html) => {
    if (!el) return;
    el.innerHTML = `
      <div style="width:${SHEET_W}px;margin:0 auto;padding:48px 56px;background:#ffffff;color:#0a0a0a;
                  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
                  font-size:12.5px;line-height:1.55;border-radius:8px;box-shadow:0 0 0 1px rgba(0,0,0,0.04) inset;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;">
          <div style="font-size:18px;font-weight:800;color:#2563eb;">ResumeAI — ${title}</div>
          ${Number.isFinite(score) ? `<div style="margin-left:auto;font-size:12px;padding:4px 8px;border-radius:999px;background:#e0ecff;color:#1e40af;">Match Score: ${score}</div>` : ''}
        </div>
        <div>${html}</div>
      </div>
    `;
  };

  const downloadPDF = async () => {
    const title = activeView === 'original' ? 'Original' : 'Tailored';
    const score = activeView === 'original' ? beforeScore : afterScore;
    const html = activeView === 'original'
      ? originalHtml
      : htmlFromText(enhancedText || resume); // export clean text (no highlights)
    buildPrintNode(printRef.current, title, score, html);
    try {
      const h2c = await import('html2canvas');
      if (typeof window !== 'undefined') window.html2canvas = h2c.default || h2c;
    } catch {}
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'px', format: 'a4', hotfixes: ['px_scaling'] });
    await doc.html(printRef.current, { margin: [0,0,0,0], autoPaging: 'text', html2canvas: { scale: 2, windowWidth: SHEET_W } });
    doc.save(`resume-${title.toLowerCase()}.pdf`);
  };

  const downloadDOCX = async () => {
    const text = (activeView === 'original' ? resume : (enhancedText || resume)).replace(/\r?\n/g, '\n');
    if (!text.trim()) return;
    const { Document, Packer, Paragraph } = await import('docx');
    const paragraphs = text.split(/\n+/).map(line => new Paragraph(line));
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `resume-${activeView}.docx`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTXT = () => {
    const text = (activeView === 'original' ? resume : (enhancedText || resume)).replace(/\r?\n/g, '\n');
    if (!text.trim()) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `resume-${activeView}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyCurrent = async () => {
    const text = (activeView === 'original' ? resume : (enhancedText || resume)).trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6 text-white">
      {/* Project quick-load */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="text-sm text-white/80">
            <div className="font-semibold">Optional: Load from an existing Project</div>
            <div>Pull your last saved resume & JD into this tool.</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={projectId}
              onChange={(e) => loadFromProject(e.target.value)}
              className="border border-white/15 rounded-lg px-3 py-2 text-sm bg-white/5 text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-[#0f1520]">— Select a project —</option>
              {projects.map(p => <option key={p.id} value={p.id} className="bg-[#0f1520]">{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Editors */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
          <div className="mb-2 font-semibold text-sm sm:text-base">Resume</div>
          <textarea
            value={resume}
            onChange={(e) => { setResume(e.target.value); setEnhancedText(''); setBeforeScore(null); setAfterScore(null); }}
            className="w-full border border-white/15 rounded px-3 py-2 text-sm min-h-[160px] bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste your resume text here…"
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
          <div className="mb-2 font-semibold text-sm sm:text-base">Job Description</div>
          <textarea
            value={jd}
            onChange={(e) => { setJD(e.target.value); }}
            className="w-full border border-white/15 rounded px-3 py-2 text-sm min-h-[160px] bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste the job description here…"
          />
        </div>
      </div>

      {/* Compact on-page “sheet” preview (HTML, not PDF) */}
      <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3">
        {/* Analyze button pinned to top-left of the preview border */}
        <div className="absolute -top-3 left-3">
          <button
            onClick={run}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-500/20 border border-white/10"
          >
            <RefreshCcw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            {busy ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>

        {/* Header: view toggles + score chips */}
        <div className="mb-3 mt-2 flex flex-wrap items-center gap-2 justify-between">
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => setActiveView('original')}
              className={`px-3 py-1.5 text-xs rounded border ${activeView === 'original' ? 'bg-white/15 border-white/20 text-white' : 'border-white/20 text-white/80 hover:bg-white/10'}`}
            >
              Original
            </button>
            <button
              onClick={() => setActiveView('tailored')}
              className={`px-3 py-1.5 text-xs rounded border ${activeView === 'tailored' ? 'bg-white/15 border-white/20 text-white' : 'border-white/20 text-white/80 hover:bg-white/10'}`}
            >
              Tailored
            </button>
            {activeView === 'tailored' && (
              <label className="ml-2 inline-flex items-center gap-2 text-xs text-white/80 select-none">
                <input
                  type="checkbox"
                  checked={showHighlights}
                  onChange={() => setShowHighlights(v => !v)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5"
                />
                Highlight additions
              </label>
            )}
          </div>

          <div className="inline-flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full border border-white/20 text-white/80">
              {activeView === 'original'
                ? (Number.isFinite(beforeScore) ? `Match Score: ${beforeScore}` : 'Score: —')
                : (Number.isFinite(afterScore) ? `Match Score: ${afterScore}` : 'Score: —')}
            </span>
            <button
              onClick={() => setFullscreen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs text-white hover:bg-white/10"
              title="Open full screen"
            >
              <Maximize2 className="w-4 h-4" /> Expand
            </button>
          </div>
        </div>

        {/* The sheet preview (scaled to fit container, scroll disabled here) */}
        <div className="relative">
          <div className="flex justify-center">
            <div
              style={{ width: `${SHEET_W}px` }}
              className="bg-white text-black rounded-xl shadow-[0_25px_80px_rgba(0,0,0,0.45)] ring-1 ring-black/5"
            >
              <div className="px-10 py-12 leading-[1.55] text-[13px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="font-extrabold text-blue-600">ResumeAI — {activeView === 'original' ? 'Original' : 'Tailored'}</div>
                  <span className="ml-auto text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {activeView === 'original'
                      ? (Number.isFinite(beforeScore) ? `Score: ${beforeScore}` : 'Score: —')
                      : (Number.isFinite(afterScore) ? `Score: ${afterScore}` : 'Score: —')}
                  </span>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: activeView === 'original'
                      ? htmlFromText(resume)
                      : (showHighlights
                          ? htmlWithAdditions(resume, enhancedText || resume)
                          : htmlFromText(enhancedText || resume)),
                  }}
                />
              </div>
            </div>
          </div>
          <div className="h-2" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={downloadPDF}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/10"
        >
          <Download className="w-4 h-4" /> PDF
        </button>
        <button
          onClick={downloadDOCX}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/10"
        >
          <FileText className="w-4 h-4" /> DOCX
        </button>
        <button
          onClick={downloadTXT}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/10"
        >
          <FileText className="w-4 h-4" /> TXT
        </button>
        <button
          onClick={copyCurrent}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/10"
        >
          <Copy className="w-4 h-4" /> Copy
        </button>
      </div>

      {/* Full-screen vertical viewer (HTML, zoomable) */}
      {fullscreen && (
        <FullscreenViewer
          originalHtml={originalHtml}
          tailoredHtml={showHighlights ? htmlWithAdditions(resume, enhancedText || resume) : htmlFromText(enhancedText || resume)}
          beforeScore={beforeScore}
          afterScore={afterScore}
          activeView={activeView}
          setActiveView={setActiveView}
          showHighlights={showHighlights}
          onToggleHighlights={() => setShowHighlights(v => !v)}
          onClose={() => setFullscreen(false)}
        />
      )}

      {/* hidden node for PDF export */}
      <div ref={printRef} className="hidden" />
    </div>
  );
}
