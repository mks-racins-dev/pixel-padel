// Court grades: how big the event is, shown by how the venue looks.
// 0 = the plain venue (quick play, online). 1 = street court, 2 = community club, 3 = indoor warehouse,
// 5 = regional open, 6 = nationals, 7 = pro tour, 8 = world finals arena.
// Only the look changes: the court, walls and physics are the same at every grade.
import { S } from '../state.js';
import { R, L, P, WL, WQ, circ, txt, txtW, shade, mulberry } from '../core/gfx.js';
import { obj } from './background.js';

export const GRADES = {
  0: { crowd: 7 },
  1: { crowd: 3, cracks: true, graffiti: true, dirty: true, label: 'STREET COURT' },
  2: { crowd: 5, worn: true, dirty: true, whiteboard: true, label: 'CLUB NIGHT' },
  3: { crowd: 7, indoor: true, phones: true, floor: '#5a5560', label: 'INDOOR' },
  5: { crowd: 11, stand: 1, boards: 'banner', umpire: true, label: 'OPEN' },
  6: { crowd: 14, stand: 2, boards: 'led', umpire: true, camera: true, kids: true, floor: '#3d4f6a', label: 'NATIONALS' },
  7: { crowd: 18, stand: 3, boards: 'led', umpire: true, camera: true, kids: true, pano: true, flood: true, floor: '#2b3a55', label: 'WORLD TOUR' },
  8: { crowd: 22, stand: 3, boards: 'led', umpire: true, camera: true, kids: true, pano: true, flood: true, arena: true, flashes: true, floor: '#161a28', label: 'WORLD FINALS' },
};
export const grade = () => GRADES[S.grade] || GRADES[0];

/** Which grade a career, season or doubles event is played at. */
export function gradeFor(ev) {
  if (!ev) return 0;
  if (ev.grade !== undefined) return ev.grade;
  const id = ev.id || '';
  if (id === 'p_fin') return 8;
  if (id.startsWith('a1_')) return ev.venue === 'ware' ? 3 : ev.venue === 'sunset' ? 2 : 1;
  if (id.startsWith('b_')) return 5;
  if (id.startsWith('e_')) return 6;
  if (id.startsWith('p_')) return 7;
  if (ev.doubles) return [2, 5, 6, 7][ev.tier] ?? 2;
  if (/^s\d+_2$/.test(id)) return 8; // season headliner
  if (/^s\d+_/.test(id)) return 7;
  return 0;
}

/* ---------------- crowd ---------------- */
const SPEC = [['#e86a6a', '#2d2a3a', '#e8b48a', '#4a2c1a'], ['#f4ead2', '#3b5b8c', '#8d5a3b', '#1f1a17'], ['#6fae5f', '#2d2a3a', '#f0c4a0', '#d9b26a'], ['#8e6cc1', '#5a3b2c', '#c98d62', '#2b1d14'], ['#f2c14e', '#1f2a44', '#e8b48a', '#7a3a22'], ['#3fa7a8', '#2d2a3a', '#b97a52', '#1f1a17'], ['#d98ca0', '#3b5b8c', '#f0c4a0', '#4a2c1a']];
const LEFT = [[6.2, -0.45], [5.7, 0.35], [3.2, -0.3], [2.7, 0.4], [0.2, -0.2], [-2.6, 0.3], [-3.3, -0.35], [7.6, 0.1], [-5.2, 0.2], [1.4, 0.5], [4.5, -0.6]];
/** Spectators beside the court: few at a street court, both sides packed at the big events. */
export function setCrowd(g = S.grade) {
  const n = (GRADES[g] || GRADES[0]).crowd, ph = !!(GRADES[g] || {}).phones;
  S.spectators.length = 0;
  for (let i = 0; i < n; i++) {
    const [y, dx] = LEFT[Math.floor(i / 2) % LEFT.length], right = i >= 7 && i % 2 === 1, c = SPEC[i % SPEC.length];
    const pos = i < 7 ? { x: -8.7 + LEFT[i][1], y: LEFT[i][0] } : right ? { x: 8.9 - dx, y: y - 0.4 } : { x: -9.6 + dx, y: y + 0.3 };
    S.spectators.push({ ...pos, shirt: c[0], pants: c[1], skin: c[2], hair: c[3], ph: i * 1.7, cheer: 0, phone: ph && i % 3 === 0 });
  }
}

/* ---------------- background layers ---------------- */
const CROWD_C = ['#e4572e', '#f4ead2', '#3fa7a8', '#f2c14e', '#8e6cc1', '#6fae5f', '#d98ca0', '#3b5b8c'];
function stands(g, top, rnd, dark) {
  for (let y = top; y < 64; y += 5) {
    R(g, 0, y, 480, 5, dark ? '#1a1622' : '#4a4458'); R(g, 0, y + 4, 480, 1, dark ? '#110e17' : '#383244');
    for (let x = (y / 5) % 2 * 2; x < 480; x += 4) if (rnd() < 0.85) { R(g, x, y + 1, 2, 2, dark ? shade(CROWD_C[Math.floor(rnd() * 8)], -60) : CROWD_C[Math.floor(rnd() * 8)]); R(g, x, y, 2, 1, dark ? '#3a2a2a' : '#c98d62') }
  }
}
/** Paints over the sky and town for indoor halls, grandstands and the arena. Runs before the ground. */
export function gradeBack(g, LC0) {
  const G = grade(), rnd = mulberry(23);
  if (G.indoor) {
    R(g, 0, 0, 480, 64, '#2a2430'); for (let y = 0; y < 64; y += 6) R(g, 0, y, 480, 1, '#231e29');
    for (let x = 0; x < 480; x += 60) { R(g, x, 0, 4, 64, '#3a3340'); L(g, x, 10, x + 60, 0, '#3a3340') }
    for (const x of [60, 180, 300, 420]) { R(g, x - 16, 8, 32, 3, '#17131c'); R(g, x - 15, 9, 30, 1, '#f4fbff'); g.fillStyle = 'rgba(230,245,255,0.06)'; g.fillRect(x - 40, 11, 80, 53) }
    R(g, 0, 34, 480, 30, '#6a4a3e'); for (let y = 34; y < 64; y += 4) for (let x = (y / 4) % 2 * 6; x < 480; x += 12) R(g, x, y, 1, 4, '#5a3e34');
    R(g, 34, 40, 50, 12, '#17131c'); txt(g, 'NO SMOKING', 37, 44, '#e86a6a');
    return;
  }
  if (G.arena) {
    R(g, 0, 0, 480, 64, '#0c0a12'); stands(g, 4, rnd, true);
    for (const x of [90, 240, 390]) { g.fillStyle = 'rgba(255,240,200,0.05)'; g.beginPath(); g.moveTo(x - 6, 0); g.lineTo(x + 6, 0); g.lineTo(x + 70, 64); g.lineTo(x - 70, 64); g.fill() }
  } else if (G.stand) stands(g, G.stand === 1 ? 40 : G.stand === 2 ? 34 : 18, rnd, false);
  if (G.stand) { // the event board on top
    const lab = G.label, sub = LC0.city, w = Math.max(txtW(lab, 2), txtW(sub)) + 16, x = 240 - w / 2, y = G.stand >= 3 ? 2 : 8;
    R(g, x - 2, y - 2, w + 4, 24, '#17131c'); R(g, x, y, w, 20, G.boards === 'led' ? '#101828' : '#2b2540');
    txt(g, lab, 240 - txtW(lab, 2) / 2, y + 3, G.arena ? '#f2c14e' : '#f4ead2', 2); txt(g, sub, 240 - txtW(sub) / 2, y + 14, '#ff8a5c');
  }
}

/** Big events: an arena floor instead of the town plaza, with an LED strip along the stands. */
export function gradeGround(g) {
  const G = grade(); if (!G.floor) return false;
  const rnd = mulberry(17);
  R(g, 0, 60, 480, 210, G.floor); for (let k = 0; k < 900; k++) R(g, rnd() * 480, 66 + rnd() * 204, 1, 1, shade(G.floor, rnd() < 0.5 ? 8 : -8));
  if (G.stand) { R(g, 0, 58, 480, 8, '#0c0a12'); for (let x = 0; x < 480; x += 48) { R(g, x + 2, 59, 44, 6, ['#101828', '#1a0f2a'][x / 48 % 2]); txt(g, ['PIXEL', 'PADEL', 'SMASH', 'TOUR'][x / 48 % 4], x + 8, 60, ['#6fe8ff', '#ff6ad5', '#f2c14e', '#9be37a'][x / 48 % 4]) } }
  if (G.arena) WQ(g, [[-8, -12, 0], [8, -12, 0], [8, 12, 0], [-8, 12, 0]], 'rgba(255,240,200,0.05)');
  return true;
}
/** Court floor wear: cracks on street courts, faded turf at the club. */
export function gradeFloor(g) {
  const G = grade(), rnd = mulberry(31);
  if (G.cracks) for (let c = 0; c < 10; c++) { let x = (rnd() - 0.5) * 9, y = (rnd() - 0.5) * 19; for (let s = 0; s < 5; s++) { const nx = x + (rnd() - 0.5) * 0.9, ny = y + (rnd() - 0.5) * 0.9; WL(g, [x, y, 0], [nx, ny, 0], 'rgba(20,18,26,0.45)'); x = nx; y = ny } }
  if (G.worn) for (const y of [-8.6, 8.6]) for (let k = 0; k < 3; k++) { const x = -2 + k * 2; WQ(g, [[x - 0.8, y - 0.8, 0], [x + 0.8, y - 0.8, 0], [x + 0.8, y + 0.8, 0], [x - 0.8, y + 0.8, 0]], 'rgba(230,220,180,0.10)') }
  if (G.stand) WQ(g, [[-5.5, -10.5, 0], [5.5, -10.5, 0], [5.5, -10, 0], [-5.5, -10, 0]], 'rgba(255,255,255,0.05)');
}

/** The back wall: graffiti and dirt low down, sponsor boards at the big events. */
export function gradeWall(g) {
  const G = grade(), rnd = mulberry(41);
  if (G.dirty) for (let k = 0; k < 14; k++) { const x = -4.6 + rnd() * 9.2, z = 0.5 + rnd() * 2.2, p = P(x, 10, z); R(g, p.x, p.y, 2 + rnd() * 5, 1 + rnd() * 2, 'rgba(90,70,50,0.25)') }
  if (G.graffiti) { const p = P(-3.6, 10, 1.6), q = P(2.2, 10, 1.1); txt(g, 'PADEL', p.x, p.y, 'rgba(232,106,213,0.8)'); txt(g, 'KING?', q.x, q.y, 'rgba(111,232,255,0.8)'); L(g, q.x, q.y + 7, q.x + 22, q.y + 5, 'rgba(242,193,78,0.8)') }
  if (G.boards) {
    const names = ['PIXEL', 'SMASH', 'VIBORA', 'GLASS', 'BANDEJA'], led = G.boards === 'led';
    for (let k = 0; k < 5; k++) {
      const a = -5 + k * 2; WQ(g, [[a, 10, 0], [a + 2, 10, 0], [a + 2, 10, 0.45], [a, 10, 0.45]], led ? ['#101828', '#1a0f2a'][k % 2] : '#f4ead2');
      const p = P(a + 1, 10, 0.32), w = txtW(names[k]); txt(g, names[k], p.x - w / 2, p.y, led ? ['#6fe8ff', '#ff6ad5', '#f2c14e', '#9be37a', '#ff8a5c'][k] : ['#e4572e', '#2b2540', '#3fa7a8', '#2b2540', '#c4313e'][k]);
    }
  }
}

/* ---------------- props ---------------- */
function umpire(o) { o.r(-0.3, 0, 0.08, 1.6, '#2f2d38'); o.r(0.22, 0, 0.08, 1.6, '#2f2d38'); o.r(-0.35, 1.5, 0.7, 0.12, '#8a5a3c'); o.r(-0.2, 1.62, 0.4, 0.6, '#1f2a44'); o.c(0, 2.4, 0.18, '#e8b48a'); o.r(-0.2, 2.5, 0.4, 0.08, '#f4ead2') }
function camera(o) { o.r(-0.4, 0, 0.06, 1.1, '#2f2d38'); o.r(0.34, 0, 0.06, 1.1, '#2f2d38'); o.r(-0.05, 0, 0.06, 1.1, '#2f2d38'); o.r(-0.45, 1.1, 0.9, 0.5, '#17131c'); o.r(-0.75, 1.2, 0.32, 0.3, '#3a3a44'); o.dot(0.3, 1.5, '#e4572e'); o.c(0.3, 2.0, 0.16, '#c98d62'); o.r(0.15, 1.6, 0.3, 0.35, '#3b5b8c') }
function kid(o) { o.r(-0.12, 0, 0.24, 0.35, '#2d2a3a'); o.r(-0.15, 0.35, 0.3, 0.4, '#3fa7a8'); o.c(0, 0.9, 0.13, '#e8b48a'); o.r(-0.13, 0.98, 0.26, 0.06, '#2b1d14') }
function whiteboard(o) { o.r(-0.6, 0, 0.06, 1.2, '#2f2d38'); o.r(0.54, 0, 0.06, 1.2, '#2f2d38'); o.r(-0.7, 1.0, 1.4, 0.9, '#f4f4f0'); for (let k = 0; k < 4; k++) o.r(-0.55, 1.15 + k * 0.18, 0.4, 0.04, '#3b5b8c'); o.r(-0.1, 1.25, 0.3, 0.04, '#e4572e'); o.r(-0.1, 1.6, 0.3, 0.04, '#e4572e'); o.r(0.25, 1.4, 0.3, 0.04, '#e4572e') }
function flood(g, x, y) { WL(g, [x, y, 0], [x, y, 9], '#2f2d38', 2); const p = P(x, y, 9); R(g, p.x - 6, p.y - 5, 13, 6, '#17131c'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) R(g, p.x - 5 + i * 4, p.y - 4 + j * 3, 3, 2, '#fff8d8') }
/** Grade props near the court (drawn after the venue props). */
export function gradeProps(g) {
  const G = grade();
  const list = [];
  if (G.umpire) list.push({ x: -6.4, y: 0.4, f: umpire });
  if (G.camera) list.push({ x: 7.4, y: 11.2, f: camera }, { x: 7.9, y: -2.6, f: camera });
  if (G.kids) list.push({ x: -5.5, y: 10.4, f: kid }, { x: 5.5, y: 10.4, f: kid });
  if (G.whiteboard) list.push({ x: -10.4, y: 9.4, f: whiteboard });
  list.sort((a, b) => b.y - a.y); for (const p of list) p.f(obj(g, p.x, p.y));
  if (G.flood) for (const x of [-7.5, 7.5]) flood(g, x, 11.5);
}
/** Front corners for the near side: ball kids and floodlights. */
export function gradeFront(g) {
  const G = grade();
  if (G.kids) for (const x of [-5.6, 5.6]) kid(obj(g, x, -10.6));
}
/** Per frame: camera flashes in the arena, phones held up indoors. */
export function gradeFrame(ctx) {
  const G = grade();
  if (G.flashes) for (let k = 0; k < 3; k++) if (Math.random() < 0.25) { const x = Math.random() * 480, y = 6 + Math.random() * 54; R(ctx, x, y, 2, 2, '#ffffff'); R(ctx, x - 1, y + 0.5, 4, 1, 'rgba(255,255,255,0.5)') }
}
