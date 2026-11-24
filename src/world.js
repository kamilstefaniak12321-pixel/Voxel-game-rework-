// A block at integer y occupies [y, y + 1). The grass surface is at y = 0.
export const BLOCK = Object.freeze({ AIR: 0, STONE: 1, DIRT: 2, GRASS: 3 });
export const CHUNK_SIZE = 16;
export const DEPTH = 16;
const LAYER_SIZE = CHUNK_SIZE * CHUNK_SIZE;

function materialAtHeight(y) {
  if (y < -DEPTH || y >= 0) return BLOCK.AIR;
  if (y === -1) return BLOCK.GRASS;
  return y >= -4 ? BLOCK.DIRT : BLOCK.STONE;
}

function generateChunk(cx, cz) {
  const blocks = new Uint8Array(LAYER_SIZE * DEPTH);
  for (let layer = 0; layer < DEPTH; layer++) {
    blocks.fill(materialAtHeight(layer - DEPTH), layer * LAYER_SIZE, (layer + 1) * LAYER_SIZE);
  }
  return { cx, cz, blocks };
}

export class FlatWorld {
  constructor(radius = 5) {
    this.radius = radius;
    this.chunks = new Map();
    this.revision = 0;
    this.centerX = null;
    this.centerZ = null;
  }

  update(x, z, radius = this.radius) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    if (cx === this.centerX && cz === this.centerZ && radius === this.radius) return;
    this.radius = radius;
    this.revision++;
    this.centerX = cx;
    this.centerZ = cz;
    for (const [key, chunk] of this.chunks) {
      if (Math.abs(chunk.cx - cx) > this.radius || Math.abs(chunk.cz - cz) > this.radius) {
        this.chunks.delete(key);
      }
    }
    for (let dz = -this.radius; dz <= this.radius; dz++) {
      for (let dx = -this.radius; dx <= this.radius; dx++) {
        const chunkX = cx + dx;
        const chunkZ = cz + dz;
        const key = chunkX + ',' + chunkZ;
        if (!this.chunks.has(key)) this.chunks.set(key, generateChunk(chunkX, chunkZ));
      }
    }
  }

  blockAt(x, y, z) {
    const by = Math.floor(y);
    if (by >= 0 || by < -DEPTH) return BLOCK.AIR;
    const bx = Math.floor(x);
    const bz = Math.floor(z);
    const cx = Math.floor(bx / CHUNK_SIZE);
    const cz = Math.floor(bz / CHUNK_SIZE);
    const chunk = this.chunks.get(cx + ',' + cz);
    if (!chunk) return materialAtHeight(by);
    const localX = bx - cx * CHUNK_SIZE;
    const localZ = bz - cz * CHUNK_SIZE;
    return chunk.blocks[(by + DEPTH) * LAYER_SIZE + localZ * CHUNK_SIZE + localX];
  }

  surfaceAt(x, z) {
    for (let y = -1; y >= -DEPTH; y--) {
      if (this.blockAt(x, y, z) !== BLOCK.AIR) return y + 1;
    }
    return -DEPTH;
  }
}
