import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { newMatch, diffOf, teamName, matchGames } from '../src/game/rules.js';
import { DIFF, STYLES } from '../src/game/constants.js';
import { settings } from '../src/game/settings.js';
import { profile, addXp, spendPoint, migrate, resetProfileCache, xpToNext, MAX_ALLOC } from '../src/meta/profile.ts';
import { CAREER, TIERS, ALL_EVENTS, nextEvent, startCareerEvent, finishCareerMatch, leaveCareer, oppDiff, tierUnlocked } from '../src/meta/career.ts';

beforeEach(() => { localStorage.clear(); resetProfileCache(); leaveCareer(); settings.mode = '1v1' });

describe('profile', () => {
  it('levels up and gives one skill point per level', () => {
    const gained = addXp(xpToNext(1) + xpToNext(2) + 5);
    expect(gained).toBe(2);
    expect(profile().level).toBe(3);
    expect(profile().points).toBe(2);
    expect(profile().xp).toBe(5);
  });
  it('unlocks the ice trail at level 3', () => {
    addXp(xpToNext(1) + xpToNext(2));
    expect(profile().unlocked).toContain('ice');
  });
  it('skill points are capped per stat', () => {
    profile().points = 20;
    for (let i = 0; i < 20; i++) spendPoint('pow');
    expect(profile().alloc.pow).toBe(MAX_ALLOC);
    expect(profile().points).toBe(20 - MAX_ALLOC);
  });
  it('survives a reload and repairs bad saves', () => {
    addXp(500); spendPoint('spd');
    resetProfileCache();
    expect(profile().alloc.spd).toBe(1);
    const fixed = migrate({ level: 999, alloc: { spd: -4, pow: 'x' }, unlocked: ['gold', 3], trail: 'nope' });
    expect(fixed.level).toBe(30);
    expect(fixed.alloc.spd).toBe(0);
    expect(fixed.unlocked).toEqual(['classic', 'gold']);
    expect(fixed.trail).toBe('classic');
  });
});

describe('career', () => {
  it('starts at the first club match and locks later tiers', () => {
    expect(nextEvent().id).toBe('club1');
    expect(tierUnlocked(1)).toBe(false);
  });
  it('opponents get harder along the tour', () => {
    const a = oppDiff(0, DIFF.easy, DIFF.hard), b = oppDiff(1, DIFF.easy, DIFF.hard);
    expect(b.spd).toBeGreaterThan(a.spd);
    expect(b.err).toBeLessThan(a.err);
    expect(b.spd).toBeGreaterThan(DIFF.hard.spd); // the last boss is beyond "hard"
  });
  it('a career match uses the event: opponent name, games, skills and difficulty', () => {
    profile().points = 4; spendPoint('spd'); spendPoint('spd'); spendPoint('wall');
    startCareerEvent();
    newMatch(false, 1);
    expect(S.players.length).toBe(2);
    expect(teamName(1)).toBe('TOMI');
    expect(matchGames()).toBe(2);
    expect(S.players[0].sk.spd).toBeCloseTo(STYLES[settings.style].spd + 0.5);
    expect(S.players[0].sk.wall).toBeCloseTo(0.25);
    expect(diffOf(S.players[1]).spd).toBeCloseTo(DIFF.easy.spd);
  });
  it('winning advances; winning a final completes the tier and unlocks its reward', () => {
    startCareerEvent();
    let r = finishCareerMatch(true, 2);
    expect(r.won).toBe(true);
    expect(nextEvent().id).toBe('club2');
    finishCareerMatch(true, 2);
    r = finishCareerMatch(true, 3);
    expect(r.tierDone).toBe(TIERS[0].name);
    expect(profile().unlocked).toContain('fire');
    expect(tierUnlocked(1)).toBe(true);
    expect(nextEvent().id).toBe('bal1');
  });
  it('losing gives some XP but does not advance', () => {
    startCareerEvent();
    const r = finishCareerMatch(false, 1);
    expect(r.xp).toBeGreaterThan(0);
    expect(nextEvent().id).toBe('club1');
  });
  it('quick matches are not affected by career progress', () => {
    profile().points = 2; spendPoint('pow'); spendPoint('pow');
    newMatch(false, 1);
    expect(S.players[0].sk).toBe(STYLES[settings.style]);
    expect(teamName(1)).toBe('CPU');
    expect(CAREER.active).toBe(false);
  });
  it('every event has a known venue', () => {
    for (const e of ALL_EVENTS) expect(['sunset', 'lv', 'ee', 'lt', 'es', 'by', 'us', 'ru']).toContain(e.venue);
  });
});
