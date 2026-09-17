import { Router, Request, Response } from 'express';
import { WikimediaDatasetAdapter } from '../services/dataset/wikimediaAdapter.js';
import { ComparisonEngine } from '../services/comparison/engine.js';
import { ReviewStore } from '../services/review/reviewStore.js';
import { ComparisonReport, DashboardStats } from '../types/index.js';

export function createApiRouter(
  datasetAdapter: WikimediaDatasetAdapter,
  comparisonEngine: ComparisonEngine,
  reviewStore: ReviewStore
): Router {
  const router = Router();

  // 1. Health check
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'WikiFact Lens Evidence Comparison API',
      timestamp: new Date().toISOString(),
      datasetArticlesLoaded: datasetAdapter.getRawArticleList().length
    });
  });

  // 2. Search articles
  router.get('/articles/search', (req: Request, res: Response) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = datasetAdapter.searchArticles(query);
    res.json({
      query,
      count: results.length,
      articles: results
    });
  });

  // 3. Get article overview
  router.get('/articles/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const article = datasetAdapter.getArticleOverview(id);
    if (!article) {
      res.status(404).json({ error: `Article "${id}" not found in provided Wikimedia dataset.` });
      return;
    }
    res.json(article);
  });

  // 4. Run comparison on all facts of an article
  router.get('/articles/:id/compare', async (req: Request, res: Response) => {
    const id = req.params.id;
    const raw = datasetAdapter.getArticleById(id);
    if (!raw) {
      res.status(404).json({ error: `Article "${id}" not found.` });
      return;
    }

    const facts = datasetAdapter.extractStructuredFacts(raw);
    const useAI = req.query.ai !== 'false';

    try {
      const results = await comparisonEngine.compareArticleFacts(raw, facts, useAI);

      // Attach any existing human reviews
      for (const item of results) {
        const rev = reviewStore.getReview(item.factId);
        if (rev) {
          item.humanReview = rev;
        }
      }

      reviewStore.cacheArticleComparisons(String(raw.identifier), results);
      res.json({
        articleId: String(raw.identifier),
        articleTitle: raw.name,
        totalFacts: facts.length,
        results
      });
    } catch (err: any) {
      console.error('[API /compare] Comparison failed:', err);
      res.status(500).json({ error: 'Internal comparison engine error', details: err.message });
    }
  });

  // 5. Compare single fact on demand
  router.post('/articles/:id/compare-fact', async (req: Request, res: Response) => {
    const id = req.params.id;
    const { factId, useAI } = req.body;
    const raw = datasetAdapter.getArticleById(id);
    if (!raw) {
      res.status(404).json({ error: `Article "${id}" not found.` });
      return;
    }

    const facts = datasetAdapter.extractStructuredFacts(raw);
    const targetFact = facts.find(f => f.id === factId);
    if (!targetFact) {
      res.status(404).json({ error: `Fact "${factId}" not found in article infoboxes.` });
      return;
    }

    try {
      const singleList = await comparisonEngine.compareArticleFacts(raw, [targetFact], useAI !== false);
      const resItem = singleList[0];
      const rev = reviewStore.getReview(resItem.factId);
      if (rev) resItem.humanReview = rev;
      res.json(resItem);
    } catch (err: any) {
      res.status(500).json({ error: 'Single fact comparison failed', details: err.message });
    }
  });

  // 6. Review Queue - list findings across articles
  router.get('/reviews', async (req: Request, res: Response) => {
    // Ensure all articles in dataset have been compared into cache
    const articles = datasetAdapter.getRawArticleList();
    for (const art of articles) {
      const idStr = String(art.identifier);
      if (!reviewStore.getCachedComparisons(idStr)) {
        const facts = datasetAdapter.extractStructuredFacts(art);
        const results = await comparisonEngine.compareArticleFacts(art, facts, false);
        for (const item of results) {
          const rev = reviewStore.getReview(item.factId);
          if (rev) item.humanReview = rev;
        }
        reviewStore.cacheArticleComparisons(idStr, results);
      }
    }

    let all = reviewStore.getAllCachedComparisons();

    // Re-attach latest review statuses
    for (const item of all) {
      const rev = reviewStore.getReview(item.factId);
      if (rev) item.humanReview = rev;
    }

    const statusFilter = req.query.status as string;
    if (statusFilter && statusFilter !== 'ALL') {
      all = all.filter(item => item.status === statusFilter);
    }

    const reviewStatusFilter = req.query.reviewStatus as string;
    if (reviewStatusFilter === 'PENDING') {
      all = all.filter(item => !item.humanReview);
    } else if (reviewStatusFilter && reviewStatusFilter !== 'ALL') {
      all = all.filter(item => item.humanReview?.decision === reviewStatusFilter);
    }

    res.json({
      total: all.length,
      items: all
    });
  });

  // 7. Submit human review decision
  router.post('/reviews/:factId', (req: Request, res: Response) => {
    const factId = req.params.factId;
    const { decision, notes } = req.body;

    if (!decision || !['CONFIRMED_MATCH', 'NEEDS_HUMAN_REVIEW', 'NOT_COMPARABLE', 'FALSE_POSITIVE'].includes(decision)) {
      res.status(400).json({
        error: 'Invalid review decision. Allowed values: CONFIRMED_MATCH, NEEDS_HUMAN_REVIEW, NOT_COMPARABLE, FALSE_POSITIVE.'
      });
      return;
    }

    const record = reviewStore.recordReview(factId, decision, notes);

    // Update in cached comparisons if present
    const allCached = reviewStore.getAllCachedComparisons();
    for (const c of allCached) {
      if (c.factId === factId) {
        c.humanReview = record;
      }
    }

    res.json({ success: true, record });
  });

  // 8. Dynamic Dashboard Stats
  router.get('/stats', async (req: Request, res: Response) => {
    // Ensure dataset is cached
    const articles = datasetAdapter.getRawArticleList();
    for (const art of articles) {
      const idStr = String(art.identifier);
      if (!reviewStore.getCachedComparisons(idStr)) {
        const facts = datasetAdapter.extractStructuredFacts(art);
        const results = await comparisonEngine.compareArticleFacts(art, facts, false);
        for (const item of results) {
          const rev = reviewStore.getReview(item.factId);
          if (rev) item.humanReview = rev;
        }
        reviewStore.cacheArticleComparisons(idStr, results);
      }
    }

    const all = reviewStore.getAllCachedComparisons();
    const matches = all.filter(i => i.status === 'MATCH').length;
    const possibleMismatches = all.filter(i => i.status === 'POSSIBLE_MISMATCH').length;
    const reviewRequired = all.filter(i => i.status === 'REVIEW_REQUIRED').length;
    const insufficientEvidence = all.filter(i => i.status === 'NO_TEXTUAL_EVIDENCE' || i.status === 'INSUFFICIENT_DATA').length;
    const humanReviews = reviewStore.getAllReviews().size;

    const recentFlagged = all
      .filter(i => i.status === 'POSSIBLE_MISMATCH' || i.status === 'REVIEW_REQUIRED')
      .slice(0, 6);

    const recentArticles = articles.map(art => {
      const idStr = String(art.identifier);
      const cached = reviewStore.getCachedComparisons(idStr) || [];
      const mm = cached.filter(c => c.status === 'POSSIBLE_MISMATCH').length;
      return {
        identifier: idStr,
        name: art.name,
        factCount: cached.length,
        mismatchCount: mm
      };
    });

    const stats: DashboardStats = {
      articlesAnalyzed: articles.length,
      factsCompared: all.length,
      matches,
      possibleMismatches,
      reviewRequired,
      insufficientEvidence,
      humanReviewsCompleted: humanReviews,
      recentFlaggedCases: recentFlagged,
      recentArticles
    };

    res.json(stats);
  });

  // 9. Generate Audit Report
  router.get('/reports/:articleId', async (req: Request, res: Response) => {
    const id = req.params.articleId;
    const raw = datasetAdapter.getArticleById(id);
    if (!raw) {
      res.status(404).json({ error: `Article "${id}" not found.` });
      return;
    }

    let results = reviewStore.getCachedComparisons(String(raw.identifier));
    if (!results) {
      const facts = datasetAdapter.extractStructuredFacts(raw);
      results = await comparisonEngine.compareArticleFacts(raw, facts, false);
      for (const item of results) {
        const rev = reviewStore.getReview(item.factId);
        if (rev) item.humanReview = rev;
      }
      reviewStore.cacheArticleComparisons(String(raw.identifier), results);
    }

    const matches = results.filter(i => i.status === 'MATCH').length;
    const possibleMismatches = results.filter(i => i.status === 'POSSIBLE_MISMATCH').length;
    const reviewRequired = results.filter(i => i.status === 'REVIEW_REQUIRED').length;
    const insufficient = results.filter(i => i.status === 'NO_TEXTUAL_EVIDENCE' || i.status === 'INSUFFICIENT_DATA').length;
    const reviewedCount = results.filter(i => !!i.humanReview).length;

    const report: ComparisonReport = {
      generatedAt: new Date().toISOString(),
      article: {
        identifier: String(raw.identifier),
        name: raw.name,
        url: raw.url,
        dateModified: raw.date_modified || '',
        categories: raw.categories ? raw.categories.map(c => c.name) : []
      },
      datasetInfo: {
        source: 'Wikimedia Enterprise Structured Wikipedia Dataset (JSON/Parquet compatible schema)',
        schemaVersion: '2024.1-structured',
        recordId: String(raw.identifier)
      },
      summary: {
        totalFacts: results.length,
        matches,
        possibleMismatches,
        reviewRequired,
        insufficientEvidence: insufficient,
        reviewedCount
      },
      findings: results,
      methodology: {
        layers: [
          'Layer 1: Exact canonical string and case-insensitive comparison',
          'Layer 2: Semantic substring containment and entity synonym matching',
          'Layer 3: Named entity type categorization (Person, Location, Organization, Date)',
          'Layer 4: Specialized domain normalization (Chronological ISO/DMY/MDY date parsing, Location hierarchy checking)',
          'Layer 5: Evidence confidence scoring (0-100) weighting extraction exactness, sentence context, and conflict detection'
        ],
        normalizationRules: [
          'ISO 8601 & standard chronological date conversion',
          'Punctuation and citation tag [n] stripping',
          'Aristocratic title and honorific filtering for named entities',
          'Administrative geographical hierarchy containment'
        ],
        confidenceScoring: 'Calculated based on exactness, entity type accuracy, normalization confidence, and conflicting sentence penalties.'
      },
      responsibleAiNotice: 'WikiFact Lens identifies possible inconsistencies between structured data and article text. A detected difference is not proof that either value is incorrect. Findings require human verification.',
      limitations: [
        'Articles with complex prose or metaphoric references may require manual review.',
        'Tables or templates outside of primary Infoboxes may contain additional context not captured in the current schema tree.',
        'Dates in Julian vs Gregorian calendar formats during transitional eras may display apparent numeric differences requiring historical domain expertise.'
      ]
    };

    res.json(report);
  });

  // 10. Ingest custom Wikimedia Enterprise article
  router.post('/articles/import', (req: Request, res: Response) => {
    const rawArticle = req.body;
    if (!rawArticle || !rawArticle.name || !rawArticle.identifier) {
      res.status(400).json({ error: 'Invalid article object. Must include name and identifier fields conforming to Wikimedia schema.' });
      return;
    }
    datasetAdapter.ingestArticle(rawArticle);
    res.json({
      success: true,
      message: `Imported article "${rawArticle.name}" (ID: ${rawArticle.identifier}) into active dataset repository.`,
      article: datasetAdapter.getArticleOverview(String(rawArticle.identifier))
    });
  });

  return router;
}
