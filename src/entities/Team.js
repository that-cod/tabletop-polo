import { Player } from './Player.js';
import { FIELD, MATCH } from '../utils/constants.js';

export class Team {
  constructor(physics, teamId) {
    this.id = teamId;
    this.players = [];
    this.score = 0;
    this._spawn(physics);
  }

  _spawn(physics) {
    const n = MATCH.playersPerTeam;
    const xBase = this.id === 0 ? FIELD.width * 0.28 : FIELD.width * 0.72;
    const spread = FIELD.height * 0.55;
    const top = FIELD.centerY - spread / 2;
    for (let i = 0; i < n; i++) {
      const y = top + (spread * (i + 1)) / (n + 1);
      // Stagger X a bit so they don't form a straight line
      const x = xBase + (i % 2 === 0 ? -18 : 18);
      this.players.push(new Player(physics, { id: i, teamId: this.id, x, y }));
    }
  }

  reset() {
    const n = MATCH.playersPerTeam;
    const xBase = this.id === 0 ? FIELD.width * 0.28 : FIELD.width * 0.72;
    const spread = FIELD.height * 0.55;
    const top = FIELD.centerY - spread / 2;
    this.players.forEach((p, i) => {
      const y = top + (spread * (i + 1)) / (n + 1);
      const x = xBase + (i % 2 === 0 ? -18 : 18);
      p.setPosition(x, y);
      p.facing = this.id === 0 ? 0 : Math.PI;
    });
  }

  update(dt) { for (const p of this.players) p.update(dt); }

  getPlayer(id) { return this.players[id]; }

  closestToBall(ball) {
    let best = null, bestD = Infinity;
    for (const p of this.players) {
      const d = Math.hypot(p.x - ball.x, p.y - ball.y);
      if (d < bestD) { best = p; bestD = d; }
    }
    return best;
  }

  allStopped() {
    return this.players.every(p => !p.isMoving());
  }
}
