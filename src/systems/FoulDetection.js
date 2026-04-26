/**
 * FoulDetection — detects Line-of-Ball crossing fouls and triggers penalty shots.
 *
 * Rule implemented:
 *   After a flick, the LOB vector is active. If an opponent's player moves to
 *   a position that crosses the LOB within a danger threshold, it is a foul.
 *   The fouled team (the one that hit the ball) gets an undefended penalty shot.
 *
 * Design (O(1) per frame after move):
 *   - Foul is only checked at the moment a player commits a MOVE action.
 *   - Point-on-line-segment distance test: cheap, no per-frame looping over
 *     all pairs when the ball is at rest.
 *   - A cooldown prevents repeated foul triggers from a single action.
 */

import { FIELD } from '../utils/constants.js';

// Penalty spot positions — undefended shot from 25-yard equivalent (~14% of field width)
const PENALTY_SPOTS = {
  0: { x: FIELD.width * 0.82, y: FIELD.centerY }, // team A shoots toward right goal
  1: { x: FIELD.width * 0.18, y: FIELD.centerY }, // team B shoots toward left goal
};

export class FoulDetection {
  constructor(ball) {
    this.ball = ball;
    this._cooldown = 0;  // frames

    // Callback fired by Game.js: (fouledTeamId, penaltySpot)
    this.onFoul = null;
  }

  /**
   * Call this immediately after a player's move destination is decided,
   * before startMoveTo is called. O(1).
   *
   * @param {number} movingTeamId  - team of the player who just moved
   * @param {number} destX / destY - where the player is moving to
   * @returns {boolean} true if a foul was called (move should be cancelled)
   */
  checkMove(movingTeamId, destX, destY) {
    if (this._cooldown > 0) return false;
    if (this.ball.lobAlpha < 0.15) return false;  // LOB has faded — no longer active

    const rowTeam = this.ball.rowTeamId;
    if (rowTeam === -1 || movingTeamId === rowTeam) return false; // only opponent can foul

    // LOB: origin = lobX/lobY, direction = lobAngle
    // Check if (destX, destY) is close to the LOB line segment (extending forward only)
    const perpDist = this._perpDistToRay(
      destX, destY,
      this.ball.lobX, this.ball.lobY,
      this.ball.lobAngle
    );

    const FOUL_THRESHOLD = 28; // px — must cross within this distance of the LOB
    if (perpDist < FOUL_THRESHOLD) {
      this._cooldown = 180; // 3-second cooldown
      const fouledTeamId = rowTeam;
      const spot = PENALTY_SPOTS[fouledTeamId] ?? { x: FIELD.centerX, y: FIELD.centerY };
      if (this.onFoul) this.onFoul(fouledTeamId, spot);
      return true;
    }
    return false;
  }

  /**
   * Perpendicular distance from point (px, py) to a ray starting at (ox, oy)
   * going in direction `angle`. Only considers the forward half of the ray.
   * O(1) — pure arithmetic.
   */
  _perpDistToRay(px, py, ox, oy, angle) {
    const dx = px - ox;
    const dy = py - oy;
    // Project onto ray direction (dot product)
    const along = dx * Math.cos(angle) + dy * Math.sin(angle);
    if (along < -60) return Infinity; // behind origin — not relevant
    // Perpendicular component (cross product magnitude)
    return Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle));
  }

  update() {
    if (this._cooldown > 0) this._cooldown--;
  }

  reset() {
    this._cooldown = 0;
  }
}
