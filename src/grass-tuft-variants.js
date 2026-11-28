import { GRASS_TUFT_CARDS } from './grass-tuft-model.js';

// Move the original card by its root. Lean is the horizontal offset per block of height.
function arrangeCard(index, root, turnDegrees, [width, height], [leanX, leanZ] = [0, 0]) {
  const card = GRASS_TUFT_CARDS[index];
  const [, , right, left] = card.vertices;
  const rootX = (left[0] + right[0]) / 2;
  const rootZ = (left[2] + right[2]) / 2;
  const angle = turnDegrees * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const vertices = card.vertices.map(([x, y, z]) => {
    const dx = (x - rootX) * width;
    const dz = (z - rootZ) * width;
    const tipHeight = y * height;
    return [
      root[0] + dx * cos - dz * sin + tipHeight * leanX,
      tipHeight,
      root[1] + dx * sin + dz * cos + tipHeight * leanZ,
    ];
  });
  return { vertices, tile: card.tile, mirror: card.mirror };
}

export const GRASS_VARIANTS = [
  { id: 'lakowa', name: 'Łąkowa', weight: 36, cards: GRASS_TUFT_CARDS },
  {
    id: 'smukla', name: 'Smukła', weight: 26,
    cards: [
      arrangeCard(0, [-0.08, -0.05], -6, [0.85, 1.0]),
      arrangeCard(1, [0.08, -0.02], 8, [0.86, 0.94]),
      arrangeCard(2, [0.01, 0.09], 2, [0.84, 1.0]),
      arrangeCard(3, [-0.03, -0.03], 12, [0.81, 1.04]),
      arrangeCard(4, [0.03, 0.04], -13, [0.83, 1.11]),
      arrangeCard(6, [0.01, -0.04], 6, [0.86, 1.12]),
      arrangeCard(7, [-0.01, 0.03], -16, [0.78, 0.98]),
    ],
  },
  {
    id: 'luzna', name: 'Luźna', weight: 20,
    cards: [
      arrangeCard(0, [-0.16, -0.08], 9, [1.03, 0.97]),
      arrangeCard(2, [0.1, 0.15], -14, [1.02, 1.01]),
      arrangeCard(3, [-0.09, -0.06], 13, [1.08, 0.94], [-0.08, -0.07]),
      arrangeCard(4, [0.15, 0.02], -6, [1.0, 0.91], [0.11, -0.04]),
      arrangeCard(5, [-0.09, 0.12], -9, [0.95, 0.86]),
      arrangeCard(6, [0.08, 0.03], -11, [0.96, 1.02], [0.06, 0.03]),
    ],
  },
  {
    id: 'rozeta', name: 'Rozeta', weight: 9,
    cards: [
      arrangeCard(0, [-0.11, -0.08], 7, [1.05, 0.57], [-0.42, -0.23]),
      arrangeCard(1, [0.11, -0.09], -17, [1.04, 0.63], [0.43, -0.28]),
      arrangeCard(2, [0.02, 0.13], 16, [1.12, 0.62], [-0.08, 0.57]),
      arrangeCard(3, [-0.04, 0.04], -36, [0.76, 0.59], [-0.39, 0.18]),
      arrangeCard(4, [0.03, -0.01], -4, [0.74, 0.54], [0.27, 0.21]),
    ],
  },
  {
    id: 'wachlarz', name: 'Wachlarz', weight: 6,
    cards: [
      arrangeCard(0, [-0.16, -0.06], -24, [0.91, 0.84], [0.14, -0.18]),
      arrangeCard(2, [-0.08, 0.07], -9, [1.04, 0.88], [0.41, 0.19]),
      arrangeCard(3, [-0.16, -0.09], -36, [1.12, 0.89], [0.28, -0.22]),
      arrangeCard(5, [-0.11, 0.02], 3, [1.07, 1.04], [0.48, 0.03]),
      arrangeCard(4, [-0.07, 0.09], 34, [0.81, 0.92], [0.67, 0.24]),
      arrangeCard(6, [-0.14, 0.01], 16, [0.75, 0.96], [0.59, -0.05]),
    ],
  },
  {
    id: 'wiechowa', name: 'Wiechowa', weight: 3,
    cards: [
      arrangeCard(0, [-0.03, -0.07], 14, [0.64, 0.83]),
      arrangeCard(2, [0.04, 0.05], -16, [0.71, 0.91]),
      arrangeCard(4, [0.01, 0.04], 27, [0.58, 1.04]),
      arrangeCard(6, [-0.09, -0.05], -12, [0.65, 1.31], [-0.09, 0.02]),
      arrangeCard(7, [0.05, 0.06], 21, [0.63, 1.46], [0.10, -0.05]),
    ],
  },
];
