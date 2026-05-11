import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { articlesRouter } from './routes/articles.js';
import { vocabularyRouter } from './routes/vocabulary.js';
import { annotationsRouter } from './routes/annotations.js';
import { progressRouter } from './routes/progress.js';
import { rssRouter } from './routes/rss.js';
import { dictionaryRouter } from './routes/dictionary.js';
import { statsRouter } from './routes/stats.js';
import { startScheduler } from './services/scheduler.js';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/articles', articlesRouter);
app.use('/api/vocabulary', vocabularyRouter);
app.use('/api/annotations', annotationsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/rss', rssRouter);
app.use('/api/dictionary', dictionaryRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`S-Corner server running on http://localhost:${PORT}`);
  startScheduler();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
