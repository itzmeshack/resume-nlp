// src/app/ai-tools/components/ATSQuickLinter.jsx
'use client';

import { useMemo, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

/* Lightweight ATS rules (client) */
function atsChecks(text='') {
  const words = (text.match(/\S+/g) || []).length;
  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const hasPhone = /\+?\d[\d\s().-]{7,}\d/.test(text);
  const hasBullets = /(^|\n)\s*([•\-*]\s+)/.test(text);
  const hasSections = /(experience|education|skills|projects|summary|objective|profile)/i.test(text);
  const longLine = text.split('\n').some(l => l.length > 140);
  const capsRatio = (() => {
    const tokens = (text.match(/\S+/g) || []);
    const caps = tokens.filter(w => w.length >= 3 && w === w.toUpperCase()).length;
    return Math.round((caps / Math.max(tokens.length, 1)) * 100);
  })();

  const out = [];
  out.push(hasEmail ? { status:'pass', text:'Contact email detected', tip:'Good.' }
                    : { status:'fail', text:'No email detected', tip:'Add a professional email in the header.' });
  out.push(hasPhone ? { status:'pass', text:'Phone number detected', tip:'Good.' }
                    : { status:'warn', text:'No phone number detected', tip:'Add a reachable phone number.' });
  out.push(words < 250 ? { status:'warn', text:`Short resume (${words} words)`, tip:'Add impact bullets with real metrics.' }
                       : words > 1200 ? { status:'warn', text:`Long resume (${words} words)`, tip:'Trim to the most relevant content.' }
                                      : { status:'pass', text:`Word count looks good (${words})`, tip:'Nice balance.' });
  out.push(hasSections ? { status:'pass', text:'Standard section headings present', tip:'Experience, Education, Skills…' }
                       : { status:'warn', text:'Key section headings missing', tip:'Add standard headings for ATS.' });
  out.push(hasBullets ? { status:'pass', text:'Bullet points detected', tip:'Good readability.' }
                      : { status:'warn', text:'No bullet points', tip:'Use concise bullets for achievements.' });
  out.push(capsRatio > 15 ? { status:'warn', text:`High ALL-CAPS ratio (${capsRatio}%)`, tip:'Prefer bold over ALL CAPS.' }
                          : { status:'pass', text:'Balanced text case', tip:'Good.' });
  out.push(longLine ? { status:'warn', text:'Very long lines detected', tip:'Avoid multi-column PDFs that copy as one long line.' }
                    : { status:'pass', text:'Line lengths look normal', tip:'Good for ATS.' });
  return out;
}

export default function ATSQuickLinter() {
  const [resume, setResume] = useState('');
  const checks = useMemo(() => atsChecks(resume), [resume]);

  const Badge = ({ status }) => {
    if (status === 'pass') return <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle className="w-4 h-4" /> PASS</span>;
    if (status === 'warn') return <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle className="w-4 h-4" /> WARN</span>;
    return <span className="inline-flex items-center gap-1 text-red-700"><XCircle className="w-4 h-4" /> FAIL</span>;
  };

  return (
    <div className="space-y-6 text-black">
      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <h3 className="font-semibold mb-2 text-sm sm:text-base">What is ATS?</h3>
        <p className="text-sm text-gray-700">
          Applicant Tracking Systems (ATS) scan your resume for structure, keywords, and readability.
          This quick linter checks common pitfalls (sections, bullets, word count, odd formatting)
          so your resume is easy for software—and recruiters—to parse.
        </p>
      </div>

      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <h4 className="font-semibold mb-2 text-sm sm:text-base">Paste resume text</h4>
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          className="w-full border border-gray-300 rounded p-2 text-sm min-h-[180px] focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Paste your resume plain text here…"
        />
      </div>

      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <h4 className="font-semibold mb-3 text-sm sm:text-base">ATS Readiness Checklist</h4>
        <div className="divide-y divide-gray-200">
          {checks.map((c, idx) => (
            <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="font-medium">{c.text}</div>
                <div className="text-sm text-gray-600">{c.tip}</div>
              </div>
              <div className="shrink-0">
                <Badge status={c.status} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Heuristics only—always export as a text-based PDF/DOCX; avoid images/scans.
        </div>
      </div>
    </div>
  );
}
