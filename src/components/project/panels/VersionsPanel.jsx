'use client';

const versions = [
  { id: 'v3', label: 'v3 • Added metrics to bullets', date: 'Aug 6' },
  { id: 'v2', label: 'v2 • Improved summary', date: 'Aug 5' },
  { id: 'v1', label: 'v1 • Initial upload', date: 'Aug 4' },
];

export default function VersionsPanel() {
  return (
    <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
      <h3 className="font-semibold mb-4">Version history</h3>
      <ol className="relative border-l border-white/60 ml-2">
        {versions.map((v) => (
          <li key={v.id} className="mb-6 ml-4">
            <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-1.5 border-2 border-white" />
            <time className="mb-1 text-xs text-gray-500">{v.date}</time>
            <h4 className="text-sm font-medium">{v.label}</h4>
            <div className="mt-2 flex items-center gap-2">
              <button className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50">View</button>
              <button className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50">Restore</button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
