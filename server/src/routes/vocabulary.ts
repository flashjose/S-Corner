import { Router } from 'express';
import { prisma } from '../index.js';

export const vocabularyRouter = Router();

// GET /api/vocabulary - List vocabulary with search/filter
vocabularyRouter.get('/', async (req, res) => {
  try {
    const { search, masteryLevel, sourceArticleId, page = '1', limit = '50' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { word: { contains: String(search) } },
        { chineseDefinition: { contains: String(search) } },
      ];
    }
    if (masteryLevel !== undefined) where.masteryLevel = Number(masteryLevel);
    if (sourceArticleId) where.sourceArticleId = sourceArticleId;

    const [vocabularies, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.vocabulary.count({ where }),
    ]);

    res.json({ vocabularies, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// POST /api/vocabulary - Add word to vocabulary
vocabularyRouter.post('/', async (req, res) => {
  try {
    const { word, pronunciation, definition, chineseDefinition, example, sourceArticleId } = req.body;

    // Check if word already exists
    const existing = await prisma.vocabulary.findFirst({
      where: { word: word.toLowerCase().trim() },
    });

    if (existing) {
      return res.json({ ...existing, message: 'Word already exists' });
    }

    const vocabulary = await prisma.vocabulary.create({
      data: {
        word: word.toLowerCase().trim(),
        pronunciation,
        definition,
        chineseDefinition,
        example,
        sourceArticleId,
      },
    });

    res.status(201).json(vocabulary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add vocabulary' });
  }
});

// PUT /api/vocabulary/:id - Update vocabulary
vocabularyRouter.put('/:id', async (req, res) => {
  try {
    const { pronunciation, definition, chineseDefinition, example, masteryLevel } = req.body;

    const vocabulary = await prisma.vocabulary.update({
      where: { id: req.params.id },
      data: {
        ...(pronunciation !== undefined && { pronunciation }),
        ...(definition !== undefined && { definition }),
        ...(chineseDefinition !== undefined && { chineseDefinition }),
        ...(example !== undefined && { example }),
        ...(masteryLevel !== undefined && { masteryLevel }),
      },
    });

    res.json(vocabulary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vocabulary' });
  }
});

// DELETE /api/vocabulary/:id
vocabularyRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.vocabulary.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vocabulary' });
  }
});
