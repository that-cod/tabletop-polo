import { MOVEMENT } from '../utils/constants.js';

export class TurnManager {
  constructor(teamA, teamB) {
    this.teams = [teamA, teamB];
    this.currentTeamId = 0;
    this.phase = 'choose'; // choose | resolving
    this._stopTimer = 0;
    this.onTurnChange = null;
    this.turnCount = 0;
  }

  get currentTeam() { return this.teams[this.currentTeamId]; }
  get opponentTeam() { return this.teams[1 - this.currentTeamId]; }
  isHumanTurn() { return this.currentTeamId === 0; }

  commitAction() {
    this.phase = 'resolving';
    this._stopTimer = 0;
  }

  update(dt, ball) {
    if (this.phase !== 'resolving') return;

    const ballStopped = ball.getSpeed() < MOVEMENT.turnStopSpeed;
    const playersStopped = this.teams[0].allStopped() && this.teams[1].allStopped();

    if (ballStopped && playersStopped) {
      this._stopTimer += dt * 1000;
      if (this._stopTimer >= MOVEMENT.stopHoldMs) {
        ball.stop(); // kill any residual
        this.switchTurn();
      }
    } else {
      this._stopTimer = 0;
    }
  }

  switchTurn() {
    this.currentTeamId = 1 - this.currentTeamId;
    this.phase = 'choose';
    this.turnCount++;
    if (this.onTurnChange) this.onTurnChange(this.currentTeamId);
  }

  reset(startingTeam = 0) {
    this.currentTeamId = startingTeam;
    this.phase = 'choose';
    this._stopTimer = 0;
  }
}
