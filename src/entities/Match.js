import { MATCH } from '../utils/constants.js';

export class Match {
  constructor(teamA, teamB) {
    this.teamA = teamA;
    this.teamB = teamB;
    this.chukka = 1;
    this.maxChukkas = MATCH.chukkas;
    this.timeLeft = MATCH.chukkaSeconds;
    this.running = false;
    this.ended = false;
    this.isOvertime = false;

    this.onChukkaEnd = null;
    this.onMatchEnd  = null;
    this.onOvertime  = null;
    this.onHalftime  = null;
    this.onShootout  = null; // fired when overtime ends still tied
    this.onGoal      = null;
  }

  start() { this.running = true; }
  pause() { this.running = false; }
  resume() { this.running = false || (this.running = true); }

  scoreGoal(teamId) {
    if (teamId === 0) this.teamA.score++; else this.teamB.score++;
    if (this.onGoal) this.onGoal(teamId);
  }

  update(dt) {
    if (!this.running || this.ended) return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) this._endChukka();
  }

  _endChukka() {
    this.timeLeft = 0;
    if (this.isOvertime) {
      // Overtime clock ran out — if still tied, trigger penalty shootout
      if (this.winner() === -1 && this.onShootout) {
        this.running = false;
        this.onShootout();
      } else {
        this.ended = true;
        this.running = false;
        if (this.onMatchEnd) this.onMatchEnd(this.winner());
      }
      return;
    }
    if (this.chukka >= this.maxChukkas) {
      if (this.winner() === -1) {
        // Tied — start golden chukka (sudden death)
        this.isOvertime = true;
        this.timeLeft = MATCH.overtimeSeconds;
        if (this.onOvertime) this.onOvertime();
      } else {
        this.ended = true;
        this.running = false;
        if (this.onMatchEnd) this.onMatchEnd(this.winner());
      }
    } else {
      this.chukka++;
      this.timeLeft = MATCH.chukkaSeconds;
      // Halftime fires after chukka 2 completes (before chukka 3 starts)
      const isHalftime = this.chukka === Math.floor(this.maxChukkas / 2) + 1;
      if (isHalftime && this.onHalftime) {
        this.running = false; // pause until Game resumes after halftime screen
        this.onHalftime();
      } else {
        if (this.onChukkaEnd) this.onChukkaEnd(this.chukka);
      }
    }
  }

  winner() {
    if (this.teamA.score > this.teamB.score) return 0;
    if (this.teamB.score > this.teamA.score) return 1;
    return -1; // tie
  }

  timeString() {
    const t = Math.max(0, Math.ceil(this.timeLeft));
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
