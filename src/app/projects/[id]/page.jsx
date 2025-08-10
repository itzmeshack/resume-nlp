'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import AppShell from '../../../components/app/AppShell';
import ProjectTabs from '../../../components/project/ProjectTabs';
import { Toaster, toast } from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/signin');
        return;
      }
      const { data: row, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (!mounted) return;

      if (error || !row) {
        toast.error(error?.message || 'Project not found');
        router.replace('/projects');
        return;
      }

      setProject(row);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
          <div className="animate-pulse h-14 w-64 rounded-xl bg-gray-200 mb-6" />
          <div className="animate-pulse h-80 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <Toaster position="top-center" />
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold truncate">{project.name}</h1>
          <p className="text-gray-500 text-sm">
            Project ID: {project.id} • Status: <span className="font-medium">{project.status}</span>
          </p>
        </div>
        <a href="/projects">
          <button className="rounded-xl border px-4 py-2 hover:bg-gray-50">Back to Projects</button>
        </a>
      </div>

      <ProjectTabs
        project={project}
        onProjectChange={(p) => setProject(p)}
      />
    </AppShell>
  );
}
