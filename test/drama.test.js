import { describe, it, expect } from 'vitest';
import { pointDrama } from '../src/render/drama.ts';

describe('match drama', () => {
  it('flags match point and golden point', () => {
    expect(pointDrama({ pts: [3, 1], games: [2, 0] }, 3)).toBe('MATCH POINT');
    expect(pointDrama({ pts: [0, 3], games: [1, 2] }, 3)).toBe('MATCH POINT');
    expect(pointDrama({ pts: [3, 3], games: [2, 2] }, 3)).toBe('MATCH POINT');
    expect(pointDrama({ pts: [3, 3], games: [0, 1] }, 3)).toBe('GOLDEN POINT');
    expect(pointDrama({ pts: [3, 1], games: [0, 0] }, 3)).toBe('');
  });
});
