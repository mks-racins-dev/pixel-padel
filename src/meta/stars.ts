// Match stars (career): ★ for the win, plus two side goals picked per event.
// The best result per event is saved; each new star pays bonus XP once.
import { on } from './events.ts';
import { profile, saveProfile } from './profile.ts';

interface Stats { shots: Record<string, number>; wallPts: number; doubleFaults: number; golden: number; pts: number; lostPts: number }
export interface StarResult { goals: string[]; got: boolean[]; total: number; best: number; newStars: number; xp: number }
interface Goal { id: string; text: string; ok: (s: Stats, r: { won: boolean; gamesLost: number }) => boolean }

export const STAR_GOALS: Goal[] = [
  { id: 'wall', text: 'WIN A POINT OFF THE GLASS', ok: s => s.wallPts >= 1 },
  { id: 'nodf', text: 'NO DOUBLE FAULTS', ok: (s, r) => r.won && s.doubleFaults === 0 },
  { id: 'clean', text: 'LOSE AT MOST 1 GAME', ok: (s, r) => r.won && r.gamesLost <= 1 },
  { id: 'bandeja', text: 'HIT 3 BANDEJAS', ok: s => (s.shots.bandeja || 0) >= 3 },
  { id: 'lob', text: 'HIT 4 LOBS', ok: s => (s.shots.lob || 0) >= 4 },
  { id: 'smash', text: 'HIT 2 SMASHES', ok: s => (s.shots.smash || 0) + (s.shots.portres || 0) >= 2 },
  { id: 'vibora', text: 'HIT A VIBORA', ok: s => (s.shots.vibora || 0) >= 1 },
  { id: 'golden', text: 'WIN A GOLDEN POINT', ok: s => s.golden >= 1 },
  { id: 'pts', text: 'WIN 12 POINTS', ok: s => s.pts >= 12 },
];

const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h };
/** The two side goals of an event (always the same for that event). */
export function starGoals(id: string): Goal[] {
  const h = hash(id), a = h % STAR_GOALS.length, b = (a + 1 + (h >>> 8) % (STAR_GOALS.length - 1)) % STAR_GOALS.length;
  return [STAR_GOALS[a], STAR_GOALS[b]];
}

let st: Stats = { shots: {}, wallPts: 0, doubleFaults: 0, golden: 0, pts: 0, lostPts: 0 }, tracking = false;
export function resetStars(track = true) { st = { shots: {}, wallPts: 0, doubleFaults: 0, golden: 0, pts: 0, lostPts: 0 }; tracking = track }
on(e => {
  if (!tracking) return;
  if (e.type === 'shot') st.shots[e.shot] = (st.shots[e.shot] || 0) + 1;
  if (e.type === 'point') { if (e.won) { st.pts++; if (e.wall) st.wallPts++; if (e.golden) st.golden++ } else { st.lostPts++; if (e.reason === 'DOUBLE FAULT') st.doubleFaults++ } }
});
export const matchStats = () => st;

const store = () => { const c = profile().career as any; if (!c.stars || typeof c.stars !== 'object') c.stars = {}; return c.stars as Record<string, number> };
export const eventStars = (id: string) => store()[id] || 0;
export const totalStars = () => Object.values(store()).reduce((a, b) => a + b, 0);

/** Scores the finished match for an event and saves the best. */
export function finishStars(id: string, won: boolean, gamesLost: number): StarResult {
  tracking = false;
  const goals = starGoals(id), got = [won, ...goals.map(g => g.ok(st, { won, gamesLost }))];
  const total = got.filter(Boolean).length, prev = eventStars(id), newStars = Math.max(0, total - prev);
  if (newStars) { store()[id] = total; saveProfile() }
  return { goals: ['WIN THE MATCH', ...goals.map(g => g.text)], got, total, best: Math.max(prev, total), newStars, xp: newStars * 15 };
}
