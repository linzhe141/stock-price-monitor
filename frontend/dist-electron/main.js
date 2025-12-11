import { app as f, ipcMain as g, Notification as W, BrowserWindow as D, shell as A, nativeImage as F, Tray as B, Menu as $, screen as k } from "electron";
import d from "node:path";
import { fileURLToPath as z } from "node:url";
const E = d.dirname(z(import.meta.url)), v = f;
v.isQuitting = !1;
process.env.DIST = d.join(E, "../dist");
process.env.VITE_PUBLIC = f.isPackaged ? process.env.DIST : d.join(process.env.DIST, "../public");
let o = null, e = null, l = null;
const w = process.env.VITE_DEV_SERVER_URL, T = 200, y = 150, I = 0, _ = 20;
function C() {
  return d.join(process.env.VITE_PUBLIC || "", "stock.ico");
}
function M() {
  if (e) return;
  const { width: s, height: t } = k.getPrimaryDisplay().workAreaSize;
  e = new D({
    width: T,
    height: y,
    x: s - T - 20,
    // 默认右下角
    y: t - y - 20,
    frame: !1,
    // 无边框
    transparent: !0,
    // 透明背景
    alwaysOnTop: !0,
    // 始终置顶
    skipTaskbar: !0,
    // 不在任务栏显示
    resizable: !1,
    // 不可调整大小
    hasShadow: !1,
    // 无阴影
    webPreferences: {
      preload: d.join(E, "preload.cjs"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), w ? e.loadURL(`${w}#/float`) : e.loadFile(d.join(process.env.DIST || "", "index.html"), { hash: "/float" }), e.webContents.on("did-finish-load", () => {
    console.log("悬浮窗页面加载完成");
  }), e.on("focus", () => {
    e?.setOpacity(1);
  }), e.on("blur", () => {
    e?.setOpacity(0.7);
  }), e.on("moved", () => {
    if (!e) return;
    const [n, a] = e.getPosition(), { width: b, height: i } = k.getPrimaryDisplay().workAreaSize;
    let r = n, u = a;
    n < _ && (r = I), n + T > b - _ && (r = b - T - I), a < _ && (u = I), a + y > i - _ && (u = i - y - I), (r !== n || u !== a) && e.setPosition(r, u, !0);
  }), e.on("closed", () => {
    e = null;
  }), e.setOpacity(0.7), console.log("悬浮窗创建成功");
}
function G() {
  if (l) return;
  const s = C();
  console.log("创建托盘图标，路径:", s);
  try {
    const t = F.createFromPath(s);
    if (t.isEmpty()) {
      console.error("托盘图标加载失败");
      return;
    }
    l = new B(t);
    const n = $.buildFromTemplate([
      { label: "显示主窗口", click: () => o?.show() },
      {
        label: "显示悬浮窗",
        click: () => {
          e ? e.show() : M();
        }
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          v.isQuitting = !0, f.quit();
        }
      }
    ]);
    l.setToolTip("股票监控助手"), l.setContextMenu(n), l.on("click", () => {
      o && (o.isVisible() ? o.hide() : (o.show(), o.focus()));
    }), console.log("托盘图标创建成功");
  } catch (t) {
    console.error("创建托盘图标失败:", t);
  }
}
function V() {
  o = new D({
    width: 1e3,
    height: 700,
    icon: C(),
    webPreferences: {
      preload: d.join(E, "preload.cjs"),
      sandbox: !1,
      nodeIntegration: !1,
      contextIsolation: !0
    }
  }), o.setMenuBarVisibility(!1), o.webContents.on("did-finish-load", () => {
    o?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), w ? (o.loadURL(w), o.webContents.openDevTools()) : o.loadFile(d.join(process.env.DIST || "", "index.html")), o.webContents.on("did-fail-load", (s, t, n) => {
    console.log("窗口加载失败:", t, n), t === -102 && setTimeout(() => {
      o && w && o.loadURL(w);
    }, 1e3);
  }), o.on("minimize", () => {
    o?.hide();
  }), o.on("close", (s) => {
    v.isQuitting || (s.preventDefault(), o?.hide());
  }), o.webContents.setWindowOpenHandler((s) => (A.openExternal(s.url), { action: "deny" }));
}
g.on("update-tray", (s, t) => {
  l && l.setToolTip(t);
});
g.on("update-tray-icon", (s, t) => {
  if (l)
    try {
      const n = parseFloat(t.change), a = n >= 0, b = a ? "+" : "", i = 16, r = Buffer.alloc(i * i * 4), u = { b: 40, g: 40, r: 40, a: 255 }, x = a ? { b: 79, g: 77, r: 255, a: 255 } : { b: 26, g: 196, r: 82, a: 255 }, R = 10, j = Math.min(Math.abs(n), R), L = Math.max(2, Math.round(j / R * (i - 4)));
      for (let c = 0; c < i; c++)
        for (let h = 0; h < i; h++) {
          const m = (c * i + h) * 4;
          let p = u;
          const P = 8, S = (i - P) / 2, U = S + P;
          if (h >= S && h < U)
            if (a) {
              const O = i - 2 - L;
              c >= O && c < i - 2 && (p = x);
            } else
              c >= 2 && c < 2 + L && (p = x);
          c === Math.floor(i / 2) && h >= 1 && h < i - 1 && (p = { b: 100, g: 100, r: 100, a: 255 }), r[m] = p.b, r[m + 1] = p.g, r[m + 2] = p.r, r[m + 3] = p.a;
        }
      const H = F.createFromBuffer(r, {
        width: i,
        height: i
      });
      l.setImage(H), l.setToolTip(`${t.name}: ${t.price} (${b}${n.toFixed(2)}%)`);
    } catch (n) {
      console.error("更新托盘图标失败:", n);
    }
});
g.on("update-float-window", (s, t) => {
  e && !e.isDestroyed() && e.webContents.send("stock-data-update", t);
});
g.on("close-float-window", () => {
  console.log("收到关闭悬浮窗请求"), e && !e.isDestroyed() && (e.close(), e = null, console.log("悬浮窗已关闭"));
});
g.on("show-notification", (s, t) => {
  if (W.isSupported()) {
    const n = new W({
      title: t.title,
      body: t.body,
      icon: C()
    });
    n.on("click", () => {
      o && (o.show(), o.focus());
    }), n.show(), console.log("系统通知已发送:", t.title);
  }
});
f.on("window-all-closed", () => {
  process.platform !== "darwin" && f.quit();
});
f.on("before-quit", () => {
  v.isQuitting = !0;
});
f.on("activate", () => {
  D.getAllWindows().length === 0 && V();
});
f.whenReady().then(() => {
  G(), V(), M();
});
