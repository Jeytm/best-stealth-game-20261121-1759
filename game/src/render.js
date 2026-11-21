// render.js — everything the eye sees: floor, walls, cover, cones, people, light.
// One job: draw the current game state on the canvas, nothing else.

import { TILE, COLS, ROWS, WIDTH, HEIGHT, walls, crates, shelves, shadows, idol, exitDoor, shards } from './level.js';
import { CONE_RANGE, CONE_HALF } from './guards.js';

function conePath(ctx, g, range, half) {
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, range, g.angle - half, g.angle + half);
  ctx.closePath();
}

export function draw(ctx, game, guards, player, time) {
  // Moonlit floor: a quiet checker of slate and stone.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = (r + c) % 2 ? '#171c2a' : '#1a2030';
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }

  // A worn rug down the middle hall.
  ctx.fillStyle = '#2a1f2e';
  ctx.fillRect(9 * TILE, 0, 2 * TILE, HEIGHT);
  ctx.strokeStyle = 'rgba(242,193,78,.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(9 * TILE + 6, 8, 2 * TILE - 12, HEIGHT - 16);

  // Shadow pools: dark floor where a thief is hard to see.
  for (const s of shadows) {
    ctx.fillStyle = 'rgba(2,4,10,.55)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(120,160,220,.18)';
    ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
  }

  drawExit(ctx, time);
  drawIdol(ctx, time);
  drawShards(ctx, time);
  drawCover(ctx);

  // Vision cones first, so people draw over them.
  for (const g of guards) drawCone(ctx, g);

  // Walls with a lit top edge, so the rooms read at a glance.
  for (const w of walls) {
    ctx.fillStyle = '#39415a';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#4d5878';
    ctx.fillRect(w.x, w.y, w.w, 5);
  }

  for (const g of guards) drawGuard(ctx, g, time);
  drawPlayer(ctx, player, time);

  // Night vignette: the edges of the archive stay dark.
  const v = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, HEIGHT * 0.42, WIDTH / 2, HEIGHT / 2, WIDTH * 0.62);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(2,3,8,.5)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawHudHint(ctx, game);
}

function drawExit(ctx, time) {
  const pulse = 0.55 + 0.25 * Math.sin(time * 2.2);
  ctx.fillStyle = `rgba(60,200,110,${pulse})`;
  ctx.fillRect(exitDoor.x, exitDoor.y, exitDoor.w, exitDoor.h);
  ctx.fillStyle = '#0d2b16';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exitDoor.x + TILE / 2, exitDoor.y + TILE / 2 + 5);
  ctx.strokeStyle = 'rgba(140,255,170,.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(exitDoor.x + 2, exitDoor.y + 2, TILE - 4, TILE - 4);
}

function drawIdol(ctx, time) {
  if (idol.taken) {
    // Empty case: a pale pedestal where the idol was.
    ctx.fillStyle = '#2c3348';
    ctx.fillRect(idol.x - 18, idol.y - 12, 36, 24);
    return;
  }
  const glow = ctx.createRadialGradient(idol.x, idol.y, 4, idol.x, idol.y, 58);
  glow.addColorStop(0, 'rgba(255,154,60,.85)');
  glow.addColorStop(1, 'rgba(255,154,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(idol.x - 58, idol.y - 58, 116, 116);
  // The idol: a small ember diamond, bobbing.
  const bob = Math.sin(time * 2.5) * 3;
  ctx.save();
  ctx.translate(idol.x, idol.y + bob);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#ff9a3c';
  ctx.fillRect(-11, -11, 22, 22);
  ctx.fillStyle = '#ffd27a';
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,210,122,.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(idol.x - 22, idol.y - 16, 44, 32);
}

function drawShards(ctx, time) {
  for (const s of shards) {
    if (s.taken) continue;
    const bob = Math.sin(time * 3 + s.x) * 2;
    ctx.save();
    ctx.translate(s.x, s.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#9fd8e8';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#e8fbff';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }
}

function drawCover(ctx) {
  for (const c of crates) {
    ctx.fillStyle = '#6b5433';
    ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.strokeStyle = '#8a6f45';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 7, c.y + 7, c.w - 14, c.h - 14);
    ctx.beginPath();
    ctx.moveTo(c.x + 7, c.y + 7); ctx.lineTo(c.x + c.w - 7, c.y + c.h - 7);
    ctx.moveTo(c.x + c.w - 7, c.y + 7); ctx.lineTo(c.x + 7, c.y + c.h - 7);
    ctx.stroke();
  }
  for (const s of shelves) {
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
    ctx.fillStyle = '#7a5a34';
    for (let i = 0; i < 3; i++) ctx.fillRect(s.x + 6, s.y + 10 + i * 18, s.w - 12, 8);
    ctx.strokeStyle = '#2c1d10';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
  }
}

function drawCone(ctx, g) {
  const alerted = g.state !== 'patrol';
  const color = g.state === 'chase' ? '255,70,50' : alerted ? '255,190,60' : '242,210,110';
  const alpha = g.seen ? 0.34 : 0.2;
  ctx.fillStyle = `rgba(${color},${alpha})`;
  conePath(ctx, g, CONE_RANGE, CONE_HALF);
  ctx.fill();
  ctx.strokeStyle = `rgba(${color},.5)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, g, time) {
  // A chasing guard pulses red, so the danger reads across the room.
  if (g.state === 'chase') {
    const pulse = 0.5 + 0.5 * Math.sin(time * 8);
    ctx.strokeStyle = `rgba(255,80,64,${0.25 + 0.35 * pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(g.x, g.y, 30 + pulse * 6, 0, Math.PI * 2); ctx.stroke();
  }
  // Body: a night-blue watchman with a brass helmet.
  ctx.fillStyle = '#232c44';
  ctx.beginPath(); ctx.arc(g.x, g.y, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9a24a';
  ctx.beginPath(); ctx.arc(g.x, g.y, 11, 0, Math.PI * 2); ctx.fill();
  // Facing tick: where the guard is looking.
  ctx.strokeStyle = '#f2e6b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 22, g.y + Math.sin(g.angle) * 22);
  ctx.stroke();
  // "!" when suspicious, "?" while checking a noise, pulsing when chasing.
  if (g.state === 'chase') {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 24 + Math.sin(time * 8) * 2);
  } else if (g.state === 'suspicious') {
    ctx.fillStyle = '#ffd75e';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.suspect ? '?' : '!', g.x, g.y - 24);
  }
}

function drawPlayer(ctx, p, time) {
  // Running is loud: show the noise ring so the player feels how far sound carries.
  if (p.isRunning) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);
    ctx.strokeStyle = `rgba(232,226,207,${0.10 + 0.12 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 190, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(232,226,207,${0.06 + 0.08 * pulse})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 70, 0, Math.PI * 2); ctx.stroke();
  }
  // Wren: a teal cloak, darker in shadow.
  const bob = p.moving ? Math.sin(time * 14) * 1.5 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.fillStyle = p.hidden ? '#14505a' : '#1f7a6e';
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0f3d36';
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#bfe8d8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(p.angle) * 19, Math.sin(p.angle) * 19);
  ctx.stroke();
  ctx.restore();
  if (p.hasIdol) {
    ctx.fillStyle = '#ff9a3c';
    ctx.beginPath(); ctx.arc(p.x + 12, p.y - 12, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawHudHint(ctx, game) {
  if (game.phase !== 'playing') return;
  ctx.fillStyle = 'rgba(232,226,207,.75)';
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  const line = game.detection > 0.02
    ? (game.detection >= 0.55 ? 'They saw you — break line of sight!' : 'A guard is watching… stay out of the cone.')
    : (playerHasIdol(game) ? 'Idol in hand — reach the green door!' : 'Reach the glowing idol, then the green door.');
  ctx.fillText(line, 18, HEIGHT - 14);
}

function playerHasIdol(game) { return game.player && game.player.hasIdol; }
