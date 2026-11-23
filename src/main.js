import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { FlatWorld } from './world.js';
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
  const world = new FlatWorld();
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
    camera.rotation.set(player.pitch, player.yaw, sway.sample(blend), 'YXZ');
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

  function pause() {
    if (!input.active) return false;
    input.stop();
    cancelAnimationFrame(frameId);
    document.body.dataset.state = 'paused';
    document.querySelector('#title').textContent = 'Pauza';
    action.textContent = 'Wróć do gry';
    start.focus({ preventScroll: true });
    return true;
  }

  window.pauseVariousRoots = pause;
  window.addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', pause);
  canvas.addEventListener('webglcontextrestored', resize);
  resize();
  start.disabled = false;
  action.textContent = 'Wejdź do świata';
  start.addEventListener('click', (event) => {
    if (input.active) return;
    document.body.dataset.state = 'playing';
    input.start(event.pointerType);
    accumulated = 0;
    sway.previousRoll = sway.roll;
    previous = { x: player.x, y: player.y, z: player.z };
    lastTime = performance.now();
    frameId = requestAnimationFrame(frame);
  });
}

boot().catch((error) => {
  console.error(error);
  document.body.dataset.state = 'error';
  const detail = document.querySelector('#error');
  detail.hidden = false;
  detail.textContent = 'Gra potrzebuje WebGL 2. Sprawdź obsługę grafiki 3D i aktualizacje systemowego WebView lub sterownika grafiki.';
});
