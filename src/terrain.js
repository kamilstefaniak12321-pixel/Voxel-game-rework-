import {
  Color, DoubleSide, Fog, Group, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial,
  NearestFilter, PlaneGeometry, RepeatWrapping, ShaderMaterial,
  SphereGeometry, SRGBColorSpace, TextureLoader, Float32BufferAttribute,
} from 'three';
import grassImage from '../assets/grass.png';
import { CHUNK_SIZE } from './world.js';

const HORIZON = 0xc3d6c9;
const SEGMENTS = 4;
const TEXTURE_BLOCKS = 8;

// A continuous tint on a four-block lattice. Chunk edges sample identical points.
function fieldTint(x, z) {
  const phase = Math.sin(x * 0.083 + Math.cos(z * 0.11)) * 0.5
    + Math.sin(z * 0.135 + x * 0.052) * 0.3 + Math.cos(x * 0.15 - z * 0.17) * 0.2;
  return [0.96 + phase * 0.08, 0.98 + phase * 0.05, 0.93 - phase * 0.055];
}

function makeTileGeometry() {
  const geometry = new PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(CHUNK_SIZE / 2, 0, CHUNK_SIZE / 2);
  return geometry;
}

export async function makeTerrainView(scene, renderer) {
  const grass = await new TextureLoader().loadAsync(grassImage);
  grass.colorSpace = SRGBColorSpace;
  grass.magFilter = NearestFilter;
  grass.minFilter = LinearMipmapLinearFilter;
  grass.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  grass.wrapS = grass.wrapT = RepeatWrapping;
  grass.repeat.set(CHUNK_SIZE / TEXTURE_BLOCKS, CHUNK_SIZE / TEXTURE_BLOCKS);
  const material = new MeshBasicMaterial({ map: grass, vertexColors: true });
  const base = makeTileGeometry();
  const group = new Group();
  scene.add(group);
  const meshes = new Map();
  let revision = -1;

  // All columns have the same height. Only their top is exposed to air.
  return (world) => {
    if (world.revision === revision) return;
    revision = world.revision;
    for (const [key, mesh] of meshes) {
      if (!world.chunks.has(key)) {
        group.remove(mesh);
        mesh.geometry.dispose();
        meshes.delete(key);
      }
    }
    for (const [key, chunk] of world.chunks) {
      if (meshes.has(key)) continue;
      const x = chunk.cx * CHUNK_SIZE;
      const z = chunk.cz * CHUNK_SIZE;
      const geometry = base.clone();
      const colors = [];
      const vertices = geometry.getAttribute('position');
      for (let i = 0; i < vertices.count; i++) {
        colors.push(...fieldTint(x + vertices.getX(i), z + vertices.getZ(i)));
      }
      geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
      const mesh = new Mesh(geometry, material);
      mesh.position.set(x, world.surfaceAt(x, z), z);
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
      meshes.set(key, mesh);
    }
  };
}

export function makeSky(scene) {
  scene.background = new Color(HORIZON);
  scene.fog = new Fog(HORIZON, 32, 77);
  const sky = new Mesh(new SphereGeometry(125, 32, 20), new ShaderMaterial({
    side: DoubleSide,
    depthWrite: false,
    uniforms: { horizon: { value: new Color(HORIZON) }, zenith: { value: new Color(0x76a8c0) } },
    vertexShader: `
      varying float elevation;
      void main() {
        elevation = normalize(position).y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }`,
    fragmentShader: `
      varying float elevation;
      uniform vec3 horizon;
      uniform vec3 zenith;
      void main() {
        gl_FragColor = vec4(mix(horizon, zenith, smoothstep(0., .83, elevation)), 1.);
        #include <colorspace_fragment>
      }`,
  }));
  sky.renderOrder = -1;
  scene.add(sky);
  return sky;
}
