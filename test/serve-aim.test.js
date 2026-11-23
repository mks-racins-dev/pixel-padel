import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { newMatch, doServe, serveAimIn, SERVE_AIM_MIN, SERVE_AIM_MAX } from '../src/game/rules.js';
import { settings } from '../src/game/settings.js';
import { update, STEP } from '../src/game/update.js';

/** Serves from the human player with a given aim; returns true if it was a fault. */
function serveWith(aim) {
  settings.mode = '1v1'; newMatch(false, 3);
  for (let t = 0; t < 3 && S.state !== 'serve'; t += STEP) update(STEP);
  const p = S.R0.server; if (p.ctrl !== 'h1') return null;
  p.serveAim = aim; doServe(p, 0.5);
  for (let t = 0; t < 3; t += STEP) { update(STEP); if (S.R0.faults === 1 || S.state === 'between') break }
  return S.R0.faults === 1 || (S.state === 'between' && S.R0.bounces === 0);
}

describe('serve aim', () => {
  beforeEach(() => localStorage.clear());
  it('the aim can go past the service box on both sides', () => {
    expect(SERVE_AIM_MIN).toBeLessThan(0);
    expect(SERVE_AIM_MAX).toBeGreaterThan(1);
    expect(serveAimIn({ serveAim: 0.5 })).toBe(true);
    expect(serveAimIn({ serveAim: SERVE_AIM_MIN })).toBe(false);
    expect(serveAimIn({ serveAim: SERVE_AIM_MAX })).toBe(false);
  });
  it('serving into the side fence or the wrong box is a fault', () => {
    expect(serveWith(SERVE_AIM_MAX)).toBe(true);
    expect(serveWith(SERVE_AIM_MIN)).toBe(true);
  });
});
