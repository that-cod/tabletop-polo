export const TAU = Math.PI * 2;

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp  = (a, b, t) => a + (b - a) * t;

export const dist = (ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  return Math.hypot(dx, dy);
};

export const dist2 = (ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  return dx * dx + dy * dy;
};

export const angleBetween = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);

export const norm = (x, y) => {
  const m = Math.hypot(x, y) || 1;
  return { x: x / m, y: y / m };
};

export const rand = (a, b) => a + Math.random() * (b - a);
export const chance = (p) => Math.random() < p;
