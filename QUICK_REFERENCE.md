# Tabletop Polo — QUICK REFERENCE

A cheat sheet for building the game. Refer here when you need a quick lookup.

---

## File Organization at a Glance

```
src/
├── main.js                  ← Game loop entry point
├── index.html               ← HTML entry
│
├── core/
│   ├── Engine.js            ← Matter.js world
│   ├── GameState.js         ← Global game state
│   └── Renderer.js          ← Canvas rendering
│
├── entities/
│   ├── Ball.js              ← Ball physics & movement
│   ├── Player.js            ← Player token, mallet, movement
│   ├── Team.js              ← Team roster & score
│   └── Match.js             ← Match structure, chukkas
│
├── input/
│   ├── InputManager.js      ← Click/drag listeners
│   └── Controls.js          ← Keyboard bindings
│
├── physics/
│   ├── PhysicsConfig.js     ← Physics constants
│   ├── Collisions.js        ← Collision setup
│   └── MalletReach.js       ← Mallet tip calculations
│
├── ai/
│   └── AIOpponent.js        ← AI decision-making
│
├── systems/
│   ├── TurnManager.js       ← Turn switching
│   ├── GoalDetection.js     ← Goal zone detection
│   ├── ChukkaManager.js     ← Period management
│   └── PossessionTracker.js ← Ball possession
│
├── ui/
│   ├── HUD.js               ← Scoreboard & UI
│   ├── MenuScreen.js        ← Main menu
│   └── PauseMenu.js         ← Pause overlay
│
└── utils/
    ├── constants.js         ← ALL magic numbers & configs
    ├── math.js              ← Vector/angle helpers
    └── debug.js             ← Logging utilities
```

---

## Common Imports

```javascript
// Importing from other modules
import { Ball } from '../entities/Ball.js';
import { getTeamColor, FIELD_CONFIG } from '../utils/constants.js';
import { log } from '../utils/debug.js';

// Matter.js
import * as Matter from 'matter-js';
const { Engine, World, Body, Bodies, Events } = Matter;
```

---

## Creating Core Objects

### Create Ball
```javascript
import { Ball } from './entities/Ball.js';

const ball = new Ball(320, 200, 8, matterWorld);
ball.applyImpulse(0.3, 0);  // Flick it
const stopped = ball.isMoving() === false;
```

### Create Player
```javascript
import { Player } from './entities/Player.js';

const player = new Player(1, 100, 200, 0, matterWorld);  // ID, x, y, teamId, world
player.moveTo(150, 200);
const mallet = player.getMalletTip();  // { x, y }
```

### Create Team
```javascript
import { Team } from './entities/Team.js';

const teamA = new Team(0, 'red', 100, 200);  // id, color, startX, startY
const closest = teamA.getClosestPlayerToPosition(320, 200);
```

### Create Match
```javascript
import { Match } from './entities/Match.js';

const match = new Match(teamA, teamB);
match.start();
match.updateTime(deltaTime);
```

---

## Common Operations

### Physics: Apply Impulse to Ball
```javascript
const forceMagnitude = 0.3;
const angle = Math.PI / 4;  // 45°
const fx = Math.cos(angle) * forceMagnitude;
const fy = Math.sin(angle) * forceMagnitude;
ball.applyImpulse(fx, fy);
```

### Physics: Check Ball Velocity
```javascript
const { x: vx, y: vy } = ball.getVelocity();
const speed = Math.sqrt(vx * vx + vy * vy);
if (speed < 0.5) console.log('Ball stopped');
```

### Input: Get Mouse Position
```javascript
function getMousePos(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}
```

### Drawing: Draw Token
```javascript
function drawPlayer(ctx, player, isSelected = false) {
  const { x, y } = player.getPosition();
  const color = getTeamColor(player.teamId);
  
  // Token circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Mallet line
  const mallet = player.getMalletTip();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(mallet.x, mallet.y);
  ctx.stroke();
}
```

### Drawing: Draw Ball
```javascript
function drawBall(ctx, ball) {
  const { x, y } = ball.getPosition();
  
  // Ball
  ctx.fillStyle = COLORS.ball;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
}
```

### Drawing: Draw Field
```javascript
function drawField(ctx) {
  // Background
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, 0, FIELD_CONFIG.width, FIELD_CONFIG.height);
  
  // Boundary
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, FIELD_CONFIG.width, FIELD_CONFIG.height);
  
  // Halfway line
  ctx.beginPath();
  ctx.moveTo(0, FIELD_CONFIG.centerY);
  ctx.lineTo(FIELD_CONFIG.width, FIELD_CONFIG.centerY);
  ctx.stroke();
}
```

### Turn Management
```javascript
// Check if ball stopped (in game loop)
turnManager.update(ball, deltaTime);

// Listen for turn change
if (turnManager.onTurnChanged) {
  turnManager.onTurnChanged = () => {
    console.log('Turn switched to:', turnManager.currentTeam.id);
  };
}
```

### Goal Detection
```javascript
// Set up listener
goalDetector.onGoal = (teamId) => {
  console.log(`Goal! Team ${teamId} scores`);
  match.teamA.recordGoal();  // or teamB
};
```

### AI Decision
```javascript
import { AIOpponent } from './ai/AIOpponent.js';

const ai = new AIOpponent(teamB, 'medium');
await ai.executeTurn(ball, teamA, turnManager);
```

---

## Coordinate System

```
(0, 0) ──────────────────────────── (640, 0)
  │                                    │
  │          FIELD (640×400)           │
  │         Green background           │
  │                                    │
  │  Team A Goal ──────┐ Goal Zones   │
  │  (left)            │ (40×200)      │
  │                    │               │
  │  [Red team]  ⚪   [Blue team]      │
  │   players    ball   players        │
  │                                    │
  │  200: Halfway line (y-axis)        │
  │                                    │
(0, 400) ──────────────────────────── (640, 400)
```

**Top-left origin**. X increases right, Y increases down.

---

## Physics Quick Reference

| Property | Range | Meaning |
|---|---|---|
| `restitution` | 0–1 | 0=no bounce, 1=perfect bounce, 0.45=realistic |
| `friction` | 0–1 | 0=slides forever, 1=sticks, 0.1=normal |
| `frictionAir` | 0–1 | Air resistance; higher = stops faster |
| Ball `radius` | pixels | Usually 8 |
| Player `radius` | pixels | Usually 8 |
| Mallet `reach` | pixels | Distance from center to tip, usually 18 |

**Tuning**: Start with defaults in `constants.js`, adjust via playtesting.

---

## Color Quick Reference

```javascript
import { COLORS, getTeamColor } from './utils/constants.js';

COLORS.grass         // '#2d5a3d' (dark green)
COLORS.white         // '#ffffff'
COLORS.teamA         // '#d32f2f' (red)
COLORS.teamB         // '#1976d2' (blue)
COLORS.ball          // '#ffffff'
COLORS.highlight     // '#ffd700' (yellow)
COLORS.uiBg          // 'rgba(0, 0, 0, 0.5)'

// Get color by team ID
const color = getTeamColor(0);  // Returns COLORS.teamA
```

---

## Debug Logging

```javascript
import { log } from './utils/debug.js';

log('gameState', 'Turn ended', { team: 0, time: Date.now() });
log('physics', 'Ball speed:', ball.getVelocity());
log('ai', 'Selected player', { playerId: 1, action: 'move' });
```

Check `DEBUG_FLAGS` in `constants.js` to enable/disable categories.

---

## Testing Patterns

### Manual Test: Flick Ball
```javascript
// In console
const flick = (angle, power) => {
  const fx = Math.cos(angle) * power;
  const fy = Math.sin(angle) * power;
  ball.applyImpulse(fx, fy);
};
flick(Math.PI / 4, 0.3);  // 45°, medium power
```

### Manual Test: Goal
```javascript
// Flick ball into goal zone
ball.reset(30, 200);  // Left goal zone
ball.applyImpulse(0.3, 0);
```

### Manual Test: AI
```javascript
// Trigger AI turn
ai.executeTurn(ball, teamA, turnManager).then(() => console.log('AI done'));
```

---

## Common Bugs & Solutions

| Symptom | Cause | Fix |
|---|---|---|
| Ball doesn't move | Impulse too small | Increase force multiplier |
| Ball never stops | Friction too low | Increase `frictionAir` |
| Turn doesn't switch | Ball stop detection off | Check `BALL_STOP_THRESHOLD` |
| Goal not detected | Collision event not firing | Verify goal zone `isSensor: true` |
| Players freeze | Collision groups wrong | Check `COLLISION_GROUPS` bitmasks |
| Canvas blank | Render not called | Add `draw*()` calls to game loop |

---

## Game Loop Template

```javascript
// src/main.js
import { Ball } from './entities/Ball.js';
import { GameEngine } from './core/Engine.js';
import { TurnManager } from './systems/TurnManager.js';
import { FIELD_CONFIG, PHYSICS_CONFIG } from './utils/constants.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const engine = new GameEngine();
const ball = new Ball(FIELD_CONFIG.centerX, FIELD_CONFIG.centerY, 8, engine.world);
const teamA = new Team(0, 'red', 100, 200);
const teamB = new Team(1, 'blue', 540, 200);
const match = new Match(teamA, teamB);
const turnManager = new TurnManager(teamA, teamB);

let running = true;
let lastFrameTime = Date.now();

function gameLoop() {
  const now = Date.now();
  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  // Update
  engine.update(deltaTime);
  turnManager.update(ball, deltaTime);
  match.updateTime(deltaTime);

  // Render
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawField(ctx);
  drawTeam(ctx, teamA);
  drawTeam(ctx, teamB);
  drawBall(ctx, ball);
  drawHUD(ctx, match, turnManager.currentTeam);

  if (running) requestAnimationFrame(gameLoop);
}

gameLoop();
```

---

## Key Files to Start With (Build Order)

1. **`src/utils/constants.js`** — All magic numbers
2. **`src/core/Engine.js`** — Matter.js world setup
3. **`src/entities/Ball.js`** — Ball entity
4. **`src/entities/Player.js`** — Player entity
5. **`src/core/Renderer.js`** — Canvas rendering
6. **`src/input/InputManager.js`** — Click/drag listeners
7. **`src/main.js`** — Game loop
8. Iterate & add systems (TurnManager, GoalDetection, etc.)

---

## Useful npm Commands

```bash
npm run dev         # Start dev server (http://localhost:3000)
npm run build       # Build for production
npm run preview     # Preview prod build locally
npm test            # Run tests
npm install package # Install dependency
```

---

## Checking Your Work

- [ ] Game runs at 60 FPS without lag
- [ ] Ball rolls smoothly and stops naturally
- [ ] Click-to-move works and shows radius
- [ ] Mallet line visible, extends correctly
- [ ] Flick arrow shows power/angle
- [ ] Goal scored when ball enters zone
- [ ] Score increments immediately
- [ ] Turn switches after ball stops
- [ ] Scoreboard updates
- [ ] Timer counts down
- [ ] Chukka resets after timer ends
- [ ] AI makes sensible moves

---

**More Info**: See `CLAUDE.md` for overview, `ARCHITECTURE.md` for system design, `PHYSICS.md` for tuning.

