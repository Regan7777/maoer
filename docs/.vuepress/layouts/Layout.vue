<script setup lang="ts">
import { Layout as PlumeLayout } from 'vuepress-theme-plume/client'
import ServiceRecommendRail from '../components/ServiceRecommendRail.vue'
import { computed, watchEffect } from 'vue'
import { useRoute, usePageData } from 'vuepress/client'

const route = useRoute()
const pageData = usePageData()

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
