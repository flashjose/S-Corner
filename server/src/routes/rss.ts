import { Router } from 'express';
import { prisma } from '../index.js';
import { fetchFeed } from '../services/rssFetcher.js';

export const rssRouter = Router();

// GET /api/rss/feeds - List all RSS feeds
rssRouter.get('/feeds', async (_req, res) => {
  try {
    const feeds = await prisma.rssFeed.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch RSS feeds' });
  }
});

// POST /api/rss/feeds - Add RSS feed
rssRouter.post('/feeds', async (req, res) => {
  try {
    const { name, url, category } = req.body;

    const existing = await prisma.rssFeed.findUnique({ where: { url } });
    if (existing) {
      return res.status(409).json({ error: 'Feed URL already exists' });
    }

    const feed = await prisma.rssFeed.create({
      data: { name, url, category: category || 'news' },
    });

    res.status(201).json(feed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create RSS feed' });
  }
});

// PUT /api/rss/feeds/:id - Update RSS feed
rssRouter.put('/feeds/:id', async (req, res) => {
  try {
    const { name, url, category, isActive } = req.body;

    const feed = await prisma.rssFeed.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(feed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update RSS feed' });
  }
});

// DELETE /api/rss/feeds/:id
rssRouter.delete('/feeds/:id', async (req, res) => {
  try {
    await prisma.rssFeed.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete RSS feed' });
  }
});

// POST /api/rss/feeds/:id/fetch - Manually trigger RSS fetch
rssRouter.post('/feeds/:id/fetch', async (req, res) => {
  try {
    const feed = await prisma.rssFeed.findUnique({ where: { id: req.params.id } });
    if (!feed) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    const result = await fetchFeed(feed);

    await prisma.rssFeed.update({
      where: { id: feed.id },
      data: { lastFetchedAt: new Date() },
    });

    res.json({ fetched: result.fetched, skipped: result.skipped });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch feed: ${error.message}` });
  }
});
