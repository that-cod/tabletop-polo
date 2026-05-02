import Matter from 'matter-js';
import { PHYSICS, CATEGORY } from '../utils/constants.js';

const { Bodies, Body } = Matter;

export class Player {
  constructor(physics, { id, teamId, x, y }) {
    this.physics = physics;
    this.id = id;
    this.teamId = teamId;
    this.radius = PHYSICS.playerRadius;
    // Facing angle in radians; team A faces right (0), team B faces left (PI)
    this.facing = teamId === 0 ? 0 : Math.PI;
    // Mallet tip offset angle relative to facing (slightly ahead & to the right)
    this.malletAngleOffset = 0.55;

    this.body = Bodies.circle(x, y, this.radius, {
      restitution: PHYSICS.playerRestitution,
      friction: PHYSICS.playerFriction,
      frictionAir: PHYSICS.playerFrictionAir,
      density: PHYSICS.playerDensity,
      label: `player-${teamId}-${id}`,
      collisionFilter: {
        category: CATEGORY.player,
        mask: CATEGORY.wall | CATEGORY.ball | CATEGORY.player,
      },
    });
    this.body.playerRef = this;
    physics.add(this.body);

    // Move state
    this.moveTarget = null;

    // Stamina (0-1)
    this.stamina    = 1.0;
    this.role       = null; // set by Team
  }

  get x() { return this.body.position.x; }
  get y() { return this.body.position.y; }

  stop() {
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.setAngularVelocity(this.body, 0);
    this.moveTarget = null;
  }

  setPosition(x, y) {
    Body.setPosition(this.body, { x, y });
    this.stop();
  }

  startMoveTo(tx, ty) {
    this.moveTarget = { x: tx, y: ty };
  }

  drainStamina(amount = 0.12) {
    this.stamina = Math.max(0, this.stamina - amount);
  }

  restoreStamina() {
    this.stamina = 1.0;
  }

  /** Move radius multiplier from stamina — 1.0 full, 0.8 when tired */
  staminaMoveMultiplier() {
    return this.stamina < 0.3 ? 0.8 : 1.0;
  }

  /** Flick power multiplier — capped at 0.8 when stamina low */
  staminaPowerMultiplier() {
    return this.stamina < 0.3 ? 0.8 : 1.0;
  }

  update(dt) {
    if (this.moveTarget) {
      const dx = this.moveTarget.x - this.x;
      const dy = this.moveTarget.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 1.2) {
        Body.setVelocity(this.body, { x: 0, y: 0 });
        this.moveTarget = null;
      } else {
        const speed = Math.min(240, d * 6); // ease-out
        const vx = (dx / d) * speed / 60;
        const vy = (dy / d) * speed / 60;
        Body.setVelocity(this.body, { x: vx * 6, y: vy * 6 });
        this.facing = Math.atan2(dy, dx);
      }
    }
  }

  isMoving() {
    if (this.moveTarget) return true;
    const v = this.body.velocity;
    return Math.hypot(v.x, v.y) > 0.15;
  }

  faceTowards(x, y) {
    this.facing = Math.atan2(y - this.y, x - this.x);
  }

  getMalletTip() {
    const a = this.facing + this.malletAngleOffset;
    const r = this.radius + PHYSICS.malletReach;
    return { x: this.x + Math.cos(a) * r, y: this.y + Math.sin(a) * r, angle: a };
  }

  canReachBall(ball) {
    const dx = ball.x - this.x, dy = ball.y - this.y;
    const d = Math.hypot(dx, dy);
    return d <= this.radius + PHYSICS.malletReach + ball.radius + 2;
  }
}
