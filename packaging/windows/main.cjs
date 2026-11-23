const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');

app.setAppUserModelId('pl.variousroots.rework');
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    title: 'Various Roots',
    icon: path.join(__dirname, 'icon.png'),
    width: 1280, height: 720, minWidth: 640, minHeight: 400,
    show: false, backgroundColor: '#293a33',
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.loadFile(path.join(__dirname, 'index.html'));
});
app.on('window-all-closed', () => app.quit());
