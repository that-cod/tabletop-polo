// DOM overlay menus (start, pause, game over)
import { HANDICAP } from '../utils/constants.js';

export class Menus {
  constructor(overlayEl) {
    this.el = overlayEl;
  }

  clear() { this.el.innerHTML = ''; }

  showStart(onStart) {
    this.clear();
    const div = document.createElement('div');
    div.className = 'menu';
    div.innerHTML = `
      <h1>TABLETOP POLO</h1>
      <p>Flick, strategise, score. 4 chukkas to victory.</p>
      <p style="font-size:12px;opacity:0.6;margin-bottom:6px;">SELECT SKILL TIER</p>
      ${this._tierButtons()}
      <button class="secondary" data-act="how">How to Play</button>
    `;
    this.el.appendChild(div);
    this._wireTierButtons(div, onStart);
    div.querySelector('[data-act="how"]').onclick = () => this.showHowTo(onStart);
  }

  _tierButtons() {
    const styles = { novice: '#2e7d4f', club: '#e8a020', pro: '#c0392b' };
    return `<div style="display:flex;gap:8px;margin-bottom:10px;">
      ${Object.entries(HANDICAP).map(([key, t]) =>
        `<button style="flex:1;background:${styles[key]};font-size:12px;" data-tier="${key}">
          <b>${t.label}</b><br><span style="font-size:10px;opacity:0.85;">${t.desc}</span>
        </button>`
      ).join('')}
    </div>`;
  }

  _wireTierButtons(div, cb) {
    Object.keys(HANDICAP).forEach(key => {
      div.querySelector(`[data-tier="${key}"]`).onclick = () => { this.clear(); cb(key); };
    });
  }

  showHowTo(onStart) {
    this.clear();
    const div = document.createElement('div');
    div.className = 'menu';
    div.style.textAlign = 'left';
    div.style.maxWidth = '480px';
    div.innerHTML = `
      <h1 style="text-align:center">How to Play</h1>
      <p style="text-align:center">Turn-based, physics polo.</p>
      <ul style="line-height:1.7; font-size:14px; padding-left:18px; margin:12px 0;">
        <li><b>Click</b> one of your RED players to select them.</li>
        <li>If the ball is in <b>mallet reach</b>: click &amp; drag from the <b>ball</b>, pulling back — release to flick (slingshot).</li>
        <li>Otherwise: click any spot within the dashed radius to move there.</li>
        <li>After your action, the BLUE AI takes a turn when things stop.</li>
        <li>Score by knocking the ball into the opposing goal.</li>
        <li>Match = 4 chukkas of 2 minutes each. Highest score wins.</li>
        <li><b>Ends swap</b> after every goal — teams change direction like real polo.</li>
        <li>If tied after chukka 4 → <b>Golden Chukka</b> (sudden death — first goal wins).</li>
      </ul>
      <button data-act="start">Start Match</button>
      <button class="secondary" data-act="back">Back</button>
    `;
    this.el.appendChild(div);
    div.querySelector('[data-act="start"]').onclick = () => { this.clear(); onStart('club'); };
    div.querySelector('[data-act="back"]').onclick = () => this.showStart(onStart);
  }

  showPause(onResume, onRestart) {
    this.clear();
    const div = document.createElement('div');
    div.className = 'menu';
    div.innerHTML = `
      <h1>PAUSED</h1>
      <button data-act="resume">Resume</button>
      <button class="secondary" data-act="restart">Restart Match</button>
    `;
    this.el.appendChild(div);
    div.querySelector('[data-act="resume"]').onclick = () => { this.clear(); onResume(); };
    div.querySelector('[data-act="restart"]').onclick = () => { this.clear(); onRestart(); };
  }

  showGameOver(teamAScore, teamBScore, winner, onRestart, stats = null) {
    this.clear();
    const div = document.createElement('div');
    div.className = 'menu';
    const title = winner === -1 ? 'DRAW!' : (winner === 0 ? 'RED WINS! 🏆' : 'BLUE WINS! 🏆');
    const sub   = winner === -1 ? 'A well-fought draw.' : (winner === 0 ? 'Excellent polo!' : 'The AI takes it!');
    const statsHtml = stats ? this._statsHtml(stats) : '';
    div.innerHTML = `
      <h1>${title}</h1>
      <p>${sub}</p>
      <div class="score-row">
        <span class="red">${teamAScore}</span>
        <span>–</span>
        <span class="blue">${teamBScore}</span>
      </div>
      ${statsHtml}
      <p style="font-size:12px;opacity:0.6;margin-bottom:6px;">PLAY AGAIN — SELECT TIER</p>
      ${this._tierButtons()}
    `;
    this.el.appendChild(div);
    this._wireTierButtons(div, onRestart);
  }

  _statsHtml(stats) {
    const pct = (n, d) => d > 0 ? Math.round((n / d) * 100) : 50;
    const totalFlicks = stats.flicksA + stats.flicksB;
    const pctA = pct(stats.flicksA, totalFlicks);
    const longestM = (stats.longestShot / 96).toFixed(1); // scaled to "yards"
    return `
      <div style="font-size:12px;margin:10px 0 6px;opacity:0.85;text-align:left;background:rgba(0,0,0,0.3);border-radius:6px;padding:10px 14px;">
        <div style="margin-bottom:6px;font-weight:bold;opacity:0.6;">MATCH STATS</div>
        <div style="display:flex;justify-content:space-between;"><span>💫 Flicks</span><span><span style="color:#d93636">${stats.flicksA}</span> vs <span style="color:#2b6fd6">${stats.flicksB}</span></span></div>
        <div style="display:flex;justify-content:space-between;"><span>🏁 Possession</span><span><span style="color:#d93636">${pctA}%</span> RED</span></div>
        <div style="display:flex;justify-content:space-between;"><span>🎦 Longest Shot</span><span>${longestM} yds</span></div>
        <div style="display:flex;justify-content:space-between;"><span>⚠️ Fouls</span><span><span style="color:#d93636">${stats.foulsA}</span> RED / <span style="color:#2b6fd6">${stats.foulsB}</span> BLUE</span></div>
      </div>`;
  }

  showShootout(roundData, onDone) {
    this.clear();
    const div = document.createElement('div');
    div.className = 'menu';
    div.innerHTML = `
      <h1 style="color:#ffd166">⚽ PENALTY SHOOTOUT</h1>
      <p>Still level after overtime!</p>
      <p style="font-size:13px;opacity:0.8;">3 penalty shots each — sudden death from round 4</p>
      <div style="margin:14px 0;font-size:22px;letter-spacing:2px;">${roundData}</div>
      <button data-act="go">Begin Shootout</button>
    `;
    this.el.appendChild(div);
    div.querySelector('[data-act="go"]').onclick = () => { this.clear(); onDone(); };
  }

  showHalftime(scoreA, scoreB, onContinue) {
    this.clear();
    const div = document.createElement('div');
    div.className = 'menu';
    const msg = scoreA > scoreB ? `💥 RED leads! Keep the pressure on!`
               : scoreB > scoreA ? `🚨 BLUE leads — time to fight back!`
               : `⚔️ Level at half-time — anything can happen!`;
    div.innerHTML = `
      <h1 style="color:#ffd166">HALF TIME</h1>
      <div class="score-row">
        <span class="red">${scoreA}</span>
        <span>–</span>
        <span class="blue">${scoreB}</span>
      </div>
      <p>${msg}</p>
      <p style="font-size:11px;opacity:0.55;">Spectators are stomping the divots…</p>
      <button data-act="continue">Continue</button>
    `;
    this.el.appendChild(div);
    div.querySelector('[data-act="continue"]').onclick = () => { this.clear(); onContinue(); };
  }
}
