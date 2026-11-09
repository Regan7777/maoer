const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'docs', '.vuepress', 'dist');
const docsDir = path.join(projectRoot, 'docs');
const sitemapDistPath = path.join(distDir, 'sitemap.xml');
const sitemapPublicPath = path.join(docsDir, '.vuepress', 'public', 'sitemap.xml');

console.log('[post-build] 开始执行全栈 SEO 与 Bing 抓取强化处理...');

if (!fs.existsSync(distDir)) {
  console.error('[post-build] 错误: dist 目录不存在，请先执行 vuepress build docs');
  process.exit(1);
}

// 1. 递归提取所有 markdown 的时间与 permalink
function scanMarkdown(dir) {
  let list = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['.vuepress', 'node_modules', '.temp', '.cache', 'dist'].includes(entry.name)) continue;
      list = list.concat(scanMarkdown(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      list.push(fullPath);
    }
  }
  return list;
}

const mdFiles = scanMarkdown(docsDir);
const metaMap = new Map();

for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const stat = fs.statSync(file);
  
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  let permalink = null;
  let dateModified = null;
  let title = '';

  if (fmMatch) {
    const fm = fmMatch[1];
    const pMatch = fm.match(/permalink:\s*(.+)/);
    const dMatch = fm.match(/dateModified:\s*(.+)/);
    const cMatch = fm.match(/createTime:\s*(.+)/);
    const tMatch = fm.match(/title:\s*(.+)/);
    
    if (pMatch) permalink = pMatch[1].trim();
    if (dMatch) dateModified = dMatch[1].trim();
    else if (cMatch) dateModified = cMatch[1].trim();
    if (tMatch) title = tMatch[1].trim();
  }

  // 默认从文件 mtime 读取
  let isoDate = dateModified ? new Date(dateModified).toISOString() : new Date(stat.mtimeMs).toISOString();

  // 规范化 permalink
  if (permalink) {
    const norm = permalink.endsWith('/') ? permalink : permalink + '/';
    metaMap.set(norm, { file, date: isoDate, title });
  }
}

// 2. 检查或生成标准 sitemap.xml
let existingUrls = [];
if (fs.existsSync(sitemapDistPath)) {
  const sitemapRaw = fs.readFileSync(sitemapDistPath, 'utf8');
  const locMatches = [...sitemapRaw.matchAll(/<loc>(.*?)<\/loc>/g)];
  existingUrls = locMatches.map(m => m[1]);
}

// 如果没有读取到，提供兜底全量 URL
if (existingUrls.length === 0) {
  existingUrls.push('https://maoer.blog/');
  for (const [slug] of metaMap.entries()) {
    existingUrls.push(`https://maoer.blog${slug}`);
  }
}

// 去重
existingUrls = Array.from(new Set(existingUrls));

// 3. 构建高精度 W3C 标准 sitemap.xml
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

const defaultDate = new Date().toISOString();

for (const urlStr of existingUrls) {
  const urlObj = new URL(urlStr);
  const pathname = urlObj.pathname.endsWith('/') ? urlObj.pathname : urlObj.pathname + '/';
  
  const meta = metaMap.get(pathname) || metaMap.get(urlObj.pathname);
  const lastmod = meta ? meta.date : defaultDate;

  // 智能分配 priority 与 changefreq
  let priority = '0.7';
  let changefreq = 'weekly';

  if (pathname === '/') {
    priority = '1.0';
    changefreq = 'daily';
  } else if (pathname === '/article/clash-recommend-2026/') {
    priority = '0.95';
    changefreq = 'daily';
  } else if (pathname.startsWith('/article/')) {
    priority = '0.85';
    changefreq = 'weekly';
  } else if (pathname.startsWith('/notes/')) {
    priority = '0.80';
    changefreq = 'weekly';
  } else if (pathname.includes('/tags/') || pathname.includes('/categories/') || pathname === '/blog/') {
    priority = '0.50';
    changefreq = 'daily';
  }

  sitemapXml += `  <url>\n`;
  sitemapXml += `    <loc>${urlStr}</loc>\n`;
  sitemapXml += `    <lastmod>${lastmod}</lastmod>\n`;
  sitemapXml += `    <changefreq>${changefreq}</changefreq>\n`;
  sitemapXml += `    <priority>${priority}</priority>\n`;
  sitemapXml += `  </url>\n`;
}

sitemapXml += `</urlset>\n`;

// 写入 dist 和 public
fs.writeFileSync(sitemapDistPath, sitemapXml, 'utf8');
fs.writeFileSync(sitemapPublicPath, sitemapXml, 'utf8');
console.log(`[post-build] 成功写入 sitemap.xml，包含 ${existingUrls.length} 个规范 URL，全部注入精准 <lastmod> 与 <priority>！`);

// 4. 确保 IndexNow 验证 Key 存在于 dist 根目录
const indexNowKey = '9b7f0616c9694d10a3575b5c2db8e699';
const keyFileSource = path.join(docsDir, '.vuepress', 'public', `${indexNowKey}.txt`);
const keyFileDist = path.join(distDir, `${indexNowKey}.txt`);

if (fs.existsSync(keyFileSource)) {
  fs.copyFileSync(keyFileSource, keyFileDist);
  console.log(`[post-build] 成功同步 IndexNow 验证文件: ${indexNowKey}.txt`);
}

// 5. 将整个 docs/.vuepress/dist 同步到根目录 dist 及 .vitepress/dist (三保险全兼容 Cloudflare Pages 输出目录设置)
const rootDistDir = path.join(projectRoot, 'dist');
if (fs.existsSync(rootDistDir)) {
  fs.rmSync(rootDistDir, { recursive: true, force: true });
}
fs.cpSync(distDir, rootDistDir, { recursive: true });

const vitepressDistDir = path.join(docsDir, '.vitepress', 'dist');
if (fs.existsSync(vitepressDistDir)) {
  fs.rmSync(vitepressDistDir, { recursive: true, force: true });
}
fs.cpSync(distDir, vitepressDistDir, { recursive: true });

console.log('[post-build] 成功同步构建产物至根目录 dist/ 及 docs/.vitepress/dist/ (三保险兼容 Cloudflare Pages)');

console.log('[post-build] SEO 与 Bing 抓取构建后优化全部顺利完成！');

