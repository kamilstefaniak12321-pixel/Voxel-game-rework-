import { CHUNK_SIZE } from './world.js';

// One tuft in every 8×8 area also grows outside patches. The remaining tufts
// follow a continuous field in world coordinates, including across chunk edges.
const BACKGROUND_CELL = 8;
const PATCH_SPACING = 28;
const EDGE_SPACING = 9;
const MAX_EXTRA_CHANCE = 0.48;

function hash(x, z, salt) {
  let bits = Math.imul(x, 0x1e35a7bd) ^ Math.imul(z, 0x94d049bb) ^ salt;
  bits = Math.imul(bits ^ (bits >>> 16), 0x85ebca6b);
  bits = Math.imul(bits ^ (bits >>> 13), 0xc2b2ae35);
  return (bits ^ (bits >>> 16)) >>> 0;
}

const unit = bits => bits / 0x100000000;
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

function noise(x, z, spacing, salt) {
  const gx = x / spacing, gz = z / spacing;
  const ix = Math.floor(gx), iz = Math.floor(gz);
  const tx = smooth(gx - ix), tz = smooth(gz - iz);
  const north = lerp(unit(hash(ix, iz, salt)), unit(hash(ix + 1, iz, salt)), tx);
  const south = lerp(unit(hash(ix, iz + 1, salt)), unit(hash(ix + 1, iz + 1, salt)), tx);
  return lerp(north, south, tz);
}

function patchChance(x, z) {
  const field = 0.76 * noise(x, z, PATCH_SPACING, 117) + 0.24 * noise(x, z, EDGE_SPACING, 467);
  return MAX_EXTRA_CHANCE * smooth(Math.max(0, Math.min(1, (field - 0.44) / 0.29)));
}

export function grassInChunk(cx, cz) {
  const tufts = [];
  const left = cx * CHUNK_SIZE, top = cz * CHUNK_SIZE;
  for (let cellZ = top; cellZ < top + CHUNK_SIZE; cellZ += BACKGROUND_CELL) {
    for (let cellX = left; cellX < left + CHUNK_SIZE; cellX += BACKGROUND_CELL) {
      const anchor = hash(cellX, cellZ, 251);
      const sparseX = cellX + anchor % BACKGROUND_CELL;
      const sparseZ = cellZ + (anchor >>> 8) % BACKGROUND_CELL;
      for (let z = cellZ; z < cellZ + BACKGROUND_CELL; z++) {
        for (let x = cellX; x < cellX + BACKGROUND_CELL; x++) {
          const sparse = x === sparseX && z === sparseZ;
          if (!sparse && unit(hash(x, z, 631)) >= patchChance(x + 0.5, z + 0.5)) continue;
          const jitter = hash(x, z, 829);
          const shape = hash(x, z, 1021);
          tufts.push({
            x: x + 0.1 + (jitter & 65535) / 65536 * 0.8,
            z: z + 0.1 + (jitter >>> 16) / 65536 * 0.8,
            yaw: (shape & 65535) / 65536 * Math.PI * 2,
            scale: 0.67 + (shape >>> 16) / 65536 * 0.4,
          });
        }
      }
    }
  }
  return tufts;
}
