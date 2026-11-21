// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { rate, rateMany, rateMatch, DEFAULT, seasonOf } from '../src/meta/glicko.ts';

describe('glicko-2', () => {
  it('matches the worked example from the Glicko-2 paper', () => {
    const out = rateMany({ r: 1500, rd: 200, vol: 0.06 }, [
      { opp: { r: 1400, rd: 30, vol: 0.06 }, score: 1 },
      { opp: { r: 1550, rd: 100, vol: 0.06 }, score: 0 },
      { opp: { r: 1700, rd: 300, vol: 0.06 }, score: 0 },
    ], false);
    expect(out.r).toBeCloseTo(1464.06, 1);
    expect(out.rd).toBeCloseTo(151.52, 1);
    expect(out.vol).toBeCloseTo(0.05999, 4);
  });
  it('the winner gains and the loser loses, symmetric for equal players', () => {
    const [w, l] = rateMatch(DEFAULT, DEFAULT);
    expect(w.r).toBeGreaterThan(1500);
    expect(l.r).toBeLessThan(1500);
    expect(Math.round(w.r - 1500)).toBe(Math.round(1500 - l.r));
    expect(w.rd).toBeLessThan(350);
  });
  it('beating a much stronger player is worth more than beating a weaker one', () => {
    const me = { r: 1500, rd: 100, vol: 0.06 };
    const upset = rate(me, { r: 1800, rd: 60, vol: 0.06 }, 1).r - 1500;
    const easy = rate(me, { r: 1200, rd: 60, vol: 0.06 }, 1).r - 1500;
    expect(upset).toBeGreaterThan(easy * 3);
  });
  it('uncertain new players move a lot, settled players move little', () => {
    const fresh = rate(DEFAULT, DEFAULT, 1).r - 1500;
    const settled = rate({ r: 1500, rd: 40, vol: 0.06 }, { r: 1500, rd: 40, vol: 0.06 }, 1).r - 1500;
    expect(fresh).toBeGreaterThan(settled * 4);
  });
  it('seasons are calendar months in UTC', () => {
    expect(seasonOf(Date.UTC(2026, 11, 31, 23))).toBe('2026-12');
    expect(seasonOf(Date.UTC(2027, 0, 1, 0))).toBe('2027-01');
  });
});
