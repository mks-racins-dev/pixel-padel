// In-game radio: a few stations of original music, generated on the Web Audio clock.
// Each station has its own tempo, chord progression, drum pattern, bass line and sound, and a
// melody built from a seeded motif (so it repeats like a real song, with small variations).
// Everything goes through a soft bus: lowpass, a short echo and a compressor, so it sits under the game.
import { S } from '../state.js';
import { OPTS, vol, saveOpts } from '../game/opts.js';

const N = n => 440 * Math.pow(2, (n - 69) / 12);
const MAJ7 = [0, 4, 7, 11], MIN7 = [0, 3, 7, 10], DOM7 = [0, 4, 7, 10], MAJ = [0, 4, 7], MIN = [0, 3, 7], MIN9 = [0, 3, 7, 10, 14], MAJ9 = [0, 4, 7, 11, 14];

/** Drum and part patterns are 16 steps per bar: x = hit, o = soft hit, . = rest. */
export const STATIONS = [
  { id: 'padelfm', name: 'PADEL FM', sub: 'beach house', bpm: 118, swing: 0, seed: 11,
    prog: [[53, MAJ7], [52, MIN7], [50, MIN7], [48, MAJ7]],
    kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...xo', bass: 'x..x..x.x..x..x.', bassOct: true,
    pad: 'warm', lead: '..x...x.x.....x.', leadWave: 'triangle', scale: [0, 2, 4, 7, 9], arp: null },
  { id: 'lofi', name: 'LO-FI COURT', sub: 'chill beats', bpm: 80, swing: 0.28, seed: 23,
    prog: [[50, MIN9], [55, DOM7], [48, MAJ9], [45, MIN7]],
    kick: 'x.....x..x......', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.oo', bass: 'x.......x..x....', bassOct: false,
    pad: 'keys', lead: '......x.....x.x.', leadWave: 'sine', scale: [0, 3, 5, 7, 10], arp: null, dusty: true },
  { id: 'synth', name: 'SUNSET DRIVE', sub: 'synthwave', bpm: 100, swing: 0, seed: 37,
    prog: [[45, MIN], [41, MAJ], [48, MAJ], [43, MAJ]],
    kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'xxxxxxxxxxxxxxxx', bassOct: true,
    pad: 'wide', lead: 'x.....x...x.x...', leadWave: 'sawtooth', scale: [0, 2, 3, 7, 8], arp: 'x.x.x.x.x.x.x.x.' },
  { id: 'latino', name: 'RADIO LATINO', sub: 'reggaeton', bpm: 94, swing: 0, seed: 51,
    prog: [[45, MIN], [41, MAJ], [48, MAJ], [43, MAJ]],
    kick: 'x...x...x...x...', snare: '...x..x....x..x.', hat: 'x.x.x.x.x.x.x.x.', bass: 'x..x..x.x..x..x.', bassOct: false,
    pad: 'warm', lead: 'x.x...x.x.x...x.', leadWave: 'triangle', scale: [0, 2, 3, 5, 7, 8, 10], arp: null, pluck: true },
  { id: 'arcade', name: 'ARCADE 8-BIT', sub: 'chiptune', bpm: 140, swing: 0, seed: 67,
    prog: [[48, MAJ], [45, MIN], [41, MAJ], [43, MAJ]],
    kick: 'x.......x.......', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x.x.x.x.x.x.x.x.', bassOct: true, chip: true,
    pad: null, lead: 'x.x.x...x.x.x.x.', leadWave: 'square', scale: [0, 2, 4, 7, 9], arp: 'xxxxxxxxxxxxxxxx' },
];
export const OFF = { id: 'off', name: 'RADIO OFF' };

/* ---------------- sound bus ---------------- */
let bus = null;
function out() {
  if (!S.AC) return null;
  if (!bus) {
    const ac = S.AC, g = ac.createGain(), lp = ac.createBiquadFilter(), comp = ac.createDynamicsCompressor();
    lp.type = 'lowpass'; lp.frequency.value = 5200; comp.threshold.value = -18; comp.ratio.value = 3;
    g.connect(lp).connect(comp).connect(ac.destination);
    // echo send for melodies
    const d = ac.createDelay(1), fb = ac.createGain(), dl = ac.createBiquadFilter(), ds = ac.createGain();
    dl.type = 'lowpass'; dl.frequency.value = 2200; fb.gain.value = 0.32; ds.gain.value = 0.28;
    ds.connect(d); d.connect(dl).connect(fb).connect(d); dl.connect(g);
    bus = { g, send: ds, delay: d };
    S.musicGain = g;
  }
  bus.g.gain.value = S.muted ? 0 : vol('music') * 0.55;
  return bus.g;
}
const noiseSrc = (t, dur) => { if (!S.noiseBuf) return null; const s = S.AC.createBufferSource(); s.buffer = S.noiseBuf; s.start(t); s.stop(t + dur); return s };
function env(node, t, a, v, d) { const g = S.AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); node.connect(g); return g }
function osc(type, f, t, dur) { const o = S.AC.createOscillator(); o.type = type; o.frequency.value = f; o.start(t); o.stop(t + dur + 0.05); return o }
function filt(type, f, q = 0.7) { const b = S.AC.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b }

/* ---------------- instruments ---------------- */
const I = {
  kick(t, v, chip) { const o = osc(chip ? 'square' : 'sine', 130, t, 0.2); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); env(o, t, 0.002, (chip ? 0.25 : 0.75) * v, 0.18).connect(out()) },
  snare(t, v, st) {
    const n = noiseSrc(t, 0.2); if (n) env(n.connect(filt('bandpass', st.chip ? 3000 : 1900, 0.8)), t, 0.001, 0.32 * v, st.dusty ? 0.12 : 0.15).connect(out());
    if (!st.chip) env(osc('triangle', 190, t, 0.1), t, 0.001, 0.18 * v, 0.07).connect(out());
  },
  hat(t, v, st) { const n = noiseSrc(t, 0.05); if (n) env(n.connect(filt('highpass', st.dusty ? 6000 : 8000)), t, 0.001, 0.09 * v, 0.03).connect(out()) },
  bass(t, f, dur, st) {
    const o = osc(st.chip ? 'triangle' : 'sawtooth', f, t, dur), lp = filt('lowpass', st.chip ? 3000 : 420, 2);
    if (!st.chip) { lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(260, t + dur) }
    env(o.connect(lp), t, 0.005, st.chip ? 0.22 : 0.34, dur * 0.9).connect(out());
    if (!st.chip) env(osc('sine', f, t, dur), t, 0.005, 0.25, dur * 0.9).connect(out());
  },
  pad(t, notes, dur, kind) {
    for (const n of notes) {
      const f = N(n), lp = filt('lowpass', kind === 'keys' ? 1400 : kind === 'wide' ? 1800 : 1100, 0.5);
      const parts = kind === 'keys' ? [['triangle', 0], ['sine', 1200]] : [['sawtooth', -7], ['sawtooth', 7], ['triangle', 0]];
      for (const [w, cents] of parts) { const o = osc(w, f, t, dur); o.detune.value = cents; o.connect(lp) }
      const g = S.AC.createGain(), a = kind === 'keys' ? 0.01 : 0.35, v = kind === 'keys' ? 0.07 : 0.035;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + dur - 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      if (kind === 'keys') { const tr = S.AC.createOscillator(), tg = S.AC.createGain(); tr.frequency.value = 4.5; tg.gain.value = 0.02; tr.connect(tg).connect(g.gain); tr.start(t); tr.stop(t + dur) }
      lp.connect(g).connect(out());
    }
  },
  lead(t, f, dur, st) {
    const o = osc(st.leadWave, f, t, dur), lp = filt('lowpass', st.leadWave === 'sawtooth' ? 2200 : 3200, 1);
    const vib = S.AC.createOscillator(), vg = S.AC.createGain(); vib.frequency.value = 5.5; vg.gain.value = f * 0.006; vib.connect(vg).connect(o.frequency); vib.start(t + 0.08); vib.stop(t + dur + 0.05);
    const v = st.leadWave === 'square' ? 0.05 : st.leadWave === 'sawtooth' ? 0.06 : 0.13;
    const e = env(o.connect(lp), t, 0.01, v, st.pluck ? dur * 0.6 : dur);
    e.connect(out()); e.connect(bus.send);
  },
  arp(t, f, st) { const e = env(osc(st.chip ? 'square' : 'triangle', f, t, 0.15).connect(filt('lowpass', 2600)), t, 0.002, st.chip ? 0.035 : 0.05, 0.12); e.connect(out()); e.connect(bus.send) },
};

/* ---------------- melody: a seeded 2-bar motif, varied on repeat ---------------- */
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function makeMotif(st) {
  const r = rng(st.seed), pts = []; let deg = 2;
  for (let bar = 0; bar < 2; bar++) for (let i = 0; i < 16; i++) if (st.lead[i] === 'x') { deg = Math.max(0, Math.min(st.scale.length * 2 - 1, deg + Math.round((r() - 0.5) * 4))); pts.push({ bar, i, deg, len: r() < 0.3 ? 3 : 2 }) }
  return pts;
}
const degNote = (st, root, d) => root + 12 * Math.floor(d / st.scale.length) + st.scale[d % st.scale.length];

/* ---------------- scheduler ---------------- */
let cur = null, motif = [], step = 0, nextT = 0, timer = null, enabled = false;
function scheduleStep(st, t) {
  const bar = Math.floor(step / 16), i = step % 16, ch = st.prog[bar % st.prog.length], root = ch[0], sp = 60 / st.bpm / 4;
  const vel = c => c === 'x' ? 1 : c === 'o' ? 0.55 : 0;
  if (vel(st.kick[i])) I.kick(t, vel(st.kick[i]), st.chip);
  if (vel(st.snare[i])) I.snare(t, vel(st.snare[i]), st);
  if (vel(st.hat[i])) I.hat(t, vel(st.hat[i]), st);
  if (st.bass[i] === 'x') I.bass(t, N(root - 12 + (st.bassOct && i % 2 ? 12 : 0)), sp * (st.bass === 'xxxxxxxxxxxxxxxx' ? 0.9 : 1.8), st);
  if (i === 0 && st.pad) I.pad(t, ch[1].map(x => root + 12 + x), sp * 16, st.pad);
  if (st.arp && st.arp[i] === 'x') { const tones = ch[1]; I.arp(t, N(root + 24 + tones[i % tones.length] + (i % 8 >= 4 ? 12 : 0)), st) }
  // melody plays from bar 3 on, in 8-bar sections: 4 bars on, 4 bars of the motif an octave lower or resting
  const sec = bar % 8;
  if (bar >= 2 && sec < 6) for (const m of motif) if (m.bar === sec % 2 && m.i === i) {
    const vary = sec >= 4 && m.i % 4 === 2 ? 1 : 0;
    I.lead(t, N(degNote(st, 60 + (root % 12 > 6 ? root % 12 - 12 : root % 12), m.deg + vary)), sp * m.len, st);
  }
}
function tick() {
  if (!cur || !S.AC) return;
  const sp = 60 / cur.bpm / 4;
  while (nextT < S.AC.currentTime + 0.3) {
    const sw = step % 2 ? cur.swing * sp : 0;
    scheduleStep(cur, nextT + sw);
    nextT += sp; step++;
  }
}
function tune(st) {
  if (st === cur) return;
  cur = st; step = 0; motif = st ? makeMotif(st) : [];
  if (!st) { clearInterval(timer); timer = null; return }
  out(); nextT = S.AC.currentTime + 0.1;
  if (!timer) timer = setInterval(tick, 50);
}

/* ---------------- radio controls ---------------- */
export const station = () => STATIONS.find(s => s.id === OPTS.radio) || (OPTS.radio === 'off' ? OFF : STATIONS[0]);
/** Called every frame: 'none' pauses the radio (game paused, match over); anything else plays the station. */
export function playMusic(name) {
  if (!S.AC) return;
  enabled = name !== 'none';
  const st = station();
  tune(enabled && st !== OFF ? st : null);
}
export function setStation(id) { OPTS.radio = id; saveOpts(); if (enabled) tune(station() === OFF ? null : station()); showToast() }
/** Next / previous station (M key, Back on a pad). Off is part of the dial. */
export function nextStation(d = 1) {
  const dial = [...STATIONS.map(s => s.id), 'off'], i = dial.indexOf(station().id);
  setStation(dial[(i + d + dial.length) % dial.length]);
}
export function refreshMusicVolume() { out() }

let toastT = 0;
function showToast() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('radioToast');
  if (!el) { el = document.createElement('div'); el.id = 'radioToast'; el.className = 'px'; document.getElementById('stage')?.append(el) }
  const st = station();
  el.innerHTML = st === OFF ? '<b>▮▮ RADIO OFF</b>' : `<b>♪ ${st.name}</b><span>${st.sub} · M to switch</span>`;
  el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
}
