// @vitest-environment node
// The simulation must load and run without a page (no window/document): that is what the game server does.
import { describe, it, expect } from 'vitest';

describe('simulation without a browser', () => {
  it('imports and plays a seeded match with no DOM', async () => {
    expect(typeof document).toBe('undefined');
    const { S } = await import('../src/state.js');
    const { newMatch } = await import('../src/game/rules.js');
    const { update, STEP } = await import('../src/game/update.js');
    newMatch(true, 9);
    for (let t = 0; t < 10; t += STEP) update(STEP);
    expect(S.R0.hits).toBeGreaterThan(0);
  });
  it('rng state can be saved and restored', async () => {
    const { seedSim, rand, rngState, setRngState } = await import('../src/core/rng.ts');
    seedSim(42); rand(); const st = rngState(); const x = rand();
    rand(); rand(); setRngState(st);
    expect(rand()).toBe(x);
  });
  it('matches mulberry32 from gfx for the same seed', async () => {
    const { seedSim, rand } = await import('../src/core/rng.ts');
    // reference implementation (copied from core/gfx.js)
    const mul = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
    const ref = mul(7); seedSim(7);
    for (let i = 0; i < 5; i++) expect(rand()).toBe(ref());
  });
});
