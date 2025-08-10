'use client';

const checks = [
  { id: 'c1', label: 'Single-column layout', ok: false, hint: 'Avoid multi-column layouts for ATS parsing.' },
  { id: 'c2', label: 'No images or icons in headers', ok: false, hint: 'Remove header images & decorative icons.' },
  { id: 'c3', label: 'Standard section headings', ok: true,  hint: 'Headings like Experience, Education, Skills.' },
  { id: 'c4', label: 'File type is PDF or DOCX', ok: true,  hint: 'Prefer PDF (text-based) or DOCX.' },
  { id: 'c5', label: 'Links are minimal and valid', ok: true,  hint: 'Include only important links (GitHub, LinkedIn).' },
];

export default function ATSChecklist() {
  return (
    <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
      <h3 className="font-semibold mb-2">ATS Compatibility</h3>
      <ul className="divide-y divide-white/60">
        {checks.map((c) => (
          <li key={c.id} className="py-3 flex items-start gap-3">
            <div className={`mt-0.5 w-2.5 h-2.5 rounded-full ${c.ok ? 'bg-green-500' : 'bg-red-500'}`} />
            <div>
              <div className="text-sm font-medium">{c.label}</div>
              {!c.ok && <div className="text-xs text-gray-600 mt-1">{c.hint}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
