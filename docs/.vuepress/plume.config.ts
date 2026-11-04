import { defineThemeConfig } from 'vuepress-theme-plume'
import { navbar } from './navbar'
import { notes } from './notes'

export default (defineThemeConfig as any)({
  logo: '/images/logo.jpg',
  profile: {
    avatar: '/images/maoer.jpg',
    name: '猫耳',
    description: 'maoer.blog · 2026机场推荐·科学上网',
    circle: false,
  },
  social: [],
  navbarSocialInclude: [],
  navbar,
  notes,
  sidebar: {
    '/article/': [
      {
        text: '技术教程与深度分析',
        collapsed: false,
        items: [
          { text: '出海线路深度测评', link: '/article/network-analysis/' },
          { text: '客户端配置指南', link: '/article/client-guide/' },
        ],
      },
    ],
    '/blog/': [
      {
        text: '技术教程与深度分析',
        collapsed: false,
        items: [
          { text: '出海线路深度测评', link: '/article/network-analysis/' },
          { text: '客户端配置指南', link: '/article/client-guide/' },
        ],
      },
    ],
  },
  blog: {
    pagination: 15,
    postList: true,
    tags: true,
    archives: true,
    categories: true,
    link: '/blog/',
    tagsLink: '/blog/tags/',
    archivesLink: '/blog/archives/',
    categoriesLink: '/blog/categories/',
    categoriesTransform(categories: any) {
      return categories.filter((item: any) => item.name !== 'blog')
    },
  },
  lastUpdated: {
    formatOptions: {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  },
  footer: {
    message: 'Copyright © 2026 猫耳 · <a href="https://maoer.blog" target="_blank" rel="noopener">maoer.blog</a>',
    copyright: 'Powered by VuePress & VuePress Theme Plume',
  },
})
