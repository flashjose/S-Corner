/**
 * Convert scraped answers (exam_answers.json) into import format (content-import.json)
 * for import-content.mjs
 */
import fs from 'fs';

const scraped = JSON.parse(fs.readFileSync('exam_answers.json', 'utf-8'));

const papers = scraped.results.map(r => {
  // Convert answers array [{number, answer}] to object {"1": "A", "2": "B", ...}
  const answersObj = {};
  for (const item of r.answers) {
    answersObj[String(item.number)] = item.answer;
  }

  return {
    categorySlug: r.category === 'tem4' || r.category === 'tem8' ? 'tem' : r.category,
    slug: r.slug,
    answers: answersObj,
  };
});

// Map tem4/tem8 slugs to match database
// Database uses: tem4 -> 2024-06/01, tem8 -> 2024-06/02
for (const paper of papers) {
  if (paper.categorySlug === 'tem') {
    // tem4 slug: "2024-06/01", tem8 slug: "2024-06/02"
    // scraped tem4 slug is like "2024-06/01", tem8 is "2024-06/02" - already correct
  }
}

const output = { papers };

const outPath = 'scripts/answers-import.json';
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`Converted ${papers.length} papers -> ${outPath}`);
