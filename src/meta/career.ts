// Career mode: climb from the local club to the pro tour.
// Each event is a 1 vs 1 match against a named opponent; every tier ends with a final
// that unlocks the next tier and a cosmetic reward.
import { profile, saveProfile, addXp, unlock, TRAILS } from './profile.ts';

export interface CourtMods { wind?: number; sand?: boolean; deadBack?: boolean; roof?: number }
export interface CareerEvent {
  id: string; opp: string; venue: string; skill: number; games: number; final?: boolean; style: string;
  place?: string;          // street court name shown on the town map
  twist?: string;          // one line about the court twist
  court?: CourtMods;       // physics twist for this court
  map?: [number, number];  // pin position on the town map, in %
  needs?: string[];        // events that must be done first (free-order tiers)
  needsAny?: [number, string[]]; // at least n of these events done
  dare?: { text: string; maxLost: number }; // optional side bet: win while losing at most maxLost games
  prize?: string;          // item for winning the dare
  rival?: boolean;         // story match: counts as done whether you win or lose
}
export interface Tier { id: string; name: string; reward?: string; free?: boolean; events: CareerEvent[] }

const STREET = ['a1_roof', 'a1_market', 'a1_camp', 'a1_ware'];
export const TIERS: Tier[] = [
  { id: 'town', name: 'THE NEIGHBOURHOOD', reward: 'fire', free: true, events: [
    { id: 'a1_tomi', opp: 'TOMI', venue: 'sunset', skill: 0.0, games: 2, style: 'allround', place: 'SUNSET CLUB', twist: 'the home court. no tricks.', map: [50, 62] },
    { id: 'a1_roof', opp: 'PIGEON PETE', venue: 'roof', skill: 0.1, games: 2, style: 'sniper', place: 'GARAGE ROOFTOP', twist: 'wind pushes high balls sideways', court: { wind: 0.7 }, map: [20, 24], needs: ['a1_tomi'],
      dare: { text: 'WIN WITHOUT LOSING A GAME', maxLost: 0 }, prize: 'PIGEON FEATHER' },
    { id: 'a1_market', opp: 'NORA', venue: 'market', skill: 0.15, games: 2, style: 'speed', place: 'BEHIND THE SUPERMARKET', twist: 'chain-link back fence: no glass bounce', court: { deadBack: true }, map: [80, 24], needs: ['a1_tomi'],
      dare: { text: 'WIN WITHOUT LOSING A GAME', maxLost: 0 }, prize: 'OLD SHOES' },
    { id: 'a1_camp', opp: 'OLD VASQUEZ', venue: 'camp', skill: 0.2, games: 2, style: 'allround', place: 'CAMPSITE COURT', twist: 'sand on the court: low, dead bounces', court: { sand: true }, map: [18, 80], needs: ['a1_tomi'],
      dare: { text: 'WIN WITHOUT LOSING A GAME', maxLost: 0 }, prize: 'HOLEY CAP' },
    { id: 'a1_ware', opp: 'MIKKO', venue: 'ware', skill: 0.25, games: 3, style: 'power', place: 'OLD WAREHOUSE', twist: 'low roof beams: big lobs are a fault', court: { roof: 5.6 }, map: [82, 80], needs: ['a1_tomi'],
      dare: { text: 'WIN LOSING AT MOST 1 GAME', maxLost: 1 }, prize: 'RUSTY WHISTLE' },
    { id: 'a1_ruta', opp: 'RUTA', venue: 'sunset', skill: 0.55, games: 2, style: 'speed', place: 'SUNSET CLUB · LATE', twist: 'a stranger wants your court', map: [64, 46], needsAny: [3, STREET], rival: true },
    { id: 'a1_king', opp: 'BIG DANI', venue: 'sunset', skill: 0.32, games: 3, style: 'power', final: true, place: 'KING OF THE COURT', twist: 'friday night. the napkin trophy.', map: [36, 46], needs: [...STREET, 'a1_ruta'] },
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
export const CAREER = { active: false, toMap: false, kind: 'career' as 'career' | 'cup', event: null as (CareerEvent & { tier: number; seed?: number; round?: string }) | null };

/** The first event not won yet (or the last one once everything is won). */
export function nextEvent() {
  const won = profile().career.won;
  return ALL_EVENTS.find(e => !won.includes(e.id)) || ALL_EVENTS[ALL_EVENTS.length - 1];
}
export const tierUnlocked = (ti: number) => ti === 0 || TIERS[ti - 1].events.every(e => profile().career.won.includes(e.id));
/** Can this event be played now? Free-order tiers use `needs`; the others go in order. */
export function eventOpen(id: string): boolean {
  const e = ALL_EVENTS.find(x => x.id === id); if (!e || !tierUnlocked(e.tier)) return false;
  const won = profile().career.won;
  if (!TIERS[e.tier].free) return nextEvent().id === id || won.includes(id);
  if (e.needs && !e.needs.every(n => won.includes(n))) return false;
  if (e.needsAny && e.needsAny[1].filter(n => won.includes(n)).length < e.needsAny[0]) return false;
  return true;
}
export function eventState(id: string): 'won' | 'next' | 'locked' {
  if (profile().career.won.includes(id)) return 'won';
  return eventOpen(id) ? 'next' : 'locked';
}
/** Prizes won on dares, in map order. */
export const prizes = () => ALL_EVENTS.filter(e => e.prize && profile().career.dares.includes(e.id)).map(e => e.prize!);
/** Street rep: one star per town court done, one per dare won. */
export const streetRep = () => { const c = profile().career; return TIERS[0].events.filter(e => c.won.includes(e.id)).length + c.dares.length };
export const streetRepMax = () => TIERS[0].events.length + TIERS[0].events.filter(e => e.dare).length;
export const townDone = () => TIERS[0].events.every(e => profile().career.won.includes(e.id));

type Diff = { spd: number; err: number; react: number; volley: boolean; miss: number };
/** CPU difficulty for a skill from 0 (easy) to 1 (beyond hard). */
export function oppDiff(skill: number, easy: Diff, hard: Diff): Diff {
  const k = Math.max(0, Math.min(1, skill)) * 1.15; // the last events go a bit past "hard"
  const mix = (a: number, b: number) => a + (b - a) * k;
  return { spd: mix(easy.spd, hard.spd), err: Math.max(0.2, mix(easy.err, hard.err)), react: Math.max(0.04, mix(easy.react, hard.react)), volley: skill >= 0.2, miss: Math.max(0.005, mix(easy.miss, hard.miss)) };
}

export function startCareerEvent(id?: string) { CAREER.active = true; CAREER.toMap = false; CAREER.kind = 'career'; CAREER.event = (id && ALL_EVENTS.find(e => e.id === id)) || nextEvent() }
export function leaveCareer() { CAREER.active = false; CAREER.toMap = false; CAREER.event = null }

export interface CareerResult { xp: number; levels: number; unlocked: string[]; tierDone?: string; won: boolean; last: boolean; prize?: string; dareMissed?: boolean; rival?: boolean; toMap?: boolean }
/** Applies the result of a finished career match and returns what the player earned. */
export function finishCareerMatch(won: boolean, gamesWon: number, gamesLost = 0): CareerResult {
  const e = CAREER.event!; const p = profile(); const unlocked: string[] = [];
  const done = won || !!e.rival; // a rival match moves the story on either way
  const first = done && !p.career.won.includes(e.id);
  if (first) p.career.won.push(e.id);
  let prize: string | undefined, dareMissed = false;
  if (won && e.dare && !p.career.dares.includes(e.id)) {
    if (gamesLost <= e.dare.maxLost) { p.career.dares.push(e.id); prize = e.prize } else dareMissed = true;
  }
  if (won && e.rival && !p.career.seen.includes('beat:' + e.id)) p.career.seen.push('beat:' + e.id);
  if (first || prize || e.rival) saveProfile();
  let xp = won ? xpForWin(e) - (first ? 0 : 35) : 20 + 8 * gamesWon;
  if (prize) xp += 40;
  const before = new Set(profile().unlocked);
  const levels = addXp(xp);
  let tierDone: string | undefined;
  if (first && e.final) { tierDone = TIERS[e.tier].name; const r = TIERS[e.tier].reward; if (r) unlock(r) }
  for (const id of profile().unlocked) if (!before.has(id)) unlocked.push((TRAILS.find(t => t.id === id)?.name || id) + ' TRAIL');
  const last = ALL_EVENTS.every(x => profile().career.won.includes(x.id));
  const toMap = done && !!TIERS[e.tier].free; // the town goes back to the map to pick the next court
  if (won && !toMap) CAREER.event = nextEvent();
  return { xp, levels, unlocked, tierDone, won, last, prize, dareMissed, rival: !!e.rival && first, toMap };
}

/** XP for winning an event the first time. */
export function xpForWin(e: { tier: number; final?: boolean }) { return 60 + 25 * e.tier + (e.final ? 40 : 0) }
