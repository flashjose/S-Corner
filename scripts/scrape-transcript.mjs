/**
 * Scrape listening transcripts via Playwright (CET4/CET6).
 *
 * Requires an authenticated session on zhenti.burningvocabulary.cn for most papers.
 *
 * Usage:
 *   node scripts/scrape-transcript.mjs
 *   node scripts/scrape-transcript.mjs cet4/2025-12/01
 *
 * Env:
 *   ZTHENTI_STORAGE_STATE  path to Playwright storageState JSON (logged-in session)
 *
 * Output: merges into scripts/listening_content.json (transcript field)
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LISTENING_EXAM_PAGES } from './listening-exam-pages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_JSON = path.join(__dirname, 'listening_content.json');
const DEFAULT_STORAGE = path.join(__dirname, '.zhenti-storage.json');
const STORAGE_STATE = process.env.ZTHENTI_STORAGE_STATE || DEFAULT_STORAGE;

const EXAM_PAGES = LISTENING_EXAM_PAGES;

function htmlToPlainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function scrapeTranscript(page, url) {
  const apiPayload = { code: null, data: null };
  page.on('response', async (res) => {
    if (!res.url().includes('/api/listening/textGet')) return;
    try {
      apiPayload.data = await res.json();
      apiPayload.code = res.status();
    } catch {
      /* ignore */
    }
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // 解锁答案区域（与 scrape_answers 一致）
  await page.evaluate(() => {
    const btn = document.querySelector('.answer_btn.has');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  // 等待 OpenPlayer 听力控件
  const listenBtn = page.locator('[data-op-control="listenin_text"], button[title="听力原文"]').first();
  const hasBtn = await listenBtn.count();
  if (!hasBtn) {
    return { error: '听力原文 button not found (no listening on page?)' };
  }

  await listenBtn.click();
  await page.waitForTimeout(500);

  // 等待原文面板
  try {
    await page.waitForSelector('.listening_text_box.show .content_body', { timeout: 15000 });
  } catch {
    if (apiPayload.data?.code && apiPayload.data.code !== '0000') {
      return { error: apiPayload.data.msg || `API code ${apiPayload.data.code}` };
    }
    return { error: 'listening text panel did not open (login/premium may be required)' };
  }

  const html = await page.locator('.listening_text_box.show .content_body').innerHTML();
  const transcript = htmlToPlainText(html);
  if (!transcript) {
    return { error: 'empty transcript content' };
  }
  return { transcript };
}

function loadExistingJson() {
  if (!fs.existsSync(OUTPUT_JSON)) return { papers: [] };
  return JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf-8'));
}

function upsertPaper(papers, item) {
  const idx = papers.findIndex((p) => p.categorySlug === item.categorySlug && p.slug === item.slug);
  if (idx >= 0) {
    papers[idx] = { ...papers[idx], ...item };
  } else {
    papers.push(item);
  }
}

async function main() {
  const filter = process.argv[2];
  let pages = EXAM_PAGES;
  if (filter) {
    const [cat, ...rest] = filter.split('/');
    const slug = rest.join('/');
    pages = EXAM_PAGES.filter((p) => p.category === cat && p.slug === slug);
    if (!pages.length) {
      console.error(`No exam matched: ${filter}`);
      process.exit(1);
    }
  }

  if (!fs.existsSync(STORAGE_STATE)) {
    console.error(`No session file: ${STORAGE_STATE}`);
    console.error('Run: node scripts/save-zhenti-session.mjs  (log in in the browser, then press Enter)');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();
  const store = loadExistingJson();

  for (const exam of pages) {
    console.log(`[${exam.category}/${exam.slug}] ${exam.url}`);
    try {
      const result = await scrapeTranscript(page, exam.url);
      if (result.error) {
        console.warn(`  ⚠ ${result.error}`);
      } else {
        upsertPaper(store.papers, {
          categorySlug: exam.category,
          slug: exam.slug,
          transcript: result.transcript,
        });
        console.log(`  ✓ transcript (${result.transcript.length} chars)`);
      }
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
    }
    await page.waitForTimeout(500);
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(store, null, 2), 'utf-8');
  console.log(`\nUpdated ${OUTPUT_JSON}`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
