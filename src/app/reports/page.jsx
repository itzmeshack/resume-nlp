'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AppShell from '../../components/app/AppShell';
import { Toaster, toast } from 'react-hot-toast';
import { BarChart3, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';

function KPI({ icon, label, value, hint, colorClass = 'text-blue-600' }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-gray-800">
        <div className={`p-2 rounded-lg bg-gray-100 ${colorClass}`}>{icon}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // filters (no role here to avoid the missing column)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [projectId, setProjectId] = useState('');

  // data
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topATS, setTopATS] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) {
        // if you gate the page, redirect to signin
        // router.replace('/signin');
        toast.error('You are not signed in.');
        setLoading(false);
        return;
      }
      if (!mounted) return;
      setSession(sess.session);

      // preload projects list for the project dropdown
      const { data: projList, error } = await supabase
        .from('projects')
        .select('id,name,created_at')
        .eq('user_id', sess.session.user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) toast.error(error.message);
      setProjects(projList || []);

      await refreshReports(sess.session.user.id);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshReports(userId) {
    try {
      const qs = new URLSearchParams({
        userId,
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        ...(projectId ? { projectId } : {}),
      }).toString();

      const [sRes, tRes, aRes] = await Promise.all([
        fetch(`/api/reports/summary?${qs}`),
        fetch(`/api/reports/trend?${qs}`),
        fetch(`/api/reports/ats?${qs}`),
      ]);

      const [sJson, tJson, aJson] = await Promise.all([sRes.json(), tRes.json(), aRes.json()]);
      if (!sRes.ok) throw new Error(sJson?.error || 'Summary failed');
      if (!tRes.ok) throw new Error(tJson?.error || 'Trend failed');
      if (!aRes.ok) throw new Error(aJson?.error || 'ATS failed');

      setSummary(sJson);
      setTrend(Array.isArray(tJson) ? tJson : []);
      setTopATS(Array.isArray(aJson) ? aJson : []);
    } catch (e) {
      toast.error(e.message);
    }
  }

  const worst = useMemo(() => {
    // Fetch a light list to show "lowest scores" table (without role)
    // We’ll reuse the projects already fetched and filtered by dropdown/date in API
    // Here, just fetch local minimal again when summary changes.
    return [];
  }, [summary]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-100 border border-gray-200" />
            ))}
          </div>
          <div className="mt-10 h-64 rounded-2xl bg-gray-100 border border-gray-200 animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <Toaster />
      <main className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Reports</h1>
              <p className="text-gray-600">High-contrast view with real backend metrics.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => session && refreshReports(session.user.id)}
                className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                placeholder="To"
              />
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value="">All projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.id}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setProjectId('');
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                Clear
              </button>
              <button
                onClick={() => session && refreshReports(session.user.id)}
                className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm"
              >
                Apply
              </button>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPI
              icon={<BarChart3 className="w-5 h-5" />}
              label="Avg. Tailored Score"
              value={`${summary?.avgAfter ?? 0}%`}
              hint={`Across ${summary?.total ?? 0} item(s)`}
              colorClass="text-blue-600"
            />
            <KPI
              icon={<TrendingUp className="w-5 h-5" />}
              label="Avg. Coverage Delta"
              value={`${summary?.avgDelta ?? 0} pts`}
              hint="After vs before"
              colorClass="text-green-600"
            />
            <KPI
              icon={<ShieldCheck className="w-5 h-5" />}
              label="ATS Pass Rate"
              value={`${summary?.atsPassRate ?? 0}%`}
              hint="No ATS fails"
              colorClass="text-emerald-600"
            />
            <KPI
              icon={<Sparkles className="w-5 h-5" />}
              label="Suggestions Applied"
              value={summary?.suggestionsTotal ?? 0}
              hint="Accepted AI rewrites"
              colorClass="text-yellow-600"
            />
          </div>

          {/* Charts + ATS issues */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold mb-2 text-gray-900">Score Trend</h3>
              <div className="h-64 rounded-xl bg-gray-50 border border-gray-200" />
              <div className="mt-2 text-xs text-gray-500">
                * Placeholder chart — hook a chart lib and use the `trend` array:
                <code className="ml-1">[{trend.slice(0, 3).map(d => d.date).join(', ')}...]</code>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold mb-3 text-gray-900">Top ATS Issues</h3>
              <ul className="space-y-2">
                {topATS.map((i, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-800">{i.issue}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-md text-gray-900 border border-gray-200">
                      {i.count}
                    </span>
                  </li>
                ))}
                {!topATS.length && <li className="text-sm text-gray-500">No data in range.</li>}
              </ul>
            </div>
          </div>

          {/* Optional: lowest scores table (hidden until you add a lightweight endpoint) */}
          {/* You can add a /api/reports/worst endpoint later and render here. */}
        </div>
      </main>
    </AppShell>
  );
}
