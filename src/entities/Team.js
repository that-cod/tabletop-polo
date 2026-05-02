import { Player } from './Player.js';
import { FIELD } from '../utils/constants.js';

const FORMATION = [
  { xFrac: 0.68, yFrac: 0.35, role: 'attacker'   },  // #1 — up front
  { xFrac: 0.55, yFrac: 0.62, role: 'allrounder'  },  // #2 — midfield
  { xFrac: 0.42, yFrac: 0.38, role: 'playmaker'   },  // #3 — midfield back
  { xFrac: 0.25, yFrac: 0.55, role: 'defender'    },  // #4 — back
];

export class Team {
  /**
   * @param {object} physics
   * @param {number} teamId
   * @param {object} [fieldCfg]       - Override field dimensions (Arena mode)
   * @param {number} [playersPerTeam] - 3 for arena, 4 for field polo
   */
  constructor(physics, teamId, fieldCfg = null, playersPerTeam = 4) {
    this.id = teamId;
    this.players = [];
    this.score = 0;
    this.attackDir = teamId === 0 ? 1 : -1;
    this._field = fieldCfg || FIELD;
    this._playersPerTeam = playersPerTeam;
    this._spawn(physics);
  }

  _spawnPositions() {
    const formation = FORMATION.slice(0, this._playersPerTeam);
    return formation.map((f) => {
      const rawX = this._field.width * (this.id === 0 ? f.xFrac : 1 - f.xFrac);
      const rawY = this._field.height * f.yFrac;
      return { x: rawX, y: rawY, role: f.role };
    });
  }

  _spawn(physics) {
    const positions = this._spawnPositions();
    positions.forEach((pos, i) => {
      const p = new Player(physics, { id: i, teamId: this.id, x: pos.x, y: pos.y });
      p.role = pos.role;
      this.players.push(p);
    });
  }

  reset() {
    const positions = this._spawnPositions();
    this.players.forEach((p, i) => {
      p.setPosition(positions[i].x, positions[i].y);
      p.facing = this.attackDir > 0 ? 0 : Math.PI;
    });
  }

  flipEnds() {
    this.attackDir *= -1;
    this.players.forEach((p) => {
      const newX = this._field.width - p.x;
      p.setPosition(newX, p.y);
      p.facing = this.attackDir > 0 ? 0 : Math.PI;
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
