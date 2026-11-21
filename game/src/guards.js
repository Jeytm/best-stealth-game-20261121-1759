// guards.js — the archive's night watch: patrols, vision cones, suspicion and chase.
// One job: decide what each guard sees, feels and does.

import { TILE, sightBlocked, hitsSolid } from './level.js';
import { player, noiseRadius } from './player.js';
import { footstep, alertSting, calmDown } from './audio.js';

export const CONE_RANGE = 260;
export const CONE_HALF = 0.61;      // ~35 degrees each side
export const RADIUS = 16;

const PATROL_SPEED = 62;
const CHASE_SPEED = 148;
const SUSPICIOUS_SPEED = 92;

const FILL_BASE = 0.55;             // detection per second, point blank in the open
const DRAIN_RATE = 0.30;            // detection per second while unseen
const LOSE_SIGHT_TIME = 2.5;        // seconds out of sight before a chase gives up

// Waypoint loops, in tile coordinates: three patrols a thief can learn.
const PATROLS = [
  [[15.5, 1.5], [18.5, 1.5], [18.5, 4.5], [15.5, 4.5]],
  [[1.5, 8.5], [5.5, 8.5], [5.5, 4.5], [1.5, 4.5]],
  [[13.5, 8.5], [17.5, 8.5], [17.5, 10.5], [13.5, 10.5]],
];

export const guards = [];

export function resetGuards() {
  guards.length = 0;
  const starts = { 1: 0, 2: 1, 3: 2 };
  for (const [key, pi] of Object.entries(starts)) {
    const wps = PATROLS[pi].map(([cx, cy]) => ({ x: cx * TILE, y: cy * TILE }));
    guards.push({
      x: wps[0].x, y: wps[0].y, angle: 0, wp: 1, waypoints: wps,
      state: 'patrol',        // patrol | suspicious | chase
      suspect: null,          // {x,y} a noise the guard walks to check
      chaseTimer: 0, lostTimer: 0, stepTimer: 0,
      seen: false,            // this guard currently sees the player
    });
  }
  guards[0].angle = Math.PI;      // first guard starts facing west, down the corridor
  guards[1].angle = Math.PI / 2;
  guards[2].angle = 0;
}

/** True when this guard can see the player right now. */
export function canSee(g) {
  const dx = player.x - g.x, dy = player.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return false;
  let diff = Math.atan2(dy, dx) - g.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > CONE_HALF) return false;
  if (sightBlocked(g.x, g.y, player.x, player.y)) return false;
  return true;
}

/** How fast this guard fills the SEEN meter: closer is faster, shadows slow it. */
function fillRate(g) {
  const dist = Math.hypot(player.x - g.x, player.y - g.y);
  let rate = FILL_BASE * (1.25 - dist / (CONE_RANGE * 1.6));
  if (player.hidden) rate *= 0.35;
  if (player.isRunning) rate *= 1.25;
  return Math.max(0.12, rate);
}

export function updateGuards(dt, game) {
  const noise = noiseRadius();
  for (const g of guards) {
    g.seen = canSee(g);

    // The meter: any guard that sees you fills it; hidden, it drains.
    if (g.seen) game.detection = Math.min(1, game.detection + fillRate(g) * dt);

    if (g.state === 'patrol') {
      if (g.seen && game.detection >= 0.55) {
        g.state = 'suspicious';
        g.suspect = { x: player.x, y: player.y };
        alertSting();
      } else if (noise > 0 && Math.hypot(player.x - g.x, player.y - g.y) < noise) {
        g.state = 'suspicious';
        g.suspect = { x: player.x, y: player.y };
      } else {
        walkWaypoints(g, dt, PATROL_SPEED);
      }
    } else if (g.state === 'suspicious') {
      if (game.detection >= 1) {
        g.state = 'chase'; g.chaseTimer = 0;
        alertSting();
      } else if (g.seen) {
        g.angle = Math.atan2(player.y - g.y, player.x - g.x);
      } else if (g.suspect) {
        walkToward(g, g.suspect.x, g.suspect.y, dt, SUSPICIOUS_SPEED);
        if (Math.hypot(g.x - g.suspect.x, g.y - g.suspect.y) < 18) {
          g.state = 'patrol'; g.suspect = null;
          calmDown();
        }
      }
    } else if (g.state === 'chase') {
      g.chaseTimer += dt;
      walkToward(g, player.x, player.y, dt, CHASE_SPEED);
      if (g.seen) g.lostTimer = 0;
      else {
        g.lostTimer += dt;
        if (g.lostTimer > LOSE_SIGHT_TIME) {
          g.state = 'suspicious';
          g.suspect = { x: player.x, y: player.y };
          g.lostTimer = 0;
          calmDown();
        }
      }
      if (Math.hypot(player.x - g.x, player.y - g.y) < RADIUS + 15) game.caught = true;
    }

    // Footsteps: the guard's own, quieter with distance, so you can hear him coming.
    g.stepTimer -= dt;
    if (g.stepTimer <= 0 && (g.state !== 'patrol' || Math.hypot(player.x - g.x, player.y - g.y) < 420)) {
      g.stepTimer = g.state === 'chase' ? 0.3 : 0.55;
      const d = Math.hypot(player.x - g.x, player.y - g.y);
      const pan = Math.max(-1, Math.min(1, (g.x - player.x) / 300));
      footstep(false, pan, Math.max(0.05, 1 - d / 460));
    }
  }

  // Drain the meter when nobody sees the player.
  if (!guards.some((g) => g.seen)) {
    game.detection = Math.max(0, game.detection - DRAIN_RATE * dt);
    if (game.detection < 0.55) {
      for (const g of guards) if (g.state === 'suspicious' && !g.suspect) g.state = 'patrol';
    }
  }
}

function walkWaypoints(g, dt, speed) {
  const t = g.waypoints[g.wp];
  walkToward(g, t.x, t.y, dt, speed);
  if (Math.hypot(g.x - t.x, g.y - t.y) < 10) g.wp = (g.wp + 1) % g.waypoints.length;
}

function walkToward(g, tx, ty, dt, speed) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const nx = g.x + (dx / d) * speed * dt;
  const ny = g.y + (dy / d) * speed * dt;
  g.angle = Math.atan2(dy, dx);
  // Guards slide along walls: try x, then y.
  if (!blockedAt(nx, g.y)) g.x = nx;
  if (!blockedAt(g.x, ny)) g.y = ny;
}

function blockedAt(x, y) {
  return hitsSolid(x, y, RADIUS);
}
