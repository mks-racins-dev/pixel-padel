// Weekly Cup: a 3-round knockout that is the same for everyone in a given week.
// Opponents, venue and each match's random seed come from the week number.
// A loss ends the run; you can start a new run any time. The best result of the week is saved.
import { mulberry } from '../core/gfx.js';
import { profile, saveProfile, addXp } from './profile.ts';
import { weekNumber, cupFinalReached } from './challenges.ts';
import { CAREER } from './career.ts';

const NAMES = ['LUCA', 'MAJA', 'OSKAR', 'SOFIA', 'ARVO', 'LINA', 'DIEGO', 'EMMA', 'NIKO', 'ZOE', 'MATEO', 'INES', 'KARL', 'VERA'];
const VENUES = ['sunset', 'lv', 'ee', 'lt', 'es', 'by', 'us', 'ru'];
const STYLES = ['allround', 'speed', 'power', 'sniper'];
export const ROUNDS = ['QUARTER-FINAL', 'SEMI-FINAL', 'FINAL'];

export function cupFor(week = weekNumber()) {
  const r = mulberry(week * 2654435761 >>> 0);
  const venue = VENUES[Math.floor(r() * VENUES.length)];
  const names = NAMES.slice();
  for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [names[i], names[j]] = [names[j], names[i]] }
  return ROUNDS.map((round, i) => ({
    id: `cup${week}_${i}`, round, opp: names[i], venue, games: 2,
    skill: 0.45 + i * 0.2, style: STYLES[Math.floor(r() * STYLES.length)],
    seed: (week * 1000 + i * 37 + 11) >>> 0, tier: 1 + i, final: i === 2,
  }));
}

interface CupSave { week: number; best: number; champion: boolean }   // best = rounds won this week (0–3)
export function cupState(week = weekNumber()): CupSave {
  const p = profile() as any;
  let s: CupSave = p.cup;
  if (!s || typeof s !== 'object' || s.week !== week) s = { week, best: 0, champion: false };
  p.cup = s; return s;
}

/** The current run: which round you are on. Not saved, a run is one sitting. */
export const RUN = { round: 0 };

export function startCup(fresh: boolean) {
  if (fresh) RUN.round = 0;
  CAREER.active = true; CAREER.kind = 'cup';
  CAREER.event = cupFor()[RUN.round] as any;
}

export interface CupResult { won: boolean; round: string; xp: number; champion: boolean; over: boolean; best: number }
export function finishCupMatch(won: boolean): CupResult {
  const ev = cupFor()[RUN.round], st = cupState();
  let xp = won ? 30 + 20 * RUN.round : 10;
  let champion = false;
  if (won) {
    RUN.round++;
    if (RUN.round > st.best) st.best = RUN.round;
    if (RUN.round === 2) cupFinalReached();
    if (RUN.round === 3) { if (!st.champion) { xp += 150; st.champion = true } champion = true }
  }
  saveProfile(); addXp(xp);
  const over = !won || RUN.round >= 3;
  if (over) RUN.round = 0;
  return { won, round: ev.round, xp, champion, over, best: st.best };
}
