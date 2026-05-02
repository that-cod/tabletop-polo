/**
 * PenaltyShootout — 3-round alternating penalty tiebreaker.
 *
 * Rules implemented:
 *  - 3 rounds, teams alternate: RED shoots then BLUE shoots per round
 *  - After 3 rounds if still tied → sudden death from round 4+
 *  - Each shot: ball placed at 15-yard spot (~90px from goal line)
 *  - Human team flicks normally; AI auto-executes with slight noise
 *  - Shootout ends as soon as one team can no longer be caught
 *
 * State machine:  idle → intro → shooting → roundEnd → done
 */

import { FIELD } from '../utils/constants.js';

const SHOT_SPOT_DIST = 90; // px from goal line — ~15 yards scaled

export class PenaltyShootout {
  constructor() {
    this.reset();
  }

  reset() {
    this.active       = false;
    this.round        = 1;       // current round (1-based)
    this.maxRounds    = 3;
    this.shooterTeam  = 0;       // 0 = RED shoots next, 1 = BLUE
    this.scores       = [0, 0];  // [teamA, teamB] shootout goals
    this.shotsThisRound = 0;     // 0 or 1 per round per team
    this.phase        = 'idle';  // idle | awaiting_shot | done

    // Callbacks set by Game.js
    this.onShotReady  = null; // (shootingTeamId, spotX, spotY) — place ball, give control
    this.onDone       = null; // (winnerTeamId)  — -1 for impossible tie
  }

  /** Start the shootout. Call after overtime ends tied. */
  start() {
    this.active      = true;
    this.round       = 1;
    this.shotsThisRound = 0;
    this.shooterTeam = 0;
    this.scores      = [0, 0];
    this.phase       = 'awaiting_shot';
    this._fireNextShot();
  }

  /** Call after each shot resolves (ball stops or goal scored). */
  recordShot(scored) {
    if (!this.active) return;
    if (scored) this.scores[this.shooterTeam]++;

    this.shotsThisRound++;

    if (this.shooterTeam === 0) {
      // RED just shot → BLUE shoots next in this round
      this.shooterTeam = 1;
      this._fireNextShot();
    } else {
      // Both teams shot this round
      this.shooterTeam = 0;
      if (this._canDecide()) {
        this._finish();
        return;
      }
      this.round++;
      this.shotsThisRound = 0;
      if (this.round > this.maxRounds) {
        // Sudden death: keep going one shot at a time
        this._fireNextShot();
      } else {
        this._fireNextShot();
      }
    }
  }

  /** Returns current score display string, e.g. "●●○  ○●○" */
  scoreDisplay() {
    const sym = (t, r) => {
      if (r > this.round) return '○';
      if (r === this.round) return this.shooterTeam === t ? '▸' : '?';
      return '●'; // simplification — just show filled
    };
    const rounds = Math.max(this.maxRounds, this.round);
    const a = Array.from({ length: rounds }, (_, i) => sym(0, i + 1)).join('');
    const b = Array.from({ length: rounds }, (_, i) => sym(1, i + 1)).join('');
    return `🔴 ${a}   🔵 ${b}`;
  }

  _fireNextShot() {
    const isLeft = this.shooterTeam === 0; // RED attacks right goal
    // RED always attacks right goal (x = width), BLUE attacks left goal (x = 0)
    const spotX = isLeft
      ? FIELD.width - SHOT_SPOT_DIST
      : SHOT_SPOT_DIST;
    const spotY = FIELD.centerY;
    if (this.onShotReady) this.onShotReady(this.shooterTeam, spotX, spotY);
  }

  /** Can we determine a winner already (one team impossible to catch)? */
  _canDecide() {
    const [a, b] = this.scores;
    const shotsLeft = (this.maxRounds - this.round) * 2;
    if (a > b + shotsLeft) return true;
    if (b > a + shotsLeft) return true;
    if (this.round >= this.maxRounds && a !== b) return true;
    return false;
  }

  _finish() {
    this.active = false;
    this.phase  = 'done';
    const winner = this.scores[0] > this.scores[1] ? 0
                 : this.scores[1] > this.scores[0] ? 1
                 : -1;
    if (this.onDone) this.onDone(winner);
  }
}
