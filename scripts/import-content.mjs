/**
 * Import exam paper content via REST API.
 *
 * Usage:
 *   node scripts/import-content.mjs scripts/content.example.json
 *
 * Env: API_BASE (default http://localhost:3001/api)
 */

import fs from 'fs';

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/import-content.mjs <content.json>');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const res = await fetch(`${API_BASE}/exam/content/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok) {
    console.error('Import failed:', result);
    process.exit(1);
  }

  console.log(`Import complete. Updated ${result.updated} paper(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
