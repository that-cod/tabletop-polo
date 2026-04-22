import Matter from 'matter-js';
const { Events } = Matter;

export class GoalDetection {
  constructor(physics, ball) {
    this.physics = physics;
    this.ball = ball;
    this.onGoal = null;
    this._cooldown = 0;

    physics.on('collisionStart', (ev) => {
      if (this._cooldown > 0) return;
      for (const pair of ev.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (!labels.includes('ball')) continue;
        if (labels.includes('goal-left')) {
          // Team B scored on left goal (team A defends left)
          this._score(1);
        } else if (labels.includes('goal-right')) {
          this._score(0);
        }
      }
    });
  }

  _score(scoringTeamId) {
    this._cooldown = 60; // frames
    if (this.onGoal) this.onGoal(scoringTeamId);
  }

  update() {
    if (this._cooldown > 0) this._cooldown--;
  }
}
