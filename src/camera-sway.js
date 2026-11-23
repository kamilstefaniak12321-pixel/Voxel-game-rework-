import { WALK_SPEED } from './player.js';

const MAX_ROLL = Math.PI / 180;
const BLOCKS_PER_STEP = 2.15;
const FADE_SECONDS = 0.2;

export class CameraSway {
  phase = 0;
  strength = 0;
  roll = 0;
  previousRoll = 0;

  advance(groundDistance, dt) {
    this.previousRoll = this.roll;
    const target = Math.min(1, groundDistance / (WALK_SPEED * dt));
    const maxChange = dt / FADE_SECONDS;
    this.strength += Math.max(-maxChange, Math.min(maxChange, target - this.strength));
    if (this.strength < 1e-10) this.strength = 0;
    this.phase = this.strength === 0 ? 0
      : (this.phase + Math.PI * groundDistance / BLOCKS_PER_STEP) % (2 * Math.PI);
    this.roll = MAX_ROLL * this.strength * Math.sin(this.phase);
  }

  sample(blend) {
    return this.previousRoll + (this.roll - this.previousRoll) * blend;
  }
}
