export const EYE_HEIGHT = 1.62;
export const WALK_SPEED = 4.3;
export const STEP = 1 / 60;

export function spawnPlayer(world) {
  const x = 0.5;
  const z = 0.5;
  return { x, y: world.surfaceAt(x, z), z, yaw: -0.5, pitch: -0.19, vy: 0, grounded: true };
}

export function look(player, dx, dy) {
  player.yaw = (player.yaw - dx) % (2 * Math.PI);
  player.pitch = Math.max(-1.51, Math.min(1.51, player.pitch - dy));
}

export function movePlayer(world, player, strafe, forward, jump, dt) {
  const distance = WALK_SPEED * dt / Math.max(1, Math.hypot(strafe, forward));
  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  player.x += (strafe * cos - forward * sin) * distance;
  player.z -= (strafe * sin + forward * cos) * distance;
  if (jump && player.grounded) player.vy = 7.3;
  player.vy -= 22 * dt;
  player.y += player.vy * dt;
  const floor = world.surfaceAt(player.x, player.z);
  player.grounded = player.y <= floor;
  if (player.grounded) {
    player.y = floor;
    player.vy = 0;
  }
}
