/**
 * Scrape listening audio + timeline from zhenti.burningvocabulary.cn (CET4/CET6).
 *
 * Usage:
 *   node scripts/scrape-listening.mjs                    # all CET4/CET6 papers
 *   node scripts/scrape-listening.mjs --dry-run cet4/2025-12/01
 *   node scripts/scrape-listening.mjs --no-download      # JSON only, skip mp3
 *
 * Output:
 *   public/audio/{category}/{slug}.mp3
 *   scripts/listening_content.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { LISTENING_EXAM_PAGES } from './listening-exam-pages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'audio');
const OUTPUT_JSON = path.join(__dirname, 'listening_content.json');
const AUDIO_VERSION = '20260409';

const EXAM_PAGES = LISTENING_EXAM_PAGES;

const LISTEN_PREFIX = 'ls2_';

function hashCfg({ filePath, label }) {
  const str = `listen-split-v2|${filePath || ''}|${label || ''}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
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

export function decodeListeningSplitValue(id, { filePath, label }) {
  const raw = String(id || '');
  if (!raw.startsWith(LISTEN_PREFIX)) return null;
  const encoded = parseInt(raw.slice(4), 36);
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

export function buildAudioTimeline(globalConfig) {
  const splits = globalConfig.newListenSpli;
  const filePath = globalConfig.filePath;
  if (!splits || !filePath) return null;

  const segments = [];
  for (const [key, id] of Object.entries(splits)) {
    const startMs = decodeListeningSplitValue(id, { filePath, label: key });
    if (startMs == null) continue;
    const { label, type } = normalizeLabel(key);
    segments.push({ label, startMs, type });
  }
  segments.sort((a, b) => a.startMs - b.startMs);

  if (!segments.length) return null;
  return {
    durationMs: Math.round(globalConfig.audioDuration || segments[segments.length - 1].startMs + 60000),
    segments,
  };
}

export function computeAudioHash(globalConfig) {
  const a2 = globalConfig?.an?.a2;
  const a3 = globalConfig?.an?.a3;
  if (!a2?.length || !a3?.length) return null;
  return a2.concat(a3).reverse().join('');
}

export function parseGlobalConfig(html) {
  const start = html.indexOf('var globalConfig = ');
  if (start < 0) return null;
  const jsonStart = start + 19;
  const end = html.indexOf('globalConfig.showed', jsonStart);
  if (end < 0) return null;
  try {
    return JSON.parse(html.slice(jsonStart, end).trim().replace(/;$/, ''));
  } catch {
    return null;
  }
}

export function buildRemoteAudioUrl(globalConfig) {
  const hash = computeAudioHash(globalConfig);
  if (!hash || !globalConfig.filePath) return null;
  const host = (globalConfig.pdfHost || 'https://res-zhenti.burningvocabulary.cn').replace(/\/$/, '');
  return `${host}/images/read/${globalConfig.filePath}/${hash}.mp3?v=${AUDIO_VERSION}`;
}

function localAudioPath(category, slug) {
  return `/audio/${category}/${slug.replace(/\//g, '-')}.mp3`;
}

function localAudioFile(category, slug) {
  return path.join(AUDIO_DIR, category, `${slug.replace(/\//g, '-')}.mp3`);
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': BROWSER_UA },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function downloadFile(url, destPath, referer) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const res = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Referer: referer,
      Origin: 'https://zhenti.burningvocabulary.cn',
    },
  });
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const body = res.body;
  if (!body) throw new Error(`Empty body: ${url}`);
  await pipeline(Readable.fromWeb(body), createWriteStream(destPath));
}

async function scrapeOne(exam, { dryRun, noDownload }) {
  const html = await fetchPage(exam.url);
  const globalConfig = parseGlobalConfig(html);
  if (!globalConfig) {
    return { ...exam, error: 'globalConfig not found' };
  }
  if (!globalConfig.an?.a2) {
    return { ...exam, error: 'no listening audio (an.a2 missing)' };
  }

  const remoteUrl = buildRemoteAudioUrl(globalConfig);
  const audioTimeline = buildAudioTimeline(globalConfig);
  const localUrl = localAudioPath(exam.category, exam.slug);
  const destFile = localAudioFile(exam.category, exam.slug);

  const result = {
    categorySlug: exam.category,
    slug: exam.slug,
    audioUrl: localUrl,
    remoteAudioUrl: remoteUrl,
    audioTimeline,
  };

  if (dryRun) {
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  if (!noDownload && remoteUrl) {
    if (!fs.existsSync(destFile)) {
      console.log(`  ↓ ${remoteUrl}`);
      try {
        await downloadFile(remoteUrl, destFile, exam.url);
      } catch (err) {
        result.downloadError = err.message;
        console.warn(`  ⚠ ${err.message}`);
      }
    } else {
      console.log(`  ✓ mp3 exists: ${destFile}`);
    }
  }

  return result;
}

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const noDownload = argv.includes('--no-download');
  const filter = argv.find((a) => !a.startsWith('--') && a.includes('/'));
  return { dryRun, noDownload, filter };
}

async function main() {
  const { dryRun, noDownload, filter } = parseArgs(process.argv.slice(2));
  console.log(`Listening papers in queue: ${EXAM_PAGES.length} (CET4 18 + CET6 18)`);
  let pages = EXAM_PAGES;
  if (filter) {
    const [cat, ...rest] = filter.split('/');
    const slug = rest.join('/');
    pages = EXAM_PAGES.filter((p) => p.category === cat && p.slug === slug);
    if (!pages.length) {
      console.error(`No exam matched filter: ${filter}`);
      process.exit(1);
    }
  }

  const papers = [];
  for (const exam of pages) {
    console.log(`[${exam.category}/${exam.slug}] ${exam.url}`);
    try {
      const item = await scrapeOne(exam, { dryRun, noDownload });
      if (item.error) {
        console.warn(`  ⚠ ${item.error}`);
      } else if (!dryRun && item.audioTimeline) {
        papers.push({
          categorySlug: item.categorySlug,
          slug: item.slug,
          audioUrl: item.audioUrl,
          audioTimeline: item.audioTimeline,
        });
        if (item.downloadError) {
          console.warn(`  ⚠ timeline saved; mp3 not downloaded`);
        }
      }
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!dryRun && papers.length) {
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ papers }, null, 2), 'utf-8');
    console.log(`\nWrote ${papers.length} paper(s) → ${OUTPUT_JSON}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
