import { AI, PHYSICS, MOVEMENT, FIELD } from '../utils/constants.js';
import { rand, clamp } from '../utils/math.js';

export class AIOpponent {
  constructor(team, difficulty = 'medium') {
    this.team = team;
    this.difficulty = difficulty; // easy | medium | hard
    this._timer = 0;
    this._thinking = false;
    this.pendingAction = null;
  }

  // Called every frame when it's AI's turn and phase === 'choose'
  update(dt, ctx) {
    // ctx: { ball, turnManager, opponentTeam, applyFlick }
    if (this._thinking) {
      this._timer -= dt * 1000;
      if (this._timer <= 0) {
        this._thinking = false;
        this._execute(ctx);
      }
      return;
    }
    // begin thinking
    this._thinking = true;
    this._timer = AI.reactionMs * (this.difficulty === 'hard' ? 0.7 : this.difficulty === 'easy' ? 1.4 : 1);
  }

  _execute(ctx) {
    const { ball, turnManager, opponentTeam, applyFlick } = ctx;

    // Sort players by distance to ball
    const sorted = [...this.team.players].sort((a, b) =>
      Math.hypot(a.x - ball.x, a.y - ball.y) - Math.hypot(b.x - ball.x, b.y - ball.y)
    );
    const player = sorted[0];
    const goalX = this.team.id === 0 ? FIELD.width + 10 : -10;
    const goalY = FIELD.centerY;
    const canFlick = player.canReachBall(ball);

    if (canFlick) {
      const isLongShot = Math.random() < AI.longShotChance;
      let ang = Math.atan2(goalY - ball.y, goalX - ball.x);
      let powerFrac;

      if (isLongShot) {
        // Aggressive: aim directly at goal, max power, minimal noise
        powerFrac = 0.85 + Math.random() * 0.15;
        ang += rand(-AI.flickNoiseAngle * 0.4, AI.flickNoiseAngle * 0.4);
      } else {
        powerFrac = rand(AI.flickPowerMin, AI.flickPowerMax);
        ang += rand(-AI.flickNoiseAngle, AI.flickNoiseAngle) * (this.difficulty === 'hard' ? 0.5 : 1);
      }

      const targetSpeed = powerFrac * 38;
      player.faceTowards(ball.x, ball.y);
      applyFlick(player, ball, Math.cos(ang) * targetSpeed, Math.sin(ang) * targetSpeed);

      // Also nudge 2nd closest player toward a supporting position
      this._moveSupporter(sorted[1], ball, goalX, goalY);

      turnManager.commitAction();
    } else {
      // Move closest player toward ball
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const d = Math.hypot(dx, dy);
      const step = Math.min(MOVEMENT.moveRadius, Math.max(40, d - PHYSICS.malletReach));
      let tx = player.x + (dx / d) * step;
      let ty = player.y + (dy / d) * step;
      tx += rand(-AI.moveNoise, AI.moveNoise);
      ty += rand(-AI.moveNoise, AI.moveNoise);
      tx = clamp(tx, FIELD.margin + player.radius, FIELD.width - FIELD.margin - player.radius);
      ty = clamp(ty, FIELD.margin + player.radius, FIELD.height - FIELD.margin - player.radius);
      player.faceTowards(ball.x, ball.y);
      player.startMoveTo(tx, ty);

      // Also move 2nd player into a supporting position
      this._moveSupporter(sorted[1], ball, goalX, goalY);

      turnManager.commitAction();
    }
  }

  _moveSupporter(supporter, ball, goalX, goalY) {
    if (!supporter) return;
    // Position 2nd player between ball and goal — slightly offset laterally
    const midX = (ball.x + goalX) / 2;
    const midY = (ball.y + goalY) / 2 + rand(-50, 50);
    const dx = midX - supporter.x;
    const dy = midY - supporter.y;
    const d = Math.hypot(dx, dy);
    if (d < 30) return;
    const step = Math.min(MOVEMENT.moveRadius * 0.7, d);
    let tx = supporter.x + (dx / d) * step;
    let ty = supporter.y + (dy / d) * step;
    tx = clamp(tx, FIELD.margin + supporter.radius, FIELD.width - FIELD.margin - supporter.radius);
    ty = clamp(ty, FIELD.margin + supporter.radius, FIELD.height - FIELD.margin - supporter.radius);
    supporter.startMoveTo(tx, ty);
  }

  resetTurn() { this._thinking = false; this._timer = 0; }
}
