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
  stop?: string;           // tour stop (a knockout tournament) this match belongs to
  stage?: string;          // round name in that tournament
  rp?: number;             // ranking points for winning this round the first time
  noMarker?: boolean;      // no coach: the bounce marker is off for this match
}
export interface Stop { id: string; name: string; venue: string }
export interface Tier { id: string; name: string; reward?: string; free?: boolean; stops?: Stop[]; events: CareerEvent[] }

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
  { id: 'baltic', name: 'BALTIC TOUR', reward: 'gold', stops: [
    { id: 'riga', name: 'RIGA OPEN', venue: 'lv' },
    { id: 'tallinn', name: 'TALLINN CUP', venue: 'ee' },
    { id: 'vilnius', name: 'BALTIC MASTERS', venue: 'lt' },
  ], events: [
    { id: 'b_riga1', opp: 'ILZE', venue: 'lv', skill: 0.33, games: 3, style: 'sniper', stop: 'riga', stage: 'ROUND 1', rp: 15 },
    { id: 'b_riga2', opp: 'JANIS', venue: 'lv', skill: 0.37, games: 3, style: 'allround', stop: 'riga', stage: 'SEMI-FINAL', rp: 25 },
    { id: 'b_riga3', opp: 'ARTURS', venue: 'lv', skill: 0.41, games: 3, style: 'power', stop: 'riga', stage: 'FINAL', rp: 40 },
    { id: 'b_tal1', opp: 'KAIA', venue: 'ee', skill: 0.44, games: 3, style: 'speed', stop: 'tallinn', stage: 'SEMI-FINAL', rp: 25 },
    { id: 'b_tal2', opp: 'MART', venue: 'ee', skill: 0.48, games: 3, style: 'power', stop: 'tallinn', stage: 'FINAL', rp: 45 },
    { id: 'b_vil1', opp: 'LUKAS', venue: 'lt', skill: 0.51, games: 3, style: 'sniper', stop: 'vilnius', stage: 'SEMI-FINAL', rp: 30 },
    { id: 'b_vil2', opp: 'RUTA', venue: 'lt', skill: 0.56, games: 3, style: 'speed', stop: 'vilnius', stage: 'FINAL', rp: 60, final: true },
  ] },
  { id: 'east', name: 'EAST OPEN', stops: [
    { id: 'minsk', name: 'MINSK CHALLENGER', venue: 'by' },
    { id: 'moscow', name: 'MOSCOW NIGHTS', venue: 'ru' },
  ], events: [
    { id: 'e_min1', opp: 'ALES', venue: 'by', skill: 0.6, games: 3, style: 'power', stop: 'minsk', stage: 'ROUND 1', rp: 20, noMarker: true },
    { id: 'e_min2', opp: 'OKSANA', venue: 'by', skill: 0.63, games: 3, style: 'speed', stop: 'minsk', stage: 'SEMI-FINAL', rp: 30, noMarker: true },
    { id: 'e_min3', opp: 'VIKTOR', venue: 'by', skill: 0.66, games: 3, style: 'allround', stop: 'minsk', stage: 'FINAL', rp: 50, noMarker: true },
    { id: 'e_mos1', opp: 'SASHA', venue: 'ru', skill: 0.7, games: 3, style: 'sniper', stop: 'moscow', stage: 'ROUND 1', rp: 25, noMarker: true },
    { id: 'e_mos2', opp: 'IGOR', venue: 'ru', skill: 0.74, games: 3, style: 'allround', stop: 'moscow', stage: 'SEMI-FINAL', rp: 40, noMarker: true },
    { id: 'e_mos3', opp: 'DASHA', venue: 'ru', skill: 0.78, games: 4, style: 'sniper', stop: 'moscow', stage: 'FINAL', rp: 70, final: true, noMarker: true },
  ] },
  { id: 'pro', name: 'PRO TOUR', stops: [
    { id: 'madrid', name: 'MADRID MASTER', venue: 'es' },
    { id: 'miami', name: 'MIAMI NEON SLAM', venue: 'us' },
    { id: 'finals', name: 'WORLD FINALS', venue: 'es' },
  ], events: [
    { id: 'p_mad1', opp: 'PACO', venue: 'es', skill: 0.82, games: 4, style: 'speed', stop: 'madrid', stage: 'ROUND 1', rp: 40 },
    { id: 'p_mad2', opp: 'LUCIA', venue: 'es', skill: 0.85, games: 4, style: 'sniper', stop: 'madrid', stage: 'SEMI-FINAL', rp: 60 },
    { id: 'p_mad3', opp: 'ALVARO', venue: 'es', skill: 0.88, games: 4, style: 'power', stop: 'madrid', stage: 'FINAL', rp: 90 },
    { id: 'p_mia1', opp: 'JAY', venue: 'us', skill: 0.9, games: 4, style: 'power', stop: 'miami', stage: 'SEMI-FINAL', rp: 60 },
    { id: 'p_mia2', opp: 'BROOKE', venue: 'us', skill: 0.93, games: 4, style: 'speed', stop: 'miami', stage: 'FINAL', rp: 100 },
    { id: 'p_fin', opp: 'EL MAESTRO', venue: 'es', skill: 1.0, games: 5, style: 'sniper', stop: 'finals', stage: 'FINAL', rp: 200, final: true },
  ] },
];
export const ALL_EVENTS = TIERS.flatMap((t, ti) => t.events.map(e => ({ ...e, tier: ti })));

/** Career run state for the current match. Not saved: a match in progress is just abandoned on reload. */
export const CAREER = { active: false, toMap: false, kind: 'career' as 'career' | 'cup' | 'season' | 'doubles', event: null as (CareerEvent & { tier: number; seed?: number; round?: string }) | null };

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
/** Sponsor goals in order; the first one not done is active once the sponsor has signed you. */
export interface Goal { id: string; text: string; xp: number; rp: number; check: (r: { won: boolean; gamesLost: number; streak: number; id: string; stage?: string }) => boolean }
export const SPONSOR = 'KEBAB KING';
export const GOALS: Goal[] = [
  { id: 'g_close', text: 'WIN A TOUR MATCH LOSING AT MOST 1 GAME', xp: 60, rp: 10, check: r => r.won && r.gamesLost <= 1 },
  { id: 'g_streak', text: 'WIN 2 TOUR MATCHES IN A ROW', xp: 70, rp: 10, check: r => r.streak >= 2 },
  { id: 'g_clean', text: 'WIN A TOUR MATCH WITHOUT LOSING A GAME', xp: 90, rp: 15, check: r => r.won && r.gamesLost === 0 },
  { id: 'g_tallinn', text: 'WIN A TOURNAMENT FINAL', xp: 100, rp: 20, check: r => r.won && r.stage === 'FINAL' },
  { id: 'g_comeback', text: 'WIN A TOUR MATCH AFTER LOSING 2 GAMES', xp: 110, rp: 20, check: r => r.won && r.gamesLost >= 2 },
  { id: 'g_streak3', text: 'WIN 3 TOUR MATCHES IN A ROW', xp: 130, rp: 25, check: r => r.streak >= 3 },
  { id: 'g_night', text: 'WIN A MATCH AT MOSCOW NIGHTS', xp: 150, rp: 30, check: r => r.won && r.id.startsWith('e_mos') },
  { id: 'g_pro', text: 'WIN A PRO TOUR MATCH LOSING AT MOST 1 GAME', xp: 180, rp: 40, check: r => r.won && r.gamesLost <= 1 && r.id.startsWith('p_') },
  { id: 'g_miami', text: 'WIN A MATCH IN MIAMI', xp: 200, rp: 40, check: r => r.won && r.id.startsWith('p_mia') },
];
export const sponsorSigned = () => profile().career.seen.includes('sponsor');
export const activeGoal = () => sponsorSigned() ? GOALS.find(g => !profile().career.goals.includes(g.id)) : undefined;
/** World ranking from ranking points: #412 for a newcomer, about #150 after the Baltic tour. */
/** World ranking from ranking points: #2000 on day one, top 250 after the Baltic tour, #1 after the World Finals. */
export const START_RANK = 2000;
export const worldRank = (rp = profile().career.rp) => profile().career.won.includes('p_fin') ? 1 : Math.max(2, Math.round(START_RANK * Math.exp(-0.15 * Math.sqrt(rp))));
/** Playing identities, chosen once in Act 3. Each adds a permanent bonus to career stats. */
export const IDENTITIES = [
  { id: 'wall', name: 'WALL WIZARD', text: 'lives off the glass: +1 WALL PLAY', bonus: { wall: 1 } },
  { id: 'smash', name: 'SMASH MACHINE', text: 'ends points from the air: +0.75 POWER', bonus: { pow: 0.75 } },
  { id: 'counter', name: 'COUNTER-PUNCHER', text: 'gets everything back: +0.5 SPEED, +0.5 ACCURACY', bonus: { spd: 0.5, acc: 0.5 } },
];
export const needsIdentity = () => profile().career.won.includes('e_min3') && !profile().career.identity;
export function chooseIdentity(id: string) { if (IDENTITIES.some(i => i.id === id)) { profile().career.identity = id; saveProfile() } }
/** Press conferences after a pro final: the answer wins fans. */
export const PRESS_AFTER: Record<string, string> = { p_mad3: 'madrid', p_mia2: 'miami' };
export const PRESS = [
  { id: 'cocky', name: 'COCKY', quote: '"I came here to win. Next question."', fans: 9000 },
  { id: 'humble', name: 'HUMBLE', quote: '"I just want to thank Coach Ray. And the Kebab King."', fans: 6000 },
  { id: 'funny', name: 'FUNNY', quote: '"Two months ago my trophy was a napkin. This one is heavier."', fans: 7500 },
];
/** The press conference waiting for an answer, if any. */
export const pendingPress = () => { const c = profile().career; return Object.entries(PRESS_AFTER).find(([id, k]) => c.won.includes(id) && !c.press.some(x => x.startsWith(k + ':')))?.[1] };
export function answerPress(choice: string) {
  const k = pendingPress(), c = PRESS.find(x => x.id === choice); if (!k || !c) return;
  profile().career.press.push(k + ':' + choice); saveProfile();
}
/** Fans: grow with ranking points and press answers. */
export const fans = () => { const c = profile().career; return 120 + c.rp * 25 + c.press.reduce((n, x) => n + (PRESS.find(p => p.id === x.split(':')[1])?.fans || 0), 0) };
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

export interface CareerResult { xp: number; levels: number; unlocked: string[]; tierDone?: string; won: boolean; last: boolean; prize?: string; dareMissed?: boolean; rival?: boolean; toMap?: boolean; free?: boolean; knocked?: string; rp?: number; rank?: number; rankBefore?: number; goal?: string }
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
  let xp = won ? xpForWin(e) - (first ? 0 : 35) : 20 + 8 * gamesWon;
  if (prize) xp += 40;
  // tour stops: ranking points, knockouts, sponsor goals
  let knocked: string | undefined, rp = 0, goal: string | undefined;
  const rankBefore = worldRank();
  if (first && won && !e.stop && !p.career.seen.includes('rp:' + e.id)) { rp = e.final ? 25 : 10; p.career.seen.push('rp:' + e.id); p.career.rp += rp } // town wins move you up too
  if (e.stop) {
    if (won && !p.career.seen.includes('rp:' + e.id)) { rp += e.rp || 0; p.career.seen.push('rp:' + e.id) } // paid once, even after a knockout
    if (!won) {
      knocked = e.stage; // out of the tournament: it starts again from round 1
      const stop = TIERS[e.tier].events.filter(x => x.stop === e.stop).map(x => x.id);
      p.career.won = p.career.won.filter(x => !stop.includes(x));
      if (!p.career.seen.includes('flag:knocked')) p.career.seen.push('flag:knocked');
    }
    p.career.streak = won ? p.career.streak + 1 : 0;
    const g = activeGoal();
    if (g && g.check({ won, gamesLost, streak: p.career.streak, id: e.id, stage: e.stage })) { p.career.goals.push(g.id); xp += g.xp; rp += g.rp; goal = g.text }
    p.career.rp += rp;
  }
  if (first || prize || e.rival || e.stop) saveProfile();
  const before = new Set(profile().unlocked);
  const levels = addXp(xp);
  let tierDone: string | undefined;
  if (first && e.final) { tierDone = TIERS[e.tier].name; const r = TIERS[e.tier].reward; if (r) unlock(r) }
  for (const id of profile().unlocked) if (!before.has(id)) unlocked.push((TRAILS.find(t => t.id === id)?.name || id) + ' TRAIL');
  const last = ALL_EVENTS.every(x => profile().career.won.includes(x.id));
  const free = !!TIERS[e.tier].free;
  // back to the career panel when the town map needs a pick, or a tournament ended (story scenes play there)
  const toMap = (done && free) || !!knocked || (won && e.stage === 'FINAL');
  if ((won && !toMap) || knocked) CAREER.event = nextEvent();
  const extra = { knocked, rp, rank: worldRank(), rankBefore, goal };
  return { xp, levels, unlocked, tierDone, won, last, prize, dareMissed, rival: !!e.rival && first, toMap, free, ...extra };
}

/** XP for winning an event the first time. */
export function xpForWin(e: { tier: number; final?: boolean }) { return 60 + 25 * e.tier + (e.final ? 40 : 0) }
