// Game feel: hit-stop, camera punch, slow motion and particles.
// All of this is cosmetic. It changes how real time maps onto simulation steps
// (pausing or slowing them) but never what a step does, so matches stay deterministic.
import { P, R, WL } from '../core/gfx.js';

interface Part { x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number; life: number; c: string; grav: number }

export const FX = {
  hitStop: 0,          // seconds of frozen simulation left
  freeze: false,       // simulation paused while an instant replay plays
  slowT: 0,            // seconds of slow motion left (real time)
  slowK: 1,            // simulation speed while slowT > 0
  punch: { x: 0, y: 0, t: 0 },
  parts: [] as Part[],
  glass: [] as { x: number; y: number; z: number; t: number; side: boolean; mesh: boolean }[], // impact ripples on the walls
  rings: [] as { x: number; y: number; z: number; t: number; big: boolean }[],                 // racket contact rings
  zoom: { t: 0, len: 0, k: 0, ox: 240, oy: 135 },                                             // quick camera push-in
};
/** Push the camera in by `k` (0.05 = 5%) for `secs`, centred on world point p. */
export function zoomIn(k: number, secs: number, p?: { x: number; y: number; z: number }) {
  const q = p ? P(p.x, p.y, p.z) : { x: 240, y: 135 };
  FX.zoom = { t: secs, len: secs, k, ox: q.x, oy: q.y };
}

/** Freeze the simulation for a few frames so a big hit lands. Longer requests win. */
export function hitStop(secs: number) { FX.hitStop = Math.max(FX.hitStop, secs) }
/** Slow the simulation to `k` speed for `secs` of real time. */
export function slowMo(secs: number, k: number) { FX.slowT = secs; FX.slowK = k }
/** Nudge the camera in screen pixels; it springs back on its own. */
export function punch(dx: number, dy: number) { FX.punch = { x: dx, y: dy, t: 0.12 } }

/** How much simulation time to advance for `dt` of real time. */
export function simTime(dt: number): number {
  if (FX.freeze) return 0;
  if (FX.hitStop > 0) { FX.hitStop -= dt; return 0 }
  if (FX.slowT > 0) { FX.slowT -= dt; return dt * FX.slowK }
  return dt;
}

export function burst(x: number, y: number, z: number, n: number, colors: string[], speed = 2.5, up = 1.5, grav = 9.8, life = 0.45) {
  if (FX.parts.length > 260) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.6);
    FX.parts.push({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: up * (0.3 + Math.random()), t: 0, life: life * (0.6 + Math.random() * 0.6), c: colors[i % colors.length], grav });
  }
}

/** Particles for a sound event at the ball's position (also runs on online guests, who replay host sounds). */
export function fxForSound(k: string, v: number, b: { x: number; y: number; z: number } | undefined) {
  if (!b) return;
  if (k === 'smash') { hitStop(0.07); punch(0, 3); zoomIn(0.06, 0.32, b) }
  else if (k === 'vibora') { hitStop(0.1); punch(Math.random() < 0.5 ? -3 : 3, 2); zoomIn(0.05, 0.3, b) }
  if (k === 'hit' || k === 'smash' || k === 'vibora') FX.rings.push({ x: b.x, y: b.y, z: b.z, t: 0, big: k !== 'hit' || v > 0.9 });
  if ((k === 'glass' || k === 'mesh') && FX.glass.length < 8) FX.glass.push({ x: b.x, y: b.y, z: Math.max(0.3, b.z), t: 0, side: Math.abs(b.x) > 4.6, mesh: k === 'mesh' });
  else if (k === 'hit' && v > 0.97) hitStop(0.03);
  if (k === 'hit') burst(b.x, b.y, b.z, 4 + Math.round(v * 4), ['#fbffb8', '#e2ef3c', '#ffffff'], 2 + v * 2, 1.2);
  else if (k === 'smash') { burst(b.x, b.y, b.z, 14, ['#fff1c1', '#ff8a5c', '#ffffff'], 5, 2.5); }
  else if (k === 'vibora') burst(b.x, b.y, b.z, 18, ['#ff8a5c', '#e4572e', '#fff1c1'], 5.5, 2);
  else if (k === 'glass') burst(b.x, b.y, b.z, 3, ['#bfefff', '#6fd3d2'], 1.2, 0.8, 4, 0.35);
  else if (k === 'mesh') burst(b.x, b.y, b.z, 3, ['#9a95a6', '#c7c1d0'], 1, 0.6);
  else if (k === 'bounce' && v > 0.45) burst(b.x, b.y, 0.02, 3, ['#d9cbb8', '#ffffff'], 1.2, 0.8, 9.8, 0.3);
}

export function updateFx(dt: number) {
  if (FX.punch.t > 0) FX.punch.t -= dt;
  if (FX.zoom.t > 0) FX.zoom.t = Math.max(0, FX.zoom.t - dt);
  for (const a of [FX.glass, FX.rings] as { t: number }[][]) for (let i = a.length - 1; i >= 0; i--) { a[i].t += dt; if (a[i].t > 0.45) a.splice(i, 1) }
  const ps = FX.parts;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.t += dt; p.vz -= p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.6; p.vy *= 0.6 }
    if (p.t >= p.life) ps.splice(i, 1);
  }
}

/** Camera offset in screen pixels for this frame (punch only; shake stays in render). */
export function cameraOffset(): { x: number; y: number } {
  if (FX.punch.t <= 0) return { x: 0, y: 0 };
  const k = FX.punch.t / 0.12;
  return { x: Math.round(FX.punch.x * k), y: Math.round(FX.punch.y * k) };
}

/** Ripples where the ball hit the glass (a flash and spreading rings on the wall plane) and racket contact rings. */
function drawImpacts(ctx: CanvasRenderingContext2D) {
  for (const g of FX.glass) {
    const k = g.t / 0.45, a = 1 - k;
    for (const r of [0.15 + k * 0.9]) {
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 16; i++) { const ang = i / 16 * Math.PI * 2, u = Math.cos(ang) * r, w = Math.sin(ang) * r * 0.8;
        pts.push(g.side ? [Math.sign(g.x) * 5, g.y + u, g.z + w] : [g.x + u, Math.sign(g.y) * 10, g.z + w]) }
      const c = g.mesh ? `rgba(200,195,210,${a * 0.3})` : `rgba(220,250,255,${a * 0.4})`;
      for (let i = 0; i < 16; i++) WL(ctx, pts[i], pts[i + 1], c);
    }
  }
  for (const r of FX.rings) {
    if (r.t > 0.16) continue;
    const q = P(r.x, r.y, r.z), rad = (r.big ? 4 : 2) + r.t * (r.big ? 70 : 40);
    ctx.strokeStyle = `rgba(255,250,210,${1 - r.t / 0.16})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(Math.round(q.x), Math.round(q.y) - 2, rad, 0, Math.PI * 2); ctx.stroke();
  }
}
/** CSS transform for the quick push-in (the canvas is pixel art, so scaling it stays crisp). */
export function zoomTransform(): string {
  const z = FX.zoom; if (z.t <= 0) return '';
  const u = 1 - z.t / z.len, e = u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75, s = 1 + z.k * e;
  return `scale(${s.toFixed(3)})`;
}
export const zoomOrigin = () => `${(FX.zoom.ox / 480 * 100).toFixed(1)}% ${(FX.zoom.oy / 270 * 100).toFixed(1)}%`;

export function drawFx(ctx: CanvasRenderingContext2D) {
  drawImpacts(ctx);
  for (const p of FX.parts) {
    const q = P(p.x, p.y, p.z);
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    R(ctx, q.x, q.y - 2, 1, 1, p.c);
  }
  ctx.globalAlpha = 1;
}
