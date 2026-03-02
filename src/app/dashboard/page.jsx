'use client';

import { useEffect, useState } from 'react';
import RecentProjects from './RecentProjects';

import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import AppShell from '../../components/app/AppShell';
import StatCard from '../../components/cards/StatCard';

import ScoreTrendChart from '../../app/reports/ScoreTrendChart';
import { BarChart3, FileText, Sparkles, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [atsIssues, setAtsIssues] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!data.session) {
          router.replace('/signin');
          return;
        }

        const userId = data.session.user.id;
        setSession(data.session);

        // ✅ FIXED: using /api/reports
        const [summaryRes, trendRes, atsRes] = await Promise.all([
          fetch(`/api/reports/summary?userId=${userId}`),
          fetch(`/api/reports/trend?userId=${userId}`),
          fetch(`/api/reports/ats?userId=${userId}`)
        ]);

        if (!summaryRes.ok || !trendRes.ok || !atsRes.ok) {
          throw new Error('API request failed');
        }

        const summaryData = await summaryRes.json();
        const trendData = await trendRes.json();
        const atsData = await atsRes.json();

        if (!mounted) return;

        setSummary(summaryData);
        setTrend(Array.isArray(trendData) ? trendData : []);
        setAtsIssues(Array.isArray(atsData) ? atsData : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard analytics.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 ">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 ">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-200" />
            ))}
          </div>
          <div className="mt-10 h-64 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back 👋</h1>
          <p className="text-gray-500 truncate">{session?.user?.email}</p>
        </div>

        <a href="/projects/new">
          <button className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700">
            New Project
          </button>
        </a>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Total Projects"
          value={summary?.total ?? 0}
          valueClassName="text-blue-500"
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Avg. Match Score"
          value={`${summary?.avgAfter ?? 0}%`}
          valueClassName="text-green-500"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          label="Suggestions Applied"
          value={summary?.suggestionsTotal ?? 0}
          valueClassName="text-yellow-500"
        />
        <StatCard
          icon={<ShieldCheck className="w-5 h-5" />}
          label="ATS Pass Rate"
          value={`${summary?.atsPassRate ?? 0}%`}
          valueClassName="text-purple-500"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <RecentProjects />
        </div>

        {/* Score Trend Card */}
        <div className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-5">
          <h3 className="font-semibold mb-3">Score Trend</h3>
          <p className="text-sm text-gray-600 mb-4">
            Resume optimization performance over time.
          </p>

          <ScoreTrendChart trend={trend} />

          <div className="mt-6">
            <h4 className="font-semibold mb-2">Top ATS Issues</h4>

            {atsIssues.length === 0 && (
              <div className="text-sm text-gray-400">
                No ATS issues detected.
              </div>
            )}

            <div className="space-y-1">
              {atsIssues.slice(0, 5).map((issue) => (
                <div
                  key={issue.issue}
                  className="flex justify-between text-sm text-gray-600"
                >
                  <span className="truncate max-w-[70%]">
                    {issue.issue}
                  </span>
                  <span className="font-medium text-red-500">
                    {issue.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-500">
              {error}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
