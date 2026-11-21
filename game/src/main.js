// main.js — the game itself: state machine, loop, HUD, and the staged photo hook.
// One job: own the run of the game from title to win or caught.

import { TILE, playerStart, idol } from './level.js';
import { bindInput } from './input.js';
import { player, resetPlayer, updatePlayer } from './player.js';
import { guards, resetGuards, updateGuards } from './guards.js';
import { draw } from './render.js';
import { applyShot } from './shots.js';
import { toggleMute, pickup, winJingle, caughtThud } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const banner = document.getElementById('banner');
const meterFill = document.getElementById('meter-fill');
const shardsEl = document.getElementById('hud-shards');
const timeEl = document.getElementById('hud-time');
const objectiveEl = document.getElementById('hud-objective');

export const game = {
  phase: 'title',      // title | playing | caught | won
  detection: 0,        // 0..1, the SEEN meter
  caught: false,
  frozen: false,       // a staged shot: render once, never update
  player,
  time: 0,
};

let last = performance.now();

function reset() {
  resetPlayer(playerStart);
  resetGuards();
  game.detection = 0;
  game.caught = false;
  game.time = 0;
  overlay.classList.remove('show');
  banner.classList.remove('show');
  objectiveEl.textContent = 'Steal the Ember Idol, then slip out the green door — unseen.';
}

function start() {
  reset();
  game.phase = 'playing';
}

function caught() {
  game.phase = 'caught';
  caughtThud();
  overlay.querySelector('h1').innerHTML = 'SPOTTED!';
  overlay.querySelector('.sub').textContent = 'A guard caught you in the lamplight.';
  overlay.querySelector('.goal').innerHTML = 'The archive keeps its idol — this time.<br>Learn the patrols, mind the cones, use the dark.';
  overlay.querySelector('.press').innerHTML = 'Press <b>R</b> to try again';
  overlay.classList.add('show');
}

function won() {
  game.phase = 'won';
  winJingle();
  overlay.querySelector('h1').innerHTML = 'UNSEEN.<br>THE IDOL IS YOURS.';
  overlay.querySelector('.sub').textContent = `Finished in ${fmtTime(game.time)} with ${player.shards} of 3 moonshards.`;
  overlay.querySelector('.goal').innerHTML = 'You crossed the archive like a shadow and left<br>with the Ember Idol. The guards never knew.';
  overlay.querySelector('.press').innerHTML = 'Press <b>R</b> to play again';
  overlay.classList.add('show');
}

function fmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function showBanner(text, calm = false) {
  banner.textContent = text;
  banner.classList.toggle('calm', calm);
  banner.classList.add('show');
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => banner.classList.remove('show'), 2200);
}

function update(dt) {
  game.time += dt;
  const event = updatePlayer(dt);
  if (event === 'idol') {
    pickup(true);
    showBanner('THE EMBER IDOL IS YOURS', true);
    objectiveEl.textContent = 'Idol in hand — reach the green door, unseen.';
  } else if (event === 'shard') {
    pickup(false);
  } else if (event === 'exit') {
    won();
    return;
  }
  updateGuards(dt, game);
  if (game.caught) { caught(); return; }

  // The banner follows the danger: chase, then suspicion, then calm.
  if (guards.some((g) => g.state === 'chase')) showBanner('SPOTTED — RUN FOR THE DARK!');
  else if (guards.some((g) => g.state === 'suspicious')) showBanner('SUSPICIOUS — STAY OUT OF SIGHT');
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen && game.phase === 'playing') update(dt);
  draw(ctx, game, guards, player, now / 1000);

  // HUD: the SEEN meter, shards, clock.
  const pct = Math.round(game.detection * 100);
  meterFill.style.width = pct + '%';
  meterFill.style.background = game.detection >= 1 ? '#ff5040' : game.detection >= 0.55 ? '#ff9a3c' : '#f2c14e';
  shardsEl.textContent = `Moonshards ${player.shards} / 3`;
  timeEl.textContent = fmtTime(game.time);

  requestAnimationFrame(frame);
}

bindInput(canvas, (code) => {
  if (code === 'Enter' && game.phase === 'title') start();
  else if (code === 'KeyR' && (game.phase === 'caught' || game.phase === 'won')) start();
  else if (code === 'KeyM') toggleMute();
});

// Staged screenshots: ?shot=cover|hide|alarm|win poses the real game, then freezes it.
const shot = new URLSearchParams(location.search).get('shot');
reset();
if (shot && applyShot(shot, game, guards, player)) {
  game.phase = shot === 'win' ? 'won' : 'playing';
  game.frozen = true;
  overlay.classList.remove('show');
  if (shot === 'win') {
    overlay.querySelector('h1').innerHTML = 'UNSEEN.<br>THE IDOL IS YOURS.';
    overlay.querySelector('.sub').textContent = 'The idol leaves the archive tonight.';
    overlay.querySelector('.goal').innerHTML = 'You crossed the archive like a shadow and left<br>with the Ember Idol. The guards never knew.';
    overlay.querySelector('.press').innerHTML = '';
    overlay.classList.add('show');
  }
  // Test hook: the automation reads the posed state back.
  window.__game = { game, guards, player, idol };
} else {
  window.__game = { game, guards, player, idol };
}

requestAnimationFrame(frame);
