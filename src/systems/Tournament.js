/**
 * Tournament — 3 escalating matches, persistent score, trophy screen.
 *
 * Structure:
 *   Match 1: Easy AI,   0-goal handicap
 *   Match 2: Medium AI, AI gets +1 goal head-start
 *   Match 3: Hard AI,   AI gets +2 goal head-start
 *
 * State:
 *   idle → match1 → match2 → match3 → done
 *
 * The Tournament object tracks wins/losses and aggregated goals.
 * Game.js drives it by calling tournament.advance(result) after each match.
 */

export const TOURNAMENT_ROUNDS = [
  { matchNum: 1, difficulty: 'easy',   aiHeadStart: 0, label: 'QUALIFIER',   desc: 'Easy AI — level start' },
  { matchNum: 2, difficulty: 'medium', aiHeadStart: 1, label: 'SEMI-FINAL',  desc: 'Medium AI — AI +1 goal' },
  { matchNum: 3, difficulty: 'hard',   aiHeadStart: 2, label: 'GRAND FINAL', desc: 'Hard AI — AI +2 goals' },
];

export class Tournament {
  constructor() {
    this.reset();
  }

  reset() {
    this.active       = false;
    this.roundIndex   = 0;     // 0-based index into TOURNAMENT_ROUNDS
    this.results      = [];    // [{ won, scoreA, scoreB }, ...]
    this.totalGoalsA  = 0;
    this.totalGoalsB  = 0;

    this.onRoundStart = null; // (round) — called when a new match should begin
    this.onDone       = null; // (won, results) — called when tournament ends
  }

  start() {
    this.active     = true;
    this.roundIndex = 0;
    this.results    = [];
    this.totalGoalsA = this.totalGoalsB = 0;
    this._fireRoundStart();
  }

  /** Call after each match completes. */
  advance(scoreA, scoreB) {
    if (!this.active) return;
    const won = scoreA > scoreB;
    this.results.push({ won, scoreA, scoreB });
    this.totalGoalsA += scoreA;
    this.totalGoalsB += scoreB;

    this.roundIndex++;
    if (this.roundIndex >= TOURNAMENT_ROUNDS.length) {
      this.active = false;
      const overallWon = this.results.filter(r => r.won).length >= 2; // best of 3
      if (this.onDone) this.onDone(overallWon, this.results);
    } else {
      this._fireRoundStart();
    }
  }

  currentRound() {
    return TOURNAMENT_ROUNDS[Math.min(this.roundIndex, TOURNAMENT_ROUNDS.length - 1)];
  }

  /** Human-readable progress string, e.g. "● ● ○" */
  progressDisplay() {
    return TOURNAMENT_ROUNDS.map((_, i) => {
      if (i >= this.results.length) return '○';
      return this.results[i].won ? '🏅' : '✗';
    }).join('  ');
  }

  _fireRoundStart() {
    const round = TOURNAMENT_ROUNDS[this.roundIndex];
    if (this.onRoundStart) this.onRoundStart(round);
  }
}
