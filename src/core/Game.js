import { PhysicsEngine } from './Engine.js';
import { Renderer } from './Renderer.js';
import { Ball } from '../entities/Ball.js';
import { Team } from '../entities/Team.js';
import { Match } from '../entities/Match.js';
import { InputManager } from '../input/InputManager.js';
import { TurnManager } from '../systems/TurnManager.js';
import { GoalDetection } from '../systems/GoalDetection.js';
import { BoundarySystem } from '../systems/BoundarySystem.js';
import { FoulDetection } from '../systems/FoulDetection.js';
import { HookSystem } from '../systems/HookSystem.js';
import { PenaltyShootout } from '../systems/PenaltyShootout.js';
import { RideOffSystem } from '../systems/RideOffSystem.js';
import { MatchStats } from '../entities/MatchStats.js';
import { AIOpponent } from '../ai/AIOpponent.js';
import { HUD } from '../ui/HUD.js';
import { Menus } from '../ui/Menus.js';
import { Sounds } from '../audio/Sounds.js';
import { FIELD, MOVEMENT, PHYSICS, MATCH, HANDICAP } from '../utils/constants.js';
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
    this.goalDetector  = new GoalDetection(this.physics, this.ball);
    this.boundarySystem = new BoundarySystem(this.physics, this.ball);
    this.foulDetection  = new FoulDetection(this.ball);
    this.hookSystem      = new HookSystem();
    this.shootout        = new PenaltyShootout();
    this.rideOff         = new RideOffSystem();
    this.stats           = new MatchStats();
    this.ai = new AIOpponent(this.teamB, 'medium');

    // Penalty shot state
    this.penaltyMode   = false;
    this.penaltyTeamId = -1;

    // Hook state
    this.hookPromptVisible = false;

    // Interaction state (human)
    this.selectedPlayer = null;
    this.flickMode = false;
    this.dragStart = null;
    this.dragEnd = null;
    this.hoverPos = { x: 0, y: 0 };
    // Right-of-way: which team has the bonus this turn
    this.rowBonusTeam = -1; // -1 = none

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

    this.boundarySystem.onSidelineOut = (exitX, exitY, restartTeamId) => {
      if (this.scene !== SCENE.PLAYING) return;
      this.sounds.whistle();
      this.ball.reset(exitX, exitY);
      this.turnManager.reset(restartTeamId);
      const teamName = restartTeamId === 0 ? 'RED' : 'BLUE';
      this.renderer.showCommentary(`Ball out! ${teamName} restarts from the sideline.`);
    };

    this.foulDetection.onFoul = (fouledTeamId, spot) => {
      if (this.scene !== SCENE.PLAYING) return;
      this.stats.recordFoul(1 - fouledTeamId); // foul committed by the OTHER team
      this.sounds.whistle();
      this.hud.showAnnouncement('FOUL!');
      this.renderer.showCommentary(
        fouledTeamId === 0 ? 'Foul on BLUE — RED takes an undefended penalty!' :
                            'Foul on RED — BLUE takes an undefended penalty!'
      );
      this.scene = SCENE.GOAL; // freeze normal play
      setTimeout(() => {
        this.ball.reset(spot.x, spot.y);
        this.ball.rowTeamId = -1; // clear ROW so no recursive fouls
        this.penaltyTeamId = fouledTeamId;
        this.penaltyMode   = fouledTeamId === 0; // human takes penalty if fouledTeam=0
        this.selectedPlayer = fouledTeamId === 0
          ? this.teamA.closestToBall(this.ball)
          : null; // AI will execute its own penalty
        this.turnManager.reset(fouledTeamId);
        this.scene = SCENE.PLAYING;
        if (fouledTeamId === 1) this._executeAIPenalty(); // AI shoots immediately
      }, 900);
    };

    this.boundarySystem.onBacklineOut = (restartTeamId, penaltyX, penaltyY) => {
      if (this.scene !== SCENE.PLAYING) return;
      this.sounds.whistle();
      this.ball.reset(penaltyX, penaltyY);
      this.turnManager.reset(restartTeamId);
      const teamName = restartTeamId === 0 ? 'RED' : 'BLUE';
      this.hud.showAnnouncement('FREE HIT');
      this.renderer.showCommentary(`Backline! ${teamName} takes a free hit.`);
    };

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
      this.teamA.attackDir = 1;
      this.teamB.attackDir = -1;
      [...this.teamA.players, ...this.teamB.players].forEach(p => p.restoreStamina());
      this.stats.setChukka(n);
      this.turnManager.reset(0);
    };
    this.match.onMatchEnd  = (winner) => this._onMatchEnd(winner);
    this.match.onOvertime  = ()        => this._onOvertime();
    this.match.onHalftime  = ()        => this._onHalftime();
    this.match.onShootout  = ()        => this._startShootout();

    this.turnManager.onTurnChange = (teamId) => {
      this.selectedPlayer = null;
      this.flickMode = false;
      this.dragStart = this.dragEnd = null;
      if (teamId === 1) this.ai.resetTurn();
    };

    this.hookSystem.onHookOpportunity = () => { this.hookPromptVisible = true; };
    this.hookSystem.onHookClose       = () => { this.hookPromptVisible = false; };

    this.rideOff.onRideOff = (opp) => {
      const oppName = opp.teamId === 0 ? 'RED' : 'BLUE';
      this.sounds.rideOff();
      this.renderer.showCommentary(`Ride-off! ${oppName} pushed off the line!`);
    };
    this.rideOff.onFoul = (foulTeamId) => {
      if (this.scene !== SCENE.PLAYING) return;
      this.sounds.whistle();
      this.hud.showAnnouncement('DANGEROUS RIDING!');
      const fouledTeamId = 1 - foulTeamId;
      const spot = { x: FIELD.width * (fouledTeamId === 0 ? 0.82 : 0.18), y: FIELD.centerY };
      this.foulDetection.onFoul(fouledTeamId, spot);
    };

    // Keyboard: P pauses, H hooks
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.scene === SCENE.PLAYING) this._pause();
        else if (this.scene === SCENE.PAUSED) this._resume();
      }
      // H = execute hook if a hook window is open and it's opponent's flick
      if ((e.key === 'h' || e.key === 'H') && this.hookSystem.active
          && this.hookSystem.hookerTeamId === 0) {
        this.hookSystem.executeHook(0, 0); // pre-arm; applied on resolveFlick
        this.hookPromptVisible = false;
        this.sounds.hit();
        this.renderer.showCommentary('HOOK! RED intercepts the mallet!');
      }
    });
  }

  start() {
    this.menus.showStart((tier) => this._startMatch(tier));
    this._running = true;
    requestAnimationFrame((t) => this._loop(t));
  }

  _startMatch(tier = 'club') {
    const cfg = HANDICAP[tier] || HANDICAP.club;
    this.ai.difficulty = cfg.difficulty;
    this.currentTier   = tier;
    this._resetMatch();
    // Apply head-start: positive = human (teamA) gets bonus goals
    if (cfg.headStart > 0)  this.teamA.score = cfg.headStart;
    if (cfg.headStart < 0)  this.teamB.score = -cfg.headStart;
    this.match.start();
    this.scene = SCENE.PLAYING;
    this.sounds.whistle();
    this.hud.showAnnouncement(cfg.label.toUpperCase());
  }

  _resetMatch() {
    this.teamA.score = 0;
    this.teamB.score = 0;
    this.match.chukka = 1;
    this.match.timeLeft = MATCH.chukkaSeconds;
    this.match.ended = false;
    this.match.isOvertime = false;
    this.teamA.attackDir = 1;
    this.teamB.attackDir = -1;
    this.boundarySystem.reset();
    this.foulDetection.reset();
    this.hookSystem.reset();
    this.shootout.reset();
    this.rideOff.reset();
    this.stats.reset();
    this.penaltyMode       = false;
    this.penaltyTeamId     = -1;
    this.hookPromptVisible = false;
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
      () => { this.menus.clear(); this._startMatch(this.currentTier || 'club'); }
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
        this.dragEnd   = { ...p };
        // Check if AI has a defender in hook position
        this.hookSystem.checkFlickSetup(this.selectedPlayer, this.ball, this.teamB);
        if (this.hookSystem.active && this.hookSystem.aiShouldHook(this.ai.difficulty)) {
          // AI pre-arms its hook — applied on resolveFlick
          this.sounds.hit();
          this.renderer.showCommentary('BLUE defender positions for a hook!');
        }
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
    const rowBonus = (this.ball.rowTeamId === 0 && pl.teamId === 0) ? MOVEMENT.rowBonusPx : 0;
    const effectiveRadius = (MOVEMENT.moveRadius + rowBonus) * pl.staminaMoveMultiplier();
    const d = dist(p.x, p.y, pl.x, pl.y);
    if (d > effectiveRadius) return;

    const tx = clamp(p.x, FIELD.margin + pl.radius, FIELD.width - FIELD.margin - pl.radius);
    const ty = clamp(p.y, FIELD.margin + pl.radius, FIELD.height - FIELD.margin - pl.radius);

    if (this.foulDetection.checkMove(pl.teamId, tx, ty)) return;

    // Ride-off check: does this move contact an opponent?
    const foul = this.rideOff.check(pl, tx, ty, this.teamB.players);
    if (foul) return; // dangerous riding called — cancel move

    pl.faceTowards(tx, ty);
    pl.startMoveTo(tx, ty);
    pl.drainStamina(0.10);
    this.sounds.hit();
    this.turnManager.commitAction();
  }

  _executeAIPenalty() {
    // AI takes an undefended penalty shot — aimed at center of goal with small noise
    const pl = this.teamB.closestToBall(this.ball);
    if (!pl) return;
    const goalX = this.teamB.attackDir > 0 ? FIELD.width - 20 : 20;
    const goalY = FIELD.centerY + (Math.random() - 0.5) * 40;
    const ang   = Math.atan2(goalY - this.ball.y, goalX - this.ball.x);
    const speed = 28;
    pl.faceTowards(this.ball.x, this.ball.y);
    this._applyFlick(pl, this.ball, Math.cos(ang) * speed, Math.sin(ang) * speed);
    this.penaltyMode   = false;
    this.penaltyTeamId = -1;
    this.turnManager.commitAction();
  }

  _resolveFlick(p) {
    const pl = this.selectedPlayer;
    if (!pl || !pl.canReachBall(this.ball)) return;

    const dx = p.x - this.dragStart.x;
    const dy = p.y - this.dragStart.y;
    const len = Math.hypot(dx, dy);
    if (len < 6) return;

    const clamped = Math.min(len, PHYSICS.maxDragDistance);
    const ratio = clamped / PHYSICS.maxDragDistance;
    const targetSpeed = ratio * 38;
    let vx = -(dx / len) * targetSpeed;
    let vy = -(dy / len) * targetSpeed;

    // Apply stamina power penalty before hook check
    const powerMult = pl.staminaPowerMultiplier();
    vx *= powerMult;
    vy *= powerMult;

    // Apply hook deflection if one was armed
    if (this.hookSystem.active) {
      const deflected = this.hookSystem.executeHook(vx, vy);
      vx = deflected.vx;
      vy = deflected.vy;
      this.renderer.showCommentary('Hook! Shot deflected!');
    }

    pl.faceTowards(this.ball.x, this.ball.y);
    pl.drainStamina(0.12);
    this._applyFlick(pl, this.ball, vx, vy);
    this.turnManager.commitAction();
  }

  _applyFlick(player, ball, vx, vy) {
    ball.applyImpulse(vx, vy, player.teamId);
    this.stats.recordFlick(player.teamId, player.x, player.y, ball.x, ball.y);
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
    this.stats.recordGoal(scoringTeamId);
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

  _onHalftime() {
    this.scene = SCENE.PAUSED;
    this.sounds.halftime();
    this.hud.showAnnouncement('HALF TIME');
    this.menus.showHalftime(
      this.teamA.score, this.teamB.score,
      () => {
        this._resetPositions();
        this.teamA.attackDir = 1;
        this.teamB.attackDir = -1;
        this.match.start();
        this.scene = SCENE.PLAYING;
        if (this.match.onChukkaEnd) this.match.onChukkaEnd(this.match.chukka);
      }
    );
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

  _startShootout() {
    this.scene = SCENE.PAUSED;
    this.sounds.shootoutWhistle();
    this.menus.showShootout(this.shootout.scoreDisplay(), () => {
      this.scene = SCENE.PLAYING;
      this._wireShootout();
      this.shootout.start();
    });
  }

  _wireShootout() {
    this.shootout.onShotReady = (teamId, spotX, spotY) => {
      this.ball.reset(spotX, spotY);
      this.turnManager.reset(teamId);
      const teamName = teamId === 0 ? 'RED' : 'BLUE';
      this.hud.showAnnouncement(`${teamName} SHOOTS`);
      this.sounds.shootoutWhistle();
      if (teamId === 1) {
        // AI takes shot after short delay
        setTimeout(() => this._executeAIPenalty(), 600);
      }
    };
    this.shootout.onDone = (winner) => {
      this.scene = SCENE.OVER;
      this.sounds.whistle();
      setTimeout(() => {
        this.menus.showGameOver(
          this.teamA.score + this.shootout.scores[0],
          this.teamB.score + this.shootout.scores[1],
          winner,
          (tier) => this._startMatch(tier),
          this.stats ? this.stats.summary() : null
        );
      }, 600);
    };

    // Intercept goal during shootout to record the shot
    const origOnGoal = this.goalDetector.onGoal;
    this.goalDetector.onGoal = (scoringTeamId) => {
      if (this.shootout.active) {
        this.renderer.triggerGoalFlash(scoringTeamId);
        this.renderer.triggerShake(1.8, 200);
        this.hud.showAnnouncement('GOAL!');
        this.sounds.goal();
        setTimeout(() => this.shootout.recordShot(true), 1200);
      } else {
        origOnGoal(scoringTeamId);
      }
    };

    // Also detect shot missed (ball stops without goal) via turn switch
    const origOnTurnChange = this.turnManager.onTurnChange;
    this.turnManager.onTurnChange = (teamId) => {
      if (this.shootout.active) {
        // Ball stopped without goal — miss
        setTimeout(() => this.shootout.recordShot(false), 200);
        return;
      }
      if (origOnTurnChange) origOnTurnChange(teamId);
    };
  }

  _onMatchEnd(winner) {
    this.scene = SCENE.OVER;
    this.sounds.whistle();
    setTimeout(() => {
      this.menus.showGameOver(
        this.teamA.score, this.teamB.score, winner,
        (tier) => this._startMatch(tier),
        this.stats ? this.stats.summary() : null
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
    this.stats.tickPossession(this.ball.x);
    this.goalDetector.update();
    this.boundarySystem.update();
    this.foulDetection.update();
    this.hookSystem.update(dt);
    this.rideOff.update();

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
      const rowBonus = (this.ball.rowTeamId === 0) ? MOVEMENT.rowBonusPx : 0;
      this.renderer.drawMoveRadius(this.selectedPlayer, rowBonus, this.selectedPlayer.staminaMoveMultiplier());
      // Ghost preview of move destination
      if (!this.selectedPlayer.canReachBall(this.ball) || dist(this.hoverPos.x, this.hoverPos.y, this.ball.x, this.ball.y) > this.ball.radius + 16) {
        const bonus = (this.ball.rowTeamId === 0) ? MOVEMENT.rowBonusPx : 0;
        const effR  = (MOVEMENT.moveRadius + bonus) * this.selectedPlayer.staminaMoveMultiplier();
        const d = dist(this.hoverPos.x, this.hoverPos.y, this.selectedPlayer.x, this.selectedPlayer.y);
        const valid = d <= effR;
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

    // Ride-off flash rings
    this.renderer.drawRideOffFlashes(this.rideOff.flashes);

    // Hook prompt (when AI defender is in position during human's flick drag)
    if (this.hookPromptVisible && this.hookSystem.hookerTeamId === 0 && this.flickMode) {
      this.renderer.drawHookPrompt(this.ball);
    }

    // Commentary ticker
    this.renderer.drawCommentary();

    // HUD
    this.hud.draw(this.match, this.turnManager, this.renderer.scorePulse);
  }
}
