# Tabletop Polo — Claude.md

## Project Overview

**Tabletop Polo** is a physics-based, browser-playable tabletop polo game inspired by *Free Flick Football* but adapted for polo mechanics. Players control mounted polo players (tokens) on a grass pitch, move them strategically, and flick a ball using a **mallet with physical reach** instead of direct foot contact.

**Core Concept**: Turn-based polo simulation where you click to move player tokens, then drag from the **mallet tip** (not the player center) to flick the ball toward the opponent's goal.

---

## Game Vision

- **Tabletop Sport Feel**: Like Subbuteo or Blood Bowl—tactile, strategic, turn-based.
- **Physics-Driven**: Matter.js handles ball rolling, player momentum, collisions, and mallet reach.
- **Skill-Based**: Mallet angle, timing, power, and player positioning matter.
- **Solo & Multiplayer**: Play vs AI (v1) or vs friends online via Socket.io (v2).
- **Authentic Polo Rules**: Chukka-based match structure, goal zones, possession mechanics.

---

## Key Differentiators vs Free Flick Football

| Aspect | Football | Polo |
|---|---|---|
| **Players on field** | Only ball | 3–4 per team (controllable tokens) |
| **Flick origin** | Ball center | **Mallet tip** (extends from player) |
| **Movement** | None (ball only) | Click to move player, angle to face goal |
| **Possession** | Ball physics | Last player to touch / closest player |
| **Match structure** | Timed game | **Chukkas** (7-min periods, resets) |
| **Tactics** | Power & angle | **Positioning, blocking, coordination** |

---

## Tech Stack

```
Frontend:      Next.js (App Router) or plain HTML/JS for simplicity
Rendering:     HTML5 Canvas 2D context
Physics:       Matter.js v0.19+ (2D rigid body engine)
Game Loop:     Custom turn manager + requestAnimationFrame
Multiplayer:   Socket.io + Node.js backend (v2)
Build:         Vite or Create React App (if using React)
Styling:       CSS (minimal—most UI is on canvas)
```

**Why these choices?**
- **Matter.js**: Industry standard for browser 2D physics. Handles collisions, friction, restitution natively.
- **Canvas**: Perfect for top-down tile/grid games; 60 FPS easily achievable.
- **Vite**: Fast dev server, quick builds, ideal for game dev.
- **Socket.io**: Real-time bidirectional communication for online play.

---

## Project Structure

```
tabletop-polo/
├── CLAUDE.md                 # This file (project brief)
├── ARCHITECTURE.md           # System design, data models, physics
├── DESIGN.md                 # Visual design, field layout, tokens
├── PHYSICS.md                # Physics tuning parameters, collisions
├── GAMEPLAY.md               # Rules, turn structure, AI logic
├── DEVELOPMENT.md            # Setup, build steps, debugging tips
│
├── package.json
├── vite.config.js (if using Vite)
│
├── src/
│   ├── index.html            # Entry point
│   ├── main.js               # Game initialization & loop
│   │
│   ├── core/
│   │   ├── Engine.js         # Matter.js setup, world management
│   │   ├── GameState.js      # Match state, turns, scoring
│   │   └── Renderer.js       # Canvas rendering pipeline
│   │
│   ├── entities/
│   │   ├── Ball.js           # Ball body, properties, reset logic
│   │   ├── Player.js         # Player token, mallet, movement
│   │   ├── Team.js           # Team state, players list
│   │   └── Match.js          # Match, chukkas, scoring
│   │
│   ├── input/
│   │   ├── InputManager.js   # Click handlers, drag listeners
│   │   └── Controls.js       # UI button handlers
│   │
│   ├── physics/
│   │   ├── PhysicsConfig.js  # Restitution, friction, parameters
│   │   ├── Collisions.js     # Collision filters, handlers
│   │   └── MalletReach.js    # Mallet tip calculation, flick origin
│   │
│   ├── ai/
│   │   └── AIOpponent.js     # AI turn logic, movement, flick
│   │
│   ├── systems/
│   │   ├── TurnManager.js    # Turn alternation, ball stop detection
│   │   ├── GoalDetection.js  # Goal zone collisions, scoring
│   │   ├── ChukkaManager.js  # Period timers, resets
│   │   └── PossessionTracker.js  # Who touched last, who can flick
│   │
│   ├── ui/
│   │   ├── HUD.js            # Scoreboard, timer, turn indicator
│   │   ├── MenuScreen.js     # Start screen, difficulty select
│   │   └── PauseMenu.js      # Pause/resume
│   │
│   ├── utils/
│   │   ├── Math.js           # Vector, angle helpers
│   │   ├── constants.js      # Field dims, physics values
│   │   └── debug.js          # Logging, dev tools
│   │
│   ├── multiplayer/
│   │   ├── SocketManager.js  # Socket.io client (v2)
│   │   └── GameSync.js       # State reconciliation (v2)
│   │
│   └── assets/
│       ├── sounds/           # Goal horn, flick, whistle (optional)
│       └── sprites/          # Token sprites, pitch texture (optional)
│
└── tests/
    └── physics.test.js       # Jest or Vitest tests (optional v2)
```

---

## Core Systems at a Glance

### 1. **Physics Engine** (Matter.js)
- Ball body (circular, rolling physics)
- Player tokens (4–8 circular bodies, team-aware collision groups)
- Static boundaries (pitch walls, goal posts)
- Mallet vector (not a physical body—calculated ray from player center)

### 2. **Rendering** (Canvas 2D)
- Top-down orthogonal view, 640×400px pitch
- Grass texture / simple green background
- White line markings (centre, halfway, goal zones)
- Player tokens with team colors (red vs blue)
- Mallet vector (thin line from player to mallet tip)
- Ball (small white/yellow circle)
- HUD overlay (scoreboard, timer, turn indicator)

### 3. **Input System**
- **Click to move**: Click a player token → show movement radius → click destination → player slides there
- **Drag to flick**: When it's your turn, click the mallet tip area and drag backward (slingshot) → release → flick impulse applied to ball
- **Button controls**: UI for pause, restart, difficulty select

### 4. **Turn Manager**
- Detect ball velocity → once < 0.5 px/frame for 0.5 sec, ball is stopped
- Switch to next team's turn
- Update HUD (whose turn it is)
- AI opponent triggers automatically on its turn

### 5. **Goal Detection**
- Two goal zone rectangles (left and right ends of pitch)
- Collision listener on ball → goal zone
- Increment score, play sound, reset ball to centre
- Check if match is over (all chukkas played)

### 6. **Chukka System**
- 4 chukkas, 7 minutes each (420 sec default)
- Timer counts down during play
- At 0, bell sound, players reset, new chukka starts
- After final chukka, match ends (highest score wins)

### 7. **AI Opponent**
- On AI's turn: pick closest player to ball, move toward it with noise
- Face player toward opponent goal
- Flick with randomized power and angle (difficulty scales this)
- Repeat

---

## Development Phases

### **Phase 1: MVP (Week 1–2)**
- [x] Project structure & boilerplate
- [ ] Canvas setup + field rendering
- [ ] Matter.js world + ball physics
- [ ] Player token movement (click-to-move)
- [ ] Mallet vector & flick from mallet tip
- [ ] Turn alternation + ball stop detection
- [ ] Goal zones + scoring (visual only)
- [ ] Simple scoreboard UI

**Playable state**: 1v1 (you vs basic AI, no timer)

### **Phase 2: Core Gameplay (Week 3)**
- [ ] Chukka timer + match structure
- [ ] Possession tracking (last-touch rule)
- [ ] Improved AI (difficulty levels)
- [ ] Pause menu, restart
- [ ] Field visuals (grass texture, line markings)
- [ ] Token sprites (color-coded teams)

**Playable state**: Full single-player match (4 chukkas, AI opponent)

### **Phase 3: Polish (Week 4)**
- [ ] Sound effects (flick, goal horn, whistle)
- [ ] Animations (goal celebration, token movement ease)
- [ ] Game over screen, final score display
- [ ] Settings menu (difficulty, team colors)
- [ ] Restart / main menu flow

**Release state**: Fully playable solo game

### **Phase 4: Multiplayer (Week 5+, v2)**
- [ ] Backend: Node.js + Socket.io server
- [ ] State sync: match state, turn changes, goal events
- [ ] Online lobby & game creation
- [ ] Player reconciliation (client-side prediction)
- [ ] Latency compensation

---

## Key Insights & Constraints

### **Physics Tuning**
Polo balls are light and grass has high friction. Expect:
- Restitution: 0.4–0.5 (less bouncy than football)
- Friction: 0.04–0.06 (high damping)
- Air resistance: 0.04–0.05 (lightweight)
- Ball stops naturally in ~3–4 seconds on grass

**Consequence**: Flicks feel different than in Free Flick Football—more roll, less skip. Test early.

### **Mallet Reach is Not Just Cosmetic**
The mallet tip position determines:
1. **Flick origin** (where impulse is applied from)
2. **Visual clarity** (player knows where they can strike from)
3. **Gameplay strategy** (must position player to reach ball)

If mallet reach is too short (< 15px), players must be nearly touching ball to flick. Too long (> 30px), flicking becomes trivial.

**Default**: 18px reach for a player ~8px radius. Tune this based on field dimensions.

### **Possession Logic**
- Ball goes out of bounds → possession changes to other team
- If player A flicks and player B (same team) touches next, A still has flick rights
- If opponent touches first, possession switches
- This prevents weird scenarios where you flick and immediately lose control

### **Movement Radius is a Balance**
- Too small (< 80px): Tedious, players crawl across field
- Too large (> 200px): Trivial, players zoom around
- Default: ~120px radius, ~0.5 sec to move and position

---

## Success Criteria

By the end of Phase 1:
- [ ] Game runs at 60 FPS consistently
- [ ] Physics feel natural (ball rolls, doesn't skate)
- [ ] Click-to-move is responsive and clear
- [ ] Mallet flick from tip is visible and functional
- [ ] Goal detection works (no false positives)
- [ ] Turn system is smooth and unambiguous

By end of Phase 2:
- [ ] Full match playable (4 chukkas)
- [ ] AI is competitive at medium difficulty
- [ ] Chukka resets don't break state
- [ ] Score tracking is reliable

By end of Phase 3:
- [ ] Game is visually polished (grass, token colors, lines)
- [ ] Sound feedback on key events
- [ ] Main menu → game → game over flow works
- [ ] Ready for friends to play without instruction

---

## Notes for Claude

When building features:
1. **Physics first**: Get ball and player movement feeling right before adding UI.
2. **Test early**: Each system (physics, input, goal detection) should have manual test cases.
3. **Constants file**: All magic numbers (field dims, physics values, timings) go in `constants.js`—makes tuning easy.
4. **No global state if avoidable**: Prefer passing state as parameters to functions.
5. **Canvas rendering is last**: Logic is solid, then render it. Don't optimize canvas too early.
6. **AI is replaceable**: Write AI as a standalone module; can swap out logic without breaking game.

---

## References & Inspiration

- **Free Flick Football** (freeflickfootball.com): Flick mechanics, physics-based sports sim
- **Subbuteo**: Turn-based tabletop sports, positioning strategy
- **Blood Bowl**: Team coordination, random events, chukka-like turns
- **Real Polo**: 7-min chukkas, 4 players per side, goal zones, mallet reach
- **Matter.js Docs**: https://brm.io/matter-js/
- **Canvas 2D Context**: MDN Web Docs

---

## Quick Links

- **Architecture**: See `ARCHITECTURE.md` for system design & data models
- **Design**: See `DESIGN.md` for visual style, field layout, token sprites
- **Physics**: See `PHYSICS.md` for tuning parameters and collision rules
- **Gameplay**: See `GAMEPLAY.md` for detailed rules, AI logic, chukka system
- **Dev**: See `DEVELOPMENT.md` for setup, build, and debugging

---

**Status**: Planning & architecture complete. Ready for code build-out.
