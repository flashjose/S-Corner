import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE_URL = 'https://zhenti.burningvocabulary.cn';
const PDF_HOST = 'https://res-zhenti.burningvocabulary.cn';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'public', 'pdfs');
const DEFAULT_STORAGE = path.join(__dirname, 'scripts', '.zhenti-storage.json');
const STORAGE_STATE =
  process.env.ZHENTI_STORAGE_STATE || process.env.ZTHENTI_STORAGE_STATE || DEFAULT_STORAGE;
const KNOWN_UNAVAILABLE = new Set();

const CATEGORIES = [
  {
    slug: 'cet4',
    pagePath: '/cet4',
    paperPattern: /^\/cet4\/\d{4}-\d{2}\/\d{2}$/,
    toLocalPath: (pathname) => pathname.replace(/^\/cet4\//, 'cet4/') + '.pdf',
  },
  {
    slug: 'cet6',
    pagePath: '/cet6',
    paperPattern: /^\/cet6\/\d{4}-\d{2}\/\d{2}$/,
    toLocalPath: (pathname) => pathname.replace(/^\/cet6\//, 'cet6/') + '.pdf',
  },
  {
    slug: 'kaoyan',
    pagePath: '/kaoyan',
    paperPattern: /^\/kaoyan\/\d{4}\/\d{2}$/,
    toLocalPath: (pathname) => {
      const [, , year, setId] = pathname.split('/');
      return path.join('kaoyan', `${year}-01`, `${setId}.pdf`);
    },
  },
];

function normalizePathname(href) {
  try {
    return new URL(href, BASE_URL).pathname.replace(/\/$/, '');
  } catch {
    return '';
  }
}

function expectedPdfUrl(paperPath) {
  return `${PDF_HOST}${paperPath}.pdf`;
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
  for (const pathname of category.extraPaperPaths ?? []) {
    paths.add(pathname);
  }

  for (const link of links) {
    const pathname = normalizePathname(link);
    if (category.paperPattern.test(pathname)) {
      paths.add(pathname);
    }
  }

  return [...paths].sort((a, b) => b.localeCompare(a));
}

async function findPdfUrl(page, paperUrl) {
  const seen = new Set();
  let pdfUrl = null;

  const rememberPdf = async (response) => {
    const url = response.url();
    if (seen.has(url)) return;
    seen.add(url);

    const contentType = response.headers()['content-type'] ?? '';
    if (url.includes('.pdf') || contentType.includes('application/pdf')) {
      pdfUrl = url;
    }
  };

  page.on('response', rememberPdf);
  try {
    await page.goto(paperUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(1_000);
  } catch (error) {
    console.warn(`    Could not inspect page: ${error.message}`);
  } finally {
    page.off('response', rememberPdf);
  }

  return pdfUrl;
}

async function downloadFile(url, destPath, referer) {
  await fsp.mkdir(path.dirname(destPath), { recursive: true });
  const tempPath = `${destPath}.download`;

  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      Referer: referer,
      Origin: BASE_URL,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.subarray(0, 4).toString('utf8') !== '%PDF') {
    await fsp.rm(tempPath, { force: true });
    throw new Error(`Downloaded file is not a PDF: ${url}`);
  }

  await fsp.writeFile(tempPath, buffer);
  await fsp.rename(tempPath, destPath);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const contextOptions = fs.existsSync(STORAGE_STATE) ? { storageState: STORAGE_STATE } : {};
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const summary = {
    discovered: 0,
    skipped: 0,
    unavailable: 0,
    downloaded: 0,
    failed: 0,
  };

  try {
    if (contextOptions.storageState) {
      console.log(`Using zhenti storage state: ${STORAGE_STATE}`);
    }

    for (const category of CATEGORIES) {
      console.log(`\n${category.slug}: discovering papers`);
      const paperPaths = await discoverPaperPages(page, category);
      summary.discovered += paperPaths.length;
      console.log(`  Found ${paperPaths.length} paper pages`);

      for (const paperPath of paperPaths) {
        const localRelPath = category.toLocalPath(paperPath);
        const localPath = path.join(OUTPUT_DIR, localRelPath);

        if (KNOWN_UNAVAILABLE.has(paperPath)) {
          summary.unavailable += 1;
          console.log(`    Skip unavailable ${localRelPath}`);
          continue;
        }

        if (fs.existsSync(localPath)) {
          summary.skipped += 1;
          console.log(`    Skip existing ${localRelPath}`);
          continue;
        }

        const paperUrl = `${BASE_URL}${paperPath}`;
        const fallbackPdfUrl = expectedPdfUrl(paperPath);
        const inspectedPdfUrl = await findPdfUrl(page, paperUrl);
        const pdfUrl = inspectedPdfUrl ?? fallbackPdfUrl;

        try {
          console.log(`    Download ${localRelPath}`);
          await downloadFile(pdfUrl, localPath, paperUrl);
          summary.downloaded += 1;
        } catch (error) {
          summary.failed += 1;
          console.warn(`    Failed ${localRelPath}: ${error.message}`);
        }

        await page.waitForTimeout(300);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\nDone');
  console.log(`  Discovered: ${summary.discovered}`);
  console.log(`  Skipped:    ${summary.skipped}`);
  console.log(`  Unavailable:${summary.unavailable}`);
  console.log(`  Downloaded: ${summary.downloaded}`);
  console.log(`  Failed:     ${summary.failed}`);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
