// src/app/ai-tools/page.jsx
'use client';

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Wand2, ListChecks, ShieldCheck } from 'lucide-react';

import TailorResumeTool from './components/TailorResumeTool';
import BulletRewriterTool from './components/BulletRewriterTool';
import ATSQuickLinter from './components/ATSQuickLinter';
import AppShell from '../../components/app/AppShell';

export default function AIToolsPage() {
  const [tool, setTool] = useState('tailor'); // 'tailor' | 'rewrite' | 'ats'

  const tabs = [
    { key: 'tailor', icon: Wand2, label: 'Tailor Resume' },
    { key: 'rewrite', icon: ListChecks, label: 'Bullet Rewriter' },
    { key: 'ats', icon: ShieldCheck, label: 'ATS Quick Linter' },
  ];

  return (
    <AppShell>
      <Toaster position="top-center" />

      {/* page wrapper: make all text white by default */}
      <div className="relative text-white">
        {/* header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Tools</h1>
            <p className="text-white/70">
              Tailor your resume, rewrite bullets, and run quick ATS checks.
            </p>
          </div>
        </div>

        {/* tabs (desktop) */}
        <div className="hidden sm:flex items-center gap-2 mb-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tool === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTool(t.key)}
                className={[
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition',
                  'border backdrop-blur',
                  active
                    ? 'bg-blue-600/90 text-white border-blue-400/30 shadow-[0_0_22px_rgba(37,99,235,0.35)]'
                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                ].join(' ')}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

    {/* tabs (mobile select) */}
<div className="sm:hidden mb-4">
  <select
    value={tool}
    onChange={(e) => setTool(e.target.value)}
    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder-white/50 outline-none focus:ring-2 focus:ring-blue-500"
  >
    {tabs.map((t) => (
      <option key={t.key} value={t.key} className="bg-[#0f1520] text-white">
        {t.label}
      </option>
    ))}
  </select>
</div>


        {/* body in a dark glass card */}
        <div className="glass-dark">
          {tool === 'tailor' && <TailorResumeTool />}
          {tool === 'rewrite' && <BulletRewriterTool />}
          {tool === 'ats' && <ATSQuickLinter />}
        </div>
      </div>

      {/* local styles: dark glass surface that blends into your 3D background */}
      <style jsx>{`
        .glass-dark {
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 15, 25, 0.65);
          backdrop-filter: blur(16px);
          padding: 1rem;
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        @media (min-width: 640px) { .glass-dark { padding: 1.25rem; } }
        @media (min-width: 768px) { .glass-dark { padding: 1.5rem; } }
      `}</style>
    </AppShell>
  );
}
