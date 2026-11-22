import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { settings } from '../src/game/settings.js';
import { newMatch, isHuman } from '../src/game/rules.js';
import { couchJoin, couchLeave, couchReady } from '../src/ui/couch.js';
import { schemeOf, SCHEMES } from '../src/input/input.js';

describe('couch 2 vs 2', () => {
  beforeEach(() => { S.couch = null; settings.mode = 'couch' });
  it('joining alternates teams, pressing again switches team, lob leaves', () => {
    couchJoin('pad0'); couchJoin('kb1'); couchJoin('pad1');
    expect(S.couch[0].dev).toBe('pad0');
    expect(S.couch[2].dev).toBe('kb1');
    expect(S.couch[1].dev).toBe('pad1');
    couchJoin('kb1'); // switch: team A is full, so kb1 stays on team B
    expect(S.couch[2].dev).toBe('kb1');
    couchLeave('pad1'); couchJoin('kb1'); // now team A has room
    expect(S.couch.findIndex(s => s && s.dev === 'kb1')).toBeLessThan(2);
  });
  it('builds four players: joined slots are local humans with their device, the rest bots', () => {
    couchJoin('kb1'); couchJoin('kb2');
    newMatch(false, 3);
    expect(S.players.length).toBe(4);
    expect(S.players.filter(isHuman).map(p => p.ctrl)).toEqual(['h1', 'h2']);
    const kb2 = S.players.find(p => p.dev === 'kb2');
    expect(kb2.team).toBe(1);
    expect(schemeOf(kb2)).toBe(SCHEMES.p2);
    expect(S.players.filter(p => p.ctrl === 'ai').length).toBe(2);
  });
  it('a match with nobody joined puts the first keyboard player in', () => {
    couchReady(); newMatch(false, 3);
    expect(S.players[0].ctrl).toBe('h1');
  });
});
