// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { isOffensive, RateLimiter, originAllowed } from '../server/moderation.js';
import { MatchRoom } from '../server/room.js';

describe('word filter', () => {
  it('blocks offensive names, also with symbols, digits and mixed alphabets', () => {
    for (const n of ['FUCK', 'F.U.C.K', 'fuuuck', 'SH1T', 'хуй', 'Х У Й', 'xyй', 'пиздец', 'BLYAT', 'сука', 'SUKA99', 'PIDOR', 'нахуй', 'NIGGA', 'KILLYOURSELF'])
      expect(isOffensive(n), n).toBe(true);
  });
  it('lets normal names through', () => {
    for (const n of ['MAKS', 'ANNA', 'BEN', 'PADEL', 'PLAYER2216', 'RIGA NIGHT 2V2', 'Рига вечер', 'KEBAB KING', 'ELMAESTRO', 'TOMI', 'NORA', 'Sunset club', 'Ozols', 'JANIS', 'Kaia', 'Mikko', 'Dasha', 'Viktor'])
      expect(isOffensive(n), n).toBe(false);
  });
  it('a room with an offensive name is listed as PADEL ROOM; an offensive nickname is dropped', () => {
    const room = new MatchRoom({ code: 'MODR', kind: 'private' });
    const got = [], cid = room.join(s => got.push(JSON.parse(s)));
    room.message(cid, JSON.stringify({ t: 'hello', mode: 'create', name: 'SUKA', pub: { name: 'пиздец club' } }));
    expect(room.info().name).toBe('PADEL ROOM');
    expect(room.players[0].name).toBe(null);
  });
});

describe('rate limiter', () => {
  it('allows up to the limit per IP in the window, then refuses, then allows again later', () => {
    const r = new RateLimiter({ room: { n: 2, secs: 60 } });
    expect(r.allow('room', '1.1.1.1', 0)).toBe(true);
    expect(r.allow('room', '1.1.1.1', 1000)).toBe(true);
    expect(r.allow('room', '1.1.1.1', 2000)).toBe(false);
    expect(r.allow('room', '2.2.2.2', 2000)).toBe(true); // other players are not affected
    expect(r.allow('room', '1.1.1.1', 61500)).toBe(true);
  });
});

describe('allowed origins', () => {
  const list = ['https://mks-racins-dev.github.io', 'https://*.itch.zone', 'https://*.itch.io'];
  it('accepts itch.io game frames and the own site, nothing else', () => {
    expect(originAllowed('https://html-classic.itch.zone', list)).toBe(true);
    expect(originAllowed('https://someone.itch.io', list)).toBe(true);
    expect(originAllowed('https://mks-racins-dev.github.io', list)).toBe(true);
    expect(originAllowed('https://evil.com', list)).toBe(false);
    expect(originAllowed('https://itch.zone.evil.com', list)).toBe(false);
    expect(originAllowed('http://html-classic.itch.zone', list)).toBe(false);
    expect(originAllowed('https://a.b/c.itch.zone', list)).toBe(false);
  });
});
