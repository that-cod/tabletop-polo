// DOM overlay menus (start, pause, game over)

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
      <p style="font-size:12px;opacity:0.6;margin-bottom:6px;">SELECT DIFFICULTY</p>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button style="flex:1;" data-diff="easy">Easy</button>
        <button style="flex:1;background:#e8a020;" data-diff="medium">Medium</button>
        <button style="flex:1;background:#c0392b;" data-diff="hard">Hard</button>
      </div>
      <button class="secondary" data-act="how">How to Play</button>
    `;
    this.el.appendChild(div);
    div.querySelector('[data-diff="easy"]').onclick   = () => { this.clear(); onStart('easy'); };
    div.querySelector('[data-diff="medium"]').onclick = () => { this.clear(); onStart('medium'); };
    div.querySelector('[data-diff="hard"]').onclick   = () => { this.clear(); onStart('hard'); };
    div.querySelector('[data-act="how"]').onclick = () => this.showHowTo(onStart);
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
    div.querySelector('[data-act="start"]').onclick = () => { this.clear(); onStart('medium'); };
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

  showGameOver(teamAScore, teamBScore, winner, onRestart) {
    this.clear();
    const div = document.createElement('div');
    div.className = 'menu';
    const title = winner === -1 ? 'DRAW!' : (winner === 0 ? 'RED WINS! 🏆' : 'BLUE WINS! 🏆');
    const sub   = winner === -1 ? 'A well-fought draw.' : (winner === 0 ? 'Excellent polo!' : 'The AI takes it!');
    div.innerHTML = `
      <h1>${title}</h1>
      <p>${sub}</p>
      <div class="score-row">
        <span class="red">${teamAScore}</span>
        <span>–</span>
        <span class="blue">${teamBScore}</span>
      </div>
      <p style="font-size:12px;opacity:0.6;margin-bottom:6px;">PLAY AGAIN — SELECT DIFFICULTY</p>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button style="flex:1;" data-diff="easy">Easy</button>
        <button style="flex:1;background:#e8a020;" data-diff="medium">Medium</button>
        <button style="flex:1;background:#c0392b;" data-diff="hard">Hard</button>
      </div>
    `;
    this.el.appendChild(div);
    div.querySelector('[data-diff="easy"]').onclick   = () => { this.clear(); onRestart('easy'); };
    div.querySelector('[data-diff="medium"]').onclick = () => { this.clear(); onRestart('medium'); };
    div.querySelector('[data-diff="hard"]').onclick   = () => { this.clear(); onRestart('hard'); };
  }
}
