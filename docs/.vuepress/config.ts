import fs from 'node:fs'
import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: '猫耳',
  description: '猫耳技术博客 (maoer.blog)：专注 2026 稳定高速机场推荐、科学上网翻墙梯子实测、Clash / Sing-box / Shadowrocket 客户端分流配置教程，以及自建节点与跨境网络线路深度优化指南。',

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/favicon.jpg' }],
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'keywords', content: '猫耳, maoer.blog, 2026机场推荐, 科学上网, 机场评测, Clash使用教程, IPLC专线, 节点搭建' }],
    // Bing 站长平台官方所有权验证
    ['meta', { name: 'msvalidate.01', content: '8BEA8052606A0C15AACD9FF35D7E6180' }],
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
