// level.js — the archive floor: walls, cover, shadows, the idol and the exit.
// One job: own the map and answer geometry questions (solid? blocks sight? dark?).

export const TILE = 64;
export const COLS = 20;
export const ROWS = 12;
export const WIDTH = COLS * TILE;   // 1280
export const HEIGHT = ROWS * TILE;  // 768, HUD floats above it

// Legend: # wall · C crate · S bookshelf · ~ shadow pool · I idol case · E exit door · P start
const MAP = [
  '####################',
  '#P....~......#.....#',
  '#.CC..~......#.1...#',
  '#.....~..S...#.....#',
  '#..S......S....S...#',
  '#.....##.......##..#',
  '#..~..##..I...##.E.#',
  '#.....##.......##..#',
  '#.2...S....S....3..#',
  '#......~...~.......#',
  '#....CC....~....CC.#',
  '####################',
];

export const walls = [];    // {x,y,w,h} solid, blocks movement and sight
export const crates = [];   // {x,y,w,h} low cover, blocks sight, walkable around
export const shelves = [];  // {x,y,w,h} tall cover, blocks sight, solid
export const shadows = [];  // {x,y,w,h} dark floor, hides the player
export let idol = { x: 0, y: 0, taken: false };
export let exitDoor = { x: 0, y: 0, w: TILE, h: TILE };
export let playerStart = { x: 96, y: 96 };
export const shards = [];   // {x,y,taken}

const guardStarts = {};

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const ch = MAP[r][c];
    const x = c * TILE, y = r * TILE;
    if (ch === '#') walls.push({ x, y, w: TILE, h: TILE });
    else if (ch === 'C') crates.push({ x, y, w: TILE, h: TILE });
    else if (ch === 'S') shelves.push({ x, y, w: TILE, h: TILE });
    else if (ch === '~') shadows.push({ x, y, w: TILE, h: TILE });
    else if (ch === 'I') idol = { x: x + TILE / 2, y: y + TILE / 2, taken: false };
    else if (ch === 'E') exitDoor = { x, y, w: TILE, h: TILE };
    else if (ch === 'P') playerStart = { x: x + TILE / 2, y: y + TILE / 2 };
    else if (ch >= '1' && ch <= '3') guardStarts[ch] = { x: x + TILE / 2, y: y + TILE / 2 };
  }
}

// Three moonshards, tucked where a patient thief would look.
shards.push({ x: 3.5 * TILE, y: 9.5 * TILE, taken: false });
shards.push({ x: 17.5 * TILE, y: 1.5 * TILE, taken: false });
shards.push({ x: 10.5 * TILE, y: 10.5 * TILE, taken: false });

export const guardSpawns = guardStarts;

function rectsHit(list, x, y, r) {
  for (const b of list) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
  }
  return null;
}

/** True when a circle at (x,y) with radius r touches anything solid. */
export function hitsSolid(x, y, r) {
  return rectsHit(walls, x, y, r) || rectsHit(shelves, x, y, r);
}

export function inShadow(x, y) {
  for (const s of shadows) if (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) return true;
  return false;
}

/** Segment (x1,y1)-(x2,y2) against one rect; true when it crosses the rect. */
function segmentHitsRect(x1, y1, x2, y2, b) {
  const dx = x2 - x1, dy = y2 - y1;
  let tmin = 0, tmax = 1;
  for (const [p, q] of [[-dx, x1 - b.x], [dx, b.x + b.w - x1], [-dy, y1 - b.y], [dy, b.y + b.h - y1]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > tmax) return false; if (t > tmin) tmin = t; }
    else { if (t < tmin) return false; if (t < tmax) tmax = t; }
  }
  return true;
}

/** True when walls, shelves or crates stand between two points. */
export function sightBlocked(x1, y1, x2, y2) {
  for (const list of [walls, shelves, crates]) {
    for (const b of list) if (segmentHitsRect(x1, y1, x2, y2, b)) return true;
  }
  return false;
}

/** True when the point is inside the exit doorway. */
export function atExit(x, y) {
  return x > exitDoor.x + 6 && x < exitDoor.x + exitDoor.w - 6 &&
         y > exitDoor.y + 6 && y < exitDoor.y + exitDoor.h - 6;
}
