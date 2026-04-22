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

    this.onChukkaEnd = null;
    this.onMatchEnd = null;
    this.onGoal = null;
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
    if (this.chukka >= this.maxChukkas) {
      this.ended = true;
      this.running = false;
      if (this.onMatchEnd) this.onMatchEnd(this.winner());
    } else {
      this.chukka++;
      this.timeLeft = MATCH.chukkaSeconds;
      if (this.onChukkaEnd) this.onChukkaEnd(this.chukka);
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
