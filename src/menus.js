// The empty stack is the live game. Closing an overlay reveals its opener.
export class Menus {
  stack = ['welcome'];

  constructor(onChange) {
    this.onChange = onChange;
  }

  get current() { return this.stack.at(-1) ?? 'playing'; }

  open(screen) {
    const from = this.current;
    if (screen === from) return;
    this.stack.push(screen);
    this.onChange(from, screen);
  }

  enterGame() {
    const from = this.current;
    this.stack.length = 0;
    this.onChange(from, 'playing');
  }

  back() {
    const from = this.current;
    if (from === 'welcome') return false;
    if (from === 'playing') this.open('paused');
    else {
      this.stack.pop();
      this.onChange(from, this.current);
    }
    return true;
  }
}
