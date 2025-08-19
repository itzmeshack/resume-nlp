// Example somewhere else
import WithProjectProvider from '@/components/project/WithProjectProvider';
import AnalyzePanel from '@/components/project/panels/AnalyzePanel';

export default function SomePage({ params }) {
  const { id } = params; // or however you get the project id
  return (
    <WithProjectProvider projectId={id}>
      <AnalyzePanel />
      {/* other panels that use useProject() */}
    </WithProjectProvider>
  );
}
