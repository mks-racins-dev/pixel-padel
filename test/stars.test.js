import { describe, it, expect, beforeEach } from 'vitest';
import { profile, migrate } from '../src/meta/profile.ts';
import { emit } from '../src/meta/events.ts';
import { worldRank, START_RANK } from '../src/meta/career.ts';
import { starGoals, resetStars, finishStars, eventStars, totalStars } from '../src/meta/stars.ts';

describe('match stars', () => {
  beforeEach(() => localStorage.clear());
  it('each event has two different fixed side goals', () => {
    const [a, b] = starGoals('a1_roof');
    expect(a.id).not.toBe(b.id);
    expect(starGoals('a1_roof')[0].id).toBe(a.id);
  });
  it('scores the win plus goals from the match events, and keeps the best', () => {
    resetStars();
    for (let i = 0; i < 12; i++) emit({ type: 'point', won: true, wall: true, reason: '', golden: true });
    for (const s of ['bandeja', 'bandeja', 'bandeja', 'lob', 'lob', 'lob', 'lob', 'smash', 'smash', 'vibora']) emit({ type: 'shot', shot: s, offWall: false });
    const r = finishStars('a1_roof', true, 0);
    expect(r.total).toBe(3); expect(r.newStars).toBe(3); expect(r.xp).toBe(45);
    resetStars();
    const r2 = finishStars('a1_roof', false, 3);
    expect(r2.newStars).toBe(0);
    expect(eventStars('a1_roof')).toBe(3); expect(totalStars()).toBe(3);
  });
  it('stars survive a save round trip', () => {
    const p = migrate({ career: { stars: { a1_roof: 2, bad: 9 } } });
    expect(p.career.stars.a1_roof).toBe(2); expect(p.career.stars.bad).toBe(3);
  });
  it('world rank starts at #2000', () => {
    expect(worldRank(0)).toBe(START_RANK);
    expect(worldRank(240)).toBeLessThan(250);
  });
});
