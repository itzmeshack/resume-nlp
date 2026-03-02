'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function RecentProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: rows, error } = await supabase
        .from('projects')
        .select('id, name, latest_score, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (!mounted) return;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setProjects(rows || []);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-5">
        <div className="animate-pulse h-24 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-5">
      <h3 className="font-semibold mb-4">Recent Projects</h3>

      {projects.length === 0 && (
        <div className="text-sm text-gray-400">
          No projects yet.
        </div>
      )}

      <div className="space-y-3">
        {projects.map(project => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-800 truncate">
                {project.name || 'Untitled'}
              </p>
              <p className="text-xs text-gray-400">
                Updated {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </div>

            <div
              className={`text-sm font-semibold ${
                project.latest_score >= 80
                  ? 'text-green-600'
                  : project.latest_score >= 60
                  ? 'text-yellow-600'
                  : 'text-red-500'
              }`}
            >
              {project.latest_score ?? 0}%
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
