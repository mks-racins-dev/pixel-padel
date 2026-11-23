// Ambient life around outdoor courts (client only, never part of the simulation):
// a cyclist who stops to take a photo, a man who comes out for a smoke, a dog walker,
// and someone doing pull-ups on a bar near the court. Not shown in halls and arenas.
import { S } from '../state.js';
import { P, R, L } from '../core/gfx.js';
import { grade } from './grades.js';
import { settings } from '../game/settings.js';

type Kind = 'cyclist' | 'smoker' | 'dog';
interface Npc { kind: Kind; x: number; y: number; dir: number; stage: number; t: number; c: string[]; wait: number; tx: number; ty: number }
const SKIN = ['#e8b48a', '#c98d62', '#8d5a3b', '#f0c4a0'], SHIRT = ['#3b5b8c', '#c9826b', '#6fae5f', '#8e6cc1', '#f2c14e', '#2d2a3a', '#d98ca0'], HAIR = ['#2b1d14', '#4a2c1a', '#d9b26a', '#9a9aa8'];
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
const npcs: Npc[] = [];
const puffs: { x: number; y: number; t: number }[] = [];
let spawnT = 4, flashT = 0, flashAt = { x: 0, y: 0 }, pull = { t: 0, rest: 0 };

/** Where a pull-up bar fits: only street courts where people would work out (not a car park or a farm). */
const BAR: Record<string, [number, number]> = { beach: [-12.2, 1.5], school: [-12.2, 1.5], yard: [12.4, -1.0], bridge: [8.9, -1.5], camp: [10.4, -0.8] };
const outdoor = () => { const g = grade() as any; return !g.floor && !g.indoor && !g.stand };

function spawn() {
  const kind = (['cyclist', 'smoker', 'dog'] as Kind[])[Math.floor(Math.random() * 3)];
  if (npcs.some(n => n.kind === kind)) return;
  const c = [pick(SKIN), pick(SHIRT), pick(['#2d2a3a', '#3b5b8c', '#5a3b2c', '#4a4452']), pick(HAIR)];
  if (kind === 'cyclist') npcs.push({ kind, x: -17, y: 12.2, dir: 1, stage: 0, t: 0, c, wait: 0, tx: -8.2, ty: 12.2 });
  if (kind === 'smoker') { const s = Math.random() < 0.5 ? -1 : 1; npcs.push({ kind, x: s * 17, y: 2 + Math.random() * 4, dir: -s, stage: 0, t: 0, c, wait: 6 + Math.random() * 4, tx: s * (9.6 + Math.random()), ty: 3 + Math.random() * 3 }) }
  if (kind === 'dog') { const s = Math.random() < 0.5 ? -1 : 1; npcs.push({ kind, x: s * -18, y: -12.2, dir: s, stage: 0, t: 0, c, wait: 0, tx: s * 18, ty: -12.2 }) }
}

/** Moves toward (tx, ty); true when there. */
function walk(n: Npc, dt: number, speed: number) {
  const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
  if (d < 0.05) return true;
  const v = Math.min(d, speed * dt); n.x += dx / d * v; n.y += dy / d * v; if (Math.abs(dx) > 0.01) n.dir = Math.sign(dx);
  return false;
}

export function updateNpcs(dt: number) {
  if (!outdoor()) { npcs.length = 0; return }
  spawnT -= dt; if (spawnT <= 0) { spawnT = 9 + Math.random() * 14; if (npcs.length < 2) spawn() }
  if (flashT > 0) flashT -= dt;
  pull.t += dt; if (pull.rest > 0) pull.rest -= dt; else if (pull.t > 7 + Math.random() * 30) { pull.rest = 3 + Math.random() * 3; pull.t = 0 }
  for (let i = npcs.length - 1; i >= 0; i--) {
    const n = npcs[i]; n.t += dt;
    if (n.kind === 'cyclist') {
      if (n.stage === 0 && walk(n, dt, 4.5)) { n.stage = 1; n.t = 0 }
      else if (n.stage === 1) { if (n.t > 1.2 && flashT <= 0 && n.t < 1.4) { flashT = 0.12; flashAt = { x: n.x + 0.4, y: n.y } } if (n.t > 2.8) { n.stage = 2; n.tx = 18 } }
      else if (n.stage === 2 && walk(n, dt, 5)) npcs.splice(i, 1);
    } else if (n.kind === 'smoker') {
      if (n.stage === 0 && walk(n, dt, 1.4)) { n.stage = 1; n.t = 0 }
      else if (n.stage === 1) { if (Math.random() < dt * 0.9) puffs.push({ x: n.x + n.dir * 0.3, y: n.y, t: 0 }); if (n.t > n.wait) { n.stage = 2; n.tx = Math.sign(n.x) * 18 } }
      else if (n.stage === 2 && walk(n, dt, 1.4)) npcs.splice(i, 1);
    } else if (walk(n, dt, 1.6)) npcs.splice(i, 1);
  }
  for (let i = puffs.length - 1; i >= 0; i--) { puffs[i].t += dt; if (puffs[i].t > 2.2) puffs.splice(i, 1) }
}

/* ---------------- drawing ---------------- */
function person(ctx: CanvasRenderingContext2D, x: number, y: number, c: string[], walking: boolean, dir: number) {
  const leg = walking ? Math.floor(S.time * 6) % 2 : 0;
  R(ctx, x - 1, y - 5 + leg, 2, 5 - leg, c[2]); R(ctx, x + 1, y - 5 + (1 - leg), 2, 5 - (1 - leg), c[2]);
  R(ctx, x - 2, y - 12, 6, 7, c[1]); R(ctx, x - 2, y - 12, 1, 7, 'rgba(0,0,0,.2)');
  R(ctx, x - 1, y - 17, 5, 5, c[0]); R(ctx, x - 1, y - 18, 5, 2, c[3]);
  R(ctx, x + (dir > 0 ? 3 : -1), y - 15, 1, 1, '#2a1e1e');
}
function bike(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#2b2633'; ctx.lineWidth = 1;
  for (const wx of [x - 5, x + 5]) { ctx.beginPath(); ctx.arc(wx, y - 3, 3, 0, Math.PI * 2); ctx.stroke() }
  L(ctx, x - 5, y - 3, x, y - 7, '#e4572e'); L(ctx, x, y - 7, x + 5, y - 3, '#e4572e'); L(ctx, x - 2, y - 8, x + 3, y - 8, '#2b2633');
}
export function drawNpcs(ctx: CanvasRenderingContext2D) {
  if (!outdoor()) return;
  // pull-up bar on the left of the court, between the benches and the near corner
  const bar = BAR[settings.loc];
  if (bar) { const b = P(bar[0], bar[1], 0), x = Math.round(b.x), y = Math.round(b.y);
    R(ctx, x - 8, y - 26, 1, 26, '#3a3540'); R(ctx, x + 8, y - 26, 1, 26, '#3a3540'); R(ctx, x - 8, y - 26, 17, 1, '#9a948c');
    const up = pull.rest > 0 ? 0 : (Math.sin(pull.t * 3.2) + 1) / 2, hy = y - 25;
    const c = ['#c98d62', '#e4572e', '#2d2a3a', '#2b1d14'];
    if (pull.rest > 0) { person(ctx, x + 12, y, c, false, -1) }
    else { const by = y - 6 - Math.round(up * 7); // hanging: arms up to the bar, body rises
      R(ctx, x - 2, hy, 1, by - 12 - hy, c[0]); R(ctx, x + 3, hy, 1, by - 12 - hy, c[0]);
      R(ctx, x - 1, by - 5, 2, 6, c[2]); R(ctx, x + 1, by - 5, 2, 6, c[2]); R(ctx, x - 2, by - 12, 6, 7, c[1]); R(ctx, x - 1, by - 17, 5, 5, c[0]); R(ctx, x - 1, by - 18, 5, 2, c[3]) }
  }
  for (const n of npcs) {
    const p = P(n.x, n.y, 0), x = Math.round(p.x), y = Math.round(p.y);
    if (n.kind === 'cyclist') {
      bike(ctx, x, y); const rideY = y - 6;
      R(ctx, x - 2, rideY - 7, 6, 7, n.c[1]); R(ctx, x - 1, rideY - 12, 5, 5, n.c[0]); R(ctx, x - 1, rideY - 13, 5, 2, n.c[3]);
      if (n.stage === 1) { R(ctx, x + 4, rideY - 11, 3, 2, '#1c1a22') } // phone up
    } else if (n.kind === 'smoker') {
      person(ctx, x, y, n.c, n.stage !== 1, n.dir);
      if (n.stage === 1) { const hx = x + (n.dir > 0 ? 4 : -2); R(ctx, hx, y - 13, 2, 1, '#f4ead2'); R(ctx, hx + (n.dir > 0 ? 2 : -1), y - 13, 1, 1, Math.floor(S.time * 3) % 2 ? '#ff8a5c' : '#e4572e') }
    } else {
      person(ctx, x, y, n.c, true, n.dir);
      const dx = x - n.dir * 9, dy = y; L(ctx, x + n.dir * 0, y - 9, dx, dy - 4, '#6d6680');
      const b = Math.floor(S.time * 8) % 2;
      R(ctx, dx - 3, dy - 5 - b, 6, 3, '#c9a066'); R(ctx, dx + n.dir * 2, dy - 7 - b, 3, 3, '#c9a066'); R(ctx, dx - 3, dy - 2, 1, 2, '#8a6a3c'); R(ctx, dx + 2, dy - 2, 1, 2, '#8a6a3c');
    }
  }
  for (const f of puffs) { const p = P(f.x + f.t * 0.3, f.y, 1.7 + f.t * 0.9); ctx.fillStyle = `rgba(230,230,235,${0.5 * (1 - f.t / 2.2)})`; const r = 1 + f.t * 1.5; ctx.fillRect(Math.round(p.x - r), Math.round(p.y - r), Math.round(r * 2), Math.round(r * 2)) }
  if (flashT > 0) { const p = P(flashAt.x, flashAt.y, 1.6); ctx.fillStyle = `rgba(255,255,255,${flashT / 0.12})`; ctx.fillRect(Math.round(p.x) - 4, Math.round(p.y) - 4, 9, 9) }
}
