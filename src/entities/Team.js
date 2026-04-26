import { Player } from './Player.js';
import { FIELD } from '../utils/constants.js';

// Role-based formation offsets [xFrac from own half, yFrac of field height]
// xFrac: 0 = own goal line, 1 = opp goal line (mirrored for team B)
// Roles: 0=Attacker(#1), 1=All-rounder(#2), 2=Playmaker(#3), 3=Defender(#4)
const FORMATION = [
  { xFrac: 0.68, yFrac: 0.35, role: 'attacker'   },  // #1 — up front
  { xFrac: 0.55, yFrac: 0.62, role: 'allrounder'  },  // #2 — midfield
  { xFrac: 0.42, yFrac: 0.38, role: 'playmaker'   },  // #3 — midfield back
  { xFrac: 0.25, yFrac: 0.55, role: 'defender'    },  // #4 — back
];

export class Team {
  constructor(physics, teamId) {
    this.id = teamId;
    this.players = [];
    this.score = 0;
    this.attackDir = teamId === 0 ? 1 : -1; // +1 = attack right, -1 = attack left
    this._spawn(physics);
  }

  _spawnPositions() {
    // For team A (attackDir=+1): x increases toward opponent goal (right)
    // For team B (attackDir=-1): mirror x
    return FORMATION.map((f) => {
      const rawX = FIELD.width * (this.id === 0 ? f.xFrac : 1 - f.xFrac);
      const rawY = FIELD.height * f.yFrac;
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

  // Flip all player X positions and reverse attack direction (called after every goal)
  flipEnds() {
    this.attackDir *= -1;
    this.players.forEach((p) => {
      const newX = FIELD.width - p.x;
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
