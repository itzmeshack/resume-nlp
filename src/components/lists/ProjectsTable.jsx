'use client';

import { Trash2, ExternalLink } from 'lucide-react';

function StatusChip({ status }) {
  const map = {
    Improved: 'bg-green-100 text-green-700',
    Analyzed: 'bg-blue-100 text-blue-700',
    Draft: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ProjectsTable({ items = [], onOpen = () => {}, onDelete = () => {} }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-6 text-center">
        <p className="text-gray-600">No projects yet. Click <span className="font-medium">New Project</span> to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-2 sm:p-4">
      {/* Table (md+) */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-3 py-2">Project</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Match</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/50">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-white/60">
                <td className="px-3 py-3 font-medium truncate">{p.name}</td>
                <td className="px-3 py-3"><StatusChip status={p.status} /></td>
                <td className="px-3 py-3 font-semibold">{p.score}%</td>
                <td className="px-3 py-3 text-gray-500">{timeAgo(p.updatedAt)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="px-3 py-1 rounded-md border hover:bg-gray-50 flex items-center gap-1"
                      onClick={() => onOpen(p.id)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </button>
                    <button
                      className="px-3 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
                      onClick={() => onDelete(p.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-gray-500 mt-1">Updated {timeAgo(p.updatedAt)}</div>
              </div>
              <StatusChip status={p.status} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">Match:</span>{' '}
                <span className="font-semibold">{p.score}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50"
                  onClick={() => onOpen(p.id)}
                >
                  Open
                </button>
                <button
                  className="px-3 py-1 rounded-md border border-red-200 text-red-600 text-sm hover:bg-red-50"
                  onClick={() => onDelete(p.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
