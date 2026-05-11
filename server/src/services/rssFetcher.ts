import RssParser from 'rss-parser';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { prisma } from '../index.js';

const parser = new RssParser();

// Site-specific content selectors for extracting article body
const SITE_SELECTORS: Record<string, string> = {
  'bbc.co.uk': 'article [data-component="text-block"]',
  'bbc.com': 'article [data-component="text-block"]',
  'theguardian.com': 'article .article-body-commercial-selector p',
  'technologyreview.com': 'div[class*="body"] p',
  'theatlantic.com': 'div[class*="ArticleBody"] p',
  'scientificamerican.com': 'div[class*="article-body"] p',
  'aeon.co': 'div[class*="article-body"] p',
};

function getSiteSelector(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    for (const [site, selector] of Object.entries(SITE_SELECTORS)) {
      if (hostname.includes(site)) return selector;
    }
  } catch {}
  return null;
}

async function extractArticleContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SCornerBot/1.0; +https://s-corner.local)',
      },
    });

    const $ = cheerio.load(response.data);

    // Try site-specific selector
    const selector = getSiteSelector(url);
    if (selector) {
      const paragraphs: string[] = [];
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) paragraphs.push(text);
      });
      if (paragraphs.length > 0) return paragraphs.join('\n\n');
    }

    // Fallback: generic article content extraction
    // Remove script, style, nav, header, footer
    $('script, style, nav, header, footer, aside, [role="navigation"], [role="banner"]').remove();

    // Try common article containers
    const containerSelectors = ['article', 'main', '[role="main"]', '.post-content', '.entry-content'];
    for (const sel of containerSelectors) {
      const paragraphs: string[] = [];
      $(sel).find('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 30) paragraphs.push(text);
      });
      if (paragraphs.length >= 3) return paragraphs.join('\n\n');
    }

    // Last resort: all <p> tags
    const allParagraphs: string[] = [];
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 40) allParagraphs.push(text);
    });

    return allParagraphs.slice(0, 20).join('\n\n');
  } catch (error) {
    console.error(`Failed to extract content from ${url}:`, error);
    return '';
  }
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);
}

export async function fetchFeed(feed: { id: string; url: string; category: string; name: string }) {
  const parsed = await parser.parseURL(feed.url);
  let fetched = 0;
  let skipped = 0;

  for (const item of (parsed.items || []).slice(0, 10)) {
    if (!item.title || !item.link) {
      skipped++;
      continue;
    }

    // Check if already exists
    const existing = await prisma.article.findFirst({
      where: { sourceUrl: item.link },
    });

    if (existing) {
      skipped++;
      continue;
    }

    try {
      // Extract full article content
      const content = await extractArticleContent(item.link);
      const paragraphTexts = content ? splitIntoParagraphs(content) : [];

      const article = await prisma.article.create({
        data: {
          title: item.title,
          content: content || item.contentSnippet || item.content || '',
          source: feed.name,
          sourceUrl: item.link,
          author: item.creator || item.author || null,
          category: feed.category,
          difficulty: 'medium',
          tags: '[]',
          isFromRss: true,
          rssFeedId: feed.id,
          status: 'draft',
          publishedAt: item.pubDate ? new Date(item.pubDate) : null,
          paragraphs: {
            create: paragraphTexts.map((text, i) => ({
              index: i,
              originalText: text,
            })),
          },
        },
      });

      fetched++;
      console.log(`  ✓ Fetched: ${article.title}`);
    } catch (error) {
      console.error(`  ✗ Failed to process: ${item.title}`, error);
      skipped++;
    }
  }

  return { fetched, skipped };
}
