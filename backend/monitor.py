import time
import akshare as ak
import pandas as pd
from typing import List, Dict
import os

class StockMonitor:
    def __init__(self):
        # Aggressively disable proxies
        for k in ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "all_proxy", "ALL_PROXY"]:
            os.environ.pop(k, None)
        # Force no proxy for all requests
        os.environ["NO_PROXY"] = "*"
        os.environ["no_proxy"] = "*"
        
        print("Proxy settings cleared. NO_PROXY set to *")

        self.running = False
        self.stocks: List[str] = [] # List of stock codes, e.g., "sh600519"
        self.data: Dict[str, dict] = {} # Store latest data

    def add_stock(self, code: str):
        if code not in self.stocks:
            self.stocks.append(code)
            return {"status": "success", "message": f"Added {code}"}
        return {"status": "error", "message": "Stock already exists"}

    def remove_stock(self, code: str):
        if code in self.stocks:
            self.stocks.remove(code)
            if code in self.data:
                del self.data[code]
            return {"status": "success", "message": f"Removed {code}"}
        return {"status": "error", "message": "Stock not found"}

    def get_stocks(self):
        return {"stocks": self.stocks, "data": self.data}

    def fetch_data(self):
        if not self.stocks:
            return
        
        # print(f"Fetching data for: {self.stocks}")
        try:
            # Use Sina API
            # Format: http://hq.sinajs.cn/list=sh600519,sz000001
            # We need to ensure codes have prefixes (sh/sz). 
            # Frontend sends "sh600519" or "600519". If no prefix, we might need to guess or require it.
            # For now, let's assume user provides prefix or we try to add it.
            # Actually, user input "600021" (sh) or "000001" (sz).
            # Simple heuristic: 6xx -> sh, 0xx/3xx -> sz. 4xx/8xx -> bj (Sina might be different for bj)
            
            query_list = []
            for code in self.stocks:
                if code.startswith("sh") or code.startswith("sz") or code.startswith("bj"):
                    query_list.append(code)
                else:
                    # Guess prefix
                    if code.startswith("6"):
                        query_list.append(f"sh{code}")
                    elif code.startswith("0") or code.startswith("3"):
                        query_list.append(f"sz{code}")
                    elif code.startswith("4") or code.startswith("8"):
                        query_list.append(f"bj{code}")
                    else:
                        query_list.append(code) # Try as is

            codes_str = ",".join(query_list)
            url = f"http://hq.sinajs.cn/list={codes_str}"
            headers = {
                "Referer": "https://finance.sina.com.cn/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            # Use explicit empty proxies to bypass system proxy settings
            import requests
            resp = requests.get(url, headers=headers, timeout=5, proxies={"http": None, "https": None})
            
            # Encoding is usually GBK
            content = resp.content.decode('gbk')
            
            # Parse response
            # var hq_str_sh600519="贵州茅台,1435.810,1436.030,1428.290,1435.970,1428.000,1428.280,1428.310,..."
            lines = content.strip().split('\n')
            for line in lines:
                if not line: continue
                # line: var hq_str_sh600519="Name,..."
                parts = line.split('=')
                if len(parts) < 2: continue
                
                # Extract code from var name
                # var hq_str_sh600519 -> sh600519
                code_part = parts[0].split('_')[-1]
                
                data_part = parts[1].strip('"')
                if not data_part: continue
                
                fields = data_part.split(',')
                if len(fields) < 30: continue
                
                # Sina Fields:
                # 0: Name
                # 1: Open
                # 2: PreClose
                # 3: Price
                # 4: High
                # 5: Low
                # 30: Date
                # 31: Time
                
                name = fields[0]
                pre_close = float(fields[2])
                price = float(fields[3])
                high = fields[4]
                low = fields[5]
                time_str = fields[31]
                
                # Calculate change percent
                change_percent = 0.0
                if pre_close > 0:
                    change_percent = (price - pre_close) / pre_close * 100
                
                # Map back to original code if possible, or use the one from Sina
                # We stored "600021" in self.stocks, but query was "sh600021"
                # We need to update self.data with the key that matches self.stocks or just use the full code
                # Let's use the code from Sina (with prefix) as the key in data, 
                # but we need to ensure frontend knows how to display it.
                # Or we strip prefix if the original didn't have it.
                
                # Better: Update data with the code used in query (with prefix) 
                # AND ensure add_stock supports adding with/without prefix.
                
                stock_data = {
                    "code": code_part,
                    "name": name,
                    "price": f"{price:.2f}",
                    "change_percent": f"{change_percent:.2f}",
                    "high": high,
                    "low": low,
                    "open": fields[1],
                    "volume": fields[8],
                    "amount": fields[9],
                    "time": time_str
                }
                
                # Store data. 
                # We update self.stocks to use the canonical code (with prefix) so delete works reliably.
                if code_part not in self.stocks:
                    # Check if we have the raw version
                    raw_code = code_part[2:]
                    if raw_code in self.stocks:
                        self.stocks.remove(raw_code)
                        self.stocks.append(code_part)
                
                self.data[code_part] = stock_data
                
        except Exception as e:
            print(f"Error fetching data: {e}")

    def add_stock(self, code: str):
        if code not in self.stocks:
            self.stocks.append(code)
            return {"status": "success", "message": f"Added {code}"}
        return {"status": "error", "message": "Stock already exists"}

    def remove_stock(self, code: str):
        if code in self.stocks:
            self.stocks.remove(code)
        else:
            # Try removing with/without prefix
            # If user passes "600021" but we have "sh600021"
            for s in self.stocks:
                if s.endswith(code) or code.endswith(s):
                    self.stocks.remove(s)
                    break
        
        if code in self.data:
            del self.data[code]
        # Also try cleaning up related keys if any
        keys_to_remove = [k for k in self.data.keys() if k.endswith(code) or code.endswith(k)]
        for k in keys_to_remove:
            del self.data[k]



    def start(self):
        self.running = True
        print("Monitor started")
        while self.running:
            if self.stocks:
                self.fetch_data()
            time.sleep(5)

