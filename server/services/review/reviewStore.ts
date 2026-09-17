import { HumanReviewDecision, HumanReviewRecord, ComparisonResult } from '../../types/index.js';

export class ReviewStore {
  private reviews: Map<string, HumanReviewRecord> = new Map();
  private comparisonsCache: Map<string, ComparisonResult[]> = new Map();

  constructor() {
    // Seed an initial demo human review for realistic interactive queue
    this.reviews.set('fact-874312-2', {
      decision: 'NEEDS_HUMAN_REVIEW',
      reviewedAt: new Date(Date.now() - 3600000).toISOString(),
      notes: 'Historical discrepancy confirmed between French crown patent letters (1549) and English secondary sources.'
    });
  }

  public recordReview(factId: string, decision: HumanReviewDecision, notes?: string): HumanReviewRecord {
    const record: HumanReviewRecord = {
      decision,
      reviewedAt: new Date().toISOString(),
      notes: notes?.trim()
    };
    this.reviews.set(factId, record);
    return record;
  }

  public getReview(factId: string): HumanReviewRecord | undefined {
    return this.reviews.get(factId);
  }

  public getAllReviews(): Map<string, HumanReviewRecord> {
    return this.reviews;
  }

  public cacheArticleComparisons(articleId: string, results: ComparisonResult[]): void {
    this.comparisonsCache.set(articleId, results);
  }

  public getCachedComparisons(articleId: string): ComparisonResult[] | undefined {
    return this.comparisonsCache.get(articleId);
  }

  public getAllCachedComparisons(): ComparisonResult[] {
    const all: ComparisonResult[] = [];
    for (const list of this.comparisonsCache.values()) {
      all.push(...list);
    }
    return all;
  }
}
