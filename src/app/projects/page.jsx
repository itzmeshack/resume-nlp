'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import AppShell from '../../components/app/AppShell';
import ProjectsTable from '../../components/lists/ProjectsTable';
import { Toaster, toast } from 'react-hot-toast';

export default function ProjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // mock data for now — replace with Supabase later
  const [projects, setProjects] = useState([
    { id: 'p1', name: 'Frontend Engineer @ Stripe', score: 82, status: 'Improved', updatedAt: '2025-08-01T11:00:00Z' },
    { id: 'p2', name: 'Data Analyst @ Spotify',    score: 76, status: 'Analyzed', updatedAt: '2025-08-03T09:00:00Z' },
    { id: 'p3', name: 'ML Engineer @ OpenAI',       score: 88, status: 'Improved', updatedAt: '2025-08-06T13:30:00Z' },
  ]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        router.replace('/signin');
        return;
      }
      setSession(data.session);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-200" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const onNewProject = () => router.push('/projects/new');

  const onDelete = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast.success('Project deleted');
  };

  return (
    <AppShell>
      <Toaster position="top-center" />
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          <p className="text-gray-500 truncate">
            {session?.user?.email}
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="self-start sm:self-auto rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
        >
          New Project
        </button>
      </div>

      <ProjectsTable
        items={projects}
        onDelete={onDelete}
        onOpen={(id) => router.push(`/projects/${id}`)}
      />
    </AppShell>
  );
}
