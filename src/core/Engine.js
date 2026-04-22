import Matter from 'matter-js';
import { FIELD, PHYSICS, CATEGORY } from '../utils/constants.js';

const { Engine, World, Bodies, Body, Events, Composite } = Matter;

export class PhysicsEngine {
  constructor() {
    this.engine = Engine.create({ gravity: { x: 0, y: 0 } });
    this.world = this.engine.world;
    this.world.gravity.scale = 0;

    this.walls = [];
    this.goals = { left: null, right: null };

    this._buildBoundaries();
  }

  _buildBoundaries() {
    const { width: W, height: H, goalWidth, goalDepth } = FIELD;
    const t = 40; // wall thickness (outside the field)

    const wallOpts = {
      isStatic: true,
      restitution: PHYSICS.wallRestitution,
      friction: 0.1,
      collisionFilter: { category: CATEGORY.wall, mask: CATEGORY.ball | CATEGORY.player },
      label: 'wall',
    };

    // Top & bottom full-length walls
    const top    = Bodies.rectangle(W / 2, -t / 2, W, t, wallOpts);
    const bottom = Bodies.rectangle(W / 2, H + t / 2, W, t, wallOpts);

    // Left & right walls split around goal openings (centered vertically)
    const openTop = H / 2 - goalWidth / 2;
    const openBot = H / 2 + goalWidth / 2;

    const leftTop    = Bodies.rectangle(-t / 2, openTop / 2, t, openTop, wallOpts);
    const leftBot    = Bodies.rectangle(-t / 2, (H + openBot) / 2, t, H - openBot, wallOpts);
    const rightTop   = Bodies.rectangle(W + t / 2, openTop / 2, t, openTop, wallOpts);
    const rightBot   = Bodies.rectangle(W + t / 2, (H + openBot) / 2, t, H - openBot, wallOpts);

    // Back walls behind goal openings to bounce balls if they miss net
    const backLeft   = Bodies.rectangle(-goalDepth - t / 2, H / 2, t, goalWidth + 8, wallOpts);
    const backRight  = Bodies.rectangle(W + goalDepth + t / 2, H / 2, t, goalWidth + 8, wallOpts);

    // Goal sensors (score when ball enters)
    const goalOpts = {
      isStatic: true,
      isSensor: true,
      collisionFilter: { category: CATEGORY.goal, mask: CATEGORY.ball },
    };
    this.goals.left  = Bodies.rectangle(-goalDepth / 2, H / 2, goalDepth, goalWidth, { ...goalOpts, label: 'goal-left' });
    this.goals.right = Bodies.rectangle(W + goalDepth / 2, H / 2, goalDepth, goalWidth, { ...goalOpts, label: 'goal-right' });

    this.walls = [top, bottom, leftTop, leftBot, rightTop, rightBot, backLeft, backRight];
    World.add(this.world, [...this.walls, this.goals.left, this.goals.right]);
  }

  add(body)    { World.add(this.world, body); }
  remove(body) { World.remove(this.world, body); }

  update(dt) {
    // Matter expects milliseconds; clamp to avoid tunneling
    const ms = Math.min(33, dt * 1000);
    Engine.update(this.engine, ms);
  }

  on(evt, fn)  { Events.on(this.engine, evt, fn); }
  off(evt, fn) { Events.off(this.engine, evt, fn); }

  clearDynamic() {
    const all = Composite.allBodies(this.world);
    for (const b of all) {
      if (!b.isStatic) World.remove(this.world, b);
    }
  }
}
