'use client';

import { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

export default function AnalyzePanel({ project, onProjectChange }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const startAnalysis = async () => {
    setRunning(true);
    setResult(null);
    toast('Analysis started…', { icon: '🧠' });

    // Simulate an async job
    setTimeout(async () => {
      const fakeScore = Math.floor(65 + Math.random() * 30);
      const fake = {
        score: fakeScore,
        keywordsFound: ['React', 'TypeScript', 'REST', 'Unit Testing'],
        gaps: ['GraphQL', 'CI/CD'],
        atsIssues: ['Header image detected', 'Over 2 columns in layout'],
      };
      setResult(fake);

      // 🔒 Persist score + status
      const { error } = await supabase
        .from('projects')
        .update({ latest_score: fakeScore, status: 'Analyzed' })
        .eq('id', project.id);

      if (error) {
        toast.error(error.message);
      } else {
        onProjectChange?.({
          ...project,
          status: 'Analyzed',
          latest_score: fakeScore,
          updated_at: new Date().toISOString(),
        });
        toast.success('Analysis complete');
      }

      setRunning(false);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      {/* Resume vs JD preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
          <h3 className="font-semibold mb-2">Resume (snippet)</h3>
          <div className="text-sm text-gray-600">
            {project.resume_url ? (
              <>File uploaded: <a className="text-blue-600 underline" href={project.resume_url} target="_blank" rel="noreferrer">View</a></>
            ) : (
              <>No resume file URL saved.</>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
          <h3 className="font-semibold mb-2">Job Description</h3>
          <div className="text-sm text-gray-600 whitespace-pre-wrap">
            {project.jd_text?.slice(0, 600) || 'No job description text saved.'}
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={startAnalysis}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {running ? 'Analyzing…' : 'Run Analysis'}
        </button>
        {project.latest_score != null && (
          <span className="text-sm text-gray-600">
            Latest score: <span className="font-semibold">{project.latest_score}%</span>
          </span>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
            <div className="text-sm text-gray-500">Match Score</div>
            <div className="text-3xl font-extrabold mt-1">{result.score}%</div>
          </div>
          <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
            <div className="text-sm font-semibold">Keywords Found</div>
            <ul className="mt-2 text-sm text-gray-700 list-disc ml-5 space-y-1">
              {result.keywordsFound.map((k) => <li key={k}>{k}</li>)}
            </ul>
          </div>
          <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
            <div className="text-sm font-semibold">Gaps</div>
            <ul className="mt-2 text-sm text-gray-700 list-disc ml-5 space-y-1">
              {result.gaps.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
