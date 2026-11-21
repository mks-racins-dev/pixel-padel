// Game feel: hit-stop, camera punch, slow motion and particles.
// All of this is cosmetic. It changes how real time maps onto simulation steps
// (pausing or slowing them) but never what a step does, so matches stay deterministic.
import { P, R } from '../core/gfx.js';

interface Part { x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number; life: number; c: string; grav: number }

export const FX = {
  hitStop: 0,          // seconds of frozen simulation left
  slowT: 0,            // seconds of slow motion left (real time)
  slowK: 1,            // simulation speed while slowT > 0
  punch: { x: 0, y: 0, t: 0 },
  parts: [] as Part[],
};

/** Freeze the simulation for a few frames so a big hit lands. Longer requests win. */
export function hitStop(secs: number) { FX.hitStop = Math.max(FX.hitStop, secs) }
/** Slow the simulation to `k` speed for `secs` of real time. */
export function slowMo(secs: number, k: number) { FX.slowT = secs; FX.slowK = k }
/** Nudge the camera in screen pixels; it springs back on its own. */
export function punch(dx: number, dy: number) { FX.punch = { x: dx, y: dy, t: 0.12 } }

/** How much simulation time to advance for `dt` of real time. */
export function simTime(dt: number): number {
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
  if (k === 'smash') { hitStop(0.07); punch(0, 3) }
  else if (k === 'vibora') { hitStop(0.1); punch(Math.random() < 0.5 ? -3 : 3, 2) }
  else if (k === 'hit' && v > 0.97) hitStop(0.03);
  if (k === 'hit') burst(b.x, b.y, b.z, 4 + Math.round(v * 4), ['#fbffb8', '#e2ef3c', '#ffffff'], 2 + v * 2, 1.2);
  else if (k === 'smash') { burst(b.x, b.y, b.z, 14, ['#fff1c1', '#ff8a5c', '#ffffff'], 5, 2.5); }
  else if (k === 'vibora') burst(b.x, b.y, b.z, 18, ['#ff8a5c', '#e4572e', '#fff1c1'], 5.5, 2);
  else if (k === 'glass') burst(b.x, b.y, b.z, 6, ['#bfefff', '#ffffff', '#6fd3d2'], 1.6, 1, 4, 0.5);
  else if (k === 'mesh') burst(b.x, b.y, b.z, 3, ['#9a95a6', '#c7c1d0'], 1, 0.6);
  else if (k === 'bounce' && v > 0.45) burst(b.x, b.y, 0.02, 3, ['#d9cbb8', '#ffffff'], 1.2, 0.8, 9.8, 0.3);
}

export function updateFx(dt: number) {
  if (FX.punch.t > 0) FX.punch.t -= dt;
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

export function drawFx(ctx: CanvasRenderingContext2D) {
  for (const p of FX.parts) {
    const q = P(p.x, p.y, p.z);
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    R(ctx, q.x, q.y - 2, 1, 1, p.c);
  }
  ctx.globalAlpha = 1;
}
