[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Jeytm/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Jeytm/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Night in the Ember Archive

A top-down stealth game, built for the [make.fun bounty](https://make.fun/bounty/best-stealth-game-20261121-1759). You are Wren, a thief in a moonlit archive. Steal the Ember Idol from its case, then slip out the green door — unseen.

## How to play

Serve `game/` and open it in a desktop browser (no build step, no network requests):

```sh
node serve.ts
# open http://localhost:8080
```

- **Move:** WASD / arrow keys — **Shift** to run (faster, louder)
- **M:** mute
- **Enter:** begin · **R:** try again after being caught or winning

## The stealth

- Three guards patrol fixed routes with visible vision cones. Learn their loops; a route that is safe now may not be in ten seconds.
- Crates and bookshelves block a guard's sight. Dark floor hides you — the SEEN meter fills far slower in shadow.
- If a cone finds you, the SEEN meter fills. Break line of sight and it drains again — you get a chance to recover. A full meter means a chase; break sight for a few seconds and the guard gives up and goes back to checking noises.
- Running is loud: guards hear footsteps and come to look.
- Three optional moonshards are tucked around the archive for patient thieves.

## Layout

- `main.ts` — hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` (run `MAKEFUN_OUTPUT_DIR=out node main.ts`).
- `game/index.html` + `game/styles.css` — page shell and HUD.
- `game/src/main.js` — state machine and game loop.
- `game/src/level.js` — the archive floor: walls, cover, shadows, idol, exit.
- `game/src/guards.js` — patrols, vision cones, suspicion and chase.
- `game/src/player.js` — movement, collision, noise, pickups.
- `game/src/render.js` — all canvas drawing.
- `game/src/audio.js` — footsteps, alerts and chimes, synthesized with WebAudio.
- `game/src/input.js` — keyboard and mouse.
- `game/src/shots.js` — staged screenshot poses through the game's own state.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `screenshots/` — four real renders of the game in a browser.

Everything is original: my own idea, art, sounds and names. No libraries, no copied assets.
