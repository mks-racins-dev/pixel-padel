// A small chiptune loop (two moods: menu and match), scheduled ahead on the Web Audio clock.
import { S } from '../state.js';
import { OPTS, vol } from '../game/opts.js';

const N = n => 440 * Math.pow(2, (n - 69) / 12);
// 4 bars of 8 steps: chord roots and an arpeggio pattern (semitones above the root)
const SONGS = {
  menu: { bpm: 104, roots: [45, 41, 48, 43], arp: [0, 7, 12, 7, 3, 7, 12, 15], lead: [null, 76, null, 74, null, 72, 71, null] },
  match: { bpm: 128, roots: [40, 40, 43, 38], arp: [0, 12, 7, 12, 0, 12, 10, 12], lead: [null, null, null, null, null, null, null, null] },
};
let song = null, step = 0, nextT = 0, timer = null;
function gain() {
  if (!S.AC) return null;
  if (!S.musicGain) { S.musicGain = S.AC.createGain(); S.musicGain.connect(S.AC.destination) }
  S.musicGain.gain.value = S.muted ? 0 : vol('music') * 0.5;
  return S.musicGain;
}
function note(type, f, t, dur, v) { const o = S.AC.createOscillator(), g = S.AC.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(gain()); o.start(t); o.stop(t + dur + 0.02) }
function tick() {
  if (!song || !S.AC) return;
  const sp = 60 / song.bpm / 2;
  while (nextT < S.AC.currentTime + 0.25) {
    const bar = Math.floor(step / 8) % 4, i = step % 8, root = song.roots[bar];
    if (i % 4 === 0) note('triangle', N(root - 12), nextT, sp * 3.6, 0.32);
    note('square', N(root + 12 + song.arp[i]), nextT, sp * 0.8, 0.05);
    const ld = song.lead[i]; if (ld && bar % 2 === 0) note('triangle', N(ld + (bar === 2 ? -2 : 0)), nextT, sp * 1.8, 0.09);
    if (song === SONGS.match && i % 2 === 1) { const o = S.AC.createBufferSource(); if (S.noiseBuf) { o.buffer = S.noiseBuf; const g = S.AC.createGain(); g.gain.setValueAtTime(0.05, nextT); g.gain.exponentialRampToValueAtTime(0.0001, nextT + 0.04); o.connect(g).connect(gain()); o.start(nextT); o.stop(nextT + 0.05) } }
    nextT += sp; step++;
  }
}
/** Starts (or switches to) a loop; 'none' stops it. Safe to call every frame. */
export function playMusic(name) {
  const want = name === 'none' || !S.AC ? null : SONGS[name];
  gain();
  if (want === song) return;
  song = want; step = 0;
  if (!song) { clearInterval(timer); timer = null; return }
  nextT = S.AC.currentTime + 0.05;
  if (!timer) timer = setInterval(tick, 60);
}
export function refreshMusicVolume() { gain() }
