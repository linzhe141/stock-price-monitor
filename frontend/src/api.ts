import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

export const getStocks = async () => {
  const response = await api.get('/stocks');
  return response.data;
};

export const addStock = async (code: string) => {
  const response = await api.post(`/stocks/${code}`);
  return response.data;
};

export const removeStock = async (code: string) => {
  const response = await api.delete(`/stocks/${code}`);
  return response.data;
};

// 获取设置
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

// 更新设置
export const updateSettings = async (settings: Record<string, any>) => {
  const response = await api.post('/settings', settings);
  return response.data;
};

// 重新排序股票
export const reorderStocks = async (stocks: string[]) => {
  const response = await api.post('/stocks/reorder', { stocks });
  return response.data;
};

// 设置重点关注
export const setFocusedStock = async (code: string) => {
  const response = await api.post(`/stocks/focus/${code}`);
  return response.data;
};

// 设置股票预警
export const setAlert = async (code: string, alertConfig: Record<string, any>) => {
  const response = await api.post(`/alerts/${code}`, alertConfig);
  return response.data;
};

// 移除股票预警
export const removeAlert = async (code: string) => {
  const response = await api.delete(`/alerts/${code}`);
  return response.data;
};

// 获取触发的预警
export const getTriggeredAlerts = async () => {
  const response = await api.get('/alerts/triggered');
  return response.data;
};

export default api;
