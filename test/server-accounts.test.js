// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { PlayerStore, Ladder, MapStorage, sha256hex, cleanName, randomId } from '../server/accounts.js';
import { MatchRoom } from '../server/room.js';

describe('accounts', () => {
  it('a token works only for its own account and is stored hashed', async () => {
    const st = new MapStorage(), p = new PlayerStore(st), token = randomId(32);
    expect(await p.init(await sha256hex(token), 'MAKS')).toBe(true);
    expect(await p.init(await sha256hex('other'), 'X')).toBe(false); // cannot be taken over
    expect(await p.auth(token)).toBe(true);
    expect(await p.auth('wrong')).toBe(false);
    expect([...st.m.values()]).not.toContain(token);
  });
  it('saves a profile and a valid nickname, rejects bad ones', async () => {
    const p = new PlayerStore(new MapStorage()); await p.init('h', 'A1B');
    expect(await p.put({ name: 'x' })).toMatch(/3–10/);
    expect(await p.put({ name: 'padel king!' })).toBe(null); // cleaned to PADELKING
    expect(await p.put({ profile: { level: 4 }, updatedAt: 123 })).toBe(null);
    expect(await p.put({ profile: { big: 'x'.repeat(70000) } })).toMatch(/too large/);
    expect(await p.get()).toEqual({ name: 'PADELKING', profile: { level: 4 }, updatedAt: 123 });
  });
  it('cleans names', () => { expect(cleanName('  Max-99 ')).toBe('MAX99') });
});

describe('ladder', () => {
  const T = Date.UTC(2026, 10, 21);
  it('rates a match, ranks players and keeps seasons apart', async () => {
    const lad = new Ladder(new MapStorage());
    const res = await lad.report({ id: 'aaa', name: 'ANNA' }, { id: 'bbb', name: 'BEN' }, T);
    expect(res.aaa.after).toBeGreaterThan(1500);
    expect(res.bbb.after).toBeLessThan(1500);
    const top = await lad.top(10, T);
    expect(top.season).toBe('2026-11');
    expect(top.top.map(r => r.name)).toEqual(['ANNA', 'BEN']);
    expect((await lad.me('bbb', T)).rank).toBe(2);
    const next = await lad.top(10, Date.UTC(2026, 11, 2));
    expect(next.players).toBe(0); // new month, new season
  });
  it('ignores reports without two different players', async () => {
    const lad = new Ladder(new MapStorage());
    expect(await lad.report({ id: 'aaa' }, { id: 'aaa' }, T)).toBe(null);
    expect(await lad.report({ id: 'aaa' }, {}, T)).toBe(null);
  });
});

describe('ranked rooms', () => {
  const setup = (who1, who2, kind = 'quick') => {
    const results = [];
    const room = new MatchRoom({ code: 'ABCDEFGH', kind, seed: 1, onResult: r => results.push(r) });
    const got = [[], []];
    room.join(s => got[0].push(JSON.parse(s)), who1);
    room.join(s => got[1].push(JSON.parse(s)), who2);
    for (const t of [0, 1]) room.message(t, JSON.stringify({ t: 'hello', style: 'speed' }));
    return { room, results, got };
  };
  it('quitting a ranked match counts as a loss', () => {
    const { room, results, got } = setup({ id: 'aaa', name: 'ANNA' }, { id: 'bbb', name: 'BEN' });
    expect(got[0].find(m => m.t === 'start').names).toEqual(['ANNA', 'BEN']);
    expect(got[0].find(m => m.t === 'start').ranked).toBe(true);
    room.tick(0.5);
    room.leaveRoom(1);
    expect(results).toHaveLength(1);
    expect(results[0].winner.id).toBe('aaa');
    expect(results[0].reason).toBe('left');
  });
  it('a finished match is reported once', () => {
    const { room, results } = setup({ id: 'aaa', name: 'ANNA' }, { id: 'bbb', name: 'BEN' });
    room.finished(1); room.finished(1);
    expect(results).toHaveLength(1);
    expect(results[0].winner.name).toBe('BEN');
  });
  it('private rooms and guests without accounts are not ranked', () => {
    expect(setup({ id: 'aaa' }, { id: 'bbb' }, 'private').room.ranked).toBe(false);
    const { room, results } = setup({ id: 'aaa' }, {});
    room.finished(0);
    expect(results).toHaveLength(0);
  });
  it('each player gets their own rating change', () => {
    const { room, got } = setup({ id: 'aaa', name: 'ANNA' }, { id: 'bbb', name: 'BEN' });
    room.sendRatings({ season: '2026-11', aaa: { before: 1500, after: 1662, won: true }, bbb: { before: 1500, after: 1338, won: false } });
    expect(got[0].at(-1)).toMatchObject({ t: 'rating', after: 1662, won: true });
    expect(got[1].at(-1)).toMatchObject({ t: 'rating', after: 1338, won: false });
  });
});

describe('ladder win streaks', () => {
  const T = Date.UTC(2026, 10, 21);
  it('counts current and best win streaks and sorts by them', async () => {
    const lad = new Ladder(new MapStorage()), A = { id: 'aaa', name: 'ANNA' }, B = { id: 'bbb', name: 'BEN' }, C = { id: 'ccc', name: 'CAT' };
    for (let i = 0; i < 3; i++) await lad.report(A, B, T);
    await lad.report(C, A, T); // Anna's run ends at 3
    await lad.report(C, B, T);
    const best = await lad.top(10, T, 'best');
    expect(best.by).toBe('best');
    expect(best.top[0]).toMatchObject({ name: 'ANNA', best: 3, streak: 0 });
    const hot = await lad.top(10, T, 'streak');
    expect(hot.top.map(r => r.name)).toEqual(['CAT']); // only players on a run
    expect(hot.top[0].streak).toBe(2);
    expect((await lad.top(10, T, 'wins')).top[0].name).toBe('ANNA');
    expect((await lad.me('aaa', T)).best).toBe(3);
  });
});
