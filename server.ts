import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { WikimediaDatasetAdapter } from './server/services/dataset/wikimediaAdapter.js';
import { ComparisonEngine } from './server/services/comparison/engine.js';
import { ReviewStore } from './server/services/review/reviewStore.js';
import { createApiRouter } from './server/routes/api.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const datasetAdapter = new WikimediaDatasetAdapter();
  const comparisonEngine = new ComparisonEngine();
  const reviewStore = new ReviewStore();

  // Mount API routes FIRST
  app.use('/api', createApiRouter(datasetAdapter, comparisonEngine, reviewStore));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WikiFact Lens server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
