import {
  BufferGeometry, DoubleSide, Float32BufferAttribute, InstancedMesh, Mesh, MeshBasicMaterial,
  NearestFilter, NearestMipmapLinearFilter, Object3D, SRGBColorSpace, TextureLoader,
} from 'three';
import tuftAtlas from '../assets/grass-tuft.png';
import { GRASS_VARIANTS } from './grass-tuft-variants.js';
import { grassInChunk } from './grass-placement.js';
import { CHUNK_SIZE } from './world.js';

const ATLAS_TILES = 3;

// All variants use the same indices and UVs. Reserve enough card slots for
// each atlas tile. Empty slots collapse to one point at the base of the tuft.
function tuftGeometry() {
  const shapes = GRASS_VARIANTS.map(({ cards }) =>
    Array.from({ length: ATLAS_TILES }, (_, tile) => cards.filter(card => card.tile === tile)));
  const positions = shapes.map(() => []);
  const indices = [], uvs = [];
  for (let tile = 0; tile < ATLAS_TILES; tile++) {
    const count = Math.max(...shapes.map(shape => shape[tile].length));
    const left = tile / ATLAS_TILES, right = (tile + 1) / ATLAS_TILES;
    for (let slot = 0; slot < count; slot++) {
      const start = uvs.length / 2;
      uvs.push(left, 1, right, 1, right, 0, left, 0);
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
      for (let variant = 0; variant < shapes.length; variant++) {
        const card = shapes[variant][tile][slot];
        if (!card) {
          positions[variant].push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
          continue;
        }
        // Mirrored cards exchange left and right corners against the same UVs.
        const [tl, tr, br, bl] = card.vertices;
        const corners = card.mirror ? [tr, tl, bl, br] : [tl, tr, br, bl];
        for (const vertex of corners) positions[variant].push(...vertex);
      }
    }
  }
  const geometry = new BufferGeometry();
  const [base, ...variants] = positions.map(data => new Float32BufferAttribute(data, 3));
  geometry.setAttribute('position', base);
  geometry.morphAttributes.position = variants;
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export async function makeGrassBatchFactory() {
  const atlas = await new TextureLoader().loadAsync(tuftAtlas);
  atlas.colorSpace = SRGBColorSpace;
  atlas.magFilter = NearestFilter;
  atlas.minFilter = NearestMipmapLinearFilter;
  const geometry = tuftGeometry();
  const material = new MeshBasicMaterial({ map: atlas, side: DoubleSide, alphaTest: 0.45 });
  // One fixed morph selection per plant shape, shared by every chunk.
  const shapes = GRASS_VARIANTS.map((_, index) => {
    const shape = new Mesh(geometry, material);
    if (index > 0) shape.morphTargetInfluences[index - 1] = 1;
    return shape;
  });
  const transform = new Object3D();

  // Local to the ground mesh so an entire chunk can be culled or unloaded together.
  return (world, chunk, groundY) => {
    const tufts = grassInChunk(chunk.cx, chunk.cz);
    if (!tufts.length) return null;
    const mesh = new InstancedMesh(geometry, material, tufts.length);
    mesh.name = 'Trawa łąkowa';
    mesh.renderOrder = 1;
    const originX = chunk.cx * CHUNK_SIZE, originZ = chunk.cz * CHUNK_SIZE;
    for (const [i, { x, z, scale, yaw, variant }] of tufts.entries()) {
      transform.position.set(x - originX, world.surfaceAt(x, z) - groundY, z - originZ);
      transform.rotation.y = yaw;
      transform.scale.setScalar(scale);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
      mesh.setMorphAt(i, shapes[variant]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.morphTexture.needsUpdate = true;
    mesh.computeBoundingSphere();
    return mesh;
  };
}
