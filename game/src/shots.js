// shots.js — staged screenshot states, driven through the game's own state.
// One job: pose the real game for a photo. Nothing here draws or fakes a frame:
// each shot sets player/guard positions and the detection meter, then freezes the
// update loop so the normal renderer paints exactly that moment.

import { TILE, idol } from './level.js';

const POS = {
  // Just west of the row-2 crates: guard 1's west-facing cone stops at them.
  behindCrates: { x: 1.5 * TILE, y: 2.5 * TILE },
  // Open floor where guard 2 can catch the thief in the open.
  openFloor: { x: 4.5 * TILE, y: 6.5 * TILE },
};

/** Apply a staged state. Returns true when a shot was applied. */
export function applyShot(name, game, guards, player) {
  const g1 = guards[0], g2 = guards[1], g3 = guards[2];
  if (name === 'cover') {
    // The whole level at a glance: cones, cover, idol, exit.
    player.x = 1.5 * TILE; player.y = 1.5 * TILE;
    g1.x = 16.5 * TILE; g1.y = 1.5 * TILE; g1.angle = Math.PI;
    g2.x = 3.5 * TILE; g2.y = 8.5 * TILE; g2.angle = 0;
    g3.x = 15.5 * TILE; g3.y = 8.5 * TILE; g3.angle = Math.PI / 2;
    game.detection = 0;
    return true;
  }
  if (name === 'hide') {
    // Tucked behind the row-2 crates while guard 1's cone sweeps past them.
    player.x = POS.behindCrates.x; player.y = POS.behindCrates.y;
    player.angle = 0;
    g1.x = 5.5 * TILE; g1.y = 2.5 * TILE; g1.angle = Math.PI;   // facing the crates
    g2.x = 3.5 * TILE; g2.y = 8.5 * TILE; g2.angle = -Math.PI / 2;
    g3.x = 15.5 * TILE; g3.y = 10.5 * TILE; g3.angle = Math.PI;
    game.detection = 0.08;
    return true;
  }
  if (name === 'alarm') {
    // Caught in the open: the meter two-thirds full, guard 2 suspicious.
    player.x = POS.openFloor.x; player.y = POS.openFloor.y;
    player.angle = Math.PI;
    g2.x = 3.5 * TILE; g2.y = 8.5 * TILE; g2.angle = -Math.PI / 2;
    g2.state = 'suspicious'; g2.suspect = { x: player.x, y: player.y };
    g1.x = 16.5 * TILE; g1.y = 3.5 * TILE; g1.angle = Math.PI / 2;
    g3.x = 14.5 * TILE; g3.y = 9.5 * TILE; g3.angle = 0;
    game.detection = 0.68;
    return true;
  }
  if (name === 'win') {
    // Idol in hand, stepping through the green door.
    idol.taken = true;
    player.hasIdol = true;
    player.x = 17.5 * TILE; player.y = 6.5 * TILE;
    player.angle = 0;
    g1.x = 16.5 * TILE; g1.y = 1.5 * TILE; g1.angle = Math.PI;
    g2.x = 3.5 * TILE; g2.y = 8.5 * TILE; g2.angle = 0;
    g3.x = 13.5 * TILE; g3.y = 10.5 * TILE; g3.angle = -Math.PI / 2;
    game.detection = 0;
    game.phase = 'won';
    return true;
  }
  return false;
}
