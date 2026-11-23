const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktopUpdates', {
  check: () => ipcRenderer.invoke('updates:check'),
  install: () => ipcRenderer.send('updates:install'),
  notes: () => ipcRenderer.send('updates:notes'),
  onChange: listener => ipcRenderer.on('updates:changed', (_event, state) => listener(state)),
});
