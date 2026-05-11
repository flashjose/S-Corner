import { Router } from 'express';
import { prisma } from '../index.js';

export const progressRouter = Router();

// GET /api/progress/:articleId - Get reading progress for an article
progressRouter.get('/:articleId', async (req, res) => {
  try {
    const progress = await prisma.readingProgress.findUnique({
      where: { articleId: req.params.articleId },
    });
    res.json(progress || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// PUT /api/progress/:articleId - Update reading progress
progressRouter.put('/:articleId', async (req, res) => {
  try {
    const { lastParagraph, totalParagraphs, timeSpent, isCompleted } = req.body;

    const progress = await prisma.readingProgress.upsert({
      where: { articleId: req.params.articleId },
      create: {
        articleId: req.params.articleId,
        lastParagraph: lastParagraph || 0,
        totalParagraphs: totalParagraphs || 0,
        timeSpent: timeSpent || 0,
        isCompleted: isCompleted || false,
      },
      update: {
        ...(lastParagraph !== undefined && { lastParagraph }),
        ...(totalParagraphs !== undefined && { totalParagraphs }),
        ...(timeSpent !== undefined && { timeSpent }),
        ...(isCompleted !== undefined && { isCompleted }),
        lastReadAt: new Date(),
      },
    });

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});
