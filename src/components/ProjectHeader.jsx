'use client';

import Link from 'next/link';

export default function ProjectHeader({ project }) {
  const name = project?.name || 'Untitled';
  const jd = (project?.jd_text || '').replace(/\s+/g, ' ').trim();
  const jdSnippet = jd.length > 60 ? jd.slice(0, 60) + '…' : jd;

  return (
    <header className="mb-4">
      {/* Row: Back button + compact title (title truncates, back never shrinks) */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/projects"
          className="shrink-0 inline-flex items-center rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs sm:text-sm hover:bg-gray-100"
        >
          ← Back to Projects
        </Link>

        {/* Title is smaller and forced to single line with ellipsis */}
        <h1
          className="
            flex-1 min-w-0
            text-[13px] sm:text-[14px] md:text-[16px]
            font-semibold text-gray-900
            overflow-hidden text-ellipsis whitespace-nowrap
          "
          title={`${name} ↔ ${jdSnippet}`}
        >
          {name} <span className="text-gray-400">↔</span> {jdSnippet}
        </h1>
      </div>

      {/* Meta line under it, still compact */}
      <div className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-500">
        Project ID: {project?.id || '—'} • Status: {project?.status || 'Draft'}
      </div>
    </header>
  );
}
