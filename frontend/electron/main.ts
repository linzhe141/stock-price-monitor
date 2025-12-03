import { app, BrowserWindow, ipcMain, Tray, Menu, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Use type casting for custom properties to avoid TS errors
const appWithFlags = app as unknown as { isQuitting: boolean } & typeof app
appWithFlags.isQuitting = false

// The built directory structure
//
// ├─┬ dist
// │ ├─┬ electron
// │ │ ├── main.js
// │ │ └── preload.js
// │ ├── index.html
// │ ...
// ├─┬ dist-electron
// │ ├── main.js
// │ └── preload.js
//
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
let tray: Tray | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || '', 'vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      nodeIntegration: true, // Optional: enable if you need node in renderer (not recommended but helpful for debugging)
      contextIsolation: true,
    },
  })

  // Hide the menu bar
  win.setMenuBarVisibility(false)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST || '', 'index.html'))
  }

  // Handle loading failures (e.g. if Vite isn't ready yet)
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load window:', errorCode, errorDescription);
    if (errorCode === -102) { // ERR_CONNECTION_REFUSED
      setTimeout(() => {
        if (win && VITE_DEV_SERVER_URL) {
          console.log('Retrying load URL...');
          win.loadURL(VITE_DEV_SERVER_URL);
        }
      }, 1000);
    }
  });

  // Minimize to tray behavior
  win.on('minimize', (event: any) => {
    event.preventDefault()
    win.hide()
  })

  // Close to tray behavior
  win.on('close', (event: any) => {
    if (!appWithFlags.isQuitting) {
      event.preventDefault()
      win.hide()
      return false
    }
    return true
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
}

// IPC for updating tray tooltip
ipcMain.on('update-tray', (_event, text) => {
  if (tray) {
    tray.setToolTip(text)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('before-quit', () => {
  appWithFlags.isQuitting = true
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  
  // Create Tray
  const iconPath = path.join(process.env.VITE_PUBLIC || '', 'vite.svg')
  console.log('Creating tray with icon:', iconPath)
  
  const { nativeImage } = require('electron')
  const icon = nativeImage.createFromPath(iconPath)
  
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => win?.show() },
    { label: 'Quit', click: () => {
        appWithFlags.isQuitting = true
        app.quit() 
      } 
    }
  ])
  tray.setToolTip('Stock Monitor')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    if (win?.isVisible()) {
      win.hide()
    } else {
      win?.show()
    }
  })
})
