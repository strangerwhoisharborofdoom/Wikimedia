import React, { useState } from 'react';
import { ComparisonResult, HumanReviewDecision } from '../types/index.js';
import { X, ShieldCheck, AlertCircle, HelpCircle, EyeOff, Check } from 'lucide-react';

interface ReviewModalProps {
  result: ComparisonResult;
  isOpen: boolean;
  onClose: () => void;
  onSaveReview: (factId: string, decision: HumanReviewDecision, notes: string) => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  result,
  isOpen,
  onClose,
  onSaveReview
}) => {
  if (!isOpen) return null;

  const [selectedDecision, setSelectedDecision] = useState<HumanReviewDecision>(
    result.humanReview?.decision || 'NEEDS_HUMAN_REVIEW'
  );
  const [notes, setNotes] = useState(result.humanReview?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveReview(result.factId, selectedDecision, notes);
      onClose();
    } catch (err) {
      console.error('Failed to save review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const decisionOptions: Array<{
    id: HumanReviewDecision;
    title: string;
    description: string;
    icon: any;
    color: string;
  }> = [
    {
      id: 'CONFIRMED_MATCH',
      title: 'Confirmed Match',
      description: 'Human verification confirms that the structured value and text passage refer to the same fact.',
      icon: ShieldCheck,
      color: 'border-emerald-300 bg-emerald-50/50 text-emerald-950'
    },
    {
      id: 'NEEDS_HUMAN_REVIEW',
      title: 'Needs Human Review',
      description: 'A genuine historical or textual ambiguity exists that requires editorial or domain specialist verification.',
      icon: AlertCircle,
      color: 'border-amber-300 bg-amber-50/50 text-amber-950'
    },
    {
      id: 'NOT_COMPARABLE',
      title: 'Not Comparable',
      description: 'The structured field and the selected text passage represent different contexts, scopes, or time periods.',
      icon: HelpCircle,
      color: 'border-stone-300 bg-stone-50 text-stone-900'
    },
    {
      id: 'FALSE_POSITIVE',
      title: 'False Positive',
      description: 'The automated comparison engine misidentified unrelated phrases or parsed imperfect grammatical syntax.',
      icon: EyeOff,
      color: 'border-purple-300 bg-purple-50/50 text-purple-950'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-xl w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Auditor Verification
            </span>
            <h2 className="text-lg font-serif font-bold text-stone-900">
              Review: {result.label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Comparison summary card */}
          <div className="p-3.5 rounded-lg bg-stone-100/80 border border-stone-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-medium">Article:</span>
              <span className="font-semibold text-stone-900">{result.articleTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-medium">Structured Infobox:</span>
              <span className="font-mono font-bold text-stone-800">{result.structuredValue}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-medium">Textual Evidence:</span>
              <span className="font-mono text-stone-800">
                {result.textualValue ? `"${result.textualValue}"` : '(No statement identified)'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
              <span className="text-stone-500 font-medium">Engine Conclusion:</span>
              <span className="font-bold text-amber-900">{result.conclusionText}</span>
            </div>
          </div>

          {/* Decision choices */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Select Verification Decision
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {decisionOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedDecision === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedDecision(opt.id)}
                    className={`text-left p-3 rounded-lg border text-xs transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? `${opt.color} ring-2 ring-stone-900 ring-offset-1`
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Icon className="w-4 h-4" />
                        {opt.title}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <p className="text-[11px] opacity-80 leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reviewer Notes */}
          <div>
            <label htmlFor="reviewer-notes" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Auditor Notes & Observations (Optional)
            </label>
            <textarea
              id="reviewer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Record contextual nuance, reference sources, or reason for this determination..."
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
            />
          </div>

          {/* Footer action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
