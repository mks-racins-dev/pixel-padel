// Turns the story scenes (story.js) into cutscenes: where each one is staged, how the
// characters look, who walks in when, and who is only on the phone.
import { WHO } from './story.js';
import { ALL_EVENTS } from '../meta/career.ts';
import { gradeFor } from '../render/grades.js';
import { LOCS } from './venues.js';

/** Where a scene happens: a backdrop, or the venue of an event (at that event's grade). */
const STAGE = {
  ray: { at: 'a1_tomi' }, ruta: { at: 'a1_ruta' }, ruta_win: { at: 'a1_ruta' }, ruta_loss: { at: 'a1_ruta' },
  king: { at: 'a1_king' }, act1: { at: 'a1_king' },
  van1: { bg: 'road' }, van2: { bg: 'road' }, van3: { bg: 'road' },
  knocked: { last: true }, riga_win: { at: 'b_riga3' }, sponsor: { at: 'b_riga3', remote: ['kebab'] },
  ruta2: { at: 'b_vil2' }, act2: { at: 'b_vil2' },
  ray_sick: { bg: 'room' }, minsk_win: { bg: 'room' }, moscow: { at: 'e_mos1' }, ruta_drop: { at: 'e_mos3' }, act3: { at: 'e_mos3' },
  plane: { bg: 'plane' }, madrid_win: { at: 'p_mad3' }, miami: { at: 'p_mia1' }, ruta_sorry: { bg: 'room' }, miami_win: { at: 'p_mia2' },
  maestro: { at: 'p_fin' }, act4: { at: 'p_fin' }, epilogue: { at: 'a1_roof', grade: 1 },
};

const look = (id, shirt, hair, o = {}) => ({ id: 'who_' + id, skin: '#e8b48a', hair, shirt, shorts: '#2d2a3a', band: null, frame: '#8a7f98', skirt: false, tail: false, ...o });
export const CAST = {
  tomi: look('tomi', WHO.tomi.c, WHO.tomi.hair, { skin: '#f0c4a0', shorts: '#1f2a44', frame: '#f2c14e' }),
  ray: look('ray', '#8a7f98', '#e8e8e8', { shorts: '#4a4452', band: '#f4ead2' }),
  ruta: look('ruta', WHO.ruta.c, WHO.ruta.hair, { skin: '#f0c4a0', tail: true, frame: '#e4572e' }),
  dani: look('dani', WHO.dani.c, WHO.dani.hair, { skin: '#b97a52', frame: '#3fa7a8' }),
  kebab: look('kebab', WHO.kebab.c, WHO.kebab.hair, { skin: '#c98d62', shorts: '#f4ead2' }),
  dasha: look('dasha', WHO.dasha.c, WHO.dasha.hair, { skin: '#f4d6c0', tail: true, frame: '#f4ead2' }),
  maestro: look('maestro', '#1d1a24', WHO.maestro.hair, { skin: '#c98d62', shorts: '#1d1a24', frame: '#f2c14e' }),
  press: look('press', WHO.press.c, WHO.press.hair, { shorts: '#2b2540' }),
};

/** Lines like "(on the phone) ..." come from someone who is not there. */
const REMOTE = /^\((on the phone|message|text message|on speaker|video call[^)]*)\)\s*/i;
const emoteOf = t => /^\.\.\./.test(t) ? '…' : /SURPRISE|!$|!\s/.test(t) ? '!' : /\?$/.test(t) ? '?' : /sorry/i.test(t) ? '…' : null;

/** Where a non-pre scene plays when it has no fixed stage: the last event you played. */
function lastEvent(c) { for (let i = c.won.length - 1; i >= 0; i--) { const e = ALL_EVENTS.find(x => x.id === c.won[i]); if (e) return e } return ALL_EVENTS[0] }

/** Builds the cutscene for a story scene. */
export function storyCine(s, career, you) {
  const st = STAGE[s.id] || {};
  let ev = s.pre ? ALL_EVENTS.find(e => e.id === s.pre) : st.at ? ALL_EVENTS.find(e => e.id === st.at) : st.last ? lastEvent(career) : null;
  const bg = st.bg || 'venue';
  if (bg === 'venue' && !ev) ev = lastEvent(career);
  const scene = { bg, w: 480, cam: 0, loc: ev?.venue, grade: st.grade ?? (ev ? gradeFor(ev) : 0), actors: [], steps: [] };
  if (bg === 'road') { // everyone is in the van
    scene.steps.push({ card: 'ON THE ROAD', t: 1.6 });
  } else {
    const here = [], seenAt = {}, remote = new Set([...(st.remote || []), ...s.lines.filter(([, t]) => REMOTE.test(t)).map(([w]) => w)]);
    s.lines.forEach(([w, text], i) => { if (w !== 'note' && w !== 'you' && !remote.has(w) && !(w in seenAt)) { seenAt[w] = i; here.push(w) } });
    const seated = bg === 'plane';
    scene.actors.push({ id: 'you', look: you, x: seated ? 150 : 170, dir: 1 });
    here.forEach((w, k) => scene.actors.push({ id: w, look: CAST[w] || CAST.press, x: seated ? 250 + k * 100 : seenAt[w] === 0 ? 260 + k * 50 : 560 + k * 40, dir: -1 }));
    if (ev && bg === 'venue') scene.steps.push({ card: ev.place || ((LOCS[ev.venue]?.city || '') + (ev.stage ? ' - ' + ev.stage : '')), t: 1.6 });
  }
  const walked = new Set();
  s.lines.forEach(([w, text], i) => {
    const rem = text.match(REMOTE), clean = text.replace(REMOTE, '');
    const onStage = scene.actors.some(a => a.id === w);
    // someone arriving walks in right before their first line
    if (onStage && w !== 'you' && !walked.has(w)) { walked.add(w); const a = scene.actors.find(x => x.id === w); if (a.x > 480) scene.steps.push({ move: w, to: 250 + scene.actors.indexOf(a) * 45, t: 1.1 }) }
    const e = emoteOf(clean); if (e && onStage) scene.steps.push({ emote: w, e, t: 0.7 });
    if (w === 'note') scene.steps.push({ line: i, text: clean });
    else scene.steps.push({ line: i, who: w, name: (WHO[w] || WHO.note).name, remote: rem || (!onStage && w !== 'you') ? '📱' : '', text: clean });
  });
  return scene;
}
