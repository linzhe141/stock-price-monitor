import requests
import json
from typing import Dict, Any, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    def format_data_for_prompt(
        basic: Dict,
        minute_data: List[Dict],
        kline_data: List[Dict],
        extra_info: Optional[Dict] = None
    ) -> str:
        """
        Format stock data into a string for LLM prompt.
        """
        prompt_parts = []
        
        # 1. Basic Info
        prompt_parts.append(f"### 股票基本信息\n")
        prompt_parts.append(f"- 代码: {basic.get('code')}")
        prompt_parts.append(f"- 名称: {basic.get('name')}")
        prompt_parts.append(f"- 当前价: {basic.get('price')}")
        prompt_parts.append(f"- 涨跌幅: {basic.get('change_percent')}%")
        
        # 2. Extra Info (User inputs for precise analysis)
        if extra_info:
            prompt_parts.append(f"\n### 用户附加信息\n")
            if 'cost_price' in extra_info:
                prompt_parts.append(f"- 持仓成本: {extra_info['cost_price']}")
            if 'position' in extra_info:
                prompt_parts.append(f"- 持仓数量: {extra_info['position']}")
            if 'take_profit' in extra_info:
                prompt_parts.append(f"- 止盈位置: {extra_info['take_profit']}")
            if 'stop_loss' in extra_info:
                prompt_parts.append(f"- 止损位置: {extra_info['stop_loss']}")
            if 'extra_text' in extra_info and extra_info['extra_text']:
                prompt_parts.append(f"- 补充说明/新闻/政策: \n{extra_info['extra_text']}")

        # 3. K-Line Data (Daily) - Summarize recent trend
        prompt_parts.append(f"\n### 近期日K线数据 (部分展示)\n")
        if kline_data:
            # Show last 10 days detailed, plus summary of whole period
            last_k = kline_data[-10:]
            prompt_parts.append(f"最近 {len(last_k)} 个交易日数据 (共提供 {len(kline_data)} 天历史趋势):")
            header = "| 日期 | 收盘 | 涨跌幅(估算) | 成交量 |"
            prompt_parts.append(header)
            prompt_parts.append("|---|---|---|---|")
            
            prev_close = None
            if len(kline_data) > 10:
                prev_close = kline_data[-11]['close']
                
            for k in last_k:
                change = ""
                if prev_close:
                    pct = ((k['close'] - prev_close) / prev_close) * 100
                    change = f"{pct:.2f}%"
                prev_close = k['close']
                prompt_parts.append(f"| {k['date']} | {k['close']} | {change} | {k['volume']} |")
            
            # Trend summary (start, mid, end)
            first = kline_data[0]
            mid = kline_data[len(kline_data)//2]
            last = kline_data[-1]
            prompt_parts.append(f"\n整体趋势摘要: {first['date']}收盘{first['close']} -> {mid['date']}收盘{mid['close']} -> {last['date']}收盘{last['close']}")

        # 4. Minute Data (Intraday)
        prompt_parts.append(f"\n### 近期分时走势 (数据摘要)\n")
        if minute_data:
            # Group by date
            dates = {}
            for m in minute_data:
                d = m['date']
                if d not in dates:
                    dates[d] = []
                dates[d].append(m)
            
            for d, items in dates.items():
                prompt_parts.append(f"#### 日期: {d}")
                # Sample every 30 minutes to reduce token usage
                headers = "| 时间 | 价格 | 均价 | 成交量 |"
                prompt_parts.append(headers)
                prompt_parts.append("|---|---|---|---|")
                
                last_price = items[0]['price'] # Approximate open
                for i, item in enumerate(items):
                    # Show opening, closing, and every 30 mins (approx every 30 points)
                    if i == 0 or i == len(items)-1 or i % 30 == 0:
                        prompt_parts.append(f"| {item['time']} | {item['price']} | {item.get('avg_price', '-')} | {item['volume']} |")
        
        return "\n".join(prompt_parts)

    @staticmethod
    def call_llm(provider: str, api_key: str, model: str, prompt: str) -> str:
        """
        Call LLM API.
        """
        system_prompt = "你是一个专业的股票分析师，擅长技术面分析和基本面分析。请根据提供的股票数据，给出专业的趋势预测和操作建议。输出格式使用Markdown。"
        
        try:
            if provider.lower() == "openai" or provider.lower() == "gpt":
                return AIService._call_openai(api_key, model, system_prompt, prompt)
            elif provider.lower() == "gemini":
                return AIService._call_gemini(api_key, model, system_prompt, prompt)
            elif provider.lower() == "claude":
                return AIService._call_claude(api_key, model, system_prompt, prompt)
            else:
                return f"不支持的模型提供商: {provider}"
        except Exception as e:
            logger.error(f"LLM调用失败: {e}")
            return f"分析失败: {str(e)}"

    @staticmethod
    def _call_openai(api_key: str, model: str, system_prompt: str, user_prompt: str) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        }
        # Support custom base url if needed (not implemented yet, default to official)
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        res_json = response.json()
        return res_json['choices'][0]['message']['content']

    @staticmethod
    def _call_gemini(api_key: str, model: str, system_prompt: str, user_prompt: str) -> str:
        # Gemini usually creates a combined prompt as system instructions are passed differently or just prepended
        # API: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
        if not model:
            model = "gemini-pro"
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        
        full_prompt = f"{system_prompt}\n\nUser Request:\n{user_prompt}"
        
        data = {
            "contents": [{
                "parts": [{"text": full_prompt}]
            }]
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        res_json = response.json()
        try:
            return res_json['candidates'][0]['content']['parts'][0]['text']
        except (KeyError, IndexError):
            return "Gemini 返回了无法解析的数据: " + json.dumps(res_json)

    @staticmethod
    def _call_claude(api_key: str, model: str, system_prompt: str, user_prompt: str) -> str:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 4096
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        res_json = response.json()
        return res_json['content'][0]['text']
