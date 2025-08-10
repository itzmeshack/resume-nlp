'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const initial = [
  {
    id: 's1',
    section: 'Summary',
    original: 'Experienced frontend developer with experience in React.',
    suggested:
      'Frontend engineer with 5+ years building accessible, high-performing React apps; improved LCP by 35% and led component library adoption.',
  },
  {
    id: 's2',
    section: 'Experience',
    original: 'Worked on dashboards and fixed bugs.',
    suggested:
      'Built data dashboards (Next.js + Recharts) used by 2k+ users; reduced bug backlog by 40% through test-driven fixes and CI.',
  },
  {
    id: 's3',
    section: 'Skills',
    original: 'React, JS, HTML, CSS',
    suggested:
      'React, TypeScript, Next.js, Tailwind, Jest, Playwright, REST, CI/CD',
  },
];

export default function SuggestionsPanel() {
  const [items, setItems] = useState(initial);

  const accept = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success('Suggestion applied');
  };
  const reject = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast('Suggestion dismissed', { icon: '🗑️' });
  };

  return (
    <div className="space-y-4">
      <Toaster position="top-center" />
      {items.length === 0 ? (
        <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-6 text-center text-gray-600">
          All caught up — no pending suggestions.
        </div>
      ) : (
        items.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4"
          >
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{s.section}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Original</div>
                <p className="text-sm text-gray-700">{s.original}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Suggested</div>
                <p className="text-sm text-gray-900">{s.suggested}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => accept(s.id)}
                className="inline-flex items-center gap-1 rounded-lg bg-green-600 text-white px-3 py-1.5 text-sm hover:bg-green-700"
              >
                <Check className="w-4 h-4" /> Accept
              </button>
              <button
                onClick={() => reject(s.id)}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
