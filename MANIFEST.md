# Tabletop Polo — PROJECT MANIFEST

## Complete File Structure & Documentation Index

This is your complete starter package for building Tabletop Polo. Everything you need is documented below.

---

## 📚 Documentation Files (4,556 lines)

Read these in order when starting the project:

### 1. **README.md** (412 lines)
- Overview of the game
- Quick start instructions
- Technology stack & roadmap
- File reading order
- Troubleshooting & FAQs

**Read first if**: You're new to the project

---

### 2. **CLAUDE.md** (306 lines)
- **Project Brief**: Vision, goals, differentiators
- **Tech Stack**: Why we chose Matter.js, Canvas, Vite
- **Project Structure**: Complete file tree with descriptions
- **Development Phases**: MVP → Polish → Multiplayer
- **Key Insights**: Physics tuning, mallet mechanics, constraints

**Read after**: README.md

---

### 3. **ARCHITECTURE.md** (678 lines)
- **System Architecture**: Layers & data flow diagrams
- **Entity Models**: Ball, Player, Team, Match classes with code
- **Physics Configuration**: All tunable parameters
- **Collision System**: Groups, filtering, bitmasks
- **Core Systems**: Engine, TurnManager, GoalDetection, etc.
- **Data Model**: State hierarchy & initialization sequence
- **Performance**: Sleeping, collision optimization

**Read after**: CLAUDE.md

---

### 4. **DESIGN.md** (553 lines)
- **Visual Style**: Colors, typography, aesthetic
- **Field Layout**: Dimensions, goal zones, markings
- **Player Tokens**: Design, states, rendering code
- **Ball & UI**: HUD mockups, rendering code
- **Animations**: Goal celebration, chukka transitions
- **Rendering Pipeline**: Canvas drawing order
- **UI Mockups**: ASCII layouts, pause menu

**Read after**: ARCHITECTURE.md

---

### 5. **PHYSICS.md** (571 lines)
- **Physics Engine**: Why Matter.js, how it works
- **Tuning Parameters**: Ball, player, world configs
- **Collision System**: Groups, filtering, sensor bodies
- **Tuning Guide**: Common problems & solutions
- **Formulas & Concepts**: Velocity, momentum, restitution
- **Impulse & Flick**: How flicking works, slingshot mechanics
- **Performance**: Sleeping, optimization, profiling
- **Debugging**: Console logging, Matter.js debug renderer

**Read after**: ARCHITECTURE.md

---

### 6. **GAMEPLAY.md** (574 lines)
- **Game Rules**: Objective, scoring, match structure
- **Match & Chukka System**: 7-minute periods, resets
- **Turn Structure**: Alternating flicks, ball stop detection
- **Possession Tracking**: Last-touch rules, scenarios
- **Scoring**: Goal detection, own goals, reset logic
- **AI Opponent**: Difficulty levels, move selection, flick calculation
- **Game States**: State machine, transitions
- **Input Mapping**: Keyboard & touch controls
- **Testing Checklist**: Manual test cases

**Read after**: DESIGN.md & PHYSICS.md

---

### 7. **DEVELOPMENT.md** (706 lines)
- **Setup**: Prerequisites, npm setup, Vite config
- **Directory Structure**: Detailed file purposes
- **Development Workflow**: Start dev server, build process
- **Coding Standards**: Naming conventions, comments, structure
- **Debugging**: Console logging, DevTools, breakpoints
- **Testing**: Manual & automated tests
- **Performance**: Profiling, bottlenecks, optimization tips
- **Deployment**: GitHub Pages, Vercel setup
- **IDE Setup**: VS Code extensions, ESLint, Prettier
- **Troubleshooting**: Common issues & fixes

**Read after**: PHYSICS.md & GAMEPLAY.md

---

### 8. **QUICK_REFERENCE.md** (430 lines)
- **File Organization**: Quick visual reference
- **Common Imports**: How to import classes & constants
- **Creating Objects**: Ball, Player, Team, Match examples
- **Common Operations**: Physics, input, drawing, turns, goals
- **Coordinate System**: Explanation with ASCII diagram
- **Physics Quick Reference**: Parameter ranges & meanings
- **Color Reference**: Hex codes & helper functions
- **Debug Logging**: How to use logging system
- **Testing Patterns**: Manual test templates
- **Common Bugs**: Symptoms, causes, fixes
- **Game Loop Template**: Copy-paste starter code
- **Build Order**: Which files to create first

**Use while coding**: Bookmark this!

---

## 💾 Source Code Files (To Be Created)

After reading the docs, create these files in this order:

### Phase 1: Core Files

1. **`src/index.html`** — HTML entry point with canvas
2. **`src/main.js`** — Game initialization & main loop
3. **`src/utils/constants.js`** ✅ **ALREADY CREATED** — All magic numbers & configs
4. **`src/core/Engine.js`** — Matter.js world setup & boundaries
5. **`src/entities/Ball.js`** — Ball class, physics, movement
6. **`src/entities/Player.js`** — Player token, mallet, movement
7. **`src/core/Renderer.js`** — Canvas rendering (field, tokens, ball, HUD)

### Phase 2: Input & Turn System

8. **`src/input/InputManager.js`** — Click/drag listeners
9. **`src/systems/TurnManager.js`** — Turn alternation, ball stop detection
10. **`src/physics/MalletReach.js`** — Mallet tip calculation

### Phase 3: Game Logic

11. **`src/systems/GoalDetection.js`** — Goal zone collisions, scoring
12. **`src/entities/Match.js`** — Match structure, chukka system
13. **`src/systems/ChukkaManager.js`** — Timer, resets, period management

### Phase 4: AI & Gameplay

14. **`src/ai/AIOpponent.js`** — AI decision-making, difficulty levels
15. **`src/systems/PossessionTracker.js`** — Last-touch tracking

### Phase 5: UI & Polish

16. **`src/ui/HUD.js`** — Scoreboard, timer, turn indicator
17. **`src/ui/MenuScreen.js`** — Main menu (optional v1)
18. **`src/ui/PauseMenu.js`** — Pause overlay (optional v1)

### Phase 6: Utilities & Helpers

19. **`src/utils/math.js`** — Vector & angle helpers (optional)
20. **`src/utils/debug.js`** — Logging utilities

---

## 📦 Configuration Files (To Be Created)

- **`package.json`** ✅ **ALREADY CREATED** — Dependencies & npm scripts
- **`.gitignore`** — Git ignore patterns
- **`vite.config.js`** — Vite build configuration
- **`.eslintrc.js`** — Linting rules
- **`.prettierrc.js`** — Code formatting

---

## 📊 Documentation Statistics

| File | Lines | Purpose |
|---|---|---|
| CLAUDE.md | 306 | Project brief & overview |
| ARCHITECTURE.md | 678 | System design & entities |
| DESIGN.md | 553 | Visual design & rendering |
| PHYSICS.md | 571 | Physics tuning & debugging |
| GAMEPLAY.md | 574 | Rules & AI logic |
| DEVELOPMENT.md | 706 | Setup & development |
| QUICK_REFERENCE.md | 430 | Cheat sheet for coding |
| README.md | 412 | Quick start & FAQ |
| **TOTAL** | **4,230** | **Complete specification** |

---

## 🎯 Recommended Reading Path

**Time Estimate: 60–90 minutes**

```
START
  ↓
README.md (5 min)           ← Start here, get overview
  ↓
CLAUDE.md (10 min)          ← Understand vision & tech
  ↓
ARCHITECTURE.md (20 min)    ← Learn system design
  ↓
DESIGN.md (10 min)          ← Visualize the game
  ↓
PHYSICS.md (15 min)         ← Understand physics
  ↓
GAMEPLAY.md (10 min)        ← Learn rules & AI
  ↓
DEVELOPMENT.md (10 min)     ← Setup environment
  ↓
QUICK_REFERENCE.md          ← Keep open while coding
  ↓
START CODING!
```

---

## 🔧 Quick Setup Checklist

- [ ] Read README.md
- [ ] Read CLAUDE.md
- [ ] Read ARCHITECTURE.md
- [ ] Install Node.js 16+
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000 in browser
- [ ] See blank canvas (expected)
- [ ] Start creating files in build order
- [ ] Reference QUICK_REFERENCE.md while coding

---

## 📍 Key Files at a Glance

### Most Important Files (Read These!)

| File | What to Know |
|---|---|
| **CLAUDE.md** | Why we're building this way |
| **ARCHITECTURE.md** | How everything connects |
| **constants.js** | Where ALL numbers live |
| **QUICK_REFERENCE.md** | How to do common tasks |

### Most Edited Files (Code These!)

| File | Frequency |
|---|---|
| **constants.js** | Every session (tuning) |
| **main.js** | Multiple times (game loop) |
| ***.js in src/** | Daily (implementation) |

### Important but Read-Once Files

| File | Read When... |
|---|---|
| **PHYSICS.md** | Ball feels wrong |
| **GAMEPLAY.md** | Rules are unclear |
| **DEVELOPMENT.md** | Setting up environment |
| **DESIGN.md** | Starting rendering |

---

## 🎮 Build Order (By Priority)

**Priority 1: Get physics working**
1. Engine.js + constants.js
2. Ball.js + Player.js
3. Renderer.js (basic field + tokens)

**Priority 2: Get input working**
4. InputManager.js
5. FlickSystem (in main.js)

**Priority 3: Get turns working**
6. TurnManager.js
7. GoalDetection.js

**Priority 4: Get AI working**
8. AIOpponent.js

**Priority 5: Polish**
9. HUD.js + sounds + animations

---

## 🧪 Testing Checkpoints

After completing each priority:

**Priority 1 Done?**
- [ ] Ball renders on canvas
- [ ] Ball moves when flicked
- [ ] Ball stops naturally

**Priority 2 Done?**
- [ ] Click-to-move works
- [ ] Drag-to-flick shows arrow
- [ ] Flick moves the ball

**Priority 3 Done?**
- [ ] Turn switches after ball stops
- [ ] Goal is detected
- [ ] Score increments

**Priority 4 Done?**
- [ ] AI makes moves
- [ ] AI flicks move the ball
- [ ] Difficulty levels work

**Priority 5 Done?**
- [ ] Scoreboard displays
- [ ] Timer counts down
- [ ] Menu works

---

## 🔗 Cross-References

| Question | Answer In |
|---|---|
| "Why Matter.js?" | CLAUDE.md - Tech Stack |
| "How does mallet work?" | ARCHITECTURE.md - Mallet Reach |
| "Ball is bouncing too much" | PHYSICS.md - Tuning Guide |
| "How do I render tokens?" | DESIGN.md - Player Tokens |
| "What's a chukka?" | GAMEPLAY.md - Chukka System |
| "How do I debug?" | DEVELOPMENT.md - Debugging |
| "How do I import X?" | QUICK_REFERENCE.md - Imports |

---

## 📝 Notes for Developers

### Before You Start Coding
1. Read ALL documentation (or at least first 6 files)
2. Understand the architecture (not just the code)
3. Skim QUICK_REFERENCE.md to know what's there
4. Keep constants.js open while coding

### While You're Coding
1. Make physics feel good BEFORE adding UI
2. Test each system in isolation first
3. Use QUICK_REFERENCE.md for code patterns
4. Adjust constants.js, don't hardcode numbers
5. Write comments for non-obvious logic

### When You're Stuck
1. Check QUICK_REFERENCE.md for common patterns
2. Check DEVELOPMENT.md for debugging tips
3. Check PHYSICS.md if physics feels wrong
4. Check GAMEPLAY.md if rules are unclear
5. Use console.log() and DevTools breakpoints

---

## 🚀 Next Steps

1. **Read** all documentation (60 min)
2. **Setup** environment (5 min)
   ```bash
   npm install
   npm run dev
   ```
3. **Create** `src/index.html` (see DEVELOPMENT.md)
4. **Create** `src/main.js` with game loop template (QUICK_REFERENCE.md)
5. **Create** `src/core/Engine.js` to initialize Matter.js
6. **Iterate** through build order, test each step

---

## 📞 Getting Help

- **What's the overview?** → README.md
- **What's the architecture?** → ARCHITECTURE.md  
- **How do I...?** → QUICK_REFERENCE.md
- **What's wrong with physics?** → PHYSICS.md
- **What are the rules?** → GAMEPLAY.md
- **How do I set up?** → DEVELOPMENT.md
- **Why did we choose X?** → CLAUDE.md
- **What does it look like?** → DESIGN.md

---

## ✅ Completeness Checklist

This package includes:
- [x] 8 comprehensive documentation files (4,230 lines)
- [x] Project constants file with all magic numbers
- [x] Package.json with dependencies
- [x] Complete file structure & build order
- [x] Code samples & patterns
- [x] Testing procedures
- [x] Debugging guides
- [x] Deployment instructions
- [x] Quick reference cheat sheet

**Status**: Ready to build! 🎮

---

**Last Updated**: April 2026
**Version**: 0.1.0 (Pre-release)
**Status**: Ready for development

Start reading now, build later. Good luck! 🏑⚪

