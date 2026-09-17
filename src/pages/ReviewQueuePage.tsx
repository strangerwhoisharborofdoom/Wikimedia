import React, { useState, useEffect } from 'react';
import { ComparisonResult, ComparisonStatus, HumanReviewDecision } from '../types/index.js';
import { StatusBadge, ReviewBadge } from '../components/StatusBadge.js';
import { ReviewModal } from '../components/ReviewModal.js';
import {
  ListTodo,
  Filter,
  Search,
  Scale,
  ShieldCheck,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';

interface ReviewQueuePageProps {
  onSelectFactForComparison: (articleId: string, factId: string) => void;
  onSaveReview: (factId: string, decision: HumanReviewDecision, notes: string) => Promise<void>;
}

export const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({
  onSelectFactForComparison,
  onSaveReview
}) => {
  const [items, setItems] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reviewFilter, setReviewFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResultForReview, setSelectedResultForReview] = useState<ComparisonResult | null>(null);

  const fetchItems = () => {
    setLoading(true);
    let url = `/api/reviews?status=${statusFilter}`;
    if (reviewFilter !== 'ALL') {
      url += `&reviewStatus=${reviewFilter}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch queue:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, reviewFilter]);

  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.articleTitle.toLowerCase().includes(q) ||
      item.label.toLowerCase().includes(q) ||
      item.structuredValue.toLowerCase().includes(q) ||
      (item.textualValue && item.textualValue.toLowerCase().includes(q))
    );
  });

  return (
    <div id="review-queue-view" className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stone-100 text-stone-700 mb-1 border border-stone-200">
            <Clock className="w-3 h-3 text-stone-500" />
            Human Verification Worklist
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Evidence Review Queue
          </h1>
          <p className="text-xs md:text-sm text-stone-600 mt-0.5 leading-relaxed">
            Audit detected discrepancies, conflicting candidates, and unmentioned fields to record human verification determinations.
          </p>
        </div>

        <div className="text-xs font-mono text-stone-500 self-start sm:self-center bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200">
          Showing {filteredItems.length} findings
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 sm:p-4 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by article, field name, or value..."
              className="w-full text-xs pl-9 pr-4 py-2.5 sm:py-2 rounded-lg border border-stone-300 bg-stone-50 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500 whitespace-nowrap">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto text-xs py-2 px-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-900"
              >
                <option value="ALL">All Findings</option>
                <option value="POSSIBLE_MISMATCH">Possible Mismatches</option>
                <option value="REVIEW_REQUIRED">Ambiguous Evidence</option>
                <option value="MATCH">Consistent with Text</option>
                <option value="NO_TEXTUAL_EVIDENCE">No Textual Evidence</option>
              </select>
            </div>

            {/* Review Decision Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500 whitespace-nowrap">Review State:</label>
              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
                className="w-full sm:w-auto text-xs py-2 px-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-900"
              >
                <option value="ALL">All States</option>
                <option value="PENDING">Pending Review</option>
                <option value="CONFIRMED_MATCH">Confirmed Match</option>
                <option value="NEEDS_HUMAN_REVIEW">Flagged for Review</option>
                <option value="NOT_COMPARABLE">Not Comparable</option>
                <option value="FALSE_POSITIVE">False Positive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Items Table / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400 bg-white border border-stone-200 rounded-xl">
            Loading queue findings...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500 bg-white border border-stone-200 rounded-xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-semibold text-stone-800 text-sm">No findings match the current filters.</h3>
            <p className="text-stone-400">Try adjusting your search query or dropdown filter selections.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.factId}
              className="p-4 bg-white border border-stone-200 hover:border-stone-300 rounded-xl shadow-2xs transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif font-bold text-sm text-stone-900">
                    {item.articleTitle}
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="text-xs font-mono text-stone-600">
                    {item.label}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                    {item.category}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <ReviewBadge decision={item.humanReview?.decision} />
                  <span className="text-xs font-mono text-stone-500">
                    Conf: {item.evidenceConfidence}/100
                  </span>
                </div>
              </div>

              {/* Comparison Preview Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                    Infobox Structured Data
                  </span>
                  <div className="font-mono font-bold text-stone-900 truncate">
                    {item.structuredValue}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                    Article Text Evidence
                  </span>
                  <div className="font-mono text-stone-800 truncate">
                    {item.textualValue ? `"${item.textualValue}"` : '(No statement identified in text)'}
                  </div>
                  {item.evidence && (
                    <div className="text-[11px] text-stone-500 line-clamp-1 italic">
                      &ldquo;{item.evidence.sentence}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              {/* Auditor notes if present */}
              {item.humanReview?.notes && (
                <div className="p-2 rounded bg-stone-100 text-xs text-stone-700 italic border border-stone-200">
                  <strong className="not-italic font-semibold text-stone-800">Auditor Note: </strong>
                  {item.humanReview.notes}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-stone-100">
                <span className="text-[11px] text-stone-500 italic">
                  Conclusion: {item.conclusionText}
                </span>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onSelectFactForComparison(item.articleId, item.factId)}
                    className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Evidence Bridge</span>
                  </button>
                  <button
                    onClick={() => setSelectedResultForReview(item)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs min-h-[36px]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{item.humanReview ? 'Update Review' : 'Record Review'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedResultForReview && (
        <ReviewModal
          result={selectedResultForReview}
          isOpen={true}
          onClose={() => setSelectedResultForReview(null)}
          onSaveReview={async (factId, decision, notes) => {
            await onSaveReview(factId, decision, notes);
            fetchItems();
          }}
        />
      )}
    </div>
  );
};
