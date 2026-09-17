import express, { Request, Response } from 'express';
import { WikimediaDatasetAdapter } from '../server/services/dataset/wikimediaAdapter.js';
import { ComparisonEngine } from '../server/services/comparison/engine.js';
import { ReviewStore } from '../server/services/review/reviewStore.js';
import { createApiRouter } from '../server/routes/api.js';

const app = express();
app.use(express.json({ limit: '10mb' }));

const datasetAdapter = new WikimediaDatasetAdapter();
const comparisonEngine = new ComparisonEngine();
const reviewStore = new ReviewStore();

const apiRouter = createApiRouter(datasetAdapter, comparisonEngine, reviewStore);

// Mount router on both /api and root to handle various rewrite structures
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Vercel Serverless Function entry point
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
