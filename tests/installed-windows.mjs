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
  const state = expected => page.waitForFunction(value => document.body.dataset.state === value, expected);
  await page.locator('#open-settings').click();
  await state('settings');
  await page.locator('#sway').focus();
  await page.keyboard.press('Home');
  await page.locator('#radius').focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#sway-value').textContent(), '0%');
  assert.equal(await page.locator('#radius-value').textContent(), '8');
  await page.keyboard.down('Escape');
  await state('paused');
  await page.keyboard.down('Escape'); // OS key repeat must leave this menu open.
  await page.keyboard.up('Escape');
  assert.equal(await page.locator('body').getAttribute('data-state'), 'paused');
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('Escape');
    await state('playing');
    await page.waitForFunction(() => document.pointerLockElement === document.querySelector('#world'));
    await page.keyboard.press('Escape');
    await state('paused');
  }
  await page.reload();
  await page.locator('#open-settings').click();
  assert.equal(await page.locator('#sway').inputValue(), '0');
  assert.equal(await page.locator('#radius').inputValue(), '8');
  await page.keyboard.press('Escape');
  await state('welcome');
  assert.deepEqual(errors, []);
} finally {
  await app.close();
}
