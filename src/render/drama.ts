// Match drama, client only (never touches the simulation): match/set point banners with a
// heartbeat and a hushed crowd, a rally counter that builds the crowd up, a standing wave
// after long rallies, and confetti for a win.
import { S } from '../state.js';
import { R, P, txt, txtW } from '../core/gfx.js';
import { burst, FX, zoomIn } from './fx.ts';
import { settings } from '../game/settings.js';
import { tone } from '../audio/sfx.js';

const D = { banner: '', bannerT: 0, beatT: 0, lastHits: 0, lastState: '', rally: 0, rallyPeak: 0, waveT: -1 };

/** 'MATCH POINT' / 'GAME POINT' for whoever is one point from it, or ''. */
export function pointDrama(score: { pts: number[]; games: number[] }, toWin: number): string {
  const { pts, games } = score;
  for (const t of [0, 1]) {
    const o = 1 - t, gp = pts[t] === 3 && pts[o] <= 3; // 40 vs anything, or golden point at 40-40
    if (gp && games[t] === toWin - 1) return 'MATCH POINT';
  }
  return pts[0] === 3 && pts[1] === 3 ? 'GOLDEN POINT' : '';
}

function beat() { if (!S.AC || S.muted) return; try { tone('sine', 70, 45, 0.12, 0.35); tone('sine', 62, 40, 0.14, 0.28, 0.16) } catch (e) {} }

/** Called every frame from the main loop. */
export function updateDrama(dt: number, toWin: number) {
  if (S.demo || !S.score) { D.banner = ''; S.hush = false; if (RP.on) endReplay(); return }
  updateReplay(dt); if (RP.on) return;
  const ch = (S as any).chase; if (S.state === 'chase' && ch) zoomIn(0.07, 0.25, S.ball as any);
  const st = S.state as string;
  // a new point is being served: check for match / golden point
  if (st === 'serve' && D.lastState !== 'serve') {
    const b = pointDrama(S.score, toWin);
    D.banner = b; D.bannerT = b ? 2.2 : 0; D.rally = 0; D.rallyPeak = 0; D.lastHits = 0;
  }
  // the point ended: long rallies get a standing wave
  if (D.lastState === 'play' && st !== 'play') { if (D.rallyPeak >= 10) D.waveT = 0; S.hush = false }
  D.lastState = st;
  const tense = D.banner === 'MATCH POINT' && (st === 'serve' || st === 'play');
  S.hush = tense;
  if (tense) { D.beatT -= dt; if (D.beatT <= 0) { beat(); D.beatT = 0.85 - Math.min(0.35, D.rally * 0.03) } }
  if (D.bannerT > 0) D.bannerT -= dt;
  // rally counter from the shot count of this point
  const hits = ((S as any).R0 && (S as any).R0.hits) || 0;
  if (st === 'play' && hits > D.lastHits) { D.rally += hits - D.lastHits; D.rallyPeak = Math.max(D.rallyPeak, D.rally);
    if (D.rally >= 6 && D.rally % 2 === 0) for (const s of S.spectators as any[]) s.cheer = Math.max(s.cheer, 0.35) }
  D.lastHits = hits;
  if (D.waveT >= 0) { D.waveT += dt; const n = S.spectators.length; S.spectators.forEach((s: any, i: number) => { const k = D.waveT * 6 - i * 0.5; if (k > 0 && k < 1.2) s.cheer = 0.3 }); if (D.waveT > n * 0.09 + 1.5) D.waveT = -1 }
}

/** Banner and rally counter, drawn over the court. */
export function drawDrama(ctx: CanvasRenderingContext2D) {
  if (S.demo) return;
  if (RP.on) return drawReplay(ctx);
  const ch = (S as any).chase;
  if (S.state === 'chase' && ch && ch.reach && (ch.p.ctrl === 'h1' || ch.p.ctrl === 'h2') && Math.floor(performance.now() / 120) % 2) {
    const q = P(ch.p.x, ch.p.y, 2.6); R(ctx, q.x - 14, q.y - 12, 28, 13, '#e4572e'); txt(ctx, 'HIT!', q.x - 9, q.y - 9, '#ffffff', 2);
  }
  if (D.bannerT > 0 && D.banner) {
    const a = Math.min(1, D.bannerT * 2, (2.2 - D.bannerT) * 6), w = txtW(D.banner, 3) + 24, x = 240 - w / 2, y = 56;
    ctx.globalAlpha = a; R(ctx, x, y, w, 25, '#17131c'); R(ctx, x, y + 23, w, 2, D.banner === 'MATCH POINT' ? '#e4572e' : '#f2c14e');
    txt(ctx, D.banner, x + 12, y + 5, D.banner === 'MATCH POINT' ? '#ff8a5c' : '#f2c14e', 3); ctx.globalAlpha = 1;
  }
  if (S.state === 'play' && D.rally >= 5) {
    const s = 'RALLY ' + D.rally, big = D.rally >= 10, sc = big ? 2 : 1, w = txtW(s, sc);
    R(ctx, 240 - w / 2 - 3, 30, w + 6, 5 * sc + 4, 'rgba(23,19,28,0.75)'); txt(ctx, s, 240 - w / 2, 32, big ? '#ff8a5c' : '#f4ead2', sc);
  }
  if (S.hush) { ctx.fillStyle = 'rgba(10,8,16,0.12)'; ctx.fillRect(0, 0, 480, 270) }
}


/* ---------------- instant replay ---------------- */
// The last seconds of play are recorded every frame. After a highlight point (a return from
// outside, a por tres, a long rally) they play back in slow motion while the simulation is frozen,
// then the live state is put back exactly as it was. Not online (the host owns the clock).
interface Frame { b: { x: number; y: number; z: number }; P: { x: number; y: number; vx: number; vy: number; swingT: number; swingType: string; anim: number; flip: boolean }[] }
const REC: Frame[] = [];
const RP = { on: false, i: 0, saved: null as null | { b: any; P: any[]; trail: any[] }, waitT: -1, wasPlay: false, flagged: false };
const canReplay = () => !S.demo && settings.mode !== 'online' && settings.mode !== 'practice';
function record() {
  const b = S.ball as any;
  REC.push({ b: { x: b.x, y: b.y, z: b.z }, P: (S.players as any[]).map(p => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, swingT: p.swingT, swingType: p.swingType, anim: p.anim, flip: p.flip })) });
  if (REC.length > 240) REC.shift();
}
function apply(f: Frame) {
  Object.assign(S.ball as any, f.b);
  f.P.forEach((q, k) => { const p = (S.players as any[])[k]; if (p) Object.assign(p, q) });
}
function startReplay() {
  if (REC.length < 30) return;
  const b = S.ball as any;
  RP.saved = { b: { ...b }, P: (S.players as any[]).map(p => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, swingT: p.swingT, swingType: p.swingType, anim: p.anim, flip: p.flip })), trail: [...(S as any).trail] };
  RP.on = true; RP.i = Math.max(0, REC.length - 150); FX.freeze = true; (S as any).trail.length = 0;
}
export function endReplay() {
  if (!RP.on) return;
  RP.on = false; FX.freeze = false;
  if (RP.saved) { Object.assign(S.ball as any, RP.saved.b); RP.saved.P.forEach((q, k) => { const p = (S.players as any[])[k]; if (p) Object.assign(p, q) }); (S as any).trail = RP.saved.trail }
  REC.length = 0;
}
export const replaying = () => RP.on;
function updateReplay(dt: number) {
  const st = S.state as string, live = st === 'play' || st === 'chase';
  if (RP.on) { RP.i += dt * 60 * 0.4; if (RP.i >= REC.length - 1) endReplay(); else apply(REC[Math.floor(RP.i)]); return }
  if (!canReplay()) { REC.length = 0; return }
  if (live) { record(); RP.wasPlay = true; const r = (S as any).R0; if (r && (r.chased || (S.ball as any).porTres)) RP.flagged = true; return }
  if (RP.wasPlay && st === 'between') { RP.wasPlay = false; if (RP.flagged || D.rallyPeak >= 12) RP.waitT = 0.9; RP.flagged = false }
  if (st === 'serve') { RP.wasPlay = false; RP.flagged = false; REC.length = 0 }
  if (RP.waitT >= 0) { RP.waitT -= dt; if (RP.waitT < 0 && S.state === 'between') startReplay() }
}
function drawReplay(ctx: CanvasRenderingContext2D) {
  if (!RP.on) return;
  R(ctx, 0, 0, 480, 14, '#0c0a10'); R(ctx, 0, 256, 480, 14, '#0c0a10');
  if (Math.floor(performance.now() / 500) % 2) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(14, 7, 3, 0, Math.PI * 2); ctx.fill() }
  txt(ctx, 'REPLAY', 22, 4, '#f4ead2'); txt(ctx, 'CLICK TO SKIP', 400, 260, '#8a7f98');
}
if (typeof addEventListener !== 'undefined') {
  addEventListener('pointerdown', () => { if (RP.on) endReplay() });
  addEventListener('keydown', e => { if (RP.on && ['Escape', 'Enter', 'Space'].includes(e.code)) endReplay() }, true);
}

/** A shower of confetti over the court (match won). */
export function confetti() {
  for (let k = 0; k < 6; k++) burst(-4 + k * 1.6, -2 + Math.random() * 6, 6, 22, ['#e4572e', '#f2c14e', '#3fa7a8', '#ff6ad5', '#9be37a', '#ffffff'], 3, 0.5, 2.2, 2.6);
}
