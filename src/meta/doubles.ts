// Doubles in the career: partners met in the story, a doubles circuit against story pairs,
// and chemistry (0–100) with each partner that grows by playing together.
// Chemistry makes the partner play better and unlocks smarter positioning in the partner AI:
//   25: +level   50: both up / both back with you   75: covers the middle   100: +0.5 to all stats
import { profile, saveProfile, addXp } from './profile.ts';
import { CAREER, type CourtMods } from './career.ts';

export interface Partner { id: string; name: string; style: string; skill: number; unlock: (c: { won: string[]; seen: string[] }) => boolean; how: string }
export const PARTNERS: Partner[] = [
  { id: 'tomi', name: 'TOMI', style: 'allround', skill: 0.3, unlock: c => c.won.includes('a1_king'), how: 'WIN KING OF THE COURT' },
  { id: 'nora', name: 'NORA', style: 'speed', skill: 0.4, unlock: c => c.won.includes('a1_king') && c.won.includes('a1_market'), how: 'BEAT NORA, WIN KING OF THE COURT' },
  { id: 'mikko', name: 'MIKKO', style: 'power', skill: 0.5, unlock: c => c.won.includes('b_riga3'), how: 'WIN THE RIGA OPEN' },
  { id: 'ruta', name: 'RUTA', style: 'speed', skill: 0.75, unlock: c => c.seen.includes('ruta_sorry'), how: 'MAKE PEACE WITH RUTA IN MIAMI' },
  { id: 'maestro', name: 'EL MAESTRO', style: 'sniper', skill: 0.95, unlock: c => c.won.includes('p_fin'), how: 'BEAT EL MAESTRO' },
];

export interface DoublesEvent { id: string; opp: string; styles: [string, string]; venue: string; skill: number; games: number; needs: string; needsText: string; court?: CourtMods; tier: number; doubles: true }
export const DOUBLES: DoublesEvent[] = [
  { id: 'd_town', opp: 'PETE & VASQUEZ', styles: ['sniper', 'allround'], venue: 'roof', skill: 0.15, games: 2, needs: 'a1_king', needsText: 'WIN KING OF THE COURT', court: { wind: 0.7 }, tier: 0, doubles: true },
  { id: 'd_riga', opp: 'JANIS & ARTURS', styles: ['allround', 'power'], venue: 'lv', skill: 0.38, games: 3, needs: 'b_riga3', needsText: 'WIN THE RIGA OPEN', tier: 1, doubles: true },
  { id: 'd_tallinn', opp: 'KAIA & MART', styles: ['speed', 'power'], venue: 'ee', skill: 0.48, games: 3, needs: 'b_tal2', needsText: 'WIN THE TALLINN CUP', tier: 1, doubles: true },
  { id: 'd_minsk', opp: 'OKSANA & VIKTOR', styles: ['speed', 'allround'], venue: 'by', skill: 0.62, games: 3, needs: 'e_min3', needsText: 'WIN THE MINSK CHALLENGER', tier: 2, doubles: true },
  { id: 'd_moscow', opp: 'RUTA & DASHA', styles: ['speed', 'sniper'], venue: 'ru', skill: 0.76, games: 3, needs: 'e_mos3', needsText: 'WIN MOSCOW NIGHTS', tier: 2, doubles: true },
  { id: 'd_madrid', opp: 'EL MAESTRO & ALVARO', styles: ['sniper', 'power'], venue: 'es', skill: 0.95, games: 4, needs: 'p_fin', needsText: 'WIN THE WORLD FINALS', tier: 3, doubles: true },
];

interface DoublesSave { partner: string; chem: Record<string, number>; won: string[] }
export function doublesState(): DoublesSave {
  const p = profile() as any; let s = p.doubles as DoublesSave | undefined;
  if (!s || typeof s !== 'object' || typeof s.chem !== 'object' || !Array.isArray(s.won)) s = { partner: '', chem: {}, won: [] };
  p.doubles = s; return s;
}

export const partnerUnlocked = (id: string) => !!PARTNERS.find(x => x.id === id)?.unlock(profile().career);
export const unlockedPartners = () => PARTNERS.filter(x => x.unlock(profile().career));
export const doublesOpen = () => unlockedPartners().length > 0;
export const chemistry = (id: string) => Math.max(0, Math.min(100, Math.round(doublesState().chem[id] || 0)));
/** The partner you play with: the chosen one if still unlocked, otherwise the first unlocked. */
export function currentPartner(): Partner | undefined {
  const s = doublesState(), list = unlockedPartners();
  return list.find(x => x.id === s.partner) || list[0];
}
export function choosePartner(id: string) { if (partnerUnlocked(id)) { doublesState().partner = id; saveProfile() } }

/** A doubles event is open when its story requirement is met and the one before it is won. */
export function doublesEventOpen(id: string) {
  const i = DOUBLES.findIndex(e => e.id === id); if (i < 0) return false;
  const c = profile().career;
  return c.won.includes(DOUBLES[i].needs) && (i === 0 || doublesState().won.includes(DOUBLES[i - 1].id));
}

/** What chemistry does for the partner AI and stats. */
export const chemPerks = (chem: number) => ({ skill: chem / 100 * 0.15, mirror: chem >= 50, middle: chem >= 75, bonus: chem >= 100 ? 0.5 : 0 });
export const CHEM_STEPS: [number, string][] = [[25, 'PLAYS A LEVEL UP'], [50, 'BOTH UP, BOTH BACK WITH YOU'], [75, 'COVERS THE MIDDLE'], [100, '+0.5 TO ALL STATS']];

export function startDoublesEvent(id: string) {
  const e = DOUBLES.find(x => x.id === id), pa = currentPartner(); if (!e || !pa) return;
  CAREER.active = true; CAREER.toMap = false; CAREER.kind = 'doubles';
  CAREER.event = { ...e, style: e.styles[0], partner: pa.id } as any;
}

export interface DoublesResult { won: boolean; xp: number; chem: number; gained: number; perk?: string; first: boolean; partner: string }
export function finishDoublesMatch(won: boolean, gamesWon: number): DoublesResult {
  const e = CAREER.event as any, s = doublesState(), pa = PARTNERS.find(x => x.id === e.partner)!;
  const first = won && !s.won.includes(e.id);
  if (first) s.won.push(e.id);
  const before = chemistry(pa.id), gained = won ? 12 : 4;
  s.chem[pa.id] = Math.min(100, before + gained);
  const after = chemistry(pa.id);
  const perk = CHEM_STEPS.find(([n]) => before < n && after >= n)?.[1];
  const xp = won ? (first ? 90 + 30 * e.tier : 45) : 15 + 6 * gamesWon;
  saveProfile(); addXp(xp);
  CAREER.toMap = true;
  return { won, xp, chem: after, gained: after - before, perk, first, partner: pa.name };
}
