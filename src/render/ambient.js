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
function seagulls(ctx, t) {
  for (const [ph, y0, sp] of [[0, 14, 26], [7, 24, 20], [3, 9, 31]]) {
    const x = ((t + ph) * sp) % (W + 60) - 30, y = y0 + Math.sin(t * 1.1 + ph) * 3, f = Math.floor(t * 4 + ph) % 3 === 0;
    R(ctx, x - 3, y - (f ? 1 : 0), 3, 1, '#f4f4f0'); R(ctx, x, y, 1, 1, '#c9c3b6'); R(ctx, x + 1, y - (f ? 1 : 0), 3, 1, '#f4f4f0'); R(ctx, x - 3, y - (f ? 1 : 0), 1, 1, '#2b2633'); R(ctx, x + 3, y - (f ? 1 : 0), 1, 1, '#2b2633');
  }
}
function waves(ctx, t) {
  for (let k = 0; k < 3; k++) { const ph = (t * 0.25 + k / 3) % 1, y = Math.round(51 - ph * 4); ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - ph)).toFixed(2) + ')'; for (let x = (k * 37) % 20; x < W; x += 20) ctx.fillRect(x + Math.round(Math.sin(t + x) * 2), y, 9, 1) }
  const f = Math.floor(t * 6) % 3; R(ctx, 67, 12, 8 - f, 2, '#e4572e'); R(ctx, 67, 14, 6 - f, 2, '#f2c14e');
}
function crane(ctx, t) {
  const x = Math.round(330 + (Math.sin(t * 0.35) + 1) * 55); R(ctx, x, 7, 10, 4, '#2b2633'); R(ctx, x + 4, 11, 1, 22 + Math.round(Math.sin(t * 0.5) * 6), '#2b2633'); R(ctx, x + 1, 33 + Math.round(Math.sin(t * 0.5) * 6), 7, 2, '#e8b23a');
  if (Math.floor(t * 1.5) % 2) R(ctx, 302, 0, 2, 2, '#ff5a4a');
  for (let k = 0; k < 6; k++) { const ph = Math.floor(t * 3 + k * 4.1), x2 = (ph * 89 + k * 61) % 300, y2 = 45 + (ph * 7 + k) % 12; if ((ph + k) % 3) R(ctx, x2, y2, 2, 1, '#cfe6f2') }
}
function swings(ctx, t) {
  for (const [dx, amp, ph] of [[-0.6, 0.45, 0], [0.6, 0.08, 1.3]]) {
    const a = Math.sin(t * 2.2 + ph) * amp, top = P(11.2 + dx, 9.6, 2.2), seat = P(11.2 + dx + Math.sin(a) * 1.5, 9.6 - Math.sin(a) * 0.4, 2.2 - Math.cos(a) * 1.6);
    ctx.fillStyle = '#4a4652'; const n = 8; for (let i = 0; i <= n; i++) { const u = i / n; ctx.fillRect(Math.round(top.x - 2 + (seat.x - top.x) * u), Math.round(top.y + (seat.y - top.y) * u), 1, 1); ctx.fillRect(Math.round(top.x + 2 + (seat.x - top.x) * u), Math.round(top.y + (seat.y - top.y) * u), 1, 1) }
    R(ctx, seat.x - 3, seat.y, 7, 2, '#c4313e');
  }
}
function groundPigeons(ctx, t) {
  for (const [x, y, ph] of [[8.2, -1.2, 0], [9.0, -2.0, 2.1], [-7.6, 8.6, 1]]) {
    const wx = x + Math.sin(t * 0.3 + ph) * 0.4, p = P(wx, y, 0), peck = Math.floor(t * 2.5 + ph) % 3 === 0 ? 1 : 0, px = Math.round(p.x), py = Math.round(p.y);
    R(ctx, px - 2, py - 3, 4, 3, '#7d7f8c'); R(ctx, px - 1, py - 3, 2, 1, '#9a9caa'); R(ctx, px + 2, py - 4 + peck, 2, 2, '#6a6c7a'); R(ctx, px + 4, py - 3 + peck, 1, 1, '#e8a040');
  }
}
function windsock(ctx, t) { const f = Math.floor(t * 8) % 2; R(ctx, 63, -1, 7, 2, '#ff7a3a'); R(ctx, 70, -1 + f, 4, 2, '#f4f4f0'); R(ctx, 74, f, 3, 1, '#ff7a3a') }
/** Drawn every frame right after the venue background. */
export function drawAmbient(ctx) {
  const t = S.time, G = grade(), sk = streetKind();
  if (!G.indoor && !G.arena && !G.stand && !curLoc().night && sk !== 'market' && sk !== 'beach' && sk !== 'docks') birds(ctx, t);
  if (sk === 'roof') { pigeons(ctx, t); fan(ctx, t); windsock(ctx, t) }
  else if (sk === 'yard') { swings(ctx, t); groundPigeons(ctx, t) }
  else if (sk === 'beach') { waves(ctx, t); seagulls(ctx, t) }
  else if (sk === 'docks') { crane(ctx, t); seagulls(ctx, t) }
  else if (sk === 'market') marketSign(ctx, t);
  else if (sk === 'camp') { lake(ctx, t); campfire(ctx, t); butterflies(ctx, t) }
}
