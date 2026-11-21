// Daily and weekly challenges. The set is picked from the calendar date with a seeded RNG,
// so every player gets the same challenges on the same day. Progress lives in the profile.
import { mulberry } from '../core/gfx.js';
import { profile, saveProfile, addXp } from './profile.ts';
import { on, GameEvent } from './events.ts';

export interface Challenge { id: string; text: string; need: number; xp: number; count: (e: GameEvent) => number }

const shot = (name: string) => (e: GameEvent) => (e.type === 'shot' && e.shot === name ? 1 : 0);
const win = (e: GameEvent) => (e.type === 'match' && e.won ? 1 : 0);

export const DAILY: Challenge[] = [
  { id: 'd_vib3', text: 'HIT 3 VIBORAS', need: 3, xp: 50, count: shot('vibora') },
  { id: 'd_band4', text: 'HIT 4 BANDEJAS', need: 4, xp: 40, count: shot('bandeja') },
  { id: 'd_smash5', text: 'HIT 5 SMASHES', need: 5, xp: 40, count: e => (e.type === 'shot' && (e.shot === 'smash' || e.shot === 'portres') ? 1 : 0) },
  { id: 'd_chiq3', text: 'HIT 3 CHIQUITAS', need: 3, xp: 40, count: shot('chiquita') },
  { id: 'd_lob5', text: 'HIT 5 LOBS', need: 5, xp: 30, count: shot('lob') },
  { id: 'd_wall3', text: 'HIT 3 SHOTS OFF THE BACK GLASS', need: 3, xp: 50, count: e => (e.type === 'shot' && e.offWall ? 1 : 0) },
  { id: 'd_pts15', text: 'WIN 15 POINTS', need: 15, xp: 40, count: e => (e.type === 'point' && e.won ? 1 : 0) },
  { id: 'd_win1', text: 'WIN A MATCH', need: 1, xp: 50, count: win },
  { id: 'd_gold', text: 'WIN A GOLDEN POINT', need: 1, xp: 60, count: e => (e.type === 'point' && e.won && e.golden ? 1 : 0) },
  { id: 'd_drill', text: 'FINISH A PRACTICE DRILL', need: 1, xp: 30, count: e => (e.type === 'drill' ? 1 : 0) },
  { id: 'd_cont', text: 'HIT A CONTRAPARED', need: 1, xp: 60, count: shot('contrapared') },
];
export const WEEKLY: Challenge[] = [
  { id: 'w_win5', text: 'WIN 5 MATCHES', need: 5, xp: 200, count: win },
  { id: 'w_career3', text: 'WIN 3 CAREER MATCHES', need: 3, xp: 220, count: e => (e.type === 'match' && e.won && e.career ? 1 : 0) },
  { id: 'w_clean', text: 'WIN A MATCH WITHOUT LOSING A GAME', need: 1, xp: 180, count: e => (e.type === 'match' && e.won && e.gamesLost === 0 ? 1 : 0) },
  { id: 'w_pt3', text: 'WIN 2 POINTS WITH A POR TRES', need: 2, xp: 220, count: e => (e.type === 'point' && e.won && e.reason === 'POR TRES!' ? 1 : 0) },
  { id: 'w_vib15', text: 'HIT 15 VIBORAS', need: 15, xp: 180, count: shot('vibora') },
  { id: 'w_wallpts', text: 'WIN 8 POINTS AFTER A WALL SHOT', need: 8, xp: 200, count: e => (e.type === 'point' && e.won && e.wall ? 1 : 0) },
  { id: 'w_venues', text: 'WIN MATCHES IN 3 DIFFERENT CITIES', need: 3, xp: 220, count: () => 0 }, // counted specially below
  { id: 'w_cup', text: 'REACH THE WEEKLY CUP FINAL', need: 1, xp: 150, count: () => 0 },   // reported by the cup
];

export const dayNumber = (t = Date.now()) => Math.floor((t - new Date(t).getTimezoneOffset() * 6e4) / 864e5);
export const weekNumber = (t = Date.now()) => Math.floor((dayNumber(t) + 3) / 7); // weeks start on Monday
export function msToNextDay(t = Date.now()) { const d = new Date(t); d.setHours(24, 0, 0, 0); return d.getTime() - t }

function pick<T>(pool: T[], n: number, seed: number): T[] {
  const r = mulberry(seed), a = pool.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a.slice(0, n);
}
export const dailySet = (day = dayNumber()) => pick(DAILY, 3, day * 7919 + 17);
export const weeklySet = (week = weekNumber()) => pick(WEEKLY, 3, week * 104729 + 3);

interface Slot { n: number; done: boolean; extra?: string[] }
export interface ChallengeState { day: number; week: number; daily: Record<string, Slot>; weekly: Record<string, Slot> }

/** Current challenge progress, reset when the day or week changes. */
export function chState(t = Date.now()): ChallengeState {
  const p = profile() as any;
  const ok = (o: any) => o && typeof o === 'object' && !Array.isArray(o);
  const st: ChallengeState = ok(p.ch) && ok(p.ch.daily) && ok(p.ch.weekly) ? p.ch : { day: -1, week: -1, daily: {}, weekly: {} };
  const d = dayNumber(t), w = weekNumber(t);
  if (st.day !== d) { st.day = d; st.daily = {} }
  if (st.week !== w) { st.week = w; st.weekly = {} }
  p.ch = st;
  return st;
}

/** Completed since the last call; shown on the end screen. */
const recent: { text: string; xp: number }[] = [];
export function takeRecent() { return recent.splice(0) }

function bump(list: Challenge[], slots: Record<string, Slot>, c: Challenge, by: number) {
  const s = slots[c.id] || (slots[c.id] = { n: 0, done: false });
  if (s.done || by <= 0) return;
  s.n = Math.min(c.need, s.n + by);
  if (s.n >= c.need) { s.done = true; recent.push({ text: c.text, xp: c.xp }); addXp(c.xp); onComplete?.(c) }
}
let onComplete: ((c: Challenge) => void) | null = null;
/** Lets the game show a pop-up when a challenge completes mid-match. */
export function onChallengeComplete(fn: (c: Challenge) => void) { onComplete = fn }

export function handle(e: GameEvent, t = Date.now()) {
  const st = chState(t);
  for (const c of dailySet(st.day)) bump(DAILY, st.daily, c, c.count(e));
  for (const c of weeklySet(st.week)) {
    let by = c.count(e);
    if (c.id === 'w_venues' && e.type === 'match' && e.won) {
      const s = st.weekly[c.id] || (st.weekly[c.id] = { n: 0, done: false, extra: [] });
      s.extra = s.extra || [];
      if (!s.extra.includes(e.venue)) { s.extra.push(e.venue); by = 1 }
    }
    bump(WEEKLY, st.weekly, c, by);
  }
  saveProfile();
}
/** The weekly cup reports reaching the final through this. */
export function cupFinalReached(t = Date.now()) {
  const st = chState(t), c = weeklySet(st.week).find(x => x.id === 'w_cup');
  if (c) { bump(WEEKLY, st.weekly, c, 1); saveProfile() }
}

on(e => handle(e));
