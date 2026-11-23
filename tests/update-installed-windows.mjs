// Run only against the disposable NSIS installation on the Windows CI runner.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { _electron as electron } from 'playwright-core';

const exe = process.argv[2];
const appDir = path.join(path.dirname(exe), 'resources', 'app');
const pkgFile = path.join(appDir, 'package.json');
const mainFile = path.join(appDir, 'main.cjs');
const originalMain = await readFile(mainFile, 'utf8');
const pkg = JSON.parse(await readFile(pkgFile, 'utf8'));
const manifest = JSON.parse(await readFile('out/latest.yml', 'utf8'));
assert.equal(pkg.version, manifest.version);
const name = manifest.files[0].url;
const hash = createHash('sha256');
for await (const bytes of createReadStream(path.join('out', name))) hash.update(bytes);
const server = createServer(async (req, res) => {
  const file = new URL(req.url, 'http://localhost').pathname.slice(1);
  if (!['latest.yml', name].includes(file)) { res.writeHead(404).end(); return; }
  const size = (await stat(path.join('out', file))).size;
  res.writeHead(200, { 'Content-Length': size });
  createReadStream(path.join('out', file)).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const release = { version: pkg.version, name, dir: 'http://127.0.0.1:' + server.address().port + '/', digest: 'sha256:' + hash.digest('hex') };
let running;
try {
  // Inject the loopback feed into this installation only. The update must restore both files.
  const call = 'attachUpdates(mainWindow)';
  assert(originalMain.includes(call));
  await writeFile(mainFile, originalMain.replace(call, 'attachUpdates(mainWindow, async () => (' + JSON.stringify(release) + '))'));
  await writeFile(pkgFile, JSON.stringify({ ...pkg, version: '0.0.1' }));
  running = await electron.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await running.firstWindow();
  await page.waitForFunction(() => /gotowa|Nie udało/.test(document.querySelector('#update-status').textContent), null, {timeout: 90000});
  assert.match(await page.locator('#update-status').innerText(), /gotowa/);
  const closed = running.waitForEvent('close', {timeout: 60000});
  await page.locator('#update-action').click();
  await closed;
  running = null;
  let relaunched = false;
  for (let i = 0; i < 90 && !relaunched; i++) {
    await sleep(1000);
    if (await readFile(mainFile, 'utf8').catch(() => '') !== originalMain) continue;
    const script = '(Get-Process VariousRoots -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $env:VR_TEST_EXE } | Measure-Object).Count';
    const count = execFileSync('powershell.exe', ['-NoProfile', '-Command', script], {env: {...process.env, VR_TEST_EXE: exe}, encoding: 'utf8'});
    relaunched = Number(count.trim()) > 0;
  }
  assert(relaunched, 'Installer must restore the production launcher and start the updated game');
  assert.equal(JSON.parse(await readFile(pkgFile, 'utf8')).version, manifest.version);
} finally {
  if (running) await running.close().catch(() => {});
  server.close();
  execFileSync('powershell.exe', ['-NoProfile', '-Command',
    'Get-Process VariousRoots -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $env:VR_TEST_EXE } | Stop-Process -Force; exit 0'],
    {env: {...process.env, VR_TEST_EXE: exe}});
}
