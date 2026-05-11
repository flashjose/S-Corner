import cron from 'node-cron';
import { prisma } from '../index.js';
import { fetchFeed } from './rssFetcher.js';

export function startScheduler() {
  // Fetch all active RSS feeds every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Scheduled RSS fetch started...');

    const activeFeeds = await prisma.rssFeed.findMany({
      where: { isActive: true },
    });

    for (const feed of activeFeeds) {
      try {
        console.log(`Fetching: ${feed.name}`);
        const result = await fetchFeed(feed);

        await prisma.rssFeed.update({
          where: { id: feed.id },
          data: { lastFetchedAt: new Date() },
        });

        console.log(`  → ${feed.name}: fetched ${result.fetched}, skipped ${result.skipped}`);
      } catch (error) {
        console.error(`  ✗ Failed to fetch ${feed.name}:`, error);
      }
    }

    console.log('⏰ Scheduled RSS fetch completed.');
  });

  console.log('⏰ RSS scheduler started (every 6 hours)');
}
