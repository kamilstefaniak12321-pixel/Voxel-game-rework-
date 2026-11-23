const { app, ipcMain, shell } = require('electron');
const { NsisUpdater } = require('electron-updater');
const { createReadStream } = require('node:fs');
const { createHash } = require('node:crypto');
const { checkRelease } = require('../../src/releases.js');

async function sha256(file) {
  const hash = createHash('sha256');
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return 'sha256:' + hash.digest('hex');
}

exports.attachUpdates = function attachUpdates(win, lookup = checkRelease) {
  let current = { kind: 'checking' }, release, updater, downloaded, pending;
  function set(kind) {
    current = { kind, version: release?.version, notes: release?.notes };
    if (!win.isDestroyed()) win.webContents.send('updates:changed', current);
    return current;
  }
  async function check() {
    release = null;
    set('checking');
    try {
      release = await lookup(app.getVersion(), 'windows');
      if (!release) return set('current');
      updater = new NsisUpdater({ provider: 'generic', url: release.dir });
      updater.autoDownload = false;
      updater.autoInstallOnAppQuit = false;
      updater.disableDifferentialDownload = true;
      updater.on('error', () => set('failed'));
      const { updateInfo } = await updater.checkForUpdates();
      if (updateInfo.version !== release.version || updateInfo.files?.length !== 1 ||
          updateInfo.files[0].url !== release.name || updateInfo.packages) throw new Error('Unexpected release manifest');
      set('downloading');
      [downloaded] = await updater.downloadUpdate();
      if (await sha256(downloaded) !== release.digest) throw new Error('Installer checksum mismatch');
      return set('ready');
    } catch { return set(release ? 'failed' : 'offline'); }
  }
  const trusted = e => e.sender === win.webContents && e.senderFrame === win.webContents.mainFrame;
  ipcMain.handle('updates:check', async e => {
    if (!trusted(e)) throw new Error('Unexpected sender');
    if (current.kind === 'ready' || current.kind === 'installing') return current;
    pending ??= check().finally(() => { pending = null; });
    return pending;
  });
  ipcMain.on('updates:notes', e => { if (trusted(e) && release) shell.openExternal(release.notes); });
  ipcMain.on('updates:install', async e => {
    if (!trusted(e) || current.kind !== 'ready') return;
    set('installing');
    try {
      if (await sha256(downloaded) !== release.digest) throw new Error('Installer checksum mismatch');
      process.env.VARIOUS_ROOTS_UPDATE_PID = String(process.pid);
      updater.quitAndInstall(true, true);
    } catch { set('failed'); }
  });
};
