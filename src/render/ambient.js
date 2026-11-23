// Small looping animations around the court so venues feel alive: birds, a spinning vent fan,
// pigeons on the roof wall, a flickering supermarket sign, a campfire with smoke, light on the lake.
// Purely visual: uses Math.random, never the seeded match RNG.
import { S } from '../state.js';
import { P, R, W, txt, txtW } from '../core/gfx.js';
import { curLoc } from '../content/venues.js';
import { grade } from './grades.js';
import { streetKind } from './street.js';

function birds(ctx, t) {
  const cyc = 19, k = t % cyc; if (k > 11) return;
  const x0 = -30 + k * 48, y0 = 22 + Math.sin(t * 0.7) * 3;
  for (const [dx, dy] of [[0, 0], [-9, 4], [-16, -2]]) {
    const x = Math.round(x0 + dx), y = Math.round(y0 + dy), up = Math.floor(t * 7 + dx) % 2;
    R(ctx, x - 2, y - up, 2, 1, '#3a3048'); R(ctx, x, y + (up ? 0 : 1), 1, 1, '#3a3048'); R(ctx, x + 1, y - up, 2, 1, '#3a3048');
  }
}
function pigeons(ctx, t) {
  for (const [x, ph] of [[352, 0], [361, 1.7], [104, 3.1]]) {
    const peck = Math.floor(t * 2 + ph) % 4 === 0 ? 1 : 0, y = 57;
    R(ctx, x, y - 3, 5, 3, '#7d7f8c'); R(ctx, x + 1, y - 3, 3, 1, '#9a9caa'); R(ctx, x + 4, y - 5 + peck, 2, 2, '#6a6c7a'); R(ctx, x + 6, y - 4 + peck, 1, 1, '#e8a040'); R(ctx, x + 1, y, 1, 1, '#e86a6a'); R(ctx, x + 3, y, 1, 1, '#e86a6a');
  }
}
function fan(ctx, t) {
  const cx = 445, cy = 53, a = t * 9;
  for (let b = 0; b < 4; b++) { const q = a + b * Math.PI / 2; for (let r = 1; r < 8; r++) R(ctx, cx + Math.cos(q) * r, cy + Math.sin(q) * r, 1, 1, '#9a96a2') }
  R(ctx, cx - 1, cy - 1, 2, 2, '#c7c1d0');
}
function marketSign(ctx, t) {
  const s = 'MAXI MARKET', sx = 240 - txtW(s, 2) / 2;
  if (Math.sin(t * 23) + Math.sin(t * 7.3) > 1.15) txt(ctx, 'K', sx + 8 * 8, 2, '#4a2a2a', 2);
  const on = Math.sin(t * 31) + Math.sin(t * 4.1) < 1.5;
  if (on) { ctx.fillStyle = 'rgba(255,240,190,0.05)'; ctx.beginPath(); ctx.moveTo(167, 31); ctx.lineTo(173, 31); ctx.lineTo(200, 70); ctx.lineTo(140, 70); ctx.fill() }
  else R(ctx, 167, 30, 6, 1, '#6a6458');
  for (let m = 0; m < 3; m++) { const a = t * (3 + m) + m * 2; R(ctx, 170 + Math.cos(a) * (4 + m * 2), 33 + Math.sin(a * 1.3) * 3, 1, 1, '#f4ead2') }
}
function campfire(ctx, t) {
  const p = P(-9.6, -4, 0.05), x = Math.round(p.x), y = Math.round(p.y);
  ctx.fillStyle = 'rgba(255,170,80,0.10)'; ctx.fillRect(x - 12, y - 10, 24, 12);
  for (let i = -3; i <= 3; i++) { const h = 3 + Math.round((Math.sin(t * 13 + i * 1.7) + 1) * 2.2) - Math.abs(i); if (h <= 0) continue; R(ctx, x + i, y - h, 1, h, '#e4572e'); if (h > 2) R(ctx, x + i, y - h + 1, 1, h - 2, '#ff9a3a'); if (h > 4) R(ctx, x + i, y - h + 2, 1, 2, '#ffe07a') }
  for (let k = 0; k < 6; k++) { const life = (t * 0.45 + k / 6) % 1, sx = x + Math.sin(t * 1.3 + k * 2) * (2 + life * 6), sy = y - 8 - life * 34; ctx.fillStyle = 'rgba(200,196,190,' + (0.45 * (1 - life)).toFixed(2) + ')'; const s = 2 + Math.floor(life * 3); ctx.fillRect(Math.round(sx), Math.round(sy), s, s) }
  if (Math.random() < 0.3) R(ctx, x + Math.round((Math.random() - 0.5) * 6), y - 6 - Math.random() * 10, 1, 1, '#ffd25a');
}
function lake(ctx, t) {
  for (let k = 0; k < 6; k++) { const ph = Math.floor(t * 3 + k * 5.3), x = (ph * 97 + k * 131) % W, y = 47 + (ph * 13 + k * 3) % 8; if ((ph + k) % 3) R(ctx, x, y, 2, 1, '#ffffff') }
}
function butterflies(ctx, t) {
  for (const [bx, by, c, ph] of [[-9.5, 9, '#f2c14e', 0], [9, -8, '#f4f4f0', 2]]) {
    const p = P(bx + Math.sin(t * 0.6 + ph) * 1.5, by + Math.cos(t * 0.4 + ph) * 1.2, 1 + Math.sin(t * 2 + ph) * 0.3), f = Math.floor(t * 10 + ph) % 2;
    R(ctx, p.x - 1 - f, p.y, 1 + f, 1, c); R(ctx, p.x + 1, p.y, 1 + f, 1, c); R(ctx, p.x, p.y, 1, 1, '#2b2633');
  }
}
/** Drawn every frame right after the venue background. */
export function drawAmbient(ctx) {
  const t = S.time, G = grade(), sk = streetKind();
  if (!G.indoor && !G.arena && !G.stand && !curLoc().night && sk !== 'market') birds(ctx, t);
  if (sk === 'roof') { pigeons(ctx, t); fan(ctx, t) }
  else if (sk === 'market') marketSign(ctx, t);
  else if (sk === 'camp') { lake(ctx, t); campfire(ctx, t); butterflies(ctx, t) }
}
