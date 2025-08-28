// src/app/projects/components/AnalyzePanel.jsx
'use client';

import { useState } from 'react';
import { Rocket, Loader2, ExternalLink, RefreshCcw } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import ExportReportButton from '../../export/ExportReportButton';
import { useFreshProject } from '../hooks/useFreshProject';
import ScoreRing from '../../../components/ScoreRing';

export default function AnalyzePanel({ project, onProjectChange }) {
  const { proj, setProj, refresh, lastError } = useFreshProject(project);

  const [opening, setOpening] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [running, setRunning] = useState(false);
  const [jdDraft, setJdDraft] = useState(project?.jd_text || '');

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
      if (!text) { toast.error('Could not extract text from file.'); return; }

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
      if (!resumeText || !jdText) { toast.error('Add resume text and job description first.'); return; }

      // Save JD if changed
      if (proj?.id && jdDraft && jdDraft.trim() !== (proj?.jd_text || '').trim()) {
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
        body: JSON.stringify({ resumeText, jdText, mode: 'comprehensive' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Analyze failed');

      const { error, data: updated } = await supabase
        .from('projects')
        .update({
          latest_score: data.score,  // stable, deterministic
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

  const scoreRaw = proj?.latest_score ?? proj?.analysis?.score ?? null;
  const score = Number.isFinite(Number(scoreRaw))
    ? Math.max(0, Math.min(100, Math.round(Number(scoreRaw))))
    : null;

  return (
    <div className="space-y-6 text-black">
      <Toaster position="top-center" />

      {/* Status + debug row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs hover:bg-gray-100"
          title="Force refresh"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Refresh
        </button>

        <span className={`text-xs px-2 py-1 rounded border ${proj?.resume_text?.trim() ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          Resume text: {proj?.resume_text?.trim() ? `OK (${(proj?.resume_text || '').length} chars)` : 'Missing'}
        </span>
        <span className={`text-xs px-2 py-1 rounded border ${proj?.jd_text?.trim() ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          JD text: {proj?.jd_text?.trim() ? `OK (${(proj?.jd_text || '').length} chars)` : 'Missing'}
        </span>

        {Number.isFinite(score) && (
          <span className="ml-auto">
            <ScoreRing value={score} size={56} label="Match score" />
          </span>
        )}

        {lastError && (
          <span className="text-xs px-2 py-1 rounded border border-red-300 bg-red-50 text-red-800">
            Supabase read error: {lastError.message || 'RLS/Policy blocked'}
          </span>
        )}
      </div>

      {/* Resume + JD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resume card */}
        <div className="rounded-xl border border-gray-300 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Resume</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={extractText}
                disabled={extracting}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
              >
                {extracting ? 'Extracting…' : 'Extract Text'}
              </button>
              <button
                onClick={openResume}
                disabled={opening}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
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
            <h3 className="font-semibold">Job Description</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={syncJDDraft}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                title="Sync from DB"
              >
                Sync
              </button>
              <button
                onClick={saveJD}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                title="Save JD"
              >
                Save
              </button>
            </div>
          </div>

          <textarea
            value={jdDraft}
            onChange={(e) => setJdDraft(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste the job description here..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={runAI}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-4 py-2 font-medium hover:bg-black/90 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {running ? 'Analyzing…' : 'Run / Regenerate Suggestions'}
        </button>

        <ExportReportButton project={proj} result={proj?.analysis || null} />
      </div>

      {/* Results */}
      {proj?.analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-300 bg-white p-4">
            <h4 className="font-semibold">Present Keywords</h4>
            <ul className="mt-2 text-sm list-disc ml-5 space-y-1 max-h-64 overflow-auto pr-2">
              {(proj.analysis.present || []).map((k) => <li key={k}>{k}</li>)}
            </ul>
          </div>

          <div className="rounded-xl border border-gray-300 bg-white p-4">
            <h4 className="font-semibold">Missing Keywords</h4>
            <ul className="mt-2 text-sm list-disc ml-5 space-y-1 max-h-64 overflow-auto pr-2">
              {(proj.analysis.missing || []).map((k) => <li key={k}>{k}</li>)}
            </ul>
          </div>

          <div className="rounded-xl border border-gray-300 bg-white p-4">
            <h4 className="font-semibold">Suggestions</h4>
            <ul className="mt-2 text-sm list-disc ml-5 space-y-1 max-h-64 overflow-auto pr-2">
              {(proj.analysis.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
