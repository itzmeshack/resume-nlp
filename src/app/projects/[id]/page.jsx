'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

  const jdSnippet = useMemo(() => {
    const jd = (project?.jd_text || '').replace(/\s+/g, ' ').trim();
    return jd ? (jd.length > 60 ? jd.slice(0, 60) + '…' : jd) : '';
  }, [project?.jd_text]);

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

      {/* Compact header with white text */}
      <header className="mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/projects"
            className="shrink-0 inline-flex items-center rounded-lg border border-white/30 px-2.5 py-1.5 text-xs sm:text-sm text-white hover:bg-white/10"
          >
            ← Back to Projects
          </Link>

          <h1
            className="
              flex-1 min-w-0
              text-[13px] sm:text-[14px] md:text-[16px]
              font-semibold text-white
              overflow-hidden text-ellipsis whitespace-nowrap
            "
            title={`${project?.name || 'Untitled'}${jdSnippet ? ` ↔ ${jdSnippet}` : ''}`}
          >
            {project?.name || 'Untitled'}
            {jdSnippet ? <span className="text-white/60"> ↔ </span> : null}
            <span className="text-white/90">{jdSnippet}</span>
          </h1>
        </div>

        <div className="mt-1 text-[11px] sm:text-xs md:text-sm text-white/70">
          Project ID: {project?.id} • Status:{' '}
          <span className="font-medium text-white">{project?.status || 'Draft'}</span>
        </div>
      </header>

      <ProjectTabs
        project={project}
        onProjectChange={(p) => setProject(p)}
      />
    </AppShell>
  );
}
