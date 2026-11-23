import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const bundle = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'chrome100',
  minify: true,
  legalComments: 'inline',
  loader: { '.png': 'dataurl' },
});
const script = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const [template, styleSource, icon, license] = await Promise.all([
  readFile('src/index.html', 'utf8'),
  readFile('src/game.css', 'utf8'),
  readFile('assets/icon.png'),
  readFile('node_modules/three/LICENSE', 'utf8'),
]);
const style = styleSource.replace(/\r\n?/g, '\n');
const hash = (value) => createHash('sha256').update(value).digest('base64');
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const html = template
  .replace('@@VERSION@@', version)
  .replace('@@SCRIPT_HASH@@', hash(script))
  .replace('@@STYLE_HASH@@', hash(style))
  .replaceAll('@@ICON@@', 'data:image/png;base64,' + icon.toString('base64'))
  .replace('<!-- STYLE -->', () => '<style>' + style + '</style>')
  .replace('<!-- GAME -->', () => '<!-- Three.js\n' + license + '\n-->\n<script>' + script + '</script>');
await mkdir('dist', { recursive: true });
await writeFile('dist/index.html', html);
console.log('dist/index.html (' + Math.round(Buffer.byteLength(html) / 1024) + ' KiB)');

await build({
  entryPoints: ['packaging/windows/updates.cjs'], outfile: 'out/desktop/updates.cjs',
  bundle: true, platform: 'node', format: 'cjs', external: ['electron'],
});
