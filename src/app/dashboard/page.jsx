'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import AppShell from '../../components/app/AppShell';
import StatCard from '../../components/cards/StatCard';
import RecentProjects from '../../components/lists/RecentProjects';
import {
  BarChart3,
  FileText,
  Sparkles,
  Download,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        router.replace('/signin');
        return;
      }
      setSession(data.session);
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto px-6 pt-28">
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
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back 👋</h1>
          <p className="text-gray-500">
            {session?.user?.email}
          </p>
        </div>
        <a href="/projects/new">
          <button className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700">
            New Project
          </button>
        </a>
      </div>

      {/* Stat cards */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <StatCard
    icon={<FileText className="w-5 h-5" />}
    label="Total Projects"
    value="12"
    valueClassName="text-blue-500"
  />
  <StatCard
    icon={<BarChart3 className="w-5 h-5" />}
    label="Avg. Match Score"
    value="78%"
    valueClassName="text-green-500"
  />
  <StatCard
    icon={<Sparkles className="w-5 h-5" />}
    label="Suggestions Applied"
    value="214"
    valueClassName="text-yellow-500"
  />
  <StatCard
    icon={<Download className="w-5 h-5" />}
    label="Exports"
    value="36"
    valueClassName="text-purple-500"
  />
</div>




      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent projects */}
        <div className="lg:col-span-2">
          <RecentProjects />
        </div>

        {/* Placeholder chart / insights card */}
        <div className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-5">
          <h3 className="font-semibold mb-3">Weekly Progress</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your average match score is trending up this week.
          </p>
          <div className="h-48 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-white/50" />
          <div className="mt-4 text-xs text-gray-400">
            * Charts are placeholders — we’ll wire data later.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
