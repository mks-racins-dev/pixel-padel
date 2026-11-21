// Seeded RNG for everything that affects the simulation (ball, rules, AI).
// Cosmetics (mascot, sounds, screen shake) keep using Math.random so they never
// change the outcome of a rally. Same seed + same inputs => same match.
// The state is a single number so the game server can save and restore it per match.
// Algorithm: mulberry32 (the same one gfx.js uses for scenery).

let seed = 1;
let a = 1;

export function seedSim(s: number): number { seed = s >>> 0; a = seed; return seed }
export function simSeed(): number { return seed }
export function rand(): number {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/** Current generator state, for saving a match. */
export function rngState(): [number, number] { return [seed, a] }
export function setRngState(st: [number, number]) { seed = st[0]; a = st[1] }
