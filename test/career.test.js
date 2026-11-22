import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { newMatch, diffOf, teamName, matchGames } from '../src/game/rules.js';
import { DIFF, STYLES } from '../src/game/constants.js';
import { settings } from '../src/game/settings.js';
import { profile, addXp, spendPoint, migrate, resetProfileCache, xpToNext, MAX_ALLOC } from '../src/meta/profile.ts';
import { CAREER, TIERS, ALL_EVENTS, nextEvent, startCareerEvent, finishCareerMatch, leaveCareer, oppDiff, tierUnlocked, eventOpen, prizes, streetRep } from '../src/meta/career.ts';
import { COURT } from '../src/game/physics.js';
import { stepBall } from '../src/game/physics.js';
import { pendingScene, preScene } from '../src/content/story.js';

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
    expect(nextEvent().id).toBe('a1_tomi');
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
  it('winning the town courts and the king of the court completes act 1 and unlocks its reward', () => {
    startCareerEvent();
    let r = finishCareerMatch(true, 2);
    expect(r.won).toBe(true);
    expect(r.toMap).toBe(true);
    for (const id of ['a1_roof', 'a1_market', 'a1_camp', 'a1_ware', 'a1_ruta']) { startCareerEvent(id); finishCareerMatch(true, 2) }
    startCareerEvent('a1_king');
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
    expect(nextEvent().id).toBe('a1_tomi');
  });
  it('quick matches are not affected by career progress', () => {
    profile().points = 2; spendPoint('pow'); spendPoint('pow');
    newMatch(false, 1);
    expect(S.players[0].sk).toBe(STYLES[settings.style]);
    expect(teamName(1)).toBe('CPU');
    expect(CAREER.active).toBe(false);
  });
  it('every event has a known venue', () => {
    for (const e of ALL_EVENTS) expect(['sunset', 'roof', 'market', 'camp', 'ware', 'lv', 'ee', 'lt', 'es', 'by', 'us', 'ru']).toContain(e.venue);
  });
});

describe('act 1: the neighbourhood', () => {
  const win = (id, lost = 0) => { startCareerEvent(id); return finishCareerMatch(true, 2, lost) };
  it('street courts open after Tomi, the rival after 3 of them, the king after everything', () => {
    expect(eventOpen('a1_roof')).toBe(false);
    win('a1_tomi');
    for (const id of ['a1_roof', 'a1_market', 'a1_camp', 'a1_ware']) expect(eventOpen(id)).toBe(true);
    expect(eventOpen('a1_ruta')).toBe(false);
    win('a1_roof'); win('a1_market'); win('a1_camp');
    expect(eventOpen('a1_ruta')).toBe(true);
    expect(eventOpen('a1_king')).toBe(false);
    win('a1_ware'); win('a1_ruta');
    expect(eventOpen('a1_king')).toBe(true);
    expect(tierUnlocked(1)).toBe(false);
  });
  it('losing to the rival still moves the story on', () => {
    for (const id of ['a1_tomi', 'a1_roof', 'a1_market', 'a1_camp']) win(id);
    profile().career.seen.push('intro', 'ray');
    startCareerEvent('a1_ruta');
    const r = finishCareerMatch(false, 0, 2);
    expect(r.rival).toBe(true);
    expect(profile().career.won).toContain('a1_ruta');
    expect(pendingScene(profile().career).id).toBe('ruta_loss');
  });
  it('dares give a prize only when won within the allowed games lost', () => {
    win('a1_tomi');
    let r = win('a1_roof', 1);
    expect(r.dareMissed).toBe(true);
    expect(prizes()).toEqual([]);
    r = win('a1_roof', 0);
    expect(r.prize).toBe('PIGEON FEATHER');
    expect(prizes()).toEqual(['PIGEON FEATHER']);
    expect(streetRep()).toBe(3); // tomi + rooftop + its dare
  });
  it('a street court applies its twist and quick matches clear it', () => {
    startCareerEvent('a1_camp'); newMatch(false, 1);
    expect(COURT.sand).toBe(true);
    leaveCareer(); newMatch(false, 1);
    expect(COURT.sand).toBe(false);
  });
  it('the warehouse roof turns a high ball into a roof event', () => {
    startCareerEvent('a1_ware'); newMatch(false, 1);
    const b = { x: 0, y: -8, z: 5.5, vx: 0, vy: 3, vz: 4, out: false };
    const evs = []; for (let i = 0; i < 60; i++) stepBall(b, 1 / 120, t => evs.push(t));
    expect(evs).toContain('roof');
  });
  it('story: intro first, Ray after Tomi, pre-match scenes for the rival and the king', () => {
    expect(pendingScene(profile().career).id).toBe('intro');
    profile().career.seen.push('intro');
    win('a1_tomi');
    expect(pendingScene(profile().career).id).toBe('ray');
    expect(preScene(profile().career, 'a1_ruta').id).toBe('ruta');
    expect(preScene(profile().career, 'a1_king').id).toBe('king');
  });
  it('old club-ladder saves move onto the town map', () => {
    const p = migrate({ career: { won: ['club1', 'club2', 'club3', 'bal1'] } });
    expect(p.career.won).toEqual(expect.arrayContaining(['a1_tomi', 'a1_market', 'a1_king', 'bal1']));
    expect(p.career.won).not.toContain('club1');
    expect(pendingScene(p.career)).toBeUndefined();
  });
});
