import test from 'node:test';
import assert from 'node:assert/strict';
import { grassInChunk } from '../src/grass-placement.js';
import { CHUNK_SIZE } from '../src/world.js';

test('tufts regenerate identically and each belongs to one source block, including at negative coordinates', () => {
  const first = grassInChunk(-1, 0);
  grassInChunk(0, -1);
  assert.deepEqual(grassInChunk(-1, 0), first);
  const blocks = new Set();
  for (const [cx, cz] of [[-1,-1],[-1,0],[0,-1],[0,0]]) {
    for (const {x,z,scale,yaw} of grassInChunk(cx, cz)) {
      assert.equal(Math.floor(x / CHUNK_SIZE), cx);
      assert.equal(Math.floor(z / CHUNK_SIZE), cz);
      assert(scale > 0 && yaw >= 0 && yaw < 2 * Math.PI);
      const key = Math.floor(x) + ',' + Math.floor(z);
      assert(!blocks.has(key));
      blocks.add(key);
    }
  }
});

test('dense patches and sparse clearings coexist, with at least one tuft per 8×8 area', () => {
  const counts = [];
  for (let cz = -5; cz <= 5; cz++) {
    for (let cx = -5; cx <= 5; cx++) {
      const tufts = grassInChunk(cx, cz);
      const groups = new Set(tufts.map(({x,z}) => Math.floor(x / 8) + ',' + Math.floor(z / 8)));
      assert.equal(groups.size, (CHUNK_SIZE / 8) ** 2);
      counts.push(tufts.length);
    }
  }
  assert(Math.min(...counts) <= 8);
  assert(Math.max(...counts) >= 64);
});
