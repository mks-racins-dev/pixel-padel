// Main menu (side list): a list of ways to play on the left, details and the main action on the right.
// Arrow keys / W S / gamepad move through the list; Enter or A runs the panel's main button.
import { S } from '../state.js';
import { settings } from '../game/settings.js';
import { STYLES } from '../game/constants.js';
import { LOCS } from '../content/venues.js';
import { profile, xpToNext, MAX_LEVEL } from '../meta/profile.ts';
import { chState, dailySet } from '../meta/challenges.ts';
import { leaveCareer } from '../meta/career.ts';
import { DRILLS, practiceProgress } from '../game/practice.js';
import { renderCareerTab } from './careerTab.js';
import { renderDailyTab, renderCupTab } from './dailyTab.js';
import { initAudio } from '../audio/sfx.js';
import { startGame, setHelp } from './ui.js';

const $ = id => document.getElementById(id);
const QUICK_MODES = ['1v1', '2v2', 'pvp'];
const STEPS = {
  diff: { opts: ['easy', 'normal', 'hard'], label: v => v.toUpperCase() },
  games: { opts: [2, 3, 4, 6], label: v => `FIRST TO ${v} GAMES` },
};
const MODE_NAME = { '1v1': '1 VS 1 VS CPU', '2v2': '2 VS 2 WITH MIA', pvp: '2 PLAYERS, ONE KEYBOARD' };
let current = 'career';

const items = () => [...document.querySelectorAll('#menu .mi')];
const menuOpen = () => { const m = $('menu'); return m && !m.hidden };

export function showPanel(id) {
  current = id;
  for (const b of items()) b.setAttribute('aria-current', b.dataset.p === id ? 'true' : 'false');
  document.querySelectorAll('#menu .mp').forEach(p => (p.hidden = p.dataset.p !== id));
  renderPanel(id);
}
export function menuMove(d) {
  const list = items(), i = list.findIndex(b => b.dataset.p === current);
  showPanel(list[(i + d + list.length) % list.length].dataset.p);
}
/** Runs the open panel's main button. Returns true if there was one. */
export function menuPrimary() {
  const b = document.querySelector(`#menu .mp[data-p="${current}"] [data-primary]`);
  if (b) { b.click(); return true }
  return false;
}

function renderPanel(id) {
  if (id === 'career') renderCareerTab();
  else if (id === 'daily') renderDailyTab();
  else if (id === 'cup') renderCupTab();
  else if (id === 'practice') renderPractice();
  else if (id === 'quick') renderQuick();
}

/** Refreshes the list badges and the open panel (after a match, on load). */
export function renderMenu() {
  const p = profile();
  $('mLevel').textContent = 'LV ' + p.level;
  $('mXp').style.width = (p.level >= MAX_LEVEL ? 100 : Math.round(100 * p.xp / xpToNext(p.level))) + '%';
  const st = chState(), done = dailySet(st.day).filter(c => st.daily[c.id]?.done).length;
  $('mDaily').textContent = `${done}/3`;
  $('mDaily').className = done === 3 ? 'ok' : '';
  const pd = (practiceProgress().done || []).length;
  $('mPractice').textContent = pd >= DRILLS.length ? '✓' : `${pd}/${DRILLS.length}`;
  renderPanel(current);
}

function renderQuick() {
  if (!QUICK_MODES.includes(settings.mode)) settings.mode = '1v1';
  document.querySelectorAll('#menu .seg[data-key="mode"] button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === settings.mode ? 'true' : 'false'));
  for (const el of document.querySelectorAll('#menu .step')) el.querySelector('.sv').textContent = STEPS[el.dataset.key].label(settings[el.dataset.key]);
  const st = STYLES[settings.style];
  $('qSummary').innerHTML = [MODE_NAME[settings.mode], 'CPU: ' + settings.diff.toUpperCase(), 'FIRST TO ' + settings.games + ' GAMES', 'YOUR STYLE: ' + st.name, 'BOUNCE MARK: ' + (settings.assist === 'on' ? 'ON' : 'OFF')].join('<br>');
}

function renderPractice() {
  const done = practiceProgress().done || [];
  const next = DRILLS.findIndex(d => !done.includes(d.id));
  $('practiceBox').innerHTML = `<div class="mtitle px">PRACTICE</div>
    <div class="help">A ball machine feeds you balls. Five short drills teach every shot; finished drills are saved.</div>
    <div class="plist">${DRILLS.map((d, i) => `<div class="pd ${done.includes(d.id) ? 'won' : i === next ? 'next' : ''}"><span class="px">${i + 1}</span>${done.includes(d.id) ? '✓ ' : ''}${d.name}<i>${d.tip}</i></div>`).join('')}</div>
    <button class="big" data-primary id="practiceStart">${next < 0 ? 'FREE PRACTICE' : done.length ? 'CONTINUE: ' + DRILLS[next].name : 'START PRACTICE'} ▸</button>`;
  $('practiceStart').onclick = () => { initAudio(); leaveCareer(); settings.mode = 'practice'; startGame() };
}

function buildSteppers() {
  for (const el of document.querySelectorAll('#menu .step')) {
    const k = el.dataset.key, cfg = STEPS[k];
    el.innerHTML = `<button aria-label="Previous">◂</button><span class="sv px"></span><button aria-label="Next">▸</button>`;
    const [prev, next] = el.querySelectorAll('button');
    const go = d => {
      let i = cfg.opts.indexOf(settings[k]); if (i < 0) i = 1;
      settings[k] = cfg.opts[Math.max(0, Math.min(cfg.opts.length - 1, i + d))];
      renderQuick();
    };
    prev.onclick = () => go(-1); next.onclick = () => go(1);
  }
}

function buildVenueCards() {
  $('venueCards').innerHTML = Object.entries(LOCS).map(([k, l]) => {
    const sky = [l.sky[1], l.sky[4], l.sky[7]].map(c => `<span style="background:${c}"></span>`).join('');
    return `<button data-v="${k}" aria-label="${l.city}"><span class="vsky" aria-hidden="true">${sky}<span style="background:${l.court}" class="vcourt"></span></span><span class="vname">${l.city}</span></button>`;
  }).join('');
}

/** Called by ui.js setup before it wires the generic .seg buttons. */
export function buildMenu() {
  buildVenueCards();
  buildSteppers();
  for (const b of items()) b.addEventListener('click', () => showPanel(b.dataset.p));
  $('quickStart').onclick = () => { initAudio(); leaveCareer(); if (!QUICK_MODES.includes(settings.mode)) settings.mode = '1v1'; startGame() };
  $('onlineStart').onclick = () => { initAudio(); leaveCareer(); settings.mode = 'online'; startGame() };
  const ss = $('soundSeg');
  const paintSound = () => ss.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === 'off') === !!S.muted ? 'true' : 'false'));
  ss.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.muted = b.dataset.v === 'off'; initAudio(); paintSound(); const sb = $('soundBtn'); if (sb) sb.textContent = 'SOUND: ' + (S.muted ? 'OFF' : 'ON') });
  paintSound();
  // keep the quick match card in sync with any option change
  document.querySelector('#menu .mp[data-p="quick"]').addEventListener('click', () => setTimeout(renderQuick));
  addEventListener('keydown', e => {
    if (!menuOpen() || e.target instanceof HTMLInputElement) return;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); menuMove(-1) }
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); menuMove(1) }
    else if (e.code === 'Enter') { e.preventDefault(); menuPrimary() }
  });
  showPanel(current);
  renderMenu();
  setHelp();
}
