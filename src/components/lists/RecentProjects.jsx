'use client';

import Link from 'next/link';

const mock = [
  { id: 'p1', name: 'Frontend Engineer @ Stripe', score: 82, status: 'Improved', updated: '2h ago' },
  { id: 'p2', name: 'Data Analyst @ Spotify', score: 76, status: 'Analyzed', updated: '1d ago' },
  { id: 'p3', name: 'Product Manager @ Figma', score: 69, status: 'Draft', updated: '2d ago' },
  { id: 'p4', name: 'ML Engineer @ OpenAI', score: 88, status: 'Improved', updated: '3d ago' },
  { id: 'p5', name: 'Marketing Lead @ Duolingo', score: 73, status: 'Analyzed', updated: '4d ago' },
];

export default function RecentProjects() {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Recent Projects</h3>
        <Link href="/projects" className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      <div className="divide-y divide-white/40">
        {mock.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="flex items-center justify-between py-3 hover:bg-white/60 rounded-xl px-2 transition"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">Updated {p.updated}</div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  p.status === 'Improved'
                    ? 'bg-green-100 text-green-700'
                    : p.status === 'Analyzed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {p.status}
              </span>
              <span className="text-sm font-semibold">{p.score}%</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
