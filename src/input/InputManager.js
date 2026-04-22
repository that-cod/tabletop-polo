import { FIELD } from '../utils/constants.js';

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.pos = { x: 0, y: 0 };
    this.isDown = false;
    this.downPos = { x: 0, y: 0 };

    this.handlers = {
      click: [],
      mousedown: [],
      mousemove: [],
      mouseup: [],
    };

    canvas.addEventListener('mousemove', (e) => this._update(e, 'mousemove'));
    canvas.addEventListener('mousedown', (e) => { this.isDown = true; this._update(e, 'mousedown'); this.downPos = { ...this.pos }; });
    window.addEventListener('mouseup',   (e) => { if (this.isDown) { this._update(e, 'mouseup'); } this.isDown = false; });
    canvas.addEventListener('click',     (e) => this._update(e, 'click'));

    // Touch support (basic)
    canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0]; this._updateXY(t.clientX, t.clientY);
      this.isDown = true; this.downPos = { ...this.pos };
      this._fire('mousedown'); e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      const t = e.touches[0]; this._updateXY(t.clientX, t.clientY);
      this._fire('mousemove'); e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
      this.isDown = false; this._fire('mouseup');
      // also emit click since touches are taps
      this._fire('click');
      e.preventDefault();
    }, { passive: false });
  }

  _updateXY(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / rect.width;
    const sy = this.canvas.height / rect.height;
    this.pos.x = (clientX - rect.left) * sx;
    this.pos.y = (clientY - rect.top) * sy;
  }

  _update(e, name) {
    this._updateXY(e.clientX, e.clientY);
    this._fire(name);
  }

  _fire(name) {
    for (const h of this.handlers[name]) h(this.pos, this);
  }

  on(name, fn)  { this.handlers[name].push(fn); return () => this.off(name, fn); }
  off(name, fn) {
    const arr = this.handlers[name];
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  }
}
