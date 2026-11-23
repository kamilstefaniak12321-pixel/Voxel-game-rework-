import test from 'node:test';
import assert from 'node:assert/strict';
import { findRelease, SITE } from '../src/releases.js';

function preview(v) {
  const dir = SITE + '/releases/download/v' + v + '/';
  return { tag_name: 'v' + v, prerelease: true, draft: false,
    assets: ['Various-Roots-' + v + '-Android.apk', 'Various-Roots-' + v + '-Windows-x64-Setup.exe', 'latest.yml']
      .map(name => ({ name, state: 'uploaded', digest: 'sha256:' + 'a'.repeat(64), browser_download_url: dir + name })) };
}

test('chooses the newest compatible preview numerically and skips drafts', () => {
  const list = [preview('0.1.3'), {...preview('1.0.0'), draft: true}, preview('0.1.10'), preview('0.1.9')];
  for (const os of ['windows', 'android']) {
    assert.equal(findRelease(list, '0.1.2', os).version, '0.1.10');
    assert.equal(findRelease(list, '0.1.10', os), null);
  }
});
test('Windows requires an uploaded installer with a digest and its manifest', () => {
  const r = preview('0.1.3');
  r.assets[1].digest = null;
  assert.equal(findRelease([r], '0.1.2', 'windows'), null);
  r.assets[1].digest = 'sha256:' + 'a'.repeat(64);
  r.assets[2].state = 'new';
  assert.equal(findRelease([r], '0.1.2', 'windows'), null);
  assert.equal(findRelease([r], '0.1.2', 'android').version, '0.1.3');
});
test('APK link must point to the named asset on the same repository and tag', () => {
  const r = preview('0.1.3');
  r.assets[0].browser_download_url = 'https://example.org/' + r.assets[0].name;
  assert.equal(findRelease([r], '0.1.2', 'android'), null);
});
