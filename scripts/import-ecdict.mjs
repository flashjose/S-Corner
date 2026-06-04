/**
 * Import ECDICT CSV into MySQL dictionary tables.
 *
 * Usage:
 *   node scripts/import-ecdict.mjs scripts/ecdict.sample.csv
 *   node scripts/import-ecdict.mjs path/to/ecdict.csv
 *
 * For ECDICT release zips (ecdict-sqlite-28.zip), use import-ecdict-sqlite.mjs instead.
 *
 * Env (defaults match application.yml):
 *   DB_HOST=localhost  DB_PORT=3306  DB_USER=root  DB_PASSWORD=123456789  DB_NAME=s_corner
 *
 * Requires: npm install mysql2  (devDependency)
 */

import fs from 'fs';
import readline from 'readline';
import mysql from 'mysql2/promise';

const BATCH_SIZE = 500;

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

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

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/import-ecdict.mjs <ecdict.csv>');
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

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

  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  let lineNo = 0;
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

  for await (const line of rl) {
    lineNo++;
    if (lineNo === 1) continue; // header
    if (!line.trim()) continue;

    const cols = parseCsvLine(line);
    const word = (cols[0] || '').trim().toLowerCase();
    if (!word) continue;

    const phonetic = cols[1] || null;
    const definition = cols[2] || null;
    const translation = cols[3] || null;
    const pos = cols[4] || null;
    const exchange = cols[10] || null;

    entryBatch.set(word, [word, phonetic, pos, definition, translation, exchange]);

    for (const form of parseExchange(word, exchange)) {
      formBatch.set(form, word);
    }

    if (entryBatch.size >= BATCH_SIZE) {
      await flush();
      if (imported % 5000 === 0) {
        console.log(`Imported ${imported} entries...`);
      }
    }
  }

  await flush();
  await conn.end();

  console.log(`Done. Imported ${imported} dictionary entries from ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
