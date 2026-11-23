// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { MatchRoom } from '../server/room.js';
import { STEP } from '../src/game/update.js';

function client(room) {
  const c = { got: [], last: t => [...c.got].reverse().find(m => m.t === t) };
  c.team = room.join(s => c.got.push(JSON.parse(s)));
  c.say = (m, now = 0) => room.message(c.team, JSON.stringify(m), now);
  return c;
}
const run = (room, secs) => { for (let t = 0; t < secs; t += 1 / 60) room.tick(1 / 60) };
const hello = (c, extra = {}) => c.say({ t: 'hello', style: 'power', look: { gender: 'girl' }, loc: 'lv', ...extra });

describe('game server room', () => {
  it('starts when two players said hello and gives them different teams', () => {
    const room = new MatchRoom({ code: 'ABCD', kind: 'private', seed: 1 });
    const a = client(room), b = client(room);
    hello(a); expect(a.last('start')).toBeUndefined();
    hello(b);
    expect(a.last('start').team).toBe(0);
    expect(b.last('start').team).toBe(1);
    expect(a.last('start').loc).toBe('lv'); // private rooms use the host's venue
    expect(a.last('start').styles).toEqual(['power', 'power']);
  });

  it('refuses a third player', () => {
    const room = new MatchRoom({ code: 'ABCD', kind: 'private' });
    client(room); client(room);
    const c = client(room);
    expect(c.team).toBe(-1);
    expect(c.last('full')).toBeTruthy();
  });

  it('a joiner gets "no game" when the code has no host', () => {
    const room = new MatchRoom({ code: 'ZZZZ', kind: 'private' });
    const j = client(room); hello(j, { mode: 'join' });
    expect(j.last('nogame')).toBeTruthy();
  });

  it('sends snapshots and runs the serve from player input', () => {
    const room = new MatchRoom({ code: 'ABCD', kind: 'quick', seed: 3 });
    const a = client(room), b = client(room); hello(a); hello(b);
    run(room, 0.5);
    const s0 = a.last('s');
    expect(s0.st).toBe('serve');
    const server = s0.r[0];
    const srv = [a, b][server];
    srv.say({ t: 'd', a: 'drive' }); run(room, 0.3); srv.say({ t: 'u', a: 'drive' });
    run(room, 0.3);
    expect(a.last('s').st).toBe('play');
    expect(b.last('s').b[6]).toBe(0); // ball no longer held
  });

  it('ignores junk and clamps input', () => {
    const room = new MatchRoom({ code: 'ABCD', kind: 'quick', seed: 3 });
    const a = client(room), b = client(room); hello(a); hello(b);
    room.message(0, 'not json'); room.message(0, '{"t":"d","a":"hack"}');
    a.say({ t: 'm', mx: 99, my: -99 });
    expect(room.players[0].input).toEqual({ mx: 1, my: -1 });
  });

  it('tells the other player when someone leaves, and the room takes no new players', () => {
    const room = new MatchRoom({ code: 'ABCD', kind: 'quick' });
    const a = client(room), b = client(room); hello(a); hello(b);
    room.leaveRoom(1);
    expect(a.last('bye')).toBeTruthy();
    const c = client(room);
    expect(c.team).toBe(-1);
    expect(c.last('bye')).toBeTruthy();
  });

  it('rooms running side by side do not affect each other', () => {
    const solo = new MatchRoom({ code: 'AAAA', kind: 'quick', seed: 11 });
    const s1 = client(solo), s2 = client(solo); hello(s1); hello(s2);
    run(solo, 4);
    const ref = JSON.stringify(s1.last('s').b);

    const x = new MatchRoom({ code: 'BBBB', kind: 'quick', seed: 11 });
    const y = new MatchRoom({ code: 'CCCC', kind: 'quick', seed: 99 });
    const x1 = client(x), x2 = client(x), y1 = client(y), y2 = client(y);
    hello(x1); hello(x2); hello(y1); hello(y2);
    // y's players do things; x's stay idle like the solo room
    for (let t = 0; t < 4; t += 1 / 60) { x.tick(1 / 60); y1.say({ t: 'm', mx: 1, my: 1 }); y.tick(1 / 60) }
    expect(JSON.stringify(x1.last('s').b)).toBe(ref);
  });
});

describe('2 vs 2 rooms', () => {
  const host2 = room => { const h = client(room); hello(h, { mode: 'create', fmt: '2v2' }); return h };
  it('the host opens a 4-slot room; joiners go to the other team first', () => {
    const room = new MatchRoom({ code: 'WXYZ', kind: 'private', seed: 2 });
    const h = host2(room), b = client(room); hello(b, { mode: 'join' });
    const lob = b.last('lobby');
    expect(lob.you).toBe(2);
    expect(lob.slots.filter(Boolean).length).toBe(2);
    expect(h.last('start')).toBeUndefined(); // waits for the host
  });
  it('two players can choose to be partners, then bots fill the other team', () => {
    const room = new MatchRoom({ code: 'WXYZ', kind: 'private', seed: 2 });
    const h = host2(room), b = client(room); hello(b, { mode: 'join' });
    b.say({ t: 'slot', i: 1 });
    expect(b.last('lobby').you).toBe(1);
    b.say({ t: 'go' }); expect(b.last('start')).toBeUndefined(); // only the host starts
    h.say({ t: 'go' });
    const st = h.last('start');
    expect(st.size).toBe(4);
    expect(st.humans).toEqual([true, true, false, false]);
    expect(b.last('start').team).toBe(0);
    run(room, 3);
    const snap = h.last('s');
    expect(snap.P.length).toBe(4);
  });
  it('a full room refuses a fifth player', () => {
    const room = new MatchRoom({ code: 'WXYZ', kind: 'private' });
    host2(room); for (let i = 0; i < 3; i++) hello(client(room), { mode: 'join' });
    expect(client(room).team).toBe(-1);
  });
  it('a player who leaves mid-match is replaced by a bot and the match goes on', () => {
    const room = new MatchRoom({ code: 'WXYZ', kind: 'private', seed: 3 });
    const h = host2(room), b = client(room); hello(b, { mode: 'join' });
    h.say({ t: 'go' }); run(room, 1);
    room.leaveRoom(b.team);
    expect(h.last('swap').slot).toBe(2);
    expect(h.last('bye')).toBeUndefined();
    const before = h.got.length; run(room, 1);
    expect(h.got.length).toBeGreaterThan(before);
  });
  it('a solo host can start a match against bots', () => {
    const room = new MatchRoom({ code: 'WXYZ', kind: 'private', seed: 4 });
    const h = host2(room); h.say({ t: 'go' });
    expect(h.last('start').humans).toEqual([true, false, false, false]);
  });
});

describe('public rooms', () => {
  it('a public room reports its name, format and players; private rooms stay hidden', () => {
    const room = new MatchRoom({ code: 'PUBL', kind: 'private', seed: 5 });
    const h = client(room); hello(h, { mode: 'create', fmt: '2v2', pub: { name: '  Riga <b>Night</b> 2v2 ', pass: '' } });
    const i = room.info();
    expect(i).toMatchObject({ code: 'PUBL', fmt: '2v2', players: 1, max: 4, locked: false, playing: false });
    expect(i.name).toBe('Riga bNightb 2v2'); // tags and odd symbols are removed
    const priv = new MatchRoom({ code: 'PRIV', kind: 'private' }); hello(client(priv), { mode: 'create' });
    expect(priv.info()).toBe(null);
  });
  it('a password room refuses a wrong password without closing the room', () => {
    const room = new MatchRoom({ code: 'LOCK', kind: 'private', seed: 6 });
    const h = client(room); hello(h, { mode: 'create', pub: { name: 'Closed club', pass: 'pad3l' } });
    expect(room.info().locked).toBe(true);
    const bad = client(room); hello(bad, { mode: 'join', pass: 'nope' });
    expect(bad.last('badpass')).toBeTruthy();
    room.leaveRoom(bad.team); // their connection closes
    expect(h.last('bye')).toBeUndefined();
    const ok = client(room); hello(ok, { mode: 'join', pass: 'pad3l' });
    expect(ok.last('start')).toBeTruthy();
    expect(room.info().playing).toBe(true);
  });
});
