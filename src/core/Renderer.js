import { FIELD, COLORS, PHYSICS, MOVEMENT, ARENA } from '../utils/constants.js';

export class Renderer {
  constructor(canvas, fieldCfg = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._fieldCfg = fieldCfg || FIELD;
    this.width  = this._fieldCfg.width;
    this.height = this._fieldCfg.height;
    this._isArena = !!fieldCfg;
    this._buildFieldPattern();

    // Goal celebration flash
    this.flash = { a: 0, team: 0 };

    // Camera shake
    this.shake = { x: 0, y: 0, intensity: 0, endMs: 0 };

    // Mallet impact effect
    this.impact = { x: 0, y: 0, a: 0, sparks: [] };

    // Score pulse (per team)
    this.scorePulse = [0, 0];

    // Commentary ticker
    this.commentaryText  = '';
    this.commentaryAlpha = 0;
  }

  _buildFieldPattern() {
    // Pre-render the grass background with stripes and texture noise
    const off = document.createElement('canvas');
    off.width = this.width;
    off.height = this.height;
    const c = off.getContext('2d');

    // Base gradient — use arena colors if in arena mode
    const grassA = this._isArena ? ARENA.grassA : COLORS.grassA;
    const grassB = this._isArena ? ARENA.grassB : COLORS.grassB;
    const g = c.createLinearGradient(0, 0, 0, this.height);
    g.addColorStop(0, grassA);
    g.addColorStop(0.5, grassB);
    g.addColorStop(1, grassA);
    c.fillStyle = g;
    c.fillRect(0, 0, this.width, this.height);

    // Vertical mowed stripes
    const stripeW = 64;
    for (let x = 0; x < this.width; x += stripeW * 2) {
      c.fillStyle = 'rgba(255,255,255,0.035)';
      c.fillRect(x, 0, stripeW, this.height);
    }

    // Noise specks
    const img = c.getImageData(0, 0, this.width, this.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 18;
      d[i]   = Math.max(0, Math.min(255, d[i]   + n));
      d[i+1] = Math.max(0, Math.min(255, d[i+1] + n * 1.2));
      d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
    }
    c.putImageData(img, 0, 0);

    // Vignette
    const rg = c.createRadialGradient(
      this.width / 2, this.height / 2, this.width * 0.2,
      this.width / 2, this.height / 2, this.width * 0.75
    );
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(0,0,0,0.35)');
    c.fillStyle = rg;
    c.fillRect(0, 0, this.width, this.height);

    this.fieldPattern = off;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  triggerShake(intensity = 1.0, durationMs = 120) {
    this.shake.intensity = intensity;
    this.shake.endMs = performance.now() + durationMs;
    this.shake.x = (Math.random() - 0.5) * 4 * intensity;
    this.shake.y = (Math.random() - 0.5) * 4 * intensity;
  }

  triggerImpact(x, y, power = 1.0) {
    this.impact.x = x;
    this.impact.y = y;
    this.impact.a = 1.0;
    const count = 4 + Math.floor(power * 4);
    this.impact.sparks = Array.from({ length: count }, (_, i) => {
      const ang = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.8;
      const d = 10 + Math.random() * 14 * power;
      return { x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d, r: 1.5 + power * 2 };
    });
  }

  triggerScorePulse(teamId) { this.scorePulse[teamId] = 1.5; }

  drawField(ballX, ballY) {
    const ctx = this.ctx;

    // Camera shake transform
    ctx.save();
    if (performance.now() < this.shake.endMs) {
      ctx.translate(this.shake.x, this.shake.y);
    } else {
      this.shake.x = this.shake.y = 0;
    }

    ctx.drawImage(this.fieldPattern, 0, 0);

    // Danger zone — ball near blue’s goal (right side) is dangerous for the AI
    // Ball near red’s goal (left side) is dangerous for the human player
    if (ballX !== undefined) {
      this._drawDangerZone(ballX, ballY);
    }

    ctx.restore();  // end shake scope (field only); rest of draw calls use same shake

    // Re-apply shake for subsequent draw calls in same frame
    if (performance.now() < this.shake.endMs) {
      ctx.save();
      ctx.translate(this.shake.x, this.shake.y);
      this._shakeActive = true;
    } else {
      this._shakeActive = false;
    }

    const F = this._fieldCfg;
    const boardColor = this._isArena ? ARENA.boardLight : COLORS.boardsLight;

    // Boards (perimeter frame)
    ctx.strokeStyle = boardColor;
    ctx.lineWidth = this._isArena ? 6 : 4;
    ctx.strokeRect(2, 2, this.width - 4, this.height - 4);

    // Field lines
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.strokeRect(F.margin, F.margin, this.width - F.margin * 2, this.height - F.margin * 2);

    // Halfway line
    ctx.beginPath();
    ctx.moveTo(this.width / 2, F.margin);
    ctx.lineTo(this.width / 2, this.height - F.margin);
    ctx.stroke();

    // Center circle (smaller in arena)
    const ccR = this._isArena ? 44 : 60;
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, ccR, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.fillStyle = COLORS.line;
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Goal arcs (D-shapes) — scaled for arena
    ctx.strokeStyle = COLORS.lineSoft;
    ctx.lineWidth = 2;
    for (const side of [0, 1]) {
      const cx = side === 0 ? F.margin : this.width - F.margin;
      const r  = this._isArena ? 85 : 120;
      ctx.beginPath();
      const start = side === 0 ? -Math.PI / 2 : Math.PI / 2;
      const end   = side === 0 ?  Math.PI / 2 : -Math.PI / 2;
      ctx.arc(cx, this.height / 2, r, start, end, side === 1);
      ctx.stroke();
    }

    this._drawGoals();

    if (this._shakeActive) ctx.restore();
  }

  _drawDangerZone(ballX, ballY) {
    const ctx = this.ctx;
    const now = performance.now();
    // Danger: ball within 160px of either goal line (x=0 or x=width)
    const leftDist  = ballX;             // distance to left goal
    const rightDist = this.width - ballX; // distance to right goal
    const threshold = 160;

    for (const [dist, side] of [[leftDist, 'left'], [rightDist, 'right']]) {
      if (dist < threshold) {
        const intensity = (1 - dist / threshold) * 0.22;
        const pulse = 0.5 + 0.5 * Math.sin(now / 160);
        ctx.fillStyle = `rgba(255,50,50,${intensity * pulse})`;
        if (side === 'left') {
          ctx.fillRect(0, 0, threshold, this.height);
        } else {
          ctx.fillRect(this.width - threshold, 0, threshold, this.height);
        }
      }
    }
  }

  _drawGoals() {
    const ctx = this.ctx;
    const { goalWidth, goalDepth } = this._fieldCfg;
    const yTop    = this.height / 2 - goalWidth / 2;
    const yBottom = yTop + goalWidth;
    const postW   = 6;   // goal-post bar thickness
    const netDepth = goalDepth + 4; // net drawn inward from edge

    // ── LEFT GOAL (drawn inward from x=0) ──────────────────────────────
    ctx.save();

    // Darker net backing
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.fillRect(0, yTop, netDepth, goalWidth);

    // Net grid lines
    ctx.strokeStyle = COLORS.goalNet;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const y = yTop + (goalWidth * i) / 6;
      ctx.moveTo(0, y);
      ctx.lineTo(netDepth, y);
    }
    for (let i = 0; i <= 4; i++) {
      const x = (netDepth * i) / 4;
      ctx.moveTo(x, yTop);
      ctx.lineTo(x, yBottom);
    }
    ctx.stroke();

    // White goal posts (visible thick bars on the field edge)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, yTop - postW, postW, postW);          // top post
    ctx.fillRect(0, yBottom,      postW, postW);          // bottom post
    // Crossbar along left edge
    ctx.fillRect(0, yTop - postW, 2, goalWidth + postW * 2);

    // Team A label inside goal
    ctx.font = 'bold 11px ui-sans-serif, system-ui';
    ctx.fillStyle = 'rgba(255,100,100,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RED', netDepth / 2, this.height / 2);

    ctx.restore();

    // ── RIGHT GOAL (drawn inward from x=width) ─────────────────────────
    ctx.save();

    // Darker net backing
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.fillRect(this.width - netDepth, yTop, netDepth, goalWidth);

    // Net grid lines
    ctx.strokeStyle = COLORS.goalNet;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const y = yTop + (goalWidth * i) / 6;
      ctx.moveTo(this.width - netDepth, y);
      ctx.lineTo(this.width, y);
    }
    for (let i = 0; i <= 4; i++) {
      const x = this.width - netDepth + (netDepth * i) / 4;
      ctx.moveTo(x, yTop);
      ctx.lineTo(x, yBottom);
    }
    ctx.stroke();

    // White goal posts
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.width - postW, yTop - postW, postW, postW); // top post
    ctx.fillRect(this.width - postW, yBottom,      postW, postW); // bottom post
    // Crossbar along right edge
    ctx.fillRect(this.width - 2, yTop - postW, 2, goalWidth + postW * 2);

    // Team B label inside goal
    ctx.font = 'bold 11px ui-sans-serif, system-ui';
    ctx.fillStyle = 'rgba(100,160,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BLUE', this.width - netDepth / 2, this.height / 2);

    ctx.restore();
  }

  drawBall(ball) {
    const ctx = this.ctx;

    // Trail — scale size/opacity by speed
    const speed = ball.getSpeed();
    for (let i = 0; i < ball.trail.length; i++) {
      const t = ball.trail[i];
      const fraction = i / ball.trail.length;
      const speedScale = Math.min(1, speed / 8);
      ctx.fillStyle = `rgba(255,255,220,${0.22 * t.a * speedScale * fraction})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, ball.radius * (0.4 + 0.6 * fraction), 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(ball.x + 2, ball.y + 4, ball.radius * 1.1, ball.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball body (3D shaded sphere)
    const g = ctx.createRadialGradient(
      ball.x - ball.radius * 0.35, ball.y - ball.radius * 0.35, ball.radius * 0.1,
      ball.x, ball.y, ball.radius
    );
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, COLORS.ball);
    g.addColorStop(1, COLORS.ballShade);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Seam
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 0.65, 0.2, Math.PI + 0.2);
    ctx.stroke();
  }

  /** Draw ball at an arbitrary position (used during replay, no trail). */
  drawBallAt(x, y) {
    const ctx = this.ctx;
    const r = 9; // PHYSICS.ballRadius
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 4, r * 1.1, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, COLORS.ball);
    g.addColorStop(1, COLORS.ballShade);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Show a pulsing REPLAY badge during goal highlight playback. */
  drawReplayBadge() {
    const ctx = this.ctx;
    const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 200);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 13px ui-sans-serif, system-ui';
    const label = '⏪  REPLAY';
    const tw = ctx.measureText(label).width + 24;
    const bx = this.width - tw - 14;
    const by = 72;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.beginPath();
    ctx.roundRect(bx, by, tw, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + tw / 2, by + 12);
    ctx.restore();
  }

  drawPlayer(player, { selected = false, currentTurn = false } = {}) {
    if (player.stamina !== undefined) this._drawStaminaArc(player);
    const ctx = this.ctx;
    const { x, y } = player;
    const r = player.radius !== undefined ? player.radius : 14;
    const color = player.teamId === 0 ? COLORS.teamA : COLORS.teamB;

    // Shadow
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 5, r * 1.15, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight ring (selection / current turn)
    if (selected) {
      ctx.strokeStyle = COLORS.highlight;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r + 5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (currentTurn) {
      ctx.strokeStyle = 'rgba(255,209,102,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body (horse token) — rounded disc with shading
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, r * 0.2, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.2, color);
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Rim
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Jersey number area (inner disc)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = 'bold 11px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayId = player.id !== undefined ? player.id : (player.role === 'attacker' ? 0 : player.role === 'allrounder' ? 1 : player.role === 'playmaker' ? 2 : 3);
    ctx.fillText(String(displayId + 1), x, y + 0.5);

    // Mallet — only for live Player objects
    if (typeof player.getMalletTip === 'function') this._drawMallet(player);

    // Facing indicator
    const facing = player.facing !== undefined ? player.facing : 0;
    const fx = x + Math.cos(facing) * (r - 2);
    const fy = y + Math.sin(facing) * (r - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(fx, fy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawStaminaArc(player) {
    if (player.stamina >= 0.99) return; // full — no arc needed
    const ctx = this.ctx;
    const { x, y, radius: r } = player;
    const pct = player.stamina;
    // Colour: green → orange → red
    const hue = Math.round(pct * 120); // 0=red, 120=green
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 3.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = `hsl(${hue},90%,55%)`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawMallet(player) {
    const ctx = this.ctx;
    const tip = player.getMalletTip();
    const startX = player.x;
    const startY = player.y;

    // Shaft
    ctx.strokeStyle = COLORS.mallet;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();

    // Shaft shadow
    ctx.strokeStyle = COLORS.malletDark;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(startX + 0.5, startY + 0.8);
    ctx.lineTo(tip.x + 0.5, tip.y + 0.8);
    ctx.stroke();

    // Mallet head (small cylinder at tip, perpendicular to shaft)
    const perp = tip.angle + Math.PI / 2;
    const hx1 = tip.x + Math.cos(perp) * 4;
    const hy1 = tip.y + Math.sin(perp) * 4;
    const hx2 = tip.x - Math.cos(perp) * 4;
    const hy2 = tip.y - Math.sin(perp) * 4;
    ctx.strokeStyle = '#f3e2b7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx1, hy1);
    ctx.lineTo(hx2, hy2);
    ctx.stroke();
    ctx.strokeStyle = COLORS.malletDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx1, hy1);
    ctx.lineTo(hx2, hy2);
    ctx.stroke();
  }

  drawMoveRadius(player, rowBonus = 0, staminaMult = 1.0) {
    const ctx = this.ctx;
    const baseR = MOVEMENT.moveRadius * staminaMult;
    ctx.save();
    ctx.setLineDash([6, 6]);
    // Tint orange when stamina is low
    ctx.strokeStyle = staminaMult < 1 ? 'rgba(255,140,40,0.65)' : 'rgba(255,209,102,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, baseR, 0, Math.PI * 2);
    ctx.stroke();

    if (rowBonus > 0) {
      // Outer ring shows extended ROW reach
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = 'rgba(100,255,180,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, MOVEMENT.moveRadius + rowBonus, 0, Math.PI * 2);
      ctx.stroke();
      // Small label
      ctx.setLineDash([]);
      ctx.font = 'bold 10px ui-sans-serif, system-ui';
      ctx.fillStyle = 'rgba(100,255,180,0.85)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RIGHT OF WAY', player.x, player.y - baseR - rowBonus - 10);
    }
    ctx.restore();
  }

  drawMoveGhost(player, mx, my, valid) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = valid ? (player.teamId === 0 ? COLORS.teamA : COLORS.teamB) : '#888';
    ctx.beginPath();
    ctx.arc(mx, my, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawFlickAim(ball, dragStart, dragEnd) {
    const ctx = this.ctx;
    // Drag vector
    const dx = dragEnd.x - dragStart.x;
    const dy = dragEnd.y - dragStart.y;
    const len = Math.hypot(dx, dy);
    const maxLen = PHYSICS.maxDragDistance;
    const clampedLen = Math.min(len, maxLen);
    const ratio = clampedLen / maxLen;
    const nx = len ? -dx / len : 0;
    const ny = len ? -dy / len : 0;

    // Aim arrow from ball in flick direction
    const tipX = ball.x + nx * clampedLen;
    const tipY = ball.y + ny * clampedLen;

    ctx.save();
    // Pull-back indicator (dashed from ball to cursor)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(dragEnd.x, dragEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Flick arrow
    const power = ratio;
    const arrowColor = `rgba(${255}, ${Math.round(209 - power * 100)}, ${Math.round(102 - power * 80)}, 0.95)`;
    ctx.strokeStyle = arrowColor;
    ctx.fillStyle = arrowColor;
    ctx.lineWidth = 3 + power * 3;
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Arrow head
    const ah = 10 + power * 6;
    const ang = Math.atan2(ny, nx);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - Math.cos(ang - 0.4) * ah, tipY - Math.sin(ang - 0.4) * ah);
    ctx.lineTo(tipX - Math.cos(ang + 0.4) * ah, tipY - Math.sin(ang + 0.4) * ah);
    ctx.closePath();
    ctx.fill();

    // Power meter bar
    const pmW = 120, pmH = 8;
    const pmX = ball.x - pmW / 2;
    const pmY = ball.y - 30;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(pmX, pmY, pmW, pmH);
    ctx.fillStyle = arrowColor;
    ctx.fillRect(pmX, pmY, pmW * ratio, pmH);
    ctx.restore();
  }

  drawImpact() {
    if (this.impact.a <= 0) return;
    const ctx = this.ctx;
    const { x, y, a } = this.impact;

    // Ring
    ctx.save();
    ctx.strokeStyle = `rgba(255,220,60,${a * 0.9})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 9 + (1 - a) * 14, 0, Math.PI * 2);
    ctx.stroke();

    // Sparks
    ctx.fillStyle = `rgba(255,200,40,${a * 0.85})`;
    for (const s of this.impact.sparks) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    this.impact.a = Math.max(0, this.impact.a - 0.06);
  }

  drawGoalFlash() {
    if (this.flash.a <= 0) return;
    const ctx = this.ctx;
    const c = this.flash.team === 0 ? COLORS.teamA : COLORS.teamB;
    ctx.save();
    ctx.globalAlpha = this.flash.a;
    ctx.fillStyle = c;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
    this.flash.a = Math.max(0, this.flash.a - 0.02);
  }

  tickScorePulse() {
    this.scorePulse[0] = Math.max(0, this.scorePulse[0] - 0.04);
    this.scorePulse[1] = Math.max(0, this.scorePulse[1] - 0.04);
  }

  triggerGoalFlash(teamId) {
    this.flash.a = 0.45;
    this.flash.team = teamId;
  }

  // ── Line of Ball ─────────────────────────────────────────────────────────
  drawLineOfBall(ball) {
    if (ball.lobAlpha <= 0.02) return;
    const ctx = this.ctx;
    const len = 560; // how far the LOB extends across the field
    const ex = ball.lobX + Math.cos(ball.lobAngle) * len;
    const ey = ball.lobY + Math.sin(ball.lobAngle) * len;
    // Backward extension (opposite direction)
    const bx = ball.lobX - Math.cos(ball.lobAngle) * len;
    const by = ball.lobY - Math.sin(ball.lobAngle) * len;

    ctx.save();
    ctx.globalAlpha = ball.lobAlpha * 0.55;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // Right-of-way arrowhead in the forward direction
    ctx.setLineDash([]);
    ctx.globalAlpha = ball.lobAlpha * 0.8;
    ctx.fillStyle = COLORS.highlight;
    const ah = 10;
    const ang = ball.lobAngle;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - Math.cos(ang - 0.38) * ah, ey - Math.sin(ang - 0.38) * ah);
    ctx.lineTo(ex - Math.cos(ang + 0.38) * ah, ey - Math.sin(ang + 0.38) * ah);
    ctx.closePath();
    ctx.fill();

    // Label near arrowhead
    ctx.globalAlpha = ball.lobAlpha * 0.75;
    ctx.font = 'bold 10px ui-sans-serif, system-ui';
    ctx.fillStyle = COLORS.highlight;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LINE', ex + Math.cos(ang + Math.PI / 2) * 14,
                         ey + Math.sin(ang + Math.PI / 2) * 14);
    ctx.restore();
  }

  // ── Ride-off flash ──────────────────────────────────────────────────────
  drawRideOffFlashes(flashes) {
    if (!flashes || flashes.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    for (const f of flashes) {
      const a = Math.max(0, f.alpha);
      ctx.globalAlpha = a;
      ctx.strokeStyle = COLORS.highlight;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(f.player.x, f.player.y, f.player.radius + 6 + (1 - a) * 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Hook prompt ─────────────────────────────────────────────────────────
  drawHookPrompt(ball) {
    const ctx = this.ctx;
    const pulse = 0.7 + 0.3 * Math.sin(performance.now() / 120);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 13px ui-sans-serif, system-ui';
    const label = 'Press  H  to HOOK!';
    const tw = ctx.measureText(label).width + 24;
    const tx = ball.x - tw / 2;
    const ty = ball.y - 48;
    // Badge background
    ctx.fillStyle = 'rgba(255,80,80,0.82)';
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, 24, 6);
    ctx.fill();
    // Text
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, ball.x, ty + 12);
    ctx.restore();
  }

  // ── Commentary ticker ────────────────────────────────────────────────────
  showCommentary(text) {
    this.commentaryText  = text;
    this.commentaryAlpha = 1.4; // starts above 1 so it holds at full for a moment
  }

  draw2PTurnBanner(teamId) {
    const ctx = this.ctx;
    const label = teamId === 0 ? '🔴  RED — YOUR TURN' : '🔵  BLUE — YOUR TURN';
    const color = teamId === 0 ? 'rgba(180,30,30,0.88)' : 'rgba(30,80,180,0.88)';
    ctx.save();
    ctx.font = 'bold 13px ui-sans-serif, system-ui';
    const tw = ctx.measureText(label).width + 28;
    const bx = this.width / 2 - tw / 2;
    const by = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bx, by, tw, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, this.width / 2, by + 12);
    ctx.restore();
  }

  drawCommentary() {
    if (this.commentaryAlpha <= 0) return;
    const ctx = this.ctx;
    const alpha = Math.min(1, this.commentaryAlpha);
    const W = this.width;
    const H = this.height;

    ctx.save();
    ctx.globalAlpha = alpha;
    // Background pill
    const tw = ctx.measureText(this.commentaryText).width + 28;
    const tx = W / 2 - tw / 2;
    const ty = H - 60;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, 22, 6);
    ctx.fill();
    // Text
    ctx.font = '12px ui-sans-serif, system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.commentaryText, W / 2, ty + 11);
    ctx.restore();

    this.commentaryAlpha = Math.max(0, this.commentaryAlpha - 0.008);
  }
}
