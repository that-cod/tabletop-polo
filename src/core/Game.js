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
import { Tournament } from '../systems/Tournament.js';
import { Replay } from '../systems/Replay.js';
import { AIOpponent } from '../ai/AIOpponent.js';
import { HUD } from '../ui/HUD.js';
import { Menus } from '../ui/Menus.js';
import { Sounds } from '../audio/Sounds.js';
import { FIELD, MOVEMENT, PHYSICS, MATCH, HANDICAP, ARENA } from '../utils/constants.js';
import { dist, clamp } from '../utils/math.js';

const SCENE = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', GOAL: 'goal', OVER: 'over' };

export class Game {
  constructor(canvas, overlayEl) {
    this.canvas   = canvas;
    this.overlayEl = overlayEl;
    this.scene    = SCENE.MENU;

    this.menus  = new Menus(overlayEl);
    this.sounds = new Sounds();

    // Interaction state (human)
    this.selectedPlayer = null;
    this.flickMode = false;
    this.dragStart = null;
    this.dragEnd = null;
    this.hoverPos = { x: 0, y: 0 };
    this.rowBonusTeam = -1;
    this.penaltyMode   = false;
    this.penaltyTeamId = -1;
    this.hookPromptVisible = false;
    this.twoPlayer    = false;
    this.currentMode  = 'vsAI';
    this.currentTier  = 'club';
    this.isAutoPlay   = false;   // true when both teams are AI-controlled
    this.autoPlaySpeed = 1;      // simulation speed multiplier (1/2/4/8)

    // Build subsystems for the default (field) mode
    this._buildSystems(null);
    this._wireInputEvents();

    this._lastTime = performance.now();
    this._running = false;
  }

  /**
   * Construct/reconstruct all physics + entity + system objects.
   * Called once on construction, and again if mode changes (field ↔ arena).
   * @param {object|null} arenaCfg - Pass ARENA config for arena mode, null for field polo.
   */
  _buildSystems(arenaCfg) {
    // Tear down old physics if rebuilding
    if (this.physics) {
      // Remove all event listeners to avoid double-firing
      if (this.goalDetector)   this.goalDetector.destroy && this.goalDetector.destroy();
      if (this.boundarySystem) this.boundarySystem.destroy && this.boundarySystem.destroy();
    }

    const fieldCfg    = arenaCfg ? arenaCfg.field : null;
    const activeField = fieldCfg || FIELD;
    const wallRest    = arenaCfg ? arenaCfg.wallRestitution : null;
    const numPlayers  = arenaCfg ? arenaCfg.playersPerTeam : 4;

    this.activeField = activeField;
    this.isArenaMode = !!arenaCfg;

    // Resize canvas to match field
    if (this.canvas) {
      this.canvas.width  = activeField.width;
      this.canvas.height = activeField.height;
    }

    this.physics     = new PhysicsEngine(fieldCfg, wallRest);
    this.renderer    = new Renderer(this.canvas, fieldCfg);
    this.hud         = new HUD(this.canvas, fieldCfg);
    this.input       = new InputManager(this.canvas);

    this.ball    = new Ball(this.physics, activeField.centerX, activeField.centerY, fieldCfg);
    this.teamA   = new Team(this.physics, 0, fieldCfg, numPlayers);
    this.teamB   = new Team(this.physics, 1, fieldCfg, numPlayers);
    this.match   = new Match(this.teamA, this.teamB);
    this.turnManager    = new TurnManager(this.teamA, this.teamB);
    this.goalDetector   = new GoalDetection(this.physics, this.ball);
    this.boundarySystem = new BoundarySystem(this.physics, this.ball);
    this.foulDetection  = new FoulDetection(this.ball);
    this.hookSystem     = new HookSystem();
    this.shootout       = new PenaltyShootout();
    this.rideOff        = new RideOffSystem();
    this.stats          = new MatchStats();
    this.tournament     = new Tournament();
    this.replay         = new Replay();
    this.ai             = new AIOpponent(this.teamB, 'medium');
    this.aiA            = new AIOpponent(this.teamA, 'hard');  // used in AI vs AI mode

    this._wireGameEvents();
  }

  _wireInputEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.scene === SCENE.PLAYING) this._pause();
        else if (this.scene === SCENE.PAUSED) this._resume();
      }
      if ((e.key === 'h' || e.key === 'H') && this.hookSystem.active
          && this.hookSystem.hookerTeamId === 0) {
        this.hookSystem.executeHook(0, 0);
        this.hookPromptVisible = false;
        this.sounds.hit();
        this.renderer.showCommentary('HOOK! RED intercepts the mallet!');
      }
      // S = cycle simulation speed in AI vs AI mode
      if ((e.key === 's' || e.key === 'S') && this.isAutoPlay) {
        const speeds = [1, 2, 4, 8];
        const next = speeds[(speeds.indexOf(this.autoPlaySpeed) + 1) % speeds.length];
        this.autoPlaySpeed = next;
        this.hud.showAnnouncement(`${next}x SPEED`);
      }
    });
  }

  _wireGameEvents() {
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
      const af = this.activeField;
      const spot = { x: af.width * (fouledTeamId === 0 ? 0.82 : 0.18), y: af.centerY };
      this.foulDetection.onFoul(fouledTeamId, spot);
    };
  }

  start() {
    this.menus.showStart((tier, mode) => {
      if (mode === 'tournament') {
        this._startTournament();
      } else if (mode === 'aiVsAi') {
        this._startAutoPlay(tier);
      } else {
        this._startMatch(tier, mode);
      }
    });
    this._running = true;
    requestAnimationFrame((t) => this._loop(t));
  }

  _startAutoPlay(tier = 'hard') {
    this.isAutoPlay    = true;
    this.autoPlaySpeed = 1;
    this.twoPlayer     = false;
    this.currentMode   = 'aiVsAi';
    this.currentTier   = tier;

    // Both AIs on hard for a competitive game
    this.ai.difficulty  = 'hard';
    this.aiA.difficulty = 'hard';

    this._autoWireMenus();
    this._resetMatch();
    this.match.start();
    this.scene = SCENE.PLAYING;
    this.sounds.whistle();
    this.hud.showAnnouncement('AI VS AI');
    this.renderer.showCommentary('Sit back and watch — both teams are AI-controlled! Press S to change speed.');
  }

  /**
   * In AI vs AI mode all modal menus must be auto-dismissed so the game
   * keeps running without any human clicking a button.
   */
  _autoWireMenus() {
    // Halftime: auto-continue after 2 s
    this.match.onHalftime = () => {
      this.scene = SCENE.PAUSED;
      this.sounds.halftime();
      this.hud.showAnnouncement('HALF TIME');
      setTimeout(() => {
        this._resetPositions();
        this.teamA.attackDir = 1;
        this.teamB.attackDir = -1;
        this.match.start();
        this.scene = SCENE.PLAYING;
        if (this.match.onChukkaEnd) this.match.onChukkaEnd(this.match.chukka);
      }, 2200);
    };

    // Chukka banners are already just HUD announcements, no modal needed
    this.match.onChukkaEnd = (n) => {
      this.sounds.whistle();
      this.hud.showAnnouncement(`CHUKKA ${n}`);
      this._resetPositions();
      this.teamA.attackDir = 1;
      this.teamB.attackDir = -1;
      [...this.teamA.players, ...this.teamB.players].forEach(p => p.restoreStamina());
      this.stats.setChukka(n);
      this.turnManager.reset(0);
    };

    // Match end: show result for 3 s then auto-restart
    this.match.onMatchEnd = (winner) => {
      this.scene = SCENE.OVER;
      this.sounds.whistle();
      const name = winner === 0 ? 'RED' : winner === 1 ? 'BLUE' : 'DRAW';
      this.hud.showAnnouncement(`${name} WINS!`);
      setTimeout(() => {
        if (this.isAutoPlay) this._startAutoPlay(this.currentTier);
      }, 3500);
    };

    // Overtime needs no modal either
    this.match.onOvertime  = () => this._onOvertime();
    this.match.onShootout  = () => this._autoShootout();
  }

  /** Shootout in AI vs AI — both teams shoot via existing AI penalty logic. */
  _autoShootout() {
    this._wireShootout();
    this.scene = SCENE.PLAYING;
    this.shootout.start();
    // Override onDone to auto-restart instead of showing modal
    this.shootout.onDone = (winner) => {
      this.scene = SCENE.OVER;
      this.sounds.whistle();
      const name = winner === 0 ? 'RED' : winner === 1 ? 'BLUE' : 'DRAW';
      this.hud.showAnnouncement(`${name} WINS SHOOTOUT!`);
      setTimeout(() => {
        if (this.isAutoPlay) this._startAutoPlay(this.currentTier);
      }, 3500);
    };
    // Both shootout teams use AI
    this.shootout.onShotReady = (teamId, spotX, spotY) => {
      this.ball.reset(spotX, spotY);
      this.turnManager.reset(teamId);
      const teamName = teamId === 0 ? 'RED' : 'BLUE';
      this.hud.showAnnouncement(`${teamName} SHOOTS`);
      this.sounds.shootoutWhistle();
      setTimeout(() => this._executeAIPenalty(teamId), 600);
    };
  }

  _startTournament() {
    this.tournament.reset();
    this.tournament.onRoundStart = (round) => {
      this.menus.showTournamentRound(round, this.tournament.progressDisplay(), () => {
        // headStart is AI advantage
        this._resetMatch();
        this.teamB.score = round.aiHeadStart;
        this.ai.difficulty = round.difficulty;
        this.match.start();
        this.scene = SCENE.PLAYING;
        this.sounds.whistle();
        this.hud.showAnnouncement(round.label);
      });
    };
    this.tournament.onDone = (won, results) => {
      this.scene = SCENE.OVER;
      this.sounds.whistle();
      setTimeout(() => {
        this.menus.showTournamentResult(
          won, results, this.tournament.totalGoalsA, this.tournament.totalGoalsB,
          () => this.menus.showStart((tier, mode) => {
            if (mode === 'tournament') this._startTournament();
            else this._startMatch(tier, mode);
          })
        );
      }, 600);
    };
    this.currentMode = 'tournament';
    this.twoPlayer   = false;
    this.tournament.start();
  }

  _startMatch(tier = 'club', mode = 'vsAI') {
    this.isAutoPlay  = false;  // leaving auto-play mode resets flag
    const cfg = HANDICAP[tier] || HANDICAP.club;
    this.twoPlayer   = (mode === '2p' || mode === '2p-arena');
    this.currentTier = tier;
    this.currentMode = mode;

    // Rebuild physics/entities if switching between field ↔ arena
    const needsArena = (mode === 'arena' || mode === '2p-arena');
    if (needsArena !== this.isArenaMode) {
      this._buildSystems(needsArena ? ARENA : null);
    }

    this.ai.difficulty = cfg.difficulty;
    this._resetMatch();
    if (!this.twoPlayer) {
      if (cfg.headStart > 0) this.teamA.score = cfg.headStart;
      if (cfg.headStart < 0) this.teamB.score = -cfg.headStart;
    }
    this.match.start();
    this.scene = SCENE.PLAYING;
    this.sounds.whistle();
    const modeLabel = needsArena ? 'ARENA POLO' : (this.twoPlayer ? '2 PLAYERS' : cfg.label.toUpperCase());
    this.hud.showAnnouncement(modeLabel);
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
    this.replay.reset();
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
      () => { this.menus.clear(); this._startMatch(this.currentTier || 'club', this.currentMode || 'vsAI'); }
    );
  }
  _resume() {
    this.scene = SCENE.PLAYING;
    this.match.start();
  }

  // ---- Input handling ----

  _onMouseDown(p) {
    if (this.scene !== SCENE.PLAYING) return;
    if (this.turnManager.phase !== 'choose') return;
    // In vsAI mode only human (team 0) can act via mouse
    if (!this.twoPlayer && !this.turnManager.isHumanTurn()) return;

    if (this.selectedPlayer && this.selectedPlayer.canReachBall(this.ball)) {
      const dBall = dist(p.x, p.y, this.ball.x, this.ball.y);
      if (dBall < this.ball.radius + 16) {
        this.flickMode = true;
        this.dragStart = { ...p };
        this.dragEnd   = { ...p };
        // Hook only applies in vsAI mode (AI defends)
        if (!this.twoPlayer) {
          this.hookSystem.checkFlickSetup(this.selectedPlayer, this.ball, this.teamB);
          if (this.hookSystem.active && this.hookSystem.aiShouldHook(this.ai.difficulty)) {
            this.sounds.hit();
            this.renderer.showCommentary('BLUE defender positions for a hook!');
          }
        }
        return;
      }
    }
  }

  _onMouseUp(p) {
    if (this.scene !== SCENE.PLAYING) return;
    if (this.turnManager.phase !== 'choose') return;
    if (!this.twoPlayer && !this.turnManager.isHumanTurn()) return;

    // Finish flick if active
    if (this.flickMode && this.dragStart) {
      this._resolveFlick(p);
      this.flickMode = false;
      this.dragStart = this.dragEnd = null;
      return;
    }

    // Pick a player from the CURRENT active team
    const activeTeam = this.twoPlayer
      ? this.turnManager.currentTeam
      : this.teamA;
    const clicked = this._pickPlayer(p, activeTeam);
    if (clicked) {
      this.selectedPlayer = clicked;
      this.sounds.select();
      return;
    }

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
    const rowBonus = (this.ball.rowTeamId === pl.teamId) ? MOVEMENT.rowBonusPx : 0;
    const effectiveRadius = (MOVEMENT.moveRadius + rowBonus) * pl.staminaMoveMultiplier();
    const d = dist(p.x, p.y, pl.x, pl.y);
    if (d > effectiveRadius) return;

    const tx = clamp(p.x, FIELD.margin + pl.radius, FIELD.width - FIELD.margin - pl.radius);
    const ty = clamp(p.y, FIELD.margin + pl.radius, FIELD.height - FIELD.margin - pl.radius);

    if (this.foulDetection.checkMove(pl.teamId, tx, ty)) return;

    // Ride-off: check against opponents (the OTHER team)
    const opponentPlayers = pl.teamId === 0 ? this.teamB.players : this.teamA.players;
    const foul = this.rideOff.check(pl, tx, ty, opponentPlayers);
    if (foul) return;

    pl.faceTowards(tx, ty);
    pl.startMoveTo(tx, ty);
    pl.drainStamina(0.10);
    this.sounds.hit();
    this.turnManager.commitAction();
  }

  _executeAIPenalty(teamId = 1) {
    const shootingTeam = teamId === 0 ? this.teamA : this.teamB;
    const af   = this.activeField;
    const pl   = shootingTeam.closestToBall(this.ball);
    if (!pl) return;
    const goalX = shootingTeam.attackDir > 0 ? af.width - 20 : 20;
    const goalY = af.centerY + (Math.random() - 0.5) * 40;
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

    const teamName = scoringTeamId === 0 ? 'RED' : 'BLUE';
    this.match.scoreGoal(scoringTeamId);
    this.renderer.triggerGoalFlash(scoringTeamId);
    this.renderer.triggerScorePulse(scoringTeamId);
    this.renderer.triggerShake(1.8, 200);
    this.sounds.goal();
    this.scene = SCENE.GOAL;

    // In overtime, first goal ends the match immediately — still show replay
    const afterReplay = () => {
      if (this.match.isOvertime) {
        this._onMatchEnd(scoringTeamId);
        return;
      }
      this.teamA.flipEnds();
      this.teamB.flipEnds();
      this.ball.reset();
      this.turnManager.reset(1 - scoringTeamId);
      this.scene = SCENE.PLAYING;
      this.hud.showAnnouncement('ENDS CHANGE');
      this.renderer.showCommentary('Teams swap ends — classic polo!');
    };

    const label = this.match.isOvertime ? 'GOLDEN GOAL!' : 'GOAL!';
    this.hud.showAnnouncement(label);

    // Trigger replay playback — resumes play when done
    this.replay.onDone = afterReplay;
    this.replay.startPlayback();
    if (!this.replay.isPlaying) {
      // Buffer was empty (very early in match); fall back to timed resume
      setTimeout(afterReplay, 1400);
    }
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

    // Tournament mode — advance instead of game-over screen
    if (this.currentMode === 'tournament' && this.tournament.active) {
      setTimeout(() => {
        this.tournament.advance(this.teamA.score, this.teamB.score);
      }, 800);
      return;
    }

    setTimeout(() => {
      const sub = this.twoPlayer
        ? (winner === 0 ? 'RED Player wins!' : winner === 1 ? 'BLUE Player wins!' : 'A great match!')
        : null;
      this.menus.showGameOver(
        this.teamA.score, this.teamB.score, winner,
        (tier) => this._startMatch(tier, this.currentMode || 'vsAI'),
        this.stats ? this.stats.summary() : null,
        sub
      );
    }, 600);
  }

  // ---- Game loop ----

  _loop(t) {
    const rawDt = Math.min(0.033, (t - this._lastTime) / 1000);
    this._lastTime = t;

    if (this.scene === SCENE.PLAYING || this.scene === SCENE.GOAL) {
      // In AI vs AI mode, run multiple physics sub-steps per frame to simulate speed-up.
      // Cap sub-steps at 8 to prevent spiral-of-death; each sub-step dt stays capped.
      const steps   = this.isAutoPlay ? Math.min(this.autoPlaySpeed, 8) : 1;
      const stepDt  = rawDt / steps;
      for (let i = 0; i < steps; i++) {
        if (this.scene === SCENE.PLAYING || this.scene === SCENE.GOAL) {
          this._update(stepDt);
        }
      }
    }
    this._render();

    if (this._running) requestAnimationFrame((tt) => this._loop(tt));
  }

  _update(dt) {
    // During replay playback — advance buffer only, skip all physics
    if (this.replay.isPlaying) {
      this.replay.update(dt);
      return;
    }

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

    // Record frame for potential replay (only during active play)
    if (this.scene === SCENE.PLAYING) {
      this.replay.record(this.ball, this.teamA, this.teamB);
    }

    // Match timer only during choose/resolving (not during GOAL pause)
    if (this.scene === SCENE.PLAYING) this.match.update(dt);

    // Turn resolution
    this.turnManager.update(dt, this.ball);

    // AI turn for team B (always active when not 2P)
    if (!this.twoPlayer
        && this.scene === SCENE.PLAYING
        && this.turnManager.currentTeamId === 1
        && this.turnManager.phase === 'choose') {
      this.ai.update(dt, {
        ball: this.ball,
        turnManager: this.turnManager,
        opponentTeam: this.teamA,
        applyFlick: (pl, ball, vx, vy) => this._applyFlick(pl, ball, vx, vy),
      });
    }

    // AI turn for team A — only in AI vs AI mode
    if (this.isAutoPlay
        && this.scene === SCENE.PLAYING
        && this.turnManager.currentTeamId === 0
        && this.turnManager.phase === 'choose') {
      this.aiA.update(dt, {
        ball: this.ball,
        turnManager: this.turnManager,
        opponentTeam: this.teamB,
        applyFlick: (pl, ball, vx, vy) => this._applyFlick(pl, ball, vx, vy),
      });
    }
  }

  _render() {
    this.renderer.clear();

    // ── REPLAY PLAYBACK ──────────────────────────────────────────────────
    if (this.replay.isPlaying) {
      const frame = this.replay.currentFrame();
      if (frame) {
        this.renderer.drawField(frame.ball.x, frame.ball.y);
        for (const snap of frame.teamA) this.renderer.drawPlayer(snap, { currentTurn: false });
        for (const snap of frame.teamB) this.renderer.drawPlayer(snap, { currentTurn: false });
        this.renderer.drawBallAt(frame.ball.x, frame.ball.y);
      } else {
        this.renderer.drawField(this.ball.x, this.ball.y);
      }
      this.renderer.drawGoalFlash();
      this.renderer.drawReplayBadge();
      this.hud.draw(this.match, this.turnManager, this.renderer.scorePulse);
      return;
    }

    // ── NORMAL RENDER ────────────────────────────────────────────────────
    this.renderer.drawField(this.ball.x, this.ball.y);

    // Move radius / ghost — show for the active human's selected player
    const showMoveUI = this.selectedPlayer
      && (this.twoPlayer || this.turnManager.isHumanTurn())
      && this.turnManager.phase === 'choose'
      && !this.flickMode;
    if (showMoveUI) {
      const rowBonus = (this.ball.rowTeamId === this.selectedPlayer.teamId) ? MOVEMENT.rowBonusPx : 0;
      this.renderer.drawMoveRadius(this.selectedPlayer, rowBonus, this.selectedPlayer.staminaMoveMultiplier());
      if (!this.selectedPlayer.canReachBall(this.ball) || dist(this.hoverPos.x, this.hoverPos.y, this.ball.x, this.ball.y) > this.ball.radius + 16) {
        const effR = (MOVEMENT.moveRadius + rowBonus) * this.selectedPlayer.staminaMoveMultiplier();
        const d = dist(this.hoverPos.x, this.hoverPos.y, this.selectedPlayer.x, this.selectedPlayer.y);
        this.renderer.drawMoveGhost(this.selectedPlayer, this.hoverPos.x, this.hoverPos.y, d <= effR);
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
        selected: this.twoPlayer && p === this.selectedPlayer,
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

    // Hook prompt — only relevant in vsAI mode
    if (!this.twoPlayer && this.hookPromptVisible && this.hookSystem.hookerTeamId === 0 && this.flickMode) {
      this.renderer.drawHookPrompt(this.ball);
    }

    // 2P turn banner — remind which team should act
    if (this.twoPlayer && this.turnManager.phase === 'choose') {
      this.renderer.draw2PTurnBanner(this.turnManager.currentTeamId);
    }

    // Commentary ticker
    this.renderer.drawCommentary();

    // HUD
    this.hud.draw(this.match, this.turnManager, this.renderer.scorePulse);

    // AI vs AI speed badge
    if (this.isAutoPlay) {
      this.renderer.drawAutoPlayBadge(this.autoPlaySpeed);
    }
  }
}
