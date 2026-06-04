const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const BASE_URL = 'https://zhenti.burningvocabulary.cn';
const OUTPUT_DIR = 'd:\\Projects\\S-Corner\\public\\pdfs';

// 要抓取的分类和时间范围
const CATEGORIES = [
  { 
    name: 'cet4', 
    type: 'monthly', // 有月份和套数
    years: ['2023-06', '2023-12', '2024-06', '2024-12', '2025-06', '2025-12'] 
  },
  { 
    name: 'cet6', 
    type: 'monthly',
    years: ['2024-06', '2024-12', '2025-06', '2025-12'] 
  },
  { 
    name: 'tem4', 
    type: 'yearly', // 只有年份
    years: ['2023', '2024', '2025'] 
  },
  { 
    name: 'tem8', 
    type: 'yearly',
    years: ['2023', '2024', '2025'] 
  }
];

// 每个时间段最多3套题（仅对 monthly 类型有效）
const MAX_SETS = 3;

// 下载文件
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    protocol.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// 从页面获取 PDF URL
async function getPdfUrl(page, url) {
  try {
    // 监听网络请求
    let pdfUrl = null;
    
    const requestHandler = (request) => {
      const reqUrl = request.url();
      if (reqUrl.endsWith('.pdf')) {
        pdfUrl = reqUrl;
      }
    };
    
    page.on('request', requestHandler);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    page.off('request', requestHandler);
    
    return pdfUrl;
  } catch (error) {
    console.error(`Error getting PDF URL from ${url}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Starting PDF scraping...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let totalDownloaded = 0;
  let totalFailed = 0;
  
  for (const category of CATEGORIES) {
    console.log(`\nProcessing category: ${category.name}`);
    
    // 创建分类目录
    const categoryDir = path.join(OUTPUT_DIR, category.name);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    for (const year of category.years) {
      console.log(`  Processing year: ${year}`);
      
      if (category.type === 'yearly') {
        // TEM4/TEM8 格式：/tem4/2025
        const pdfFileName = `${year}.pdf`;
        const pdfPath = path.join(categoryDir, pdfFileName);
        
        // 检查是否已下载
        if (fs.existsSync(pdfPath)) {
          console.log(`    Skipping ${category.name}/${pdfFileName} (already exists)`);
          continue;
        }
        
        console.log(`    Fetching PDF URL...`);
        const url = `${BASE_URL}/${category.name}/${year}`;
        const pdfUrl = await getPdfUrl(page, url);
        
        if (pdfUrl) {
          try {
            console.log(`    Downloading: ${pdfUrl}`);
            await downloadFile(pdfUrl, pdfPath);
            console.log(`    Saved to: ${pdfPath}`);
            totalDownloaded++;
          } catch (error) {
            console.error(`    Failed to download: ${error.message}`);
            totalFailed++;
          }
        } else {
          console.log(`    No PDF found`);
          totalFailed++;
        }
      } else {
        // CET4/CET6 格式：/cet4/2023-06/01
        // 创建年份目录
        const yearDir = path.join(categoryDir, year);
        if (!fs.existsSync(yearDir)) {
          fs.mkdirSync(yearDir, { recursive: true });
        }
        
        for (let setNum = 1; setNum <= MAX_SETS; setNum++) {
          const pdfFileName = `${setNum.toString().padStart(2, '0')}.pdf`;
          const pdfPath = path.join(yearDir, pdfFileName);
          
          // 检查是否已下载
          if (fs.existsSync(pdfPath)) {
            console.log(`    Skipping ${category.name}/${year}/${pdfFileName} (already exists)`);
            continue;
          }
          
          console.log(`    Fetching PDF URL for set ${setNum}...`);
          const url = `${BASE_URL}/${category.name}/${year}/${setNum.toString().padStart(2, '0')}`;
          const pdfUrl = await getPdfUrl(page, url);
          
          if (pdfUrl) {
            try {
              console.log(`    Downloading: ${pdfUrl}`);
              await downloadFile(pdfUrl, pdfPath);
              console.log(`    Saved to: ${pdfPath}`);
              totalDownloaded++;
            } catch (error) {
              console.error(`    Failed to download: ${error.message}`);
              totalFailed++;
            }
          } else {
            console.log(`    No PDF found for set ${setNum}`);
            totalFailed++;
          }
        }
      }
      
      // 添加延迟避免被封
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  await browser.close();
  
  console.log('\n========================================');
  console.log(`Scraping completed!`);
  console.log(`Total downloaded: ${totalDownloaded}`);
  console.log(`Total failed: ${totalFailed}`);
  console.log('========================================');
}

main().catch(console.error);
