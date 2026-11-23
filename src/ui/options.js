// OPTIONS panel: volumes, music, screen shake, language, fullscreen and the hit / lob / vibora keys.
import { S } from '../state.js';
import { OPTS, saveOpts } from '../game/opts.js';
import { applyKeys, SCHEMES } from '../input/input.js';
import { initAudio, sfx } from '../audio/sfx.js';
import { refreshMusicVolume } from '../audio/music.js';
import { setLang, t } from './i18n.js';

const $ = id => document.getElementById(id);
const KEYNAME = k => ({ Space: 'SPACE', ShiftLeft: 'L-SHIFT', ShiftRight: 'R-SHIFT', Enter: 'ENTER', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Backspace: 'BKSP', Tab: 'TAB' }[k] || k.replace(/^Key|^Digit/, '').replace(/^Numpad/, 'NUM ').toUpperCase());
const RESERVED = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'KeyP'];
let waiting = null;

const press = (seg, v) => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
export function renderOptions() {
  for (const el of document.querySelectorAll('.ostep')) el.querySelector('.sv').textContent = '▮'.repeat(OPTS[el.dataset.o]) + '▯'.repeat(10 - OPTS[el.dataset.o]);
  press($('shakeSeg'), OPTS.shake ? 'on' : 'off'); press($('langSeg'), OPTS.lang);
  $('fsBtn').textContent = t(document.fullscreenElement ? 'o_window' : 'o_full');
  const row = (a, lab) => `<div class="krow"><span>${lab}</span><button class="kbtn px${waiting === a ? ' wait' : ''}" data-a="${a}">${waiting === a ? t('o_press') : KEYNAME(SCHEMES.solo[a][0])}</button><i>${SCHEMES.solo[a].slice(1).map(KEYNAME).join(' · ')}</i></div>`;
  $('keyBox').innerHTML = `<div class="krow"><span>${t('o_move')}</span><b class="px">WASD / ↑↓←→</b></div>` + row('drive', t('hit')) + row('lob', t('lob')) + row('vib', 'VIBORA') + `<button class="kreset" id="kReset">${t('o_reset')}</button>`;
  $('kReset').onclick = () => { OPTS.keys = {}; applyKeys(OPTS.keys); saveOpts(); renderOptions() };
  for (const b of $('keyBox').querySelectorAll('.kbtn')) b.onclick = () => { waiting = b.dataset.a; renderOptions() };
}

export function setupOptions() {
  applyKeys(OPTS.keys);
  for (const el of document.querySelectorAll('.ostep')) {
    const [a, b] = el.querySelectorAll('button'), k = el.dataset.o;
    const go = d => { OPTS[k] = Math.max(0, Math.min(10, OPTS[k] + d)); saveOpts(); initAudio(); refreshMusicVolume(); if (k === 'sfx') sfx('hit', 0.8); renderOptions() };
    a.onclick = () => go(-1); b.onclick = () => go(1);
  }
  $('shakeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; OPTS.shake = b.dataset.v === 'on'; saveOpts(); renderOptions() });
  $('langSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; OPTS.lang = b.dataset.v; saveOpts(); setLang(OPTS.lang); renderOptions() });
  $('fsBtn').onclick = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}) } catch (e) {} setTimeout(renderOptions, 200) };
  document.addEventListener('fullscreenchange', renderOptions);
  // capture the next key press for a remap (before the game and menu see it)
  addEventListener('keydown', e => {
    if (!waiting) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.code !== 'Escape' && !RESERVED.includes(e.code)) {
      for (const a of ['drive', 'lob', 'vib']) if (OPTS.keys[a] === e.code) delete OPTS.keys[a];
      OPTS.keys[waiting] = e.code; applyKeys(OPTS.keys); saveOpts();
    }
    waiting = null; renderOptions();
  }, true);
  renderOptions();
}
export const remapping = () => !!waiting;
