import { describe, it, expect } from 'vitest';
import { S } from '../src/state.js';
import { gradeFor, setCrowd, GRADES } from '../src/render/grades.js';

describe('court grades', () => {
  it('maps career events from street court to world finals arena', () => {
    expect(gradeFor({ id: 'a1_roof', venue: 'roof' })).toBe(1);
    expect(gradeFor({ id: 'a1_king', venue: 'sunset' })).toBe(2);
    expect(gradeFor({ id: 'a1_ware', venue: 'ware' })).toBe(3);
    expect(gradeFor({ id: 'b_riga1' })).toBe(5);
    expect(gradeFor({ id: 'e_mos3' })).toBe(6);
    expect(gradeFor({ id: 'p_mad1' })).toBe(7);
    expect(gradeFor({ id: 'p_fin' })).toBe(8);
    expect(gradeFor({ id: 'd_riga', doubles: true, tier: 1 })).toBe(5);
    expect(gradeFor({ id: 's12_2' })).toBe(8);
    expect(gradeFor(null)).toBe(0);
  });
  it('the crowd grows with the grade', () => {
    const n = g => { setCrowd(g); return S.spectators.length };
    expect(n(1)).toBe(GRADES[1].crowd);
    expect(n(8)).toBeGreaterThan(n(5));
    expect(n(5)).toBeGreaterThan(n(1));
    setCrowd(0); expect(S.spectators.length).toBe(7);
  });
});
