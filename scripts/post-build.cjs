const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'docs', '.vuepress', 'dist');
const docsDir = path.join(projectRoot, 'docs');
const sitemapDistPath = path.join(distDir, 'sitemap.xml');
const sitemapPublicPath = path.join(docsDir, '.vuepress', 'public', 'sitemap.xml');
const sitemap0DistPath = path.join(distDir, 'sitemap-0.xml');
const sitemap0PublicPath = path.join(docsDir, '.vuepress', 'public', 'sitemap-0.xml');

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

  let isoDate = dateModified ? new Date(dateModified).toISOString() : new Date(stat.mtimeMs).toISOString();

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

if (existingUrls.length === 0) {
  existingUrls.push('https://maoer.blog/');
  for (const [slug] of metaMap.entries()) {
    existingUrls.push(`https://maoer.blog${slug}`);
  }
}

existingUrls = Array.from(new Set(existingUrls)).filter((urlStr) => {
  try {
    const p = new URL(urlStr).pathname;
    if (p.includes('/article/redirecting')) return false;
    if (p.startsWith('/go/')) return false;
    if (p === '/404.html' || p.includes('/preview-colors')) return false;
    return true;
  } catch {
    return true;
  }
});

// 3. 构建高精度 W3C 标准 sitemap.xml 与 sitemap-0.xml 双地图
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

const defaultDate = new Date().toISOString();

for (const urlStr of existingUrls) {
  const urlObj = new URL(urlStr);
  const pathname = urlObj.pathname.endsWith('/') ? urlObj.pathname : urlObj.pathname + '/';
  
  const meta = metaMap.get(pathname) || metaMap.get(urlObj.pathname);
  const lastmod = meta ? meta.date : defaultDate;

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

// 写入 dist 和 public (双 Sitemap)
fs.writeFileSync(sitemapDistPath, sitemapXml, 'utf8');
fs.writeFileSync(sitemapPublicPath, sitemapXml, 'utf8');
fs.writeFileSync(sitemap0DistPath, sitemapXml, 'utf8');
fs.writeFileSync(sitemap0PublicPath, sitemapXml, 'utf8');
console.log(`[post-build] 成功写入 sitemap.xml 与 sitemap-0.xml，包含 ${existingUrls.length} 个规范 URL！`);

// 4. 确保 IndexNow 验证 Key 存在于 dist 根目录
const indexNowKey = '9b7f0616c9694d10a3575b5c2db8e699';
const keyFileSource = path.join(docsDir, '.vuepress', 'public', `${indexNowKey}.txt`);
const keyFileDist = path.join(distDir, `${indexNowKey}.txt`);

if (fs.existsSync(keyFileSource)) {
  fs.copyFileSync(keyFileSource, keyFileDist);
  console.log(`[post-build] 成功同步 IndexNow 验证文件: ${indexNowKey}.txt`);
}

// 4.5 修复所有 HTML 文件中缺失或为空的 img alt 属性（满足 Bing / Google SEO & 无障碍指标）
function fixHtmlImgAlt(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += fixHtmlImgAlt(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      let html = fs.readFileSync(fullPath, 'utf8');
      let fileChanged = false;

      // 1. 处理带有空 alt (如 `alt` 或 `alt=""` 或 `alt=''`) 的 img 标签
      let patchedHtml = html.replace(/<img\b([^>]*?)(\balt(?:\s*=\s*(?:""|''|))?)(\b[^>]*?)>/gi, (match, prefix, altAttr, suffix) => {
        if (/alt\s*=\s*["'][^"']+["']/i.test(match)) {
          return match;
        }
        fileChanged = true;
        count++;
        const isLogo = /logo/i.test(match);
        const altText = isLogo ? '猫耳博客 Logo' : '猫耳博客配图';
        return `<img${prefix}alt="${altText}"${suffix}>`;
      });

      // 2. 处理完全缺少 alt 属性的 img 标签
      patchedHtml = patchedHtml.replace(/<img\b((?:(?!alt=|\balt\b)[^>])*)>/gi, (match, body) => {
        fileChanged = true;
        count++;
        const isLogo = /logo/i.test(match);
        const altText = isLogo ? '猫耳博客 Logo' : '猫耳博客配图';
        return `<img${body} alt="${altText}">`;
      });

      if (fileChanged) {
        fs.writeFileSync(fullPath, patchedHtml, 'utf8');
      }
    }
  }
  return count;
}

const fixedAltCount = fixHtmlImgAlt(distDir);
console.log(`[post-build] 成功扫描并修复 HTML 中缺失/为空的 img alt 属性，共注入 ${fixedAltCount} 处合规 alt 描述！`);

// 4.6 全站 HTML SEO 强化：noindex 注入、短标题扩充、Meta 描述规范化 (148-158 字符)
const titleOverrides = {
  'blog/index.html': '2026全站技术文章与机场评测目录：Clash配置教程与科学上网指南 | 猫耳',
  'blog/categories/index.html': '2026全站文章分类导航：机场深度评测、Clash配置教程与科学上网指南 | 猫耳',
  'blog/tags/index.html': '2026热门技术标签聚合：IPLC专线、Mihomo内核、小火箭与节点搭建 | 猫耳',
  'blog/archives/index.html': '2026全站文章时间轴归档：历年科学上网与跨境网络技术实测合集 | 猫耳',
  'article/iptest/index.html': '2026在线IP纯净度与流媒体解锁检测工具汇总：ChatGPT/Netflix测速 | 猫耳',
  'article/vpscant/index.html': 'VPS与机场行业黑话完全指南：CN2 GIA、AS9929、BGP中转与IPLC专线解析 | 猫耳',
  'article/digital-nomad/index.html': '2026跨境远程办公与数字游民稳定网络环境搭建及双链路灾备心得 | 猫耳',
  'article/client-guide/index.html': '2026主流科学上网客户端配置指南：下载安装、订阅导入与连接故障排查 | 猫耳',
  'article/scam-airports/index.html': '2026跑路机场与不良网络服务商盘点及避坑预警指南：谨防低价圈钱陷阱 | 猫耳',
  'notes/cheping/reviews/index.html': '2026热门科学上网机场与服务商选购及横向深度测评指南大全 | 猫耳',
  'notes/cheping/study/iptest/index.html': '2026在线IP纯净度与流媒体解锁检测工具汇总：ChatGPT/Netflix测速 | 猫耳',
  'notes/cheping/study/networkanalysis/index.html': '2026出海网络线路深度解析：BGP中转隧道与IPLC/IEPL国际专线评测 | 猫耳',
  'notes/cheping/study/vpscant/index.html': 'VPS与机场行业黑话完全指南：CN2 GIA、AS9929、BGP中转与IPLC专线解析 | 猫耳',
  'article/node-desc/index.html': '2026科学上网自建节点搭建专栏导读：从网络基础到主流加密协议实战指南 | 猫耳',
  'article/node1/index.html': '1、跨境网络通信基本过程深度解析：TCP/IP握手、DNS与代理转发原理 | 猫耳',
  'article/node2/index.html': '2、如何绕过防火墙拦截：GFW深度包检测与现代加密传输伪装原理解析 | 猫耳',
  'article/node3/index.html': '3、Shadowsocks协议自建节点搭建教程：服务端部署与客户端连接实战 | 猫耳',
  'article/node4/index.html': '4、Trojan协议自建节点搭建教程：TLS证书申请、Nginx伪装与防封锁 | 猫耳',
  'article/node5/index.html': '5、VMess+WS+TLS+Web高级伪装节点搭建教程：CDN中转加速与防封实战 | 猫耳',
  'article/node6/index.html': '6、VLESS+XTLS+回落自建节点搭建教程：Xray内核高效传输与安全配置 | 猫耳',
  'article/node7/index.html': '7、影响翻墙节点速度的因素有哪些？线路回程、带宽拥塞与协议开销解析 | 猫耳',
  'article/node8/index.html': '8、如何零成本提升节点速度？BBR拥塞控制、DNS调优与路由优选实战技巧 | 猫耳',
  'notes/cheping/nodeConstruction/description/index.html': '2026科学上网自建节点搭建专栏导读：从网络基础到主流加密协议实战指南 | 猫耳',
  'notes/cheping/nodeConstruction/node1/index.html': '1、跨境网络通信基本过程深度解析：TCP/IP握手、DNS与代理转发原理 | 猫耳',
  'notes/cheping/nodeConstruction/node2/index.html': '2、如何绕过防火墙拦截：GFW深度包检测与现代加密传输伪装原理解析 | 猫耳',
  'notes/cheping/nodeConstruction/node3/index.html': '3、Shadowsocks协议自建节点搭建教程：服务端部署与客户端连接实战 | 猫耳',
  'notes/cheping/nodeConstruction/node4/index.html': '4、Trojan协议自建节点搭建教程：TLS证书申请、Nginx伪装与防封锁 | 猫耳',
  'notes/cheping/nodeConstruction/node5/index.html': '5、VMess+WS+TLS+Web高级伪装节点搭建教程：CDN中转加速与防封实战 | 猫耳',
  'notes/cheping/nodeConstruction/node6/index.html': '6、VLESS+XTLS+回落自建节点搭建教程：Xray内核高效传输与安全配置 | 猫耳',
  'notes/cheping/nodeConstruction/node7/index.html': '7、影响翻墙节点速度的因素有哪些？线路回程、带宽拥塞与协议开销解析 | 猫耳',
  'notes/cheping/nodeConstruction/node8/index.html': '8、如何零成本提升节点速度？BBR拥塞控制、DNS调优与路由优选实战技巧 | 猫耳',
};

const descOverrides = {
  'index.html': '猫耳技术博客官方首页 (maoer.blog)：专注2026稳定高速科学上网机场推荐与横评，深度汇集神行加速、大佬云、榴莲云、云界线等主流IPLC专线实测、Clash/Mihomo/Sing-box与小火箭Shadowrocket客户端分流配置实战，以及自建节点技术原理解析与防跑路避坑选购指南。',
  'blog/index.html': '猫耳技术博客全站文章列表页：系统收录2026高性价比科学上网机场实测报告、IPLC与IEPL国际专线及BGP中转技术对比、Clash Verge Rev与Mihomo Party及Shadowrocket小火箭客户端配置教程、自建节点部署实战与行业跑路预警清单，帮助个人与出海团队高效选型并全面避坑。',
  'blog/categories/index.html': '猫耳技术博客全站内容分类导航页：为您系统梳理2026翻墙机场深度评测、Clash与Sing-box全平台客户端配置教程、自建节点与代理协议技术科普以及行业防跑路避坑随笔等四大核心专题栏目，助您按使用场景与多端设备需求快速定位稳定可靠的跨境网络加速方案、实操指南与线路深度优化实用进阶操作技巧。',
  'blog/tags/index.html': '猫耳技术博客热门技术标签索引中心：集中聚合2026机场评测、IPLC专线、Clash Verge、Mihomo内核、Sing-box、Shadowrocket小火箭、v2rayN、VLESS与Trojan自建节点、流媒体解锁及ChatGPT原生IP筛选等全站核心专题标签，方便按技术关键词精准检索查阅。',
  'blog/archives/index.html': '猫耳技术博客全站历史文章时间轴归档页：完整记录2026年持续更新的各大翻墙机场真实测速与官方资费核验、主流Clash与Sing-box代理客户端版本迭代配置教程、国际线路骨干拥塞深度分析及防跑路风险监测档案，支持按发布年份与月份快速回溯查找各类科学上网实操技术参考与选型防跑路避坑实用指南。',
};

function normalizeMetaDesc(rawTitle, existingDesc) {
  let base = (existingDesc || '').replace(/\s+/g, ' ').trim();
  const suffixParts = [
    '本文由猫耳技术博客(maoer.blog)深度整理，涵盖2026实测链路表现、客户端分流配置优化与常见问题排查实用建议，助您避开常见网络坑点并稳定流畅访问海外资源。',
  ];

  // 移除重复模板后缀以便重新精确控长
  base = base.replace(/\s*-\s*猫耳技术博客\s*\(maoer\.blog\)[\s\S]*$/i, '').trim();

  if (!base || base === rawTitle || base.length < 25) {
    base = `${rawTitle}：猫耳技术博客(maoer.blog)为您带来的2026最新实操指南，深入解析核心原理、网络线路挑选、全平台客户端分流配置步骤与高频报错排查实用技巧。`;
  }

  if (base.length < 148) {
    const pad = '同时系统提供Windows、macOS、Android与iOS全平台客户端订阅导入操作演示、晚高峰真实链路延迟抖动分析、Netflix流媒体与ChatGPT原生IP解锁参考及购买前防跑路避坑实用指南，助您安全高效构建稳定跨境网络连接。';
    const cleanBase = base.replace(/[。！？；，、]+$/, '');
    const need = 155 - cleanBase.length - 1;
    if (need > 6) {
      let extra = pad.slice(0, need);
      extra = extra.replace(/[，、；：]$/, '');
      if (!/[。！？]$/.test(extra)) extra = extra.slice(0, Math.max(1, extra.length - 1)) + '。';
      base = `${cleanBase}，${extra}`;
    }
  }

  if (base.length > 158) {
    base = base.slice(0, 157).replace(/[，、；：]+$/, '') + '。';
  }
  return base;
}

function fixHtmlSeoTags(dir) {
  let fixedNoindex = 0;
  let fixedTitle = 0;
  let fixedDesc = 0;

  function walkAndFix(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walkAndFix(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const rel = path.relative(distDir, fullPath).replace(/\\/g, '/');
        let html = fs.readFileSync(fullPath, 'utf8');
        const originalHtml = html;

        // 1. noindex 处理：404、preview-colors、redirecting、go/*
        const mustNoindex = rel === '404.html' || rel === 'preview-colors.html' || rel.startsWith('article/redirecting/') || rel.startsWith('go/');
        if (mustNoindex) {
          if (!/<meta\s+name=["']robots["']/i.test(html)) {
            html = html.replace(/<head([^>]*)>/i, '<head$1><meta name="robots" content="noindex, nofollow" />');
            fixedNoindex++;
          } else {
            html = html.replace(/<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/i, '<meta name="robots" content="noindex, nofollow" />');
          }
          if (html !== originalHtml) {
            fs.writeFileSync(fullPath, html, 'utf8');
          }
          continue;
        }

        // 2. 修复过短标题 (< 32 字符)
        const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
        let currentTitle = titleMatch ? titleMatch[1].trim() : '';
        let targetTitle = titleOverrides[rel] || currentTitle;

        if (!titleOverrides[rel] && targetTitle.length > 0 && targetTitle.length < 32) {
          const cleanName = targetTitle.replace(/\s*\|\s*猫耳$/, '').trim();
          targetTitle = `${cleanName}：2026科学上网线路实测与配置实战指南 | 猫耳`;
        }

        if (targetTitle && targetTitle !== currentTitle) {
          html = html.replace(/<title>[^<]*<\/title>/i, `<title>${targetTitle}</title>`);
          html = html.replace(/<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="og:title" content="${targetTitle}" />`);
          html = html.replace(/<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta name="twitter:title" content="${targetTitle}" />`);
          currentTitle = targetTitle;
          fixedTitle++;
        }

        // 3. 修复过短或过长 meta description（统一至 148-158 字符）
        const rawTitle = currentTitle.replace(/\s*\|\s*.*$/, '').trim();
        const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']\s*\/?>/i);
        const currentDesc = descMatch ? descMatch[1].trim() : '';

        let targetDesc = descOverrides[rel] || currentDesc;
        if (!descOverrides[rel] && (targetDesc.length < 148 || targetDesc.length > 158)) {
          targetDesc = normalizeMetaDesc(rawTitle, targetDesc);
        }

        if (targetDesc && targetDesc !== currentDesc) {
          if (descMatch) {
            html = html.replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta name="description" content="${targetDesc}" />`);
          } else {
            html = html.replace(/<\/title>/i, `</title><meta name="description" content="${targetDesc}" />`);
          }
          html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta property="og:description" content="${targetDesc}" />`);
          html = html.replace(/<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/gi, `<meta name="twitter:description" content="${targetDesc}" />`);
          fixedDesc++;
        }

        if (html !== originalHtml) {
          fs.writeFileSync(fullPath, html, 'utf8');
        }
      }
    }
  }

  walkAndFix(dir);
  return { fixedNoindex, fixedTitle, fixedDesc };
}

const seoStats = fixHtmlSeoTags(distDir);
console.log(`[post-build] SEO 全站强化完成: 注入 noindex=${seoStats.fixedNoindex}, 扩充短标题=${seoStats.fixedTitle}, 规范化描述=${seoStats.fixedDesc}`);

// 5. 同步 robots.txt 与 IndexNow 文件
const robotsSrc = path.join(docsDir, '.vuepress', 'public', 'robots.txt');
if (fs.existsSync(robotsSrc)) {
  fs.copyFileSync(robotsSrc, path.join(distDir, 'robots.txt'));
}

// 6. 将整个 docs/.vuepress/dist 同步到根目录 dist 及 .vitepress/dist (三保险全兼容 Cloudflare Pages 输出目录设置)
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
