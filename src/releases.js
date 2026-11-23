export const REPO = 'kamilstefaniak12321-pixel/Voxel-game-rework-';
export const SITE = 'https://github.com/' + REPO;
export const FEED = 'https://api.github.com/repos/' + REPO + '/releases?per_page=100';
const versionTag = /^v(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/;

function newer(a, b) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

export function findRelease(releases, installed, platform) {
  let best = null;
  for (const release of releases) {
    if (release.draft || !versionTag.test(release.tag_name)) continue;
    const version = release.tag_name.slice(1);
    if (!newer(version, best?.version ?? installed)) continue;
    const dir = SITE + '/releases/download/' + release.tag_name + '/';
    const name = 'Various-Roots-' + version + (platform === 'windows' ? '-Windows-x64-Setup.exe' : '-Android.apk');
    const has = (file) => release.assets?.find(a => a.name === file && a.state === 'uploaded' && a.browser_download_url === dir + file);
    const asset = has(name);
    if (!asset || (platform === 'windows' && (!has('latest.yml') || !/^sha256:[a-f0-9]{64}$/.test(asset.digest)))) continue;
    best = { version, dir, name, url: dir + name, notes: SITE + '/releases/tag/' + release.tag_name, digest: asset.digest };
  }
  return best;
}

export async function checkRelease(installed, platform) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(FEED, { signal: controller.signal, credentials: 'omit', cache: 'no-store' });
    if (!response.ok) throw new Error('Release feed: ' + response.status);
    return findRelease(await response.json(), installed, platform);
  } finally { clearTimeout(timer); }
}
