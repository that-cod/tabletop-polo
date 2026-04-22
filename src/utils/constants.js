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
  turnStopSpeed: 0.15,      // only fire when ball is truly at rest
  stopHoldMs: 4000,         // 4 seconds of rest before turn switches
};

export const MATCH = {
  chukkas: 4,
  chukkaSeconds: 120,        // 2 min — 8 min match total
  playersPerTeam: 3,
};

export const AI = {
  reactionMs: 420,          // snappier reaction
  moveNoise: 14,
  flickNoiseAngle: 0.18,    // radians jitter
  flickPowerMin: 0.55,      // fraction of maxDrag
  flickPowerMax: 0.95,
  longShotChance: 0.25,     // 25% chance of aggressive long-range shot
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
