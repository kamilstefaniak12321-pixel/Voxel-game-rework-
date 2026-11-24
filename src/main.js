import { initUpdates } from './update-menu.js';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { Menus } from './menus.js';
import { readSettings, bindSettings } from './settings.js';
import { CHUNK_SIZE, FlatWorld } from './world.js';
import { EYE_HEIGHT, STEP, look, movePlayer, spawnPlayer } from './player.js';
import { makeSky, makeTerrainView } from './terrain.js';
import { CameraSway } from './camera-sway.js';
import { GameInput } from './input.js';

async function boot() {
  const canvas = document.querySelector('#world');
  const start = document.querySelector('#start');
  const action = document.querySelector('#action');
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  const scene = new Scene();
  const camera = new PerspectiveCamera(72, 1, 0.06, 150);
  camera.rotation.order = 'YXZ';
  const sky = makeSky(scene);
  const updateTerrain = await makeTerrainView(scene, renderer);
  const settings = readSettings();
  const world = new FlatWorld(settings.radius);
  world.update(0, 0);
  updateTerrain(world);
  const player = spawnPlayer(world);
  const sway = new CameraSway();
  let previous = { x: player.x, y: player.y, z: player.z };
  let lastTime = 0;
  let accumulated = 0;
  let frameId = 0;
  const input = new GameInput(canvas, (x, y) => look(player, x, y), pause);

  function draw(blend = 1) {
    camera.position.set(
      previous.x + (player.x - previous.x) * blend,
      previous.y + (player.y - previous.y) * blend + EYE_HEIGHT,
      previous.z + (player.z - previous.z) * blend,
    );
    camera.rotation.set(player.pitch, player.yaw, sway.sample(blend) * settings.sway / 100, 'YXZ');
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
  }

  function resize() {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2, Math.sqrt(1800000 / (w * h))));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    draw();
  }

  function frame(now) {
    accumulated += Math.max(0, Math.min(0.1, (now - lastTime) / 1000));
    lastTime = now;
    while (accumulated >= STEP) {
      previous.x = player.x; previous.y = player.y; previous.z = player.z;
      const { strafe, forward, jump } = input.read();
      const wasGrounded = player.grounded;
      movePlayer(world, player, strafe, forward, jump, STEP);
      const groundDistance = wasGrounded && player.grounded
        ? Math.hypot(player.x - previous.x, player.z - previous.z)
        : 0;
      sway.advance(groundDistance, STEP);
      accumulated -= STEP;
    }
    world.update(player.x, player.z);
    updateTerrain(world);
    draw(accumulated / STEP);
    frameId = requestAnimationFrame(frame);
  }

  const settingsButton = document.querySelector('#open-settings');
  const panel = document.querySelector('#settings-panel');
  const intro = document.querySelector('.intro');
  const touchBack = document.querySelector('#pause');
  const menus = new Menus((from, to) => {
    document.body.dataset.state = to;
    if (from === 'playing') {
      input.stop();
      cancelAnimationFrame(frameId);
    }
    panel.hidden = to !== 'settings';
    intro.hidden = to === 'settings';
    touchBack.setAttribute('aria-label', to === 'playing' ? 'Pauza' : to === 'paused' ? 'Wróć do gry' : 'Wstecz');
    if (to === 'playing') {
      input.start();
      accumulated = 0;
      sway.previousRoll = sway.roll;
      previous = { x: player.x, y: player.y, z: player.z };
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
    } else if (to === 'settings') {
      document.querySelector('#sway').focus({ preventScroll: true });
    } else {
      document.querySelector('#title').textContent = to === 'paused' ? 'Pauza' : 'Various Roots';
      action.textContent = to === 'paused' ? 'Wróć do gry' : 'Wejdź do świata';
      (from === 'settings' ? settingsButton : start).focus({ preventScroll: true });
    }
  });

  function pause() {
    if (menus.current !== 'playing') return false;
    menus.open('paused');
    return true;
  }

  function updateDistance() {
    world.update(player.x, player.z, settings.radius);
    updateTerrain(world);
    const distance = CHUNK_SIZE * settings.radius;
    scene.fog.near = distance * 0.4;
    scene.fog.far = distance - 3;
  }

  bindSettings(settings, name => {
    if (name === 'radius') updateDistance();
    draw();
  });
  updateDistance();

  window.pauseVariousRoots = pause;
  window.backVariousRoots = () => menus.back();
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (!event.repeat) menus.back();
  });
  window.addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', pause);
  canvas.addEventListener('webglcontextrestored', resize);
  resize();
  start.disabled = false;
  settingsButton.disabled = false;
  action.textContent = 'Wejdź do świata';
  start.addEventListener('click', event => {
    if (event.pointerType) input.setTouch(['touch', 'pen'].includes(event.pointerType));
    menus.enterGame();
  });
  settingsButton.addEventListener('click', () => menus.open('settings'));
  document.querySelector('#settings-back').addEventListener('click', () => menus.back());
  touchBack.addEventListener('click', () => menus.back());
}

initUpdates();
boot().catch((error) => {
  console.error(error);
  document.body.dataset.state = 'error';
  const detail = document.querySelector('#error');
  detail.hidden = false;
  detail.textContent = 'Gra potrzebuje WebGL 2. Sprawdź obsługę grafiki 3D i aktualizacje systemowego WebView lub sterownika grafiki.';
});
