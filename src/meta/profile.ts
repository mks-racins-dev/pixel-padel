// The player's saved progress: XP, level, skill points, career results and unlocks.
// Stored in localStorage under one versioned key so later versions can migrate old saves.

export type Stat = 'spd' | 'pow' | 'acc' | 'wall';
export interface Profile {
  v: number;
  xp: number;              // XP into the current level
  level: number;
  points: number;          // unspent skill points
  alloc: Record<Stat, number>;
  career: { won: string[] };   // ids of won career events
  unlocked: string[];      // cosmetic ids (trails)
  trail: string;           // equipped trail
  ch?: unknown;            // daily/weekly challenge progress (shape checked by challenges.ts)
  cup?: unknown;           // weekly cup best result (shape checked by cup.ts)
}

const KEY = 'pixelpadel-profile';
const VERSION = 1;
export const MAX_LEVEL = 30;
export const MAX_ALLOC = 8;     // points per stat
export const PER_POINT = 0.25;  // stat gain per point (styles use a 1–5 scale)

const fresh = (): Profile => ({ v: VERSION, xp: 0, level: 1, points: 0, alloc: { spd: 0, pow: 0, acc: 0, wall: 0 }, career: { won: [] }, unlocked: ['classic'], trail: 'classic' });

let cur: Profile | null = null;

/** Brings any older or partial save up to the current shape. */
export function migrate(raw: unknown): Profile {
  const p = fresh();
  if (!raw || typeof raw !== 'object') return p;
  const r = raw as Partial<Profile>;
  const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, Math.floor(v))) : d);
  p.level = num(r.level, 1, MAX_LEVEL, 1);
  p.xp = num(r.xp, 0, 1e6, 0);
  p.points = num(r.points, 0, MAX_LEVEL * 2, 0);
  for (const k of Object.keys(p.alloc) as Stat[]) p.alloc[k] = num(r.alloc?.[k], 0, MAX_ALLOC, 0);
  if (Array.isArray(r.career?.won)) p.career.won = r.career!.won.filter(x => typeof x === 'string');
  if (Array.isArray(r.unlocked)) p.unlocked = [...new Set(['classic', ...r.unlocked.filter(x => typeof x === 'string')])];
  p.trail = typeof r.trail === 'string' && p.unlocked.includes(r.trail) ? r.trail : 'classic';
  if (r.ch && typeof r.ch === 'object') p.ch = r.ch;
  if (r.cup && typeof r.cup === 'object') p.cup = r.cup;
  return p;
}

export function profile(): Profile {
  if (!cur) { let raw = null; try { raw = JSON.parse(localStorage.getItem(KEY) || 'null') } catch (e) {} cur = migrate(raw) }
  return cur;
}
export function saveProfile() { try { localStorage.setItem(KEY, JSON.stringify(profile())) } catch (e) {} }
export function resetProfileCache() { cur = null }

/** XP needed to go from `level` to the next one. */
export const xpToNext = (level: number) => 100 + 60 * (level - 1);

/** Adds XP, levels up as needed. Each level gives one skill point. Returns the levels gained. */
export function addXp(n: number): number {
  const p = profile(); let gained = 0;
  p.xp += Math.max(0, Math.round(n));
  while (p.level < MAX_LEVEL && p.xp >= xpToNext(p.level)) { p.xp -= xpToNext(p.level); p.level++; p.points++; gained++ }
  if (p.level >= MAX_LEVEL) p.xp = 0;
  for (const u of LEVEL_UNLOCKS) if (p.level >= u.level && !p.unlocked.includes(u.id)) p.unlocked.push(u.id);
  saveProfile();
  return gained;
}

export function spendPoint(stat: Stat): boolean {
  const p = profile();
  if (p.points <= 0 || p.alloc[stat] >= MAX_ALLOC) return false;
  p.points--; p.alloc[stat]++; saveProfile(); return true;
}
export function refundPoints() { const p = profile(); for (const k of Object.keys(p.alloc) as Stat[]) { p.points += p.alloc[k]; p.alloc[k] = 0 } saveProfile() }

/** Player stats for career matches: the chosen play style plus spent skill points. */
export function careerSkills(base: { spd: number; pow: number; acc: number }) {
  const a = profile().alloc;
  return { ...base, spd: base.spd + a.spd * PER_POINT, pow: base.pow + a.pow * PER_POINT, acc: base.acc + a.acc * PER_POINT, wall: a.wall * PER_POINT };
}

export function unlock(id: string): boolean { const p = profile(); if (p.unlocked.includes(id)) return false; p.unlocked.push(id); saveProfile(); return true }
export function equipTrail(id: string) { const p = profile(); if (p.unlocked.includes(id)) { p.trail = id; saveProfile() } }

/* ---------------- cosmetics ---------------- */
export interface Trail { id: string; name: string; color: (i: number, t: number) => string }
export const TRAILS: Trail[] = [
  { id: 'classic', name: 'CLASSIC', color: i => `rgba(226,239,60,${0.12 + i * 0.07})` },
  { id: 'ice', name: 'ICE', color: i => `rgba(150,225,255,${0.15 + i * 0.09})` },
  { id: 'fire', name: 'FIRE', color: i => (i % 2 ? `rgba(255,140,60,${0.2 + i * 0.1})` : `rgba(255,210,90,${0.2 + i * 0.1})`) },
  { id: 'mint', name: 'MINT', color: i => `rgba(120,240,180,${0.15 + i * 0.09})` },
  { id: 'gold', name: 'GOLD', color: i => `rgba(242,193,78,${0.25 + i * 0.1})` },
  { id: 'rainbow', name: 'RAINBOW', color: (i, t) => `hsla(${(i * 50 + t * 300) % 360},90%,65%,${0.3 + i * 0.1})` },
];
/** Trails unlocked by reaching a level (the rest come from career finals). */
export const LEVEL_UNLOCKS = [{ level: 3, id: 'ice' }, { level: 6, id: 'mint' }, { level: 12, id: 'rainbow' }];
export const trailColor = (i: number, t: number) => (TRAILS.find(x => x.id === profile().trail) || TRAILS[0]).color(i, t);
