// src/components/project/panels/VersionsPanel.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { X, Loader2, RefreshCcw } from 'lucide-react';

/**
 * OPTIONAL DB schema (run once in Supabase SQL editor)
 *
 * create table if not exists public.project_versions (
 *   id uuid primary key default gen_random_uuid(),
 *   project_id uuid not null references public.projects(id) on delete cascade,
 *   label text not null,
 *   snapshot jsonb not null, -- { resume_text?, jd_text?, analysis?, latest_score?, status? }
 *   created_at timestamptz default now()
 * );
 * create index if not exists idx_project_versions_pid on public.project_versions(project_id);
 * alter table public.project_versions enable row level security;
 * create policy "select own versions" on public.project_versions
 *   for select using (exists(select 1 from public.projects p where p.id=project_id and p.user_id=auth.uid()));
 * create policy "insert own versions" on public.project_versions
 *   for insert with check (exists(select 1 from public.projects p where p.id=project_id and p.user_id=auth.uid()));
 * create policy "delete own versions" on public.project_versions
 *   for delete using (exists(select 1 from public.projects p where p.id=project_id and p.user_id=auth.uid()));
 */

/** Fallback demo data if DB is empty / projectId missing */
const fallbackVersions = [
  {
    id: 'v3',
    label: 'v3 • Added metrics to bullets',
    created_at: new Date().toISOString(),
    snapshot: {
      resume_text: '• Improved on-time delivery to 98%...\n• Reduced rework by 12%...',
      jd_text: 'Looking for someone with logistics and SLA ownership...',
      analysis: { score: 81, suggestions: ['Add SLA ownership detail', 'Mention tool used for routing'] },
      latest_score: 81,
      status: 'Analyzed',
    },
  },
  {
    id: 'v2',
    label: 'v2 • Improved summary',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    snapshot: {
      resume_text: 'Summary: Customer-focused ops specialist...\n• Coordinated cross-team launches...',
      jd_text: 'Customer ops role with escalations and reporting...',
      analysis: { score: 74, suggestions: ['Quantify escalations handled per month'] },
      latest_score: 74,
      status: 'Analyzed',
    },
  },
  {
    id: 'v1',
    label: 'v1 • Initial upload',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    snapshot: {
      resume_text: 'Initial paste of resume text...',
      jd_text: 'Initial JD text...',
      analysis: { score: 62, suggestions: ['Add tooling keywords'] },
      latest_score: 62,
      status: 'Draft',
    },
  },
];

/**
 * Props:
 * - projectId?: string  (when provided, versions are fetched from DB)
 */
export default function VersionsPanel({ projectId }) {
  const [versions, setVersions] = useState(fallbackVersions);
  const [loading, setLoading] = useState(!!projectId);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const hasProject = !!projectId;

  const loadFromDB = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_versions')
        .select('id, label, snapshot, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data ?? []);
    } catch (e) {
      console.warn('[VersionsPanel] Could not load versions from DB:', e?.message || e);
      if (!versions?.length) setVersions(fallbackVersions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return iso?.slice(0, 10) || '';
    }
  };

  const refreshList = async () => {
    if (!projectId) return;
    try {
      setRefreshing(true);
      await loadFromDB();
    } finally {
      setRefreshing(false);
    }
  };

  const emptyState = useMemo(() => {
    if (loading) return null;
    if (!versions?.length) {
      return hasProject
        ? 'No saved versions yet. You can add a snapshot from your UI when you save analysis.'
        : 'Pass a projectId to fetch versions from your database.';
    }
    return null;
  }, [loading, versions?.length, hasProject]);

  return (
    <>
      <div className="rounded-xl border border-gray-300 bg-white p-4 text-black">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold mb-1 text-black">Version history</h3>
            <p className="text-sm text-gray-700">
              A timeline of snapshots for your <strong>resume</strong>, <strong>job description</strong>, and <strong>analysis</strong>.
              Use <em>View</em> to preview the snapshot contents. (Restore has been disabled.)
            </p>
          </div>

          {hasProject && (
            <button
              onClick={refreshList}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
              title="Refresh versions"
            >
              <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading versions…
          </div>
        ) : emptyState ? (
          <div className="mt-4 text-sm text-gray-700">{emptyState}</div>
        ) : (
          <ol className="relative border-l border-gray-300 ml-2 mt-4">
            {versions.map((v) => (
              <li key={v.id} className="mb-6 ml-4">
                {/* timeline dot */}
                <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-black border-2 border-white" />

                <time className="mb-1 block text-xs text-gray-600">{fmtDate(v.created_at)}</time>
                <h4 className="text-sm font-medium text-black">{v.label}</h4>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setSelected(v)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-black hover:bg-black hover:text-white transition"
                    title="Preview this version"
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-gray-300 bg-white text-black shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <div className="text-sm text-gray-600">
                  {selected.created_at ? new Date(selected.created_at).toLocaleString() : ''}
                </div>
                <div className="font-semibold">{selected.label}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-gray-300 p-1 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              <section>
                <h5 className="text-sm font-semibold mb-1">Resume text</h5>
                {selected?.snapshot?.resume_text ? (
                  <pre className="whitespace-pre-wrap text-sm leading-6 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {selected.snapshot.resume_text}
                  </pre>
                ) : (
                  <div className="text-sm text-gray-600">No resume text in this snapshot.</div>
                )}
              </section>

              {selected?.snapshot?.jd_text ? (
                <section>
                  <h5 className="text-sm font-semibold mb-1">Job description</h5>
                  <pre className="whitespace-pre-wrap text-sm leading-6 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {selected.snapshot.jd_text}
                  </pre>
                </section>
              ) : null}

              {selected?.snapshot?.analysis ? (
                <section>
                  <h5 className="text-sm font-semibold mb-1">Analysis (summary)</h5>
                  <div className="text-sm text-gray-800">
                    Score:{' '}
                    <strong>
                      {selected.snapshot.latest_score ?? selected.snapshot.analysis.score ?? '-'}
                    </strong>
                    {selected.snapshot.analysis?.suggestions?.length ? (
                      <div className="mt-2">
                        <div className="text-gray-600 mb-1">Top suggestions:</div>
                        <ul className="list-disc ml-5 space-y-1">
                          {selected.snapshot.analysis.suggestions.slice(0, 5).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
