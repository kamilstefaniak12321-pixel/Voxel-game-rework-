import test from 'node:test';
import assert from 'node:assert/strict';
import { grassInChunk } from '../src/grass-placement.js';
import { GRASS_VARIANTS } from '../src/grass-tuft-variants.js';
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

test('variants mix within a patch and follow the model weights over a wider area', () => {
  const counts = GRASS_VARIANTS.map(() => 0);
  let mixedDenseChunks = 0;
  for (let cz = -8; cz <= 8; cz++) {
    for (let cx = -8; cx <= 8; cx++) {
      const tufts = grassInChunk(cx, cz);
      const local = new Set();
      for (const { variant } of tufts) {
        assert(Number.isInteger(variant) && variant >= 0 && variant < counts.length);
        counts[variant]++;
        local.add(variant);
      }
      if (tufts.length >= 64 && local.size >= 4) mixedDenseChunks++;
    }
  }
  assert(mixedDenseChunks > 0);
  const count = counts.reduce((sum, n) => sum + n, 0);
  const totalWeight = GRASS_VARIANTS.reduce((sum, model) => sum + model.weight, 0);
  GRASS_VARIANTS.forEach(({weight}, i) => {
    assert(counts[i] > 0);
    assert(Math.abs(counts[i] / count - weight / totalWeight) < 0.02);
  });
});
