import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { newMatch, onEvent } from '../src/game/rules.js';
import { stepBall } from '../src/game/physics.js';
import { update, STEP } from '../src/game/update.js';
import { HL, BACK_H } from '../src/game/constants.js';

const ballAt = o => ({ x: 0, y: 0, z: 1, vx: 0, vy: 0, vz: 0, out: false, rolling: false, spin: 0, ...o });
function run(b, secs) { const ev = []; for (let t = 0; t < secs; t += STEP) stepBall(b, STEP, (...a) => ev.push(a)); return ev }

describe('ball physics', () => {
  it('bounces on the floor and reports the side', () => {
    const ev = run(ballAt({ y: 4, z: 1 }), 0.6);
    expect(ev[0][0]).toBe('floor');
    expect(ev[0][1]).toBe(1); // far side (y > 0)
  });
  it('rebounds off the back glass and flags it as the back wall', () => {
    const b = ballAt({ y: HL - 1, z: 1.2, vy: 12, vz: 2 });
    const ev = run(b, 0.3).filter(e => e[0] === 'wall');
    expect(ev.length).toBe(1);
    expect(ev[0][2]).toBe(true);  // glass
    expect(ev[0][3]).toBe(true);  // back wall
    expect(b.vy).toBeLessThan(0); // coming back towards the net
  });
  it('flies out of the cage above the back wall', () => {
    const ev = run(ballAt({ y: HL - 1, z: BACK_H + 1, vy: 15, vz: 4 }), 0.3);
    expect(ev.some(e => e[0] === 'out')).toBe(true);
  });
});

describe('spin shots', () => {
  const peak = b => { let m = 0, bounced = false; for (let t = 0; t < 1.5; t += STEP) stepBall(b, STEP, e => { if (e === 'floor') bounced = true }), bounced && (m = Math.max(m, b.z)); return m };
  it('bandeja slice stays lower after the bounce than a flat ball', () => {
    const flat = peak(ballAt({ y: 6, z: 0.5, vy: 6, vz: -4 }));
    const slice = peak(ballAt({ y: 6, z: 0.5, vy: 6, vz: -4, slice: true }));
    expect(slice).toBeLessThan(flat * 0.6);
  });
  it('por tres kicks the ball out over the side fence', () => {
    const ev = run(ballAt({ x: 2.4, y: 3, z: 0.3, vy: 15, vz: -5, kick: true }), 1).map(e => e[0]);
    expect(ev[0]).toBe('floor');
    expect(ev).toContain('out');
  });
});

describe('scoring rules', () => {
  beforeEach(() => {
    newMatch(true, 42);
    S.state = 'play';
    S.R0 = { serve: false, lastTeam: 0, bounces: 0, faults: 0, boxX: -1, net: false, hits: 3, server: S.players[0] };
  });
  it('second bounce wins the point for the hitter', () => {
    onEvent('floor', 1, 5); expect(S.R0.bounces).toBe(1);
    onEvent('floor', 1, 3);
    expect(S.score.pts[0]).toBe(1);
  });
  it('hitting the opponent wall before the bounce loses the point', () => {
    onEvent('wall', 1, true, true);
    expect(S.score.pts[1]).toBe(1);
  });
  it('back glass after the bounce stays in play and enables the wall shot', () => {
    onEvent('floor', 1, 5);
    onEvent('wall', 1, true, true);
    expect(S.state).toBe('play');
    expect(S.R0.backWall).toBe(1);
  });
  it('out of the cage after a bounce is a winner', () => {
    onEvent('floor', 1, 5);
    onEvent('out');
    expect(S.score.pts[0]).toBe(1);
  });
});

describe('determinism', () => {
  function simulate(seed, secs = 20) {
    newMatch(true, seed);
    for (let t = 0; t < secs; t += STEP) update(STEP);
    const b = S.ball;
    return JSON.stringify({ b: [b.x, b.y, b.z].map(v => v.toFixed(6)), score: S.score.pts, games: S.score.games, hits: S.R0.hits });
  }
  it('same seed gives the same match', () => {
    expect(simulate(7)).toBe(simulate(7));
  });
  it('different seeds give different matches', () => {
    expect(simulate(7)).not.toBe(simulate(8));
  });
});
