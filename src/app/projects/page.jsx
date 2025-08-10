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
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/signin');
        return;
      }
      const { data: rows, error } = await supabase
        .from('projects')
        .select('id,name,latest_score,status,updated_at')
        .order('updated_at', { ascending: false });

      if (!mounted) return;
      if (error) {
        toast.error(error.message);
        setItems([]);
      } else {
        // map to UI shape
        setItems(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            score: r.latest_score ?? 0,
            status: r.status ?? 'Draft',
            updatedAt: r.updated_at,
          }))
        );
      }
      setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, [router]);

  const onNewProject = () => router.push('/projects/new');

  const onDelete = async (id) => {
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== id)); // optimistic
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      setItems(prev);
    } else {
      toast.success('Project deleted');
    }
  };

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

  return (
    <AppShell>
      <Toaster position="top-center" />
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          <p className="text-gray-500">Your AI resume projects</p>
        </div>
        <button
          onClick={onNewProject}
          className="self-start sm:self-auto rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700"
        >
          New Project
        </button>
      </div>

      <ProjectsTable
        items={items}
        onDelete={onDelete}
        onOpen={(id) => router.push(`/projects/${id}`)}
      />
    </AppShell>
  );
}
