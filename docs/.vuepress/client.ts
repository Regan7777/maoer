import { defineClientConfig } from 'vuepress/client'
import Layout from './layouts/Layout.vue'
import ServiceRecommendRail from './components/ServiceRecommendRail.vue'
import './styles/index.css'

export default defineClientConfig({
  layouts: {
    Layout,
  },
  enhance({ app }) {
    app.component('ServiceRecommendRail', ServiceRecommendRail)
  },
})

