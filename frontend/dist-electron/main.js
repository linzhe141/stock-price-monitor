import { app, ipcMain, BrowserWindow, Tray, Menu, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const appWithFlags = app;
appWithFlags.isQuitting = false;
process.env.DIST = path.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
let win;
let tray = null;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || "", "vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      sandbox: false,
      nodeIntegration: true,
      // Optional: enable if you need node in renderer (not recommended but helpful for debugging)
      contextIsolation: true
    }
  });
  win.setMenuBarVisibility(false);
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST || "", "index.html"));
  }
  win.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.log("Failed to load window:", errorCode, errorDescription);
    if (errorCode === -102) {
      setTimeout(() => {
        if (win && VITE_DEV_SERVER_URL) {
          console.log("Retrying load URL...");
          win.loadURL(VITE_DEV_SERVER_URL);
        }
      }, 1e3);
    }
  });
  win.on("minimize", (event) => {
    event.preventDefault();
    win.hide();
  });
  win.on("close", (event) => {
    if (!appWithFlags.isQuitting) {
      event.preventDefault();
      win.hide();
      return false;
    }
    return true;
  });
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
}
ipcMain.on("update-tray", (_event, text) => {
  if (tray) {
    tray.setToolTip(text);
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("before-quit", () => {
  appWithFlags.isQuitting = true;
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  const iconPath = path.join(process.env.VITE_PUBLIC || "", "vite.svg");
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show App", click: () => win?.show() },
    {
      label: "Quit",
      click: () => {
        appWithFlags.isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip("Stock Monitor");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (win?.isVisible()) {
      win.hide();
    } else {
      win?.show();
    }
  });
});
