/**
 * Replay — records the last N frames of ball + player positions into a
 * circular buffer and plays them back at half speed on goal.
 *
 * Usage:
 *   replay.record(ball, teamA, teamB)  — called every game frame
 *   replay.startPlayback()             — call on goal event
 *   replay.update(dt)                  — call in game loop
 *   replay.isPlaying                   — true during playback
 *   replay.currentFrame()              — returns snapshot for renderer
 *   replay.onDone                      — callback when playback ends
 */

const BUFFER_SIZE   = 180; // ~3 seconds at 60 fps
const PLAYBACK_SPEED = 0.5; // 0.5× — half speed for drama

export class Replay {
  constructor() {
    this._buf   = new Array(BUFFER_SIZE).fill(null);
    this._head  = 0;   // points to the NEXT slot to write
    this._count = 0;   // how many valid frames are in the buffer
    this._playIdx   = 0;    // fractional index into recorded slice
    this._playSlice = null; // array of frames for this playback run
    this.isPlaying  = false;
    this.onDone     = null;
  }

  /** Record one frame snapshot. Call every game update tick. */
  record(ball, teamA, teamB) {
    if (this.isPlaying) return; // don't overwrite while replaying

    const snap = {
      ball: { x: ball.x, y: ball.y },
      teamA: teamA.players.map(p => ({ x: p.x, y: p.y, facing: p.facing, teamId: p.teamId, role: p.role, stamina: p.stamina })),
      teamB: teamB.players.map(p => ({ x: p.x, y: p.y, facing: p.facing, teamId: p.teamId, role: p.role, stamina: p.stamina })),
    };

    this._buf[this._head] = snap;
    this._head = (this._head + 1) % BUFFER_SIZE;
    if (this._count < BUFFER_SIZE) this._count++;
  }

  /** Begin replaying the last _count frames at half speed. */
  startPlayback() {
    if (this._count === 0) return;

    // Build ordered slice from oldest → newest
    const slice = [];
    const start = this._count < BUFFER_SIZE
      ? 0
      : this._head; // oldest slot

    for (let i = 0; i < this._count; i++) {
      const idx = (start + i) % BUFFER_SIZE;
      if (this._buf[idx]) slice.push(this._buf[idx]);
    }

    this._playSlice  = slice;
    this._playIdx    = 0;
    this.isPlaying   = true;
  }

  /**
   * Advance playback. dt is real seconds.
   * At 0.5× speed 1 real second = 0.5 frames/sec × 60 = 30 recorded frames per real second.
   */
  update(dt) {
    if (!this.isPlaying || !this._playSlice) return;

    this._playIdx += dt * 60 * PLAYBACK_SPEED;

    if (this._playIdx >= this._playSlice.length) {
      this.isPlaying = false;
      this._playSlice = null;
      if (this.onDone) this.onDone();
    }
  }

  /** Returns the current interpolated frame snapshot, or null if not playing. */
  currentFrame() {
    if (!this.isPlaying || !this._playSlice) return null;
    const i = Math.min(Math.floor(this._playIdx), this._playSlice.length - 1);
    return this._playSlice[i];
  }

  reset() {
    this._buf.fill(null);
    this._head      = 0;
    this._count     = 0;
    this._playSlice = null;
    this._playIdx   = 0;
    this.isPlaying  = false;
  }
}
