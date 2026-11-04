import fs from 'node:fs'
import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: '猫耳',
  description: '猫耳 (maoer.blog) - 2026机场推荐·科学上网',

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/favicon.jpg' }],
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'keywords', content: '猫耳, maoer.blog, 2026机场推荐, 科学上网, 机场评测, Clash使用教程, IPLC专线, 节点搭建' }],
    // Bing 站长平台验证（上线后替换为真实 code）
    ['meta', { name: 'msvalidate.01', content: 'BING_VERIFICATION_KEY' }],
  ],

  extendsPage: (page: any) => {
    if (page.contentFilePath && fs.existsSync(page.contentFilePath)) {
      const stats = fs.statSync(page.contentFilePath)
      const mtime = page.frontmatter.dateModified
        ? new Date(page.frontmatter.dateModified).getTime()
        : Math.floor(stats.mtimeMs)
      page.data.git = {
        ...page.data.git,
        updatedTime: mtime,
      }
    }
  },

  bundler: viteBundler(),

  theme: plumeTheme({
    hostname: 'https://maoer.blog',
    plugins: {
      sitemap: {
        hostname: 'https://maoer.blog',
        modifyTimeGetter: (page: any) => {
          const time = page.frontmatter?.dateModified || page.frontmatter?.createTime
          if (time) {
            return new Date(time).toISOString()
          }
          return new Date().toISOString()
        },
      },
      seo: {
        hostname: 'https://maoer.blog',
      },
      shiki: {
        langs: ['yaml', 'bash', 'json', 'typescript', 'javascript', 'html', 'css', 'markdown'],
      },
      markdownPower: {
        demo: true,
      },
    },
  }),
})
