'use client';

import { useState } from 'react';
import AnalyzePanel from './panels/AnalyzePanel';
import SuggestionsPanel from './panels/SuggestionsPanel';
import KeywordsPanel from './panels/KeywordsPanel';
import ATSChecklist from './panels/ATSChecklist';
import VersionsPanel from './panels/VersionsPanel';

const tabs = [
  { key: 'analyze', label: 'Analyze' },
  { key: 'suggestions', label: 'Suggestions' },
  { key: 'keywords', label: 'Keywords' },
  { key: 'ats', label: 'ATS Check' },
  { key: 'versions', label: 'Versions' },
];

export default function ProjectTabs({ project, onProjectChange }) {
  const [active, setActive] = useState('analyze');

  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b border-white/30 px-3 sm:px-4 py-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition
              ${active === t.key ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="p-4 sm:p-6">
        {active === 'analyze' && (
          <AnalyzePanel project={project} onProjectChange={onProjectChange} />
        )}
        {active === 'suggestions' && (
          <SuggestionsPanel />
        )}
        {active === 'keywords' && (
          <KeywordsPanel />
        )}
        {active === 'ats' && (
          <ATSChecklist />
        )}
        {active === 'versions' && (
          <VersionsPanel />
        )}
      </div>
    </div>
  );
}
