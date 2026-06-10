/**
 * Scrape answers plus listening audio/transcript from zhenti.burningvocabulary.cn.
 *
 * Output:
 *   scripts/zhenti-content-import.json
 *   public/audio/{cet4|cet6}/{year-month-set}.mp3 when listening audio exists
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { chromium } from 'playwright';

const BASE_URL = 'https://zhenti.burningvocabulary.cn';
const AUDIO_VERSION = '20260409';
const LISTEN_PREFIX = 'ls2_';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const STORAGE_STATE =
  process.env.ZHENTI_STORAGE_STATE ||
  process.env.ZTHENTI_STORAGE_STATE ||
  path.join(__dirname, '.zhenti-storage.json');
const OUTPUT_JSON = path.join(__dirname, 'zhenti-content-import.json');
const AUDIO_DIR = path.join(ROOT, 'public', 'audio');
const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

const CATEGORIES = [
  {
    slug: 'cet4',
    pagePath: '/cet4',
    paperPattern: /^\/cet4\/\d{4}-\d{2}\/\d{2}$/,
    toPaper: (pathname) => ({
      categorySlug: 'cet4',
      slug: pathname.replace(/^\/cet4\//, ''),
    }),
  },
  {
    slug: 'cet6',
    pagePath: '/cet6',
    paperPattern: /^\/cet6\/\d{4}-\d{2}\/\d{2}$/,
    toPaper: (pathname) => ({
      categorySlug: 'cet6',
      slug: pathname.replace(/^\/cet6\//, ''),
    }),
  },
  {
    slug: 'kaoyan',
    pagePath: '/kaoyan',
    paperPattern: /^\/kaoyan\/\d{4}\/\d{2}$/,
    toPaper: (pathname) => {
      const [, , year, setId] = pathname.split('/');
      return { categorySlug: 'kaoyan', slug: `${year}-01/${setId}` };
    },
  },
];

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';

function normalizePathname(href) {
  try {
    return new URL(href, BASE_URL).pathname.replace(/\/$/, '');
  } catch {
    return '';
  }
}

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

function hashCfg({ filePath, label }) {
  const str = `listen-split-v2|${filePath || ''}|${label || ''}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  return {
    offset: (h % 500000) + 2048,
    xorMask: ((h >>> 7) % 1048576) + 4096,
    checksum: h % 1291,
  };
}

function decodeListeningSplitValue(id, { filePath, label }) {
  const raw = String(id || '');
  if (!raw.startsWith(LISTEN_PREFIX)) return null;
  const encoded = Number.parseInt(raw.slice(4), 36);
  if (!Number.isFinite(encoded)) return null;
  const cfg = hashCfg({ filePath, label });
  const ms = ((encoded - cfg.checksum) >>> 0 ^ cfg.xorMask) - cfg.offset;
  return Number.isFinite(ms) && ms >= 0 ? ms : null;
}

function normalizeLabel(key) {
  const q = key.match(/^Q(\d+)\.?$/i);
  if (q) return { label: q[1], type: 'question' };
  return { label: key, type: 'section' };
}

function buildAudioTimeline(globalConfig) {
  const splits = globalConfig?.newListenSpli;
  const filePath = globalConfig?.filePath;
  if (!splits || !filePath) return null;

  const segments = [];
  for (const [key, id] of Object.entries(splits)) {
    const startMs = decodeListeningSplitValue(id, { filePath, label: key });
    if (startMs == null) continue;
    segments.push({ ...normalizeLabel(key), startMs });
  }
  segments.sort((a, b) => a.startMs - b.startMs);
  if (!segments.length) return null;

  return {
    durationMs: Math.round(globalConfig.audioDuration || segments.at(-1).startMs + 60000),
    segments,
  };
}

function parseGlobalConfig(html) {
  const start = html.indexOf('var globalConfig = ');
  if (start < 0) return null;
  const jsonStart = start + 'var globalConfig = '.length;
  const end = html.indexOf('globalConfig.showed', jsonStart);
  if (end < 0) return null;
  try {
    return JSON.parse(html.slice(jsonStart, end).trim().replace(/;$/, ''));
  } catch {
    return null;
  }
}

function computeAudioHash(globalConfig) {
  const a2 = globalConfig?.an?.a2;
  const a3 = globalConfig?.an?.a3;
  if (!a2?.length || !a3?.length) return null;
  return a2.concat(a3).reverse().join('');
}

function buildRemoteAudioUrl(globalConfig) {
  const hash = computeAudioHash(globalConfig);
  if (!hash || !globalConfig.filePath) return null;
  const host = (globalConfig.pdfHost || 'https://res-zhenti.burningvocabulary.cn').replace(/\/$/, '');
  return `${host}/images/read/${globalConfig.filePath}/${hash}.mp3?v=${AUDIO_VERSION}`;
}

function localAudioPath(categorySlug, slug) {
  return `/audio/${categorySlug}/${slug.replace(/\//g, '-')}.mp3`;
}

function localAudioFile(categorySlug, slug) {
  return path.join(AUDIO_DIR, categorySlug, `${slug.replace(/\//g, '-')}.mp3`);
}

async function downloadAudio(url, destPath, referer) {
  await fsp.mkdir(path.dirname(destPath), { recursive: true });
  const response = await fetch(url, {
    headers: {
      Referer: referer,
      Origin: BASE_URL,
      'User-Agent': BROWSER_UA,
    },
  });
  if (!response.ok) throw new Error(`audio HTTP ${response.status}`);
  if (!response.body) throw new Error('audio response has no body');
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destPath));
}

async function discoverPaperPages(page, category) {
  await page.goto(`${BASE_URL}${category.pagePath}`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  });

  const links = await page.$$eval('a[href]', (anchors) =>
    anchors.map((anchor) => anchor.getAttribute('href')).filter(Boolean),
  );

  const paths = new Set();
  for (const link of links) {
    const pathname = normalizePathname(link);
    if (category.paperPattern.test(pathname)) {
      paths.add(pathname);
    }
  }
  return [...paths].sort((a, b) => b.localeCompare(a));
}

async function loadAppPaperKeys() {
  try {
    const categories = await fetch(`${API_BASE}/exam/categories`).then((res) => res.json());
    const keys = new Set();

    for (const category of categories) {
      const detail = await fetch(`${API_BASE}/exam/${category.slug}`).then((res) => res.json());
      for (const section of detail.sections || []) {
        for (const paper of section.papers || []) {
          keys.add(`${category.slug}|${paper.slug}`);
        }
      }
    }

    return keys;
  } catch (error) {
    console.warn(`Could not load app paper list from ${API_BASE}: ${error.message}`);
    return null;
  }
}

function loadStore() {
  if (!fs.existsSync(OUTPUT_JSON)) return { papers: [] };
  return JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf-8'));
}

function saveStore(store) {
  store.papers.sort((a, b) => `${a.categorySlug}/${a.slug}`.localeCompare(`${b.categorySlug}/${b.slug}`));
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(store, null, 2), 'utf-8');
}

function hasUsefulContent(paper) {
  return Boolean(paper.answers || paper.audioUrl || paper.transcript || paper.audioTimeline);
}

function upsertPaper(store, item) {
  const idx = store.papers.findIndex((paper) => paper.categorySlug === item.categorySlug && paper.slug === item.slug);
  if (idx >= 0) {
    store.papers[idx] = { ...store.papers[idx], ...item };
  } else {
    store.papers.push(item);
  }
}

async function scrapeAnswers(page) {
  await page.evaluate(() => {
    const btn = document.querySelector('.answer_btn.has');
    if (btn) btn.click();
  });
  await page.waitForTimeout(900);

  const answers = await page.evaluate(() => {
    const result = [];
    const tables = document.querySelectorAll('table');

    tables.forEach((table) => {
      const rows = table.querySelectorAll('tr');
      if (rows.length < 2) return;

      const answerCells = rows[0].querySelectorAll('td');
      const numberCells = rows[1].querySelectorAll('td');
      for (let i = 0; i < answerCells.length; i += 1) {
        const answer = answerCells[i]?.textContent?.trim();
        const number = numberCells[i]?.textContent?.trim();
        if (/^\d+$/.test(number || '') && answer) {
          result.push([number, answer]);
        }
      }
    });

    return result;
  });

  if (!answers.length) return null;
  return Object.fromEntries(answers);
}

async function scrapeTranscript(page) {
  const listenBtn = page.locator('[data-op-control="listenin_text"], button[title="听力原文"]').first();
  if ((await listenBtn.count()) === 0) return null;

  await listenBtn.click();
  await page.waitForTimeout(500);

  try {
    await page.waitForSelector('.listening_text_box.show .content_body', { timeout: 12_000 });
  } catch {
    return null;
  }

  const html = await page.locator('.listening_text_box.show .content_body').innerHTML();
  const text = htmlToPlainText(html);
  return text || null;
}

async function scrapePaper(page, paperPath, paper) {
  const url = `${BASE_URL}${paperPath}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(700);

  const html = await page.content();
  const globalConfig = parseGlobalConfig(html);
  const result = {
    categorySlug: paper.categorySlug,
    slug: paper.slug,
  };

  const answers = await scrapeAnswers(page);
  if (answers) result.answers = answers;

  const remoteAudioUrl = globalConfig ? buildRemoteAudioUrl(globalConfig) : null;
  if (remoteAudioUrl && ['cet4', 'cet6'].includes(paper.categorySlug)) {
    result.audioUrl = localAudioPath(paper.categorySlug, paper.slug);
    const destFile = localAudioFile(paper.categorySlug, paper.slug);
    if (!fs.existsSync(destFile)) {
      try {
        await downloadAudio(remoteAudioUrl, destFile, url);
      } catch (error) {
        result.audioDownloadError = error.message;
      }
    }
  }

  const audioTimeline = globalConfig ? buildAudioTimeline(globalConfig) : null;
  if (audioTimeline) result.audioTimeline = audioTimeline;

  const transcript = await scrapeTranscript(page);
  if (transcript) result.transcript = transcript;

  return result;
}

async function main() {
  const force = process.argv.includes('--force');
  const scrapeAll = process.argv.includes('--all');
  if (!fs.existsSync(STORAGE_STATE)) {
    console.error(`No zhenti session file found: ${STORAGE_STATE}`);
    console.error('Run node scripts/save-zhenti-session.mjs first.');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STORAGE_STATE,
    userAgent: BROWSER_UA,
  });
  const page = await context.newPage();
  const appPaperKeys = scrapeAll ? null : await loadAppPaperKeys();
  if (appPaperKeys) {
    console.log(`Restricting to ${appPaperKeys.size} paper(s) exposed by the app API`);
  }

  const queue = [];
  for (const category of CATEGORIES) {
    console.log(`[discover] ${category.slug}`);
    const paths = await discoverPaperPages(page, category);
    console.log(`  found ${paths.length}`);
    for (const paperPath of paths) {
      const paper = category.toPaper(paperPath);
      if (!appPaperKeys || appPaperKeys.has(`${paper.categorySlug}|${paper.slug}`)) {
        queue.push({ paperPath, paper });
      }
    }
  }

  const store = loadStore();
  const done = new Map(store.papers.map((paper) => [`${paper.categorySlug}|${paper.slug}`, paper]));
  const stats = {
    answers: 0,
    audio: 0,
    transcript: 0,
    timeline: 0,
    audioErrors: 0,
    failed: 0,
  };

  for (const item of queue) {
    const label = `${item.paper.categorySlug}/${item.paper.slug}`;
    const key = `${item.paper.categorySlug}|${item.paper.slug}`;
    const existing = done.get(key);
    if (!force && existing && hasUsefulContent(existing)) {
      console.log(`[skip] ${label}`);
      continue;
    }

    process.stdout.write(`[scrape] ${label} ... `);
    try {
      const paper = await scrapePaper(page, item.paperPath, item.paper);
      upsertPaper(store, paper);
      done.set(`${paper.categorySlug}|${paper.slug}`, paper);
      if (paper.answers) stats.answers += 1;
      if (paper.audioUrl) stats.audio += 1;
      if (paper.transcript) stats.transcript += 1;
      if (paper.audioTimeline) stats.timeline += 1;
      if (paper.audioDownloadError) stats.audioErrors += 1;
      console.log(
        [
          paper.answers ? 'answers' : null,
          paper.audioUrl ? 'audio' : null,
          paper.transcript ? 'transcript' : null,
          paper.audioTimeline ? 'timeline' : null,
          paper.audioDownloadError ? `audio-error:${paper.audioDownloadError}` : null,
        ]
          .filter(Boolean)
          .join(', ') || 'no content',
      );
      saveStore(store);
    } catch (error) {
      stats.failed += 1;
      console.log(`failed: ${error.message}`);
    }
    await page.waitForTimeout(300);
  }

  await browser.close();

  saveStore(store);
  console.log(`\nWrote ${store.papers.length} paper(s) -> ${OUTPUT_JSON}`);
  console.log(JSON.stringify(stats, null, 2));
  if (stats.failed > 0 || stats.audioErrors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
