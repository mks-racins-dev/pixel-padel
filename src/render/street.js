// Street courts (grade 1): the cheap, home-made venues at the start of the career.
// Each one has its own scene instead of the club town: a parking-garage roof, the back lot
// of a supermarket and a campsite in the pines. Worn floors, faded lines, rusty fences,
// sprayed signs and whatever people carried there themselves.
import { S } from '../state.js';
import { settings } from '../game/settings.js';
import { L, P, R, W, H, WL, WQ, circ, mulberry, ring, shade, txt, txtW } from '../core/gfx.js';
import { obj } from './background.js';

import { VENUE_RULES } from '../game/venueRules.js';
import { bikes } from './background.js';
export const STREET = ['roof', 'market', 'camp', 'yard', 'beach', 'docks', 'bridge', 'farm', 'winter', 'school'];
/** Street courts whose back walls are chain-link instead of glass. */
export const chainLink = k => !!(k && VENUE_RULES[k]?.deadBack);
/** Which street scene to draw, or null for every other venue. */
export const streetKind = () => (S.grade === 1 && STREET.includes(settings.loc) ? settings.loc : null);

let rnd = mulberry(3);
const pick = a => a[Math.floor(rnd() * a.length)];
function noise(g, x, y, w, h, col, amt, dens) { const n = Math.round(w * h * dens); for (let k = 0; k < n; k++) R(g, x + rnd() * w, y + rnd() * h, 1, 1, shade(col, rnd() < 0.5 ? amt : -amt)) }
function blob(g, cx, cy, rx, ry, c) { g.fillStyle = c; const n = Math.max(1, Math.round(ry)); for (let y = -n; y <= n; y++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (n * n)))); g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1) } }
/** A flat patch on the ground (puddle, stain) around a world point. */
function ground(g, x, y, rx, ry, c) { const p = P(x, y, 0); blob(g, p.x, p.y, rx * p.s, ry * p.s * 0.42, c) }
function shadow(o, w) { o.r(-w / 2, -0.06, w, 0.08, 'rgba(20,16,32,0.28)') }

/* ================= props ================= */
function car(o, c) {
  const d = shade(c, -34), l = shade(c, 26); shadow(o, 2.1);
  o.r(-0.95, 0.18, 1.9, 0.64, c); o.r(-0.95, 0.18, 1.9, 0.12, d); o.r(-0.95, 0.78, 1.9, 0.05, l);
  o.r(-0.78, 0.82, 1.56, 0.5, shade(c, -8)); o.r(-0.68, 0.88, 1.36, 0.38, '#3d4656'); o.r(-0.6, 1.13, 0.5, 0.07, '#7d8ca6');
  o.r(-0.88, 0.52, 0.3, 0.14, '#fff4cf'); o.r(0.58, 0.52, 0.3, 0.14, '#fff4cf'); o.r(-0.35, 0.42, 0.7, 0.16, '#2b2633');
  o.r(-0.22, 0.22, 0.44, 0.1, '#f4f4f0'); o.r(-0.95, 0, 0.32, 0.22, '#1c1a22'); o.r(0.63, 0, 0.32, 0.22, '#1c1a22');
  o.r(-1.06, 0.95, 0.12, 0.1, d); o.r(0.94, 0.95, 0.12, 0.1, d);
}
function folding(o, c) { shadow(o, 0.7); o.r(-0.27, 0, 0.04, 0.45, '#2b2633'); o.r(0.23, 0, 0.04, 0.45, '#2b2633'); o.r(-0.3, 0.4, 0.6, 0.1, c); o.r(-0.3, 0.5, 0.6, 0.42, shade(c, -18)); o.r(-0.3, 0.88, 0.6, 0.05, shade(c, 20)) }
function cooler(o, c) { shadow(o, 0.7); o.r(-0.32, 0, 0.64, 0.38, c); o.r(-0.34, 0.36, 0.68, 0.08, '#f4f4f0'); o.r(-0.1, 0.44, 0.2, 0.04, '#f4f4f0'); o.r(-0.32, 0.1, 0.64, 0.03, shade(c, -30)) }
function boombox(o) { shadow(o, 0.6); o.r(-0.3, 0, 0.6, 0.3, '#2b2633'); o.c(-0.15, 0.15, 0.09, '#6d6680'); o.c(0.15, 0.15, 0.09, '#6d6680'); o.r(-0.05, 0.2, 0.1, 0.05, '#9be37a'); o.r(-0.2, 0.3, 0.4, 0.04, '#6d6680') }
function cone(o) { o.r(-0.2, 0, 0.4, 0.05, '#c4402a'); for (let i = 0; i < 7; i++) { const w = 0.32 * (1 - i / 8); o.r(-w / 2, 0.05 + i * 0.08, w, 0.08, i === 3 || i === 4 ? '#f4f4f0' : '#ff7a3a') } }
function barrier(o) { shadow(o, 2.1); o.r(-1, 0, 2, 0.32, '#a9a397'); o.r(-0.8, 0.32, 1.6, 0.48, '#c9c3b6'); for (let k = 0; k < 4; k++) o.r(-0.8 + k * 0.4, 0.62, 0.2, 0.14, k % 2 ? '#f4f4f0' : '#c4313e'); o.r(-1, 0.3, 2, 0.03, '#8f897e') }
function bag(o, c) { shadow(o, 0.9); o.r(-0.42, 0, 0.84, 0.3, c); o.r(-0.42, 0.12, 0.84, 0.04, '#f4ead2'); o.r(-0.15, 0.3, 0.3, 0.08, shade(c, -30)); o.r(0.3, 0.18, 0.14, 0.1, '#e2ef3c') }
function streetLamp(o) { o.r(-0.05, 0, 0.1, 5.6, '#4a4d55'); o.r(-0.9, 5.5, 1.8, 0.08, '#4a4d55'); for (const s of [-1, 1]) { o.r(s * 0.9 - 0.2, 5.38, 0.4, 0.14, '#2b2633'); o.r(s * 0.9 - 0.15, 5.36, 0.3, 0.04, '#fff4cf') } }
function cart(o, c) {
  const m = '#b4bac3'; shadow(o, 1.1);
  for (let k = 0; k <= 8; k++) o.r(-0.5 + k * 0.125, 0.5, 0.02, 0.45, 'rgba(180,186,195,0.75)');
  o.r(-0.5, 0.5, 1, 0.04, m); o.r(-0.5, 0.95, 1, 0.04, m); o.r(-0.52, 0.5, 0.04, 0.49, m); o.r(0.48, 0.5, 0.04, 0.49, m);
  o.r(-0.55, 1.06, 1.1, 0.07, c || '#e4572e'); o.r(-0.45, 0.08, 0.03, 0.42, m); o.r(0.42, 0.08, 0.03, 0.42, m); o.r(-0.45, 0.2, 0.9, 0.03, m);
  o.r(-0.5, 0, 0.12, 0.1, '#1c1a22'); o.r(0.38, 0, 0.12, 0.1, '#1c1a22');
}
function crate(o, c) { shadow(o, 0.7); o.r(-0.32, 0, 0.64, 0.42, c); for (const z of [0.08, 0.22]) { o.r(-0.24, z, 0.16, 0.08, shade(c, -38)); o.r(0.08, z, 0.16, 0.08, shade(c, -38)) } o.r(-0.32, 0.38, 0.64, 0.05, shade(c, 26)) }
function pallets(o, n) { shadow(o, 1.3); for (let i = 0; i < n; i++) { const z = i * 0.16; o.r(-0.6, z, 1.2, 0.05, '#b08a5a'); o.r(-0.6, z + 0.11, 1.2, 0.05, '#c49a66'); for (const x of [-0.6, -0.06, 0.48]) o.r(x, z + 0.05, 0.12, 0.06, '#8a6a44') } }
function worklight(o) {
  const a = o.at(0, 1.3); for (const dx of [-0.4, 0, 0.4]) { const b = o.at(dx, 0); L(o.g, a.x, a.y, b.x, b.y, '#2b2633') }
  o.r(-0.03, 1.3, 0.06, 0.95, '#2b2633'); o.r(-0.34, 2.2, 0.68, 0.44, '#e8b23a'); o.r(-0.28, 2.25, 0.56, 0.32, '#fff6d8'); o.r(-0.34, 2.6, 0.68, 0.04, '#b7861f');
  const p = o.at(0, 2.4); o.g.fillStyle = 'rgba(255,240,190,0.10)'; o.g.fillRect(Math.round(p.x - 9), Math.round(p.y - 6), 18, 12);
}
function pine(o, big) {
  const k = big ? 1.25 : 1; o.r(-0.12 * k, 0, 0.24 * k, 0.9 * k, '#5a3e2a');
  for (let t = 0; t < 4; t++) { const base = (0.7 + t * 0.85) * k, w0 = (2.5 - t * 0.55) * k; for (let i = 0; i < 6; i++) { const w = w0 * (1 - i / 6); o.r(-w / 2, base + i * 0.2 * k, w, 0.2 * k, i < 2 ? '#1f4535' : i < 4 ? '#2a5a42' : '#3a7050') } }
  for (let j = 0; j < 14; j++) o.dot((rnd() - 0.5) * 1.6 * k, (1 + rnd() * 3) * k, rnd() < 0.5 ? '#4f8a5f' : '#173528');
}
function tentA(o, c) {
  shadow(o, 2.6); const n = 12;
  for (let i = 0; i < n; i++) { const w = 2.4 * (1 - i / n); o.r(-w / 2, i * 0.12, w, 0.12, i % 4 === 3 ? shade(c, -20) : c) }
  for (let i = 0; i < 7; i++) { const w = 0.9 * (1 - i / 7); o.r(-w / 2, i * 0.12, w, 0.12, i < 1 ? '#2a201c' : '#3a2c26') }
  o.r(-0.03, 1.4, 0.06, 0.16, '#2b2633'); const top = o.at(0, 1.44); for (const s of [-1.6, 1.6]) { const b = o.at(s, 0); L(o.g, top.x, top.y, b.x, b.y, 'rgba(240,230,200,0.6)') }
}
function tentDome(o, c) {
  shadow(o, 2.4); const h = 1.15, n = 12;
  for (let i = 0; i < n; i++) { const z = i * h / n, w = 2.3 * Math.sqrt(Math.max(0, 1 - (z / h) * (z / h))); o.r(-w / 2, z, w, h / n + 0.01, i % 3 === 2 ? shade(c, -22) : c) }
  for (let i = 0; i < 7; i++) { const z = i * 0.1, w = 0.8 * Math.sqrt(Math.max(0, 1 - (z / 0.75) * (z / 0.75))); o.r(-w / 2, z, w, 0.1, '#2a2a3a') }
  o.r(-1.15, 0, 2.3, 0.05, shade(c, -40)); o.r(-0.6, 0.3, 0.03, 0.8, shade(c, 30)); o.r(0.6, 0.3, 0.03, 0.8, shade(c, 30));
}
function van(o) {
  shadow(o, 2.3);
  o.r(-1, 0.2, 2, 0.75, '#3fa7a8'); o.r(-1, 0.95, 2, 1.0, '#efe6d2'); o.r(-1, 0.93, 2, 0.04, '#d9cfb8');
  o.r(-0.86, 1.28, 0.8, 0.5, '#3d4656'); o.r(0.06, 1.28, 0.8, 0.5, '#3d4656'); o.r(-0.78, 1.6, 0.3, 0.06, '#7d8ca6');
  o.c(-0.72, 0.6, 0.14, '#fff4cf'); o.c(0.72, 0.6, 0.14, '#fff4cf'); o.c(0, 0.62, 0.17, '#efe6d2'); o.c(0, 0.62, 0.1, '#3fa7a8');
  o.r(-1.02, 0.2, 2.04, 0.1, '#d9d4cc'); o.r(-0.95, 0, 0.32, 0.24, '#1c1a22'); o.r(0.63, 0, 0.32, 0.24, '#1c1a22');
  o.r(-0.9, 1.95, 1.8, 0.06, '#2b2633'); o.r(-0.6, 2.01, 0.95, 0.26, '#e4572e'); o.r(0.4, 2.01, 0.4, 0.2, '#f2c14e');
}
function log(o) { shadow(o, 1.7); o.r(-0.8, 0, 1.6, 0.42, '#7a5236'); o.r(-0.8, 0.32, 1.6, 0.06, '#94683f'); o.r(-0.8, 0.06, 1.6, 0.04, '#5e3e28'); o.c(-0.8, 0.21, 0.2, '#c9a06a'); o.c(0.8, 0.21, 0.2, '#b48a58'); o.dot(-0.8, 0.21, '#7a5236') }
function picnic(o) {
  shadow(o, 2); o.r(-0.9, 0.72, 1.8, 0.08, '#b8875a'); o.r(-0.9, 0.78, 1.8, 0.03, '#d0a070'); o.r(-0.9, 0.42, 1.8, 0.06, '#a5774c');
  for (const x of [-0.7, 0.62]) { o.r(x, 0, 0.08, 0.72, '#8a6240') }
  o.r(0.15, 0.8, 0.42, 0.26, '#c4313e'); o.r(0.13, 1.04, 0.46, 0.05, '#f4f4f0'); o.r(-0.5, 0.8, 0.12, 0.22, '#2b2633'); o.r(-0.48, 0.86, 0.08, 0.1, '#ffd25a');
  o.r(-0.2, 0.8, 0.08, 0.18, '#3f8f5a');
}
function washing(o) {
  shadow(o, 2.5); o.r(-1.2, 0, 0.06, 1.7, '#6b4a35'); o.r(1.14, 0, 0.06, 1.7, '#6b4a35');
  const a = o.at(-1.17, 1.66), b = o.at(1.17, 1.66); L(o.g, a.x, a.y, b.x, b.y, '#e8e0d0');
  o.r(-0.95, 1.02, 0.45, 0.62, '#e4572e'); o.r(-0.95, 1.2, 0.45, 0.06, '#f4ead2'); o.r(-0.35, 1.12, 0.4, 0.52, '#f2c14e'); o.r(0.2, 0.96, 0.55, 0.68, '#3fa7a8'); o.r(0.2, 1.3, 0.55, 0.06, '#f4f4f0');
}
function canoe(o) { shadow(o, 3); o.r(-1.1, 0, 0.14, 0.3, '#5a3e2a'); o.r(0.96, 0, 0.14, 0.3, '#5a3e2a'); o.r(-1.4, 0.3, 2.8, 0.24, '#c4313e'); o.r(-1.6, 0.35, 0.2, 0.14, '#c4313e'); o.r(1.4, 0.35, 0.2, 0.14, '#c4313e'); o.r(-1.4, 0.5, 2.8, 0.04, '#e8604a'); o.r(-1.2, 0.32, 2.4, 0.03, '#f4ead2') }
function firewood(o) { shadow(o, 1.3); for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) { const x = -0.45 + k * 0.3 + r * 0.15, z = 0.15 + r * 0.26; o.c(x, z, 0.14, '#c9a06a'); o.dot(x, z, '#8a6240') } }
function fireRing(o) { for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; o.r(Math.cos(a) * 0.55 - 0.08, Math.sin(a) * 0.18 + 0.02, 0.16, 0.1, k % 2 ? '#8a8a8a' : '#a6a29a') } o.r(-0.35, 0.05, 0.7, 0.08, '#4a3426'); o.r(-0.1, 0.03, 0.2, 0.14, '#3a281c') }
function woodSign(o, a, b) {
  o.r(-1.1, 0, 0.1, 1.6, '#6b4a35'); o.r(1.0, 0, 0.1, 1.6, '#6b4a35');
  o.r(-1.25, 1.05, 2.5, 0.62, '#b8875a'); o.r(-1.25, 1.3, 2.5, 0.03, '#9a6e48'); o.r(-1.25, 1.62, 2.5, 0.05, '#d0a070');
  const p = o.at(0, 1.58); txt(o.g, a, Math.round(p.x - txtW(a) / 2), Math.round(p.y), '#2b2016'); const q = o.at(0, 1.27); txt(o.g, b, Math.round(q.x - txtW(b) / 2), Math.round(q.y), '#7a2a1e');
}

/* ================= backdrops (screen space, above the ground line) ================= */
function crane(g, x, top) {
  const c = '#e8b23a', d = '#b7861f';
  for (let y = top; y < 62; y++) { R(g, x, y, 1, 1, c); R(g, x + 3, y, 1, 1, c); if ((y - top) % 4 === 0) L(g, x, y, x + 3, y + 3, d) }
  R(g, x - 26, top - 1, 44, 1, c); R(g, x - 26, top - 3, 44, 1, c); for (let k = x - 26; k < x + 18; k += 3) L(g, k, top - 3, k + 2, top - 1, d);
  R(g, x - 26, top - 3, 7, 5, '#5a5560'); R(g, x - 1, top - 8, 6, 5, d); R(g, x + 1, top - 6, 2, 2, '#9fd0ff');
  R(g, x + 12, top, 1, 14, '#2b2633'); R(g, x + 11, top + 14, 3, 2, '#2b2633');
}
function roofBack(g) {
  const cols = ['#86a6cc', '#7896c0', '#9ab6d6', '#6b8ab6', '#8fa0c2'];
  let x = -4; while (x < W) {
    const w = 14 + Math.floor(rnd() * 24), h = 14 + Math.floor(rnd() * 34), c = pick(cols), top = 60 - h;
    R(g, x, top, w, h, c); R(g, x + w - 2, top, 2, h, shade(c, -16)); R(g, x, top, w, 1, shade(c, 26));
    const band = rnd() < 0.5;
    for (let wy = top + 3; wy < 58; wy += band ? 4 : 3) { if (band) R(g, x + 1, wy, w - 3, 1, shade(c, 16)); else for (let wx = x + 2; wx < x + w - 3; wx += 3) R(g, wx, wy, 2, 1, rnd() < 0.08 ? '#fff2b8' : shade(c, 16)) }
    if (rnd() < 0.35) { R(g, x + (w >> 1), top - 7, 1, 7, shade(c, -24)); R(g, x + (w >> 1), top - 8, 1, 1, '#ff5a4a') }
    x += w + (rnd() < 0.4 ? 2 : 0);
  }
  R(g, 280, 4, 20, 56, '#5f7ea8'); R(g, 296, 4, 4, 56, '#4e6b94'); for (let y = 8; y < 58; y += 3) R(g, 282, y, 13, 1, '#86a6cc'); R(g, 289, -6, 2, 10, '#4e6b94'); R(g, 289, -7, 1, 1, '#ff5a4a');
  crane(g, 118, 10); crane(g, 404, 18);
  // railing and parapet
  R(g, 0, 52, W, 1, '#6f727a'); R(g, 0, 55, W, 1, '#6f727a'); for (let px = 2; px < W; px += 16) R(g, px, 52, 1, 6, '#6f727a');
  R(g, 0, 58, W, 10, '#b8b3a8'); R(g, 0, 58, W, 2, '#d8d4ca'); R(g, 0, 60, W, 1, '#98938a');
  for (let px = 10; px < W; px += 24) R(g, px, 60, 1, 8, '#a39e93');
  for (let k = 0; k < 40; k++) R(g, rnd() * W, 61, 1, 2 + rnd() * 5, 'rgba(70,62,54,0.22)');
  // stair tower with the exit door
  R(g, 10, 14, 64, 54, '#aaa59a'); noise(g, 10, 14, 64, 54, '#aaa59a', 8, 0.08); R(g, 10, 14, 64, 2, '#cbc6bb'); R(g, 70, 14, 4, 54, '#8f897e');
  R(g, 36, 44, 16, 24, '#3f7a5a'); R(g, 37, 45, 14, 22, '#4f8f6a'); R(g, 48, 55, 2, 2, '#d9d4cc'); R(g, 37, 60, 14, 1, '#3f7a5a');
  R(g, 33, 36, 21, 7, '#17131c'); R(g, 34, 37, 19, 5, '#1fa35a'); txt(g, 'EXIT', 36, 37, '#eafff2');
  R(g, 16, 22, 12, 8, '#3d4656'); R(g, 17, 23, 3, 2, '#7d8ca6'); R(g, 16, 30, 12, 1, '#8f897e');
  txt(g, 'P5', 16, 48, '#e8c24a', 2);
  R(g, 18, 6, 22, 8, '#c7c1b8'); R(g, 18, 6, 22, 1, '#dedad2'); for (let k = 0; k < 4; k++) R(g, 21 + k * 5, 8, 3, 4, '#8f897e');
  R(g, 62, -2, 1, 16, '#4a4d55'); R(g, 58, 2, 9, 1, '#4a4d55'); R(g, 62, -3, 1, 1, '#ff5a4a');
  txt(g, 'PADEL?', 14, 34, 'rgba(232,106,213,0.85)'); L(g, 14, 40, 30, 39, 'rgba(111,232,255,0.8)');
  // hand-sprayed plywood sign on two stakes
  R(g, 340, 40, 2, 26, '#6b4a35'); R(g, 394, 40, 2, 26, '#6b4a35');
  R(g, 324, 22, 88, 24, '#c9a46a'); for (let y = 25; y < 46; y += 4) R(g, 324, y, 88, 1, '#b8925a'); R(g, 324, 22, 88, 1, '#ddb882'); R(g, 324, 45, 88, 1, '#8a6a44');
  txt(g, 'ROOFTOP', 368 - txtW('ROOFTOP', 2) / 2, 25, '#c4313e', 2); for (const dx of [6, 19, 33, 47]) R(g, 341 + dx, 35, 1, 2 + (dx % 3), '#c4313e');
  txt(g, 'PADEL - BYO BALLS', 368 - txtW('PADEL - BYO BALLS') / 2, 38, '#2b2620');
  // vent unit (its fan spins in ambient.js)
  R(g, 420, 40, 50, 26, '#b4b0a8'); R(g, 420, 40, 50, 2, '#d0ccc4'); R(g, 466, 40, 4, 26, '#9a968e'); ring(g, 445, 53, 9, '#5a5560'); circ(g, 445, 53, 8, '#3a3640');
  for (let k = 0; k < 4; k++) R(g, 424, 46 + k * 4, 8, 1, '#8f8b84');
}
function marketBack(g) {
  const top = 16;
  R(g, -2, top, W + 4, 66 - top, '#c9bc9f'); for (let x = 0; x < W; x += 3) R(g, x, top, 1, 66 - top, '#b5a88c');
  R(g, 0, top - 3, W, 3, '#8a7f6c'); R(g, 0, top - 4, W, 1, '#a59a86'); for (let k = 0; k < 160; k++) R(g, rnd() * W, 56 + rnd() * 10, 1, 1, 'rgba(70,58,44,0.25)');
  // roof sign (one letter flickers in ambient.js)
  const s = 'MAXI MARKET', sx = 240 - txtW(s, 2) / 2; R(g, sx - 6, 0, txtW(s, 2) + 12, 14, '#2b2633'); R(g, sx - 6, 13, txtW(s, 2) + 12, 1, '#17131c');
  for (const lx of [sx + 4, sx + txtW(s, 2) - 6]) R(g, lx, 14, 2, top - 14, '#2b2633');
  g.fillStyle = 'rgba(255,90,74,0.16)'; g.fillRect(sx - 4, 1, txtW(s, 2) + 8, 12); txt(g, s, sx, 2, '#ff5a4a', 2);
  // loading docks
  const dock = (x, open) => {
    R(g, x - 3, 33, 40, 33, '#5a5248'); R(g, x, 36, 34, 30, '#9aa0a6');
    if (open) { R(g, x, 47, 34, 19, '#3a2f28'); for (let k = 0; k < 6; k++) R(g, x, 47 + k * 3, 34, 3, ['#5a4232', '#6e4f36', '#84603e', '#9a7244', '#b0864e', '#c69a58'][k]); R(g, x + 3, 55, 12, 11, '#b08a5a'); R(g, x + 3, 58, 12, 1, '#8a6a44'); R(g, x + 18, 52, 10, 14, '#d9c49a'); R(g, x + 18, 52, 10, 1, '#efe0be'); for (let y = 36; y < 47; y += 3) R(g, x, y, 34, 1, '#7f858c') }
    else for (let y = 36; y < 66; y += 3) R(g, x, y, 34, 1, '#7f858c');
    R(g, x + 2, 59, 4, 7, '#1c1a22'); R(g, x + 28, 59, 4, 7, '#1c1a22'); R(g, x + 13, 29, 8, 3, '#2b2633'); R(g, x + 14, 32, 6, 1, '#fff0c0');
  };
  dock(18, true); dock(436, false);
  // delivery truck at the dock
  R(g, 66, 22, 60, 38, '#ece8de'); R(g, 66, 22, 60, 2, '#ffffff'); R(g, 66, 38, 60, 6, '#3f8f5a'); txt(g, 'FRESH', 96 - txtW('FRESH') / 2, 30, '#3f8f5a');
  R(g, 95, 24, 1, 34, '#c9c3b6'); R(g, 66, 56, 5, 3, '#e4572e'); R(g, 121, 56, 5, 3, '#e4572e'); R(g, 64, 59, 64, 3, '#2b2633'); R(g, 70, 62, 12, 4, '#1c1a22'); R(g, 110, 62, 12, 4, '#1c1a22');
  // pallets, downpipes, lamps, stencil, graffiti
  for (let i = 0; i < 4; i++) { R(g, 132, 62 - i * 4, 30, 2, '#b08a5a'); R(g, 132, 64 - i * 4, 30, 1, '#8a6a44') }
  for (const x of [150, 330]) { R(g, x, top, 3, 50, '#8f8778'); R(g, x - 1, 62, 5, 2, '#8f8778') }
  for (const x of [166, 316]) { R(g, x, 26, 8, 4, '#2b2633'); R(g, x + 1, 30, 6, 1, '#fff4cf'); g.fillStyle = 'rgba(255,240,190,0.09)'; g.beginPath(); g.moveTo(x + 1, 31); g.lineTo(x + 7, 31); g.lineTo(x + 34, 70); g.lineTo(x - 26, 70); g.fill() }
  txt(g, 'NO PARKING', 134, 40, '#c4313e'); R(g, 133, 46, 41, 1, '#c4313e');
  txt(g, 'PADEL', 336, 34, 'rgba(232,106,213,0.85)', 2); L(g, 336, 45, 372, 43, 'rgba(111,232,255,0.8)'); txt(g, 'KING', 376, 36, 'rgba(242,193,78,0.85)');
  // dumpsters
  const dump = (x, open) => { R(g, x, 50, 36, 16, '#3f7a4a'); R(g, x, 50, 36, 1, '#5a9a62'); R(g, x + 33, 50, 3, 16, '#2f5f37'); for (let k = 0; k < 3; k++) R(g, x + 6 + k * 10, 54, 1, 9, '#2f5f37'); R(g, x + 2, 64, 4, 2, '#1c1a22'); R(g, x + 30, 64, 4, 2, '#1c1a22');
    if (open) { circ(g, x + 10, 48, 5, '#1c1a22'); circ(g, x + 22, 47, 6, '#24222a'); R(g, x + 16, 43, 2, 1, '#4a4652'); L(g, x - 1, 49, x + 6, 36, '#2f5f37', 2) } else R(g, x - 1, 47, 38, 3, '#2f5f37') };
  dump(332, true); dump(378, false);
}
function campBack(g) {
  for (let x = 0; x < W; x++) { const h = 22 + 9 * Math.sin(x / 41) + 5 * Math.sin(x / 13 + 1); R(g, x, 58 - h, 1, h, '#9ab6c6'); if (h > 30) R(g, x, 58 - h, 1, 2, '#f4f8fa') }
  for (let x = 0; x < W; x++) { const h = 12 + 6 * Math.sin(x / 29 + 2) + 3 * Math.sin(x / 9); R(g, x, 58 - h, 1, h, '#7fa894') }
  R(g, 0, 46, W, 10, '#5d9fd0'); for (let y = 47; y < 56; y += 2) R(g, 0, y, W, 1, '#6fb0dc'); for (let k = 0; k < 40; k++) R(g, rnd() * W, 47 + rnd() * 8, 2 + rnd() * 4, 1, '#bfe2f6');
  const pineS = (x, base, h, c, c2) => { R(g, x, base - 3, 1, 3, '#3a281c'); for (let i = 0; i < h; i++) { const w = Math.max(1, Math.round((h - i) * 0.42)); R(g, x - (w >> 1), base - 3 - i, w, 1, (i % 4 === 0) ? c2 : c) } };
  for (let x = -4; x < W; x += 5 + rnd() * 6) if (rnd() < 0.7) pineS(x, 52, 10 + rnd() * 8, '#3f6b55', '#355e4a');
  for (let x = -4; x < W; x += 6 + rnd() * 6) pineS(x, 60, 14 + rnd() * 10, '#2f5a45', '#264c3a');
  for (let x = -6; x < W; x += 8 + rnd() * 8) pineS(x, 68, 18 + rnd() * 12, '#244a3a', '#1c3d30');
}
const SEED = { roof: 1, market: 2, camp: 3, yard: 4, beach: 5, docks: 6, bridge: 7, farm: 8, winter: 9, school: 10 };
export function streetBack(g, kind) {
  rnd = mulberry(100 + SEED[kind]);
  ({ roof: roofBack, market: marketBack, camp: campBack, yard: yardBack, beach: beachBack, docks: docksBack, bridge: bridgeBack, farm: farmBack, winter: winterBack, school: schoolBack })[kind](g);
}

/* ================= ground around the court ================= */
export function streetGround(g, kind) {
  rnd = mulberry(200 + SEED[kind]);
  const GR = { yard: yardGround, beach: beachGround, docks: docksGround, bridge: bridgeGround, farm: farmGround, winter: winterGround, school: schoolGround };
  if (GR[kind]) return GR[kind](g);
  if (kind === 'roof') {
    R(g, 0, 68, W, H - 68, '#8f8d89'); noise(g, 0, 68, W, H - 68, '#8f8d89', 7, 0.22);
    for (let gx = -30; gx <= 30; gx += 5) WL(g, [gx, -13, 0], [gx, 16.4, 0], '#7d7b77');
    for (let gy = -12.5; gy <= 16; gy += 5) WL(g, [-34, gy, 0], [34, gy, 0], '#7d7b77');
    for (const s of [-1, 1]) {
      for (let yy = -10; yy <= 15; yy += 2.6) WL(g, [s * 6.9, yy, 0], [s * 13, yy, 0], 'rgba(238,236,224,0.55)');
      for (let yy = -12; yy < 16; yy += 1.2) WL(g, [s * 6.5, yy, 0], [s * 6.5, yy + 0.6, 0], 'rgba(242,193,78,0.65)');
      for (let k = 0; k < 5; k++) ground(g, s * (8.5 + rnd() * 3), -9 + rnd() * 23, 0.5 + rnd() * 0.5, 0.6, 'rgba(36,32,40,0.28)');
    }
    const p = P(-10.5, -1, 0); txt(g, 'P5', p.x - 9, p.y - 4, 'rgba(242,210,120,0.6)', 3);
    for (const [x, y] of [[9.2, -3], [9.2, -1.6]]) { WL(g, [x - 0.5, y, 0], [x, y + 0.6, 0], 'rgba(238,236,224,0.6)', 2); WL(g, [x + 0.5, y, 0], [x, y + 0.6, 0], 'rgba(238,236,224,0.6)', 2) }
    for (const [x, y, r] of [[-8.2, -8.6, 1.2], [10.6, 11, 1.5], [-11.8, 7.6, 0.9]]) { ground(g, x, y, r, r, '#7f93a8'); ground(g, x - 0.2, y + 0.1, r * 0.7, r * 0.5, '#9db3c8'); const q = P(x - r * 0.3, y, 0); R(g, q.x, q.y, Math.max(2, r * q.s * 0.5), 1, '#dbe8f2') }
  } else if (kind === 'market') {
    R(g, 0, 66, W, H - 66, '#5d5a62'); noise(g, 0, 66, W, H - 66, '#5d5a62', 9, 0.3);
    for (let c = 0; c < 22; c++) { let x = (rnd() - 0.5) * 34, y = -12 + rnd() * 28; if (Math.abs(x) < 6 && y > -11 && y < 11) continue; for (let s = 0; s < 6; s++) { const nx = x + (rnd() - 0.5) * 1.4, ny = y + (rnd() - 0.5) * 1.4; WL(g, [x, y, 0], [nx, ny, 0], 'rgba(28,24,32,0.55)'); x = nx; y = ny } }
    for (const s of [-1, 1]) for (let yy = -12; yy <= 16; yy += 2.8) WL(g, [s * 7, yy, 0], [s * 13.5, yy, 0], 'rgba(230,196,90,0.42)');
    for (let k = 0; k < 9; k++) { const s = rnd() < 0.5 ? -1 : 1; ground(g, s * (8 + rnd() * 5), -10 + rnd() * 25, 0.6 + rnd() * 0.6, 0.7, 'rgba(20,16,24,0.35)') }
    { const p = P(9.4, -2.5, 0); blob(g, p.x, p.y, 7, 3, '#3e3b42'); blob(g, p.x, p.y, 5, 2, '#4a4750'); for (let k = -4; k < 5; k += 2) R(g, p.x + k, p.y, 1, 1, '#2e2b32') }
    for (const [x, y, r] of [[-10.8, -6.5, 1.0], [11.2, 10.5, 1.1]]) { ground(g, x, y, r, r, '#4a4858'); ground(g, x + 0.1, y, r * 0.6, r * 0.45, '#7a6470'); const q = P(x - r * 0.3, y, 0); R(g, q.x, q.y, 3, 1, '#d8a88a') }
    for (let k = 0; k < 70; k++) { const x = (rnd() - 0.5) * 30, y = -12 + rnd() * 28; if (Math.abs(x) < 5.6 && Math.abs(y) < 10.6) continue; const p = P(x, y, 0); R(g, p.x, p.y, 1, 1, pick(['#f4f4f0', '#e4572e', '#f2c14e', '#9aa0a6', '#5a9a62'])) }
    for (let k = 0; k < 60; k++) { const x = rnd() < 0.5 ? -5.6 - rnd() * 0.4 : 5.6 + rnd() * 0.4, y = -10.5 + rnd() * 21, p = P(x, y, 0); R(g, p.x, p.y - 2, 1, 2, '#5f8a3a'); R(g, p.x + 1, p.y - 1, 1, 1, '#7aa84a') }
  } else {
    R(g, 0, 66, W, H - 66, '#6a9c44'); noise(g, 0, 66, W, H - 66, '#6a9c44', 12, 0.3);
    for (let k = 0; k < 500; k++) { const x = rnd() * W, y = 68 + rnd() * (H - 68); R(g, x, y - 2, 1, 2, rnd() < 0.5 ? '#4f7f30' : '#86b85a') }
    for (let k = 0; k < 60; k++) R(g, rnd() * W, 70 + rnd() * (H - 70), 1, 1, pick(['#f4f4f0', '#f5d76e', '#e86a6a', '#c9a6e8']));
    const sand = '#d6ba82';
    WQ(g, [[-7.4, -12, 0], [7.4, -12, 0], [7.6, 12.6, 0], [-7.6, 12.6, 0]], sand);
    WQ(g, [[-7.6, 3, 0], [-13, 1, 0], [-13, -6, 0], [-7.4, -4, 0]], sand);
    WQ(g, [[7.6, 9, 0], [12, 12, 0], [12.6, 9.5, 0], [7.6, 6.5, 0]], sand);
    for (let k = 0; k < 500; k++) { const x = (rnd() - 0.5) * 15, y = -12 + rnd() * 24.6, p = P(x, y, 0); R(g, p.x, p.y, 1, 1, rnd() < 0.5 ? '#c9ab72' : '#e2c890') }
    for (let k = 0; k < 90; k++) { const s = rnd() < 0.5 ? -1 : 1, p = P(s * (7.3 + rnd() * 0.6), -12 + rnd() * 24.6, 0); R(g, p.x, p.y - 2, 1, 2, '#5f8f3a') }
  }
}
export const curbColor = kind => ({ camp: '#8a6a48', market: '#6e6a70', yard: '#7a767c', beach: '#c9ae78', docks: '#6f6d6a', bridge: '#55525a', farm: '#8a6a48', winter: '#dfe8ef', school: '#7a767c' })[kind] || '#9a968e';

/* ================= the court itself: patches, faded lines, worn walls ================= */
export function streetFloor(g, kind, court) {
  rnd = mulberry(300 + SEED[kind]);
  for (let k = 0; k < 7; k++) { const x = (rnd() - 0.5) * 8, y = (rnd() - 0.5) * 18, w = 0.5 + rnd() * 1.2, h = 0.4 + rnd() * 1.1; WQ(g, [[x, y, 0], [x + w, y, 0], [x + w, y + h, 0], [x, y + h, 0]], shade(court, rnd() < 0.5 ? -14 : 10)) }
  for (const y of [-8.8, 8.8]) for (const x of [-2.4, 2.4]) ground(g, x, y, 1.4, 1.2, 'rgba(255,255,240,0.07)');
  if (kind === 'roof') { ground(g, 4.1, -9.2, 0.9, 0.6, '#7f93a8'); ground(g, 4.0, -9.1, 0.6, 0.4, '#9db3c8') }
  if (kind === 'market') for (let k = 0; k < 8; k++) { const p = P((rnd() - 0.5) * 9, (rnd() - 0.5) * 19, 0); R(g, p.x, p.y, 1, 1, pick(['#f4f4f0', '#f2c14e', '#8a8f94'])) }
  if (kind === 'yard') for (let k = 0; k < 6; k++) { const p = P((rnd() - 0.5) * 9, (rnd() - 0.5) * 19, 0); R(g, p.x, p.y, 2, 1, pick(['#c9a64a', '#8a6a44', '#5f8a3a'])) }
  if (kind === 'docks') for (let k = 0; k < 5; k++) ground(g, (rnd() - 0.5) * 8, (rnd() - 0.5) * 18, 0.5 + rnd() * 0.5, 0.5, 'rgba(120,70,40,0.18)');
  if (kind === 'camp' || kind === 'beach') {
    for (let k = 0; k < 260; k++) { const s = rnd() < 0.5 ? -1 : 1, x = s * (5 - Math.pow(rnd(), 2) * 1.6), y = (rnd() - 0.5) * 20, p = P(x, y, 0); R(g, p.x, p.y, 1, 1, rnd() < 0.5 ? '#d6ba82' : '#c9ab72') }
    for (let k = 0; k < 18; k++) { const p = P((rnd() - 0.5) * 9.6, (rnd() - 0.5) * 19.6, 0); R(g, p.x, p.y, 2, 1, pick(['#3a281c', '#2a5a42', '#8a6a44'])) }
  }
}
/** Faded court lines with chunks missing. */
export function streetLines(g) {
  rnd = mulberry(55);
  const seg = (a, b, w) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.35); for (let i = 0; i < n; i++) { if (rnd() < 0.16) continue; const t0 = i / n, t1 = (i + 1) / n, al = (0.4 + rnd() * 0.35).toFixed(2); WL(g, [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, 0], [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, 0], 'rgba(236,238,232,' + al + ')', w) } };
  seg([-5, -6.95], [5, -6.95], 2); seg([-5, 6.95], [5, 6.95], 1); seg([0, -6.95], [0, 6.95], 1);
}
/** The far wall: home-made boards instead of sponsors, a cracked pane, tape. */
export function streetWall(g, kind) {
  rnd = mulberry(77);
  if (chainLink(kind)) { // chain-link fence instead of glass: zip-tied banners, no cracks to show
    for (const [a, c, t] of kind === 'school' ? [[-4.4, '#3b6fb0', 'SCHOOL'], [1.6, '#f2c14e', 'PE']] : [[-4.4, '#c4313e', 'SALE'], [1.6, '#f2c14e', 'MAXI']]) { WQ(g, [[a, 10, 0.6], [a + 2.2, 10, 0.6], [a + 2.2, 10, 1.3], [a, 10, 1.3]], c); const p = P(a + 1.1, 10, 1.12); txt(g, t, Math.round(p.x - txtW(t) / 2), Math.round(p.y), c === '#c4313e' ? '#fff4cf' : '#2b2016') }
    return;
  }
  const boards = kind === 'camp' ? [['#b8875a', 'CAMP'], ['#a5774c', ''], ['#b8875a', 'PADEL'], ['#a5774c', ''], ['#b8875a', '']] : kind === 'market' ? [['#e9e2d0', 'MAXI'], ['#8f9aa4', ''], ['#c4313e', 'SALE'], ['#8f9aa4', ''], ['#e9e2d0', '-50']] : kind === 'yard' ? [['#7f9a6a', ''], ['#c9c2b0', 'DOM 12'], ['#7f9a6a', ''], ['#c4313e', ''], ['#7f9a6a', '']] : kind === 'beach' ? [['#f4ead2', 'SURF'], ['#3fa7a8', ''], ['#f2c14e', 'KIOSK'], ['#3fa7a8', ''], ['#f4ead2', '']] : kind === 'docks' ? [['#c4313e', ''], ['#3b6fb0', 'PORT'], ['#e8b23a', ''], ['#3f7a4a', 'PIER 4'], ['#c4313e', '']] : kind === 'bridge' ? [['#2b2633', 'NO'], ['#ff6ad5', 'RULES'], ['#2b2633', ''], ['#6fe8ff', 'B-23'], ['#2b2633', '']] : kind === 'farm' ? [['#a8332a', 'EGGS'], ['#e9dcc0', ''], ['#a8332a', 'MILK'], ['#e9dcc0', ''], ['#a8332a', '']] : kind === 'winter' ? [['#f4f4f0', ''], ['#3b6fb0', 'SKI'], ['#f4f4f0', ''], ['#c4313e', 'SAUNA'], ['#f4f4f0', '']] : [['#9a968e', ''], ['#c4313e', 'P5'], ['#9a968e', ''], ['#3b6fb0', ''], ['#9a968e', '']];
  for (let k = 0; k < 5; k++) {
    const a = -5 + k * 2, [c, t] = boards[k]; WQ(g, [[a + 0.05, 10, 0], [a + 1.95, 10, 0], [a + 1.95, 10, 0.42], [a + 0.05, 10, 0.42]], c);
    for (let j = 0; j < 3; j++) { const p = P(a + 0.2 + rnd() * 1.6, 10, 0.05 + rnd() * 0.3); R(g, p.x, p.y, 1 + rnd() * 2, 1, shade(c, 30)) }
    if (t) { const p = P(a + 1, 10, 0.32); txt(g, t, Math.round(p.x - txtW(t) / 2), Math.round(p.y), kind === 'market' && k === 2 ? '#fff4cf' : '#2b2016') }
  }
  const c = P(2.6, 10, 1.9); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + 0.3, l = 4 + rnd() * 7; L(g, c.x, c.y, c.x + Math.cos(a) * l, c.y + Math.sin(a) * l * 0.8, 'rgba(255,255,255,0.55)') } ring(g, c.x, c.y, 2, 'rgba(255,255,255,0.5)');
  const t = P(-2.9, 10, 1.4); L(g, t.x - 6, t.y - 5, t.x + 6, t.y + 5, 'rgba(226,206,150,0.85)', 2); L(g, t.x - 6, t.y + 5, t.x + 6, t.y - 5, 'rgba(226,206,150,0.85)', 2);
}
export const streetFence = { post: '#4e3e34', mesh: 'rgba(104,72,52,', glass: 'rgba(176,200,196,' };

/* ================= props per scene (world space, sorted far to near) ================= */
export function streetProps(g, kind) {
  rnd = mulberry(400 + SEED[kind]);
  let list = ({ yard: yardProps, beach: beachProps, docks: docksProps, bridge: bridgeProps, farm: farmProps, winter: winterProps, school: schoolProps })[kind]?.();
  if (list) { /* scene list above */ }
  else if (kind === 'roof') list = [
    { x: -12.4, y: 11.5, f: o => car(o, '#c4313e') }, { x: 12.4, y: 7, f: o => car(o, '#3b6fb0') }, { x: -12.8, y: -3.8, f: o => car(o, '#e8d8b0') },
    { x: 7.2, y: 12.2, f: streetLamp },
    { x: -9.15, y: 6.2, f: o => folding(o, '#3fa7a8') }, { x: -8.35, y: 5.7, f: o => folding(o, '#e4572e') }, { x: -9.0, y: 3.2, f: o => folding(o, '#f2c14e') },
    { x: -8.0, y: 4.5, f: o => cooler(o, '#3b6fb0') }, { x: -9.7, y: 7.4, f: boombox },
    { x: 10.6, y: -8.6, f: barrier }, { x: 7.4, y: -6.2, f: cone }, { x: 8.1, y: -7.3, f: cone }, { x: -7.4, y: -8.2, f: o => bag(o, '#2b2540') },
  ];
  else if (kind === 'market') list = [
    { x: 10.3, y: 9.6, f: cart }, { x: 10.05, y: 9.2, f: cart }, { x: 9.8, y: 8.8, f: cart },
    { x: -12.6, y: 8.5, f: o => car(o, '#8a8f6a') }, { x: -11.2, y: 1.2, f: o => pallets(o, 4) }, { x: 12.6, y: 1.5, f: o => pallets(o, 2) },
    { x: -9.15, y: 6.2, f: o => crate(o, '#c4313e') }, { x: -8.35, y: 5.7, f: o => crate(o, '#3b6fb0') }, { x: -9.0, y: 3.2, f: o => crate(o, '#f2c14e') },
    { x: -6.4, y: 10.9, f: worklight }, { x: 6.4, y: 10.9, f: worklight },
    { x: 7.6, y: -6.4, f: o => cart(o, '#3b6fb0') }, { x: -7.6, y: -8, f: o => bag(o, '#3a3a44') },
  ];
  else list = [
    { x: -13.6, y: 13.2, f: o => pine(o, true) }, { x: 13.4, y: 13.6, f: o => pine(o, true) },
    { x: -10.8, y: 11, f: o => tentA(o, '#e4572e') }, { x: 10.4, y: 11.2, f: o => tentDome(o, '#3b6fb0') }, { x: 7.6, y: 12.6, f: o => woodSign(o, 'CAMP', 'COURT') },
    { x: 12.6, y: 6.4, f: canoe }, { x: -12.8, y: 4.4, f: van },
    { x: -8.7, y: 6, f: log }, { x: -8.7, y: 3.1, f: log }, { x: 9.8, y: 2, f: picnic },
    { x: -14, y: -1, f: o => pine(o, false) }, { x: 14.2, y: -2.5, f: o => pine(o, true) },
    { x: -9.6, y: -4, f: fireRing }, { x: -10.8, y: -3.4, f: log }, { x: 11.2, y: -5.4, f: washing }, { x: -11.6, y: -7.6, f: firewood },
    { x: -13.6, y: -9, f: o => pine(o, true) },
  ];
  list.sort((a, b) => b.y - a.y); for (const p of list) p.f(obj(g, p.x, p.y));
}
/** Near corners, drawn in front of the near players. */
export function streetFront(g, kind) {
  rnd = mulberry(91);
  if (kind === 'roof') { cone(obj(g, -6.3, -10.8)); cone(obj(g, 6.5, -11.1)) }
  else if (kind === 'market') { worklight(obj(g, -6.5, -10.9)); worklight(obj(g, 6.5, -10.9)) }
  else if (kind === 'docks') { bollard(obj(g, -6.4, -10.9)); drum(obj(g, 6.6, -11), '#3b6fb0') }
  else if (kind === 'yard') { const o = obj(g, 6.6, -11); o.r(-0.35, 0, 0.7, 0.9, '#3b6fb0'); o.r(-0.38, 0.86, 0.76, 0.08, '#2f5a8a'); o.r(-0.2, 0.5, 0.4, 0.06, '#f4f4f0') }
  else if (kind === 'beach') { surfboard(obj(g, -6.6, -11), '#3fa7a8') }
  else if (kind === 'winter') { for (const s of [-1, 1]) { const o = obj(g, s * 6.6, -11); o.c(0, 0.25, 0.6, '#f4f8fb'); o.c(-0.3, 0.2, 0.4, '#e6eef4') } }
  else if (kind === 'farm') { hay(obj(g, -6.7, -11.1)) }
  else if (kind === 'bridge') { barrel(obj(g, 6.7, -11)) }
  else if (kind === 'school') { cone(obj(g, -6.3, -10.9)); cone(obj(g, 6.4, -11)) }
  else for (const s of [-1, 1]) for (let k = 0; k < 18; k++) { const p = P(s * (6 + rnd() * 2.5), -10.6 - rnd() * 0.8, 0); const h = 2 + Math.floor(rnd() * 4); R(g, p.x, p.y - h, 1, h, rnd() < 0.5 ? '#4f7f30' : '#6f9f45') }
}

/* ================= courtyard between the panel blocks ================= */
function block(g, x, w, top, c) {
  const d = shade(c, -14);
  R(g, x, top, w, 66 - top, c); for (let y = top + 9; y < 66; y += 9) R(g, x, y, w, 1, d); for (let xx = x + 16; xx < x + w; xx += 16) R(g, xx, top, 1, 66 - top, d);
  R(g, x, top - 2, w, 2, shade(c, -30)); R(g, x + w - 2, top, 2, 66 - top, shade(c, -22));
  for (let wy = top + 2; wy < 52; wy += 9) for (let wx = x + 2; wx + 13 < x + w; wx += 16) {
    const balc = Math.round((wx - x) / 16) % 3 === 1;
    for (const ox of [0, 7]) { const lit = rnd() < 0.18; R(g, wx + ox, wy, 5, 5, lit ? pick(['#ffd27a', '#f6b25e']) : '#465269'); R(g, wx + ox, wy, 5, 1, '#e6e2d8'); if (!lit && rnd() < 0.3) R(g, wx + ox + 1, wy + 1, 1, 3, '#7d8ca6'); if (rnd() < 0.2) R(g, wx + ox, wy + 1, 2, 4, pick(['#d98ca0', '#e9d8b4', '#9fc0d6'])) }
    if (balc && wy > top + 6) {
      const k = rnd(); R(g, wx - 1, wy + 6, 15, 1, shade(c, -40));
      if (k < 0.35) { R(g, wx - 1, wy + 3, 15, 3, 'rgba(150,175,190,0.85)'); R(g, wx + 4, wy + 3, 1, 3, '#e6e2d8') }
      else if (k < 0.7) { R(g, wx - 1, wy + 3, 15, 3, shade(c, -26)); for (let j = 0; j < 4; j++) R(g, wx + j * 3, wy + 1, 2, 2 + (j % 2), pick(['#e4572e', '#f4f4f0', '#3fa7a8', '#f2c14e', '#8e6cc1'])) }
      else { R(g, wx - 1, wy + 3, 15, 3, '#8a6a44'); R(g, wx + 2, wy + 1, 3, 2, '#4f8a4b'); R(g, wx + 9, wy + 1, 2, 2, '#e86a6a') }
      if (rnd() < 0.25) { circ(g, wx + 12, wy - 1, 2, '#e6e2d8'); R(g, wx + 11, wy, 1, 2, '#9a968e') }
    }
  }
  for (let ex = x + 10, n = 1; ex + 12 < x + w; ex += 48, n++) { R(g, ex, 56, 10, 10, '#6b4a35'); R(g, ex + 1, 57, 8, 9, '#7a5642'); R(g, ex - 2, 54, 14, 2, '#8f8b84'); R(g, ex + 2, 49, 6, 5, '#2f5a8a'); txt(g, String(n), ex + 4, 49, '#f4f4f0') }
}
function birch(g, x, base, h) {
  R(g, x, base - h, 2, h, '#eeeae0'); for (let y = base - h + 2; y < base; y += 3 + ((y * 7) % 3)) R(g, x + (y % 2), y, 1, 1, '#2b2633');
  for (const [dx, dy, r] of [[0, -h, 6], [-4, -h + 5, 5], [5, -h + 4, 5], [1, -h - 4, 4]]) circ(g, x + 1 + dx, base + dy, r, '#5f9a4a');
  for (let k = 0; k < 18; k++) R(g, x - 6 + rnd() * 14, base - h - 8 + rnd() * 14, 1, 1, rnd() < 0.5 ? '#86c060' : '#3f6b35');
}
function yardBack(g) {
  block(g, -6, 170, 10, '#bdb8ac'); block(g, 164, 158, 2, '#c9c2b0'); block(g, 322, 168, 14, '#aab2b6');
  for (const x of [150, 318, 470]) birch(g, x, 66, 26 + Math.floor(rnd() * 10));
  txt(g, 'ANNA + IGOR', 22, 60, 'rgba(232,106,213,0.85)'); txt(g, 'PADEL', 364, 60, 'rgba(111,232,255,0.85)');
}
function yardGround(g) {
  R(g, 0, 66, W, H - 66, '#6e6b70'); noise(g, 0, 66, W, H - 66, '#6e6b70', 8, 0.28);
  for (const [x, y, rx, c] of [[-11, 9, 2.6, '#7a6a4e'], [11.5, 6, 2.8, '#6f8f4a'], [-12, -7, 2.2, '#6f8f4a'], [12.4, -6.5, 1.8, '#7a6a4e']]) { ground(g, x, y, rx, rx * 0.9, c); for (let k = 0; k < 30; k++) { const p = P(x + (rnd() - 0.5) * rx * 1.6, y + (rnd() - 0.5) * rx * 1.6, 0); R(g, p.x, p.y - 1, 1, 1 + (rnd() < 0.5 ? 1 : 0), shade(c, rnd() < 0.5 ? 16 : -16)) } }
  for (let c = 0; c < 16; c++) { let x = (rnd() - 0.5) * 30, y = -12 + rnd() * 28; if (Math.abs(x) < 6 && Math.abs(y) < 11) continue; for (let st = 0; st < 5; st++) { const nx = x + (rnd() - 0.5) * 1.2, ny = y + (rnd() - 0.5) * 1.2; WL(g, [x, y, 0], [nx, ny, 0], 'rgba(30,26,34,0.5)'); x = nx; y = ny } }
  for (const [x, y] of [[8.6, -3], [-12.5, 3.2]]) { ground(g, x, y, 0.7, 0.6, '#5a5760'); ground(g, x, y, 0.45, 0.35, '#7d93a6') }
  const ch = 'rgba(244,240,232,0.75)';
  for (let i = 0; i < 6; i++) { const y = -9.6 + i * 0.7, x = -9.4; WL(g, [x - 0.35, y, 0], [x + 0.35, y, 0], ch); WL(g, [x - 0.35, y, 0], [x - 0.35, y + 0.7, 0], ch); WL(g, [x + 0.35, y, 0], [x + 0.35, y + 0.7, 0], ch) }
}
function swingFrame(o) { shadow(o, 2.6); const tl = o.at(-1.2, 2.2), tr = o.at(1.2, 2.2); for (const [a, b] of [[-1.5, -1.2], [-0.9, -1.2], [1.5, 1.2], [0.9, 1.2]]) { const p = o.at(a, 0), q = o.at(b, 2.2); L(o.g, p.x, p.y, q.x, q.y, a < 0 ? '#c4313e' : '#3b6fb0', 2) } L(o.g, tl.x, tl.y, tr.x, tr.y, '#f2c14e', 2) }
function slide(o) { shadow(o, 2.2); o.r(-1, 0, 0.08, 1.5, '#3b6fb0'); o.r(-0.6, 0, 0.08, 1.5, '#3b6fb0'); o.r(-1.05, 1.45, 0.55, 0.08, '#f2c14e'); for (let k = 0; k < 5; k++) o.r(-1, 0.25 + k * 0.28, 0.48, 0.04, '#9aa0a6'); for (let i = 0; i < 10; i++) o.r(-0.55 + i * 0.15, 1.45 - i * 0.15, 0.18, 0.1, '#e4572e') }
function sandbox(o) { shadow(o, 1.9); o.r(-0.9, 0, 1.8, 0.22, '#8a6a44'); o.r(-0.85, 0.18, 1.7, 0.06, '#e3cc98'); o.r(-0.3, 0.24, 0.2, 0.12, '#e4572e'); o.r(0.3, 0.22, 0.3, 0.06, '#3fa7a8') }
function beater(o) { o.r(-1.1, 0, 0.06, 1.6, '#5a6a7a'); o.r(1.04, 0, 0.06, 1.6, '#5a6a7a'); o.r(-1.1, 1.55, 2.2, 0.06, '#5a6a7a'); o.r(-1.1, 1.0, 2.2, 0.04, '#5a6a7a'); o.r(-0.7, 0.55, 1.2, 1.0, '#a8332a'); for (let k = 0; k < 4; k++) o.r(-0.6 + k * 0.3, 0.7, 0.14, 0.7, k % 2 ? '#e8b23a' : '#2f5a8a'); o.r(-0.7, 0.55, 1.2, 0.06, '#f4ead2') }
function bins(o) { shadow(o, 2.2); for (const [x, c] of [[-0.75, '#3f7a4a'], [0.05, '#3b6fb0']]) { o.r(x, 0, 0.7, 0.95, c); o.r(x - 0.03, 0.92, 0.76, 0.08, shade(c, -30)); o.r(x + 0.1, 0.4, 0.5, 0.05, shade(c, 25)) } }
function yardBench(o) { shadow(o, 1.9); o.r(-0.9, 0.4, 1.8, 0.1, '#3f7a5a'); o.r(-0.9, 0.5, 1.8, 0.04, '#5a9a72'); o.r(-0.85, 0, 0.1, 0.4, '#2b2633'); o.r(0.75, 0, 0.1, 0.4, '#2b2633'); o.r(-0.9, 0.62, 1.8, 0.08, '#3f7a5a'); o.r(-0.9, 0.78, 1.8, 0.08, '#3f7a5a') }
function yardProps() { return [
  { x: -11.6, y: 10.8, f: beater }, { x: 11.2, y: 9.6, f: swingFrame }, { x: 9.6, y: 6.2, f: sandbox }, { x: 12, y: 3.6, f: slide },
  { x: -12.8, y: 4.5, f: o => car(o, '#e9e4d8') }, { x: 13, y: -3.8, f: o => car(o, '#6a8f5a') },
  { x: -8.7, y: 6, f: yardBench }, { x: -8.7, y: 3, f: yardBench }, { x: 11.6, y: -8.6, f: bins }, { x: -11.2, y: -4.6, f: washing },
] }

/* ================= beach in the dunes ================= */
function beachBack(g) {
  R(g, 0, 28, W, 26, '#2f7fc0'); for (let y = 30; y < 54; y += 4) R(g, 0, y, W, 2, y < 40 ? '#3a8ccb' : '#4a9dd4'); R(g, 0, 28, W, 1, '#9fd0f0');
  for (let k = 0; k < 60; k++) R(g, rnd() * W, 32 + rnd() * 20, 2 + rnd() * 3, 1, '#bfe4f8');
  R(g, 96, 20, 1, 8, '#2b2633'); for (let i = 0; i < 7; i++) R(g, 97, 21 + i, 1 + i, 1, '#f4f4f0'); R(g, 90, 28, 14, 2, '#c4313e');
  R(g, 372, 24, 30, 4, '#4a4458'); R(g, 382, 19, 10, 5, '#e6e2d8'); R(g, 386, 15, 2, 4, '#c4313e');
  R(g, 0, 52, W, 6, '#ead7a6'); R(g, 0, 52, W, 1, '#f8f4ea');
  for (let x = 0; x < W; x++) { const h = 6 + 4 * Math.sin(x / 23) + 2 * Math.sin(x / 7 + 1); R(g, x, 66 - h, 1, h, '#d9c08a'); R(g, x, 66 - h, 1, 1, '#e8d4a0') }
  for (let k = 0; k < 140; k++) { const x = rnd() * W, y = 58 + rnd() * 8; R(g, x, y - 3, 1, 3, rnd() < 0.5 ? '#9ab06a' : '#7a9a52'); R(g, x + 1, y - 2, 1, 2, '#9ab06a') }
  const bpine = (x, h) => { for (let y = 66 - h; y < 64; y++) R(g, x + Math.round(Math.sin(y / 6) * 1.5), y, 2, 1, '#b0603e'); const ty = 66 - h; for (const [dx, dy, r] of [[0, 0, 7], [-6, 3, 5], [6, 2, 5], [-2, -4, 5]]) { circ(g, x + dx, ty + dy, r, '#2f5a42'); circ(g, x + dx - 1, ty + dy - 1, r - 2, '#3f7050') } };
  for (const [x, h] of [[24, 30], [150, 26], [312, 32], [452, 28]]) bpine(x, h);
  R(g, 58, 40, 1, 24, '#e6e2d8'); R(g, 74, 40, 1, 24, '#e6e2d8'); L(g, 58, 50, 74, 60, '#e6e2d8'); R(g, 54, 28, 24, 12, '#c4313e'); R(g, 54, 32, 24, 3, '#f4f4f0'); R(g, 57, 30, 18, 1, '#3d4656'); R(g, 52, 26, 28, 2, '#f4f4f0'); R(g, 66, 12, 1, 14, '#2b2633');
}
function beachGround(g) {
  R(g, 0, 66, W, H - 66, '#e3cc98'); noise(g, 0, 66, W, H - 66, '#e3cc98', 10, 0.3);
  for (let k = 0; k < 40; k++) { let x = (rnd() - 0.5) * 30, y = -12 + rnd() * 28; if (Math.abs(x) < 6.2 && Math.abs(y) < 11) continue; for (let st = 0; st < 5; st++) { x += 0.45; y += (rnd() - 0.5) * 0.3; const p = P(x, y + (st % 2) * 0.25, 0); R(g, p.x, p.y, 2, 1, '#c9ae78') } }
  for (let k = 0; k < 50; k++) { const x = (rnd() - 0.5) * 32, y = -12 + rnd() * 28; if (Math.abs(x) < 6.2 && Math.abs(y) < 11) continue; const p = P(x, y, 0); R(g, p.x, p.y, 1, 1, pick(['#f4f4f0', '#f0c0b0', '#6a7a4a', '#a8885a'])) }
  for (const [x, y, c, c2] of [[-11.4, -2.4, '#e4572e', '#f4ead2'], [11.6, -7.2, '#3fa7a8', '#f2c14e']]) { const p = P(x, y, 0), w = Math.round(1.8 * p.s), h = Math.max(2, Math.round(0.9 * p.s * 0.45)); R(g, p.x - w / 2, p.y - h, w, h, c); for (let k = 0; k < w; k += 4) R(g, p.x - w / 2 + k, p.y - h, 2, h, c2) }
}
function surfboard(o, c) { shadow(o, 0.6); for (let i = 0; i < 14; i++) { const z = i * 0.15, w = 0.5 * Math.sqrt(Math.max(0.05, 1 - Math.pow((z - 1) / 1.05, 2))); o.r(-w / 2, z, w, 0.15, c) } o.r(-0.03, 0.1, 0.06, 1.9, '#f4f4f0') }
function kiosk(o) { shadow(o, 2.6); o.r(-1.2, 0, 2.4, 1.1, '#3fa7a8'); o.r(-1.2, 1.1, 2.4, 0.08, '#f4f4f0'); o.r(-1.1, 1.18, 2.2, 0.6, '#2b2633'); o.r(-1.0, 1.24, 2.0, 0.48, '#ffd890'); for (let k = 0; k < 6; k++) o.r(-1.35 + k * 0.45, 1.78, 0.45, 0.3, k % 2 ? '#f4f4f0' : '#e4572e'); o.r(-1.35, 2.08, 2.7, 0.06, '#c4402a'); const p = o.at(0, 0.85); txt(o.g, 'KIOSK', Math.round(p.x - txtW('KIOSK') / 2), Math.round(p.y), '#f4f4f0') }
function sandcastle(o) { o.r(-0.4, 0, 0.8, 0.25, '#d6ba82'); o.r(-0.3, 0.25, 0.25, 0.2, '#d6ba82'); o.r(0.08, 0.25, 0.22, 0.28, '#d6ba82'); o.r(0.17, 0.53, 0.02, 0.2, '#2b2633'); o.r(0.19, 0.66, 0.12, 0.06, '#e4572e'); o.r(0.6, 0, 0.2, 0.18, '#e4572e') }
function lounger(o, c) { shadow(o, 1.4); o.r(-0.6, 0, 0.05, 0.3, '#6b4a35'); o.r(0.55, 0, 0.05, 0.3, '#6b4a35'); o.r(-0.6, 0.3, 1.2, 0.08, c); o.r(-0.6, 0.38, 0.4, 0.4, c); for (let k = 0; k < 4; k++) o.r(-0.6 + k * 0.3, 0.3, 0.12, 0.08, '#f4f4f0') }
function umbrellaB(o, c1, c2) { o.r(-0.6, -0.04, 1.2, 0.06, 'rgba(20,16,32,0.2)'); o.r(-0.04, 0, 0.08, 2.2, '#e8e0d0'); for (let i = 0; i < 6; i++) { const w = 2.2 - i * 0.34; o.r(-w / 2, 2.1 + i * 0.08, w, 0.09, i % 2 ? c1 : c2) } for (let i = 0; i < 5; i++) o.r(-1.1 + i * 0.44, 2.02, 0.22, 0.08, c1) }
function beachProps() { return [
  { x: -12.4, y: 11.6, f: kiosk }, { x: 12.6, y: 10, f: o => surfboard(o, '#f2c14e') }, { x: 13.2, y: 9.4, f: o => surfboard(o, '#e4572e') },
  { x: 10.4, y: 7.8, f: o => umbrellaB(o, '#e4572e', '#f4ead2') }, { x: 11.8, y: 1.6, f: o => umbrellaB(o, '#3fa7a8', '#f4ead2') },
  { x: -9.15, y: 6.2, f: o => lounger(o, '#3fa7a8') }, { x: -8.35, y: 5.7, f: o => lounger(o, '#e4572e') }, { x: -9.0, y: 3.2, f: o => lounger(o, '#f2c14e') },
  { x: 9.4, y: -6.6, f: sandcastle }, { x: -8, y: 4.4, f: o => cooler(o, '#e4572e') }, { x: -12.6, y: -8, f: o => surfboard(o, '#3fa7a8') },
] }

/* ================= container docks ================= */
function container(g, x, y, w, h, c, label) {
  R(g, x, y, w, h, c); for (let k = x + 1; k < x + w - 1; k += 2) R(g, k, y + 1, 1, h - 2, shade(c, -16)); R(g, x, y, w, 1, shade(c, 28)); R(g, x, y + h - 1, w, 1, shade(c, -36)); R(g, x, y, 1, h, shade(c, -30)); R(g, x + w - 1, y, 1, h, shade(c, -30));
  if (label && w > 18) { R(g, x + 3, y + 2, txtW(label) + 2, 7, shade(c, -45)); txt(g, label, x + 4, y + 3, '#f4f4f0') }
}
function docksBack(g) {
  R(g, 0, 32, W, 12, '#5a6a84'); for (let x = 0; x < W; x += 6 + rnd() * 10) { const h = 2 + rnd() * 8; R(g, x, 44 - h, 4 + rnd() * 6, h, '#4e5c74') }
  for (const x of [60, 230]) { R(g, x, 18, 1, 26, '#6a7690'); R(g, x - 12, 18, 26, 1, '#6a7690') }
  R(g, 0, 44, W, 14, '#2e5f7a'); for (let y = 45; y < 58; y += 3) R(g, 0, y, W, 1, '#3a7090'); for (let k = 0; k < 50; k++) R(g, rnd() * W, 45 + rnd() * 12, 2 + rnd() * 3, 1, '#8fc0d8');
  R(g, -4, 40, 196, 12, '#7a2e2a'); R(g, -4, 50, 196, 2, '#4a1e1c'); R(g, -4, 40, 196, 1, '#f4f4f0'); txt(g, 'PIXEL STAR', 120, 43, '#f4f4f0');
  const cc = ['#c4313e', '#3b6fb0', '#e8b23a', '#3f7a4a', '#e4572e', '#8e6cc1', '#9aa0a6'];
  for (let row = 0; row < 3; row++) for (let x = 34; x < 186; x += 16) if (rnd() < 0.85) container(g, x, 32 - row * 8, 16, 8, pick(cc));
  R(g, 4, 18, 22, 22, '#f4f4f0'); R(g, 6, 21, 18, 3, '#3d4656'); R(g, 6, 27, 18, 3, '#3d4656'); R(g, 14, 8, 3, 10, '#c4313e'); R(g, 14, 6, 3, 2, '#2b2633');
  const C = '#c4313e', D = '#8a2228';
  for (const x of [372, 432]) { R(g, x, 4, 4, 62, C); R(g, x + 1, 4, 1, 62, '#e05a5a') }
  for (let y = 8; y < 60; y += 10) L(g, 376, y, 432, y + 8, D);
  R(g, 300, 2, 180, 5, C); R(g, 300, 2, 180, 1, '#e05a5a'); for (let x = 302; x < 478; x += 6) L(g, x, 6, x + 3, 3, D); R(g, 440, -2, 30, 4, D); R(g, 448, 7, 12, 7, '#f4f4f0'); R(g, 450, 9, 8, 2, '#3d4656');
  for (let row = 0; row < 3; row++) for (let x = 310; x < 480; x += 22) if (row < 2 || rnd() < 0.5) container(g, x, 56 - row * 10, 22, 10, pick(cc), row === 0 && rnd() < 0.4 ? pick(['PXL', 'PADL', 'SMSH']) : '');
  R(g, 0, 58, 310, 8, '#8a8884'); R(g, 0, 58, 310, 1, '#b0aea8'); for (let x = 8; x < 300; x += 26) { R(g, x, 59, 5, 6, '#1c1a22'); R(g, x + 1, 60, 3, 4, '#2b2633') }
}
function docksGround(g) {
  R(g, 0, 66, W, H - 66, '#8a8884'); noise(g, 0, 66, W, H - 66, '#8a8884', 8, 0.25);
  for (let gx = -30; gx <= 30; gx += 4) WL(g, [gx, -13, 0], [gx, 16.4, 0], '#7c7a76');
  for (let gy = -12; gy <= 16; gy += 4) WL(g, [-34, gy, 0], [34, gy, 0], '#7c7a76');
  for (const s of [-1, 1]) for (let yy = -12; yy < 16; yy += 1.4) WL(g, [s * 6.6, yy, 0], [s * 6.6, yy + 0.8, 0], 'rgba(242,193,78,0.75)', 2);
  for (let y = -12.5; y < 16; y += 0.8) WL(g, [-12.9, y, 0], [-11.1, y, 0], '#6e5a44');
  for (const x of [-12.6, -11.4]) WL(g, [x, -13, 0], [x, 16.4, 0], '#4a4652');
  for (let k = 0; k < 10; k++) { const s = rnd() < 0.5 ? -1 : 1; ground(g, s * (8 + rnd() * 5), -10 + rnd() * 25, 0.6 + rnd() * 0.6, 0.6, 'rgba(120,70,40,0.25)') }
}
function forklift(o) { shadow(o, 1.8); o.r(-0.7, 0.25, 1.2, 0.8, '#e8b23a'); o.r(-0.7, 1.05, 1.2, 0.08, '#2b2633'); o.r(-0.6, 1.1, 0.06, 0.9, '#2b2633'); o.r(0.4, 1.1, 0.06, 0.9, '#2b2633'); o.r(-0.65, 1.95, 1.1, 0.08, '#2b2633'); o.r(0.55, 0, 0.08, 2.2, '#4a4652'); o.r(0.55, 0.1, 0.5, 0.06, '#9aa0a6'); o.r(-0.7, 0, 0.36, 0.3, '#1c1a22'); o.r(0.14, 0, 0.36, 0.3, '#1c1a22'); o.r(-0.3, 0.5, 0.5, 0.3, '#3d4656') }
function drum(o, c) { shadow(o, 0.7); o.r(-0.3, 0, 0.6, 0.85, c); for (const z of [0.25, 0.55]) o.r(-0.3, z, 0.6, 0.04, shade(c, -30)); o.r(-0.3, 0.82, 0.6, 0.05, shade(c, 30)); o.r(-0.2, 0.05, 0.08, 0.75, shade(c, 25)) }
function bollard(o) { shadow(o, 0.6); o.r(-0.22, 0, 0.44, 0.45, '#2b2633'); o.r(-0.3, 0.45, 0.6, 0.12, '#3a3640'); o.r(-0.2, 0.2, 0.4, 0.05, '#e8b23a') }
function rope(o) { for (let k = 0; k < 4; k++) o.r(-0.45 + k * 0.05, 0.06 * k, 0.9 - k * 0.1, 0.06, k % 2 ? '#c9a06a' : '#b08a5a') }
function docksProps() { return [
  { x: 11, y: 8.6, f: forklift }, { x: -11.4, y: 9.8, f: o => pallets(o, 3) }, { x: -9.8, y: 11.4, f: rope },
  { x: -9.15, y: 6.2, f: o => crate(o, '#3b6fb0') }, { x: -8.35, y: 5.7, f: o => crate(o, '#c4313e') }, { x: -7.9, y: 7.4, f: o => drum(o, '#c4313e') }, { x: -9.0, y: 3.2, f: o => crate(o, '#a5774c') },
  { x: 12.4, y: -2.6, f: o => drum(o, '#3f7a4a') }, { x: 12.9, y: -3.4, f: o => drum(o, '#3b6fb0') }, { x: 8.2, y: 1.6, f: bollard }, { x: 8.2, y: -5.4, f: bollard },
  { x: -12, y: 2, f: streetLamp }, { x: 10.4, y: -8.8, f: o => crate(o, '#a5774c') }, { x: 11.1, y: -9.2, f: o => crate(o, '#8a6a44') },
] }

/* ================= underpass: under the flyover at night ================= */
function bridgeBack(g) {
  for (let x = 0; x < W; x += 8 + rnd() * 14) { const h = 14 + rnd() * 30, w = 8 + rnd() * 14; R(g, x, 64 - h, w, h, '#232642'); for (let y = 66 - h; y < 62; y += 3) for (let xx = x + 1; xx < x + w - 1; xx += 3) if (rnd() < 0.3) R(g, xx, y, 1, 1, pick(['#ffd27a', '#f6b25e', '#9fd0ff'])) }
  R(g, 0, 6, W, 16, '#6e6b78'); R(g, 0, 6, W, 2, '#8a8794'); R(g, 0, 20, W, 2, '#4a4754'); for (let x = 0; x < W; x += 24) R(g, x, 8, 1, 12, '#5f5c69');
  R(g, 0, 2, W, 1, '#4a4754'); for (let x = 2; x < W; x += 10) R(g, x, 2, 1, 4, '#4a4754');
  g.fillStyle = 'rgba(10,8,24,0.45)'; g.fillRect(0, 22, W, 44);
  for (const x of [40, 160, 316, 440]) { R(g, x, 22, 22, 44, '#5a5764'); R(g, x, 22, 3, 44, '#6e6b78'); R(g, x + 19, 22, 3, 44, '#47444f'); R(g, x - 4, 20, 30, 4, '#6e6b78') }
  txt(g, 'PADEL', 320, 58, '#ff6ad5', 1); txt(g, 'NO', 446, 30, '#6fe8ff'); txt(g, 'LIMIT', 442, 38, '#f2c14e');
  L(g, 162, 50, 178, 40, '#9be37a', 2); L(g, 320, 30, 334, 48, '#ff8a5c', 2); txt(g, 'B23', 322, 52, '#f4f4f0');
  R(g, 62, 30, 54, 13, '#17131c'); R(g, 63, 31, 52, 11, '#1a0f2a'); txt(g, 'UNDERPASS', 66, 34, '#ff6ad5');
  for (const x of [130, 380]) { R(g, x, 26, 1, 40, '#3a3640'); R(g, x - 3, 25, 7, 2, '#3a3640'); R(g, x - 2, 27, 5, 1, '#ffb45a'); g.fillStyle = 'rgba(255,180,90,0.10)'; g.beginPath(); g.moveTo(x - 2, 28); g.lineTo(x + 3, 28); g.lineTo(x + 22, 66); g.lineTo(x - 21, 66); g.fill() }
}
function bridgeGround(g) {
  R(g, 0, 66, W, H - 66, '#3f3c46'); noise(g, 0, 66, W, H - 66, '#3f3c46', 8, 0.3);
  for (const s of [-1, 1]) for (let yy = -12; yy < 16; yy += 1.6) WL(g, [s * 7.2, yy, 0], [s * 7.2, yy + 0.9, 0], 'rgba(240,240,230,0.35)', 2);
  for (const [x, y, r, c] of [[-10.4, -5.5, 1.4, '#ff6ad5'], [10.6, 9.5, 1.2, '#6fe8ff'], [-11.6, 9, 0.9, '#ffb45a']]) { ground(g, x, y, r, r, '#2c2a36'); ground(g, x + 0.1, y, r * 0.6, r * 0.35, c); const q = P(x - r * 0.3, y, 0); R(g, q.x, q.y, 3, 1, '#ffffff') }
  for (let k = 0; k < 50; k++) { const x = (rnd() - 0.5) * 30, y = -12 + rnd() * 28; if (Math.abs(x) < 6 && Math.abs(y) < 11) continue; const p = P(x, y, 0); R(g, p.x, p.y, 1, 1, pick(['#6d6680', '#ff6ad5', '#9be37a', '#f4f4f0'])) }
}
function ramp(o) { shadow(o, 2.4); for (let i = 0; i < 10; i++) { const z = i * 0.12, w = 2.2 * (1 - Math.pow(i / 10, 2)); o.r(-1.1, z, w, 0.12, i % 3 ? '#8a6a44' : '#6b4a35') } o.r(-1.1, 1.18, 0.5, 0.06, '#9aa0a6'); o.r(-1.15, 0, 0.08, 1.24, '#4a4652') }
function barrel(o) { shadow(o, 0.8); o.r(-0.32, 0, 0.64, 0.9, '#5a3e2a'); for (const z of [0.2, 0.6]) o.r(-0.32, z, 0.64, 0.05, '#2b2633'); o.r(-0.34, 0.86, 0.68, 0.06, '#3a281c'); o.r(-0.2, 0.05, 0.08, 0.75, '#7a5236') }
function vanSide(o, c) { shadow(o, 3.2); o.r(-1.5, 0.25, 3, 1.4, c); o.r(-1.5, 1.6, 3, 0.08, shade(c, 25)); o.r(0.8, 0.95, 0.6, 0.45, '#3d4656'); o.r(-1.2, 0.6, 1.6, 0.4, shade(c, -30)); o.r(-1.2, 0, 0.42, 0.32, '#1c1a22'); o.r(0.8, 0, 0.42, 0.32, '#1c1a22'); const p = o.at(-0.4, 1.05); txt(o.g, 'PADEL', Math.round(p.x - 9), Math.round(p.y), '#ff6ad5') }
function block2(o) { shadow(o, 0.9); o.r(-0.42, 0, 0.84, 0.48, '#8a8794'); o.r(-0.42, 0.44, 0.84, 0.05, '#a9a6b2'); o.r(-0.3, 0.1, 0.2, 0.2, '#6e6b78'); o.r(0.1, 0.1, 0.2, 0.2, '#6e6b78') }
function bridgeProps() { return [
  { x: 11.2, y: 9.2, f: ramp }, { x: -12.2, y: 9, f: o => vanSide(o, '#3b6fb0') }, { x: -11.4, y: 1.4, f: barrel }, { x: 12.6, y: 2.2, f: o => car(o, '#2b2633') },
  { x: -9.15, y: 6.2, f: block2 }, { x: -8.35, y: 5.7, f: block2 }, { x: -9.0, y: 3.2, f: block2 }, { x: -7.8, y: 7.6, f: boombox },
  { x: 9.6, y: -6.4, f: cone }, { x: 12.2, y: -8.6, f: o => cart(o, '#3b6fb0') }, { x: -8.4, y: -8.2, f: o => bag(o, '#2b2540') },
] }

/* ================= farm: behind the barn ================= */
function farmBack(g) {
  for (let x = 0; x < W; x++) { const h = 10 + 5 * Math.sin(x / 47) + 3 * Math.sin(x / 13); R(g, x, 46 - h, 1, h + 20, '#5f8f5a') }
  for (let y = 40; y < 66; y += 4) R(g, 0, y, W, 2, (y / 4) % 2 ? '#d9c06a' : '#8fb05a');
  for (let x = 0; x < W; x += 3) R(g, x, 38 + Math.sin(x / 9) * 2, 2, 3, '#3f6b45');
  // barn
  R(g, 16, 22, 92, 44, '#a8332a'); for (let x = 18; x < 108; x += 4) R(g, x, 22, 1, 44, '#8a2822');
  for (let i = 0; i < 16; i++) R(g, 12 + i * 3, 22 - i * 1.2, 100 - i * 6, 2, i % 2 ? '#5a3e2a' : '#6b4a35');
  R(g, 46, 40, 32, 26, '#f4ead2'); R(g, 48, 42, 28, 24, '#8a2822'); L(g, 48, 42, 76, 66, '#f4ead2', 2); L(g, 76, 42, 48, 66, '#f4ead2', 2);
  R(g, 54, 26, 16, 10, '#f4ead2'); R(g, 56, 28, 12, 8, '#3a2c26');
  R(g, 112, 12, 18, 54, '#b8b4ac'); for (let y = 16; y < 66; y += 5) R(g, 112, y, 18, 1, '#9a968e'); circ(g, 121, 12, 9, '#9a968e'); R(g, 112, 12, 18, 1, '#cfccc6');
  // windmill (blades turn in ambient.js)
  R(g, 404, 20, 6, 46, '#e9dcc0'); R(g, 402, 18, 10, 4, '#8a6a44'); R(g, 405, 44, 4, 8, '#5a3e2a');
  for (let x = 160; x < W; x += 9) { R(g, x, 58, 2, 8, '#8a6a44'); R(g, x - 4, 60, 10, 1, '#a5774c') }
  for (const x of [176, 190, 330, 346, 360]) { R(g, x, 50, 1, 12, '#3f7a4a'); circ(g, x, 50, 3, '#f2c14e'); R(g, x, 50, 1, 1, '#5a3e2a') }
}
function farmGround(g) {
  R(g, 0, 66, W, H - 66, '#6a9c44'); noise(g, 0, 66, W, H - 66, '#6a9c44', 12, 0.3);
  for (let k = 0; k < 600; k++) { const x = rnd() * W, y = 68 + rnd() * (H - 68); R(g, x, y - 2, 1, 2, rnd() < 0.5 ? '#4f7f30' : '#86b85a') }
  for (const [x, y, rx] of [[-11, 8, 2.4], [11.5, -5, 2.2], [9, 10, 1.6]]) { ground(g, x, y, rx, rx * 0.8, '#8a6a44'); for (let k = 0; k < 30; k++) { const p = P(x + (rnd() - 0.5) * rx * 1.4, y + (rnd() - 0.5) * rx * 1.4, 0); R(g, p.x, p.y, 2, 1, rnd() < 0.5 ? '#d9c06a' : '#b8935a') } }
  for (let k = 0; k < 120; k++) { const x = (rnd() - 0.5) * 30, y = -12 + rnd() * 28; if (Math.abs(x) < 5.8 && Math.abs(y) < 10.8) continue; const p = P(x, y, 0); R(g, p.x, p.y, 2, 1, '#d9c06a') }
}
function hay(o) { shadow(o, 1.3); o.c(0, 0.55, 0.6, '#d9b25a'); o.c(-0.1, 0.62, 0.42, '#e8c46a'); for (let k = 0; k < 3; k++) { const a = o.at(-0.5 + k * 0.1, 0.3 + k * 0.25), b = o.at(0.5 - k * 0.1, 0.3 + k * 0.25); L(o.g, a.x, a.y, b.x, b.y, '#b8903a') } }
function haySquare(o) { shadow(o, 1.1); o.r(-0.5, 0, 1, 0.45, '#d9b25a'); o.r(-0.5, 0.4, 1, 0.06, '#e8c46a'); o.r(-0.2, 0, 0.04, 0.45, '#8a6a44'); o.r(0.2, 0, 0.04, 0.45, '#8a6a44') }
function tractor(o) { shadow(o, 2.6); o.r(-1.1, 0.4, 1.6, 0.6, '#3f8f4a'); o.r(-0.1, 0.9, 0.7, 0.8, '#3f8f4a'); o.r(0, 1.0, 0.5, 0.5, '#3d4656'); o.r(-0.15, 1.7, 0.8, 0.06, '#2b2633'); o.c(0.55, 0.45, 0.45, '#1c1a22'); o.c(0.55, 0.45, 0.2, '#e8b23a'); o.c(-0.85, 0.28, 0.28, '#1c1a22'); o.c(-0.85, 0.28, 0.12, '#e8b23a'); o.r(-1.0, 1.0, 0.06, 0.5, '#4a4652') }
function scarecrow(o) { o.r(-0.04, 0, 0.08, 1.8, '#6b4a35'); o.r(-0.6, 1.3, 1.2, 0.07, '#6b4a35'); o.r(-0.25, 0.8, 0.5, 0.6, '#3b6fb0'); o.c(0, 1.6, 0.17, '#e8c46a'); o.r(-0.25, 1.72, 0.5, 0.06, '#8a5a3c'); o.r(-0.14, 1.78, 0.28, 0.12, '#8a5a3c'); o.r(-0.55, 1.28, 0.12, 0.12, '#e8c46a'); o.r(0.43, 1.28, 0.12, 0.12, '#e8c46a') }
function milk(o) { for (const x of [-0.2, 0.15]) { o.r(x - 0.12, 0, 0.24, 0.45, '#c9c3b6'); o.r(x - 0.08, 0.45, 0.16, 0.1, '#a9a397') } }
function farmProps() { return [
  { x: -12.4, y: 11.4, f: tractor }, { x: 12.4, y: 11.6, f: scarecrow }, { x: 10.6, y: 6.8, f: hay }, { x: 11.8, y: 5.6, f: hay },
  { x: -9.15, y: 6.2, f: haySquare }, { x: -8.35, y: 5.7, f: haySquare }, { x: -9.0, y: 3.2, f: haySquare }, { x: -12.4, y: 0.5, f: milk },
  { x: 12.6, y: -2.6, f: o => pallets(o, 2) }, { x: -11.6, y: -6.8, f: hay }, { x: 9.4, y: -8, f: o => crate(o, '#a5774c') },
] }

/* ================= winter park ================= */
function winterBack(g) {
  for (let x = 0; x < W; x++) { const h = 16 + 6 * Math.sin(x / 37) + 3 * Math.sin(x / 11); R(g, x, 50 - h, 1, h, '#b9c6d6'); R(g, x, 50 - h, 1, 2, '#f4f8fb') }
  R(g, 0, 46, W, 8, '#a9c4dc'); for (let y = 47; y < 54; y += 2) R(g, 0, y, W, 1, '#c4d8ea');
  const house = (x, w, c) => { R(g, x, 40, w, 16, c); for (let i = 0; i < 6; i++) R(g, x - 2 + i, 39 - i * 1.5, w + 4 - 2 * i, 2, '#f4f8fb'); R(g, x + 4, 44, 5, 5, '#ffd27a'); R(g, x + w - 9, 44, 5, 5, '#ffd27a'); R(g, x + w / 2 - 2, 49, 5, 7, '#5a3e2a'); R(g, x + w - 8, 28, 3, 7, '#6b4a35') };
  house(60, 34, '#a8332a'); house(330, 30, '#c9a64a'); house(416, 36, '#3b6fb0');
  const spine = (x, base, h) => { for (let i = 0; i < h; i++) { const w = Math.max(1, Math.round((h - i) * 0.45)); R(g, x - (w >> 1), base - i, w, 1, i % 4 === 0 ? '#f4f8fb' : '#2f5a45') } };
  for (let x = -4; x < W; x += 7 + rnd() * 8) if (x < 56 || (x > 98 && x < 326) || x > 452 || rnd() < 0.3) spine(x, 66, 14 + rnd() * 12);
}
function winterGround(g) {
  R(g, 0, 66, W, H - 66, '#e9f0f6'); noise(g, 0, 66, W, H - 66, '#e9f0f6', 8, 0.2);
  for (let k = 0; k < 30; k++) { let x = (rnd() - 0.5) * 30, y = -12 + rnd() * 28; if (Math.abs(x) < 6.4 && Math.abs(y) < 11) continue; for (let st = 0; st < 6; st++) { x += 0.4; const p = P(x, y + (st % 2) * 0.22, 0); R(g, p.x, p.y, 2, 1, '#c4d2e0') } }
  WQ(g, [[-6.6, -11.6, 0], [6.6, -11.6, 0], [6.6, 11.6, 0], [-6.6, 11.6, 0]], '#cdd8e4');
  for (const s of [-1, 1]) for (let y = -11.5; y < 11.5; y += 0.6) { const p = P(s * (6.4 + rnd() * 0.5), y, 0); circ(g, p.x, p.y - 1, 2 + rnd() * 2, '#f6f9fc') }
}
function snowman(o) { shadow(o, 1); o.c(0, 0.4, 0.42, '#f6f9fc'); o.c(0, 1.0, 0.3, '#f6f9fc'); o.c(0, 1.45, 0.2, '#f6f9fc'); o.dot(-0.07, 1.5, '#2b2633'); o.dot(0.07, 1.5, '#2b2633'); o.r(0, 1.42, 0.16, 0.05, '#ff7a3a'); o.r(-0.22, 1.22, 0.44, 0.07, '#c4313e'); o.r(-0.15, 1.62, 0.3, 0.2, '#2b2633'); o.dot(0, 1.0, '#2b2633'); o.dot(0, 0.85, '#2b2633') }
function sauna(o) { shadow(o, 2.6); o.r(-1.2, 0, 2.4, 1.3, '#8a5a3c'); for (let z = 0.15; z < 1.3; z += 0.22) o.r(-1.2, z, 2.4, 0.03, '#6b4a35'); for (let i = 0; i < 6; i++) o.r(-1.35 + i * 0.12, 1.3 + i * 0.12, 2.7 - i * 0.24, 0.12, i < 2 ? '#f4f8fb' : '#5a3e2a'); o.r(-0.3, 0, 0.5, 0.9, '#5a3e2a'); o.r(0.5, 0.6, 0.4, 0.3, '#ffd27a'); o.r(0.7, 1.4, 0.2, 0.5, '#4a4652'); const p = o.at(-0.05, 1.1); txt(o.g, 'SAUNA', Math.round(p.x - 9), Math.round(p.y), '#f4ead2') }
function sled(o) { o.r(-0.6, 0.1, 1.2, 0.1, '#c4313e'); o.r(-0.6, 0, 1.2, 0.04, '#4a4652'); o.r(-0.65, 0.04, 0.06, 0.2, '#4a4652') }
function skis(o) { const a = o.at(-0.4, 0), b = o.at(0.4, 1.7), c = o.at(0.4, 0), d = o.at(-0.4, 1.7); L(o.g, a.x, a.y, b.x, b.y, '#e4572e', 2); L(o.g, c.x, c.y, d.x, d.y, '#3b6fb0', 2) }
function snowBench(o) { bench(o); o.r(-0.92, 0.5, 1.84, 0.06, '#f6f9fc'); o.r(-0.92, 0.86, 1.84, 0.05, '#f6f9fc') }
function snowPine(o) { pine(o, true); for (let t = 0; t < 4; t++) { const z = (0.7 + t * 0.85) * 1.25 + 0.15, w = (2.5 - t * 0.55) * 1.25 * 0.7; o.r(-w / 2, z, w, 0.12, '#f4f8fb') } }
function winterProps() { return [
  { x: -13.4, y: 13, f: snowPine }, { x: 13.6, y: 13.2, f: snowPine }, { x: -11.4, y: 9.8, f: sauna }, { x: 11, y: 8.6, f: snowman },
  { x: -8.7, y: 6, f: snowBench }, { x: -8.7, y: 3, f: snowBench }, { x: 12.2, y: 4.4, f: skis }, { x: 10.2, y: 2.6, f: sled },
  { x: -12.6, y: -2.4, f: snowPine }, { x: 12.8, y: -5, f: snowman }, { x: -8.6, y: -8.4, f: o => cooler(o, '#c4313e') }, { x: 13.4, y: -9, f: snowPine },
] }
function bench(o) { shadow(o, 1.9); o.r(-0.9, 0.4, 1.8, 0.1, '#8a5a3c'); o.r(-0.85, 0, 0.1, 0.4, '#2b2633'); o.r(0.75, 0, 0.1, 0.4, '#2b2633'); o.r(-0.9, 0.62, 1.8, 0.08, '#8a5a3c'); o.r(-0.9, 0.78, 1.8, 0.08, '#8a5a3c') }

/* ================= schoolyard ================= */
function schoolBack(g) {
  R(g, -4, 14, W + 8, 52, '#b8644a'); for (let y = 16; y < 66; y += 3) for (let x = ((y / 3) % 2) * 4; x < W; x += 8) R(g, x, y, 7, 1, '#a85a42');
  R(g, -4, 12, W + 8, 3, '#e9dcc0'); R(g, -4, 38, W + 8, 2, '#e9dcc0');
  for (let x = 6; x < W; x += 30) for (const y of [18, 42]) { R(g, x, y, 22, 14, '#f4ead2'); R(g, x + 1, y + 1, 20, 12, '#5a7a9a'); R(g, x + 11, y + 1, 1, 12, '#f4ead2'); R(g, x + 1, y + 7, 20, 1, '#f4ead2'); if (rnd() < 0.5) R(g, x + 2, y + 2, 4, 3, pick(['#f2c14e', '#e4572e', '#9be37a', '#f4f4f0'])); R(g, x + 2, y + 2, 1, 4, '#8fb0c8') }
  R(g, 210, 0, 60, 14, '#b8644a'); R(g, 208, -1, 64, 2, '#e9dcc0'); circ(g, 240, 6, 5, '#f4f4f0'); ring(g, 240, 6, 5, '#2b2633'); R(g, 240, 3, 1, 3, '#2b2633'); R(g, 240, 6, 3, 1, '#2b2633');
  R(g, 140, 4, 1, 34, '#9aa0a6');
  for (let k = 0; k < 6; k++) R(g, 18 + k * 7, 62, 5, 4, pick(['#3b6fb0', '#e4572e', '#f2c14e', '#3f7a4a']));
  txt(g, 'SCHOOL 7', 300, 3, '#f4ead2', 1);
}
function schoolGround(g) {
  R(g, 0, 66, W, H - 66, '#7a777e'); noise(g, 0, 66, W, H - 66, '#7a777e', 8, 0.25);
  const wl = 'rgba(244,240,232,0.6)';
  for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI; WL(g, [10.5 + Math.cos(a) * 2.2, 4 + Math.sin(a) * 2.2, 0], [10.5 + Math.cos(a + Math.PI / 16) * 2.2, 4 + Math.sin(a + Math.PI / 16) * 2.2, 0], wl) }
  WL(g, [8.3, 4, 0], [12.7, 4, 0], wl);
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, b = (i + 1) / 24 * Math.PI * 2; WL(g, [-10.5 + Math.cos(a) * 1.6, -5 + Math.sin(a) * 1.6, 0], [-10.5 + Math.cos(b) * 1.6, -5 + Math.sin(b) * 1.6, 0], 'rgba(242,193,78,0.75)') }
  for (let k = 0; k < 10; k++) { const p = P(-12 + rnd() * 3, -10 + rnd() * 3, 0); R(g, p.x, p.y, 2, 1, pick(['#ff8a5c', '#6fd3d2', '#f2c14e', '#ff6ad5'])) }
}
function hoop(o) { shadow(o, 1); o.r(-0.06, 0, 0.12, 2.9, '#4a4652'); o.r(-0.55, 2.6, 1.1, 0.75, '#f4f4f0'); o.r(-0.2, 2.75, 0.4, 0.3, '#e4572e'); o.r(-0.18, 2.6, 0.36, 0.04, '#e4572e'); o.r(-0.12, 2.25, 0.04, 0.35, '#f4f4f0'); o.r(0.08, 2.25, 0.04, 0.35, '#f4f4f0') }
function bus(o) { shadow(o, 2.3); o.r(-1.1, 0.25, 2.2, 1.8, '#f2c14e'); o.r(-0.95, 1.25, 1.9, 0.6, '#3d4656'); o.r(-1.1, 0.25, 2.2, 0.12, '#2b2633'); o.r(-0.95, 0.55, 0.3, 0.15, '#fff4cf'); o.r(0.65, 0.55, 0.3, 0.15, '#fff4cf'); o.r(-0.4, 0.95, 0.8, 0.18, '#2b2633'); const p = o.at(0, 1.03); txt(o.g, 'BUS', Math.round(p.x - 5), Math.round(p.y - 1), '#f2c14e'); o.r(-1, 0, 0.35, 0.3, '#1c1a22'); o.r(0.65, 0, 0.35, 0.3, '#1c1a22') }
function backpacks(o) { for (const [x, c] of [[-0.35, '#e4572e'], [0.05, '#3b6fb0'], [0.4, '#9be37a']]) { o.r(x - 0.16, 0, 0.32, 0.38, c); o.r(x - 0.1, 0.12, 0.2, 0.1, shade(c, -30)) } }
function schoolProps() { return [
  { x: -12.6, y: 9.4, f: bus }, { x: 10.5, y: 6.4, f: hoop }, { x: 12.8, y: 12, f: bikes },
  { x: -8.7, y: 6, f: bench }, { x: -8.7, y: 3, f: bench }, { x: -7.8, y: 1.2, f: backpacks },
  { x: 12.6, y: -2, f: o => cooler(o, '#3b6fb0') }, { x: 9.6, y: -7.6, f: cone }, { x: 10.4, y: -8.4, f: cone }, { x: -12.4, y: -2, f: o => crate(o, '#3b6fb0') },
] }
