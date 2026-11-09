const https = require('https');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sitemapPath = path.join(projectRoot, 'docs', '.vuepress', 'public', 'sitemap.xml');

const host = 'maoer.blog';
const key = '9b7f0616c9694d10a3575b5c2db8e699';
const keyLocation = `https://${host}/${key}.txt`;

console.log('[IndexNow] 开始准备向 Bing / IndexNow 官方 API 提交全站 URL...');

if (!fs.existsSync(sitemapPath)) {
  console.error('[IndexNow] 错误: 未找到 sitemap.xml，请先运行 pnpm build');
  process.exit(1);
}

const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
const locMatches = [...sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g)];
const urlList = locMatches.map(m => m[1]);

console.log(`[IndexNow] 待提交 URL 数量: ${urlList.length} 条`);
console.log(`[IndexNow] 认证 Key: ${key}`);
console.log(`[IndexNow] Key 验证文件地址: ${keyLocation}`);

const payload = JSON.stringify({
  host: host,
  key: key,
  keyLocation: keyLocation,
  urlList: urlList,
});

const endpoints = [
  'api.indexnow.org',
  'www.bing.com'
];

endpoints.forEach((hostname) => {
  const options = {
    hostname: hostname,
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`[IndexNow -> ${hostname}] 状态码: ${res.statusCode} ${res.statusMessage}`);
      if (res.statusCode === 200 || res.statusCode === 202) {
        console.log(`[IndexNow -> ${hostname}] 提交成功！`);
      } else {
        console.log(`[IndexNow -> ${hostname}] 返回内容: ${data || '(无)'}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`[IndexNow -> ${hostname}] 请求出错: ${e.message}`);
  });

  req.write(payload);
  req.end();
});

