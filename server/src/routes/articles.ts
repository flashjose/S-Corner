import { Router } from 'express';
import { prisma } from '../index.js';

export const articlesRouter = Router();

// GET /api/articles - List articles with filtering
articlesRouter.get('/', async (req, res) => {
  try {
    const { category, difficulty, status, source, isFromRss, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (status) where.status = status;
    if (source) where.source = source;
    if (isFromRss !== undefined) where.isFromRss = isFromRss === 'true';

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          _count: { select: { paragraphs: true, annotations: true } },
          progress: { select: { lastParagraph: true, isCompleted: true, timeSpent: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.article.count({ where }),
    ]);

    res.json({ articles, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// GET /api/articles/:id - Get single article with paragraphs
articlesRouter.get('/:id', async (req, res) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: req.params.id },
      include: {
        paragraphs: { orderBy: { index: 'asc' } },
        annotations: true,
        progress: true,
      },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// POST /api/articles - Create article manually
articlesRouter.post('/', async (req, res) => {
  try {
    const { title, content, source, sourceUrl, author, category, difficulty, tags, paragraphs } = req.body;

    const article = await prisma.article.create({
      data: {
        title,
        content,
        source,
        sourceUrl,
        author,
        category: category || 'news',
        difficulty: difficulty || 'medium',
        tags: JSON.stringify(tags || []),
        status: 'published',
        paragraphs: {
          create: (paragraphs || []).map((p: any, i: number) => ({
            index: i,
            originalText: p.originalText,
            chineseTranslation: p.chineseTranslation,
            grammaticalAnalysis: p.grammaticalAnalysis,
            expressionTips: p.expressionTips,
          })),
        },
      },
      include: { paragraphs: true },
    });

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// PUT /api/articles/:id - Update article
articlesRouter.put('/:id', async (req, res) => {
  try {
    const { title, content, source, sourceUrl, author, category, difficulty, tags, status } = req.body;

    const article = await prisma.article.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(source !== undefined && { source }),
        ...(sourceUrl !== undefined && { sourceUrl }),
        ...(author !== undefined && { author }),
        ...(category !== undefined && { category }),
        ...(difficulty !== undefined && { difficulty }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(status !== undefined && { status }),
      },
    });

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// DELETE /api/articles/:id
articlesRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.article.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// POST /api/articles/:id/paragraphs - Add/update paragraphs
articlesRouter.post('/:id/paragraphs', async (req, res) => {
  try {
    const { paragraphs } = req.body;
    const articleId = req.params.id;

    // Delete existing paragraphs and recreate
    await prisma.paragraph.deleteMany({ where: { articleId } });

    const created = await prisma.paragraph.createMany({
      data: paragraphs.map((p: any, i: number) => ({
        articleId,
        index: i,
        originalText: p.originalText,
        chineseTranslation: p.chineseTranslation,
        grammaticalAnalysis: p.grammaticalAnalysis,
        expressionTips: p.expressionTips,
      })),
    });

    res.json({ count: created.count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update paragraphs' });
  }
});
