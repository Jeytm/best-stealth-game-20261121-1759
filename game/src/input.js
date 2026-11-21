// input.js — keyboard and mouse, one job: tell the game what the player is doing.

export const keys = new Set();
export let mouse = { x: 0, y: 0, down: false };

const MOVE = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function bindInput(canvas, onAction) {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (onAction) onAction(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', () => { mouse.down = true; });
  window.addEventListener('mouseup', () => { mouse.down = false; });
}

/** Unit movement vector from the keys currently held, or null when idle. */
export function moveVector() {
  let x = 0, y = 0;
  for (const code of keys) {
    const d = MOVE[code];
    if (d === 'up') y -= 1;
    else if (d === 'down') y += 1;
    else if (d === 'left') x -= 1;
    else if (d === 'right') x += 1;
  }
  if (x === 0 && y === 0) return null;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}

export function running() {
  return keys.has('ShiftLeft') || keys.has('ShiftRight');
}
