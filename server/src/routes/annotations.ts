import { Router } from 'express';
import { prisma } from '../index.js';

export const annotationsRouter = Router();

// GET /api/annotations/:articleId - Get annotations for an article
annotationsRouter.get('/:articleId', async (req, res) => {
  try {
    const annotations = await prisma.annotation.findMany({
      where: { articleId: req.params.articleId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(annotations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch annotations' });
  }
});

// POST /api/annotations - Create annotation
annotationsRouter.post('/', async (req, res) => {
  try {
    const { articleId, paragraphId, startOffset, endOffset, selectedText, translation, note, color } = req.body;

    const annotation = await prisma.annotation.create({
      data: {
        articleId,
        paragraphId,
        startOffset,
        endOffset,
        selectedText,
        translation,
        note,
        color,
      },
    });

    res.status(201).json(annotation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create annotation' });
  }
});

// PUT /api/annotations/:id - Update annotation
annotationsRouter.put('/:id', async (req, res) => {
  try {
    const { translation, note, color } = req.body;

    const annotation = await prisma.annotation.update({
      where: { id: req.params.id },
      data: {
        ...(translation !== undefined && { translation }),
        ...(note !== undefined && { note }),
        ...(color !== undefined && { color }),
      },
    });

    res.json(annotation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update annotation' });
  }
});

// DELETE /api/annotations/:id
annotationsRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.annotation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete annotation' });
  }
});
