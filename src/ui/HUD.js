import { FIELD, COLORS, MATCH } from '../utils/constants.js';

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.announce = { text: '', a: 0 };
  }

  // scorePulse: [teamAValue, teamBValue] — 0-1.5 fades to 0 each frame
  draw(match, turnManager, scorePulse = [0, 0]) {
    const ctx = this.ctx;
    const W = this.canvas.width;

    // Top bar background
    ctx.save();
    const h = 60;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0.62)');
    g.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, h);

    // --- Team A (left) score ---
    const pulseA = Math.min(1, scorePulse[0]);
    const scaleA = 1 + pulseA * 0.45;
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px ui-sans-serif, system-ui';
    ctx.fillStyle = COLORS.teamA;
    ctx.fillText('RED', 18, 18);
    ctx.font = `bold ${Math.round(28 * scaleA)}px ui-sans-serif, system-ui`;
    ctx.fillStyle = pulseA > 0.05 ? COLORS.highlight : '#fff';
    ctx.shadowColor = pulseA > 0.05 ? COLORS.highlight : 'transparent';
    ctx.shadowBlur = pulseA > 0.05 ? 12 * pulseA : 0;
    ctx.fillText(String(match.teamA.score), 18, 44);
    ctx.restore();

    // --- Team B (right) score ---
    const pulseB = Math.min(1, scorePulse[1]);
    const scaleB = 1 + pulseB * 0.45;
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px ui-sans-serif, system-ui';
    ctx.fillStyle = COLORS.teamB;
    ctx.fillText('BLUE', W - 18, 18);
    ctx.font = `bold ${Math.round(28 * scaleB)}px ui-sans-serif, system-ui`;
    ctx.fillStyle = pulseB > 0.05 ? COLORS.highlight : '#fff';
    ctx.shadowColor = pulseB > 0.05 ? COLORS.highlight : 'transparent';
    ctx.shadowBlur = pulseB > 0.05 ? 12 * pulseB : 0;
    ctx.fillText(String(match.teamB.score), W - 18, 44);
    ctx.restore();

    // --- Center: chukka label + chukka timer + total elapsed ---
    const totalElapsed = (match.chukka - 1) * MATCH.chukkaSeconds + (MATCH.chukkaSeconds - match.timeLeft);
    const teM = Math.floor(Math.max(0, totalElapsed) / 60);
    const teS = Math.floor(Math.max(0, totalElapsed) % 60);
    const totalStr = `${teM}:${teS.toString().padStart(2, '0')}`;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Chukka label
    ctx.font = '11px ui-sans-serif, system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(`CHUKKA ${match.chukka} / ${match.maxChukkas}`, W / 2, 11);

    // Chukka countdown (large)
    ctx.font = 'bold 22px ui-monospace, monospace';
    ctx.fillStyle = match.timeLeft < 20 ? COLORS.danger : COLORS.highlight;
    ctx.shadowColor = match.timeLeft < 20 ? COLORS.danger : 'transparent';
    ctx.shadowBlur = match.timeLeft < 20 ? 8 : 0;
    ctx.fillText(match.timeString(), W / 2, 33);

    // Total elapsed (small, below)
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.shadowBlur = 0;
    ctx.fillText(`total ${totalStr}`, W / 2, 51);
    ctx.restore();

    // --- Turn indicator bar (bottom) ---
    const teamName  = turnManager.currentTeamId === 0 ? 'RED' : 'BLUE';
    const teamColor = turnManager.currentTeamId === 0 ? COLORS.teamA : COLORS.teamB;
    const label     = turnManager.isHumanTurn() ? 'YOUR TURN' : `${teamName} (AI)`;

    ctx.save();
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px ui-sans-serif, system-ui';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(W / 2 - 80, this.canvas.height - 30, 160, 22);
    ctx.fillStyle = teamColor;
    ctx.fillText(label, W / 2, this.canvas.height - 12);
    ctx.restore();

    ctx.restore(); // outer save

    // --- Announcement ---
    if (this.announce.a > 0) {
      const alpha = Math.min(1, this.announce.a);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 72px ui-sans-serif, system-ui';
      ctx.fillStyle = COLORS.highlight;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 24;
      ctx.fillText(this.announce.text, this.canvas.width / 2, this.canvas.height / 2);
      ctx.restore();
      this.announce.a -= 0.014;
    }
  }

  showAnnouncement(text) {
    this.announce.text = text;
    this.announce.a = 1.6;
  }
}
