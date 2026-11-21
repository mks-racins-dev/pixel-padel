// Career mode: climb from the local club to the pro tour.
// Each event is a 1 vs 1 match against a named opponent; every tier ends with a final
// that unlocks the next tier and a cosmetic reward.
import { profile, saveProfile, addXp, unlock, TRAILS } from './profile.ts';

export interface CareerEvent { id: string; opp: string; venue: string; skill: number; games: number; final?: boolean; style: string }
export interface Tier { id: string; name: string; reward?: string; events: CareerEvent[] }

export const TIERS: Tier[] = [
  { id: 'club', name: 'CLUB LADDER', reward: 'fire', events: [
    { id: 'club1', opp: 'TOMI', venue: 'sunset', skill: 0.0, games: 2, style: 'allround' },
    { id: 'club2', opp: 'NORA', venue: 'sunset', skill: 0.15, games: 2, style: 'speed' },
    { id: 'club3', opp: 'COACH RAY', venue: 'sunset', skill: 0.3, games: 3, final: true, style: 'sniper' },
  ] },
  { id: 'baltic', name: 'BALTIC TOUR', reward: 'gold', events: [
    { id: 'bal1', opp: 'ILZE', venue: 'lv', skill: 0.35, games: 3, style: 'sniper' },
    { id: 'bal2', opp: 'MART', venue: 'ee', skill: 0.45, games: 3, style: 'power' },
    { id: 'bal3', opp: 'RUTA', venue: 'lt', skill: 0.55, games: 3, final: true, style: 'speed' },
  ] },
  { id: 'east', name: 'EAST OPEN', events: [
    { id: 'east1', opp: 'ALES', venue: 'by', skill: 0.62, games: 3, style: 'power' },
    { id: 'east2', opp: 'IGOR', venue: 'ru', skill: 0.7, games: 3, style: 'allround' },
    { id: 'east3', opp: 'DASHA', venue: 'ru', skill: 0.78, games: 4, final: true, style: 'sniper' },
  ] },
  { id: 'pro', name: 'PRO TOUR', events: [
    { id: 'pro1', opp: 'PACO', venue: 'es', skill: 0.85, games: 4, style: 'speed' },
    { id: 'pro2', opp: 'JAY', venue: 'us', skill: 0.92, games: 4, style: 'power' },
    { id: 'pro3', opp: 'EL MAESTRO', venue: 'es', skill: 1.0, games: 5, final: true, style: 'sniper' },
  ] },
];
export const ALL_EVENTS = TIERS.flatMap((t, ti) => t.events.map(e => ({ ...e, tier: ti })));

/** Career run state for the current match. Not saved: a match in progress is just abandoned on reload. */
export const CAREER = { active: false, event: null as (CareerEvent & { tier: number }) | null };

/** The first event not won yet (or the last one once everything is won). */
export function nextEvent() {
  const won = profile().career.won;
  return ALL_EVENTS.find(e => !won.includes(e.id)) || ALL_EVENTS[ALL_EVENTS.length - 1];
}
export const tierUnlocked = (ti: number) => ti === 0 || TIERS[ti - 1].events.every(e => profile().career.won.includes(e.id));
export function eventState(id: string): 'won' | 'next' | 'locked' {
  if (profile().career.won.includes(id)) return 'won';
  return nextEvent().id === id ? 'next' : 'locked';
}

type Diff = { spd: number; err: number; react: number; volley: boolean; miss: number };
/** CPU difficulty for a skill from 0 (easy) to 1 (beyond hard). */
export function oppDiff(skill: number, easy: Diff, hard: Diff): Diff {
  const k = Math.max(0, Math.min(1, skill)) * 1.15; // the last events go a bit past "hard"
  const mix = (a: number, b: number) => a + (b - a) * k;
  return { spd: mix(easy.spd, hard.spd), err: Math.max(0.2, mix(easy.err, hard.err)), react: Math.max(0.04, mix(easy.react, hard.react)), volley: skill >= 0.2, miss: Math.max(0.005, mix(easy.miss, hard.miss)) };
}

export function startCareerEvent() { CAREER.active = true; CAREER.event = nextEvent() }
export function leaveCareer() { CAREER.active = false; CAREER.event = null }

export interface CareerResult { xp: number; levels: number; unlocked: string[]; tierDone?: string; won: boolean; last: boolean }
/** Applies the result of a finished career match and returns what the player earned. */
export function finishCareerMatch(won: boolean, gamesWon: number): CareerResult {
  const e = CAREER.event!; const p = profile(); const unlocked: string[] = [];
  const first = won && !p.career.won.includes(e.id);
  if (first) { p.career.won.push(e.id); saveProfile() }
  const xp = won ? 60 + 25 * e.tier + (e.final ? 40 : 0) - (first ? 0 : 35) : 20 + 8 * gamesWon;
  const before = new Set(profile().unlocked);
  const levels = addXp(xp);
  let tierDone: string | undefined;
  if (first && e.final) { tierDone = TIERS[e.tier].name; const r = TIERS[e.tier].reward; if (r) unlock(r) }
  for (const id of profile().unlocked) if (!before.has(id)) unlocked.push((TRAILS.find(t => t.id === id)?.name || id) + ' TRAIL');
  const last = ALL_EVENTS.every(x => profile().career.won.includes(x.id));
  if (won) CAREER.event = nextEvent();
  return { xp, levels, unlocked, tierDone, won, last };
}
