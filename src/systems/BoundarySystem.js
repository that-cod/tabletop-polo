/**
 * BoundarySystem — tracks last-touch team and handles out-of-bounds.
 *
 * Real polo rules replicated:
 *  - Ball over SIDELINE      → free restart at exit point, current-turn team keeps ball
 *  - Attacking team hits ball over BACKLINE (misses goal) → defending team free restart from goal mouth
 *  - Defending team clears ball over own BACKLINE          → attacking team penalty spot (60-yard line equiv)
 *
 * Keeps GoalDetection untouched — goal sensor events fire first via Matter.js
 * collision; this system only fires when ball exits the field boundary walls.
 */

import Matter from 'matter-js';
import { FIELD } from '../utils/constants.js';

const { Events, Body } = Matter;

// Penalty spot X positions (60-yard equivalent scaled to our 960px field)
const PENALTY_X = {
  left:  FIELD.width * 0.1875,  // attacking team shoots from left side
  right: FIELD.width * 0.8125,  // attacking team shoots from right side
};

export class BoundarySystem {
  constructor(physics, ball) {
    this.physics = physics;
    this.ball    = ball;

    // -1 = no one, 0 = teamA, 1 = teamB
    this.lastTouchTeam = -1;

    // Callbacks wired by Game.js
    this.onSidelineOut  = null; // (exitX, exitY, restartTeamId)
    this.onBacklineOut  = null; // (restartTeamId, penaltyX, penaltyY)

    this._cooldown = 0;

    // Track last-touch on every collision between ball and player
    Events.on(physics.engine, 'collisionStart', (ev) => {
      for (const pair of ev.pairs) {
        const a = pair.bodyA, b = pair.bodyB;
        const ballBody = a.label === 'ball' ? a : b.label === 'ball' ? b : null;
        if (!ballBody) continue;
        const other = ballBody === a ? b : a;
        // Label format: 'player-{teamId}-{id}'
        if (other.label && other.label.startsWith('player-')) {
          this.lastTouchTeam = parseInt(other.label.split('-')[1], 10);
        }
      }
    });
  }

  /**
   * Call every frame from Game._update(). Checks whether the ball has
   * escaped the field boundary and fires the appropriate callback.
   *
   * O(1) — just two comparisons per frame.
   */
  update() {
    if (this._cooldown > 0) { this._cooldown--; return; }

    const { x, y } = this.ball;
    const r = this.ball.radius;
    const { width: W, height: H, goalWidth } = FIELD;
    const goalTop    = H / 2 - goalWidth / 2;
    const goalBottom = H / 2 + goalWidth / 2;

    // ── SIDELINE (top / bottom) ───────────────────────────────────────────
    if (y - r < 0 || y + r > H) {
      this._trigger();
      const exitX = Math.max(r, Math.min(W - r, x));
      const exitY = y - r < 0 ? r + 4 : H - r - 4;
      // The team that last touched gives the restart to the opponent
      const restartTeam = this.lastTouchTeam === -1 ? 0 : 1 - this.lastTouchTeam;
      if (this.onSidelineOut) this.onSidelineOut(exitX, exitY, restartTeam);
      return;
    }

    // ── BACKLINE (left / right) — only outside goal opening ─────────────
    const outLeft  = x - r < 0   && (y < goalTop || y > goalBottom);
    const outRight = x + r > W   && (y < goalTop || y > goalBottom);

    if (outLeft || outRight) {
      this._trigger();
      const isLeft = outLeft;
      // Determine if the team that hit it was attacking toward this backline
      // Team attackDir: +1 = attacking right, -1 = attacking left
      // A team is "attacking" toward a backline if their attackDir matches the side
      const lastTeam = this.lastTouchTeam;

      let restartTeamId, penaltyX;

      if (lastTeam === -1) {
        // No known touch — give ball to left-side team
        restartTeamId = isLeft ? 1 : 0;
        penaltyX = isLeft ? FIELD.width * 0.22 : FIELD.width * 0.78;
      } else {
        // Was the last-touching team attacking toward this backline?
        // We determine this by checking whose goal is on that side.
        // Left goal defended by team A (id 0), right goal defended by team B (id 1)
        const defendingTeam = isLeft ? 0 : 1;
        const attackingTeam = 1 - defendingTeam;

        if (lastTeam === attackingTeam) {
          // Attacking team put it out — defending team gets free kick from goal mouth
          restartTeamId = defendingTeam;
          penaltyX = isLeft ? FIELD.width * 0.12 : FIELD.width * 0.88;
        } else {
          // Defending team cleared it out — attacking team gets 60-yard penalty shot
          restartTeamId = attackingTeam;
          penaltyX = isLeft ? PENALTY_X.right : PENALTY_X.left;
        }
      }

      const penaltyY = FIELD.centerY;
      if (this.onBacklineOut) this.onBacklineOut(restartTeamId, penaltyX, penaltyY);
    }
  }

  _trigger() {
    this._cooldown = 90; // ~1.5s cooldown to avoid re-firing
  }

  reset() {
    this.lastTouchTeam = -1;
    this._cooldown     = 0;
  }
}
