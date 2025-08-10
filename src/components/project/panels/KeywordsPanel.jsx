'use client';

export default function KeywordsPanel() {
  const mustHave = ['React', 'TypeScript', 'Testing', 'CI/CD', 'Accessibility'];
  const present = ['React', 'Testing', 'Accessibility'];
  const missing = mustHave.filter((k) => !present.includes(k));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
        <div className="text-sm font-semibold">Required Keywords</div>
        <ul className="mt-2 text-sm text-gray-700 list-disc ml-5 space-y-1">
          {mustHave.map((k) => <li key={k}>{k}</li>)}
        </ul>
      </div>
      <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
        <div className="text-sm font-semibold">Present</div>
        <ul className="mt-2 text-sm text-gray-700 list-disc ml-5 space-y-1">
          {present.map((k) => <li key={k}>{k}</li>)}
        </ul>
      </div>
      <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
        <div className="text-sm font-semibold">Missing</div>
        <ul className="mt-2 text-sm text-gray-700 list-disc ml-5 space-y-1">
          {missing.map((k) => <li key={k}>{k}</li>)}
        </ul>
      </div>
    </div>
  );
}
