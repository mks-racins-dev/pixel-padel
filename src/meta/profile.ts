// The player's saved progress: XP, level, skill points, career results and unlocks.
// Stored in localStorage under one versioned key so later versions can migrate old saves.

export type Stat = 'spd' | 'pow' | 'acc' | 'wall';
export interface Profile {
  v: number;
  xp: number;              // XP into the current level
  level: number;
  points: number;          // unspent skill points
  alloc: Record<Stat, number>;
  career: { won: string[]; dares: string[]; seen: string[]; rp: number; goals: string[]; streak: number; identity: string; press: string[] }; // events done, dares won, scenes seen, ranking points, sponsor goals done, tour win streak
  unlocked: string[];      // cosmetic ids (trails)
  trail: string;           // equipped trail
  name: string;            // nickname shown to opponents and on the leaderboard ('' = not chosen yet)
  updatedAt: number;       // last change, for picking the newer of the local and cloud save
  ch?: unknown;            // daily/weekly challenge progress (shape checked by challenges.ts)
  cup?: unknown;           // weekly cup best result (shape checked by cup.ts)
}

const KEY = 'pixelpadel-profile';
const VERSION = 1;
export const MAX_LEVEL = 30;
export const MAX_ALLOC = 8;     // points per stat
export const PER_POINT = 0.25;  // stat gain per point (styles use a 1–5 scale)

const fresh = (): Profile => ({ v: VERSION, xp: 0, level: 1, points: 0, alloc: { spd: 0, pow: 0, acc: 0, wall: 0 }, career: { won: [], dares: [], seen: [], rp: 0, goals: [], streak: 0, identity: '', press: [] }, unlocked: ['classic'], trail: 'classic', name: '', updatedAt: 0 });

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
  const strs = (a: unknown) => (Array.isArray(a) ? a.filter(x => typeof x === 'string') as string[] : []);
  p.career.won = strs(r.career?.won); p.career.dares = strs(r.career?.dares); p.career.seen = strs(r.career?.seen);
  p.career.goals = strs(r.career?.goals); p.career.press = strs(r.career?.press); p.career.rp = num(r.career?.rp, 0, 1e5, 0); p.career.streak = num(r.career?.streak, 0, 1e4, 0);
  p.career.identity = ['wall', 'smash', 'counter'].includes(r.career?.identity as string) ? r.career!.identity : '';
  // saves from before Act 1: the old 3-match club ladder maps onto the town courts
  const LEGACY: Record<string, string[]> = { club1: ['a1_tomi'], club2: ['a1_market'], club3: ['a1_roof', 'a1_camp', 'a1_ware', 'a1_ruta', 'a1_king'],
    bal1: ['b_riga1', 'b_riga2', 'b_riga3'], bal2: ['b_tal1', 'b_tal2'], bal3: ['b_vil1', 'b_vil2'],
    east1: ['e_min1', 'e_min2', 'e_min3'], east2: ['e_mos1', 'e_mos2'], east3: ['e_mos3'],
    pro1: ['p_mad1', 'p_mad2', 'p_mad3'], pro2: ['p_mia1', 'p_mia2'], pro3: ['p_fin'] };
  for (const [old, now] of Object.entries(LEGACY)) if (p.career.won.includes(old)) {
    p.career.won = p.career.won.filter(x => x !== old);
    for (const n of now) if (!p.career.won.includes(n)) p.career.won.push(n);
  }
  if (p.career.won.includes('a1_tomi')) for (const k of ['intro', 'ray']) if (!p.career.seen.includes(k)) p.career.seen.push(k);
  if (p.career.won.includes('a1_king')) for (const k of ['ruta', 'ruta_loss', 'king', 'act1']) if (!p.career.seen.includes(k)) p.career.seen.push(k);
  const seenIf = (id: string, ks: string[]) => { if (p.career.won.includes(id)) for (const k of ks) if (!p.career.seen.includes(k)) p.career.seen.push(k) };
  seenIf('b_riga1', ['van1']); seenIf('b_riga3', ['riga_win', 'sponsor']); seenIf('b_tal1', ['van2']); seenIf('b_vil1', ['van3']); seenIf('b_vil2', ['ruta2', 'act2']);
  seenIf('e_min1', ['ray_sick']); seenIf('e_min3', ['minsk_win']); seenIf('e_mos1', ['moscow']); seenIf('e_mos3', ['ruta_drop', 'act3']);
  seenIf('p_mad1', ['plane']); seenIf('p_mad3', ['madrid_win']); seenIf('p_mia1', ['miami']); seenIf('p_mia2', ['ruta_sorry']); seenIf('p_fin', ['maestro', 'act4', 'epilogue']);
  if (p.career.won.includes('p_mad3') && !p.career.press.some(x => x.startsWith('madrid:'))) p.career.press.push('madrid:humble');
  if (p.career.won.includes('p_mia2') && !p.career.press.some(x => x.startsWith('miami:'))) p.career.press.push('miami:humble');
  if (Array.isArray(r.unlocked)) p.unlocked = [...new Set(['classic', ...r.unlocked.filter(x => typeof x === 'string')])];
  p.trail = typeof r.trail === 'string' && p.unlocked.includes(r.trail) ? r.trail : 'classic';
  if (typeof r.name === 'string') p.name = r.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  p.updatedAt = num(r.updatedAt, 0, 1e15, 0);
  if (r.ch && typeof r.ch === 'object') p.ch = r.ch;
  if (r.cup && typeof r.cup === 'object') p.cup = r.cup;
  return p;
}

export function profile(): Profile {
  if (!cur) { let raw = null; try { raw = JSON.parse(localStorage.getItem(KEY) || 'null') } catch (e) {} cur = migrate(raw) }
  return cur;
}
const saveListeners: (() => void)[] = [];
/** Called after every local save (the cloud sync listens). */
export function onProfileSave(fn: () => void) { saveListeners.push(fn) }
export function saveProfile(touch = true) {
  const p = profile();
  if (touch) p.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch (e) {}
  if (touch) for (const f of saveListeners) f();
}
/** Replaces the local profile with one from the cloud. */
export function adoptProfile(raw: unknown) { cur = migrate(raw); saveProfile(false) }
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
  const a = profile().alloc, id = profile().career.identity;
  const b = id === 'wall' ? { wall: 1 } : id === 'smash' ? { pow: 0.75 } : id === 'counter' ? { spd: 0.5, acc: 0.5 } : {} as Record<string, number>;
  const x = (k: string) => (b as Record<string, number>)[k] || 0; // identity bonus (see IDENTITIES in career.ts)
  return { ...base, spd: base.spd + a.spd * PER_POINT + x('spd'), pow: base.pow + a.pow * PER_POINT + x('pow'), acc: base.acc + a.acc * PER_POINT + x('acc'), wall: a.wall * PER_POINT + x('wall') };
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
