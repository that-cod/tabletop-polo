/**
 * HookSystem — mallet hook defensive mechanic.
 *
 * Real polo rule: A defender can legally hook the attacker's mallet on the
 * downswing if they are positioned close enough on the correct side.
 *
 * Implementation:
 *  - When the human player starts dragging to flick, the game checks if any
 *    opponent player is within hookRadius of the ball.
 *  - If yes: a "HOOK?" prompt is shown. The defender (human = team A) clicks
 *    a button or presses H to hook within a time window.
 *  - If the hook lands: flick power is halved and angle deflected ±DEFLECT_RAD.
 *  - AI uses the hook with probability based on difficulty.
 *  - O(n) where n = players per team (max 4) — called only once per flick setup.
 */

import { PHYSICS } from '../utils/constants.js';

const HOOK_RADIUS   = PHYSICS.malletReach * 3.5; // px — defender must be this close to ball
const DEFLECT_RAD   = 0.42;                       // radians — aim scatter on successful hook
const HOOK_WINDOW_MS = 600;                       // ms the human has to react

export class HookSystem {
  constructor() {
    this.active       = false;   // hook opportunity is open
    this.hookerTeamId = -1;      // which team can hook right now
    this._timer       = 0;       // ms remaining in hook window
    this._hooked      = false;   // was the hook executed this window?

    // Callbacks set by Game.js
    this.onHookOpportunity = null; // (hookerTeamId) — show prompt
    this.onHookClose       = null; // () — hide prompt
  }

  /**
   * Call when a player is about to flick. Returns the hooking defender player
   * if an opponent is in position, or null.
   * O(n) over opponent players.
   */
  checkFlickSetup(flickingPlayer, ball, opponentTeam) {
    this.active   = false;
    this._hooked  = false;

    for (const p of opponentTeam.players) {
      const d = Math.hypot(p.x - ball.x, p.y - ball.y);
      if (d <= HOOK_RADIUS) {
        this.active       = true;
        this.hookerTeamId = p.teamId;
        this._timer       = HOOK_WINDOW_MS;
        this._hooker      = p;
        if (this.onHookOpportunity) this.onHookOpportunity(p.teamId);
        return p;
      }
    }
    return null;
  }

  /**
   * Called every frame (dt in seconds). Counts down the hook window.
   */
  update(dt) {
    if (!this.active) return;
    this._timer -= dt * 1000;
    if (this._timer <= 0) {
      this.active = false;
      this._hooker = null;
      if (this.onHookClose) this.onHookClose();
    }
  }

  /**
   * Human or AI executes the hook. Modifies velocity vector in place.
   * Returns the deflected { vx, vy } or original if no hook.
   */
  executeHook(vx, vy) {
    if (!this.active) return { vx, vy };
    this._hooked = true;
    this.active  = false;
    if (this.onHookClose) this.onHookClose();

    // Halve power and scatter angle
    const len     = Math.hypot(vx, vy);
    const ang     = Math.atan2(vy, vx);
    const deflect = (Math.random() - 0.5) * 2 * DEFLECT_RAD;
    const newAng  = ang + deflect;
    const newLen  = len * 0.48;
    return {
      vx: Math.cos(newAng) * newLen,
      vy: Math.sin(newAng) * newLen,
    };
  }

  /**
   * AI decides whether to hook based on difficulty probability.
   * Call this after checkFlickSetup returns a defender.
   */
  aiShouldHook(difficulty) {
    const prob = difficulty === 'hard' ? 0.55 : difficulty === 'easy' ? 0.12 : 0.30;
    return this.active && Math.random() < prob;
  }

  reset() {
    this.active       = false;
    this.hookerTeamId = -1;
    this._timer       = 0;
    this._hooked      = false;
    this._hooker      = null;
  }
}
