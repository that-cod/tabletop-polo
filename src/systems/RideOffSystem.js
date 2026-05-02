/**
 * RideOffSystem — shoulder-to-shoulder legal body contact.
 *
 * Real polo rule: A player can lean into an opponent shoulder-to-shoulder
 * to push them off the line, provided the angle of contact is ≤45°.
 * Too aggressive (>45°) = dangerous riding = foul.
 *
 * Implementation (O(n) called once per move commit):
 *  - After a player completes their move, scan all opponents within
 *    rideOffRadius of the destination.
 *  - If any are found: apply a lateral physics impulse pushing them away.
 *  - If the approach angle between mover and opponent > FOUL_ANGLE → it's a foul.
 *  - Visual: flash a ring around the contacted player.
 */

import Matter from 'matter-js';
import { PHYSICS } from '../utils/constants.js';

const { Body } = Matter;

const RIDE_OFF_RADIUS = PHYSICS.playerRadius * 3.2; // px — contact distance
const FOUL_ANGLE      = Math.PI / 4;                // 45° in radians
const IMPULSE_BASE    = 3.5;                         // push magnitude

export class RideOffSystem {
  constructor() {
    // Flash effect state
    this.flashes = []; // [{ player, alpha, x, y }]

    // Callbacks
    this.onRideOff = null; // (pushedPlayer) — for commentary
    this.onFoul    = null; // (foulTeamId)   — dangerous riding foul
  }

  /**
   * Call when a player has just started moving toward (destX, destY).
   * Checks all opponents for ride-off contact. O(n) over opponent players.
   *
   * @param {Player}   mover        - player who is moving
   * @param {number}   destX/destY  - their destination
   * @param {Player[]} opponents    - array of opponent players
   * @returns {boolean} true if a dangerous foul was called (move should be cancelled by caller)
   */
  check(mover, destX, destY, opponents) {
    for (const opp of opponents) {
      const dx = opp.x - destX;
      const dy = opp.y - destY;
      const d  = Math.hypot(dx, dy);

      if (d > RIDE_OFF_RADIUS) continue;

      // Angle of approach: angle between mover's direction and vector to opponent
      const approachAngle = Math.atan2(destY - mover.y, destX - mover.x);
      const toOppAngle    = Math.atan2(dy, dx);
      const angleDiff     = Math.abs(this._angleDiff(approachAngle, toOppAngle));

      if (angleDiff > FOUL_ANGLE) {
        // Dangerous riding — foul
        if (this.onFoul) this.onFoul(mover.teamId);
        return true; // cancel move
      }

      // Legal ride-off: push opponent laterally
      const normX = d > 0 ? dx / d : 0;
      const normY = d > 0 ? dy / d : 0;
      // Lateral push = perpendicular to approach direction
      const pushX = -normY * IMPULSE_BASE * (1 - d / RIDE_OFF_RADIUS);
      const pushY =  normX * IMPULSE_BASE * (1 - d / RIDE_OFF_RADIUS);
      Body.setVelocity(opp.body, {
        x: opp.body.velocity.x + pushX,
        y: opp.body.velocity.y + pushY,
      });

      // Register flash effect
      this.flashes.push({ player: opp, alpha: 1.0 });

      if (this.onRideOff) this.onRideOff(opp);
    }
    return false;
  }

  /** Call every frame to tick down flash effects. */
  update() {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      this.flashes[i].alpha -= 0.05;
      if (this.flashes[i].alpha <= 0) this.flashes.splice(i, 1);
    }
  }

  reset() { this.flashes.length = 0; }

  /** Signed difference between two angles, clamped to [-PI, PI]. */
  _angleDiff(a, b) {
    let d = b - a;
    while (d > Math.PI)  d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }
}
