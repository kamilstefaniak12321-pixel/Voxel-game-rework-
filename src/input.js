const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space']);

export class GameInput {
  constructor(canvas, onLook, onPause) {
    this.active = false;
    this.touch = matchMedia('(pointer: coarse)').matches;
    this.keys = new Set();
    this.canvas = canvas;
    this.stick = document.querySelector('#stick');
    this.knob = document.querySelector('#knob');
    this.jumpButton = document.querySelector('#jump');
    this.setTouch(this.touch);
    this.reset();

    window.addEventListener('keydown', (event) => {
      if (!this.active) return;
      if (!MOVE_KEYS.has(event.code)) return;
      event.preventDefault();
      if (event.code === 'Space' && !event.repeat) this.jumpQueued = true;
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    document.addEventListener('mousemove', (event) => {
      if (this.active && document.pointerLockElement === canvas) {
        if (!this.locked || (!event.movementX && !event.movementY)) return;
        // Some hosts report the cursor warp into the captured canvas as a mouse delta.
        if (this.skipLockMove) { this.skipLockMove = false; return; }
        onLook(event.movementX * 0.0024, event.movementY * 0.0024);
      }
    });
    document.addEventListener('pointerlockchange', () => {
      if (this.locked && !document.pointerLockElement) onPause();
      this.locked = document.pointerLockElement === canvas;
      this.skipLockMove = this.locked;
    });

    this.stick.addEventListener('pointerdown', (event) => {
      if (!this.active || this.stickId !== null) return;
      this.stickId = event.pointerId;
      this.stick.setPointerCapture(event.pointerId);
      this.updateStick(event);
    });
    this.stick.addEventListener('pointermove', (event) => {
      if (event.pointerId === this.stickId) this.updateStick(event);
    });
    canvas.addEventListener('pointerdown', (event) => {
      if (!this.active || this.lookId !== null || document.pointerLockElement === canvas) return;
      if (event.pointerType === 'touch' && event.clientX < innerWidth * 0.40) return;
      this.lookId = event.pointerId;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.active || event.pointerId !== this.lookId || document.pointerLockElement === canvas) return;
      const sensitivity = event.pointerType === 'touch' ? 2.8 / Math.min(innerWidth, innerHeight) : 0.003;
      onLook((event.clientX - this.lastX) * sensitivity, (event.clientY - this.lastY) * sensitivity);
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });
    const release = (event) => {
      if (event.pointerId === this.stickId) {
        this.stickId = null;
        this.setStick(0, 0);
      }
      if (event.pointerId === this.lookId) this.lookId = null;
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      document.addEventListener(type, release, true);
    }
    this.jumpButton.addEventListener('pointerdown', (event) => {
      if (this.active) { event.preventDefault(); this.jumpQueued = true; }
    });
    window.addEventListener('blur', onPause);
    document.addEventListener('visibilitychange', () => { if (document.hidden) onPause(); });
  }

  setTouch(value) {
    this.touch = value;
    document.body.classList.toggle('touch', value);
  }

  start() {
    this.reset();
    this.active = true;
    if (!this.touch && this.canvas.requestPointerLock) {
      // Drag-to-look stays available if the host denies pointer lock.
      try { this.canvas.requestPointerLock()?.catch(() => {}); } catch {}
    }
  }

  stop() {
    this.active = false;
    this.locked = false;
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.reset();
  }

  reset() {
    this.keys.clear();
    this.jumpQueued = false;
    this.stickId = this.lookId = null;
    this.setStick(0, 0);
  }

  setStick(x, y) {
    this.strafe = x;
    this.forward = -y;
    this.knob.style.transform = 'translate(' + 29 * x + 'px, ' + 29 * y + 'px)';
  }

  updateStick(event) {
    const rect = this.stick.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.36);
    const y = (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.36);
    const scale = Math.max(1, Math.hypot(x, y));
    this.setStick(x / scale, y / scale);
  }

  read() {
    const held = (a, b) => Number(this.keys.has(a) || this.keys.has(b));
    const input = {
      strafe: this.strafe + held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft'),
      forward: this.forward + held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown'),
      jump: this.jumpQueued,
    };
    this.jumpQueued = false;
    return input;
  }
}
