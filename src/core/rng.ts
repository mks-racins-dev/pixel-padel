// Seeded RNG for everything that affects the simulation (ball, rules, AI).
// Cosmetics (mascot, sounds, screen shake) keep using Math.random so they never
// change the outcome of a rally. Same seed + same inputs => same match.
import { mulberry } from './gfx.js';

let seed = 1;
let next: () => number = mulberry(seed);

export function seedSim(s: number): number { seed = s >>> 0; next = mulberry(seed); return seed }
export function simSeed(): number { return seed }
export function rand(): number { return next() }
