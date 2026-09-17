import React, { useState, useEffect } from 'react';
import { ComparisonResult, HumanReviewDecision, TextEvidenceCandidate } from '../types/index.js';
import { StatusBadge, ReviewBadge } from '../components/StatusBadge.js';
import { EvidenceBridge } from '../components/EvidenceBridge.js';
import { ReviewModal } from '../components/ReviewModal.js';
import { apiClient } from '../services/apiClient.js';
import { clientDataService } from '../services/clientDataService.js';
import {
  Scale,
  Database,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Layers,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

interface FactComparisonPageProps {
  articleId: string | null;
  factId: string | null;
  onBackToExplorer: () => void;
  onSaveReview: (factId: string, decision: HumanReviewDecision, notes: string) => Promise<void>;
}

export const FactComparisonPage: React.FC<FactComparisonPageProps> = ({
  articleId,
  factId,
  onBackToExplorer,
  onSaveReview
}) => {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [allArticleResults, setAllArticleResults] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [showAllCandidates, setShowAllCandidates] = useState(false);

  useEffect(() => {
    if (!articleId) return;

    // Provide instant initial results from clientDataService so UI never flashes blank
    const instantList = clientDataService.compareArticleFacts(articleId);
    if (instantList.length > 0) {
      setAllArticleResults(instantList);
      const initialMatch = factId
        ? instantList.find(r => r.factId === factId)
        : instantList[0];
      setResult(initialMatch || instantList[0]);
    }

    setLoading(true);
    let isCancelled = false;

    apiClient.compareArticle(articleId, false)
      .then(data => {
        if (!isCancelled && data.results && Array.isArray(data.results)) {
          setAllArticleResults(data.results);
          const found = factId
            ? data.results.find((r: ComparisonResult) => r.factId === factId)
            : data.results[0];
          setResult(found || data.results[0] || null);
        }
      })
      .catch(err => {
        console.error('Failed to load comparison result:', err);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => { isCancelled = true; };
  }, [articleId, factId]);

  const handleSelectFact = (targetFactId: string) => {
    const next = allArticleResults.find(r => r.factId === targetFactId);
    if (next) {
      setResult(next);
    }
  };

  const currentIndex = result && allArticleResults.length > 0
    ? allArticleResults.findIndex(r => r.factId === result.factId)
    : -1;

  const handlePrevFact = () => {
    if (currentIndex > 0) {
      setResult(allArticleResults[currentIndex - 1]);
    }
  };

  const handleNextFact = () => {
    if (currentIndex >= 0 && currentIndex < allArticleResults.length - 1) {
      setResult(allArticleResults[currentIndex + 1]);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!result || !articleId) return;
    setAiAnalyzing(true);
    try {
      const updated = await apiClient.compareFact(articleId, result.factId, true);
      setResult(updated);
      setAllArticleResults(prev => prev.map(item => item.factId === updated.factId ? updated : item));
    } catch (err) {
      console.error('AI analysis failed:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  if (loading || !result) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-stone-200 rounded w-48" />
        <div className="h-10 bg-stone-200 rounded w-96" />
        <div className="h-64 bg-stone-200 rounded-xl" />
      </div>
    );
  }

  const isMismatch = result.status === 'POSSIBLE_MISMATCH';

  return (
    <div id="fact-comparison-view" className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div className="space-y-1">
          <button
            onClick={onBackToExplorer}
            className="text-xs font-medium text-stone-500 hover:text-stone-900 inline-flex items-center gap-1.5 transition-colors mb-1 min-h-[32px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Article Explorer</span>
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-900">
              {result.articleTitle}: {result.label}
            </h1>
            <StatusBadge status={result.status} size="lg" />
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          <button
            onClick={handleAnalyzeWithAI}
            disabled={aiAnalyzing}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 border min-h-[38px] ${
              result.aiAssisted
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50 shadow-2xs'
            }`}
            title="Analyze nuances with Gemini 3.8 Flash grounded on article text"
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiAnalyzing ? 'animate-spin text-indigo-600' : 'text-indigo-500'}`} />
            <span>{aiAnalyzing ? 'Analyzing...' : result.aiAssisted ? 'AI Re-grounded' : 'Ground with Gemini'}</span>
          </button>

          <ReviewBadge decision={result.humanReview?.decision} />
          <button
            onClick={() => setReviewModalOpen(true)}
            className="px-3.5 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors shadow-2xs inline-flex items-center gap-1.5 min-h-[38px]"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{result.humanReview ? 'Edit Decision' : 'Record Verification'}</span>
          </button>
        </div>
      </div>

      {/* Fact Navigation Switcher Bar */}
      {allArticleResults.length > 1 && (
        <div className="p-3 bg-white border border-stone-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700 whitespace-nowrap">
              Infobox Fact ({currentIndex + 1} of {allArticleResults.length}):
            </span>
            <select
              value={result.factId}
              onChange={(e) => handleSelectFact(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-stone-300 bg-stone-50 text-stone-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-stone-900"
            >
              {allArticleResults.map((r, idx) => (
                <option key={r.factId} value={r.factId}>
                  {idx + 1}. {r.label} ({r.structuredValue}) — {r.status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrevFact}
              disabled={currentIndex <= 0}
              className="px-2.5 py-1 text-xs rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous Fact
            </button>
            <button
              onClick={handleNextFact}
              disabled={currentIndex >= allArticleResults.length - 1}
              className="px-2.5 py-1 text-xs rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next Fact
            </button>
          </div>
        </div>
      )}

      {/* Flagship Visual Differentiator: The Evidence Bridge */}
      <EvidenceBridge
        result={result}
        onOpenReviewModal={() => setReviewModalOpen(true)}
      />

      {/* Side-by-Side Deep Dive Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Structured Infobox Source */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-stone-600" />
              <h2 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider text-xs">
                Structured Infobox Source Data
              </h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
              Category: {result.category}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Infobox Field Name
              </div>
              <div className="text-xs font-mono text-stone-800 font-medium">
                {result.field}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Raw Infobox Value
              </div>
              <div className="text-sm font-mono font-bold text-stone-950 p-2.5 rounded-lg bg-stone-50 border border-stone-200 mt-1">
                {result.structuredValue}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Normalized Canonical Form
              </div>
              <div className="text-xs font-mono text-stone-700 p-2 rounded bg-indigo-50/50 border border-indigo-100 mt-1">
                {result.normalizedStructuredValue || 'Same as raw'}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
              <span>Source Schema:</span>
              <span className="font-mono text-stone-700">Wikimedia Structured Contents / Infobox</span>
            </div>
          </div>
        </div>

        {/* Right Side: Article Main Text Evidence */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider text-xs">
                Article Prose Evidence
              </h2>
            </div>
            {result.evidence?.location && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                Section: {result.evidence.location.sectionName}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Extracted Value from Text
              </div>
              <div className={`text-sm font-mono font-bold p-2.5 rounded-lg border mt-1 ${
                isMismatch
                  ? 'bg-amber-50 text-amber-950 border-amber-300'
                  : 'bg-emerald-50 text-emerald-950 border-emerald-300'
              }`}>
                {result.textualValue ? `"${result.textualValue}"` : '(No statement identified in text)'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Verbatim Excerpt from Article
              </div>
              {result.evidence ? (
                <div className="text-xs text-stone-800 p-3 rounded-lg bg-stone-50 border border-stone-200 mt-1 leading-relaxed italic">
                  &ldquo;{result.evidence.sentence}&rdquo;
                </div>
              ) : (
                <div className="text-xs text-stone-400 p-3 rounded-lg bg-stone-50 border border-dashed border-stone-200 mt-1 italic">
                  Information unavailable in the provided dataset prose passages.
                </div>
              )}
            </div>

            {result.evidence?.location && (
              <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
                <span>Span Offsets:</span>
                <span className="font-mono text-stone-700">
                  Chars {result.evidence.location.startChar} - {result.evidence.location.endChar}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alternative Candidate Statements (if any exist) */}
      {result.allCandidates && result.allCandidates.length > 1 && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-3">
          <button
            onClick={() => setShowAllCandidates(!showAllCandidates)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Alternative Candidate Sentences Evaluated ({result.allCandidates.length})
              </h3>
            </div>
            <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showAllCandidates ? 'rotate-180' : ''}`} />
          </button>

          {showAllCandidates && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              {result.allCandidates.map((cand, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-stone-800 italic">
                      &ldquo;{cand.sentence}&rdquo;
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      Candidate Value: <strong>{cand.extractedValue}</strong> • Section: {cand.location.sectionName}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-200 text-stone-700 shrink-0">
                    Score: {cand.confidence}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explainability & Responsible AI Audit Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-stone-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Audit Rationale & Layered Explainability
            </h2>
          </div>
          <span className="text-xs font-mono text-stone-500">
            Engine Layer: {result.comparisonMethod}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5 p-3 rounded-lg bg-stone-50 border border-stone-200">
            <div className="font-semibold text-stone-800 uppercase tracking-wider text-[11px]">
              Why was this flagged?
            </div>
            <p className="text-stone-700 leading-relaxed">
              {result.whyFlagged}
            </p>
          </div>

          <div className="space-y-1.5 p-3 rounded-lg bg-stone-50 border border-stone-200">
            <div className="font-semibold text-stone-800 uppercase tracking-wider text-[11px]">
              Engine Interpretation
            </div>
            <p className="text-stone-700 leading-relaxed">
              {result.interpretation}
            </p>
          </div>
        </div>

        {/* Confidence Breakdown Matrix */}
        <div>
          <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
            Evidence Confidence Scoring Matrix (Total: {result.evidenceConfidence}/100)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2 rounded bg-stone-50 border border-stone-200">
              <div className="text-[10px] text-stone-500">Exactness</div>
              <div className="font-mono font-bold text-stone-900">
                +{result.confidenceBreakdown.exactness} pts
              </div>
            </div>
            <div className="p-2 rounded bg-stone-50 border border-stone-200">
              <div className="text-[10px] text-stone-500">Entity Match</div>
              <div className="font-mono font-bold text-stone-900">
                +{result.confidenceBreakdown.entityMatch} pts
              </div>
            </div>
            <div className="p-2 rounded bg-stone-50 border border-stone-200">
              <div className="text-[10px] text-stone-500">Normalization</div>
              <div className="font-mono font-bold text-stone-900">
                +{result.confidenceBreakdown.normalizationConfidence} pts
              </div>
            </div>
            <div className="p-2 rounded bg-stone-50 border border-stone-200">
              <div className="text-[10px] text-stone-500">Semantic Sim</div>
              <div className="font-mono font-bold text-stone-900">
                +{result.confidenceBreakdown.semanticSimilarity} pts
              </div>
            </div>
            <div className="p-2 rounded bg-stone-50 border border-stone-200">
              <div className="text-[10px] text-stone-500">Conflict Penalty</div>
              <div className="font-mono font-bold text-rose-700">
                -{result.confidenceBreakdown.conflictPenalty} pts
              </div>
            </div>
          </div>
        </div>

        {/* AI Distinction Note if applicable */}
        {result.aiAssisted && (
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI-Grounded Analysis Distinction
            </div>
            <p className="text-indigo-900/80 leading-relaxed text-[11px]">
              This evaluation was grounded using server-side Gemini 3.8 Flash.
              The AI was strictly confined to synthesizing evidence from the provided text passages without extrapolating outside knowledge.
            </p>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      <ReviewModal
        result={result}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSaveReview={async (fId, decision, notes) => {
          await onSaveReview(fId, decision, notes);
          setResult({
            ...result,
            humanReview: {
              decision,
              notes,
              reviewedAt: new Date().toISOString()
            }
          });
        }}
      />
    </div>
  );
};
