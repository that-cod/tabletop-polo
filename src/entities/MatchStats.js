/**
 * MatchStats — collects per-match statistics for post-game display.
 *
 * Tracked:
 *  - flicksA / flicksB        — total flicks per team
 *  - longestShot              — max distance from player to ball when flicked (px)
 *  - foulsA / foulsB          — fouls committed per team
 *  - goalsPerChukka[0..3][0,1] — goals scored per chukka per team
 *  - possessionFrames[0,1]    — frames ball was in each team's half (O(1)/frame)
 *
 * All counters are plain integers — O(1) for every record call.
 */

import { FIELD, MATCH } from '../utils/constants.js';

export class MatchStats {
  constructor() {
    this.reset();
  }

  reset() {
    this.flicksA         = 0;
    this.flicksB         = 0;
    this.longestShot     = 0;   // px
    this.foulsA          = 0;
    this.foulsB          = 0;
    this.possessionA     = 0;   // frames ball in left half
    this.possessionB     = 0;   // frames ball in right half
    // goalsPerChukka[chukkaIndex][teamId]
    this.goalsPerChukka  = Array.from({ length: MATCH.chukkas + 1 }, () => [0, 0]);
    this._currentChukka  = 1;
  }

  setChukka(n) { this._currentChukka = n; }

  recordFlick(teamId, playerX, playerY, ballX, ballY) {
    if (teamId === 0) this.flicksA++; else this.flicksB++;
    const d = Math.hypot(playerX - ballX, playerY - ballY);
    if (d > this.longestShot) this.longestShot = d;
  }

  recordGoal(teamId) {
    const idx = Math.min(this._currentChukka - 1, this.goalsPerChukka.length - 1);
    this.goalsPerChukka[idx][teamId]++;
  }

  recordFoul(teamId) {
    if (teamId === 0) this.foulsA++; else this.foulsB++;
  }

  /** Call once per frame with current ball X position. O(1). */
  tickPossession(ballX) {
    if (ballX < FIELD.width / 2) this.possessionA++;
    else                         this.possessionB++;
  }

  /** Returns a plain object consumed by Menus._statsHtml. */
  summary() {
    return {
      flicksA:     this.flicksA,
      flicksB:     this.flicksB,
      longestShot: this.longestShot,
      foulsA:      this.foulsA,
      foulsB:      this.foulsB,
      possessionA: this.possessionA,
      possessionB: this.possessionB,
      goalsPerChukka: this.goalsPerChukka.map(c => [...c]),
    };
  }
}
