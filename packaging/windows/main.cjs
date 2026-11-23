const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');

let mainWindow;
app.setAppUserModelId('pl.variousroots.rework');
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({
    title: 'Various Roots',
    icon: path.join(__dirname, 'icon.png'),
    width: 1280, height: 720, minWidth: 640, minHeight: 400,
    show: false, backgroundColor: '#293a33',
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.once('ready-to-show', () => { mainWindow.maximize(); mainWindow.show(); });
  require('./updates.cjs').attachUpdates(mainWindow);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
});
app.on('window-all-closed', () => app.quit());
