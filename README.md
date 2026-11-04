# 个人技术测评与知识库博客（基于 VuePress 2 + Plume）

本项目完全逆向解析并复刻了 [Clash测评站 (mahu.blog)](https://mahu.blog/) 的底层技术栈与主题架构。框架骨架已完整搭建并验证通过，后续只需专注于填充文章与笔记内容。

---

## 🛠️ 技术栈与特性

- **静态站点生成器**：[VuePress 2.0 (Vue 3 + Vite)](https://v2.vuepress.vuejs.org/zh/)
- **博客/文档主题**：[`vuepress-theme-plume`](https://theme-plume.vuejs.press/)
- **构建工具**：Vite（极致的冷启动速度与毫秒级热更新）
- **语言**：TypeScript / Markdown
- **核心功能**：
  - 🎨 **全屏炫酷 Hero 首页**：支持动态渐变光晕与自定义按钮组。
  - 📝 **完整博客系统**：内置文章列表、分页、标签聚合、时间轴归档、多级分类。
  - 📚 **结构化专栏/知识库（Notes）**：多层级侧边栏、章节导航、阅读进度提示。
  - 🌓 **亮色/深色模式**：支持系统跟随与一键无缝切换。
  - 🔍 **代码块增强**：代码高亮、一键复制、容器组件（Tip、Warning、Info 等）。
  - ⚡ **开箱即用**：依赖与配置已全部预设并验证通过。

---

## 🚀 常用命令

推荐使用 `pnpm`（也可以使用 `npm`）：

```bash
# 启动本地开发调试服务器（默认地址：http://localhost:8080）
pnpm dev

# 构建生产环境静态文件（输出至 docs/.vuepress/dist）
pnpm build

# 清理开发缓存
pnpm clean
```

---

## 📁 目录结构说明

```text
├── docs/
│   ├── .vuepress/
│   │   ├── config.ts          # 站点核心配置（网站标题、描述、插件）
│   │   ├── plume.config.ts    # Plume 主题配置（个人名片、页脚、深浅色等）
│   │   ├── navbar.ts          # 顶部导航栏配置
│   │   ├── notes.ts           # 知识库/专栏结构与侧边栏配置
│   │   └── public/            # 静态资源（Logo 图标、图片等）
│   │       └── logo.svg
│   │
│   ├── README.md              # 网站首页（Hero 区域与特性展示）
│   │
│   ├── blog/                  # 博客文章目录
│   │   ├── README.md          # 博客列表首页
│   │   ├── client-guide.md    # 示例文章 1
│   │   └── network-analysis.md# 示例文章 2
│   │
│   └── notes/                 # 专栏 / 知识库目录
│       └── cheping/
│           ├── nodeConstruction/ # 节点搭建专栏文档
│           └── study/            # 测评知识专栏文档
│
├── package.json               # 项目依赖与运行脚本
├── pnpm-workspace.yaml        # pnpm 构建依赖规则与依赖重写
├── tsconfig.json              # TypeScript 编译配置
└── README.md                  # 本文档
```

---

## ✍️ 如何填充与撰写内容

### 1. 发布一篇新博客文章

在 `docs/blog/` 目录下新建 `.md` 文件（如 `my-post.md`），头部填入 Frontmatter 元数据：

```markdown
---
title: 这里写文章标题
createTime: 2026-11-03 18:00:00
author: 博客作者
tags:
  - 标签1
  - 标签2
categories:
  - 分类名（例如：Clash使用教程 或 网络服务商测评）
---

## 正文大纲

从这里开始撰写正文内容，支持标准 Markdown 语法与扩展语法：

::: tip 提示容器
这是一个醒目的提示卡片。
:::
```

### 2. 添加知识库专栏/章节

1. 在 `docs/notes/` 下创建对应的专栏目录（例如 `docs/notes/cheping/study/`）。
2. 在该目录下放置章节 `.md` 文件。
3. 打开 `docs/.vuepress/notes.ts`，在 `items` 数组中添加文件名即可自动生成侧边栏。

---

## 🌐 网站个性化配置

- **修改网站名称与副标题**：编辑 `docs/.vuepress/config.ts` 中的 `title` 与 `description`。
- **修改首页大标题与按钮**：编辑 `docs/README.md` 的 Frontmatter 区域中的 `hero` 字段。
- **修改导航栏菜单**：编辑 `docs/.vuepress/navbar.ts`。
- **更换网站 Logo 与头像**：将你的图片放置到 `docs/.vuepress/public/` 中，并在 `plume.config.ts` 中指定路径（例如 `/logo.svg`）。

---

## 🚢 部署上线推荐

由于是纯静态网站，可以 0 成本托管至全球各大 CDN 平台（正如原站使用的 Cloudflare）：

### 推荐：Cloudflare Pages（原站方案）
1. 将本项目推送到 GitHub 或 GitLab 仓库。
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 **Workers & Pages** -> **Create application** -> **Pages**。
3. 关联你的 GitHub 仓库。
4. 构建设置填入：
   - **Framework preset**：`VuePress`
   - **Build command**：`pnpm build`
   - **Build output directory**：`docs/.vuepress/dist`
5. 点击 **Save and Deploy**，即可自动分配 `*.pages.dev` 免费域名并支持绑定自定义域名。

