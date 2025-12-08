<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dashboard from './components/Dashboard.vue'
import FloatWindow from './components/FloatWindow.vue'
import Settings from './components/Settings.vue'
import StockDetail from './components/StockDetail.vue'

// 页面状态
type Page = 'dashboard' | 'settings' | 'detail'
const currentPage = ref<Page>('dashboard')
const isFloatWindow = ref(false)
const detailCode = ref('')

const openSettings = () => { currentPage.value = 'settings' }
const backToDashboard = () => { currentPage.value = 'dashboard' }

// 打开股票详情
const openStockDetail = (code: string) => {
  detailCode.value = code
  currentPage.value = 'detail'
}

onMounted(() => {
  isFloatWindow.value = window.location.hash === '#/float'
  window.addEventListener('hashchange', () => {
    isFloatWindow.value = window.location.hash === '#/float'
  })
})
</script>

<template>
  <FloatWindow v-if="isFloatWindow" />
  <template v-else>
    <Settings v-if="currentPage === 'settings'" @back="backToDashboard" />
    <StockDetail v-else-if="currentPage === 'detail'" :code="detailCode" @back="backToDashboard" />
    <Dashboard v-else @openSettings="openSettings" @openDetail="openStockDetail" />
  </template>
</template>
