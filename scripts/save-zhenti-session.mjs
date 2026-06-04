/**
 * Save zhenti.burningvocabulary.cn login for scrape-transcript.mjs.
 *
 * Usage:
 *   node scripts/save-zhenti-session.mjs
 *
 * A browser opens — log in if needed, then press Enter in this terminal to save cookies.
 * Output: scripts/.zhenti-storage.json (gitignored)
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, '.zhenti-browser-profile');
const STORAGE_FILE = path.join(__dirname, '.zhenti-storage.json');

function waitEnter(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  console.log('Opening browser… Log in on zhenti if you are not already.');
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 800 },
  });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto('https://zhenti.burningvocabulary.cn/cet4/2025-12/01', {
    waitUntil: 'domcontentloaded',
  });

  console.log('Waiting for login (up to 3 min). Log in in the browser window if needed…');
  try {
    await page.waitForFunction(() => window.winGlobal?.p, { timeout: 180_000 });
    console.log('Login detected.');
  } catch {
    await waitEnter('\nLogin not detected automatically. After you log in, press Enter… ');
  }

  await context.storageState({ path: STORAGE_FILE });
  await context.close();

  console.log(`Saved → ${STORAGE_FILE}`);
  console.log('Run: node scripts/scrape-transcript.mjs');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
