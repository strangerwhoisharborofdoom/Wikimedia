import React, { useState, useEffect } from 'react';
import { ComparisonReport } from '../types/index.js';
import { StatusBadge, ReviewBadge } from '../components/StatusBadge.js';
import { apiClient } from '../services/apiClient.js';
import { clientDataService } from '../services/clientDataService.js';
import {
  FileText,
  Printer,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Layers
} from 'lucide-react';

interface ReportsPageProps {
  articleId: string | null;
  onSelectArticle: (id: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  articleId,
  onSelectArticle
}) => {
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [articlesList, setArticlesList] = useState<any[]>(() => clientDataService.searchArticles(''));

  // Load available articles list
  useEffect(() => {
    let isCancelled = false;
    apiClient.searchArticles('')
      .then(list => {
        if (!isCancelled && list) {
          setArticlesList(list);
          if (!articleId && list.length > 0) {
            onSelectArticle(list[0].identifier);
          }
        }
      })
      .catch(err => console.error('Failed to load articles list for reports:', err));
    return () => { isCancelled = true; };
  }, []);

  // Fetch report for selected article
  useEffect(() => {
    if (!articleId) return;

    // Instant local fallback
    const localReport = clientDataService.getReport(articleId);
    if (localReport) {
      setReport(localReport);
    }

    setLoading(true);
    let isCancelled = false;

    apiClient.getReport(articleId)
      .then(data => {
        if (!isCancelled && data) {
          setReport(data);
        }
      })
      .catch(err => {
        console.error('Failed to load report:', err);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => { isCancelled = true; };
  }, [articleId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wikifact-lens-report-${report.article.identifier}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (!report) return;
    const headers = [
      'Field',
      'Category',
      'Structured_Value',
      'Textual_Value',
      'Status',
      'Conclusion',
      'Evidence_Confidence',
      'Section',
      'Human_Review_Decision',
      'Human_Review_Notes'
    ];

    const rows = report.findings.map(f => [
      `"${f.label.replace(/"/g, '""')}"`,
      `"${f.category}"`,
      `"${f.structuredValue.replace(/"/g, '""')}"`,
      `"${(f.textualValue || '').replace(/"/g, '""')}"`,
      `"${f.status}"`,
      `"${f.conclusionText.replace(/"/g, '""')}"`,
      f.evidenceConfidence,
      `"${(f.evidence?.location.sectionName || '').replace(/"/g, '""')}"`,
      `"${(f.humanReview?.decision || 'PENDING')}"`,
      `"${(f.humanReview?.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wikifact-lens-findings-${report.article.identifier}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="reports-view" className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Article Selector & Action Bar (Hidden in Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-stone-200 print:hidden">
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">
            Select Article:
          </label>
          <select
            value={articleId || ''}
            onChange={(e) => onSelectArticle(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-stone-300 bg-white text-stone-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-stone-900"
          >
            {articlesList.map(art => (
              <option key={art.identifier} value={art.identifier}>
                {art.name} (ID: {art.identifier})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs min-h-[36px]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {loading || !report ? (
        <div className="p-12 text-center text-xs text-stone-400 bg-white border border-stone-200 rounded-xl animate-pulse">
          Generating audit report...
        </div>
      ) : (
        <div id="printable-report" className="space-y-6">
          {/* Official Report Header */}
          <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-1">
                  <span>WIKIFACT LENS AUDIT REPORT</span>
                  <span>•</span>
                  <span>ID: {report.article.identifier}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
                  {report.article.name}
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  Generated at: {new Date(report.generatedAt).toLocaleString()} • Source: {report.datasetInfo.source}
                </p>
              </div>

              <div className="text-right text-xs text-stone-500 space-y-0.5 print:hidden">
                <div>Schema: <span className="font-mono text-stone-700">{report.datasetInfo.schemaVersion}</span></div>
                <div>Record: <span className="font-mono text-stone-700">{report.datasetInfo.recordId}</span></div>
                {report.article.url && (
                  <a
                    href={report.article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 hover:underline pt-1"
                  >
                    View on Wikipedia <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Mandatory Responsible AI Notice Banner */}
            <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-900">Responsible AI Notice:</span>
                <p className="leading-relaxed text-amber-900/90">
                  {report.responsibleAiNotice}
                </p>
              </div>
            </div>

            {/* Audit Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <div className="text-[11px] text-stone-500">Total Facts Audited</div>
                <div className="text-xl font-serif font-bold text-stone-900">
                  {report.summary.totalFacts}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <div className="text-[11px] text-emerald-700">Consistent with Text</div>
                <div className="text-xl font-serif font-bold text-emerald-950">
                  {report.summary.matches}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200">
                <div className="text-[11px] text-amber-800">Possible Mismatches</div>
                <div className="text-xl font-serif font-bold text-amber-950">
                  {report.summary.possibleMismatches}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <div className="text-[11px] text-stone-500">No Evidence in Text</div>
                <div className="text-xl font-serif font-bold text-stone-800">
                  {report.summary.insufficientEvidence}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <div className="text-[11px] text-stone-500">Human Reviews</div>
                <div className="text-xl font-serif font-bold text-stone-900">
                  {report.summary.reviewedCount}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Findings Table */}
          <div className="bg-white border border-stone-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Structured Facts Audit Findings ({report.findings.length})
              </h2>
              <span className="text-[11px] font-mono text-stone-500">
                Sorted by Infobox Order
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-100/50 text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                    <th className="py-2.5 px-4">Field / Category</th>
                    <th className="py-2.5 px-4">Structured Infobox</th>
                    <th className="py-2.5 px-4">Article Text Evidence</th>
                    <th className="py-2.5 px-4">Conclusion</th>
                    <th className="py-2.5 px-4 text-center">Confidence</th>
                    <th className="py-2.5 px-4">Human Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {report.findings.map(item => (
                    <tr key={item.factId} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium align-top">
                        <div className="font-bold text-stone-900">{item.label}</div>
                        <div className="text-[10px] font-mono text-stone-500 uppercase">{item.category}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold align-top text-stone-950">
                        {item.structuredValue}
                      </td>
                      <td className="py-3 px-4 align-top max-w-sm">
                        {item.textualValue ? (
                          <div className="space-y-1">
                            <span className="font-mono font-medium text-stone-900">
                              &ldquo;{item.textualValue}&rdquo;
                            </span>
                            {item.evidence && (
                              <div className="text-[11px] text-stone-500 italic line-clamp-2">
                                &ldquo;{item.evidence.sentence}&rdquo;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">No statement identified in text</span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-top">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-center align-top font-bold">
                        {item.evidenceConfidence}%
                      </td>
                      <td className="py-3 px-4 align-top space-y-1">
                        <ReviewBadge decision={item.humanReview?.decision} />
                        {item.humanReview?.notes && (
                          <p className="text-[10px] text-stone-500 italic truncate max-w-[140px]">
                            {item.humanReview.notes}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Methodology & Limitations Documentation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Comparison Methodology
              </h3>
              <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                {report.methodology.layers.map((l, idx) => (
                  <li key={idx} className="leading-relaxed">{l}</li>
                ))}
              </ul>
            </div>

            <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Known Audit Limitations
              </h3>
              <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                {report.limitations.map((lim, idx) => (
                  <li key={idx} className="leading-relaxed">{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
