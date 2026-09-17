import {
  DashboardStats,
  ArticleOverview,
  ComparisonResult,
  HumanReviewDecision,
  HumanReviewRecord,
  ComparisonReport,
  RawWikimediaArticle
} from '../types/index.js';
import { clientDataService } from './clientDataService.js';

let isOfflineOrClientOnly = false;

async function tryFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  if (isOfflineOrClientOnly && !url.includes('/api/health')) {
    // Already in client-side fallback mode
    return null;
  }

  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json() as T;
    }
    // If Vercel or static hosting returned index.html (content-type text/html) or 404:
    console.warn(`[WikiFactLens API] Endpoint ${url} returned ${res.status} (${contentType}). Activating client-side data engine.`);
    isOfflineOrClientOnly = true;
    return null;
  } catch (err) {
    console.warn(`[WikiFactLens API] Network request to ${url} failed. Activating client-side data engine.`);
    isOfflineOrClientOnly = true;
    return null;
  }
}

export const apiClient = {
  async getDashboardStats(): Promise<DashboardStats> {
    const remote = await tryFetchJson<DashboardStats>('/api/stats');
    if (remote) return remote;
    return clientDataService.getDashboardStats();
  },

  async searchArticles(query: string = ''): Promise<Array<{
    identifier: string;
    name: string;
    url: string;
    abstract: string;
    categoryCount: number;
    factCount: number;
  }>> {
    const remote = await tryFetchJson<{ articles: any[] }>(`/api/articles/search?q=${encodeURIComponent(query)}`);
    if (remote && remote.articles) {
      return remote.articles;
    }
    return clientDataService.searchArticles(query);
  },

  async getArticleOverview(id: string): Promise<ArticleOverview | null> {
    const remote = await tryFetchJson<ArticleOverview>(`/api/articles/${id}`);
    if (remote) return remote;
    return clientDataService.getArticleOverview(id);
  },

  async compareArticle(
    id: string,
    useAI: boolean = false
  ): Promise<{ articleId: string; articleTitle: string; totalFacts: number; results: ComparisonResult[] }> {
    const remote = await tryFetchJson<{
      articleId: string;
      articleTitle: string;
      totalFacts: number;
      results: ComparisonResult[];
    }>(`/api/articles/${id}/compare?ai=${useAI}`);
    if (remote && remote.results) {
      return remote;
    }

    const localResults = clientDataService.compareArticleFacts(id, useAI);
    const raw = clientDataService.getArticleById(id);
    return {
      articleId: id,
      articleTitle: raw ? raw.name : 'Wikipedia Article',
      totalFacts: localResults.length,
      results: localResults
    };
  },

  async compareFact(articleId: string, factId: string, useAI: boolean = false): Promise<ComparisonResult> {
    const remote = await tryFetchJson<ComparisonResult>(`/api/articles/${articleId}/compare-fact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factId, useAI })
    });
    if (remote) return remote;

    const all = clientDataService.compareArticleFacts(articleId, useAI);
    const target = all.find(f => f.factId === factId);
    if (target) return target;
    throw new Error('Fact not found in article');
  },

  async getReviews(
    status: string = 'ALL',
    reviewStatus: string = 'ALL'
  ): Promise<{ total: number; items: ComparisonResult[] }> {
    const remote = await tryFetchJson<{ total: number; items: ComparisonResult[] }>(
      `/api/reviews?status=${encodeURIComponent(status)}&reviewStatus=${encodeURIComponent(reviewStatus)}`
    );
    if (remote && remote.items) {
      return remote;
    }
    return clientDataService.getReviews(status, reviewStatus);
  },

  async submitReview(
    factId: string,
    decision: HumanReviewDecision,
    notes?: string
  ): Promise<{ success: boolean; record: HumanReviewRecord }> {
    const remote = await tryFetchJson<{ success: boolean; record: HumanReviewRecord }>(`/api/reviews/${factId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes })
    });
    if (remote) return remote;

    const rec = clientDataService.recordReview(factId, decision, notes);
    return { success: true, record: rec };
  },

  async getReport(articleId: string): Promise<ComparisonReport> {
    const remote = await tryFetchJson<ComparisonReport>(`/api/reports/${articleId}`);
    if (remote) return remote;

    const report = clientDataService.getReport(articleId);
    if (report) return report;
    throw new Error(`Could not generate report for article ${articleId}`);
  },

  async importArticle(rawArticle: RawWikimediaArticle): Promise<{
    success: boolean;
    message: string;
    identifier: string;
    name: string;
  }> {
    const remote = await tryFetchJson<{
      success: boolean;
      message: string;
      identifier: string;
      name: string;
    }>('/api/articles/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rawArticle)
    });
    if (remote) return remote;

    return clientDataService.ingestArticle(rawArticle);
  }
};
