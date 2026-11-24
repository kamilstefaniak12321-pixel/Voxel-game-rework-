import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK, CHUNK_SIZE, FlatWorld } from '../src/world.js';
import { look, movePlayer, spawnPlayer, STEP, WALK_SPEED } from '../src/player.js';

test('columns contain twelve stone, three dirt and one grass block on both sides of zero', () => {
  const world = new FlatWorld(1);
  world.update(0, 0);
  const expected = [...Array(12).fill(BLOCK.STONE), ...Array(3).fill(BLOCK.DIRT), BLOCK.GRASS];
  for (const [x, z] of [[0, 0], [-0.01, -0.01], [15.99, -16], [16, 16], [-54, 91]]) {
    assert.equal(world.blockAt(x, -17, z), BLOCK.AIR);
    assert.deepEqual(expected.map((_, i) => world.blockAt(x, i - 16, z)), expected);
    assert.equal(world.blockAt(x, 0, z), BLOCK.AIR);
    assert.equal(world.surfaceAt(x, z), 0);
  }
});

test('streaming keeps neighbours, releases distant chunks and regenerates identical terrain', () => {
  const world = new FlatWorld(2);
  world.update(0, 0);
  const origin = world.chunks.get('0,0');
  world.update(CHUNK_SIZE, 0);
  assert.equal(world.chunks.get('0,0'), origin);
  for (let i = 1; i < 40; i++) {
    world.update(-i * CHUNK_SIZE - 0.1, i * CHUNK_SIZE);
    assert.equal(world.chunks.size, 25);
    assert.equal(world.centerX, -i - 1);
  }
  assert(!world.chunks.has('0,0'));
  world.update(0, 0);
  assert.deepEqual(world.chunks.get('0,0').blocks, origin.blocks);
});

test('walking, diagonal and analogue input preserve direction and speed across a chunk edge', () => {
  const world = new FlatWorld(1);
  const travel = (strafe, forward, yaw) => {
    const player = spawnPlayer(world);
    player.yaw = yaw;
    for (let i = 0; i < 360; i++) {
      movePlayer(world, player, strafe, forward, false, STEP);
      world.update(player.x, player.z);
      assert.equal(player.y, 0);
      assert.equal(player.grounded, true);
    }
    return [player.x - 0.5, player.z - 0.5];
  };
  const expected = WALK_SPEED * 6;
  for (const [s, f] of [[0, 1], [1, 0], [1, 1]]) {
    assert(Math.abs(Math.hypot(...travel(s, f, 0)) - expected) < 1e-8);
  }
  assert(Math.abs(travel(0, 0.5, 0)[1] + expected / 2) < 1e-8);
  assert(Math.abs(travel(0, 1, Math.PI / 2)[0] + expected) < 1e-8);
});

test('jump clears one block, ignores an airborne second press and lands on the surface', () => {
  const world = new FlatWorld(1);
  const player = spawnPlayer(world);
  let peak = 0;
  let previousVelocity;
  for (let i = 0; i < 90; i++) {
    movePlayer(world, player, 0, 0, i === 0 || i === 12, STEP);
    if (i === 12) assert(player.vy < previousVelocity);
    previousVelocity = player.vy;
    peak = Math.max(peak, player.y);
    assert(player.y >= 0);
  }
  assert(peak > 1 && peak < 1.4);
  assert.equal(player.y, 0);
  assert.equal(player.grounded, true);
});

test('looking around clamps pitch and leaves the player position unchanged', () => {
  const player = spawnPlayer(new FlatWorld());
  const { x, y, z, yaw } = player;
  look(player, 0.1, -30);
  assert(player.yaw < yaw);
  assert(player.pitch > 1.4 && player.pitch < Math.PI / 2);
  look(player, 0, 99);
  assert(player.pitch < -1.4 && player.pitch > -Math.PI / 2);
  assert.deepEqual([player.x, player.y, player.z], [x, y, z]);
});

test('changing radius at rest updates the same world and preserves overlapping chunks', () => {
  const world = new FlatWorld();
  world.update(-1, 23);
  const center = world.chunks.get('-1,1');
  for (const radius of [8, 2, 5]) {
    const revision = world.revision;
    world.update(-1, 23, radius);
    assert.equal(world.chunks.size, (2 * radius + 1) ** 2);
    assert.equal(world.chunks.get('-1,1'), center);
    assert.equal(world.revision, revision + 1);
    world.update(-1, 23);
    assert.equal(world.revision, revision + 1);
  }
});
