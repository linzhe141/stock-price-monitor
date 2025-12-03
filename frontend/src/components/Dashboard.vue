<template>
  <div class="dashboard">
    <div class="header">
      <h1>{{ t('title') }}</h1>
      <div class="controls">
        <button @click="toggleLanguage" class="lang-btn">{{ currentLang === 'en' ? '中文' : 'English' }}</button>
      </div>
    </div>

    <div class="add-stock">
      <input v-model="newStockCode" :placeholder="t('placeholder')" @keyup.enter="handleAddStock" :disabled="loading" />
      <button @click="handleAddStock" :disabled="loading">
        {{ loading ? t('adding') : t('add') }}
      </button>
    </div>

    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

    <div class="stock-list">
      <table>
        <thead>
          <tr>
            <th>{{ t('col_code') }}</th>
            <th>{{ t('col_name') }}</th>
            <th>{{ t('col_price') }}</th>
            <th>{{ t('col_change') }}</th>
            <th>{{ t('col_high') }}</th>
            <th>{{ t('col_low') }}</th>
            <th>{{ t('col_time') }}</th>
            <th>{{ t('col_action') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in stockData" :key="stock.code"
            :class="{ 'up': parseFloat(stock.change_percent) > 0, 'down': parseFloat(stock.change_percent) < 0 }">
            <td>{{ stock.code }}</td>
            <td>{{ stock.name }}</td>
            <td>{{ stock.price }}</td>
            <td>{{ stock.change_percent }}%</td>
            <td>{{ stock.high }}</td>
            <td>{{ stock.low }}</td>
            <td>{{ stock.time }}</td>
            <td>
              <button class="delete-btn" @click="handleRemoveStock(stock.code)">{{ t('remove') }}</button>
            </td>
          </tr>
          <tr v-if="stockData.length === 0">
            <td colspan="8" class="empty">{{ t('empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { getStocks, addStock, removeStock } from '../api';

const newStockCode = ref('');
const stockData = ref<any[]>([]);
const loading = ref(false);
const errorMsg = ref('');
type Lang = 'en' | 'zh';
const currentLang = ref<Lang>('zh'); // Default to Chinese
let intervalId: any = null;

const translations: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Stock Monitor',
    placeholder: 'Stock Code (e.g., 600519)',
    add: 'Add',
    adding: 'Adding...',
    remove: 'Remove',
    empty: 'No stocks monitored. Add one to start.',
    col_code: 'Code',
    col_name: 'Name',
    col_price: 'Price',
    col_change: 'Change',
    col_high: 'High',
    col_low: 'Low',
    col_time: 'Time',
    col_action: 'Action'
  },
  zh: {
    title: '股票监控助手',
    placeholder: '股票代码 (如 600519)',
    add: '添加',
    adding: '添加中...',
    remove: '删除',
    empty: '暂无监控股票，请添加。',
    col_code: '代码',
    col_name: '名称',
    col_price: '当前价',
    col_change: '涨跌幅',
    col_high: '最高',
    col_low: '最低',
    col_time: '时间',
    col_action: '操作'
  }
};

const t = (key: string) => translations[currentLang.value][key] || key;

const toggleLanguage = () => {
  currentLang.value = currentLang.value === 'en' ? 'zh' : 'en';
};

const updateTray = () => {
  if (stockData.value.length > 0) {
    // Show top 3 stocks in tooltip
    const summary = stockData.value.slice(0, 3).map(s => `${s.name}: ${s.price} (${s.change_percent}%)`).join('\n');
    (window as any).ipcRenderer.send('update-tray', summary);
  } else {
    (window as any).ipcRenderer.send('update-tray', 'Stock Monitor');
  }
};

const fetchData = async () => {
  try {
    const res = await getStocks();
    stockData.value = Object.values(res.data);
    updateTray();
  } catch (error) {
    console.error("Failed to fetch stocks:", error);
  }
};

const handleAddStock = async () => {
  if (!newStockCode.value) return;
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await addStock(newStockCode.value);
    if (res.status === 'error') {
      errorMsg.value = res.message;
    } else {
      newStockCode.value = '';
      await fetchData();
    }
  } catch (e) {
    console.error(e);
    errorMsg.value = "Failed to add stock. Check backend connection.";
  } finally {
    loading.value = false;
  }
};

const handleRemoveStock = async (code: string) => {
  await removeStock(code);
  fetchData();
};

onMounted(() => {
  fetchData();
  intervalId = setInterval(fetchData, 2000); // Poll every 2 seconds
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
  color: #333;
  max-width: 1000px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.lang-btn {
  padding: 6px 12px;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.lang-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.add-stock {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.add-stock input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.add-stock input:focus {
  border-color: #2196F3;
}

.add-stock button {
  padding: 10px 20px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.add-stock button:hover {
  background-color: #1976D2;
}

.add-stock button:disabled {
  background-color: #90CAF9;
  cursor: not-allowed;
}

.error-msg {
  color: #f44336;
  margin-bottom: 10px;
  font-size: 14px;
  background: #ffebee;
  padding: 10px;
  border-radius: 4px;
}

.stock-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

th {
  background-color: #fafafa;
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

td {
  font-size: 14px;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover {
  background-color: #f9f9f9;
}

.up {
  color: #f44336;
  /* Red for up */
}

.down {
  color: #4caf50;
  /* Green for down */
}

.delete-btn {
  background-color: transparent;
  color: #999;
  border: 1px solid #eee;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.delete-btn:hover {
  background-color: #ffebee;
  color: #f44336;
  border-color: #ffcdd2;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
  font-style: italic;
}
</style>
