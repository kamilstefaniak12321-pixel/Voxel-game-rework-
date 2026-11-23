import test from 'node:test';
import assert from 'node:assert/strict';
import { CameraSway } from '../src/camera-sway.js';
import { STEP, WALK_SPEED } from '../src/player.js';

function advance(sway, speed, ticks) {
  for (let i = 0; i < ticks; i++) sway.advance(speed * STEP, STEP);
}

test('full and half speed reach alternating peaks at the distance of each footfall', () => {
  for (const fraction of [1, 0.5]) {
    const sway = new CameraSway();
    const speed = fraction * WALK_SPEED;
    const peak = fraction * Math.PI / 180;
    advance(sway, speed, 15 / fraction);
    assert(Math.abs(sway.roll - peak) < 1e-10);
    advance(sway, speed, 30 / fraction);
    assert(Math.abs(sway.roll + peak) < 1e-10);
    assert.equal(sway.sample(0), sway.previousRoll);
    assert.equal(sway.sample(1), sway.roll);
  }
});

test('with no new ground distance the horizon settles within 0.2 seconds', () => {
  const sway = new CameraSway();
  advance(sway, WALK_SPEED, 15);
  const peak = sway.roll;
  advance(sway, 0, 6);
  assert(Math.abs(sway.roll - peak / 2) < 1e-10);
  advance(sway, 0, 6);
  assert.equal(sway.roll, 0);
  advance(sway, 0, 60);
  assert.equal(sway.sample(0.5), 0);
});
