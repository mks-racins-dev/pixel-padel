import { H } from '../sim/hooks.js';
import { settings } from './config.js';
// Practice mode: a ball machine on the far side feeds you balls, and a short series of drills
// teaches the game step by step. Drills run on the normal rules and physics; only the scoring is different.
import { S } from '../state.js';
import { rand } from '../core/rng.ts';
import { launch } from './rules.js';

/**
 * Each drill: how the machine feeds (target and flight), how many good shots are needed,
 * and what counts as a good shot (`ok` gets the last shot type and whether it came off the back glass).
 */
export const DRILLS = [
  { id: 'rally', name: 'RALLY', tip: 'Hit 5 balls back into the far court. Hold to power up, tap for a soft drop.', need: 5,
    feed: () => ({ tx: (rand() - 0.5) * 5, ty: -5.5 - rand(), spd: 10, clear: 1.4 }), ok: () => true },
  { id: 'glass', name: 'BACK GLASS', tip: 'Let it bounce and come off the back glass, then hit it. Hold back to play a contrapared.', need: 3,
    feed: () => ({ tx: (rand() - 0.5) * 4, ty: -8.6, spd: 15, clear: 1.2 }), ok: s => s.offWall || s.shot === 'contrapared' },
  { id: 'lob', name: 'LOB', tip: 'Lob the ball deep over the machine (lob button). It has to land past the service line.', need: 3,
    feed: () => ({ tx: (rand() - 0.5) * 4, ty: -5, spd: 9, clear: 1.3 }), ok: (s, land) => s.shot === 'lob' && Math.abs(land.y) > 6.95 },
  { id: 'over', name: 'OVERHEADS', tip: 'High balls: hit soft for a bandeja, strong for a smash. Max power at the net = por tres.', need: 3,
    feed: () => ({ tx: (rand() - 0.5) * 3, ty: -4.2, spd: 6.5, clear: 4.2 }), ok: s => ['bandeja', 'smash', 'portres'].includes(s.shot) },
  { id: 'vibora', name: 'VIBORA', tip: 'Your energy is full. Press vibora when the ball comes: a fast corner shot with side spin.', need: 2,
    feed: () => ({ tx: (rand() - 0.5) * 3, ty: -4.6, spd: 7, clear: 2.4 }), ok: s => s.shot === 'vibora', energy: true },
];

const KEY = 'pixelpadel-practice';
export const PR = { on: false, drill: 0, done: 0, feedT: 0, x: 0 };

function saved() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { return {} } }
function save(o) { try { localStorage.setItem(KEY, JSON.stringify({ ...saved(), ...o })) } catch (e) {} }
export function practiceProgress() { return saved() }

export const isPractice = () => PR.on && !S.demo;

/** Called by newMatch for the practice mode. Starts at the first drill not finished yet. */
export function startPractice() {
  PR.on = true;
  const done = saved().done || [];
  const first = DRILLS.findIndex(d => !done.includes(d.id));
  beginDrill(first < 0 ? 0 : first);
}
export function stopPractice() { PR.on = false }

function beginDrill(i) {
  PR.drill = i; PR.done = 0;
  const d = DRILLS[i];
  S.state = 'between'; S.afterState = () => feed(); S.stateT = 2.6;
  S.ball.held = true;
  H.showMsg(`DRILL ${i + 1}/${DRILLS.length} · ${d.name}`, d.tip);
  practiceHud();
}

/** The machine fires the next ball. */
function feed() {
  const d = DRILLS[PR.drill], p = S.players[0];
  if (d.energy) p.energy = 100;
  PR.x = (rand() - 0.5) * 4;
  Object.assign(S.ball, { x: PR.x, y: 9.4, z: 1.1, held: false });
  S.R0 = { serve: false, lastTeam: 1, bounces: 0, faults: 0, boxX: -1, net: false, hits: (S.R0?.hits || 0) + 1, server: p, backWall: -1 };
  const f = d.feed();
  launch(f.tx, f.ty, f.spd, f.clear);
  S.state = 'play';
  H.sfx('hit', 0.6);
  practiceHud();
}

/** The player's shot landed in the far court. */
export function practiceLanded(land) {
  const d = DRILLS[PR.drill];
  const good = d.ok({ shot: S.R0.lastShot, offWall: S.R0.lastOffWall }, land);
  S.state = 'between'; S.stateT = 0.9; S.afterState = () => { H.hideMsg(); next() };
  if (good) { PR.done++; S.floats.push({ x: land.x, y: land.y, t: 0.9, text: `${PR.done}/${d.need}`, c: '#9be37a' }); H.sfx('point') }
  else S.floats.push({ x: land.x, y: land.y, t: 0.9, text: 'IN · TRY THE DRILL SHOT', c: '#f7c993' });
  practiceHud();
}

/** The rally ended without a good landing (missed, out, net...). */
export function practiceMiss(reason) {
  S.state = 'between'; S.stateT = 1.1; S.afterState = () => { H.hideMsg(); next() };
  H.showMsg(reason, 'TRY AGAIN');
}

function next() {
  const d = DRILLS[PR.drill];
  if (PR.done < d.need) return feed();
  H.track('drill_done', { drill: d.id });
  H.emit({ type: 'drill', id: d.id });
  const done = new Set(saved().done || []); done.add(d.id); save({ done: [...done] });
  if (PR.drill + 1 < DRILLS.length) return beginDrill(PR.drill + 1);
  H.track('practice_complete', {});
  S.state = 'between'; S.stateT = 3; S.afterState = () => beginDrill(Math.floor(rand() * DRILLS.length));
  H.showMsg('PRACTICE COMPLETE!', 'Free play: drills now repeat at random. Quit from the pause menu.');
}

export function practiceHud() {
  const d = DRILLS[PR.drill], el = id => document.getElementById(id);
  if (!el('r0')) return;
  // row 1: which drill and good shots so far; row 2: drill name and how many are needed
  el('r0').querySelector('.nm').textContent = `DRILL ${PR.drill + 1}/${DRILLS.length}`; el('r0').querySelector('.g').textContent = '';
  el('r0').querySelector('.pt').textContent = PR.done;
  el('r1').querySelector('.nm').textContent = d.name; el('r1').querySelector('.g').textContent = '';
  el('r1').querySelector('.pt').textContent = d.need;
  el('info').textContent = 'PRACTICE';
}

export const practiceSelected = () => settings.mode === 'practice';
