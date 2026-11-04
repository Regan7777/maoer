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

const options = {
  hostname: 'api.indexnow.org',
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
    console.log(`[IndexNow] API 响应状态码: ${res.statusCode} ${res.statusMessage}`);
    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log('✅ [IndexNow] 提交成功！Bing 搜索引擎已接收并排队处理抓取任务。');
    } else {
      console.log(`ℹ️ [IndexNow] 返回内容: ${data || '(无额外内容)'}`);
      if (res.statusCode === 422) {
        console.log('提示: 若当前域名 maoer.blog 尚未解析到公网或刚上线，IndexNow 校验 key.txt 可能未命中，待上线公网后重新执行即可。');
      }
    }
  });
});

req.on('error', (e) => {
  console.error(`[IndexNow] 请求出错: ${e.message}`);
});

req.write(payload);
req.end();

