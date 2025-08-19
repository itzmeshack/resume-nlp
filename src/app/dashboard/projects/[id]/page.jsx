'use client';

import { useParams } from 'next/navigation';
import ProjectProvider from '@/components/project/context/ProjectProvider';
import AnalyzePanel from '@/components/project/panels/AnalyzePanel';
import SuggestionsPanel from '@/components/project/panels/SuggestionsPanel';
import ATSChecklist from '@/components/project/panels/ATSChecklist';

// If you already have your own tabs layout, just replace the inner panels with these components.
export default function ProjectPage() {
  const params = useParams();
  const projectId = params?.id;

  return (
    <ProjectProvider projectId={projectId}>
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <h1 className="text-2xl font-bold mb-2">Project #{projectId}</h1>

        {/* Analyze */}
        <AnalyzePanel />

        {/* Tabs could go here */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SuggestionsPanel />
          <ATSChecklist />
        </div>
      </div>
    </ProjectProvider>
  );
}
