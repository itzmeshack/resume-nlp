'use client';

import { useMemo, useState } from 'react';
import { Rocket, Loader2, ExternalLink, RefreshCcw } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import ExportReportButton from '../../export/ExportReportButton';
import { useFreshProject } from '../hooks/useFreshProject';

/* ---------------------- UI helpers ---------------------- */

function scoreColor(score = 0) {
  if (score >= 80) return { ring: 'stroke-emerald-500', text: 'text-emerald-600' };
  if (score >= 50) return { ring: 'stroke-amber-500', text: 'text-amber-600' };
  return { ring: 'stroke-rose-500', text: 'text-rose-600' };
}

function ScoreDonut({ score = 0, size = 120, stroke = 10 }) {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (s / 100) * c;
  const { ring, text } = scoreColor(s);

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} className="block">
        <circle
          cx={size/2}
          cy={size/2}
          r={r}
          className="stroke-gray-200"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size/2}
          cy={size/2}
          r={r}
          className={`${ring} transition-all duration-500`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className={`font-semibold ${text}`}
          style={{ fontSize: 20 }}
        >
          {s}%
        </text>
      </svg>
    </div>
  );
}

/* ---------------------- Analyze Panel ---------------------- */

export default function AnalyzePanel({ project, onProjectChange }) {
  const { proj, setProj, refresh, loading, lastError } = useFreshProject(project);

  const [opening, setOpening] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [running, setRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // spin the arrow during refresh
  const [jdDraft, setJdDraft] = useState(project?.jd_text || '');

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const r = await refresh();
      if (r) toast.success('Refreshed');
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  const syncJDDraft = () => setJdDraft(proj?.jd_text || '');

  const saveJD = async () => {
    try {
      if (!proj?.id) return;
      const text = (jdDraft || '').trim();
      const { data, error } = await supabase
        .from('projects')
        .update({ jd_text: text })
        .eq('id', proj.id)
        .select('*')
        .single();
      if (error) throw error;
      setProj(data);
      onProjectChange?.(data);
      toast.success('Job description saved.');
    } catch (e) {
      toast.error(e.message || 'Failed to save JD');
    }
  };

  const openResume = async () => {
    try {
      setOpening(true);
      if (proj?.resume_path) {
        const { data, error } = await supabase
          .storage
          .from('resumes')
          .createSignedUrl(proj.resume_path, 60);
        if (error) throw error;
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      } else if (proj?.resume_url) {
        window.open(proj.resume_url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('No resume file available.');
      }
    } catch (e) {
      toast.error(e.message || 'Could not open resume.');
    } finally {
      setOpening(false);
    }
  };

  const extractText = async () => {
    try {
      await refresh();
      if (!proj?.resume_path && !proj?.resume_url) {
        toast.error('No uploaded resume to parse.');
        return;
      }
      setExtracting(true);

      let fileUrl = proj.resume_url || null;
      let filename = 'resume.bin';
      if (proj.resume_path) {
        const { data, error } = await supabase
          .storage
          .from('resumes')
          .createSignedUrl(proj.resume_path, 120);
        if (error) throw error;
        fileUrl = data.signedUrl;
        filename = proj.resume_path.split('/').pop() || 'resume.bin';
      } else if (proj.resume_url) {
        filename = proj.resume_url.split('?')[0].split('/').pop() || 'resume.bin';
      }

      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fileUrl, filename })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Parse failed');

      const text = (payload.text || '').trim();
      if (!text) {
        toast.error('Could not extract text from file.');
        return;
      }

      const { data: updated, error: upErr } = await supabase
        .from('projects')
        .update({ resume_text: text })
        .eq('id', proj.id)
        .select('*')
        .single();
      if (upErr) throw upErr;

      setProj(updated);
      onProjectChange?.(updated);
      toast.success('Resume text extracted & saved.');
    } catch (e) {
      toast.error(e.message || 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const runAI = async () => {
    try {
      const resumeText = (proj?.resume_text || '').trim();
      const jdText = (jdDraft || proj?.jd_text || '').trim();

      if (!resumeText || !jdText) {
        toast.error('Add resume text and job description first.');
        return;
      }

      // Persist changed JD so other panels see the same text
      if (proj?.id && jdDraft.trim() !== (proj?.jd_text || '').trim()) {
        const { data: saved, error: saveErr } = await supabase
          .from('projects')
          .update({ jd_text: jdDraft.trim() })
          .eq('id', proj.id)
          .select('*')
          .single();
        if (saveErr) throw saveErr;
        setProj(saved);
        onProjectChange?.(saved);
      }

      setRunning(true);

      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jdText })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || 'Analyze failed';
        toast.error(msg);
        throw new Error(msg);
      }

      const { error, data: updated } = await supabase
        .from('projects')
        .update({
          latest_score: data.score,
          status: 'Analyzed',
          analysis: data
        })
        .eq('id', proj.id)
        .select('*')
        .single();
      if (error) throw error;

      setProj(updated);
      onProjectChange?.(updated);
      toast.success('AI analysis complete');
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Analyze failed');
    } finally {
      setRunning(false);
    }
  };

  const score = useMemo(() => {
    const n = typeof proj?.latest_score === 'number' ? proj.latest_score : (proj?.analysis?.score ?? null);
    return n ?? 0;
  }, [proj?.latest_score, proj?.analysis?.score]);

  return (
    <div className="space-y-6 text-black">
      <Toaster position="top-center" />

      {/* Status / Controls (mobile-first) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
            title="Force refresh"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={runAI}
            disabled={running}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/90 disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            {running ? 'Analyzing…' : 'Run / Regenerate'}
          </button>
          <div className="sm:hidden">
            <ExportReportButton project={proj} result={proj?.analysis || null} />
          </div>
        </div>

        {/* Health badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2 py-1 rounded border ${proj?.resume_text?.trim() ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            Resume text: {proj?.resume_text?.trim() ? `OK (${(proj?.resume_text || '').length} chars)` : 'Missing'}
          </span>
          <span className={`text-xs px-2 py-1 rounded border ${proj?.jd_text?.trim() ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            JD text: {proj?.jd_text?.trim() ? `OK (${(proj?.jd_text || '').length} chars)` : 'Missing'}
          </span>
          {lastError && (
            <span className="text-xs px-2 py-1 rounded border border-red-300 bg-red-50 text-red-800">
              Supabase read error: {lastError.message || 'RLS/Policy blocked'}
            </span>
          )}
        </div>
      </div>

      {/* Score + Quick Export (responsive card) */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 sm:gap-6">
        <ScoreDonut score={score} />
        <div className="flex-1">
          <h3 className="font-semibold text-sm sm:text-base">Match Score</h3>
          <p className="text-xs sm:text-sm text-gray-700">
            This score reflects how well your resume aligns with the current job description.
          </p>
        </div>
        <div className="hidden sm:block">
          <ExportReportButton project={proj} result={proj?.analysis || null} />
        </div>
      </div>

      {/* Resume + JD cards (mobile-first, stackable) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resume */}
        <div className="rounded-xl border border-gray-300 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm sm:text-base">Resume</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={extractText}
                disabled={extracting}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
              >
                {extracting ? 'Extracting…' : 'Extract Text'}
              </button>
              <button
                onClick={openResume}
                disabled={opening}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
              >
                <ExternalLink className="w-4 h-4" />
                {opening ? 'Opening…' : 'View'}
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-700">
            {proj?.resume_path
              ? <>Stored privately as <code className="bg-gray-100 px-1 rounded">{proj.resume_path}</code></>
              : (proj?.resume_url ? 'Public URL stored.' : 'No resume uploaded.')}
          </div>
        </div>

        {/* JD editor */}
        <div className="rounded-xl border border-gray-300 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm sm:text-base">Job Description</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={syncJDDraft}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                title="Sync from DB"
              >
                Sync
              </button>
              <button
                onClick={saveJD}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                title="Save JD"
              >
                Save
              </button>
            </div>
          </div>
          <textarea
            value={jdDraft}
            onChange={(e) => setJdDraft(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste the job description here..."
          />
        </div>
      </div>

      {/* Intentionally no Present/Missing/Suggestions/ATS sections here */}
    </div>
  );
}
