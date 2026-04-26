# 🏑 Tabletop Polo — Game Advancement Plan
### Real Polo Research + Codebase Analysis + Full Feature Roadmap

---

## PART 1: HOW REAL POLO WORKS

### The Sport in a Nutshell
Polo is a team sport played on a massive grass field (300 × 160 yards — 9× a football field). Two teams of 4 players on horseback use long-handled mallets to drive a small hard ball through the opponent's goalposts. Matches are divided into timed periods called **chukkers (chukkas)**. Highest score after all chukkas wins.

---

### 1.1 Teams & Player Positions

Each team has **4 numbered players** with defined tactical roles:

| Number | Role | Equivalent |
|---|---|---|
| **#1** | Primary attacker / striker | Football striker |
| **#2** | All-rounder — offense + defence, most ground covered | Midfielder |
| **#3** | Tactician / playmaker, controls game direction | Quarterback |
| **#4** | Goalkeeper / last defender | Centre-back |

**Handicap System:** Every player is rated **-2 (beginner) to +10 (world-class)**. Team handicap = sum of all 4 players. In tournaments, the lower-rated team gets a **goal head-start** equal to the handicap difference. E.g., Team A = 12 goals total, Team B = 8 goals → Team B starts with a 4-goal advantage.

---

### 1.2 Field & Equipment

| Element | Real Polo | Current Game |
|---|---|---|
| Field size | 300 × 160 yards | 960 × 600 px (proportional ✅) |
| Goalposts | 8 yards apart, no height limit | Implemented (180px wide) ✅ |
| Goal depth | Behind backline | Partially (sensor outside canvas ⚠️) |
| Ball | Hard plastic, 3.5" diameter | ✅ |
| Mallet | 49–54" bamboo, flat head | ✅ (mallet reach + head drawn) |
| Players per team | 4 | 3 (needs +1) |

---

### 1.3 Game Structure & Timing

- **4–6 chukkas** per match, each **7 minutes** (clock stops for fouls/out-of-bounds)
- **3-minute breaks** between chukkas, **5-minute halftime** (after chukka 2)
- After each goal → **teams swap ends** (to neutralise wind/field advantage)
- Tied at end → **sudden death extra chukka** ("golden goal" — first to score wins)
- Ball out over sideline → umpire **throws it back in from the spot**
- Ball over backline (not scored) → defending team gets **free hit from goal area**

---

### 1.4 The Golden Rule — Line of the Ball (LOB)

This is the **single most important polo rule** and makes the game strategic:

> An imaginary line follows the path the ball is travelling. The player who last struck it — or who is best positioned along that line — has **Right of Way**. No other player may cross that line unsafely.

**How the line works:**
- When a player hits the ball, a "line" extends in the ball's direction of travel
- The player who hit it (or is riding closest to that line on the right side) has right of way
- Other players must ride **parallel** to the line or approach from angles that don't endanger
- A player can "steal" the line by pulling alongside the ball-holder and **riding them off** (shoulder-to-shoulder legal body contact)
- Crossing the line = **foul** → penalty shot

---

### 1.5 Fouls & Penalties

Fouls happen when:
- A player **crosses the Line of the Ball** dangerously
- **Dangerous riding** — zigzagging in front of opponent, excessive bumping
- **Mallet hooking** — illegally hooking opponent's mallet downswing (only legal if you're on the correct side)
- **Striking** a ball in a dangerous direction toward a player/horse

**Penalty Spots (distance from goal):**

| Penalty | Distance | Defended? |
|---|---|---|
| Penalty 1 | 25 yards | Yes (1 defender) |
| Penalty 2 | 15 yards | No (undefended until shot) |
| Penalty 3 | 25 yards | Completely undefended |
| Penalty 4 (Half) | 60 yards | Defended normally |
| Penalty 5 | From spot / centre line | Defended normally |

---

### 1.6 Physical Play Rules

- **"Ride-off"**: Legal shoulder-to-shoulder contact to push opponent off the line ✅ (could implement as player collision)
- **Mallet hook**: Legal to hook opponent's mallet on the downswing if positioned on correct side
- **Bump**: Players can lean into each other at a safe angle (<45°), no dangerous zigzagging
- **No striking at ball near a horse's legs** from the off-side

---

### 1.7 Scoring Extras

- Ball must **fully cross** between posts to count
- No height limit — aerial goals count
- **Backline rule**: If attacking team hits ball over backline (but doesn't score) → defending team gets free hit. If defending team hits it over → attacking team gets penalty shot from the 60-yard line.
- After each goal: **ends are swapped** (teams change direction)

---

## PART 2: CURRENT GAME — STATE ANALYSIS

### What Exists

| System | File | Status |
|---|---|---|
| Physics engine (Matter.js) | `Engine.js` | ✅ Solid |
| Ball with trail | `Ball.js` | ✅ Good |
| 3 players per team | `Team.js` | ⚠️ Should be 4 |
| Player roles (none) | `Player.js` | ❌ All identical |
| Mallet reach + flick | `Player.js`, `Game.js` | ✅ Core mechanic works |
| Turn manager | `TurnManager.js` | ✅ Works, but no LOB concept |
| Goal detection | `GoalDetection.js` | ✅ Sensor-based |
| Match (4 chukkas × 2min) | `Match.js` | ✅ Structure present |
| End-swap after goal | `Match.js` / `Game.js` | ❌ Missing |
| Sudden death overtime | `Match.js` | ❌ Missing |
| AI opponent | `AIOpponent.js` | ⚠️ Basic (1 difficulty working) |
| Fouls / penalties | — | ❌ Not implemented |
| Line of the Ball | — | ❌ Not implemented |
| Difficulty selection | `Menus.js` | ❌ Hard-coded to 'medium' |
| Halftime break | `Match.js` | ❌ Missing |
| Score display | `HUD.js` | ✅ With pulse animation |
| Timer (chukka + total) | `HUD.js` | ✅ Dual display |
| Camera shake | `Renderer.js` | ✅ |
| Impact sparks | `Renderer.js` | ✅ |
| Danger zone | `Renderer.js` | ✅ |
| Sound (WebAudio synth) | `Sounds.js` | ✅ Basic (flick, goal, whistle) |
| Player positions/roles | — | ❌ All spawn in random stagger |
| Handicap system | — | ❌ Missing |
| Out-of-bounds | `Engine.js` | ⚠️ Walls bounce, no throw-in |
| Menu system | `Menus.js` | ⚠️ Basic (no difficulty, no stats) |
| Backline free hit | — | ❌ Missing |
| Player numbers on tokens | `Renderer.js` | ✅ (1, 2, 3) |

### Core Gaps vs Real Polo

1. **No Line of the Ball** — the most distinctive polo mechanic is absent
2. **No ends-swap after goal** — teams don't change direction
3. **No player roles** — #1 attacker, #2 midfield, #3 playmaker, #4 defender all play identically
4. **No penalty system** — fouls not detected or enforced
5. **No difficulty selection** — always medium AI
6. **No overtime/sudden death** — ties just end flat
7. **Only 3 players per team** — real polo has 4
8. **No halftime break** — no 5-minute break marker between chukkas 2 and 3
9. **No backline rules** — ball over backline not handled differently
10. **No handicap** — no balancing mechanism

---

## PART 3: FEATURE ROADMAP

Features are grouped into 4 phases. Each phase is self-contained and deployable.

---

### PHASE 1 — Core Polo Feel 🔴 (Highest Impact)
*Makes the game feel like polo. Do this first.*

---

#### 1.1 Ends Swap After Every Goal
**What real polo does:** After every goal, teams switch which end they attack. This balances wind/field advantage.

**Game adaptation:**
- After a goal, all 6 players flip their `x` position: `newX = FIELD.width - currentX`
- Ball resets to center
- The direction each team attacks inverts
- Visual: brief "ENDS CHANGE" announcement on screen

**Files:** `Game.js` (`_onGoal`), `Team.js` (`flipEnds()`)
**Complexity:** Low — 1 day

---

#### 1.2 Fourth Player Per Team (4v4)
**What real polo does:** 4 players per team, numbered 1–4 with roles.

**Game adaptation:**
- `MATCH.playersPerTeam`: 3 → **4**
- Spawn positions updated (4 players spread across field half)
- Player tokens show numbers 1–4
- Increases tactical depth with one more piece to move per turn

**Files:** `constants.js`, `Team.js`
**Complexity:** Low — half day

---

#### 1.3 Player Roles & Formations
**What real polo does:** Each player number has a tactical role.

**Game adaptation:**

| # | Role | Starting position | AI behaviour |
|---|---|---|---|
| 1 | Attacker | Near opponent goal | Charges toward opponent goal |
| 2 | All-rounder | Centre-field offset | Follows ball, splits offense/defense |
| 3 | Playmaker | Centre | Positions to receive, aims long passes |
| 4 | Defender | Own goal area | Stays back, blocks shots |

- Roles affect **default spawn positions** and **AI movement priorities**
- Human player can still move any of their 4 tokens freely
- AI uses role weights when choosing which player to move

**Files:** `Player.js` (add `role` property), `Team.js` (role-aware spawn), `AIOpponent.js` (role-weighted selection)
**Complexity:** Medium — 2 days

---

#### 1.4 Difficulty Selection on Start Screen
**What's missing:** AI is always 'medium', no way to change.

**Game adaptation:**
- Start menu gets 3 buttons: **Easy / Medium / Hard**
- Each affects `AI.reactionMs`, noise angle, long-shot chance:

| Difficulty | Reaction | Noise | Long-shot % | Supporter move? |
|---|---|---|---|---|
| Easy | 900ms | 0.40 rad | 10% | No |
| Medium | 420ms | 0.18 rad | 25% | Yes |
| Hard | 250ms | 0.06 rad | 40% | Yes (2 players) |

**Files:** `Menus.js`, `Game.js`, `AIOpponent.js`, `constants.js`
**Complexity:** Low — half day

---

#### 1.5 Sudden Death Overtime
**What real polo does:** If tied after final chukka → extra chukka, first to score wins.

**Game adaptation:**
- After chukka 4, if scores equal: add a **5th "OVERTIME" chukka** (90 seconds)
- HUD shows "GOLDEN CHUKKA" label in gold
- First goal ends the match immediately — no waiting for clock
- If still tied after overtime → penalty shootout (Phase 3)

**Files:** `Match.js`, `HUD.js`, `Game.js`
**Complexity:** Low — 1 day

---

#### 1.6 Backline Rules (Out-of-Bounds Handling)
**What real polo does:**
- Ball over **sideline** → umpire throw-in from the spot
- Attacking team hits ball over **backline** (misses goal) → defending team gets free hit from goal area
- Defending team hits ball over own **backline** → attacking team gets penalty shot from 60-yard line

**Game adaptation:**
- Detect which team last touched the ball (track `lastHitTeam`)
- When ball exits over backline:
  - If last touched by attacking team → defending team's free restart from their goal mouth
  - If last touched by defending team → attacking team gets a free flick from the 60-yard equivalent (60% of field width)
- When ball exits over sideline → ball teleports back to exit point, current team gets free flick

**Files:** `GoalDetection.js` → rename/expand to `BoundarySystem.js`, `Game.js`, `Ball.js`
**Complexity:** Medium — 2 days

---

### PHASE 2 — The Line of the Ball & Fouls 🟠
*The defining strategic mechanic of polo.*

---

#### 2.1 Line of the Ball (LOB) — Visual
**What real polo does:** An imaginary line follows the ball's last trajectory. Has tactical meaning.

**Game adaptation (visual only first):**
- Track ball's last velocity vector → draw a faint dashed line extending through the field in the ball's direction of travel
- Line fades over 2 seconds after ball is hit
- Color coded: white normally, red if a player is crossing it dangerously

**Files:** `Renderer.js`, `Ball.js` (store `lastDirection`)
**Complexity:** Low — 1 day

---

#### 2.2 Line of the Ball — Right of Way Mechanic
**What real polo does:** The player on the right side of the LOB has right of way. Others must not cross it.

**Game adaptation:**
- After ball is hit, compute the LOB vector
- Determine which team's player is "on the line" (closest, riding in the ball's direction)
- That team gets a **tactical bonus next turn**: their move radius extends by +40px (they're "riding the line")
- If the other team's player is within a threshold of crossing the line → **foul flag raised** (implemented in Phase 2.3)
- Shown in HUD: small "RIGHT OF WAY →" indicator with team colour

**Files:** `TurnManager.js`, `Game.js`, `HUD.js`, `Renderer.js`
**Complexity:** Medium — 2–3 days

---

#### 2.3 Foul Detection & Penalty Shots
**What real polo does:** Crossing the LOB dangerously = foul → penalty shot.

**Foul types to implement:**

| Foul | Trigger | Penalty |
|---|---|---|
| **Line crossing** | Player moves to a position that intersects the active LOB | Penalty 3: free undefended shot from 25-yard equivalent |
| **Obstruction** | Player blocks ball movement without mallet reach | Penalty 4: free shot from 60-yard line |

**Penalty shot mechanic:**
- Foul detected → whistle sound → "FOUL!" announcement
- Fouled team's closest player is placed at penalty spot
- Human gets to execute the flick (full drag aiming) against an empty goal
- AI: auto-execute aimed at goal centre with slight noise

**Files:** `systems/FoulDetection.js` (new), `Game.js`, `HUD.js`, `Sounds.js`
**Complexity:** High — 3–4 days

---

#### 2.4 Mallet Hook (Legal Defensive Move)
**What real polo does:** A defender can legally hook the attacker's mallet if positioned on the correct side and not dangerously.

**Game adaptation:**
- During the opponent's flick setup, if one of your players is within `malletReach * 1.5` of the ball:
  - You get a **"Hook?"** prompt (click to hook)
  - If you hook: the flick power is halved and aim is deflected ±25°
  - If you miss the timing window (500ms): no effect
- AI uses hook with 30% probability when it has a player in position

**Files:** `Game.js` (input hook timing), `AIOpponent.js`, `Renderer.js` (hook indicator)
**Complexity:** Medium-High — 2–3 days

---

### PHASE 3 — Polish & Depth 🟡

---

#### 3.1 Handicap / Head-Start System
**What real polo does:** Lower-rated team starts with a goal advantage.

**Game adaptation:**
- Pre-match screen: player picks a **skill tier** (Novice / Club / Pro)
- Novice: AI starts with 2-goal advantage but uses 'easy' settings
- Club: level start, medium AI
- Pro: human starts with -1 goal (deficit), hard AI

**Files:** `Menus.js`, `Match.js`, `Game.js`
**Complexity:** Low — 1 day

---

#### 3.2 Halftime Break Ceremony
**What real polo does:** After chukka 2 (halfway), there's a 5-minute break. Famously, spectators walk onto the field to tread down divots of grass ("divot stomping").

**Game adaptation:**
- After chukka 2 ends → **halftime screen** shown for 3 seconds
- Animated field with small "divot" particles scattered and fading (stomped down)
- Shows halftime score, motivational message ("You're 2-1 up — hold the line!")
- Unique sound: crowd cheer + longer whistle sequence

**Files:** `Match.js`, `Game.js`, `Renderer.js` (divot animation), `Menus.js`, `Sounds.js`
**Complexity:** Low-Medium — 1 day

---

#### 3.3 Penalty Shootout (Tiebreaker)
**What real polo does:** Some tournaments use penalty shootouts if still tied after overtime.

**Game adaptation:**
- After overtime ends tied → **3-round penalty shootout**
- Each team gets 3 penalty shots alternately (one player at a time)
- Shot from 15-yard position (close range, undefended)
- Human drags to flick; AI auto-shoots
- Sudden death from round 4 onwards
- Separate shootout scoreboard shown

**Files:** `systems/PenaltyShootout.js` (new), `Game.js`, `Menus.js`
**Complexity:** Medium — 2 days

---

#### 3.4 Player Stamina (Chukka Fatigue)
**What real polo does:** Horses (ponies) tire between chukkas and must be swapped. In arena polo a pony plays max 2 of 4 chukkas.

**Game adaptation:**
- Each player token has a **stamina bar** (0–100%, shown as a thin arc under the token)
- Every turn a player is active: -10% stamina
- Low stamina (<30%): move radius shrinks by 20%, flick power capped at 80%
- Stamina refills between chukkas (full reset at chukka start)
- Strategic: you may want to rest certain players to keep them fresh for key moments

**Files:** `Player.js` (add `stamina`), `Renderer.js` (stamina arc), `TurnManager.js`, `Game.js`
**Complexity:** Medium — 2 days

---

#### 3.5 Ride-Off (Body Contact Mechanic)
**What real polo does:** Players can ride shoulder-to-shoulder to legally push an opponent off the line of the ball.

**Game adaptation:**
- When moving a player, if the destination is within `playerRadius * 2` of an opponent:
  - Show a **"Ride-Off!"** visual indicator
  - The opponent is physics-pushed sideways (apply a lateral impulse)
  - If push is too aggressive (angle > 45°) → foul
- Creates tactical blocking — you can shove the AI player off a good position

**Files:** `Player.js`, `Game.js` (`_tryMove` — detect proximity), `Renderer.js`
**Complexity:** Medium — 2 days

---

#### 3.6 Commentary & Match Narrative
**What polo has:** Live commentators calling the action.

**Game adaptation:**
- A thin ticker at the bottom of the screen shows contextual text:
  - `"#3 RED charges down the line!"` — when player moves toward goal
  - `"BLUE closes in on the ball..."` — when AI approaches
  - `"DANGER! Ball near the RED goal!"` — already have danger zone, add text
  - `"WHAT A SHOT!"` — on max-power flick
  - `"LAST CHUKKA — RED leads by 2!"` — at chukka 4 start
- 30–40 message templates, picked contextually

**Files:** `ui/Commentary.js` (new), `HUD.js`, `Game.js`
**Complexity:** Low-Medium — 1 day

---

#### 3.7 Match Statistics Screen
**What's missing:** No post-match data beyond score.

**Game adaptation:**
After game over, show a stats panel:
- Goals per chukka (mini bar chart)
- Total flicks taken (each team)
- Longest shot (ball distance from player when flicked)
- Most active player (token that moved most)
- Time ball was in each half (possession by zone)

**Files:** `entities/MatchStats.js` (new collector), `Menus.js` (stats display)
**Complexity:** Medium — 2 days

---

### PHASE 4 — Long-Term / Advanced 🟢

---

#### 4.1 2-Player Local Multiplayer (Hot Seat)
**What it adds:** Two humans take turns — Red and Blue — on the same device.

- Toggle in start menu: "vs AI" or "vs Friend"
- In vs Friend: both teams become human-controlled, AI disabled
- Turn indicator clearly shows whose turn it is (RED / BLUE flashing border)

**Files:** `Game.js`, `Menus.js`, `AIOpponent.js` (disable when 2P)
**Complexity:** Low — 1 day (most of the turn system already handles this)

---

#### 4.2 Arena Polo Mode
**What real polo does:** Arena polo is played indoors on a smaller enclosed field with 3-player teams (already how our game works). Different strategy — more wall play.

**Game adaptation:**
- Toggle: **Field Polo** (current, 4v4, open goals) vs **Arena Polo** (3v3, enclosed boards, ball bounces off all walls)
- Arena: no out-of-bounds (boards everywhere, ball always stays in play)
- Arena: faster pace, higher wall restitution, smaller field (800×500)
- Different visual theme: wooden boards instead of grass boundary

**Files:** `constants.js` (ARENA_CONFIG), `Engine.js`, `Renderer.js`, `Menus.js`
**Complexity:** Medium — 2–3 days

---

#### 4.3 Tournament Mode
**What it adds:** A sequence of 3 matches with increasing difficulty and handicap.

- Match 1: Easy AI, 0-goal handicap
- Match 2: Medium AI, +1 goal advantage to AI
- Match 3: Hard AI, +2 goal advantage to AI
- Persistent score tracked across matches
- Trophy screen on winning all 3

**Files:** `systems/Tournament.js` (new), `Menus.js`, `Game.js`
**Complexity:** Medium — 2 days

---

#### 4.4 Replay / Highlight Reel
**What it adds:** After each goal, show a 3-second replay of the last few seconds.

- Record the last 180 frames of ball + player positions in a circular buffer
- On goal: pause, rewind the buffer, replay at 0.5× speed
- Renderer renders from buffer instead of live physics

**Files:** `systems/Replay.js` (new), `Renderer.js`, `Game.js`
**Complexity:** High — 3–4 days

---

#### 4.5 Online Leaderboard (Requires Backend)
**What it adds:** Submit match score to a public leaderboard.

- POST score + name to a simple API (Netlify Functions or Supabase)
- Global top-10 shown on game over screen
- Only triggers if player entered their name at start

**Infrastructure:** Netlify Functions (free tier) + Supabase free DB
**Complexity:** High — 3 days

---

## PART 4: PRIORITISED IMPLEMENTATION ORDER

### Recommended sequence (maximum impact, minimum risk):

```
Week 1 — Core Polo Feel
─────────────────────────────────────────────────────────────────
[1] Phase 1.4  Difficulty selection on start screen      (0.5 days)
[2] Phase 1.2  4th player per team (4v4)                  (0.5 days)
[3] Phase 1.3  Player roles + formation spawning          (2 days)
[4] Phase 1.1  Ends swap after every goal                 (1 day)
[5] Phase 1.5  Sudden death overtime + golden chukka      (1 day)

Week 2 — Rules & Strategy
─────────────────────────────────────────────────────────────────
[6] Phase 2.1  Line of Ball — visual indicator            (1 day)
[7] Phase 1.6  Backline rules (out-of-bounds handling)    (2 days)
[8] Phase 2.2  Line of Ball — right of way bonus          (2 days)
[9] Phase 3.2  Halftime break ceremony                    (1 day)

Week 3 — Depth & Polish
─────────────────────────────────────────────────────────────────
[10] Phase 3.6 Commentary ticker                          (1 day)
[11] Phase 3.4 Player stamina system                      (2 days)
[12] Phase 3.5 Ride-off body contact                      (2 days)
[13] Phase 3.1 Handicap/skill tier on start               (1 day)

Week 4 — Advanced
─────────────────────────────────────────────────────────────────
[14] Phase 2.3 Foul detection + penalty shots             (4 days)
[15] Phase 4.1 2-player local multiplayer                 (1 day)
[16] Phase 3.7 Match statistics screen                    (2 days)
[17] Phase 3.3 Penalty shootout tiebreaker                (2 days)

Future
─────────────────────────────────────────────────────────────────
[18] Phase 4.2 Arena polo mode
[19] Phase 4.3 Tournament mode
[20] Phase 4.4 Replay / highlight reel
[21] Phase 4.5 Online leaderboard
```

---

## PART 5: WHAT MAKES IT FEEL LIKE POLO

The following features, when combined, create the core "polo feel" that a player will recognise even without knowing the rules:

| Feature | Why it matters |
|---|---|
| **Ends swap after goal** | The most visually distinctive polo moment — teams literally turn around |
| **Line of the Ball** | Strategic depth — you can't just flick wildly, you must respect the line |
| **Player roles (1–4)** | Makes positioning feel meaningful, not just "move nearest player" |
| **4v4 formation** | Fills the field, creates lanes, blocking opportunities |
| **Backline rules** | Out-of-bounds feel deliberate and tactical, not just physics bounces |
| **Ride-off** | Physicality — you can push opponents off their run, like real polo |
| **Stamina** | Forces rotation decisions — rest your #3 for the final chukka |
| **Halftime ceremony** | Cultural moment — divot stomping is iconic and adds personality |
| **Commentary ticker** | Gives voice to the action, makes every move feel narrated |
| **Sudden death overtime** | Tension spike — the golden goal rule is thrilling in real polo |

---

## PART 6: FILES TO CREATE / MODIFY

### New files needed:
```
src/systems/BoundarySystem.js     (replaces GoalDetection — handles all boundary events)
src/systems/FoulDetection.js      (LOB crossing, obstruction detection)
src/systems/PenaltyShootout.js    (shootout logic)
src/systems/Tournament.js         (tournament mode)
src/systems/Replay.js             (replay buffer)
src/entities/MatchStats.js        (stat collection)
src/ui/Commentary.js              (ticker commentary)
```

### Files to modify:
```
src/utils/constants.js            (4 players, difficulty configs, arena config)
src/entities/Player.js            (add role, stamina, rideOff method)
src/entities/Team.js              (4-player spawn, role-based formations, flipEnds)
src/entities/Match.js             (overtime, halftime, backline tracking)
src/ai/AIOpponent.js              (role-aware movement, difficulty tiers, hook logic)
src/core/Game.js                  (wire all new systems, foul handling, multiplayer toggle)
src/core/Renderer.js              (stamina arcs, LOB line, ride-off flash, divot anim)
src/ui/Menus.js                   (difficulty selector, handicap, halftime, stats)
src/ui/HUD.js                     (right-of-way indicator, commentary ticker)
src/audio/Sounds.js               (foul whistle, hook sound, crowd cheer, halftime)
```

---

## PART 7: QUICK WINS (Can Ship This Week)

These can be done in under a day each, with no risk of breaking existing functionality:

1. **Difficulty selection** — Add 3 buttons to start menu, pass choice to `AIOpponent`
2. **4th player** — Change `playersPerTeam: 3` → `4`, update spawn positions
3. **Ends swap after goal** — Flip all player X positions in `_onGoal`, show announcement
4. **Sudden death** — Add OT chukka in `Match._endChukka` when tied
5. **LOB visual** — Store ball's last velocity, draw a fading dashed line in `Renderer.js`
6. **Commentary ticker** — 40 template strings, render at bottom of HUD canvas

All 6 combined = **~3 days of work**, producing a noticeably more authentic polo experience.

---

*Document prepared: April 2026*
*Based on: U.S. Polo Association rules, Hurlingham Polo Magazine, Krono Polo rules guide, Museumplein Polo basic rules, Ligonier Polo basics, and full codebase analysis of all 13 source files.*
