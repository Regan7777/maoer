<script setup lang="ts">
import { Layout as PlumeLayout } from 'vuepress-theme-plume/client'
import ServiceRecommendRail from '../components/ServiceRecommendRail.vue'
import { computed, watchEffect, onMounted } from 'vue'
import { useRoute, usePageData } from 'vuepress/client'

const route = useRoute()
const pageData = usePageData()

// 确保客户端 hydration 后所有图片均具备完备的 alt 描述（彻底杜绝 Bing 抓取告警）
onMounted(() => {
  const patchImgAlt = () => {
    if (typeof document === 'undefined') return
    document.querySelectorAll('img').forEach((img) => {
      const alt = img.getAttribute('alt')
      if (!alt || alt.trim() === '') {
        const isLogo = img.classList.contains('logo') || (img.getAttribute('src') || '').includes('logo')
        img.setAttribute('alt', isLogo ? '猫耳博客 Logo' : '猫耳博客配图')
      }
    })
  }
  patchImgAlt()
  setTimeout(patchImgAlt, 500)
})

// 确保浏览器 Tab 标签页始终展示完整的文章大标题与品牌词
watchEffect(() => {
  if (typeof document !== 'undefined') {
    const currentTitle = pageData.value?.title
    if (currentTitle) {
      document.title = currentTitle.includes('猫耳') ? currentTitle : `${currentTitle} | 猫耳`
    } else {
      document.title = '2026年机场推荐科学上网：高性价比Clash翻墙梯子实测指南 | 猫耳'
    }
  }
})

// 只要不是 notes 知识库页面（小白学习站 / Clash 专栏），属于文章页侧边栏布局
const isArticlePage = computed(() => !route.path.startsWith('/notes/'))
</script>

<template>
  <div :class="{ 'is-article-sidebar': isArticlePage }">
    <PlumeLayout>
      <!-- 在文章页左侧边栏位置展示「网络服务推荐」（替换原技术教程目录） -->
      <template #sidebar-nav-before>
        <ServiceRecommendRail v-if="isArticlePage" />
      </template>
    </PlumeLayout>
  </div>
</template>
