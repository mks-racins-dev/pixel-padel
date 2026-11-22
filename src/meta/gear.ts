// Coins and the pro shop: rackets, shoes and grips. Gear adds small stat boosts in career
// matches and changes how you look (racket frame and shoe colours). Better gear unlocks
// as the story moves on, so the shop always has something new to save up for.
import { profile, saveProfile } from './profile.ts';

export type Slot = 'racket' | 'shoes' | 'grip';
export interface Gear { id: string; slot: Slot; name: string; price: number; stats: Partial<Record<'spd' | 'pow' | 'acc' | 'wall', number>>; color: string; needs?: string; needsText?: string }
export const GEAR: Gear[] = [
  { id: 'r_wood', slot: 'racket', name: 'OLD GARAGE RACKET', price: 0, stats: {}, color: '#8a5a3c' },
  { id: 'r_club', slot: 'racket', name: 'CLUB CARBON', price: 120, stats: { pow: 0.25 }, color: '#3fa7a8' },
  { id: 'r_amber', slot: 'racket', name: 'AMBER STRIKE', price: 400, stats: { pow: 0.5, acc: 0.25 }, color: '#f2a03c', needs: 'b_riga3', needsText: 'WIN THE RIGA OPEN' },
  { id: 'r_viper', slot: 'racket', name: 'VIPER PRO', price: 900, stats: { pow: 0.75, acc: 0.5 }, color: '#6fae5f', needs: 'e_min3', needsText: 'WIN THE MINSK CHALLENGER' },
  { id: 'r_gold', slot: 'racket', name: 'GOLD MAESTRO', price: 2000, stats: { pow: 1, acc: 0.75 }, color: '#f2c14e', needs: 'p_mad3', needsText: 'WIN THE MADRID MASTER' },
  { id: 's_canvas', slot: 'shoes', name: 'CANVAS SNEAKERS', price: 0, stats: {}, color: '#f4f4f0' },
  { id: 's_grip', slot: 'shoes', name: 'COURT GRIP', price: 100, stats: { spd: 0.25 }, color: '#e4572e' },
  { id: 's_sand', slot: 'shoes', name: 'SAND RUNNER', price: 350, stats: { spd: 0.5 }, color: '#d9b26a', needs: 'a1_king', needsText: 'WIN KING OF THE COURT' },
  { id: 's_aero', slot: 'shoes', name: 'AERO 9', price: 800, stats: { spd: 0.75, wall: 0.25 }, color: '#6fe8ff', needs: 'e_min3', needsText: 'WIN THE MINSK CHALLENGER' },
  { id: 's_elite', slot: 'shoes', name: 'TOUR ELITE', price: 1800, stats: { spd: 1 }, color: '#ff6ad5', needs: 'p_mad3', needsText: 'WIN THE MADRID MASTER' },
  { id: 'g_tape', slot: 'grip', name: 'ELECTRICAL TAPE', price: 0, stats: {}, color: '#2b2633' },
  { id: 'g_tacky', slot: 'grip', name: 'TACKY GRIP', price: 80, stats: { acc: 0.25 }, color: '#f4ead2' },
  { id: 'g_wall', slot: 'grip', name: 'WALL MASTER', price: 450, stats: { wall: 0.5 }, color: '#8e6cc1', needs: 'b_tal2', needsText: 'WIN THE TALLINN CUP' },
  { id: 'g_pro', slot: 'grip', name: 'PRO OVERGRIP', price: 1000, stats: { acc: 0.5, wall: 0.5 }, color: '#e86a6a', needs: 'e_mos3', needsText: 'WIN MOSCOW NIGHTS' },
];
export const SLOTS: [Slot, string][] = [['racket', 'RACKET'], ['shoes', 'SHOES'], ['grip', 'GRIP']];

interface GearSave { coins: number; owned: string[]; eq: Record<Slot, string> }
export function gearState(): GearSave {
  const p = profile() as any; let s = p.gear as GearSave | undefined;
  if (!s || typeof s !== 'object' || !Array.isArray(s.owned) || typeof s.eq !== 'object') s = { coins: 0, owned: [], eq: {} as Record<Slot, string> };
  s.coins = Math.max(0, Math.floor(+s.coins || 0));
  for (const g of GEAR) if (!g.price && !s.owned.includes(g.id)) s.owned.push(g.id);
  for (const [slot] of SLOTS) if (!s.owned.includes(s.eq[slot])) s.eq[slot] = GEAR.find(g => g.slot === slot && !g.price)!.id;
  p.gear = s; return s;
}
export const coins = () => gearState().coins;
export function earnCoins(n: number) { if (n > 0) { gearState().coins += Math.round(n); saveProfile() } return Math.round(n) }

export const gearUnlocked = (g: Gear) => !g.needs || profile().career.won.includes(g.needs);
export const owns = (id: string) => gearState().owned.includes(id);
export const equipped = (slot: Slot) => GEAR.find(g => g.id === gearState().eq[slot])!;

export function buy(id: string): boolean {
  const g = GEAR.find(x => x.id === id), s = gearState();
  if (!g || owns(id) || !gearUnlocked(g) || s.coins < g.price) return false;
  s.coins -= g.price; s.owned.push(id); s.eq[g.slot] = id; saveProfile(); return true;
}
export function equip(id: string) { const g = GEAR.find(x => x.id === id); if (g && owns(id)) { gearState().eq[g.slot] = id; saveProfile() } }

/** Stat boosts from the equipped gear (added on top of the career skills). */
export function gearBonus() {
  const b = { spd: 0, pow: 0, acc: 0, wall: 0 };
  for (const [slot] of SLOTS) for (const [k, v] of Object.entries(equipped(slot).stats)) b[k as keyof typeof b] += v || 0;
  return b;
}
/** Your look with the equipped racket frame and shoe colours. */
export function gearLook<T extends { id: string; frame: string }>(look: T): T & { shoe: string } {
  const r = equipped('racket'), sh = equipped('shoes');
  return { ...look, id: look.id + '_' + r.id + sh.id, frame: r.color, shoe: sh.color };
}

/** Coins for a finished match (career, doubles and season). */
export function matchCoins(won: boolean, tier: number, first: boolean, newStars = 0) {
  return (won ? 20 + 12 * tier + (first ? 30 : 0) : 6) + newStars * 10;
}
