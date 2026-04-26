import Matter from 'matter-js';
import { PHYSICS, CATEGORY, FIELD } from '../utils/constants.js';

const { Bodies, Body } = Matter;

export class Ball {
  constructor(physics, x = FIELD.centerX, y = FIELD.centerY) {
    this.physics = physics;
    this.radius = PHYSICS.ballRadius;
    this.body = Bodies.circle(x, y, this.radius, {
      restitution: PHYSICS.ballRestitution,
      friction: PHYSICS.ballFriction,
      frictionAir: PHYSICS.ballFrictionAir,
      density: PHYSICS.ballDensity,
      label: 'ball',
      collisionFilter: {
        category: CATEGORY.ball,
        mask: CATEGORY.wall | CATEGORY.player | CATEGORY.goal,
      },
    });
    physics.add(this.body);
    this.trail = [];
    // Line of Ball tracking
    this.lobAngle = 0;   // radians — direction of last hit
    this.lobAlpha = 0;   // 0-1, fades after hit
    this.lobX = FIELD.centerX;
    this.lobY = FIELD.centerY;
  }

  get x() { return this.body.position.x; }
  get y() { return this.body.position.y; }

  getVelocity() { return this.body.velocity; }
  getSpeed() {
    const v = this.body.velocity;
    return Math.hypot(v.x, v.y);
  }

  setVelocity(vx, vy) { Body.setVelocity(this.body, { x: vx, y: vy }); }

  applyImpulse(ix, iy) {
    Body.setVelocity(this.body, { x: ix, y: iy });
    // Record LOB at moment of hit
    if (Math.hypot(ix, iy) > 0.5) {
      this.lobAngle = Math.atan2(iy, ix);
      this.lobAlpha = 1.0;
      this.lobX = this.x;
      this.lobY = this.y;
    }
  }

  stop() {
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.setAngularVelocity(this.body, 0);
  }

  reset(x = FIELD.centerX, y = FIELD.centerY) {
    this.stop();
    Body.setPosition(this.body, { x, y });
    Body.setAngle(this.body, 0);
    this.trail.length = 0;
    this.lobAlpha = 0;
  }

  updateTrail() {
    if (this.getSpeed() > 0.5) {
      this.trail.push({ x: this.x, y: this.y, a: 1 });
      if (this.trail.length > 14) this.trail.shift();
    }
    for (const t of this.trail) t.a *= 0.9;
    // Fade LOB line over ~3 seconds (60fps → ~0.006/frame)
    if (this.lobAlpha > 0) this.lobAlpha = Math.max(0, this.lobAlpha - 0.006);
  }
}
