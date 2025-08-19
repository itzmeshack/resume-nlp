'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ExportReportButton({ project, result }) {
  const [downloading, setDownloading] = useState(false);

  // Normalize result shape (old vs new)
  const normalize = (r) => {
    if (!r) return { score: '-', present: [], missing: [], suggestions: [] };
    // Old shape?
    if (Array.isArray(r.keywordsFound) || Array.isArray(r.gaps) || Array.isArray(r.atsIssues)) {
      return {
        score: r.score ?? '-',
        present: r.keywordsFound ?? [],
        missing: r.gaps ?? [],
        suggestions: r.suggestions ?? (r.atsIssues ? r.atsIssues.map(i => `ATS: ${i}`) : []),
      };
    }
    // New shape
    return {
      score: r.score ?? '-',
      present: r.present ?? [],
      missing: r.missing ?? [],
      suggestions: r.suggestions ?? [],
    };
  };

  const handleExport = async () => {
    try {
      if (!result) {
        toast.error('No analysis to export yet.');
        return;
      }
      setDownloading(true);

      // ---- Safe jsPDF import (works for default or named export) ----
      const jsPDFModule = await import('jspdf');
      const JsPDFCtor = jsPDFModule.jsPDF || jsPDFModule.default;
      const doc = new JsPDFCtor({ unit: 'pt', format: 'a4' });

      // ---- Safe AutoTable import for v2/v3 ----
      const autoTableMod = await import('jspdf-autotable');
      const autoTableFn = autoTableMod.default || autoTableMod.autoTable;
      const runAutoTable = (opts) => {
        if (typeof autoTableFn === 'function') {
          // v3 style
          autoTableFn(doc, opts);
        } else if (typeof doc.autoTable === 'function') {
          // v2 style (plugin patched onto doc)
          doc.autoTable(opts);
        } else {
          throw new Error('jsPDF-AutoTable plugin not found. Make sure "jspdf-autotable" is installed.');
        }
      };

      const R = normalize(result);

      const marginX = 40;
      let y = 40;

      // High-contrast text (black on white)
      doc.setTextColor(0, 0, 0);
      try { doc.setFont('helvetica', 'normal'); } catch { /* fallback ok */ }

      // Header
      doc.setFontSize(18);
      doc.text('ResumeAI — Analysis Report', marginX, y); y += 22;

      // Meta
      doc.setFontSize(11);
      doc.text(`Project: ${project?.name ?? '-'}`, marginX, y); y += 16;
      doc.text(`Score: ${R.score}`, marginX, y); y += 16;
      doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y); y += 24;

      // Present Keywords
      if (Array.isArray(R.present) && R.present.length) {
        doc.setFontSize(13);
        doc.text('Present Keywords', marginX, y); y += 10;
        runAutoTable({
          startY: y,
          styles: { fontSize: 10, textColor: 0 },
          headStyles: { fillColor: [230, 230, 230], textColor: 0 },
          margin: { left: marginX, right: marginX },
          head: [['Keyword']],
          body: R.present.map(k => [k]),
        });
        y = (doc.lastAutoTable?.finalY ?? y) + 18;
      }

      // Missing Keywords
      if (Array.isArray(R.missing) && R.missing.length) {
        doc.setFontSize(13);
        doc.text('Missing Keywords', marginX, y); y += 10;
        runAutoTable({
          startY: y,
          styles: { fontSize: 10, textColor: 0 },
          headStyles: { fillColor: [230, 230, 230], textColor: 0 },
          margin: { left: marginX, right: marginX },
          head: [['Keyword']],
          body: R.missing.map(k => [k]),
        });
        y = (doc.lastAutoTable?.finalY ?? y) + 18;
      }

      // Suggestions
      if (Array.isArray(R.suggestions) && R.suggestions.length) {
        doc.setFontSize(13);
        doc.text('Suggestions', marginX, y); y += 10;
        runAutoTable({
          startY: y,
          styles: { fontSize: 10, textColor: 0, cellPadding: 6 },
          headStyles: { fillColor: [230, 230, 230], textColor: 0 },
          margin: { left: marginX, right: marginX },
          head: [['Recommendation']],
          body: R.suggestions.map(s => [s]),
        });
        y = (doc.lastAutoTable?.finalY ?? y) + 18;
      }

      doc.save(`ResumeAI_Report_${Date.now()}.pdf`);
      toast.success('Report downloaded');
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Export failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={downloading}
      className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-4 py-2 font-medium hover:bg-black/90 disabled:opacity-50"
      title="Download PDF report"
    >
      <FileDown className="w-4 h-4" />
      {downloading ? 'Exporting…' : 'Export Report'}
    </button>
  );
}
