'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Download, RefreshCcw, Copy, ThumbsUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { useFreshProject } from '../hooks/useFreshProject';

/* ---------------- helpers: safe HTML + word-diff highlighting ---------------- */

function escapeHtml(s = '') {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Tokenize into words + punctuation, preserving tokens; keep spaces to re-join nicely
// Example: "Hello, world!" -> ["Hello", ",", " ", "world", "!"]
function tokenizeForDiff(s = '') {
  // Split into [word] | [punct] | [space] tokens
  const re = /([A-Za-z0-9+#./-]+|[^\sA-Za-z0-9]+|\s+)/g;
  const out = [];
  let m;
  while ((m = re.exec(s)) !== null) out.push(m[0]);
  return out.length ? out : [s];
}

// LCS to produce diff of tokens (naive O(n*m) but fine for bullets/lines)
function diffTokens(aTokens, bTokens) {
  const n = aTokens.length, m = bTokens.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (aTokens[i] === bTokens[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (aTokens[i] === bTokens[j]) {
      out.push({ type: 'equal', text: aTokens[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: aTokens[i] });
      i++;
    } else {
      out.push({ type: 'add', text: bTokens[j] });
      j++;
    }
  }
  while (i < n) { out.push({ type: 'del', text: aTokens[i++] }); }
  while (j < m) { out.push({ type: 'add', text: bTokens[j++] }); }
  return out;
}

// Build highlighted HTML for original vs suggestion
function highlightRewrite(original = '', suggestion = '') {
  const a = tokenizeForDiff(original);
  const b = tokenizeForDiff(suggestion);
  const ops = diffTokens(a, b);

  // Original: show deletions with <del>, equal as normal (no additions)
  // Suggestion: show additions/replacements with <mark> (adds) and equal as normal (no deletions)
  let origHtml = '';
  let suggHtml = '';

  for (const op of ops) {
    const t = escapeHtml(op.text);

    if (op.type === 'equal') {
      origHtml += t;
      suggHtml += t;
    } else if (op.type === 'del') {
      // Only show deletions on original side
      // skip pure whitespace deletions to avoid noisy highlights
      if (!/^\s+$/.test(op.text)) {
        origHtml += `<del class="bg-red-50 line-through decoration-red-500/80">${t}</del>`;
      } else {
        origHtml += t;
      }
    } else if (op.type === 'add') {
      // Only show additions on suggestion side
      // If pure whitespace, keep as-is for spacing
      if (/^\s+$/.test(op.text)) {
        suggHtml += t;
      } else {
        suggHtml += `<mark class="bg-yellow-200 rounded px-0.5">${t}</mark>`;
      }
    }
  }

  return { origHtml, suggHtml };
}

/* ---------------- component ---------------- */

export default function SuggestionsPanel({ project }) {
  const { proj, setProj, refresh } = useFreshProject(project);
  const [busy, setBusy] = useState(false);

  // Mode toggle
  const [mode, setMode] = useState('focused'); // 'focused' | 'comprehensive'

  // If parent switches projects, refresh
  useEffect(() => {
    if (project?.id && project?.id !== proj?.id) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // Normalize analysis for UI (supports rewrites or suggestions array)
  const { rows, suggestions } = useMemo(() => {
    const a = proj?.analysis || {};
    const rewrites = Array.isArray(a.rewrites) ? a.rewrites : [];
    const suggestions = Array.isArray(a.suggestions) ? a.suggestions : [];
    const rows = rewrites.map(r => ({
      original: r.original || '',
      suggestion: r.suggestion || '',
      ...highlightRewrite(r.original || '', r.suggestion || '')
    }));
    return { rows, suggestions };
  }, [proj?.analysis]);

  // Get resume & JD robustly
  const ensureTexts = async () => {
    let resumeText = (proj?.resume_text || '').trim();
    let jdText = (proj?.jd_text || '').trim();
    let pid = proj?.id || project?.id || null;

    if (!resumeText || !jdText) {
      const latest = await refresh();
      pid = latest?.id || pid;
      resumeText = (latest?.resume_text || resumeText || '').trim();
      jdText = (latest?.jd_text || jdText || '').trim();
    }

    if ((!resumeText || !jdText) && pid) {
      const { data } = await supabase
        .from('projects')
        .select('id, resume_text, jd_text')
        .eq('id', pid)
        .single();
      if (data) {
        resumeText = (data.resume_text || resumeText || '').trim();
        jdText = (data.jd_text || jdText || '').trim();
        pid = data.id || pid;
      }
    }
    return { resumeText, jdText, pid };
  };

  const regenerate = async () => {
    try {
      setBusy(true);
      const { resumeText, jdText, pid } = await ensureTexts();
      if (!pid) {
        toast.error('No project id available.');
        return;
      }
      if (!resumeText || !jdText) {
        toast.error('Add resume text + JD first (Analyze tab).');
        return;
      }

      const variantId = `${mode}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jdText, variantId, mode })
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || 'Analyze failed');
        return;
      }

      // Save on project
      const { data: updated, error } = await supabase
        .from('projects')
        .update({
          latest_score: data.score,
          status: 'Analyzed',
          analysis: data
        })
        .eq('id', pid)
        .select(
          'id, user_id, name, resume_path, resume_url, resume_text, jd_text, latest_score, analysis, status, updated_at'
        )
        .single();

      if (error) throw error;

      setProj(updated);
      toast.success('Suggestions regenerated');
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Failed to regenerate');
    } finally {
      setBusy(false);
    }
  };

  const copyOne = async (t) => {
    await navigator.clipboard.writeText(t);
    toast.success('Copied');
  };

  const copyAll = async () => {
    const list = [
      ...(suggestions || []),
      ...(rows || []).map(r => r.suggestion)
    ].filter(Boolean);
    if (!list.length) return;
    await navigator.clipboard.writeText(list.map(s => `• ${s}`).join('\n'));
    toast.success('All suggestions copied');
  };

  const downloadTxt = () => {
    const list = [
      ...(suggestions || []),
      ...(rows || []).map(r => r.suggestion)
    ].filter(Boolean);
    if (!list.length) return;

    const name = (proj?.name || 'ResumeAI_Suggestions').replace(/[^\w\-]+/g, '_');
    const content = list.map(s => `• ${s}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${name}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const hasRewrites = rows.length > 0;

  return (
    <div className="space-y-6 text-black">
      {/* Controls */}
      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div>
            <h3 className="font-semibold">AI Rewrite Suggestions</h3>
            <p className="text-sm text-gray-700">Based on your JD and current resume text.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode buttons */}
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => setMode('focused')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${
                  mode === 'focused' ? 'bg-black text-white' : 'border-gray-300 hover:bg-gray-100'
                }`}
                title="Targeted changes only"
              >
                Focused
              </button>

              <button
                onClick={() => setMode('comprehensive')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${
                  mode === 'comprehensive' ? 'bg-black text-white' : 'border-gray-300 hover:bg-gray-100'
                }`}
                title="Broader coverage and more suggestions"
              >
                Comprehensive
                <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium rounded bg-gray-900 text-white px-2 py-0.5">
                  <ThumbsUp className="w-3 h-3" /> Recommended
                </span>
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={regenerate}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/90 disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
              {busy ? 'Regenerating…' : 'Regenerate'}
            </button>

            <button
              onClick={copyAll}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
            >
              <ClipboardList className="w-4 h-4" /> Copy All
            </button>

            <button
              onClick={downloadTxt}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
      </div>

      {/* Rewrites (with highlights) */}
      {hasRewrites && (
        <div className="space-y-4">
          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Original</div>
                <div
                  className="text-sm text-gray-800"
                  dangerouslySetInnerHTML={{ __html: r.origHtml }}
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Suggested (changes highlighted)</div>
                <div
                  className="text-sm font-medium"
                  dangerouslySetInnerHTML={{ __html: r.suggHtml }}
                />
                <div className="mt-2">
                  <button
                    onClick={() => copyOne(r.suggestion)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-100"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plain suggestions (if any) */}
      {(!hasRewrites && suggestions?.length > 0) && (
        <div className="space-y-3">
          {suggestions.map((s, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3 flex items-start justify-between gap-3">
              <div className="text-sm font-medium">{s}</div>
              <button
                onClick={() => copyOne(s)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-100"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {(!hasRewrites && (!suggestions || !suggestions.length)) && (
        <div className="rounded-xl border border-gray-300 bg-white p-4">
          <div className="text-sm text-gray-700">
            No suggestions yet. Click <strong>Regenerate</strong> after analyzing (Analyze tab).
          </div>
        </div>
      )}
    </div>
  );
}
