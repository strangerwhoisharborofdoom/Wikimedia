import React from 'react';
import { DashboardStats, ComparisonResult } from '../types/index.js';
import { StatusBadge, ReviewBadge } from '../components/StatusBadge.js';
import {
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  ArrowUpRight,
  ShieldCheck,
  Search,
  BookOpen
} from 'lucide-react';

interface DashboardPageProps {
  stats: DashboardStats | null;
  loading: boolean;
  onSelectArticle: (articleId: string) => void;
  onSelectFact: (articleId: string, factId: string) => void;
  onNavigateToTab: (tab: 'explorer' | 'queue' | 'reports') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  loading,
  onSelectArticle,
  onSelectFact,
  onNavigateToTab
}) => {
  if (loading || !stats) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-stone-200 rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-stone-200 rounded-xl" />
      </div>
    );
  }

  const matchPercent = stats.factsCompared > 0
    ? Math.round((stats.matches / stats.factsCompared) * 100)
    : 0;
  const mismatchPercent = stats.factsCompared > 0
    ? Math.round((stats.possibleMismatches / stats.factsCompared) * 100)
    : 0;
  const reviewPercent = stats.factsCompared > 0
    ? Math.round((stats.reviewRequired / stats.factsCompared) * 100)
    : 0;
  const insufficientPercent = stats.factsCompared > 0
    ? Math.round((stats.insufficientEvidence / stats.factsCompared) * 100)
    : 0;

  return (
    <div id="dashboard-view" className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Welcome & Mission Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stone-100 text-stone-700 mb-1.5 border border-stone-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Active Wikimedia Structured Dataset
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Evidence Verification Overview
          </h1>
          <p className="text-xs md:text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Audit structured Wikipedia infobox values against raw prose statements using a 5-layer deterministic and semantic reconciliation engine.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <button
            onClick={() => onNavigateToTab('explorer')}
            className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-2xs inline-flex items-center gap-1.5 min-h-[38px]"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Articles</span>
          </button>
          <button
            onClick={() => onNavigateToTab('queue')}
            className="px-3.5 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors shadow-xs inline-flex items-center gap-1.5 min-h-[38px]"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Review Queue ({stats.possibleMismatches + stats.reviewRequired})</span>
          </button>
        </div>
      </div>

      {/* Mandatory Responsible AI Notice */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300/80 text-amber-950 text-xs flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-900">
            Guiding Principle: Evidence Review, Not Truth Determination
          </p>
          <p className="text-amber-800/90 leading-relaxed">
            WikiFact Lens identifies possible inconsistencies between structured data and article text.
            A detected difference is <strong>never proof that either value is incorrect</strong>.
            The primary discrepancy conclusion is strictly labeled <strong>&ldquo;Possible mismatch detected.&rdquo;</strong> and requires human domain verification.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Articles Indexed</span>
            <BookOpen className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {stats.articlesAnalyzed}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Wikimedia Enterprise records
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Facts Compared</span>
            <Scale className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {stats.factsCompared}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {stats.matches} consistent ({matchPercent}%)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-300 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
            <span className="font-semibold">Possible Mismatches</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-950">
            {stats.possibleMismatches}
          </div>
          <div className="text-[11px] text-amber-800 mt-1">
            Flagged for auditor review ({mismatchPercent}%)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>Human Verifications</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {stats.humanReviewsCompleted}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Auditor decisions recorded
          </div>
        </div>
      </div>

      {/* Visual Distribution Bar */}
      <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-stone-800 uppercase tracking-wider text-[11px]">
            Findings Distribution ({stats.factsCompared} Total Facts)
          </span>
          <span className="text-stone-500 font-mono text-[11px]">
            5-Layer Engine Assessment
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-stone-100 flex overflow-hidden border border-stone-200">
          <div
            className="bg-emerald-500 h-full transition-all"
            style={{ width: `${matchPercent}%` }}
            title={`Consistent with text: ${stats.matches} (${matchPercent}%)`}
          />
          <div
            className="bg-amber-400 h-full transition-all"
            style={{ width: `${mismatchPercent}%` }}
            title={`Possible mismatch detected: ${stats.possibleMismatches} (${mismatchPercent}%)`}
          />
          <div
            className="bg-blue-400 h-full transition-all"
            style={{ width: `${reviewPercent}%` }}
            title={`Ambiguous evidence: ${stats.reviewRequired} (${reviewPercent}%)`}
          />
          <div
            className="bg-stone-300 h-full transition-all"
            style={{ width: `${insufficientPercent}%` }}
            title={`No textual evidence: ${stats.insufficientEvidence} (${insufficientPercent}%)`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-stone-600">Consistent:</span>
            <span className="font-semibold text-stone-900">{stats.matches} ({matchPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="text-stone-600">Possible Mismatch:</span>
            <span className="font-semibold text-stone-900">{stats.possibleMismatches} ({mismatchPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
            <span className="text-stone-600">Ambiguous Evidence:</span>
            <span className="font-semibold text-stone-900">{stats.reviewRequired} ({reviewPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300 shrink-0" />
            <span className="text-stone-600">No Evidence in Text:</span>
            <span className="font-semibold text-stone-900">{stats.insufficientEvidence} ({insufficientPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Flagged Cases vs Indexed Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Flagged Cases */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Priority Flagged Cases
            </h2>
            <button
              onClick={() => onNavigateToTab('queue')}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 inline-flex items-center gap-1"
            >
              View All in Queue <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {stats.recentFlaggedCases.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 bg-white border border-stone-200 rounded-xl">
                No active discrepancies flagged in the current dataset.
              </div>
            ) : (
              stats.recentFlaggedCases.map((item) => (
                <div
                  key={item.factId}
                  className="p-3.5 bg-white border border-stone-200 hover:border-stone-300 rounded-xl transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {item.articleTitle}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="text-xs text-stone-500 font-mono">
                        {item.label}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                    <div className="text-xs text-stone-600 flex items-center gap-2 font-mono">
                      <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
                        Infobox: {item.structuredValue}
                      </span>
                      <span className="text-stone-400">vs</span>
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                        Text: {item.textualValue || 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <ReviewBadge decision={item.humanReview?.decision} />
                    <button
                      onClick={() => onSelectFact(item.articleId, item.factId)}
                      className="px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                    >
                      Inspect Bridge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Indexed Articles in Dataset */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-stone-600" />
              Indexed Wikimedia Articles
            </h2>
            <button
              onClick={() => onNavigateToTab('explorer')}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 inline-flex items-center gap-1"
            >
              Explore All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100 shadow-2xs overflow-hidden">
            {stats.recentArticles.map((art) => (
              <div
                key={art.identifier}
                className="p-3 hover:bg-stone-50/80 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-stone-900 truncate">
                    {art.name}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {art.factCount} structured facts extracted
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {art.mismatchCount > 0 ? (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                      {art.mismatchCount} flagged
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      All consistent
                    </span>
                  )}
                  <button
                    onClick={() => onSelectArticle(art.identifier)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-md transition-colors"
                    title="Open article explorer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
