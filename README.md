# 🏑 Tabletop Polo

A fast-paced, physics-based browser polo game. Turn-based flicking mechanics, Matter.js physics, WebAudio sound, no assets required — runs entirely in the browser.

---

## 🚀 Deploy to Netlify (recommended)

### Option A — Git-connected (auto-deploys on push)

1. Push this repo to GitHub / GitLab / Bitbucket
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
3. Connect your repo
4. Netlify auto-detects `netlify.toml` — no settings needed
5. Click **Deploy site**

Every `git push` to `main` triggers a new deploy automatically.

### Option B — Drag & drop (instant, no Git required)

```bash
npm install
npm run build
```

Then drag the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

---

## Why Netlify over Railway?

| | Netlify | Railway |
|---|---|---|
| **This project needs** | Static file hosting | — |
| **Free tier** | ✅ Generous (100GB bandwidth/mo) | ⚠️ Limited, credit-based |
| **Deploy method** | Git push or drag-and-drop | Docker / server process |
| **CDN** | ✅ Global edge network built-in | ❌ Single region |
| **Config needed** | `netlify.toml` (already done) | `Dockerfile` + port binding |
| **Verdict** | ✅ **Perfect fit** | ❌ Overkill — for apps with servers |

Railway is the right choice only if you add a backend (leaderboard API, multiplayer server, etc.). For this game: Netlify.

---

## 🛠 Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

---

## 🎮 Controls

| Action | How |
|---|---|
| **Select player** | Click a RED token |
| **Move** | Click anywhere inside the dashed radius |
| **Flick ball** | With a player selected and ball in reach — click the ball, **drag backward** (slingshot), release |
| **Pause** | `P` or `Esc` |

---

## 📁 Project structure

```
src/
├── index.html          Entry HTML (SEO + meta tags)
├── styles.css          Dark theme, menus, canvas
├── main.js             Boot
├── core/
│   ├── Engine.js       Matter.js world, walls, goal sensors
│   ├── Renderer.js     Field, goals, ball, players, effects
│   └── Game.js         Scene machine, input, AI wiring
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
│   ├── HUD.js          Canvas HUD (score, timer, turn)
│   └── Menus.js        DOM overlay menus
├── audio/Sounds.js     WebAudio synth (no files needed)
└── utils/
    ├── constants.js    ← All tunables live here
    ├── math.js
    └── debug.js

netlify.toml            Build + cache + security headers
```

---

## ⚙️ Tuning

Everything tweakable is in `src/utils/constants.js`:

```js
PHYSICS.ballFrictionAir   // 0.018 → lower = travels further
PHYSICS.maxDragDistance   // 160 → longer drag = more power range
MOVEMENT.moveRadius       // 150px → per-turn move range
MOVEMENT.stopHoldMs       // 4000ms → how long ball must rest before turn ends
MATCH.chukkaSeconds       // 120 → 2 min per chukka (8 min match)
AI.longShotChance         // 0.25 → 25% aggressive shots
AI.reactionMs             // 420ms → AI think time
``` 🏑

A physics-based, browser-playable tabletop polo game inspired by *Free Flick Football* but adapted for polo mechanics. Control mounted polo players, move them strategically, and flick a ball using a **mallet with physical reach**.

---

## Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- Modern web browser (Chrome, Firefox, Safari)

### Setup
```bash
# Clone/create project directory
mkdir tabletop-polo && cd tabletop-polo

# Install dependencies
npm install matter-js

# Start dev server
npm run dev
```

The game opens at `http://localhost:3000` with hot-reload.

---

## What's in This Repo?

### Documentation Files (READ THESE FIRST)

| File | Purpose |
|---|---|
| **CLAUDE.md** | Project overview, vision, tech stack, phases |
| **ARCHITECTURE.md** | System design, entity models, data flow, core systems |
| **DESIGN.md** | Visual design, field layout, token sprites, rendering |
| **PHYSICS.md** | Physics tuning, collision system, formulas, debugging |
| **GAMEPLAY.md** | Game rules, turn structure, AI logic, possession mechanics |
| **DEVELOPMENT.md** | Setup, build process, debugging, deployment |
| **QUICK_REFERENCE.md** | Cheat sheet for common operations & patterns |
| **README.md** | This file |

### Source Code Structure

```
src/
├── main.js                    # Game initialization & loop
├── index.html                 # HTML entry point
├── core/                      # Core systems (Engine, GameState, Renderer)
├── entities/                  # Game objects (Ball, Player, Team, Match)
├── input/                     # Input handling (click, drag, keyboard)
├── physics/                   # Physics configuration & mallet reach
├── ai/                        # AI opponent logic
├── systems/                   # Game systems (turns, goals, chukkas, possession)
├── ui/                        # UI rendering (HUD, menus)
└── utils/                     # Helpers & constants
```

---

## Game Overview

### Objective
Score more goals than your opponent by flicking a ball into their goal zone over the course of 4 chukkas (7-minute periods each).

### Core Mechanics

1. **Click to Move**: Select a player token and click where you want them to move (within movement radius).
2. **Drag to Flick**: From the player's **mallet tip**, drag backward (slingshot style) and release to flick the ball.
3. **Turn-Based**: Players alternate flicks. Ball must stop before next team's turn.
4. **Scoring**: Ball enters opponent's goal zone = goal. First to highest score after 4 chukkas wins.

### Key Difference from Free Flick Football

| Aspect | Football | **Polo** |
|---|---|---|
| Players | None (ball only) | **4 per team (controllable)** |
| Flick origin | Ball center | **Mallet tip (extends from player)** |
| Movement | None | **Click to move within radius** |
| Match structure | Simple timer | **Chukkas (periods with resets)** |
| Tactics | Power & angle | **Positioning, blocking, coordination** |

---

## Technology Stack

- **Frontend**: Next.js or vanilla HTML/JS (choose simple for v1)
- **Rendering**: HTML5 Canvas 2D context
- **Physics**: Matter.js v0.19+ (rigid body engine)
- **Build**: Vite
- **Multiplayer** (v2): Socket.io + Node.js backend

---

## Development Roadmap

### Phase 1: MVP (Core Game Loop)
- [x] Project structure & documentation
- [ ] Canvas setup + field rendering
- [ ] Matter.js physics world
- [ ] Player movement (click-to-move)
- [ ] Mallet reach & flick mechanics
- [ ] Turn alternation & ball stop detection
- [ ] Basic scoring

**Playable**: 1v1 game (you vs AI, no timer)

### Phase 2: Full Gameplay
- [ ] Chukka system (7-min periods, resets)
- [ ] Improved AI (difficulty levels)
- [ ] Possession tracking
- [ ] Full match structure (4 chukkas)

**Playable**: Complete single-player match

### Phase 3: Polish
- [ ] Sound effects (goal horn, whistle, flick)
- [ ] Animations (goal celebration, movement ease)
- [ ] Menu system (start, pause, restart)
- [ ] Field visuals (grass texture, token colors)

**Release**: Solo game ready to share

### Phase 4: Multiplayer (Future)
- [ ] Backend server (Node.js + Socket.io)
- [ ] Online lobbies & game sync
- [ ] Player-vs-player support
- [ ] Leaderboards (optional)

---

## Running the Game

### Development Mode
```bash
npm run dev
```
- Hot-reload enabled
- Source maps available
- Dev server at http://localhost:3000

### Production Build
```bash
npm run build
npm run preview
```
- Minified & optimized
- Output in `dist/` folder
- Ready to deploy

### Deploying

**GitHub Pages**:
```bash
npm run build
npm run deploy  # (requires gh-pages plugin)
```

**Vercel**:
1. Push to GitHub
2. Import repo at vercel.com
3. Build command: `npm run build`
4. Output: `dist/`

---

## File Reading Order

**If you're new to the project:**

1. Start here: **CLAUDE.md** (10 min) — Understand the vision
2. Then: **ARCHITECTURE.md** (15 min) — Learn the structure
3. Then: **DESIGN.md** (10 min) — Visualize the game
4. Then: **PHYSICS.md** (10 min) — Understand physics tuning
5. Then: **GAMEPLAY.md** (10 min) — Learn the rules
6. Then: **DEVELOPMENT.md** (5 min) — Set up your environment
7. Bookmark: **QUICK_REFERENCE.md** — Use while coding

**Total time**: ~60 minutes to understand the whole system.

---

## Key Constants & Configs

All magic numbers are in **`src/utils/constants.js`**:

```javascript
// Physics
PHYSICS_CONFIG.BALL.restitution = 0.45;   // Bounciness
PHYSICS_CONFIG.PLAYER.malletReach = 18;   // Mallet length

// Field
FIELD_CONFIG.width = 640;
FIELD_CONFIG.height = 400;

// Match
MATCH_CONFIG.maxChukkas = 4;
MATCH_CONFIG.chukkaTimeSeconds = 420;    // 7 minutes

// AI
AI_CONFIG.difficulty = { easy, medium, hard };
```

Changing any of these is a **single-point edit**. No magic numbers scattered through code.

---

## Physics & Tuning

### Common Tuning Scenarios

**Ball feels too bouncy?**
```javascript
PHYSICS_CONFIG.BALL.restitution = 0.35;  // Lower from 0.45
```

**Ball slides forever?**
```javascript
PHYSICS_CONFIG.BALL.frictionAir = 0.06;  // Increase from 0.04
```

**Flicks don't go far enough?**
```javascript
// In FlickSystem.js
const forceMagnitude = flickPower * 0.5;  // Increase from 0.3
```

See **PHYSICS.md** for detailed tuning guide.

---

## Debugging

### Console Logging
```javascript
import { log } from './utils/debug.js';

log('gameState', 'Turn ended', { team: 0 });
log('physics', 'Ball speed:', speed);
```

Toggle debug output in `constants.js`:
```javascript
DEBUG_FLAGS.logTurns = true;
DEBUG_FLAGS.logGoals = true;
```

### Browser DevTools
1. Open DevTools (F12)
2. Go to Sources tab
3. Set breakpoints on line numbers
4. Trigger code (flick the ball)
5. Inspect variables in console

### Matter.js Debug Renderer
```javascript
// In main.js with ?debug query string
if (window.location.search.includes('debug')) {
  const debugRender = createDebugRenderer(gameEngine.engine);
  Matter.Render.run(debugRender);
}
```

Visit: http://localhost:3000/?debug

---

## Testing

### Manual Checklist

Before release, test:
- [ ] Ball physics (rolls smoothly, stops naturally)
- [ ] Player movement (click-to-move within radius)
- [ ] Mallet line (extends correctly from player)
- [ ] Flick arrow (shows power/angle preview)
- [ ] Turn switching (after ball stops)
- [ ] Goal detection (score increments)
- [ ] Chukka timer (counts down, resets)
- [ ] AI moves (sensible, competitive)
- [ ] UI updates (scoreboard, timer, turn)
- [ ] Edge cases (boundary, overlaps, out-of-bounds)

### Automated Tests (Vitest)

```bash
npm test
```

Write tests in `tests/` directory.

---

## Project Stats

| Metric | Value |
|---|---|
| **Lines of code** (target) | ~3000–4000 |
| **Documentation** | 7 files, ~6000 words |
| **Main classes** | 12 (Ball, Player, Team, Match, Engine, etc.) |
| **Physics bodies** | Ball + 8 players + boundaries + goal zones |
| **Game states** | Menu → Playing → ChukkaEnd → MatchEnd → Menu |

---

## Common Questions

### Q: How do I change the field size?
**A**: Edit `FIELD_CONFIG` in `src/utils/constants.js`. All rendering uses these values.

### Q: How do I adjust physics (ball speed, friction)?
**A**: Edit `PHYSICS_CONFIG` in `src/utils/constants.js`. See **PHYSICS.md** for tuning guide.

### Q: How do I make the AI harder/easier?
**A**: Change AI difficulty in `AI_CONFIG` (angle noise, power range, reaction time).

### Q: How do I add multiplayer?
**A**: Follow Phase 4 in **DEVELOPMENT.md**. Requires Node.js backend + Socket.io.

### Q: How do I deploy the game?
**A**: See **DEVELOPMENT.md** → Deployment section. GitHub Pages (free) or Vercel (recommended).

---

## Resources

### Official Documentation
- [Matter.js Docs](https://brm.io/matter-js/)
- [Canvas API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Vite Docs](https://vitejs.dev/)

### Inspiration
- **Free Flick Football** (freeflickfootball.com) — Flick mechanics
- **Subbuteo** — Tabletop sports positioning
- **Blood Bowl** — Turn-based team coordination

---

## Contributing

Pull requests welcome! For major changes:

1. Open an issue first
2. Discuss the approach
3. Implement in feature branch
4. Test thoroughly
5. Submit PR with description

---

## License

MIT (open source, do what you want with it)

---

## Credits

- **Physics**: Matter.js (Liam Brummitt)
- **Inspiration**: Free Flick Football, Subbuteo, Blood Bowl
- **Built by**: You! (Future developer) 🎮

---

## Troubleshooting

### "Canvas is blank"
- Check `<canvas id="game-canvas">` exists in HTML
- Verify `drawField()`, `drawBall()`, `drawTeam()` are called in render loop
- Open DevTools console for JS errors

### "npm install fails"
```bash
npm cache clean --force
npm install
```

### "Vite won't start"
```bash
npm uninstall vite
npm install vite@latest --save-dev
npm run dev
```

### "Game runs slow"
- Check Matter.js bodies are sleeping (`enableSleeping: true`)
- Reduce collision checks with proper collision groups
- Profile with DevTools Performance tab

---

## Next Steps

1. **Read**: CLAUDE.md (overview)
2. **Understand**: ARCHITECTURE.md (system design)
3. **Setup**: Run `npm install` and `npm run dev`
4. **Code**: Create files in build order (see DEVELOPMENT.md)
5. **Test**: Verify physics, input, and rendering work
6. **Iterate**: Tweak constants.js, test, repeat

**Estimated time to playable MVP**: 1–2 weeks (20–40 hours of focused work)

---

**Good luck! May your flicks be true and your goals be many.** ⚪🏑

---

*For questions, refer to the documentation files. For bugs or feature requests, check the GitHub issues.*

Last updated: April 2026
