<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
    <div class="max-w-6xl mx-auto">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button @click="$emit('back')" class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            ← {{ $t('common.back') }}
          </button>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">{{ stockInfo.name || code }}</h1>
            <span class="text-sm text-slate-500">{{ code }}</span>
          </div>
        </div>
        <div class="text-right">
          <div class="flex items-center gap-2 mb-1 justify-end">
            <button @click="openAIModal('fast')"
              class="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 border border-purple-200 rounded hover:from-purple-500/20 hover:to-blue-500/20 transition-all flex items-center gap-1">
              ⚡ 快速分析
            </button>
            <button @click="openAIModal('precise')"
              class="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 border border-blue-200 rounded hover:from-blue-500/20 hover:to-cyan-500/20 transition-all flex items-center gap-1">
              🎯 精准分析
            </button>
          </div>
          <div class="text-3xl font-bold" :class="priceClass">{{ stockInfo.price || '--' }}</div>
          <div class="text-sm" :class="priceClass">
            {{ changeSign }}{{ stockInfo.change_percent || '0.00' }}%
          </div>
        </div>
      </div>

      <!-- 基本信息卡片 - 增加涨停/跌停价 -->
      <div class="grid grid-cols-6 gap-3 mb-6">
        <div class="bg-white rounded-xl p-3 shadow-sm">
          <div class="text-xs text-slate-500">{{ $t('detail.open') }}</div>
          <div class="text-base font-semibold text-slate-800">{{ stockInfo.open || '--' }}</div>
        </div>
        <div class="bg-white rounded-xl p-3 shadow-sm">
          <div class="text-xs text-slate-500">{{ $t('detail.pre_close') }}</div>
          <div class="text-base font-semibold text-slate-800">{{ stockInfo.pre_close || '--' }}</div>
        </div>
        <div class="bg-white rounded-xl p-3 shadow-sm">
          <div class="text-xs text-slate-500">{{ $t('detail.high') }}</div>
          <div class="text-base font-semibold text-red-500">{{ stockInfo.high || '--' }}</div>
        </div>
        <div class="bg-white rounded-xl p-3 shadow-sm">
          <div class="text-xs text-slate-500">{{ $t('detail.low') }}</div>
          <div class="text-base font-semibold text-green-500">{{ stockInfo.low || '--' }}</div>
        </div>
        <div class="bg-white rounded-xl p-3 shadow-sm">
          <div class="text-xs text-slate-500">{{ $t('detail.limit_up') }}</div>
          <div class="text-base font-semibold text-red-500">{{ limitUpPrice }}</div>
        </div>
        <div class="bg-white rounded-xl p-3 shadow-sm">
          <div class="text-xs text-slate-500">{{ $t('detail.limit_down') }}</div>
          <div class="text-base font-semibold text-green-500">{{ limitDownPrice }}</div>
        </div>
      </div>

      <!-- 图表切换 -->
      <div class="bg-white rounded-xl shadow-sm mb-6">
        <div class="flex border-b border-slate-100">
          <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
            :class="activeTab === tab.key ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500'"
            class="px-6 py-3 text-sm font-medium transition-colors">
            {{ $t(`detail.${tab.key}`) }}
          </button>
        </div>

        <!-- 图表容器 -->
        <div class="p-4" style="height: 480px;">
          <div v-if="loading" class="flex items-center justify-center h-full text-slate-400">
            {{ $t('common.loading') }}
          </div>
          <v-chart v-else-if="chartOption" :option="chartOption" autoresize class="w-full h-full"
            @datazoom="handleDataZoom" />
        </div>
      </div>

      <!-- 资金流向 -->
      <div v-if="moneyFlowData.length > 0" class="bg-white rounded-xl shadow-sm p-4">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">{{ $t('detail.money_flow') }}</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-xs text-slate-500">{{ $t('detail.main_net_flow') }}</div>
            <div class="text-lg font-semibold" :class="mainNetFlow >= 0 ? 'text-red-500' : 'text-green-500'">
              {{ formatMoney(mainNetFlow) }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-slate-500">{{ $t('detail.big_net_flow') }}</div>
            <div class="text-lg font-semibold" :class="bigNetFlow >= 0 ? 'text-red-500' : 'text-green-500'">
              {{ formatMoney(bigNetFlow) }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-slate-500">{{ $t('detail.small_net_flow') }}</div>
            <div class="text-lg font-semibold" :class="smallNetFlow >= 0 ? 'text-red-500' : 'text-green-500'">
              {{ formatMoney(smallNetFlow) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI 分析弹窗 -->
    <AIAnalysisModal v-model:visible="showAiModal" :stock-code="code" :type="aiType" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, CandlestickChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getStockDetail, getKlineData } from '../api'
import AIAnalysisModal from './AIAnalysisModal.vue'

use([CanvasRenderer, LineChart, CandlestickChart, BarChart, GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent, LegendComponent])

const { t } = useI18n()
const props = defineProps<{ code: string }>()
const emit = defineEmits(['back'])

const loading = ref(true)
const stockInfo = ref<any>({})
const minuteData = ref<any[]>([])
const klineData = ref<any[]>([])
const moneyFlowData = ref<any[]>([])
const activeTab = ref('minute')

// AI 分析
const showAiModal = ref(false)
const aiType = ref<'fast' | 'precise'>('fast')

const openAIModal = (type: 'fast' | 'precise') => {
  aiType.value = type
  showAiModal.value = true
}

// 轮询定时器
let refreshTimer: ReturnType<typeof setInterval> | null = null
const REFRESH_INTERVAL = 5000

// 保存用户的缩放状态，刷新时保持视图位置
const userZoomState = ref<{ start: number; end: number } | null>(null)
const isFirstLoad = ref(true) // 是否首次加载

const tabs = [
  { key: 'minute' },
  { key: 'day' },
  { key: 'week' },
  { key: 'month' },
]

// 计算涨停价和跌停价（A股10%涨跌幅限制）
const limitUpPrice = computed(() => {
  const preClose = parseFloat(stockInfo.value.pre_close || '0')
  if (preClose <= 0) return '--'
  // 判断是否为ST股票（5%涨跌幅）或科创板/创业板（20%涨跌幅）
  const code = props.code
  let limitRate = 0.1 // 默认10%
  if (code.startsWith('sh688') || code.startsWith('sz300') || code.startsWith('688') || code.startsWith('300')) {
    limitRate = 0.2 // 科创板/创业板 20%
  }
  return (preClose * (1 + limitRate)).toFixed(2)
})

const limitDownPrice = computed(() => {
  const preClose = parseFloat(stockInfo.value.pre_close || '0')
  if (preClose <= 0) return '--'
  const code = props.code
  let limitRate = 0.1
  if (code.startsWith('sh688') || code.startsWith('sz300') || code.startsWith('688') || code.startsWith('300')) {
    limitRate = 0.2
  }
  return (preClose * (1 - limitRate)).toFixed(2)
})

const priceClass = computed(() => {
  const change = parseFloat(stockInfo.value.change_percent || '0')
  return change >= 0 ? 'text-red-500' : 'text-green-500'
})

const changeSign = computed(() => {
  const change = parseFloat(stockInfo.value.change_percent || '0')
  return change >= 0 ? '+' : ''
})

// 资金流向计算
const mainNetFlow = computed(() => {
  if (!moneyFlowData.value.length) return 0
  const last = moneyFlowData.value[moneyFlowData.value.length - 1]
  return (last?.big_in || 0) + (last?.super_in || 0)
})

const bigNetFlow = computed(() => {
  if (!moneyFlowData.value.length) return 0
  const last = moneyFlowData.value[moneyFlowData.value.length - 1]
  return last?.big_in || 0
})

const smallNetFlow = computed(() => {
  if (!moneyFlowData.value.length) return 0
  const last = moneyFlowData.value[moneyFlowData.value.length - 1]
  return last?.small_in || 0
})

const formatMoney = (val: number) => {
  if (Math.abs(val) >= 100000000) return (val / 100000000).toFixed(2) + t('detail.yi')
  if (Math.abs(val) >= 10000) return (val / 10000).toFixed(2) + t('detail.wan')
  return val.toFixed(2)
}

// 查找今天数据的起始索引（最后一个日期变化点）
const findTodayStartIndex = () => {
  if (minuteData.value.length < 2) return 0

  // 从后往前找，找到最后一个日期变化点
  let lastSplitIndex = 0
  for (let i = 1; i < minuteData.value.length; i++) {
    const prevDate = minuteData.value[i - 1].date
    const currDate = minuteData.value[i].date
    if (prevDate && currDate && prevDate !== currDate) {
      lastSplitIndex = i // 记录最后一个分割点
    }
  }
  return lastSplitIndex
}



// 计算均价线数据
const calcAvgPrices = () => {
  const result: number[] = []
  let totalAmount = 0
  let totalVolume = 0

  // 找到今天的数据起始点
  const todayStartIdx = findTodayStartIndex()

  for (let i = 0; i < minuteData.value.length; i++) {
    const d = minuteData.value[i]
    if (i >= todayStartIdx) {
      // 今天的数据才计算均价
      totalAmount += d.price * (d.volume || 0)
      totalVolume += d.volume || 0
      result.push(totalVolume > 0 ? totalAmount / totalVolume : d.price)
    } else {
      // 昨天的数据用当前价格
      result.push(d.price)
    }
  }
  return result
}

// 计算MA均线
const calcMA = (data: any[], period: number) => {
  const result: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close
      }
      result.push(sum / period)
    }
  }
  return result
}

// 图表配置
const chartOption = computed(() => {
  if (activeTab.value === 'minute') {
    return getMinuteChartOption()
  } else {
    return getKlineChartOption()
  }
})

const getMinuteChartOption = () => {
  if (!minuteData.value.length) return null

  const times = minuteData.value.map(d => d.time.substring(0, 5)) // 只显示 HH:MM
  const prices = minuteData.value.map(d => d.price)
  const avgPrices = calcAvgPrices()
  const preClose = parseFloat(stockInfo.value.pre_close || '0')

  // 成交量数据
  const volumes = minuteData.value.map((d, idx) => {
    const prevPrice = idx > 0 ? minuteData.value[idx - 1].price : d.price
    return {
      value: d.volume || 0,
      itemStyle: { color: d.price >= prevPrice ? 'rgba(255,77,79,0.7)' : 'rgba(82,196,26,0.7)' }
    }
  })

  // 查找今天数据的起始点
  const todayStartIdx = findTodayStartIndex()

  // 构建 markLine 数据 - 昨收价水平线
  const priceMarkLine: any[] = [
    {
      yAxis: preClose,
      lineStyle: { color: '#faad14', type: 'dashed', width: 1 },
      label: {
        show: true,
        formatter: `昨收 ${preClose}`,
        position: 'insideEndTop',
        color: '#faad14',
        fontSize: 10
      }
    }
  ]

  // 价格图上的日期分割线（在今天数据起始位置）
  if (todayStartIdx > 0) {
    priceMarkLine.push({
      xAxis: todayStartIdx,
      lineStyle: { color: '#3b82f6', type: 'dashed', width: 1 },
      label: {
        show: true,
        formatter: `今日`,
        position: 'insideEndTop',
        color: '#3b82f6',
        fontSize: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: [2, 4],
        borderRadius: 2
      }
    })
  }

  // X轴标签间隔计算
  const labelInterval = Math.floor(times.length / 8)

  // 计算显示范围：如果用户有缩放操作，保持用户的视图；否则使用默认范围
  const totalLen = times.length
  const todayDataLen = totalLen - todayStartIdx
  let startPercent = 0
  let endPercent = 100

  if (userZoomState.value) {
    // 使用用户保存的缩放状态
    startPercent = userZoomState.value.start
    endPercent = userZoomState.value.end
  } else if (isFirstLoad.value && todayStartIdx > 0 && todayDataLen < totalLen * 0.6) {
    // 首次加载时，从今天数据前20个点开始显示
    const showStartIdx = Math.max(0, todayStartIdx - 20)
    startPercent = (showStartIdx / totalLen) * 100
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        const priceData = params.find((p: any) => p.seriesName === '价格')
        const avgData = params.find((p: any) => p.seriesName === '均价')
        const volData = params.find((p: any) => p.seriesName === '成交量')
        if (!priceData) return ''

        const idx = priceData.dataIndex
        const dateStr = minuteData.value[idx]?.date || ''
        const currentPrice = priceData.value

        // 计算涨跌幅
        const changePercent = preClose > 0 ? ((currentPrice - preClose) / preClose * 100) : 0
        const changeColor = changePercent >= 0 ? '#ff4d4f' : '#52c41a'
        const changeSign = changePercent >= 0 ? '+' : ''

        let html = `<div style="font-size:12px;color:#666">${dateStr} ${priceData.axisValue}</div>`
        html += `<div>价格: <span style="color:${changeColor};font-weight:bold">${currentPrice.toFixed(2)}</span></div>`
        html += `<div>涨跌: <span style="color:${changeColor};font-weight:bold">${changeSign}${changePercent.toFixed(2)}%</span></div>`
        if (avgData && avgData.value) {
          html += `<div>均价: <span style="color:#faad14">${avgData.value.toFixed(2)}</span></div>`
        }
        if (volData) {
          html += `<div>成交量: ${formatVolume(volData.value)}</div>`
        }
        return html
      }
    },
    legend: {
      data: ['价格', '均价'],
      top: 5,
      right: 60,
      textStyle: { fontSize: 11 }
    },
    grid: [
      { left: 60, right: 60, top: 35, height: '50%' },
      { left: 60, right: 60, top: '72%', height: '18%' }
    ],
    xAxis: [
      {
        type: 'category',
        data: times,
        gridIndex: 0,
        axisLabel: { show: false },
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        splitLine: { show: true, lineStyle: { color: '#f3f4f6', type: 'dashed' } }
      },
      {
        type: 'category',
        data: times,
        gridIndex: 1,
        axisLabel: {
          fontSize: 10,
          interval: labelInterval,
          color: '#9ca3af'
        },
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e5e7eb' } }
      }
    ],
    yAxis: [
      {
        type: 'value',
        scale: true,
        gridIndex: 0,
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
        axisLabel: { fontSize: 10, color: '#9ca3af', formatter: (v: number) => v.toFixed(2) },
        position: 'right'
      },
      {
        type: 'value',
        scale: true,
        gridIndex: 1,
        splitLine: { show: false },
        axisLabel: { show: false }
      }
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1], start: startPercent, end: endPercent }
    ],
    series: [
      {
        name: '价格',
        type: 'line',
        data: prices,
        smooth: true,
        symbol: 'none',
        xAxisIndex: 0,
        yAxisIndex: 0,
        lineStyle: { color: prices[prices.length - 1] >= preClose ? '#ff4d4f' : '#52c41a', width: 1.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: prices[prices.length - 1] >= preClose ? 'rgba(255,77,79,0.2)' : 'rgba(82,196,26,0.2)' },
              { offset: 1, color: 'rgba(255,255,255,0)' }
            ]
          }
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: priceMarkLine
        }
      },
      {
        name: '均价',
        type: 'line',
        data: avgPrices,
        smooth: true,
        symbol: 'none',
        xAxisIndex: 0,
        yAxisIndex: 0,
        lineStyle: { color: '#faad14', width: 1 }
      },
      {
        name: '成交量',
        type: 'bar',
        data: volumes,
        xAxisIndex: 1,
        yAxisIndex: 1,
        barWidth: '70%'
      }
    ]
  }
}

// 格式化成交量
const formatVolume = (vol: number) => {
  if (vol >= 100000000) return (vol / 100000000).toFixed(2) + '亿'
  if (vol >= 10000) return (vol / 10000).toFixed(0) + '万'
  if (vol >= 1000) return (vol / 1000).toFixed(1) + '千'
  return vol.toString()
}

const getKlineChartOption = () => {
  if (!klineData.value.length) return null

  const dates = klineData.value.map(d => d.date.substring(5)) // 只显示 MM-DD
  const ohlc = klineData.value.map(d => [d.open, d.close, d.low, d.high])
  const volumes = klineData.value.map((d) => ({
    value: d.volume,
    itemStyle: { color: d.close >= d.open ? 'rgba(255,77,79,0.7)' : 'rgba(82,196,26,0.7)' }
  }))

  // 计算MA均线
  const ma5 = calcMA(klineData.value, 5)
  const ma10 = calcMA(klineData.value, 10)
  const ma20 = calcMA(klineData.value, 20)

  const labelInterval = Math.floor(dates.length / 10)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        const kData = params.find((p: any) => p.seriesType === 'candlestick')
        const volData = params.find((p: any) => p.seriesName === '成交量')
        const ma5Data = params.find((p: any) => p.seriesName === 'MA5')
        const ma10Data = params.find((p: any) => p.seriesName === 'MA10')
        const ma20Data = params.find((p: any) => p.seriesName === 'MA20')
        if (!kData) return ''

        const [open, close, low, high] = kData.data
        const isUp = close >= open
        const color = isUp ? '#ff4d4f' : '#52c41a'
        const idx = kData.dataIndex
        const fullDate = klineData.value[idx]?.date || ''

        let html = `<div style="font-size:12px;color:#666;margin-bottom:4px">${fullDate}</div>`
        html += `<div>开: <span style="color:${color}">${open.toFixed(2)}</span> 收: <span style="color:${color}">${close.toFixed(2)}</span></div>`
        html += `<div>高: <span style="color:#ff4d4f">${high.toFixed(2)}</span> 低: <span style="color:#52c41a">${low.toFixed(2)}</span></div>`
        if (ma5Data?.value) html += `<div style="color:#ff9800">MA5: ${ma5Data.value.toFixed(2)}</div>`
        if (ma10Data?.value) html += `<div style="color:#2196f3">MA10: ${ma10Data.value.toFixed(2)}</div>`
        if (ma20Data?.value) html += `<div style="color:#9c27b0">MA20: ${ma20Data.value.toFixed(2)}</div>`
        if (volData) html += `<div>成交量: ${formatVolume(volData.value)}</div>`
        return html
      }
    },
    legend: {
      data: ['MA5', 'MA10', 'MA20'],
      top: 5,
      right: 60,
      textStyle: { fontSize: 11 }
    },
    grid: [
      { left: 60, right: 60, top: 35, height: '50%' },
      { left: 60, right: 60, top: '72%', height: '18%' }
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        gridIndex: 0,
        axisLabel: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } }
      },
      {
        type: 'category',
        data: dates,
        gridIndex: 1,
        axisLabel: { fontSize: 10, interval: labelInterval, color: '#9ca3af' },
        axisLine: { lineStyle: { color: '#e5e7eb' } }
      }
    ],
    yAxis: [
      {
        type: 'value',
        scale: true,
        gridIndex: 0,
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
        axisLabel: { fontSize: 10, color: '#9ca3af', formatter: (v: number) => v.toFixed(2) },
        position: 'right'
      },
      {
        type: 'value',
        scale: true,
        gridIndex: 1,
        splitLine: { show: false },
        axisLabel: { show: false }
      }
    ],
    dataZoom: [{ type: 'inside', xAxisIndex: [0, 1] }],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: ohlc,
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: { color: '#ff4d4f', color0: '#52c41a', borderColor: '#ff4d4f', borderColor0: '#52c41a' }
      },
      {
        name: 'MA5',
        type: 'line',
        data: ma5,
        smooth: true,
        symbol: 'none',
        xAxisIndex: 0,
        yAxisIndex: 0,
        lineStyle: { color: '#ff9800', width: 1 }
      },
      {
        name: 'MA10',
        type: 'line',
        data: ma10,
        smooth: true,
        symbol: 'none',
        xAxisIndex: 0,
        yAxisIndex: 0,
        lineStyle: { color: '#2196f3', width: 1 }
      },
      {
        name: 'MA20',
        type: 'line',
        data: ma20,
        smooth: true,
        symbol: 'none',
        xAxisIndex: 0,
        yAxisIndex: 0,
        lineStyle: { color: '#9c27b0', width: 1 }
      },
      {
        name: '成交量',
        type: 'bar',
        data: volumes,
        xAxisIndex: 1,
        yAxisIndex: 1
      }
    ]
  }
}

// 处理图表缩放事件，保存用户的缩放状态
const handleDataZoom = (params: any) => {
  // 只在分时图时保存缩放状态
  if (activeTab.value === 'minute') {
    const batch = params.batch?.[0] || params
    if (batch.start !== undefined && batch.end !== undefined) {
      userZoomState.value = { start: batch.start, end: batch.end }
    }
  }
}

// 加载详情数据
const loadData = async (showLoading = true) => {
  if (showLoading) loading.value = true
  try {
    const res = await getStockDetail(props.code)
    if (res.status === 'success') {
      stockInfo.value = res.basic || {}
      minuteData.value = res.minute || []
      klineData.value = res.kline || []
      moneyFlowData.value = res.money_flow || []
      // 首次加载完成后标记
      if (isFirstLoad.value) {
        isFirstLoad.value = false
      }
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

// 切换 K 线周期时重新加载数据
const loadKlineData = async (period: string) => {
  if (period === 'minute') return
  loading.value = true
  try {
    const res = await getKlineData(props.code, period, 120)
    if (res.status === 'success') {
      klineData.value = res.data || []
    }
  } catch (e) {
    console.error('加载K线数据失败:', e)
  } finally {
    loading.value = false
  }
}

// 轮询刷新 - 只有分时图需要实时刷新，K线图不需要频繁刷新
const startRefresh = () => {
  stopRefresh()
  refreshTimer = setInterval(() => {
    // 只在分时图时刷新数据
    if (activeTab.value === 'minute') {
      loadData(false)
    }
    // K线图不需要频繁刷新，用户切换tab时会加载一次
  }, REFRESH_INTERVAL)
}

const stopRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

watch(activeTab, (newTab) => {
  // 切换 tab 时重置缩放状态
  userZoomState.value = null
  isFirstLoad.value = true

  if (newTab !== 'minute') {
    loadKlineData(newTab)
  }
})

onMounted(() => {
  loadData()
  startRefresh()
})

onUnmounted(() => {
  stopRefresh()
})

watch(() => props.code, () => {
  loadData()
})
</script>
