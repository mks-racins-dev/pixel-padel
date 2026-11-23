// HOW TO PLAY: key chips, one card per shot with a tiny looping side-view animation, and the four rules.
import { S } from '../state.js';
import { settings } from '../game/settings.js';
import { SCHEMES } from '../input/input.js';
import { t } from './i18n.js';
import { txt } from '../core/gfx.js';

const $ = id => document.getElementById(id);
const KN = k => ({ Space: 'SPACE', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT', Enter: 'ENTER', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[k] || k.replace(/^Key|^Digit/, ''));
const keys = a => [...new Set(SCHEMES.solo[a].slice(0, 2).map(KN))].map(k => `<kbd>${k}</kbd>`).join('');

// side view, 96 x 40: ground at y=34, net at x=48, back glass at x=3 and x=93
// a path is a list of hops [x0,y0,x1,y1,arc]; the ball runs through them in order
const SHOTS = [
  { id: 'drive', who: 16, path: [[18, 24, 80, 34, 10], [80, 34, 92, 24, 6], [92, 24, 86, 34, 3]] },
  { id: 'drop', who: 16, path: [[18, 24, 56, 34, 14], [56, 34, 62, 34, 4], [62, 34, 66, 34, 2]] },
  { id: 'lob', who: 16, path: [[18, 22, 84, 34, 34]] },
  { id: 'bandeja', who: 30, high: true, path: [[32, 13, 76, 34, 4], [76, 34, 92, 30, 2], [92, 30, 84, 34, 1]] },
  { id: 'smash', who: 36, high: true, path: [[38, 11, 66, 34, -2], [66, 34, 92, 10, 4], [92, 10, 80, 34, 6]] },
  { id: 'portres', who: 40, high: true, path: [[42, 10, 70, 34, -2], [70, 34, 99, -6, 6]], out: true },
  { id: 'vibora', who: 32, high: true, path: [[34, 13, 82, 34, 2], [82, 34, 92, 26, 2], [92, 26, 88, 34, 1]], fire: true },
  { id: 'glass', who: 14, path: [[70, 22, 22, 34, 8], [22, 34, 3, 26, 4], [3, 26, 14, 24, 2], [14, 24, 78, 34, 9]] },
];
function pos(path, u) {
  const n = path.length, i = Math.min(n - 1, Math.floor(u * n)), s = u * n - i, [x0, y0, x1, y1, h] = path[i];
  return { x: x0 + (x1 - x0) * s, y: y0 + (y1 - y0) * s - h * 4 * s * (1 - s), i, s };
}
function draw(g, sh, time) {
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h) };
  R(0, 0, 96, 40, '#1d2a44'); R(0, 34, 96, 6, '#2f63b0'); R(0, 34, 96, 1, '#5f8fd0');
  R(2, 20, 2, 14, 'rgba(190,225,235,0.5)'); R(92, 20, 2, 14, 'rgba(190,225,235,0.5)'); R(2, 14, 2, 6, '#3a3640'); R(92, 14, 2, 6, '#3a3640');
  R(47, 28, 2, 6, '#e8eef5'); R(46, 28, 4, 1, '#ffffff');
  const cyc = 2.4, u0 = (time % cyc) / cyc, u = Math.min(1, u0 / 0.8), hitting = u0 < 0.12;
  // player: a tiny figure with a racket that swings at the start of each loop
  const px = sh.who, top = sh.high ? 22 : 24;
  R(px - 1, top + 2, 3, 6, '#e4572e'); R(px - 1, top, 3, 2, '#e8b48a'); R(px - 1, top + 8, 1, 4, '#2d2a3a'); R(px + 1, top + 8, 1, 4, '#2d2a3a');
  const rk = hitting ? [px + 3, sh.high ? top - 7 : top + 1] : [px + 3, top + 5]; R(rk[0], rk[1], 3, 3, '#f2c14e'); R(px + 2, rk[1] + 2, 1, 2, '#1d1a24');
  if (u0 < 0.8) {
    for (let k = 1; k <= 6; k++) { const q = pos(sh.path, Math.max(0, u - k * 0.025)); g.fillStyle = sh.fire ? `rgba(255,120,70,${0.5 - k * 0.07})` : `rgba(226,239,60,${0.4 - k * 0.06})`; g.fillRect(Math.round(q.x), Math.round(q.y), 1, 1) }
    const p = pos(sh.path, u); R(p.x - 1, p.y - 1, 3, 3, '#e2ef3c'); R(p.x - 1, p.y - 1, 1, 1, '#fbffb8');
    if (p.s < 0.08 && p.i > 0) { const q = sh.path[p.i]; R(q[0] - 2, q[1] - 1, 1, 1, '#ffffff'); R(q[0] + 2, q[1] - 1, 1, 1, '#ffffff') }
  } else if (sh.out) { R(72, 5, 17, 9, '#17131c'); txt(g, 'OUT!', 74, 7, '#9be37a') }
}

let canvases = [];
export function renderHelp() {
  const box = $('help'); if (!box) return;
  const pvp = settings.mode === 'pvp';
  box.innerHTML = `<div class="hsec px">${t('h_controls')}</div>
    <div class="hkeys">${pvp
      ? `<span><b>P1</b> <kbd>WASD</kbd> <kbd>F</kbd> ${t('hit')} <kbd>G</kbd> ${t('lob')} <kbd>R</kbd> VIBORA</span><span><b>P2</b> <kbd>↑↓←→</kbd> <kbd>K</kbd> ${t('hit')} <kbd>L</kbd> ${t('lob')} <kbd>O</kbd> VIBORA</span>`
      : `<span><kbd>WASD</kbd><kbd>↑↓←→</kbd> ${t('o_move')}</span><span>${keys('drive')} ${t('hit')} <i>${t('h_hold')}</i></span><span>${keys('lob')} ${t('lob')}</span><span>${keys('vib')} VIBORA</span><span><kbd>ESC</kbd> ${t('h_pause')}</span><span class="pad"><kbd>A</kbd>${t('hit')} <kbd>B</kbd>${t('lob')} <kbd>Y</kbd>VIBORA</span>`}</div>
    <div class="hsec px">${t('h_shots')}</div>
    <div class="hcards">${SHOTS.map(s => `<div class="hcard"><canvas width="96" height="40" data-s="${s.id}" aria-hidden="true"></canvas><b class="px">${t('s_' + s.id)}</b><span>${t('s_' + s.id + '_d')}</span></div>`).join('')}</div>
    <div class="hsec px">${t('h_rules')}</div>
    <ol class="hrules">${['r_1', 'r_2', 'r_3', 'r_4'].map(k => `<li>${t(k)}</li>`).join('')}</ol>`;
  canvases = [...box.querySelectorAll('canvas')].map(c => ({ g: c.getContext('2d'), sh: SHOTS.find(s => s.id === c.dataset.s) }));
}
/** Called every frame; draws only while the panel is open. */
export function drawHelp() {
  const p = document.querySelector('#menu .mp[data-p="help"]');
  if (!p || p.hidden || $('menu').hidden) return;
  canvases.forEach((c, i) => c.g && draw(c.g, c.sh, S.time + i * 0.3));
}
