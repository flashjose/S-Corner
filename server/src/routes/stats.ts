import { Router } from 'express';
import { prisma } from '../index.js';

export const statsRouter = Router();

// GET /api/stats - Aggregated learning statistics
statsRouter.get('/', async (_req, res) => {
  try {
    const [
      totalArticles,
      publishedArticles,
      totalVocabulary,
      totalAnnotations,
      allProgress,
    ] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: 'published' } }),
      prisma.vocabulary.count(),
      prisma.annotation.count(),
      prisma.readingProgress.findMany({
        select: { timeSpent: true, isCompleted: true, lastReadAt: true },
      }),
    ]);

    const totalTimeSpent = allProgress.reduce((sum, p) => sum + p.timeSpent, 0);
    const completedArticles = allProgress.filter((p) => p.isCompleted).length;

    // Learning activity by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProgress = allProgress.filter(
      (p) => new Date(p.lastReadAt) >= thirtyDaysAgo
    );

    // Group by date
    const activityByDate: Record<string, number> = {};
    recentProgress.forEach((p) => {
      const date = new Date(p.lastReadAt).toISOString().split('T')[0];
      activityByDate[date] = (activityByDate[date] || 0) + p.timeSpent;
    });

    // Vocabulary mastery distribution
    const vocabDistribution = await prisma.vocabulary.groupBy({
      by: ['masteryLevel'],
      _count: { id: true },
    });

    res.json({
      totalArticles,
      publishedArticles,
      totalVocabulary,
      totalAnnotations,
      totalTimeSpent,
      completedArticles,
      activityByDate,
      vocabularyMastery: vocabDistribution.map((v) => ({
        level: v.masteryLevel,
        count: v._count.id,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
