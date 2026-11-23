import { describe, it, expect } from 'vitest';
import { drillStars } from '../src/game/practice.js';
import { applyKeys, SCHEMES } from '../src/input/input.js';
import { streak } from '../src/meta/challenges.ts';

describe('menu helpers', () => {
  it('drill stars: clean run 3, up to twice the balls 2, else 1', () => {
    expect(drillStars(5, 5)).toBe(3); expect(drillStars(5, 6)).toBe(3);
    expect(drillStars(5, 10)).toBe(2); expect(drillStars(5, 11)).toBe(1);
  });
  it('custom keys go first and are taken out of the other actions', () => {
    applyKeys({ drive: 'KeyK' });
    expect(SCHEMES.solo.drive[0]).toBe('KeyK');
    expect(SCHEMES.solo.lob).not.toContain('KeyK');
    applyKeys({});
    expect(SCHEMES.solo.drive).toEqual(['Space', 'KeyJ']);
    expect(SCHEMES.solo.lob[0]).toBe('KeyK');
  });
  it('a new profile has no daily streak and no chest yet', () => {
    const s = streak(); expect(s.n).toBe(0); expect(s.chest).toBe(false);
  });
});
