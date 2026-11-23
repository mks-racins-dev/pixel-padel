// Couch 2 vs 2: up to four people on one screen. Each gamepad and each half of the keyboard
// is a device. Press hit to join (you go to the team with more space), press it again to switch
// team, press lob to leave. Empty slots are played by bots. Slots live in S.couch so the shared
// match setup (rules.js) can read them.
import { S } from '../state.js';
import { settings } from '../game/settings.js';

// slots 0,1 = team A, slots 2,3 = team B
export const DEVICES = { kb1: 'KEYS · WASD + F', kb2: 'KEYS · ARROWS + K' };
const devName = d => DEVICES[d] || 'PAD ' + (+d.slice(3) + 1);
const slots = () => (S.couch ||= [null, null, null, null]);
const free = (team, s) => [team * 2, team * 2 + 1].find(i => !s[i]);

export function couchJoin(dev) {
  const s = slots(), at = s.findIndex(x => x && x.dev === dev);
  if (at >= 0) { // already in: switch team if there is room
    const other = at < 2 ? 1 : 0, i = free(other, s);
    if (i !== undefined) { s[i] = s[at]; s[at] = null }
  } else {
    const a = s.filter((x, i) => x && i < 2).length, b = s.filter((x, i) => x && i >= 2).length;
    const i = free(a <= b ? 0 : 1, s) ?? free(a <= b ? 1 : 0, s);
    if (i !== undefined) s[i] = { dev };
  }
  renderCouch();
}
export function couchLeave(dev) { const s = slots(), at = s.findIndex(x => x && x.dev === dev); if (at >= 0) { s[at] = null; renderCouch() } }
/** Before a match: if nobody joined, the first keyboard player takes slot 1. */
export function couchReady() { const s = slots(); if (!s.some(Boolean)) s[0] = { dev: 'kb1' } }

/** True while the couch lobby is on screen (device presses join instead of navigating). */
export function couchLobbyOpen() {
  const m = document.getElementById('menu'), q = document.querySelector('#menu .mp[data-p="quick"]');
  return settings.mode === 'couch' && !!m && !m.hidden && !!q && !q.hidden;
}

export function renderCouch() {
  const el = document.getElementById('couchBox'); if (!el) return;
  el.hidden = settings.mode !== 'couch'; if (el.hidden) return;
  const s = slots(), cell = i => `<div class="cslot${s[i] ? ' on' : ''}"><b class="px">${s[i] ? 'P' + (s.slice(0, i + 1).filter(Boolean).length) : 'BOT'}</b><span>${s[i] ? devName(s[i].dev) : 'press hit to join'}</span></div>`;
  el.innerHTML = `<div class="cteam"><span class="px" title="Team A">A</span>${cell(0)}${cell(1)}</div><div class="cteam"><span class="px" title="Team B">B</span>${cell(2)}${cell(3)}</div>
    <div class="help">Join: <b>A</b> on a pad, <b>F</b> or <b>K</b> on the keyboard. Press again to switch team, <b>B</b> / <b>G</b> / <b>L</b> to leave. Start with <b>START</b> or the button below.</div>`;
}

if (typeof addEventListener !== 'undefined') addEventListener('keydown', e => {
  if (e.repeat || !couchLobbyOpen()) return;
  const map = { KeyF: ['kb1', 1], KeyG: ['kb1', 0], KeyK: ['kb2', 1], KeyL: ['kb2', 0] }[e.code];
  if (!map) return;
  e.preventDefault(); e.stopPropagation();
  map[1] ? couchJoin(map[0]) : couchLeave(map[0]);
}, true);
