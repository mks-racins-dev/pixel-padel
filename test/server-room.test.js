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
