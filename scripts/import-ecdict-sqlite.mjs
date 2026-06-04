/**
 * Import ECDICT SQLite (stardict table) into MySQL dictionary tables.
 *
 * Download ecdict-sqlite-28.zip from ECDICT releases, unzip, then:
 *   node scripts/import-ecdict-sqlite.mjs path/to/stardict.db
 *   node scripts/import-ecdict-sqlite.mjs path/to/unzipped-folder
 *
 * Env (defaults match application.yml):
 *   DB_HOST=localhost  DB_PORT=3306  DB_USER=root  DB_PASSWORD=123456789  DB_NAME=s_corner
 *
 * Requires: npm install better-sqlite3 mysql2
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';

const BATCH_SIZE = 500;
const LOG_EVERY = 50_000;

function parseExchange(lemma, exchange) {
  const forms = new Set([lemma]);
  if (!exchange) return forms;

  for (const part of exchange.split('/')) {
    const colon = part.indexOf(':');
    if (colon === -1) continue;
    const form = part.slice(colon + 1).trim().toLowerCase();
    if (form) forms.add(form);
  }
  return forms;
}

function resolveSqlitePath(input) {
  if (!fs.existsSync(input)) {
    throw new Error(`Path not found: ${input}`);
  }
  const stat = fs.statSync(input);
  if (stat.isFile()) {
    return input;
  }
  if (!stat.isDirectory()) {
    throw new Error(`Not a file or directory: ${input}`);
  }

  const candidates = fs
    .readdirSync(input)
    .filter((name) => /\.(db|sqlite|sqlite3)$/i.test(name))
    .map((name) => path.join(input, name));

  if (candidates.length === 0) {
    throw new Error(`No .db file in directory: ${input}`);
  }
  if (candidates.length > 1) {
    console.warn(`Multiple .db files; using ${candidates[0]}`);
  }
  return candidates[0];
}

function resolveTableName(sqlite) {
  const tables = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((row) => row.name);

  if (tables.includes('stardict')) return 'stardict';
  if (tables.includes('ecdict')) return 'ecdict';

  throw new Error(
    `Expected table "stardict" in ECDICT SQLite. Found: ${tables.join(', ') || '(none)'}`,
  );
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node scripts/import-ecdict-sqlite.mjs <stardict.db|folder>');
    process.exit(1);
  }

  let sqlitePath;
  try {
    sqlitePath = resolveSqlitePath(input);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  const table = resolveTableName(sqlite);
  const total = sqlite.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get().n;
  console.log(`Source: ${sqlitePath} (${table}, ${total} rows)`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456789',
    database: process.env.DB_NAME || 's_corner',
    charset: 'utf8mb4',
  });

  console.log('Truncating dictionary tables...');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
  await conn.execute('TRUNCATE TABLE dictionary_word_form');
  await conn.execute('TRUNCATE TABLE dictionary_entry');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

  const select = sqlite.prepare(
    `SELECT word, phonetic, definition, translation, pos, exchange FROM "${table}" ORDER BY id`,
  );

  let imported = 0;
  /** @type {Map<string, unknown[]>} */
  let entryBatch = new Map();
  /** @type {Map<string, string>} */
  let formBatch = new Map();

  const flush = async () => {
    if (entryBatch.size === 0) return;

    const entries = [...entryBatch.values()];
    const entryPlaceholders = entries.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const [result] = await conn.execute(
      `INSERT IGNORE INTO dictionary_entry (word, phonetic, pos, definition, translation, exchange)
       VALUES ${entryPlaceholders}`,
      entries.flat(),
    );

    if (formBatch.size > 0) {
      const forms = [...formBatch.entries()];
      const formPlaceholders = forms.map(() => '(?, ?)').join(', ');
      await conn.execute(
        `INSERT IGNORE INTO dictionary_word_form (form, lemma) VALUES ${formPlaceholders}`,
        forms.flat(),
      );
    }

    imported += result.affectedRows ?? entries.length;
    entryBatch = new Map();
    formBatch = new Map();
  };

  for (const row of select.iterate()) {
    const word = (row.word || '').trim().toLowerCase();
    if (!word) continue;

    entryBatch.set(word, [
      word,
      row.phonetic || null,
      row.pos || null,
      row.definition || null,
      row.translation || null,
      row.exchange || null,
    ]);

    for (const form of parseExchange(word, row.exchange)) {
      formBatch.set(form, word);
    }

    if (entryBatch.size >= BATCH_SIZE) {
      await flush();
      if (imported > 0 && imported % LOG_EVERY < BATCH_SIZE) {
        console.log(`Imported ${imported} / ${total}...`);
      }
    }
  }

  await flush();
  sqlite.close();
  await conn.end();

  console.log(`Done. Imported ${imported} dictionary entries from ${sqlitePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
