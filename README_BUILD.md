# Tabletop Polo — Build & Play

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Controls

- **Click** a RED player to select.
- If the ball is **within mallet reach** of the selected player: click on the ball and **drag backward** (slingshot), then release to flick.
- Otherwise: click anywhere inside the dashed radius to move the selected player there.
- **P** or **Esc**: pause.

## Structure

```
src/
├── index.html          Canvas + overlay host
├── styles.css          Menu & stage styling
├── main.js             Boot
├── core/
│   ├── Engine.js       Matter.js world, walls, goal sensors
│   ├── Renderer.js     Field, ball, players, mallet, aim UI
│   └── Game.js         Scene machine + input + AI wiring
├── entities/
│   ├── Ball.js
│   ├── Player.js
│   ├── Team.js
│   └── Match.js        Chukkas, timer, score, end conditions
├── input/InputManager.js
├── systems/
│   ├── TurnManager.js
│   └── GoalDetection.js
├── ai/AIOpponent.js
├── ui/
│   ├── HUD.js          Canvas HUD (scoreboard, timer, turn)
│   └── Menus.js        DOM overlay (start/pause/gameover)
├── audio/Sounds.js     WebAudio synth (no files)
└── utils/
    ├── constants.js    ALL tunables live here
    ├── math.js
    └── debug.js
```

## Tuning

Everything tweakable is in `src/utils/constants.js`:
- Field size, margins, goal opening
- Ball & player physics (restitution, friction, density)
- Flick range & power scale, mallet reach
- Move radius & speed, ball-stop detection
- Chukka count & length
- AI noise levels
