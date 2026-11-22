import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { newMatch } from '../src/game/rules.js';
import { settings } from '../src/game/settings.js';
import { update, STEP } from '../src/game/update.js';
import { tryChase } from '../src/game/chase.js';

/** A ball that bounced on our side (team 0) and is flying out over the right side fence. */
function setup(px, py) {
  settings.mode = '1v1'; newMatch(false, 3);
  S.state = 'play'; Object.assign(S.R0, { serve: false, lastTeam: 1, bounces: 1 });
  Object.assign(S.ball, { x: 5.02, y: -2.2, z: 3.2, vx: 2.2, vy: -0.6, vz: 1.5, held: false, out: true, rolling: false });
  const p = S.players[0]; p.x = px; p.y = py;
  return p;
}

describe('out-of-court chase', () => {
  beforeEach(() => localStorage.clear());
  it('a close defender chases the ball out and can hit it back over the fence', () => {
    const p = setup(4.2, -2);
    expect(tryChase()).toBe(true);
    expect(S.state).toBe('chase');
    for (let t = 0; t < 4 && S.state === 'chase'; t += STEP) { p.swingReq = 'drive'; update(STEP) }
    expect(S.state).toBe('play');
    expect(S.R0.lastTeam).toBe(0);
    expect(S.R0.chased).toBe(true);
    expect(Math.abs(p.x)).toBeGreaterThan(5); // played from outside the cage
    let inside = false;
    for (let t = 0; t < 3 && !inside; t += STEP) { update(STEP); if (!S.ball.ext && Math.abs(S.ball.x) < 5) inside = true }
    expect(inside).toBe(true);
  });
  it('a defender who is too far away does not get a chase', () => {
    setup(-4.5, -9.5);
    expect(tryChase()).toBe(false);
  });
  it('missing the ball outside loses the point', () => {
    const p = setup(4.2, -2);
    tryChase();
    const g = S.score.pts[1];
    for (let t = 0; t < 5 && S.state === 'chase'; t += STEP) update(STEP); // never presses hit
    expect(S.state).not.toBe('chase');
    expect(S.score.pts[1]).toBe(g + 1);
    expect(p.ret || Math.abs(p.x) < 5).toBe(true);
  });
});
