const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://zhenti.burningvocabulary.cn';
const OUTPUT_FILE = path.join(__dirname, 'exam_answers.json');

// 定义所有要抓取的试卷
const EXAM_PAGES = [
  // CET4 - 2023 to 2025
  ...['2023-06', '2023-12', '2024-06', '2024-12', '2025-06', '2025-12'].flatMap(y =>
    [1, 2, 3].map(s => ({
      category: 'cet4',
      period: y,
      set: s,
      slug: `${y}/${s.toString().padStart(2, '0')}`,
      url: `${BASE_URL}/cet4/${y}/${s.toString().padStart(2, '0')}`
    }))
  ),
  // CET6 - 2024 to 2025
  ...['2024-06', '2024-12', '2025-06', '2025-12'].flatMap(y =>
    [1, 2, 3].map(s => ({
      category: 'cet6',
      period: y,
      set: s,
      slug: `${y}/${s.toString().padStart(2, '0')}`,
      url: `${BASE_URL}/cet6/${y}/${s.toString().padStart(2, '0')}`
    }))
  ),
  // TEM4 - 2024, 2025
  ...['2024', '2025'].map(y => ({
    category: 'tem4',
    period: y,
    set: 1,
    slug: `${y}-06/01`,
    url: `${BASE_URL}/tem4/${y}`
  })),
  // TEM8 - 2024, 2025
  ...['2024', '2025'].map(y => ({
    category: 'tem8',
    period: y,
    set: 1,
    slug: `${y}-06/02`,
    url: `${BASE_URL}/tem8/${y}`
  })),
];

async function scrapeAnswers(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);

    // 点击"查答案"按钮
    await page.evaluate(() => {
      const btn = document.querySelector('.answer_btn.has');
      if (btn) btn.click();
    });
    await page.waitForTimeout(2000);

    // 提取答案
    const answers = await page.evaluate(() => {
      const allTables = document.querySelectorAll('table');
      const result = [];

      allTables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        if (rows.length >= 2) {
          const answerRow = rows[0];
          const numberRow = rows[1];

          const answerCells = answerRow.querySelectorAll('td');
          const numberCells = numberRow.querySelectorAll('td');

          for (let i = 0; i < answerCells.length; i++) {
            const answer = answerCells[i]?.textContent?.trim();
            const number = numberCells[i]?.textContent?.trim();
            if (number && answer) {
              result.push({ number: parseInt(number), answer });
            }
          }
        }
      });

      return result;
    });

    return answers.length > 0 ? answers : null;
  } catch (e) {
    console.error(`Error scraping ${url}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('开始抓取答案...');
  console.log(`共 ${EXAM_PAGES.length} 份试卷`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const exam of EXAM_PAGES) {
    const label = `${exam.category} ${exam.period} 第${exam.set}套`;
    process.stdout.write(`抓取 ${label}...`);

    const answers = await scrapeAnswers(page, exam.url);

    if (answers) {
      results.push({
        category: exam.category,
        period: exam.period,
        set: exam.set,
        slug: exam.slug,
        fullSlug: `${exam.category}/${exam.slug}`,
        answers: answers,
        count: answers.length
      });
      console.log(` ✓ ${answers.length}题`);
      successCount++;
    } else {
      console.log(` ✗ 无答案`);
      failCount++;
    }

    // 延迟避免被封
    await page.waitForTimeout(500);
  }

  await browser.close();

  // 保存结果
  const output = {
    scrapedAt: new Date().toISOString(),
    total: results.length,
    successCount,
    failCount,
    results
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  console.log('\n========================================');
  console.log('抓取完成!');
  console.log(`成功: ${successCount} 份`);
  console.log(`失败: ${failCount} 份`);
  console.log(`保存到: ${OUTPUT_FILE}`);
  console.log('========================================');
}

main().catch(console.error);
