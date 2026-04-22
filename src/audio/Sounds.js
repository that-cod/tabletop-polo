// Tiny WebAudio synth — no asset files needed.
export class Sounds {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  _ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { this.enabled = false; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _beep({ freq = 440, dur = 0.15, type = 'sine', gain = 0.2, slideTo = null, delay = 0 }) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  flick()  { this._beep({ freq: 520, slideTo: 220, dur: 0.12, type: 'triangle', gain: 0.18 }); }
  hit()    { this._beep({ freq: 180, dur: 0.05, type: 'square', gain: 0.12 }); }
  whistle(){
    this._beep({ freq: 1400, dur: 0.12, type: 'sine', gain: 0.15 });
    this._beep({ freq: 1600, dur: 0.18, type: 'sine', gain: 0.15, delay: 0.08 });
  }
  goal() {
    this._beep({ freq: 330, dur: 0.18, type: 'sawtooth', gain: 0.22 });
    this._beep({ freq: 440, dur: 0.22, type: 'sawtooth', gain: 0.22, delay: 0.12 });
    this._beep({ freq: 660, dur: 0.35, type: 'sawtooth', gain: 0.22, delay: 0.26 });
  }
  select() { this._beep({ freq: 720, dur: 0.06, type: 'triangle', gain: 0.1 }); }
}
