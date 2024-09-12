import path from 'node:path'
import { router } from '@/api'
import { dbMigrate } from '@/db'
import { BrowserWindow, app, protocol } from 'electron'
import { createIPCHandler } from 'electron-trpc/main'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js'),
    },
  })

  createIPCHandler({ router, windows: [mainWindow] })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(import.meta.dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

//Allows for loading local files using a custom file scheme
protocol.registerSchemesAsPrivileged([{ scheme: 'local-file', privileges: { bypassCSP: true } }])

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  await dbMigrate()
  protocol.registerFileProtocol('local-file', (request, callback) => {
    const url = request.url.replace('local-file://', '')
    try {
      return callback(decodeURIComponent(url))
    } catch (error) {
      // Handle the error as needed
      console.error(error)
    }
  })
  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
