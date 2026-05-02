// All tunables live here. Touch this file to tweak feel.

export const FIELD = {
  width: 960,
  height: 600,
  margin: 24,
  centerX: 480,
  centerY: 300,
  // Goal opening (along the side walls)
  goalWidth: 180,
  goalDepth: 28,
};

export const COLORS = {
  grassA: '#1f5a33',
  grassB: '#1a4f2c',
  grassStripe: 'rgba(255,255,255,0.03)',
  line: 'rgba(255,255,255,0.82)',
  lineSoft: 'rgba(255,255,255,0.35)',
  boards: '#3a2b1a',
  boardsLight: '#5b4428',
  ball: '#f5f2e7',
  ballShade: '#b8b3a0',
  teamA: '#d93636',       // red
  teamAInk: '#ffb5b5',
  teamB: '#2b6fd6',       // blue
  teamBInk: '#b7d4ff',
  highlight: '#ffd166',
  danger: '#ff4e4e',
  ink: '#f4f7fb',
  mallet: '#e3cba3',
  malletDark: '#6b4a2a',
  shadow: 'rgba(0,0,0,0.35)',
  goalNet: 'rgba(255,255,255,0.28)',
};

export const PHYSICS = {
  gravity: 0,              // top-down
  ballRadius: 9,
  ballRestitution: 0.45,
  ballFriction: 0.01,
  ballFrictionAir: 0.018,  // ball travels 80-90% field at max power, stops in ~4s
  ballDensity: 0.0015,

  playerRadius: 14,
  playerRestitution: 0.3,
  playerFriction: 0.02,
  playerFrictionAir: 0.25,
  playerDensity: 0.008,

  wallRestitution: 0.6,

  // Flick
  maxDragDistance: 160,
  flickPowerScale: 0.00055, // impulse per pixel of drag
  malletReach: 26,          // px from player center to mallet tip
};

export const MOVEMENT = {
  moveRadius: 150,
  moveSpeed: 240,           // px/sec
  turnStopSpeed: 0.15,
  stopHoldMs: 4000,
  rowBonusPx: 50,           // extra move radius when you hold right-of-way
};

export const MATCH = {
  chukkas: 4,
  chukkaSeconds: 120,        // 2 min — 8 min match total
  overtimeSeconds: 90,       // golden chukka — sudden death
  playersPerTeam: 4,         // real polo: 4 players per team
};

export const AI = {
  reactionMs: 420,           // base (medium) reaction
  moveNoise: 14,
  flickNoiseAngle: 0.18,     // radians jitter
  flickPowerMin: 0.55,
  flickPowerMax: 0.95,
  longShotChance: 0.25,

  // Per-difficulty overrides — read by AIOpponent
  difficulty: {
    easy:   { reactionMs: 900,  noiseAngle: 0.40, longShotChance: 0.08, supportMove: false },
    medium: { reactionMs: 420,  noiseAngle: 0.18, longShotChance: 0.25, supportMove: true  },
    hard:   { reactionMs: 220,  noiseAngle: 0.07, longShotChance: 0.42, supportMove: true  },
  },
};

// Handicap tiers — player picks on start screen
// headStart > 0 = human starts ahead; < 0 = human starts behind (Pro challenge)
export const HANDICAP = {
  novice: { difficulty: 'easy',   headStart:  2, label: 'Novice',  desc: '+2 goal head-start' },
  club:   { difficulty: 'medium', headStart:  0, label: 'Club',    desc: 'Level playing field' },
  pro:    { difficulty: 'hard',   headStart: -1, label: 'Pro',     desc: 'AI gets +1 head-start' },
};

// Arena polo mode configuration (overrides FIELD + some PHYSICS values)
export const ARENA = {
  field: {
    width:     720,
    height:    440,
    margin:    20,
    centerX:   360,
    centerY:   220,
    goalWidth: 130,
    goalDepth: 22,
  },
  playersPerTeam: 3,            // arena polo is 3v3
  wallRestitution: 0.82,        // boards are bouncier
  ballFrictionAir:  0.014,      // slightly faster / more live ball
  boardColor:  '#5b3a1a',
  boardLight:  '#7a5530',
  grassA:      '#1a3d25',
  grassB:      '#163320',
};

export const DEBUG = {
  showBodies: false,
  showMalletReach: false,
  logEvents: false,
};

export function getTeamColor(teamId) {
  return teamId === 0 ? COLORS.teamA : COLORS.teamB;
}
export function getTeamInk(teamId) {
  return teamId === 0 ? COLORS.teamAInk : COLORS.teamBInk;
}

// Matter.js collision category bitmasks
export const CATEGORY = {
  wall:   0x0001,
  ball:   0x0002,
  player: 0x0004,
  goal:   0x0008,
};
