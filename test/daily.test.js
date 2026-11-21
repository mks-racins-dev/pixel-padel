import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { newMatch, teamName } from '../src/game/rules.js';
import { simSeed } from '../src/core/rng.ts';
import { profile, resetProfileCache } from '../src/meta/profile.ts';
import { leaveCareer, CAREER } from '../src/meta/career.ts';
import { DAILY, WEEKLY, dailySet, weeklySet, chState, handle, takeRecent, dayNumber, weekNumber } from '../src/meta/challenges.ts';
import { cupFor, cupState, startCup, finishCupMatch, RUN } from '../src/meta/cup.ts';

const T = new Date(2026, 10, 21, 12).getTime(); // a fixed Saturday noon
beforeEach(() => { localStorage.clear(); resetProfileCache(); leaveCareer(); RUN.round = 0; takeRecent() });

describe('challenge selection', () => {
  it('everyone gets the same 3 challenges on the same day, and different ones another day', () => {
    const a = dailySet(dayNumber(T)).map(c => c.id);
    expect(a).toEqual(dailySet(dayNumber(T)).map(c => c.id));
    expect(new Set(a).size).toBe(3);
    const days = new Set(Array.from({ length: 7 }, (_, i) => dailySet(dayNumber(T) + i).map(c => c.id).join()));
    expect(days.size).toBeGreaterThan(1);
  });
  it('the week changes on Monday, not mid-week', () => {
    const sat = weekNumber(T), sun = weekNumber(T + 864e5), mon = weekNumber(T + 2 * 864e5);
    expect(sun).toBe(sat);
    expect(mon).toBe(sat + 1);
  });
});

describe('challenge progress', () => {
  it('counts events, completes once, and pays XP', () => {
    const c = dailySet(dayNumber(T))[0];
    const ev = sampleEvent(c);
    const xp0 = profile().xp + profile().level * 1000;
    for (let i = 0; i < c.need + 3; i++) handle(ev, T);
    const st = chState(T);
    expect(st.daily[c.id].n).toBe(c.need);
    expect(st.daily[c.id].done).toBe(true);
    const done = takeRecent();
    expect(done.filter(d => d.text === c.text).length).toBe(1);
    expect(profile().xp + profile().level * 1000).toBeGreaterThan(xp0);
  });
  it('resets the next day but keeps the week', () => {
    const c = dailySet(dayNumber(T))[0];
    handle(sampleEvent(c), T);
    const w = weeklySet(weekNumber(T))[0];
    handle(sampleEvent(w), T);
    const st = chState(T + 864e5);
    expect(Object.keys(st.daily).length).toBe(0);
    expect(st.weekly[w.id]).toBeTruthy();
  });
  it('progress survives a reload', () => {
    const c = dailySet(dayNumber(T))[0];
    handle(sampleEvent(c), T);
    resetProfileCache();
    expect(chState(T).daily[c.id].n).toBe(1);
  });
});

describe('weekly cup', () => {
  it('is the same for everyone in a week', () => {
    expect(cupFor(100)).toEqual(cupFor(100));
    expect(cupFor(100).map(e => e.opp).join()).not.toBe(cupFor(101).map(e => e.opp).join());
  });
  it('a cup match uses the round opponent and the fixed seed', () => {
    startCup(true);
    newMatch(false);
    expect(teamName(1)).toBe(cupFor()[0].opp);
    expect(simSeed()).toBe(cupFor()[0].seed);
  });
  it('winning advances rounds; winning the final makes you champion once', () => {
    startCup(true);
    expect(finishCupMatch(true).over).toBe(false);
    startCup(false); expect(CAREER.event.round).toBe('SEMI-FINAL');
    finishCupMatch(true);
    startCup(false);
    const r = finishCupMatch(true);
    expect(r.champion).toBe(true);
    expect(r.over).toBe(true);
    expect(cupState().best).toBe(3);
    expect(RUN.round).toBe(0);
  });
  it('a loss ends the run but keeps the best result', () => {
    startCup(true); finishCupMatch(true);
    startCup(false); const r = finishCupMatch(false);
    expect(r.over).toBe(true);
    expect(cupState().best).toBe(1);
    expect(RUN.round).toBe(0);
  });
});

// an event that counts for a challenge
function sampleEvent(c) {
  const tries = [
    { type: 'shot', shot: 'vibora', offWall: true }, { type: 'shot', shot: 'bandeja', offWall: false }, { type: 'shot', shot: 'smash', offWall: false },
    { type: 'shot', shot: 'chiquita', offWall: false }, { type: 'shot', shot: 'lob', offWall: false }, { type: 'shot', shot: 'contrapared', offWall: false },
    { type: 'point', won: true, wall: true, reason: 'POR TRES!', golden: true },
    { type: 'match', won: true, mode: '1v1', venue: 'lv', gamesLost: 0, career: true, cup: false }, { type: 'drill', id: 'rally' },
  ];
  const e = tries.find(e => c.count(e) > 0);
  if (!e) throw new Error('no sample event for ' + c.id);
  return e;
}
it('every challenge can be completed by some event', () => {
  for (const c of [...DAILY, ...WEEKLY]) if (!['w_venues', 'w_cup'].includes(c.id)) expect(() => sampleEvent(c)).not.toThrow();
});
