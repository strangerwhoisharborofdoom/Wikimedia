import React from 'react';
import { ComparisonStatus, HumanReviewDecision } from '../types/index.js';
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: ComparisonStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  let label = 'Unknown';
  let styles = 'bg-stone-100 text-stone-700 border-stone-300';
  let Icon = HelpCircle;

  switch (status) {
    case 'MATCH':
      label = 'Consistent with text';
      styles = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      Icon = CheckCircle2;
      break;
    case 'POSSIBLE_MISMATCH':
      label = 'Possible mismatch detected';
      styles = 'bg-amber-50 text-amber-900 border-amber-400 font-semibold';
      Icon = AlertTriangle;
      break;
    case 'REVIEW_REQUIRED':
      label = 'Ambiguous evidence';
      styles = 'bg-blue-50 text-blue-800 border-blue-300';
      Icon = Clock;
      break;
    case 'NO_TEXTUAL_EVIDENCE':
      label = 'No textual evidence';
      styles = 'bg-stone-100 text-stone-600 border-stone-200';
      Icon = XCircle;
      break;
    case 'INSUFFICIENT_DATA':
      label = 'Insufficient data';
      styles = 'bg-stone-100 text-stone-600 border-stone-200';
      Icon = HelpCircle;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2'
  }[size];

  return (
    <span
      id={`status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center rounded-md border font-medium ${sizeClasses} ${styles} whitespace-nowrap shadow-2xs`}
    >
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />}
      <span>{label}</span>
    </span>
  );
};

interface ReviewBadgeProps {
  decision?: HumanReviewDecision;
}

export const ReviewBadge: React.FC<ReviewBadgeProps> = ({ decision }) => {
  if (!decision) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-500 border border-dashed border-stone-300">
        Pending Review
      </span>
    );
  }

  const map: Record<HumanReviewDecision, { label: string; style: string }> = {
    CONFIRMED_MATCH: { label: 'Confirmed Match', style: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    NEEDS_HUMAN_REVIEW: { label: 'Flagged for Review', style: 'bg-amber-100 text-amber-900 border-amber-300' },
    NOT_COMPARABLE: { label: 'Not Comparable', style: 'bg-stone-100 text-stone-700 border-stone-300' },
    FALSE_POSITIVE: { label: 'False Positive', style: 'bg-purple-100 text-purple-800 border-purple-300' }
  };

  const item = map[decision] || { label: decision, style: 'bg-stone-100 text-stone-700 border-stone-300' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${item.style}`}>
      {item.label}
    </span>
  );
};
