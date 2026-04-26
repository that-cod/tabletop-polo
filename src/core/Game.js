import { PhysicsEngine } from './Engine.js';
import { Renderer } from './Renderer.js';
import { Ball } from '../entities/Ball.js';
import { Team } from '../entities/Team.js';
import { Match } from '../entities/Match.js';
import { InputManager } from '../input/InputManager.js';
import { TurnManager } from '../systems/TurnManager.js';
import { GoalDetection } from '../systems/GoalDetection.js';
import { AIOpponent } from '../ai/AIOpponent.js';
import { HUD } from '../ui/HUD.js';
import { Menus } from '../ui/Menus.js';
import { Sounds } from '../audio/Sounds.js';
import { FIELD, MOVEMENT, PHYSICS, MATCH } from '../utils/constants.js';
import { dist, clamp } from '../utils/math.js';

const SCENE = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', GOAL: 'goal', OVER: 'over' };

export class Game {
  constructor(canvas, overlayEl) {
    this.canvas = canvas;
    this.scene = SCENE.MENU;

    this.physics = new PhysicsEngine();
    this.renderer = new Renderer(canvas);
    this.hud = new HUD(canvas);
    this.menus = new Menus(overlayEl);
    this.sounds = new Sounds();
    this.input = new InputManager(canvas);

    this.ball = new Ball(this.physics);
    this.teamA = new Team(this.physics, 0);
    this.teamB = new Team(this.physics, 1);
    this.match = new Match(this.teamA, this.teamB);
    this.turnManager = new TurnManager(this.teamA, this.teamB);
    this.goalDetector = new GoalDetection(this.physics, this.ball);
    this.ai = new AIOpponent(this.teamB, 'medium');

    // Interaction state (human)
    this.selectedPlayer = null;
    this.flickMode = false;       // actively dragging to flick
    this.dragStart = null;
    this.dragEnd = null;
    this.hoverPos = { x: 0, y: 0 };

    this._wireEvents();

    this._lastTime = performance.now();
    this._running = false;
  }

  _wireEvents() {
    this.input.on('mousemove', (p) => {
      this.hoverPos = { ...p };
      if (this.flickMode && this.dragStart) this.dragEnd = { ...p };
    });
    this.input.on('mousedown', (p) => this._onMouseDown(p));
    this.input.on('mouseup',   (p) => this._onMouseUp(p));

    this.goalDetector.onGoal = (scoringTeamId) => this._onGoal(scoringTeamId);

    this.match.onChukkaEnd = (n) => {
      this.sounds.whistle();
      this.hud.showAnnouncement(`CHUKKA ${n}`);
      const scoreA = this.teamA.score, scoreB = this.teamB.score;
      const lead = scoreA > scoreB ? `RED leads ${scoreA}-${scoreB}`
                 : scoreB > scoreA ? `BLUE leads ${scoreB}-${scoreA}`
                 : `Level at ${scoreA}-${scoreB}`;
      const isLast = n === this.match.maxChukkas;
      this.renderer.showCommentary(
        isLast ? `Final chukka! ${lead} — everything to play for!`
               : `Chukka ${n} begins. ${lead}.`
      );
      this._resetPositions();
      // Reset attackDir to default at chukka start
      this.teamA.attackDir = 1;
      this.teamB.attackDir = -1;
      this.turnManager.reset(0);
    };
    this.match.onMatchEnd  = (winner) => this._onMatchEnd(winner);
    this.match.onOvertime   = ()       => this._onOvertime();

    this.turnManager.onTurnChange = (teamId) => {
      this.selectedPlayer = null;
      this.flickMode = false;
      this.dragStart = this.dragEnd = null;
      if (teamId === 1) this.ai.resetTurn();
    };

    // Keyboard: P pauses
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.scene === SCENE.PLAYING) this._pause();
        else if (this.scene === SCENE.PAUSED) this._resume();
      }
    });
  }

  start() {
    this.menus.showStart((diff) => this._startMatch(diff));
    this._running = true;
    requestAnimationFrame((t) => this._loop(t));
  }

  _startMatch(difficulty = 'medium') {
    this.ai.difficulty = difficulty;
    this._resetMatch();
    this.match.start();
    this.scene = SCENE.PLAYING;
    this.sounds.whistle();
    this.hud.showAnnouncement(difficulty === 'easy' ? 'EASY' : difficulty === 'hard' ? 'HARD MODE' : 'MEDIUM');
  }

  _resetMatch() {
    this.teamA.score = 0;
    this.teamB.score = 0;
    this.match.chukka = 1;
    this.match.timeLeft = MATCH.chukkaSeconds;
    this.match.ended = false;
    this.match.isOvertime = false;
    // Reset attack directions to default before resetting positions
    this.teamA.attackDir = 1;
    this.teamB.attackDir = -1;
    this._resetPositions();
    this.turnManager.reset(0);
  }

  _resetPositions() {
    this.ball.reset();
    this.teamA.reset();
    this.teamB.reset();
  }

  _pause() {
    this.scene = SCENE.PAUSED;
    this.match.pause();
    this.menus.showPause(
      () => this._resume(),
      () => { this.menus.clear(); this._startMatch(); }
    );
  }
  _resume() {
    this.scene = SCENE.PLAYING;
    this.match.start();
  }

  // ---- Input handling ----

  _onMouseDown(p) {
    if (this.scene !== SCENE.PLAYING) return;
    if (!this.turnManager.isHumanTurn() || this.turnManager.phase !== 'choose') return;

    // If we have a selected player and ball is in their reach, try starting a flick
    if (this.selectedPlayer && this.selectedPlayer.canReachBall(this.ball)) {
      const dBall = dist(p.x, p.y, this.ball.x, this.ball.y);
      if (dBall < this.ball.radius + 16) {
        this.flickMode = true;
        this.dragStart = { ...p };
        this.dragEnd = { ...p };
        return;
      }
    }

    // Otherwise if a player is already selected, treat as move attempt (handled on mouseup)
    // Selection happens on mouseup too.
  }

  _onMouseUp(p) {
    if (this.scene !== SCENE.PLAYING) return;
    if (!this.turnManager.isHumanTurn() || this.turnManager.phase !== 'choose') return;

    // Finish flick if active
    if (this.flickMode && this.dragStart) {
      this._resolveFlick(p);
      this.flickMode = false;
      this.dragStart = this.dragEnd = null;
      return;
    }

    // Try to select one of our players
    const clicked = this._pickPlayer(p, this.teamA);
    if (clicked) {
      this.selectedPlayer = clicked;
      this.sounds.select();
      return;
    }

    // If we have a selected player, try to move to this location
    if (this.selectedPlayer) {
      this._tryMove(p);
    }
  }

  _pickPlayer(p, team) {
    for (const pl of team.players) {
      if (dist(p.x, p.y, pl.x, pl.y) <= pl.radius + 3) return pl;
    }
    return null;
  }

  _tryMove(p) {
    const pl = this.selectedPlayer;
    const d = dist(p.x, p.y, pl.x, pl.y);
    if (d > MOVEMENT.moveRadius) return; // ignored

    // Clamp inside the field margin
    const tx = clamp(p.x, FIELD.margin + pl.radius, FIELD.width - FIELD.margin - pl.radius);
    const ty = clamp(p.y, FIELD.margin + pl.radius, FIELD.height - FIELD.margin - pl.radius);
    pl.faceTowards(tx, ty);
    pl.startMoveTo(tx, ty);
    this.sounds.hit();
    this.turnManager.commitAction();
  }

  _resolveFlick(p) {
    const pl = this.selectedPlayer;
    if (!pl || !pl.canReachBall(this.ball)) return;

    const dx = p.x - this.dragStart.x;
    const dy = p.y - this.dragStart.y;
    const len = Math.hypot(dx, dy);
    if (len < 6) return; // too small, cancel

    const clamped = Math.min(len, PHYSICS.maxDragDistance);
    // Slingshot: velocity in opposite direction to drag
    const ratio = clamped / PHYSICS.maxDragDistance;
    const targetSpeed = ratio * 38; // max-power shot travels ~85% of field (frictionAir 0.018)
    const vx = -(dx / len) * targetSpeed;
    const vy = -(dy / len) * targetSpeed;

    pl.faceTowards(this.ball.x, this.ball.y);
    this._applyFlick(pl, this.ball, vx, vy);
    this.turnManager.commitAction();
  }

  _applyFlick(player, ball, vx, vy) {
    ball.applyImpulse(vx, vy);
    this.sounds.flick();
    // Impact effect at mallet tip
    const tip = player.getMalletTip();
    const speed = Math.hypot(vx, vy);
    const power = Math.min(1, speed / 18);
    this.renderer.triggerImpact(tip.x, tip.y, power);
    if (power > 0.5) this.renderer.triggerShake(power * 1.2, 110);
    // Commentary
    this._fireFlickCommentary(player, power);
  }

  _fireFlickCommentary(player, power) {
    const teamName = player.teamId === 0 ? 'RED' : 'BLUE';
    const role = player.role || '';
    const roleLabel = role === 'attacker' ? '#1' : role === 'allrounder' ? '#2' : role === 'playmaker' ? '#3' : '#4';
    const lines = power > 0.88
      ? [
          `${teamName} ${roleLabel} unleashes a thunderous strike!`,
          `What a hit from ${teamName} ${roleLabel}!`,
          `Full power from ${teamName}!`,
          `${teamName} goes for goal!`,
        ]
      : power > 0.55
      ? [
          `${teamName} ${roleLabel} moves the ball forward.`,
          `${teamName} plays it through the midfield.`,
          `${teamName} ${roleLabel} drives toward goal.`,
          `Good strike from ${teamName} ${roleLabel}.`,
        ]
      : [
          `${teamName} taps it gently.`,
          `A careful touch from ${teamName} ${roleLabel}.`,
          `${teamName} keeps possession.`,
        ];
    this.renderer.showCommentary(lines[Math.floor(Math.random() * lines.length)]);
  }

  _onGoal(scoringTeamId) {
    // In overtime, first goal ends the match immediately
    if (this.match.isOvertime) {
      this.match.scoreGoal(scoringTeamId);
      this.renderer.triggerGoalFlash(scoringTeamId);
      this.renderer.triggerScorePulse(scoringTeamId);
      this.renderer.triggerShake(1.8, 200);
      this.hud.showAnnouncement('GOLDEN GOAL!');
      this.sounds.goal();
      this.scene = SCENE.GOAL;
      setTimeout(() => this._onMatchEnd(scoringTeamId), 1800);
      return;
    }

    this.match.scoreGoal(scoringTeamId);
    this.renderer.triggerGoalFlash(scoringTeamId);
    this.renderer.triggerScorePulse(scoringTeamId);
    this.renderer.triggerShake(1.8, 200);
    this.hud.showAnnouncement('GOAL!');
    this.sounds.goal();
    this.scene = SCENE.GOAL;

    setTimeout(() => {
      // Ends swap: both teams flip sides (real polo rule)
      this.teamA.flipEnds();
      this.teamB.flipEnds();
      this.ball.reset();
      this.turnManager.reset(1 - scoringTeamId);
      this.scene = SCENE.PLAYING;
      this.hud.showAnnouncement('ENDS CHANGE');
      this.renderer.showCommentary('Teams swap ends — classic polo!');
    }, 1400);
  }

  _onOvertime() {
    this.sounds.whistle();
    this.hud.showAnnouncement('GOLDEN CHUKKA!');
    this.renderer.showCommentary('Scores level — sudden death! First goal wins!');
    this._resetPositions();
    this.teamA.attackDir = 1;
    this.teamB.attackDir = -1;
    this.turnManager.reset(0);
  }

  _onMatchEnd(winner) {
    this.scene = SCENE.OVER;
    this.sounds.whistle();
    setTimeout(() => {
      this.menus.showGameOver(
        this.teamA.score, this.teamB.score, winner,
        (diff) => this._startMatch(diff)
      );
    }, 600);
  }

  // ---- Game loop ----

  _loop(t) {
    const dt = Math.min(0.033, (t - this._lastTime) / 1000);
    this._lastTime = t;

    if (this.scene === SCENE.PLAYING || this.scene === SCENE.GOAL) {
      this._update(dt);
    }
    this._render();

    if (this._running) requestAnimationFrame((tt) => this._loop(tt));
  }

  _update(dt) {
    // Step physics and entities
    this.physics.update(dt);
    this.teamA.update(dt);
    this.teamB.update(dt);
    this.ball.updateTrail();
    this.goalDetector.update();

    // Match timer only during choose/resolving (not during GOAL pause)
    if (this.scene === SCENE.PLAYING) this.match.update(dt);

    // Turn resolution
    this.turnManager.update(dt, this.ball);

    // AI turn
    if (this.scene === SCENE.PLAYING
        && this.turnManager.currentTeamId === 1
        && this.turnManager.phase === 'choose') {
      this.ai.update(dt, {
        ball: this.ball,
        turnManager: this.turnManager,
        opponentTeam: this.teamA,
        applyFlick: (pl, ball, vx, vy) => this._applyFlick(pl, ball, vx, vy),
      });
    }
  }

  _render() {
    this.renderer.clear();
    this.renderer.drawField(this.ball.x, this.ball.y);

    // Move radius under selected player
    if (this.selectedPlayer && this.turnManager.isHumanTurn() && this.turnManager.phase === 'choose'
        && !this.flickMode) {
      this.renderer.drawMoveRadius(this.selectedPlayer);
      // Ghost preview of move destination
      if (!this.selectedPlayer.canReachBall(this.ball) || dist(this.hoverPos.x, this.hoverPos.y, this.ball.x, this.ball.y) > this.ball.radius + 16) {
        const d = dist(this.hoverPos.x, this.hoverPos.y, this.selectedPlayer.x, this.selectedPlayer.y);
        const valid = d <= MOVEMENT.moveRadius;
        this.renderer.drawMoveGhost(this.selectedPlayer, this.hoverPos.x, this.hoverPos.y, valid);
      }
    }

    // Players
    for (const p of this.teamA.players) {
      this.renderer.drawPlayer(p, {
        selected: p === this.selectedPlayer,
        currentTurn: this.turnManager.currentTeamId === 0 && this.turnManager.phase === 'choose',
      });
    }
    for (const p of this.teamB.players) {
      this.renderer.drawPlayer(p, {
        currentTurn: this.turnManager.currentTeamId === 1 && this.turnManager.phase === 'choose',
      });
    }

    // Line of Ball
    this.renderer.drawLineOfBall(this.ball);

    // Ball
    this.renderer.drawBall(this.ball);

    // Mallet impact flash
    this.renderer.drawImpact();
    this.renderer.tickScorePulse();

    // Flick aim
    if (this.flickMode && this.dragStart && this.dragEnd) {
      this.renderer.drawFlickAim(this.ball, this.dragStart, this.dragEnd);
    }

    // Goal flash
    this.renderer.drawGoalFlash();

    // Commentary ticker
    this.renderer.drawCommentary();

    // HUD
    this.hud.draw(this.match, this.turnManager, this.renderer.scorePulse);
  }
}
