// Cinematic scene player: short silent pixel vignettes told with movement, emote bubbles,
// tiny speech lines and camera pans, drawn on their own canvas over the stage.
// A scene is { bg, w, cam, actors, steps }. Steps run in order; { all: [...] } runs steps together.
//   { wait }                     pause (seconds)
//   { cam, t }                   pan the camera to world x (left edge)
//   { move, to, t }              walk an actor to world x
//   { face, dir }                turn an actor (1 right, -1 left)
//   { emote, e, t }              bubble over an actor: ! ? ♥ 💢 …
//   { say, text, t }             short speech line over an actor
//   { pose, p }                  idle | back (racket up) | fwd
//   { rally: [a, b], n, t }      the ball goes back and forth between two actors n times
//   { toss: [a, b], t }          one soft lob from a to b
//   { prop, on }                 show / hide a scene prop (e.g. the flyer)
//   { card, text, t }            a title card in the corner
// Tap, click, Space or Enter speeds through the current step; SKIP ends the scene.
import { R, L, circ, newCanvas, txt, txtW, shade, mulberry } from '../core/gfx.js';
import { getSprite } from './sprites.js';

const W = 480, H = 270, GROUND = 228, SC = 2;
let cur = null;

/* ---------------- backdrops ---------------- */
const BG = {
  /** Sunset Park at dusk: a cracked public court behind a chain-link fence. */
  park(w) {
    const rnd = mulberry(7);
    const sky = newCanvas(W, H), far = newCanvas(w, H), near = newCanvas(w, H);
    { const g = sky[1], B = ['#2b2540', '#3d2f55', '#5d3f68', '#8a4f6e', '#c4646a', '#e8875e', '#f2b46a'];
      B.forEach((c, i) => R(g, 0, i * 22, W, 22, c));
      for (let i = 1; i < B.length; i++) for (let x = 0; x < W; x += 2) R(g, x + (i % 2), i * 22 - 1, 1, 1, B[i - 1]);
      circ(g, 360, 150, 16, '#f7d27a'); circ(g, 360, 150, 12, '#fff1c1');
      for (let k = 0; k < 30; k++) R(g, rnd() * W, rnd() * 50, 1, 1, '#f4ead2') }
    { const g = far[1]; let x = 0;
      while (x < w) { const bw = 14 + rnd() * 26, bh = 30 + rnd() * 60; R(g, x, 190 - bh, bw, bh + 40, '#3a2d4a');
        for (let k = 0; k < bw * bh / 60; k++) if (rnd() < 0.35) R(g, x + 2 + rnd() * (bw - 4), 194 - bh + rnd() * (bh - 6), 2, 2, rnd() < 0.7 ? '#f2c14e' : '#6d5a7a');
        x += bw + 1 }
      for (let x = 0; x < w; x += 18) { const h = 22 + rnd() * 14; circ(g, x + 9, 196 - h, 14, '#2d3b3a'); circ(g, x + 4, 200 - h, 10, '#34463f') } }
    { const g = near[1];
      // grass and path
      R(g, 0, 196, w, 74, '#3e5b3c'); for (let k = 0; k < w * 3; k++) R(g, rnd() * w, 196 + rnd() * 74, 1, 1, rnd() < 0.5 ? '#4a6a45' : '#334d33');
      R(g, 0, GROUND - 4, w, 30, '#8f8577'); for (let k = 0; k < w; k++) R(g, rnd() * w, GROUND - 4 + rnd() * 30, 1, 1, rnd() < 0.5 ? '#a09584' : '#7a7066');
      // kiosk, shutter down
      const kx = 70; R(g, kx, 140, 80, 84, '#6f9c94'); R(g, kx - 4, 132, 88, 10, '#c4613a'); for (let i = 0; i < 88; i += 8) R(g, kx - 4 + i, 142, 4, 4, '#e4572e');
      R(g, kx + 10, 160, 60, 50, '#7d7782'); for (let y = 162; y < 210; y += 4) R(g, kx + 10, y, 60, 1, '#5d5866');
      R(g, kx + 22, 148, 36, 9, '#17131c'); txt(g, 'KIOSK', kx + 24, 150, '#f4ead2');
      R(g, kx + 50, 176, 18, 8, '#f4ead2'); txt(g, 'SHUT', kx + 52, 178, '#c4313e');
      // bench
      const bx = 205; R(g, bx, 206, 44, 4, '#8a5a3c'); R(g, bx, 196, 44, 4, '#8a5a3c'); R(g, bx + 3, 210, 3, 14, '#2f2d38'); R(g, bx + 38, 210, 3, 14, '#2f2d38');
      // concrete wall with graffiti on the left of the court
      const wx = 268; R(g, wx, 150, 40, 76, '#9a948c'); for (let y = 150; y < 226; y += 8) R(g, wx, y, 40, 1, '#8a847c');
      txt(g, 'PADEL', wx + 2, 160, '#e86ad5'); txt(g, 'OR', wx + 4, 168, '#6fe8ff'); txt(g, 'DIE', wx + 14, 176, '#f2c14e', 2);
      L(g, wx + 4, 200, wx + 30, 196, '#3fa7a8', 2); circ(g, wx + 22, 210, 5, '#e4572e'); circ(g, wx + 22, 210, 3, '#9a948c');
      // court floor: cracked concrete with faded lines
      const cx0 = 308, cx1 = w - 20;
      R(g, cx0, GROUND - 6, cx1 - cx0, 12, '#6f8a8c'); R(g, cx0, GROUND - 6, cx1 - cx0, 1, '#86a0a2');
      for (let k = 0; k < (cx1 - cx0) * 2; k++) R(g, cx0 + rnd() * (cx1 - cx0), GROUND - 5 + rnd() * 10, 1, 1, rnd() < 0.5 ? '#7d9799' : '#627b7d');
      for (let c = 0; c < 9; c++) { let x = cx0 + 10 + rnd() * (cx1 - cx0 - 20), y = GROUND - 5; for (let s = 0; s < 6; s++) { const nx = x + (rnd() - 0.5) * 8, ny = y + 2; L(g, x, y, nx, ny, '#3d4a4c'); x = nx; y = ny } }
      for (const lx of [cx0 + 40, (cx0 + cx1) / 2 - 90, (cx0 + cx1) / 2 + 90, cx1 - 40]) for (let y = GROUND - 5; y < GROUND + 6; y += 2) if (rnd() < 0.7) R(g, lx, y, 2, 1, '#c8d4d4');
      // chain-link fence behind the court
      const fy0 = 112, fy1 = GROUND - 6;
      for (let x = cx0; x < cx1; x += 6) { L(g, x, fy0, x + 6, fy0 + 6, '#5d6670'); }
      for (let y = fy0; y < fy1; y += 6) for (let x = cx0; x < cx1; x += 6) { L(g, x, y, x + 6, y + 6, 'rgba(93,102,112,0.8)'); L(g, x + 6, y, x, y + 6, 'rgba(93,102,112,0.8)') }
      R(g, cx0, fy0 - 2, cx1 - cx0, 2, '#3a4048');
      for (let x = cx0; x <= cx1; x += 60) R(g, x, fy0 - 2, 3, fy1 - fy0 + 4, '#3a4048');
      // a torn bit of fence
      R(g, cx0 + 128, 150, 14, 12, 'rgba(0,0,0,0)'); for (let k = 0; k < 6; k++) L(g, cx0 + 130 + k * 2, 150, cx0 + 128 + k * 2, 160 + (k % 3), '#3a4048');
      // net (side on)
      const nx = (cx0 + cx1) / 2; R(g, nx - 1, GROUND - 34, 3, 34, '#2f2d38'); for (let y = GROUND - 32; y < GROUND - 6; y += 3) R(g, nx - 1, y, 3, 1, '#e8eef5'); R(g, nx - 2, GROUND - 35, 5, 2, '#f4ead2');
      // ball basket and old bag
      R(g, cx1 - 30, GROUND - 14, 14, 10, '#3a3a44'); for (let k = 0; k < 8; k++) R(g, cx1 - 29 + rnd() * 12, GROUND - 16 + rnd() * 3, 2, 2, '#e2ef3c');
    }
    return { sky: sky[0], far: far[0], near: near[0] };
  },
};

/** Things drawn in the world after the backdrop that can flicker or change. */
const DYN = {
  park(g, cam, t, sc) {
    // lamps: the left one flickers
    for (const [lx, flick] of [[316, true], [cur.w - 26, false]]) {
      const x = lx - cam; R(g, x, 70, 3, GROUND - 70, '#2f2d38'); R(g, x - 6, 68, 14, 4, '#2f2d38');
      const on = !flick || (Math.sin(t * 23) + Math.sin(t * 7.3) > -0.6);
      if (on) { R(g, x - 4, 72, 10, 2, '#fff1c1'); g.fillStyle = 'rgba(255,241,193,0.07)'; g.beginPath(); g.moveTo(x - 4, 74); g.lineTo(x + 6, 74); g.lineTo(x + 40, GROUND); g.lineTo(x - 38, GROUND); g.fill() }
      else R(g, x - 4, 72, 10, 2, '#6d6680');
    }
    if (sc.props.flyer) { // a flyer blows against the fence
      const f = sc.props.flyer, k = Math.min(1, (t - f) / 1.6), fx = 300 + k * 160 - cam, fy = 60 + k * 100 + Math.sin(t * 6) * (1 - k) * 8;
      R(g, fx - 1, fy - 1, 34, 24, '#17131c'); R(g, fx, fy, 32, 22, '#f4ead2'); txt(g, 'KING', fx + 2, fy + 2, '#e4572e'); txt(g, 'OF THE', fx + 2, fy + 8, '#2b2540'); txt(g, 'COURT', fx + 2, fy + 14, '#e4572e');
    }
  },
};

/* ---------------- bubbles ---------------- */
const GLYPH = {
  '!': ['..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '...#.', '..#..', '.....', '..#..'],
  '♥': ['##.##', '#####', '#####', '.###.', '..#..'],
  '💢': ['#.#.#', '.#.#.', '#...#', '.#.#.', '#.#.#'],
  '…': ['.....', '.....', '.....', '.....', '#.#.#'],
};
function bubble(g, x, y, e) {
  const col = e === '♥' ? '#e4572e' : e === '💢' ? '#c4313e' : '#17131c';
  R(g, x - 7, y - 16, 15, 13, '#17131c'); R(g, x - 6, y - 15, 13, 11, '#ffffff'); R(g, x - 1, y - 3, 3, 2, '#17131c'); R(g, x, y - 4, 1, 2, '#ffffff');
  (GLYPH[e] || GLYPH['!']).forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') R(g, x - 4 + i * 2 - 1, y - 14 + j * 2, 2, 2, col) }));
}
function speech(g, x, y, text, n) {
  const s = text.slice(0, n), w = txtW(text) + 8;
  const bx = Math.max(4, Math.min(W - w - 4, x - w / 2));
  R(g, bx - 1, y - 14, w + 2, 12, '#17131c'); R(g, bx, y - 13, w, 10, '#f4ead2'); R(g, x - 1, y - 2, 3, 2, '#17131c');
  txt(g, s, bx + 4, y - 11, '#2b2540');
}

/* ---------------- player ---------------- */
/** Plays a scene. Resolves when it ends or is skipped. */
export function playCine(scene) {
  return new Promise(done => {
    if (cur) cur.finish();
    const stage = document.getElementById('stage');
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.id = 'cine';
    const skip = document.createElement('button'); skip.id = 'cineSkip'; skip.className = 'big alt'; skip.textContent = 'SKIP ▸▸';
    stage.append(cv, skip);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const actors = {};
    for (const a of scene.actors) actors[a.id] = { x: a.x, dir: a.dir || 1, look: a.look, pose: 'idle', walk: 0, bub: null, say: null };
    const sc = { ...scene, cam: scene.cam || 0, props: {}, ball: null };
    const bg = BG[scene.bg](scene.w);
    let t = 0, last = performance.now(), queue = [...scene.steps], running = [], fast = false, raf = 0;
    const start = st => {
      const s = { st, t0: t, len: st.t ?? 0.6 };
      if (st.all) { s.kids = st.all.map(start); s.len = 0 }
      else if (st.cam !== undefined) { s.from = sc.cam; s.len = st.t ?? 1.5 }
      else if (st.move) { s.from = actors[st.move].x; s.len = st.t ?? Math.abs(st.to - s.from) / 50; actors[st.move].dir = Math.sign(st.to - s.from) || actors[st.move].dir }
      else if (st.face) actors[st.face].dir = st.dir;
      else if (st.pose) actors[st.pose].pose = st.p;
      else if (st.emote) { actors[st.emote].bub = st.e; s.len = st.t ?? 1.1 }
      else if (st.say) { s.len = st.t ?? Math.max(1.4, st.text.length * 0.09) }
      else if (st.rally) s.len = (st.n || 4) * (st.t ?? 0.7);
      else if (st.toss) s.len = st.t ?? 1;
      else if (st.prop) { sc.props[st.prop] = st.on === false ? 0 : t; s.len = st.t ?? 0 }
      else if (st.card) s.len = st.t ?? 2.2;
      else if (st.wait !== undefined) s.len = st.wait;
      return s;
    };
    const tick = (s, done) => {
      const st = s.st, k = s.len > 0 ? Math.min(1, (t - s.t0) / s.len) : 1, e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      if (st.all) { const left = s.kids.filter(c => !tick(c, done)); s.kids = left; return !left.length }
      if (st.cam !== undefined) sc.cam = s.from + (st.cam - s.from) * e;
      if (st.move) { const a = actors[st.move]; a.x = s.from + (st.to - s.from) * k; a.walk = k < 1 ? t : 0 }
      if (st.emote && k >= 1) actors[st.emote].bub = null;
      if (st.say) actors[st.say].say = k < 1 ? { text: st.text, n: Math.ceil((t - s.t0) * 30) } : null;
      if (st.rally || st.toss) {
        const [A, B] = st.rally || st.toss, n = st.rally ? (st.n || 4) : 1, seg = Math.min(n - 1e-6, k * n), i = Math.floor(seg), u = seg - i;
        const p = i % 2 ? actors[B] : actors[A], q = i % 2 ? actors[A] : actors[B];
        if (k >= 1) sc.ball = null;
        else { const h = st.toss ? 70 : 36; sc.ball = { x: p.x + (q.x - p.x) * u, y: GROUND - 34 - Math.sin(u * Math.PI) * h + (u > 0.8 ? (u - 0.8) * 120 : 0) };
          for (const a of [p, q]) a.pose = 'idle'; if (u < 0.15) p.pose = 'fwd'; if (u > 0.85) q.pose = 'back' }
        if (k >= 1) for (const a of [p, q]) a.pose = 'idle';
      }
      return k >= 1;
    };
    const finish = () => { cancelAnimationFrame(raf); removeEventListener('keydown', key, true); cv.remove(); skip.remove(); cur = null; done() };
    const key = e => { if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); finish() } else if (['Space', 'Enter'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); fast = true } };
    addEventListener('keydown', key, true);
    cv.onpointerdown = () => { fast = true };
    skip.onclick = finish;
    cur = { finish };
    const draw = () => {
      g.drawImage(bg.sky, 0, 0);
      g.drawImage(bg.far, -Math.round(sc.cam * 0.4), 0);
      g.drawImage(bg.near, -Math.round(sc.cam), 0);
      DYN[scene.bg]?.(g, Math.round(sc.cam), t, sc);
      const list = Object.values(actors).sort((a, b) => a.x - b.x);
      for (const a of list) {
        const x = Math.round(a.x - sc.cam), leg = a.walk ? (Math.floor(t * 8) % 2) + 1 : 0;
        const spr = getSprite(a.look, 'front', a.pose, leg);
        g.save(); g.translate(x, 0); if (a.dir < 0) g.scale(-1, 1);
        g.drawImage(spr, -12 * SC, GROUND - 30 * SC + 4, 24 * SC, 30 * SC); g.restore();
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 14, GROUND + 3, 28, 3);
      }
      if (sc.ball) { circ(g, sc.ball.x - sc.cam, sc.ball.y, 2.5, '#e2ef3c'); R(g, sc.ball.x - sc.cam - 1, sc.ball.y - 1, 1, 1, '#ffffff') }
      for (const a of list) { const x = Math.round(a.x - sc.cam), top = GROUND - 30 * SC + 2;
        if (a.bub) bubble(g, x, top, a.bub);
        if (a.say) speech(g, x, top - (a.bub ? 16 : 0), a.say.text, a.say.n) }
      const card = running.find(s => s.st.card);
      if (card) { const w = txtW(card.st.text, 2) + 16; R(g, 8, 8, w, 20, '#17131c'); R(g, 8, 26, w, 2, '#e4572e'); txt(g, card.st.text, 16, 12, '#f4ead2', 2) }
      // letterbox bars
      R(g, 0, 0, W, 6, '#0c0a10'); R(g, 0, H - 14, W, 14, '#0c0a10');
    };
    const frame = now => {
      let dt = Math.min(0.05, (now - last) / 1000); last = now; if (fast) dt *= 6;
      t += dt;
      if (!running.length) { if (!queue.length) return finish(); fast = false; running.push(start(queue.shift())) }
      running = running.filter(s => !tick(s));
      draw(); raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  });
}
export const cinePlaying = () => !!cur;

/* ---------------- scenes ---------------- */
const OLD = [
  { id: 'old1', skin: '#e8b48a', hair: '#e8e8e8', shirt: '#3b5b8c', shorts: '#2d2a3a', band: null, frame: '#8a7f98', skirt: false, tail: false },
  { id: 'old2', skin: '#b97a52', hair: '#9a9aa8', shirt: '#c9826b', shorts: '#4a4452', band: '#f4ead2', frame: '#3fa7a8', skirt: false, tail: false },
  { id: 'old3', skin: '#f0c4a0', hair: '#c9c9c9', shirt: '#6fae5f', shorts: '#2d2a3a', band: null, frame: '#e4572e', skirt: false, tail: false },
];
const TOMI = { id: 'tomiC', skin: '#f0c4a0', hair: '#d8a040', shirt: '#6fd3d2', shorts: '#1f2a44', band: null, frame: '#f2c14e', skirt: false, tail: false };

/** Opening: dusk in the park, three old men playing, one hurts his back, they need a fourth. */
export const parkIntro = you => ({
  bg: 'park', w: 760, cam: 0,
  actors: [{ id: 'you', look: you, x: -30 }, { id: 'a', look: OLD[0], x: 380 }, { id: 'b', look: OLD[1], x: 420 }, { id: 'c', look: OLD[2], x: 640, dir: -1 }],
  steps: [
    { card: 'SUNSET PARK · 19:40', t: 2 },
    { all: [{ move: 'you', to: 150, t: 3 }, { cam: 120, t: 3 }] },
    { all: [{ cam: 280, t: 1.6 }, { move: 'you', to: 260, t: 1.6 }] },
    { rally: ['b', 'c'], n: 5, t: 0.75 },
    { all: [{ pose: 'b', p: 'back' }, { emote: 'b', e: '💢', t: 1.4 }] },
    { say: 'b', text: 'MY BACK...' },
    { move: 'b', to: 230, t: 2.4 },
    { face: 'b', dir: 1 },
    { all: [{ emote: 'a', e: '?' }, { emote: 'c', e: '?' }] },
    { all: [{ face: 'a', dir: -1 }, { emote: 'a', e: '!', t: 0.8 }] },
    { say: 'a', text: 'YOU. NEED A FOURTH.' },
    { emote: 'you', e: '?' },
    { toss: ['a', 'you'], t: 1 },
    { say: 'c', text: 'RETURN THREE. THEN WE TALK.' },
  ],
});

/** After the first rallies: a nod, the King of the Court flyer and Tomi. */
export const parkOutro = you => ({
  bg: 'park', w: 760, cam: 280,
  actors: [{ id: 'you', look: you, x: 420 }, { id: 'a', look: OLD[0], x: 380 }, { id: 'c', look: OLD[2], x: 640, dir: -1 }, { id: 'b', look: OLD[1], x: 230 }, { id: 't', look: TOMI, x: 820, dir: -1 }],
  steps: [
    { all: [{ emote: 'c', e: '…', t: 1.2 }, { emote: 'a', e: '!' }] },
    { say: 'c', text: 'NOT BAD.' },
    { say: 'a', text: 'COME BACK FRIDAY.' },
    { prop: 'flyer', t: 1.8 },
    { emote: 'you', e: '!' },
    { all: [{ move: 't', to: 520, t: 1.4 }, { emote: 't', e: '♥', t: 1.4 }] },
    { face: 'you', dir: 1 },
    { say: 't', text: 'YOU PLAY? I AM TOMI!' },
    { say: 't', text: 'WARM UP WITH ME FIRST.' },
    { wait: 0.5 },
  ],
});
