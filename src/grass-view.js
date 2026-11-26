import {
  BufferGeometry, DoubleSide, Float32BufferAttribute, InstancedMesh, MeshBasicMaterial,
  NearestFilter, NearestMipmapLinearFilter, Object3D, SRGBColorSpace, TextureLoader,
} from 'three';
import tuftAtlas from '../assets/grass-tuft.png';
import { GRASS_TUFT_CARDS } from './grass-tuft-model.js';
import { grassInChunk } from './grass-placement.js';
import { CHUNK_SIZE } from './world.js';

function tuftGeometry() {
  const positions = [], uvs = [], indices = [];
  for (const { vertices, tile, mirror } of GRASS_TUFT_CARDS) {
    const start = positions.length / 3;
    for (const vertex of vertices) positions.push(...vertex);
    const left = (tile + Number(mirror)) / 3;
    const right = (tile + Number(!mirror)) / 3;
    uvs.push(left, 1, right, 1, right, 0, left, 0);
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

export async function makeGrassBatchFactory() {
  const atlas = await new TextureLoader().loadAsync(tuftAtlas);
  atlas.colorSpace = SRGBColorSpace;
  atlas.magFilter = NearestFilter;
  atlas.minFilter = NearestMipmapLinearFilter;
  const geometry = tuftGeometry();
  const material = new MeshBasicMaterial({ map: atlas, side: DoubleSide, alphaTest: 0.45 });
  const transform = new Object3D();

  // Local to the ground mesh so an entire chunk can be culled or unloaded together.
  return (world, chunk, groundY) => {
    const tufts = grassInChunk(chunk.cx, chunk.cz);
    if (!tufts.length) return null;
    const mesh = new InstancedMesh(geometry, material, tufts.length);
    mesh.name = 'Trawa łąkowa';
    mesh.renderOrder = 1;
    const originX = chunk.cx * CHUNK_SIZE, originZ = chunk.cz * CHUNK_SIZE;
    for (const [i, { x, z, scale, yaw }] of tufts.entries()) {
      transform.position.set(x - originX, world.surfaceAt(x, z) - groundY, z - originZ);
      transform.rotation.y = yaw;
      transform.scale.setScalar(scale);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    return mesh;
  };
}
