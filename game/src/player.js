// player.js — Wren the thief: movement, collision, noise and pickups.
// One job: turn input into a position the level allows.

import { WIDTH, HEIGHT, hitsSolid, inShadow, atExit, idol, shards } from './level.js';
import { moveVector, running } from './input.js';
import { footstep } from './audio.js';

export const RADIUS = 15;
export const WALK_SPEED = 150;   // px per second, quiet
export const RUN_SPEED = 235;    // px per second, loud

export const player = {
  x: 0, y: 0, angle: 0, moving: false, isRunning: false,
  stepTimer: 0, hidden: false, hasIdol: false, shards: 0,
};

export function resetPlayer(start) {
  player.x = start.x; player.y = start.y;
  player.angle = 0; player.moving = false; player.isRunning = false;
  player.stepTimer = 0; player.hidden = false; player.hasIdol = false; player.shards = 0;
  idol.taken = false;
  for (const s of shards) s.taken = false;
}

/** Noise radius in pixels: guards inside it hear the thief. */
export function noiseRadius() {
  if (!player.moving) return 0;
  return player.isRunning ? 190 : 70;
}

export function updatePlayer(dt) {
  const v = moveVector();
  player.moving = !!v;
  player.isRunning = player.moving && running();
  if (v) {
    const speed = player.isRunning ? RUN_SPEED : WALK_SPEED;
    player.angle = Math.atan2(v.y, v.x);
    moveAxis(v.x * speed * dt, 0);
    moveAxis(0, v.y * speed * dt);
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = player.isRunning ? 0.26 : 0.42;
      footstep(player.isRunning, 0, 1);
    }
  }
  player.hidden = inShadow(player.x, player.y);

  // Pickups: the idol, then the moonshards.
  if (!idol.taken && Math.hypot(player.x - idol.x, player.y - idol.y) < 34) {
    idol.taken = true; player.hasIdol = true;
    return 'idol';
  }
  for (const s of shards) {
    if (!s.taken && Math.hypot(player.x - s.x, player.y - s.y) < 30) {
      s.taken = true; player.shards += 1;
      return 'shard';
    }
  }
  if (player.hasIdol && atExit(player.x, player.y)) return 'exit';
  return null;
}

function moveAxis(dx, dy) {
  const nx = player.x + dx, ny = player.y + dy;
  if (!hitsSolid(nx, player.y, RADIUS) && nx > RADIUS && nx < WIDTH - RADIUS) player.x = nx;
  if (!hitsSolid(player.x, ny, RADIUS) && ny > RADIUS && ny < HEIGHT - RADIUS) player.y = ny;
}
