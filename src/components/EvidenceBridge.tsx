import React from 'react';
import { ComparisonResult } from '../types/index.js';
import { ArrowRight, Database, Sparkles, BookOpen, Scale, ShieldAlert, UserCheck, HelpCircle } from 'lucide-react';

interface EvidenceBridgeProps {
  result: ComparisonResult;
  onOpenReviewModal?: () => void;
}

export const EvidenceBridge: React.FC<EvidenceBridgeProps> = ({
  result,
  onOpenReviewModal
}) => {
  const isMismatch = result.status === 'POSSIBLE_MISMATCH';
  const isMatch = result.status === 'MATCH';
  const isAmbiguous = result.status === 'REVIEW_REQUIRED';
  const isMissing = result.status === 'NO_TEXTUAL_EVIDENCE';

  // Highlight extracted value inside sentence if found
  const renderHighlightedSentence = (sentence: string, extracted: string | null) => {
    if (!extracted) return <span>{sentence}</span>;
    const lowerSent = sentence.toLowerCase();
    const lowerExt = extracted.toLowerCase();
    const idx = lowerSent.indexOf(lowerExt);

    if (idx === -1) {
      return <span>{sentence}</span>;
    }

    const before = sentence.slice(0, idx);
    const match = sentence.slice(idx, idx + extracted.length);
    const after = sentence.slice(idx + extracted.length);

    return (
      <span>
        {before}
        <mark className="bg-amber-200 text-stone-900 px-1 py-0.5 rounded font-medium border border-amber-300">
          {match}
        </mark>
        {after}
      </span>
    );
  };

  return (
    <div id="evidence-bridge-container" className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Flagship Evidence Bridge
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
              6-Stage Traceability Pipeline
            </span>
          </div>
          <h3 className="text-base font-serif font-bold text-stone-900 mt-0.5">
            Verification Pathway: {result.label}
          </h3>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="text-right text-xs">
            <div className="text-stone-500">Evidence Confidence</div>
            <div className="font-mono font-bold text-stone-900 text-sm">
              {result.evidenceConfidence}/100
            </div>
          </div>
          <div className="w-12 h-2 rounded-full bg-stone-200 overflow-hidden">
            <div
              className={`h-full ${
                result.evidenceConfidence >= 80
                  ? 'bg-emerald-500'
                  : result.evidenceConfidence >= 50
                  ? 'bg-amber-500'
                  : 'bg-stone-400'
              }`}
              style={{ width: `${result.evidenceConfidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Horizontal Bridge Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        {/* Step 1: Structured Fact */}
        <div className="flex flex-col p-3.5 rounded-lg bg-stone-50 border border-stone-200 relative group">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-stone-700">
              <Database className="w-3.5 h-3.5 text-stone-600" />
              1. Infobox Fact
            </span>
            <span className="text-[10px] uppercase font-mono px-1 rounded bg-stone-200 text-stone-700">
              {result.category}
            </span>
          </div>
          <div className="text-xs text-stone-500 font-mono truncate mb-1">
            {result.field}
          </div>
          <div className="text-sm font-semibold text-stone-900 font-mono bg-white p-2 rounded border border-stone-200 break-words mb-2">
            {result.structuredValue}
          </div>
          <div className="mt-auto text-[11px] text-stone-500">
            Source: <span className="text-stone-700">Wikimedia Infobox</span>
          </div>
          <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-stone-300 pointer-events-none">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Step 2: Normalization */}
        <div className="flex flex-col p-3.5 rounded-lg bg-stone-50 border border-stone-200 relative">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-stone-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              2. Normalization
            </span>
            <span className="text-[10px] font-mono px-1 rounded bg-indigo-50 text-indigo-700">
              Deterministic
            </span>
          </div>
          <div className="text-xs text-stone-500 mb-1">Canonical Form</div>
          <div className="text-xs font-mono text-indigo-950 bg-indigo-50/50 p-2 rounded border border-indigo-100 break-words mb-2">
            {result.normalizedStructuredValue || 'N/A'}
          </div>
          <div className="mt-auto text-[11px] text-stone-500">
            Rule: Stripped tags & ISO alignment
          </div>
          <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-stone-300 pointer-events-none">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Step 3: Textual Evidence */}
        <div className="flex flex-col p-3.5 rounded-lg bg-stone-50 border border-stone-200 relative">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-stone-700">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              3. Text Evidence
            </span>
            {result.evidence?.location && (
              <span className="text-[10px] font-mono px-1 rounded bg-stone-200 text-stone-700 truncate max-w-[90px]">
                {result.evidence.location.sectionName}
              </span>
            )}
          </div>
          <div className="text-xs text-stone-500 mb-1">Article Statement</div>
          {result.evidence ? (
            <div className="text-xs text-stone-800 bg-white p-2 rounded border border-stone-200 line-clamp-3 mb-2">
              {renderHighlightedSentence(result.evidence.sentence, result.evidence.extractedValue)}
            </div>
          ) : (
            <div className="text-xs text-stone-400 italic bg-white p-2 rounded border border-dashed border-stone-200 mb-2">
              No statement identified in text
            </div>
          )}
          <div className="mt-auto text-[11px] text-stone-600 font-mono">
            Value: {result.textualValue ? `"${result.textualValue}"` : 'None'}
          </div>
          <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-stone-300 pointer-events-none">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Step 4: Comparison Engine */}
        <div className="flex flex-col p-3.5 rounded-lg bg-stone-50 border border-stone-200 relative">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-stone-700">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              4. Layered Engine
            </span>
            <span className="text-[10px] font-mono px-1 rounded bg-stone-200 text-stone-700">
              5 Layers
            </span>
          </div>
          <div className="text-xs text-stone-500 mb-1">Method Applied</div>
          <div className="text-xs text-stone-700 bg-white p-2 rounded border border-stone-200 line-clamp-2 mb-2">
            {result.comparisonMethod}
          </div>
          <div className="mt-auto text-[11px] text-stone-500">
            {result.aiAssisted ? 'AI-grounded analysis' : 'Syntactic heuristic'}
          </div>
          <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-stone-300 pointer-events-none">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Step 5: Primary Conclusion */}
        <div
          className={`flex flex-col p-3.5 rounded-lg border relative ${
            isMismatch
              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
              : isMatch
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : isAmbiguous
              ? 'bg-blue-50/80 border-blue-300 text-blue-950'
              : 'bg-stone-100 border-stone-300 text-stone-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              5. Conclusion
            </span>
            <span className="text-[10px] uppercase font-mono px-1 rounded bg-white/60">
              Auto
            </span>
          </div>
          <div className="text-xs font-semibold leading-snug mb-2">
            {result.conclusionText}
          </div>
          <div className="text-[11px] opacity-80 line-clamp-2 mb-2">
            {result.interpretation}
          </div>
          <div className="mt-auto text-[10px] font-semibold uppercase tracking-wide opacity-90">
            Requires human review
          </div>
          <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-stone-300 pointer-events-none">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Step 6: Human Verification */}
        <div className="flex flex-col p-3.5 rounded-lg bg-stone-50 border border-stone-200 relative">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-stone-700">
              <UserCheck className="w-3.5 h-3.5 text-stone-600" />
              6. Human Review
            </span>
            {result.humanReview ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Reviewed" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Pending" />
            )}
          </div>
          <div className="text-xs text-stone-500 mb-1">Auditor Status</div>
          <div className="text-xs bg-white p-2 rounded border border-stone-200 mb-2 min-h-[34px] flex items-center">
            {result.humanReview ? (
              <span className="font-semibold text-stone-800 truncate">
                {result.humanReview.decision.replace(/_/g, ' ')}
              </span>
            ) : (
              <span className="text-stone-400 italic">Pending human decision</span>
            )}
          </div>
          <div className="mt-auto">
            {onOpenReviewModal && (
              <button
                type="button"
                onClick={onOpenReviewModal}
                className="w-full text-xs font-medium py-1 px-2 rounded bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-2xs"
              >
                {result.humanReview ? 'Change Decision' : 'Submit Review'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Responsible AI Notice Banner */}
      <div className="mt-4 p-3 rounded-lg bg-stone-100/90 border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-stone-800">Responsible AI Notice: </strong>
          WikiFact Lens identifies possible inconsistencies between structured data and article text.
          A detected difference is not proof that either value is incorrect. Findings require human verification.
        </p>
      </div>
    </div>
  );
};
