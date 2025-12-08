<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
    <div class="max-w-6xl mx-auto">
      <!-- 头部区域 -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-slate-800">{{ t('title') }}</h1>
        <div class="flex items-center gap-2">
          <button @click="toggleLanguage" class="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            {{ currentLang === 'en' ? '中文' : 'English' }}
          </button>
          <button @click="$emit('openSettings')" class="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            ⚙️ {{ t('settings') }}
          </button>
        </div>
      </div>

      <!-- 添加股票卡片 -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
        <div class="flex gap-3">
          <input v-model="newStockCode" :placeholder="t('placeholder')" @keyup.enter="handleAddStock" :disabled="loading"
            class="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-slate-50" />
          <button @click="handleAddStock" :disabled="loading"
            class="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-blue-300 transition-colors">
            {{ loading ? t('adding') : t('add') }}
          </button>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMsg" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
        {{ errorMsg }}
      </div>

      <!-- 预警通知 -->
      <div v-if="alertNotifications.length > 0" class="mb-6 space-y-2">
        <div v-for="(alert, idx) in alertNotifications" :key="idx" 
          class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex justify-between items-start">
          <div>
            <div class="font-medium">{{ alert.name }} ({{ alert.code }})</div>
            <div v-for="msg in alert.messages" :key="msg" class="text-amber-600">{{ msg }}</div>
          </div>
          <button @click="dismissAlert(idx)" class="text-amber-400 hover:text-amber-600">✕</button>
        </div>
      </div>

      <!-- 股票列表卡片 -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="px-2 py-3 w-8"></th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{{ t('col_code') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{{ t('col_name') }}</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">{{ t('col_price') }}</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">{{ t('col_change') }}</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">{{ t('col_high') }}</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">{{ t('col_low') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{{ t('col_time') }}</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">{{ t('col_action') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(stock, index) in stockData" :key="stock.code" 
              class="hover:bg-slate-50 transition-colors cursor-pointer"
              draggable="true"
              @dragstart="handleDragStart(index)"
              @dragover.prevent="handleDragOver(index)"
              @drop="handleDrop(index)"
              @dragend="handleDragEnd"
              @click="handleRowClick(stock.code, $event)">
              <!-- 拖拽手柄 -->
              <td class="px-2 py-4 cursor-move text-slate-300 hover:text-slate-500" @click.stop>
                <span class="text-lg">⋮⋮</span>
              </td>
              <td class="px-4 py-4 text-sm font-mono text-slate-700">
                {{ stock.code }}
                <span v-if="alerts[stock.code]?.enabled" class="ml-1 text-amber-500" title="已设置预警">🔔</span>
              </td>
              <td class="px-4 py-4 text-sm font-medium text-slate-800">{{ stock.name }}</td>
              <td class="px-4 py-4 text-sm text-right font-semibold" :class="getPriceClass(stock.change_percent)">
                {{ stock.price }}
              </td>
              <td class="px-4 py-4 text-sm text-right font-medium" :class="getPriceClass(stock.change_percent)">
                <span class="inline-flex items-center gap-1">
                  <span v-if="parseFloat(stock.change_percent) > 0">↑</span>
                  <span v-else-if="parseFloat(stock.change_percent) < 0">↓</span>
                  {{ stock.change_percent }}%
                </span>
              </td>
              <td class="px-4 py-4 text-sm text-right text-slate-600">{{ stock.high }}</td>
              <td class="px-4 py-4 text-sm text-right text-slate-600">{{ stock.low }}</td>
              <td class="px-4 py-4 text-sm text-slate-500">{{ stock.time }}</td>
              <td class="px-4 py-4 text-center" @click.stop>
                <div class="flex items-center justify-center gap-2">
                  <button @click="handleSetFocus(stock.code)" 
                    :class="focusedStock === stock.code ? 'bg-amber-100 text-amber-600 border-amber-300' : 'text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-500'"
                    class="px-2 py-1 text-xs border rounded transition-colors" :title="t('focus')">
                    ⭐
                  </button>
                  <button @click="openAlertModal(stock)" class="px-2 py-1 text-xs text-blue-500 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                    {{ t('alert') }}
                  </button>
                  <button @click="handleRemoveStock(stock.code)" class="px-2 py-1 text-xs text-slate-500 border border-slate-200 rounded hover:bg-red-50 hover:text-red-500 transition-colors">
                    {{ t('remove') }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="stockData.length === 0">
              <td colspan="9" class="px-4 py-12 text-center text-slate-400 text-sm">{{ t('empty') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 底部状态栏 -->
      <div class="mt-4 text-center text-xs text-slate-400">
        {{ t('auto_refresh') }}
      </div>
    </div>

    <!-- 预警设置弹窗 -->
    <div v-if="showAlertModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeAlertModal">
      <div class="bg-white rounded-xl shadow-xl w-96 p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">
          {{ t('alert_settings') }} - {{ currentAlertStock?.name }}
        </h3>
        
        <div class="space-y-4">
          <!-- 止盈价 -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">{{ t('take_profit') }}</label>
            <input v-model="alertForm.take_profit" type="number" step="0.01" :placeholder="t('take_profit_hint')"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <!-- 止损价 -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">{{ t('stop_loss') }}</label>
            <input v-model="alertForm.stop_loss" type="number" step="0.01" :placeholder="t('stop_loss_hint')"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <!-- 涨跌幅预警 -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">{{ t('change_alert') }}</label>
            <input v-model="alertForm.change_alert" type="number" step="0.1" :placeholder="t('change_alert_hint')"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <!-- 启用开关 -->
          <div class="flex items-center gap-2">
            <input v-model="alertForm.enabled" type="checkbox" id="alert-enabled" class="w-4 h-4 text-blue-500" />
            <label for="alert-enabled" class="text-sm text-slate-600">{{ t('enable_alert') }}</label>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button @click="closeAlertModal" class="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            {{ t('cancel') }}
          </button>
          <button @click="saveAlert" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            {{ t('save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getStocks, addStock, removeStock, getSettings, reorderStocks, setAlert, getTriggeredAlerts, setFocusedStock } from '../api'

const emit = defineEmits(['openSettings', 'openDetail'])

// 响应式状态
const newStockCode = ref('')
const stockData = ref<any[]>([])
const alerts = ref<Record<string, any>>({})
const loading = ref(false)
const errorMsg = ref('')
const refreshInterval = ref(5)
const alertNotifications = ref<any[]>([])
const focusedStock = ref<string | null>(null)

type Lang = 'en' | 'zh'
const currentLang = ref<Lang>('zh')
let intervalId: ReturnType<typeof setInterval> | null = null
let alertCheckId: ReturnType<typeof setInterval> | null = null

// 拖拽状态
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// 预警弹窗状态
const showAlertModal = ref(false)
const currentAlertStock = ref<any>(null)
const alertForm = ref({
  take_profit: '',
  stop_loss: '',
  change_alert: '',
  enabled: true,
})

// 多语言
const translations: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Stock Monitor',
    placeholder: 'Stock Code (e.g., 600519)',
    add: 'Add', adding: 'Adding...', remove: 'Remove', alert: 'Alert', focus: 'Focus',
    empty: 'No stocks monitored. Add one to start.',
    col_code: 'Code', col_name: 'Name', col_price: 'Price', col_change: 'Change',
    col_high: 'High', col_low: 'Low', col_time: 'Time', col_action: 'Action',
    auto_refresh: 'Auto-refreshing every {interval} seconds',
    settings: 'Settings',
    alert_settings: 'Alert Settings',
    take_profit: 'Take Profit Price', take_profit_hint: 'Alert when price >=',
    stop_loss: 'Stop Loss Price', stop_loss_hint: 'Alert when price <=',
    change_alert: 'Change Alert (%)', change_alert_hint: 'Alert when change >=',
    enable_alert: 'Enable Alert', cancel: 'Cancel', save: 'Save',
  },
  zh: {
    title: '股票监控助手',
    placeholder: '股票代码 (如 600519)',
    add: '添加', adding: '添加中...', remove: '删除', alert: '预警', focus: '关注',
    empty: '暂无监控股票，请添加。',
    col_code: '代码', col_name: '名称', col_price: '当前价', col_change: '涨跌幅',
    col_high: '最高', col_low: '最低', col_time: '时间', col_action: '操作',
    auto_refresh: '每 {interval} 秒自动刷新',
    settings: '设置',
    alert_settings: '预警设置',
    take_profit: '止盈价格', take_profit_hint: '价格达到时提醒',
    stop_loss: '止损价格', stop_loss_hint: '价格跌至时提醒',
    change_alert: '涨跌幅预警 (%)', change_alert_hint: '涨跌幅达到时提醒',
    enable_alert: '启用预警', cancel: '取消', save: '保存',
  }
}

const t = (key: string) => {
  const text = translations[currentLang.value][key] || key
  return text.replace('{interval}', String(refreshInterval.value))
}

const toggleLanguage = () => {
  currentLang.value = currentLang.value === 'en' ? 'zh' : 'en'
}

const getPriceClass = (changePercent: string) => {
  const value = parseFloat(changePercent)
  if (value > 0) return 'text-red-500'
  if (value < 0) return 'text-green-500'
  return 'text-slate-600'
}

// 拖拽排序
const handleDragStart = (index: number) => { dragIndex.value = index }
const handleDragOver = (index: number) => { dragOverIndex.value = index }
const handleDragEnd = () => { dragIndex.value = null; dragOverIndex.value = null }

const handleDrop = async (index: number) => {
  if (dragIndex.value === null || dragIndex.value === index) return
  
  const items = [...stockData.value]
  const [removed] = items.splice(dragIndex.value, 1)
  items.splice(index, 0, removed)
  stockData.value = items
  
  // 保存新顺序
  const newOrder = items.map(s => s.code)
  await reorderStocks(newOrder)
}

// 预警弹窗
const openAlertModal = (stock: any) => {
  currentAlertStock.value = stock
  const existing = alerts.value[stock.code]
  alertForm.value = {
    take_profit: existing?.take_profit || '',
    stop_loss: existing?.stop_loss || '',
    change_alert: existing?.change_alert || '',
    enabled: existing?.enabled ?? true,
  }
  showAlertModal.value = true
}

const closeAlertModal = () => {
  showAlertModal.value = false
  currentAlertStock.value = null
}

const saveAlert = async () => {
  if (!currentAlertStock.value) return
  await setAlert(currentAlertStock.value.code, alertForm.value)
  alerts.value[currentAlertStock.value.code] = { ...alertForm.value }
  closeAlertModal()
}

const dismissAlert = (index: number) => {
  alertNotifications.value.splice(index, 1)
}

// 更新托盘（文字提示）
const updateTray = () => {
  if (stockData.value.length > 0) {
    const summary = stockData.value.slice(0, 3).map(s => `${s.name}: ${s.price} (${s.change_percent}%)`).join('\n')
    ;(window as any).ipcRenderer?.send('update-tray', summary)
  }
}

// 更新托盘图标（显示重点关注股票的涨跌幅）
const updateTrayIcon = (focusedData: any) => {
  if (focusedData) {
    ;(window as any).ipcRenderer?.send('update-tray-icon', {
      change: focusedData.change_percent,
      price: focusedData.price,
      name: focusedData.name
    })
  }
}

// 设置重点关注
const handleSetFocus = async (code: string) => {
  await setFocusedStock(code)
  focusedStock.value = code
  // 立即更新托盘图标
  const stock = stockData.value.find(s => s.code === code)
  if (stock) {
    updateTrayIcon(stock)
  }
}

// 点击行打开详情
const handleRowClick = (code: string, event: MouseEvent) => {
  // 避免点击按钮时触发
  if ((event.target as HTMLElement).closest('button')) return
  emit('openDetail', code)
}

// 获取数据
const fetchData = async () => {
  try {
    const res = await getStocks()
    // 按照 stocks 顺序排列 data
    const orderedData = res.stocks.map((code: string) => res.data[code]).filter(Boolean)
    stockData.value = orderedData
    alerts.value = res.alerts || {}
    focusedStock.value = res.focused_stock || (res.stocks.length > 0 ? res.stocks[0] : null)
    
    updateTray()
    // 更新托盘图标
    if (res.focused_data) {
      updateTrayIcon(res.focused_data)
    }
  } catch (error) {
    console.error("获取数据失败:", error)
  }
}

// 检查预警
const checkAlerts = async () => {
  try {
    const res = await getTriggeredAlerts()
    if (res.alerts?.length > 0) {
      alertNotifications.value.push(...res.alerts)
      
      // 发送系统通知
      for (const alert of res.alerts) {
        const title = `📈 ${alert.name} 预警触发`
        const body = alert.messages.join('\n') + `\n当前价: ${alert.price}`
        ;(window as any).ipcRenderer?.showNotification(title, body)
      }
    }
  } catch (e) {
    console.error("检查预警失败:", e)
  }
}

const handleAddStock = async () => {
  if (!newStockCode.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await addStock(newStockCode.value)
    if (res.status === 'error') {
      errorMsg.value = res.message
    } else {
      newStockCode.value = ''
      await fetchData()
    }
  } catch (e) {
    errorMsg.value = "添加失败，请检查后端连接"
  } finally {
    loading.value = false
  }
}

const handleRemoveStock = async (code: string) => {
  await removeStock(code)
  fetchData()
}

const loadSettingsAndStart = async () => {
  try {
    const res = await getSettings()
    if (res.status === 'success' && res.settings?.refresh_interval) {
      refreshInterval.value = res.settings.refresh_interval
    }
  } catch (e) {
    console.error('加载设置失败:', e)
  }
  
  fetchData()
  intervalId = setInterval(fetchData, refreshInterval.value * 1000)
  alertCheckId = setInterval(checkAlerts, 3000)
}

onMounted(() => { loadSettingsAndStart() })
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  if (alertCheckId) clearInterval(alertCheckId)
})
</script>
