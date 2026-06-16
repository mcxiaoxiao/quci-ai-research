import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const markedPkg = require('marked');
const marked = markedPkg.marked || markedPkg;
const { chromium } = require('playwright');

const root = process.cwd();
const reportDir = path.join(root, 'report');
const chaptersDir = path.join(reportDir, 'chapters');
const appendixPath = path.join(reportDir, 'appendix', 'evidence-index.md');
const cssPath = path.join(reportDir, 'report.css');
const buildDir = path.join(root, 'build');
const assetsDir = path.join(root, 'assets');
const finalMdPath = path.join(reportDir, 'final-report.md');
const finalHtmlPath = path.join(buildDir, 'final-report.html');
const finalPdfPath = path.join(buildDir, 'final-report.pdf');

const chapterOrder = [
  '00-visual-identity.md',
  '01-executive-summary.md',
  '02-market-landscape.md',
  '03-technical-feasibility.md',
  '04-risks-and-failures.md',
  '05-roadmap.md',
];

function toHtmlTitle(text) {
  return String(text || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function isRemoteOrDataUrl(src) {
  return /^(https?:|data:|file:)/i.test(src);
}

async function inlineLocalImages(html, baseDir) {
  const imageSrcs = [...html.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/g)]
    .map((match) => match[1])
    .filter((src) => !isRemoteOrDataUrl(src));

  const uniqueSrcs = [...new Set(imageSrcs)];
  const replacements = new Map();

  for (const src of uniqueSrcs) {
    const absPath = path.isAbsolute(src) ? src : path.resolve(baseDir, src);
    const ext = path.extname(absPath).toLowerCase();
    const mime = ext === '.png' ? 'image/png'
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : ext === '.webp' ? 'image/webp'
      : ext === '.gif' ? 'image/gif'
      : 'application/octet-stream';
    const base64 = await readFile(absPath, { encoding: 'base64' });
    replacements.set(src, `data:${mime};base64,${base64}`);
  }

  let out = html;
  for (const [src, replacement] of replacements.entries()) {
    out = out.split(`src="${src}"`).join(`src="${replacement}"`);
  }
  return out;
}

async function fileExists(filePath) {
  try {
    await readFile(filePath, 'utf8');
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(buildDir, { recursive: true });

  const summaryPath = path.join(root, 'data', 'summary.json');
  if (!(await fileExists(summaryPath))) {
    throw new Error('Missing data/summary.json. Run scripts/collect_sources.mjs first.');
  }

  const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
  const css = await readFile(cssPath, 'utf8');
  const appendix = await readFile(appendixPath, 'utf8');

  const chapterBlocks = [];
  const chapterTitles = [];
  for (const file of chapterOrder) {
    const md = await readFile(path.join(chaptersDir, file), 'utf8');
    const titleLine = md.split('\n').find((line) => line.startsWith('# ')) || file;
    chapterTitles.push(titleLine.replace(/^#\s*/, '').trim().replace(/^\d+\.\s*/, ''));
    chapterBlocks.push(md.trim());
  }
  const appendixTitle = '附录 证据索引';

  const assembledMd = [
    '# 中国传统曲艺生成 AI 市场与技术可行性研究',
    '',
    `*生成时间：${new Date(summary.generated_at).toLocaleString('zh-CN')}*`,
    '',
    `*证据规模：${summary.source_count} 条公开来源（${summary.official_count} 条官方 / 产品 / 政策来源，${summary.academic_count} 条学术来源）*`,
    '',
    '---',
    '',
    ...chapterBlocks,
    '',
    appendix.trim(),
    '',
  ].join('\n');

  await writeFile(finalMdPath, assembledMd, 'utf8');

  const wordmarkPath = path.join(assetsDir, 'wordmark.png');
  const wordmarkBase64 = await readFile(wordmarkPath, { encoding: 'base64' });
  const wordmarkDataUri = `data:image/png;base64,${wordmarkBase64}`;
  const wordmarkCropSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1745" height="550" viewBox="140 110 1745 550">
  <image href="${wordmarkDataUri}" x="0" y="0" width="2027" height="776" preserveAspectRatio="none" />
</svg>`).toString('base64');
  const coverWordmarkDataUri = `data:image/svg+xml;base64,${wordmarkCropSvg}`;

  const tocItems = [
    ...chapterTitles.map((title, idx) => ({ href: `#chapter-${idx + 1}`, title })),
    { href: '#appendix', title: appendixTitle },
  ];

  const tocHtml = tocItems
    .map((item) => `<li><a href="${item.href}">${toHtmlTitle(item.title)}</a></li>`)
    .join('');

  const sectionHtml = [];
  for (const [idx, file] of chapterOrder.entries()) {
    const md = await readFile(path.join(chaptersDir, file), 'utf8');
    const rendered = await inlineLocalImages(marked.parse(md), chaptersDir);
    sectionHtml.push(`<section class="section" id="chapter-${idx + 1}">${rendered}</section>`);
  }
  sectionHtml.push(`<section class="section" id="appendix">${await inlineLocalImages(marked.parse(appendix), path.join(reportDir, 'appendix'))}</section>`);

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${css}</style>
</head>
<body>
  <div class="cover">
    <div class="cover-inner">
      <img class="cover-mark" src="${coverWordmarkDataUri}" alt="尺素 chisu" />
      <h1 class="title">中国传统曲艺生成 AI 市场与技术可行性研究</h1>
      <div class="cover-time">${toHtmlTitle(new Date(summary.generated_at).toLocaleString('zh-CN'))}</div>
      <div class="toc">
        <div class="toc-title">目录</div>
        <ol>${tocHtml}</ol>
      </div>
    </div>
  </div>
  <div class="content">
    ${sectionHtml.join('\n')}
  </div>
</body>
</html>`;

  await writeFile(finalHtmlPath, html, 'utf8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'screen' });
  await page.pdf({
    path: finalPdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    margin: { top: '18mm', right: '10mm', bottom: '16mm', left: '10mm' },
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;font-size:8px;color:#6c6c6c;padding:0 12mm;text-align:right;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  await browser.close();

  console.log(`Wrote ${finalMdPath}`);
  console.log(`Wrote ${finalHtmlPath}`);
  console.log(`Wrote ${finalPdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
