<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, withBase } from 'vuepress/client'

interface ProviderItem {
  id: number
  name: string
  desc: string
  logo: string
  link: string
  keyword: string
}

const route = useRoute()
const router = useRouter()

function navigate(link: string, e: MouseEvent) {
  if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
    e.preventDefault()
    router.push(link)
  }
}

const providers: ProviderItem[] = [
  {
    id: 1,
    name: '神行加速',
    desc: '套餐、设备限制以当前规则为准',
    logo: '/images/airports/shenxing-logo.webp',
    link: '/article/shenxing/',
    keyword: 'shenxing',
  },
  {
    id: 2,
    name: '大佬云',
    desc: '先按实际网络验证可用性',
    logo: '/images/airports/dalaoyun-logo.webp',
    link: '/article/dalao/',
    keyword: 'dalao',
  },
  {
    id: 3,
    name: '榴莲云',
    desc: '核对客户端来源与系统支持',
    logo: '/images/airports/liulianyun-logo.webp',
    link: '/article/liulian/',
    keyword: 'liulian',
  },
  {
    id: 4,
    name: '云界线',
    desc: '折扣及套餐以下单页实际为准',
    logo: '/images/airports/yunjiexian-logo.webp',
    link: '/article/yunjiexian/',
    keyword: 'yunjiexian',
  },
  {
    id: 5,
    name: '闪电鼠',
    desc: '带宽宣传不等于个人实际测速',
    logo: '/images/airports/shandianshu-logo.webp',
    link: '/article/shandianshu/',
    keyword: 'shandianshu',
  },
  {
    id: 6,
    name: '环球梯',
    desc: '订购前核对流量、有效期限',
    logo: '/images/airports/huanqiuti-logo.webp',
    link: '/article/huanqiuti/',
    keyword: 'huanqiuti',
  },
]

const currentPath = computed(() => route.path)

function isActive(item: ProviderItem) {
  return currentPath.value.includes(item.link) || currentPath.value.includes(item.keyword)
}
</script>

<template>
  <div class="service-recommend-rail">
    <!-- 头部标识 -->
    <div class="rail-header">
      <span class="badge-featured">本站精选</span>
      <span class="badge-ad">推广</span>
    </div>

    <!-- 推荐主标题 -->
    <h3 class="rail-title">网络服务推荐</h3>

    <!-- 6个精选站列表 -->
    <div class="rail-list">
      <a
        v-for="item in providers"
        :key="item.id"
        :href="withBase(item.link)"
        class="rail-item"
        :class="{ active: isActive(item) }"
        @click="navigate(item.link, $event)"
      >
        <!-- 序号 1-6 -->
        <span class="item-rank">{{ item.id }}</span>

        <!-- Logo 头像 -->
        <div class="item-avatar">
          <img :src="withBase(item.logo)" :alt="item.name" loading="lazy" />
        </div>

        <!-- 标题与简介 -->
        <div class="item-info">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-desc" :title="item.desc">{{ item.desc }}</span>
        </div>

        <!-- 右侧箭头 -->
        <span class="item-arrow">→</span>
      </a>
    </div>

    <!-- 底部免责声明与选购指南入口 -->
    <div class="rail-footer">
      <p class="rail-disclaimer">
        以下为推广入口，不代表安全、性能或持续经营保证。套餐以服务商当前说明为准，建议先短期验证。
      </p>
      <a
        :href="withBase('/article/clash-recommend-2026/')"
        class="rail-guide-link"
        :class="{ active: currentPath.includes('/article/clash-recommend-2026/') }"
        @click="navigate('/article/clash-recommend-2026/', $event)"
      >
        查看选购与验证指南 →
      </a>
    </div>
  </div>
</template>

<style scoped>
.service-recommend-rail {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
}

.rail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.badge-featured {
  font-size: 15px;
  font-weight: 800;
  color: #0284c7;
  letter-spacing: 0.5px;
}

[data-theme='dark'] .badge-featured {
  color: #38bdf8;
}

.badge-ad {
  font-size: 12px;
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.4);
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.4;
}

.rail-title {
  margin: 4px 0 14px;
  padding: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--vp-c-text-1, #0f172a);
  line-height: 1.3;
}

.rail-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rail-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
}

.rail-item:hover {
  background-color: var(--vp-c-default-soft, rgba(0, 0, 0, 0.05));
  text-decoration: none;
}

[data-theme='dark'] .rail-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.rail-item.active {
  background-color: rgba(2, 132, 199, 0.1);
}

[data-theme='dark'] .rail-item.active {
  background-color: rgba(56, 189, 248, 0.15);
}

.item-rank {
  width: 22px;
  font-size: 17px;
  font-weight: 800;
  color: #0284c7;
  text-align: center;
  margin-right: 8px;
  flex-shrink: 0;
}

[data-theme='dark'] .item-rank {
  color: #38bdf8;
}

.item-avatar {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
  background-color: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

[data-theme='dark'] .item-avatar {
  background-color: #1e293b;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.item-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.item-name {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--vp-c-text-1, #1e293b);
  line-height: 1.3;
  margin-bottom: 3px;
}

.item-desc {
  font-size: 12.5px;
  color: var(--vp-c-text-2, #64748b);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-arrow {
  margin-left: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #0284c7;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

[data-theme='dark'] .item-arrow {
  color: #38bdf8;
}

.rail-item:hover .item-arrow {
  transform: translateX(4px);
}

.rail-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--vp-c-divider, rgba(0, 0, 0, 0.08));
}

.rail-disclaimer {
  margin: 0 0 10px 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--vp-c-text-3, #94a3b8);
  letter-spacing: 0.2px;
}

[data-theme='dark'] .rail-disclaimer {
  color: #94a3b8;
}

.rail-guide-link {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #0284c7;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: all 0.2s ease;
}

.rail-guide-link:hover {
  color: #0369a1;
  text-decoration: underline;
}

[data-theme='dark'] .rail-guide-link {
  color: #38bdf8;
}

[data-theme='dark'] .rail-guide-link:hover {
  color: #7dd3fc;
}

.rail-guide-link.active {
  font-weight: 700;
}
</style>
