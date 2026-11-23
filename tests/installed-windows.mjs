// Exercise the game installed by NSIS using its real Electron window.
import assert from 'node:assert/strict';
import { _electron as electron } from 'playwright-core';

const app = await electron.launch({
  executablePath: process.argv[2],
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.waitForFunction(() => !document.querySelector('#start')?.disabled
    && document.querySelector('#action')?.textContent === 'Wejdź do świata');
  assert.match(page.url(), /index\.html$/);
  await page.locator('#start').click();
  await page.waitForFunction(() => document.body.dataset.state === 'playing');
  const before = await page.screenshot();
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.up('w');
  assert(!before.equals(await page.screenshot()), 'Walking must move the ground on screen');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.body.dataset.state === 'paused');
  assert.deepEqual(errors, []);
} finally {
  await app.close();
}
