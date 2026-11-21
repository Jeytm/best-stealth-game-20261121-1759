// audio.js — every sound is synthesized with WebAudio: no audio files at all.
// One job: footsteps, the alert sting, pickups and the win melody.

let ctx = null;
let muted = false;

function audio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

/** A soft floor tick. `loud` (running) is sharper and carries further. */
export function footstep(loud, pan = 0, vol = 0.5) {
  if (muted) return;
  const ac = audio(); if (!ac) return;
  const dur = 0.07;
  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = loud ? 900 : 420;
  const gain = ac.createGain();
  gain.gain.value = (loud ? 0.22 : 0.11) * vol;
  const panner = ac.createStereoPanner ? ac.createStereoPanner() : null;
  if (panner) { panner.pan.value = Math.max(-0.8, Math.min(0.8, pan)); src.connect(filter); filter.connect(gain); gain.connect(panner); panner.connect(ac.destination); }
  else { src.connect(filter); filter.connect(gain); gain.connect(ac.destination); }
  src.start();
}

function tone(freq, at, dur, type = 'sine', vol = 0.14) {
  if (muted) return;
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator();
  o.type = type; o.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, ac.currentTime + at);
  g.gain.linearRampToValueAtTime(vol, ac.currentTime + at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + at + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(ac.currentTime + at); o.stop(ac.currentTime + at + dur + 0.05);
}

/** Two rising notes: a guard has spotted you. */
export function alertSting() { tone(392, 0, 0.16, 'triangle', 0.16); tone(587, 0.12, 0.22, 'triangle', 0.16); }

/** A soft falling note: the guard lost you. */
export function calmDown() { tone(330, 0, 0.2, 'sine', 0.1); tone(262, 0.1, 0.28, 'sine', 0.1); }

/** A bright chime: shard or idol picked up. */
export function pickup(big = false) {
  tone(880, 0, 0.12, 'sine', 0.13);
  tone(1318, 0.07, 0.18, 'sine', 0.12);
  if (big) tone(1760, 0.14, 0.3, 'sine', 0.12);
}

/** Four-note win melody, unhurried. */
export function winJingle() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.13, 0.24, 'triangle', 0.14));
}

/** A low thud: caught. */
export function caughtThud() { tone(98, 0, 0.4, 'sawtooth', 0.16); tone(65, 0.1, 0.5, 'sawtooth', 0.14); }
