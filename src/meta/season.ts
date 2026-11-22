// Endless seasons: after the story career, every week brings 3 title defences as world #1.
// Opponents, venues and match seeds come from the week number, so a week is the same for everyone.
// The defences can be played in any order and retried; winning all 3 in a week defends the title.
// Weeks in a row with the title defended build a streak; 3 in a row unlocks the crown trail.
import { mulberry } from '../core/gfx.js';
import { profile, saveProfile, addXp, unlock } from './profile.ts';
import { weekNumber } from './challenges.ts';
import { CAREER, ALL_EVENTS, type CourtMods } from './career.ts';

const RIVALS = [
  { opp: 'EL MAESTRO', style: 'sniper' }, { opp: 'RUTA', style: 'speed' }, { opp: 'DASHA', style: 'sniper' },
  { opp: 'BROOKE', style: 'speed' }, { opp: 'ALVARO', style: 'power' }, { opp: 'MART', style: 'power' },
  { opp: 'LUCIA', style: 'sniper' }, { opp: 'JAY', style: 'power' }, { opp: 'IGOR', style: 'allround' },
];
const VENUES = ['es', 'us', 'ru', 'lt', 'lv', 'ee', 'by', 'sunset'];
/** Street courts for the weekly legend match, with their twists (taken from Act 1). */
const LEGEND = ['a1_roof', 'a1_market', 'a1_camp', 'a1_ware'];
export const CROWN_STREAK = 3;

export interface SeasonEvent { id: string; opp: string; style: string; venue: string; games: number; skill: number; seed: number; tier: number; label: string; place?: string; twist?: string; court?: CourtMods; final?: boolean }

/** The 3 title defences for a week. Later seasons get a little harder, capped just past El Maestro. */
export function seasonFor(week = weekNumber(), defended = seasonState().total): SeasonEvent[] {
  const r = mulberry((week * 2246822519) >>> 0);
  const pool = RIVALS.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
  const base = Math.min(1.08, 0.9 + defended * 0.01);
  const lid = LEGEND[Math.floor(r() * LEGEND.length)]; const legend = ALL_EVENTS.find(e => e.id === lid)!;
  return [0, 1, 2].map(i => {
    const v = VENUES[Math.floor(r() * VENUES.length)];
    const ev: SeasonEvent = { id: `s${week}_${i}`, ...pool[i], venue: v, games: 4, skill: base + i * 0.04, seed: (week * 7919 + i * 101 + 7) >>> 0, tier: 3, label: ['OPENER', 'LEGEND MATCH', 'HEADLINER'][i] };
    if (i === 1) Object.assign(ev, { venue: legend.venue, place: legend.place, twist: legend.twist, court: legend.court, games: 3 });
    if (i === 2) ev.games = 5;
    return ev;
  });
}

interface SeasonSave { week: number; won: number[]; total: number; streak: number; best: number; lastWeek: number }
const fresh = (week: number, old?: Partial<SeasonSave>): SeasonSave => ({ week, won: [], total: old?.total || 0, streak: old?.streak || 0, best: old?.best || 0, lastWeek: old?.lastWeek ?? -9 });

/** This week's progress. A new week keeps the totals; the streak ends if last week was not defended. */
export function seasonState(week = weekNumber()): SeasonSave {
  const p = profile() as any;
  let s = p.season as SeasonSave | undefined;
  const ok = s && typeof s === 'object' && Array.isArray(s.won) && typeof s.total === 'number';
  if (!ok) s = fresh(week);
  else if (s!.week !== week) s = fresh(week, s);
  if (s!.lastWeek < week - 1) s!.streak = 0;
  p.season = s; return s!;
}

/** Seasons open once the story career is finished. */
export const seasonsOpen = () => profile().career.won.includes('p_fin');

export function startSeasonEvent(i: number) {
  CAREER.active = true; CAREER.toMap = false; CAREER.kind = 'season';
  CAREER.event = seasonFor()[i] as any;
}

export interface SeasonResult { won: boolean; xp: number; defended: boolean; streak: number; crown: boolean; left: number }
export function finishSeasonMatch(won: boolean, gamesWon: number): SeasonResult {
  const ev = CAREER.event as unknown as SeasonEvent, st = seasonState(), i = +ev.id.split('_')[1];
  let xp = won ? 120 + i * 30 : 25 + 8 * gamesWon, defended = false, crown = false;
  if (won && !st.won.includes(i)) {
    st.won.push(i);
    if (st.won.length === 3) {
      defended = true; xp += 300; st.total++;
      st.streak = st.lastWeek === st.week - 1 ? st.streak + 1 : 1;
      st.lastWeek = st.week; st.best = Math.max(st.best, st.streak);
      if (st.streak >= CROWN_STREAK) crown = unlock('crown');
    }
  } else if (won) xp = 60; // replaying a defence already won this week
  saveProfile(); addXp(xp);
  CAREER.toMap = true; // back to the season screen to pick the next defence
  return { won, xp, defended, streak: st.streak, crown, left: 3 - st.won.length };
}
