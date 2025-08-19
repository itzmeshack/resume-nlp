// src/components/project/panels/ATSChecklist.jsx
'use client';

import { useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, Copy } from 'lucide-react';
import { useFreshProject } from '../hooks/useFreshProject';
import { toast } from 'react-hot-toast';

/* -------- local fallback ATS in case analysis.ats is missing -------- */
function localAtsChecks(text = '') {
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

  out.push(
    hasEmail
      ? { status: 'pass', text: 'Contact email detected', tip: 'Good.' }
      : { status: 'fail', text: 'No email detected', tip: 'Add a professional email in the header.' }
  );

  out.push(
    hasPhone
      ? { status: 'pass', text: 'Phone number detected', tip: 'Good.' }
      : { status: 'warn', text: 'No phone number detected', tip: 'Add a reachable phone number.' }
  );

  out.push(
    words < 250
      ? { status: 'warn', text: `Short resume (${words} words)`, tip: 'Add a few impact bullets with real metrics.' }
      : words > 1200
      ? { status: 'warn', text: `Long resume (${words} words)`, tip: 'Trim to the most relevant content.' }
      : { status: 'pass', text: `Word count looks good (${words})`, tip: 'Nice balance.' }
  );

  out.push(
    hasSections
      ? { status: 'pass', text: 'Standard section headings present', tip: 'Experience, Education, Skills…' }
      : { status: 'warn', text: 'Key section headings missing', tip: 'Add standard headings for ATS.' }
  );

  out.push(
    hasBullets
      ? { status: 'pass', text: 'Bullet points detected', tip: 'Good readability.' }
      : { status: 'warn', text: 'No bullet points', tip: 'Use concise bullets for achievements.' }
  );

  out.push(
    capsRatio > 15
      ? { status: 'warn', text: `High ALL-CAPS ratio (${capsRatio}%)`, tip: 'Prefer bold over ALL CAPS.' }
      : { status: 'pass', text: 'Balanced text case', tip: 'Good.' }
  );

  out.push(
    longLine
      ? { status: 'warn', text: 'Very long lines detected', tip: 'Avoid multi-column PDFs that copy as one long line.' }
      : { status: 'pass', text: 'Line lengths look normal', tip: 'Good for ATS.' }
  );

  return out;
}

function Badge({ status }) {
  if (status === 'pass') {
    return (
      <span className="inline-flex items-center gap-1 text-green-700">
        <CheckCircle className="w-4 h-4" /> PASS
      </span>
    );
  }
  if (status === 'warn') {
    return (
      <span className="inline-flex items-center gap-1 text-amber-700">
        <AlertTriangle className="w-4 h-4" /> WARN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-red-700">
      <XCircle className="w-4 h-4" /> FAIL
    </span>
  );
}

export default function ATSChecklist({ project }) {
  const { proj } = useFreshProject(project);

  // Prefer server AI result; fallback to local heuristics if missing
  const checks = useMemo(() => {
    const server = Array.isArray(proj?.analysis?.ats) ? proj.analysis.ats : null;
    if (server?.length) return server;
    if (proj?.resume_text?.trim()) return localAtsChecks(proj.resume_text);
    return [];
  }, [proj?.analysis?.ats, proj?.resume_text]);

  const sorted = useMemo(() => {
    const order = { fail: 0, warn: 1, pass: 2 };
    return [...checks].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
  }, [checks]);

  const counts = useMemo(() => {
    return sorted.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      },
      { pass: 0, warn: 0, fail: 0 }
    );
  }, [sorted]);

  const copyIssues = async () => {
    const issues = sorted.filter(c => c.status !== 'pass');
    if (!issues.length) {
      toast.success('No ATS issues to copy. 🎉');
      return;
    }
    const txt = issues.map(c => `• ${c.text} — ${c.tip}`).join('\n');
    await navigator.clipboard.writeText(txt);
    toast.success('ATS issues copied');
  };

  const hasResumeText = !!proj?.resume_text?.trim();

  return (
    <div className="space-y-6 text-black">
      {/* Info / Explainer */}
      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">ATS Readiness</h3>
            <p className="text-sm text-gray-700">
              <strong>ATS (Applicant Tracking System)</strong> is the software many employers use to scan and rank
              resumes. It prefers clean, text-based documents with standard headings and relevant keywords. Use this
              checklist to catch format issues and content gaps that can block your resume from being read correctly.
            </p>
          </div>
        </div>
      </div>

      {/* Checks */}
      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="px-2 py-1 rounded border border-red-300 bg-red-50">
            Fail: <strong>{counts.fail}</strong>
          </span>
          <span className="px-2 py-1 rounded border border-amber-300 bg-amber-50">
            Warn: <strong>{counts.warn}</strong>
          </span>
          <span className="px-2 py-1 rounded border border-green-300 bg-green-50">
            Pass: <strong>{counts.pass}</strong>
          </span>

          <button
            onClick={copyIssues}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
          >
            <Copy className="w-4 h-4" /> Copy Issues
          </button>
        </div>

        {!hasResumeText ? (
          <p className="text-sm text-red-700">Extract resume text first, then run AI Analysis.</p>
        ) : !sorted.length ? (
          <p className="text-sm text-amber-700">Run AI Analysis to generate ATS checks.</p>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {sorted.map((c, idx) => (
                <div
                  key={idx}
                  className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <div className="font-medium">{c.text}</div>
                    {c.tip && <div className="text-sm text-gray-600">{c.tip}</div>}
                  </div>
                  <div className="shrink-0">
                    <Badge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Heuristics only — prefer text-based PDF/DOCX; avoid images/scans and complex multi-column layouts.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
