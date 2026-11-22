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
import { LOCS, TOWNS } from '../content/venues.js';
import { GRADES } from './grades.js';

const W = 480, H = 270, GROUND = 228, SC = 2;
let cur = null;
// dev only: ?cinefast runs cutscenes 30x (headless screenshots get very few frames)
const DEV_SPEED = import.meta.env?.DEV && typeof location !== 'undefined' && location.search.includes('cinefast') ? 30 : 1;

/* ---------------- backdrops ---------------- */
const BG = {

  /** Side view of a career venue at its grade: town or stands behind, back glass, the court floor. */
  venue(w, sc) {
    const rnd = mulberry(13), L0 = LOCS[sc.loc] || LOCS.sunset, T = TOWNS[sc.loc] || TOWNS.sunset, G = GRADES[sc.grade] || GRADES[0];
    const sky = newCanvas(W, H), far = newCanvas(w, H), near = newCanvas(w, H);
    { const g = sky[1], B = G.arena ? ['#07060b', '#0c0a12', '#100d18', '#151120', '#1a1528', '#1f1930', '#241d38', '#29213f'] : L0.sky;
      B.forEach((c, i) => R(g, 0, i * 22, W, 23, c));
      if (L0.night && !G.arena) for (let k = 0; k < 30; k++) R(g, rnd() * W, rnd() * 60, 1, 1, '#fff8e0') }
    { const g = far[1];
      if (G.indoor) { R(g, 0, 0, w, 210, '#6a4a3e'); for (let y = 0; y < 210; y += 6) for (let x = (y / 6) % 2 * 8; x < w; x += 16) R(g, x, y, 1, 6, '#5a3e34'); R(g, 0, 0, w, 40, '#2a2430'); for (const x of [80, 240, 400]) { R(g, x - 20, 36, 40, 3, '#f4fbff'); g.fillStyle = 'rgba(230,245,255,0.07)'; g.fillRect(x - 50, 39, 100, 170) } }
      else if (G.stand) {
        const top = G.arena ? 20 : G.stand >= 3 ? 50 : G.stand === 2 ? 80 : 105;
        for (let y = top; y < 170; y += 7) { R(g, 0, y, w, 7, G.arena ? '#1a1622' : '#4a4458'); for (let x = (y / 7) % 2 * 3; x < w; x += 6) if (rnd() < 0.85) { const c = ['#e4572e', '#f4ead2', '#3fa7a8', '#f2c14e', '#8e6cc1', '#6fae5f', '#d98ca0'][Math.floor(rnd() * 7)]; R(g, x, y + 2, 3, 4, G.arena ? shade(c, -60) : c); R(g, x, y, 3, 2, G.arena ? '#3a2a2a' : '#c98d62') } }
        if (G.label) { const lw = txtW(G.label, 2) + 16; R(g, w / 2 - lw / 2, top - 22, lw, 18, '#17131c'); txt(g, G.label, w / 2 - lw / 2 + 8, top - 18, G.arena ? '#f2c14e' : '#f4ead2', 2) }
      } else {
        let x = -4, i = 0; while (x < w) { const bw = 30 + Math.floor(rnd() * 30), bh = 60 + Math.floor(rnd() * 60), p = T.pals[i++ % T.pals.length];
          R(g, x, 175 - bh, bw, bh, p.wall); R(g, x, 175 - bh, bw, 3, p.trim);
          for (let yy = 175 - bh + 8; yy < 165; yy += 12) for (let xx = x + 5; xx < x + bw - 6; xx += 10) R(g, xx, yy, 5, 6, L0.night ? '#f2c14e' : '#3a4a6a');
          x += bw + 2 }
        R(g, 0, 165, w, 12, '#3f6b45'); for (let k = 0; k < w; k += 3) R(g, k, 162 + rnd() * 3, 3, 4, '#4e7f50');
      }
      if (G.boards) for (let x = 0; x < w; x += 60) { R(g, x + 1, 170, 58, 12, G.boards === 'led' ? '#101828' : '#f4ead2'); txt(g, ['PIXEL', 'PADEL', 'SMASH', 'TOUR'][x / 60 % 4], x + 12, 173, G.boards === 'led' ? ['#6fe8ff', '#ff6ad5', '#f2c14e', '#9be37a'][x / 60 % 4] : '#e4572e') }
    }
    { const g = near[1];
      // ground around the court
      R(g, 0, 205, w, 65, G.floor || '#8f8577'); for (let k = 0; k < w * 2; k++) R(g, rnd() * w, 206 + rnd() * 64, 1, 1, shade(G.floor || '#8f8577', rnd() < 0.5 ? 8 : -8));
      // back glass (fence on street courts)
      const top = G.cracks ? 110 : 140;
      if (G.cracks) { for (let y = top; y < 205; y += 6) for (let x = 0; x < w; x += 6) { L(g, x, y, x + 6, y + 6, 'rgba(93,102,112,0.7)'); L(g, x + 6, y, x, y + 6, 'rgba(93,102,112,0.7)') } }
      else { g.fillStyle = G.dirty ? 'rgba(200,190,160,0.22)' : 'rgba(190,225,235,0.22)'; g.fillRect(0, top, w, 65); for (let k = 0; k < w; k += 40) L(g, k + 6, top + 8, k + 18, top + 40, 'rgba(255,255,255,0.25)');
        if (!G.pano) for (let y = top - 22; y < top; y += 4) R(g, 0, y, w, 1, 'rgba(40,36,52,0.6)') }
      for (let x = 0; x <= w; x += G.pano ? w : 80) R(g, x, top - (G.pano ? 0 : 22), 3, 205 - top + (G.pano ? 0 : 22), '#2f2d38');
      if (G.graffiti) { txt(g, 'PADEL', 60, 150, '#e86ad5', 2); txt(g, 'KING?', 300, 160, '#6fe8ff', 2) }
      // court floor
      R(g, 0, 205, w, 30, L0.court); for (let k = 0; k < w * 2; k++) R(g, rnd() * w, 206 + rnd() * 28, 1, 1, shade(L0.court, rnd() < 0.5 ? 9 : -9)); R(g, 0, 205, w, 1, shade(L0.court, 25));
      if (G.cracks) for (let c = 0; c < 8; c++) { let x = rnd() * w, y = 207; for (let s = 0; s < 5; s++) { const nx = x + (rnd() - 0.5) * 8; L(g, x, y, nx, y + 4, '#2a2630'); x = nx; y += 4 } }
      // net at the right edge, umpire chair and tv camera at the big events
      const nx = w - 50; R(g, nx, 180, 3, 45, '#2f2d38'); for (let y = 186; y < 222; y += 4) R(g, nx, y, 3, 1, '#e8eef5');
      if (G.umpire) { R(g, nx + 16, 150, 3, 75, '#2f2d38'); R(g, nx + 30, 150, 3, 75, '#2f2d38'); R(g, nx + 12, 146, 24, 5, '#8a5a3c'); R(g, nx + 16, 126, 16, 20, '#1f2a44'); circ(g, nx + 24, 120, 6, '#e8b48a') }
      if (G.camera) { R(g, 14, 170, 3, 55, '#2f2d38'); R(g, 6, 160, 28, 14, '#17131c'); R(g, 32, 163, 10, 8, '#3a3a44'); R(g, 10, 163, 2, 2, '#e4572e') }
    }
    return { sky: sky[0], far: far[0], near: near[0] };
  },
  /** On the road: the van drives past pines (drawn per frame in DYN.road). */
  road(w) {
    const sky = newCanvas(W, H), e = newCanvas(w, H)[0];
    { const g = sky[1]; ['#f2b46a', '#f4c98a', '#f6dcae', '#cfe0e6', '#a9c9dc', '#8fb6d2', '#7aa6c8', '#6d9bbf'].reverse().forEach((c, i) => R(g, 0, i * 22, W, 23, c)); circ(g, 90, 150, 18, '#fff1c1') }
    return { sky: sky[0], far: e, near: e };
  },
  /** A plane cabin: windows with clouds (DYN.plane), seats in front of the passengers. */
  plane(w) {
    const sky = newCanvas(W, H), near = newCanvas(w, H), e = newCanvas(w, H)[0];
    { const g = sky[1]; R(g, 0, 0, W, H, '#7aa6d8') }
    { const g = near[1]; R(g, 0, 0, w, 270, '#d8d4cc'); R(g, 0, 0, w, 30, '#c4bfb6'); R(g, 0, 236, w, 34, '#5a5566');
      for (let x = 30; x < w; x += 110) { g.clearRect(x, 70, 44, 60); R(g, x - 3, 67, 50, 3, '#a8a398'); R(g, x - 3, 130, 50, 3, '#a8a398') }
      for (let x = 10; x < w; x += 22) R(g, x, 12, 12, 6, '#f4f0e6') }
    return { sky: sky[0], far: e, near: near[0] };
  },
  /** A hotel room at night: city lights in the window, a bed, a lamp. */
  room(w) {
    const rnd = mulberry(5), sky = newCanvas(W, H), near = newCanvas(w, H), e = newCanvas(w, H)[0];
    { const g = sky[1]; R(g, 0, 0, W, H, '#1d2147'); for (let x = 0; x < W; x += 14) { const h = 40 + rnd() * 80; R(g, x, 180 - h, 12, h, '#2b2a4a'); for (let k = 0; k < 6; k++) R(g, x + 2 + rnd() * 8, 182 - h + rnd() * h, 2, 2, '#f2c14e') } }
    { const g = near[1]; R(g, 0, 0, w, 270, '#5d4a5e'); for (let x = 0; x < w; x += 8) R(g, x, 0, 1, 230, '#544255');
      g.clearRect(300, 50, 140, 110); R(g, 296, 46, 148, 4, '#3a2e3c'); R(g, 296, 160, 148, 4, '#3a2e3c'); R(g, 368, 50, 4, 110, '#3a2e3c');
      R(g, 0, 230, w, 40, '#3a3040'); R(g, 20, 190, 120, 40, '#e8e0d0'); R(g, 20, 180, 30, 14, '#f4f0e6'); R(g, 20, 222, 120, 8, '#8a5a3c');
      R(g, 170, 200, 24, 30, '#8a5a3c'); R(g, 178, 176, 8, 24, '#2f2d38'); R(g, 170, 168, 24, 10, '#f2c14e') }
    return { sky: sky[0], far: e, near: near[0] };
  },
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

  venue(g, cam, t, sc) {
    const G = GRADES[sc.grade] || GRADES[0];
    if (G.arena) { for (const x of [100, 380]) { g.fillStyle = 'rgba(255,240,200,0.06)'; g.beginPath(); g.moveTo(x - 6, 0); g.lineTo(x + 6, 0); g.lineTo(x + 90, 236); g.lineTo(x - 90, 236); g.fill() }
      for (let k = 0; k < 3; k++) if (Math.random() < 0.3) R(g, Math.random() * W, 20 + Math.random() * 140, 2, 2, '#ffffff') }
  },
  road(g, cam, t) {
    const hill = (sp, y, c, step, hh) => { const off = (t * sp) % step; for (let x = -step; x < W + step; x += step) { const X = x - off; g.fillStyle = c; g.beginPath(); g.moveTo(X, y); g.lineTo(X + step / 2, y - hh); g.lineTo(X + step, y); g.fill() } };
    hill(8, 170, '#8fa6b8', 120, 40);
    const pine = (sp, y, s, c) => { const off = (t * sp) % 34; for (let x = -34; x < W + 34; x += 34) { const X = x - off + (Math.floor((x + t * sp) / 34) % 3) * 4; R(g, X + 7 * s, y - 6 * s, 2 * s, 6 * s, '#4a3a2a'); for (let k = 0; k < 4; k++) R(g, X + 2 * s + k * 1.5 * s, y - (10 + k * 5) * s, (12 - k * 3) * s, 5 * s, c) } };
    pine(40, 196, 1, '#2d4f35'); R(g, 0, 196, W, 74, '#4a6a45'); R(g, 0, 210, W, 26, '#4a4652');
    const dash = (t * 260) % 40; for (let x = -40; x < W; x += 40) R(g, x - dash, 222, 20, 2, '#f4ead2');
    const b = Math.floor(t * 6) % 2, vx = 190, vy = 176 + b;
    R(g, vx, vy, 96, 36, '#e8e0d0'); R(g, vx, vy, 96, 4, '#c9bba6'); R(g, vx + 70, vy + 6, 22, 14, '#7aa6c8'); R(g, vx + 8, vy + 6, 52, 12, '#7aa6c8'); R(g, vx, vy + 22, 96, 3, '#e4572e');
    txt(g, 'RAY', vx + 12, vy + 26, '#2b2540');
    for (const wx of [vx + 18, vx + 76]) { circ(g, wx, 214, 8, '#1c1a22'); circ(g, wx, 214, 3, '#9a948c') }
    pine(140, 268, 2, '#1f3a26');
  },
  plane(g, cam, t) {
    for (let x = 30; x < 480; x += 110) { g.save(); g.beginPath(); g.rect(x, 70, 44, 60); g.clip(); R(g, x, 70, 44, 60, '#8fbfe8'); for (let k = 0; k < 3; k++) { const cx = x + ((k * 30 - t * 30) % 70 + 70) % 70 - 10; R(g, cx, 85 + k * 14, 26, 6, '#ffffff') } g.restore() }
  },
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


/** Drawn in front of the actors (seat backs in the plane). */
const FRONTS = {
  plane(g) { for (const x of [150, 250, 350]) { R(g, x - 30, 196, 60, 50, '#3b5b8c'); R(g, x - 30, 196, 60, 4, '#4d70a6') } },
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
    const menu = document.getElementById('menu'), menuWas = menu ? menu.hidden : true; if (menu) menu.hidden = true; // nothing shows through a cutscene
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const actors = {};
    for (const a of scene.actors) actors[a.id] = { x: a.x, dir: a.dir || 1, look: a.look, pose: 'idle', walk: 0, bub: null, say: null, talk: false };
    const sc = { ...scene, cam: scene.cam || 0, props: {}, ball: null };
    const bg = BG[scene.bg](scene.w, scene);
    const box = document.createElement('div'); box.id = 'cineBox'; box.hidden = true; stage.append(box);
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
      else if (st.line !== undefined) { s.len = 1e9; s.shown = 0; box.hidden = false; box.className = st.who ? '' : 'note'; box.innerHTML = (st.who ? `<span class="px">${st.name}${st.remote ? ' · ' + st.remote : ''}</span>` : '') + '<p></p><i>▼</i>'; if (st.who && actors[st.who]) actors[st.who].talk = true }
      else if (st.wait !== undefined) s.len = st.wait;
      return s;
    };
    const tick = (s, done) => {
      const st = s.st, k = s.len > 0 ? Math.min(1, (t - s.t0) / s.len) : 1, e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      if (st.all) { const left = s.kids.filter(c => !tick(c, done)); s.kids = left; return !left.length }
      if (st.cam !== undefined) sc.cam = s.from + (st.cam - s.from) * e;
      if (st.move) { const a = actors[st.move]; a.x = s.from + (st.to - s.from) * k; a.walk = k < 1 ? t : 0 }
      if (st.emote && k >= 1) actors[st.emote].bub = null;
      if (st.line !== undefined) { s.shown = Math.max(s.shown, Math.min(st.text.length, (t - s.t0) * 45)); box.querySelector('p').textContent = st.text.slice(0, Math.floor(s.shown)); box.classList.toggle('done', s.shown >= st.text.length); if (s.next) { if (st.who && actors[st.who]) actors[st.who].talk = false; box.hidden = true; return true } return false }
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
    const finish = () => { cancelAnimationFrame(raf); removeEventListener('keydown', key, true); cv.remove(); skip.remove(); box.remove(); if (menu) menu.hidden = menuWas; cur = null; done() };
    /** Tap: finish typing the line, or go to the next one; elsewhere speed up the current step. */
    const tap = () => { const ln = running.find(s => s.st.line !== undefined); if (!ln) { fast = true; return } if (ln.shown < ln.st.text.length) ln.shown = ln.st.text.length; else ln.next = true };
    const key = e => { if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); finish() } else if (['Space', 'Enter'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) tap() } };
    addEventListener('keydown', key, true);
    cv.onpointerdown = tap; box.onpointerdown = tap;
    skip.onclick = finish;
    cur = { finish };
    const draw = () => {
      g.fillStyle = '#17131c'; g.fillRect(0, 0, W, H);
      g.drawImage(bg.sky, 0, 0);
      g.drawImage(bg.far, -Math.round(sc.cam * 0.4), 0);
      g.drawImage(bg.near, -Math.round(sc.cam), 0);
      DYN[scene.bg]?.(g, Math.round(sc.cam), t, sc);
      const list = Object.values(actors).sort((a, b) => a.x - b.x);
      for (const a of list) {
        const x = Math.round(a.x - sc.cam), leg = a.walk ? (Math.floor(t * 8) % 2) + 1 : 0;
        const spr = getSprite(a.look, 'front', a.pose, leg);
        g.save(); g.translate(x, 0); if (a.dir < 0) g.scale(-1, 1);
        g.drawImage(spr, -12 * SC, GROUND - 30 * SC + 4 - (a.talk && Math.floor(t * 6) % 2 ? 2 : 0), 24 * SC, 30 * SC); g.restore();
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 14, GROUND + 3, 28, 3);
      }
      FRONTS[scene.bg]?.(g);
      if (sc.ball) { circ(g, sc.ball.x - sc.cam, sc.ball.y, 2.5, '#e2ef3c'); R(g, sc.ball.x - sc.cam - 1, sc.ball.y - 1, 1, 1, '#ffffff') }
      for (const a of list) { const x = Math.round(a.x - sc.cam), top = GROUND - 30 * SC + 2;
        if (a.bub) bubble(g, x, top, a.bub);
        if (a.say) speech(g, x, top - (a.bub ? 16 : 0), a.say.text, a.say.n) }
      const card = running.find(s => s.st.card);
      if (card) { const ct = String(card.st.text ?? card.st.card), w = txtW(ct, 2) + 16; R(g, 8, 8, w, 20, '#17131c'); R(g, 8, 26, w, 2, '#e4572e'); txt(g, ct, 16, 12, '#f4ead2', 2) }
      // letterbox bars
      R(g, 0, 0, W, 6, '#0c0a10'); R(g, 0, H - 14, W, 14, '#0c0a10');
    };
    const frame = now => {
      let dt = Math.min(0.05, (now - last) / 1000); last = now; if (fast) dt *= 6; dt *= DEV_SPEED;
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
