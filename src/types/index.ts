export interface WikimediaCategory {
  name: string;
  url: string;
}

export interface InfoboxPart {
  name: string;
  type: 'infobox' | 'field' | 'section' | 'list';
  value?: string;
  values?: string[];
  has_parts?: InfoboxPart[];
}

export interface ArticleSectionPart {
  type: 'paragraph' | 'heading' | 'list_item';
  value: string;
}

export interface ArticleSection {
  name: string;
  has_parts: ArticleSectionPart[];
}

/**
 * Raw Wikimedia Enterprise Structured Wikipedia Dataset schema
 */
export interface RawWikimediaArticle {
  identifier: number | string;
  name: string;
  url: string;
  abstract: string;
  date_modified: string;
  categories: WikimediaCategory[];
  infoboxes: InfoboxPart[];
  article_sections: ArticleSection[];
  main_entity?: string; // Wikidata QID if available
}

export interface StructuredFact {
  id: string;
  field: string;
  label: string;
  originalValue: string;
  normalizedValue: string;
  category: 'date' | 'person' | 'location' | 'organization' | 'number' | 'general';
  rawPath: string;
}

export interface TextEvidenceCandidate {
  sentence: string;
  extractedValue: string;
  normalizedValue: string;
  location: {
    startChar: number;
    endChar: number;
    sectionName: string;
  };
  confidence: number;
  matchType: 'exact' | 'normalized' | 'semantic' | 'partial';
}

export type ComparisonStatus =
  | 'MATCH'
  | 'POSSIBLE_MISMATCH'
  | 'NO_TEXTUAL_EVIDENCE'
  | 'INSUFFICIENT_DATA'
  | 'REVIEW_REQUIRED';

export type HumanReviewDecision =
  | 'CONFIRMED_MATCH'
  | 'NEEDS_HUMAN_REVIEW'
  | 'NOT_COMPARABLE'
  | 'FALSE_POSITIVE';

export interface HumanReviewRecord {
  decision: HumanReviewDecision;
  reviewedAt: string;
  notes?: string;
  reviewerId?: string;
}

export interface ComparisonResult {
  factId: string;
  articleId: string;
  articleTitle: string;
  field: string;
  label: string;
  category: string;
  status: ComparisonStatus;
  conclusionText: string;
  structuredValue: string;
  textualValue: string | null;
  normalizedStructuredValue: string;
  normalizedTextualValue: string | null;
  evidence: TextEvidenceCandidate | null;
  allCandidates: TextEvidenceCandidate[];
  evidenceConfidence: number; // 0-100 score
  confidenceBreakdown: {
    exactness: number;
    entityMatch: number;
    normalizationConfidence: number;
    semanticSimilarity: number;
    conflictPenalty: number;
  };
  comparisonMethod: string;
  whyFlagged: string;
  interpretation: string;
  requiredAction: string;
  aiAssisted: boolean;
  aiDistinction?: {
    sourceData: string;
    textualEvidence: string;
    modelInterpretation: string;
  };
  humanReview?: HumanReviewRecord;
  timestamp: string;
}

export interface ArticleOverview {
  identifier: string;
  name: string;
  url: string;
  abstract: string;
  date_modified: string;
  categories: WikimediaCategory[];
  fullText: string;
  structuredFacts: StructuredFact[];
  sections: ArticleSection[];
}

export interface DashboardStats {
  articlesAnalyzed: number;
  factsCompared: number;
  matches: number;
  possibleMismatches: number;
  reviewRequired: number;
  insufficientEvidence: number;
  humanReviewsCompleted: number;
  recentFlaggedCases: ComparisonResult[];
  recentArticles: { identifier: string; name: string; factCount: number; mismatchCount: number }[];
}

export interface ComparisonReport {
  generatedAt: string;
  article: {
    identifier: string;
    name: string;
    url: string;
    dateModified: string;
    categories: string[];
  };
  datasetInfo: {
    source: string;
    schemaVersion: string;
    recordId: string;
  };
  summary: {
    totalFacts: number;
    matches: number;
    possibleMismatches: number;
    reviewRequired: number;
    insufficientEvidence: number;
    reviewedCount: number;
  };
  findings: ComparisonResult[];
  methodology: {
    layers: string[];
    normalizationRules: string[];
    confidenceScoring: string;
  };
  responsibleAiNotice: string;
  limitations: string[];
}
