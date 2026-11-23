// Smoke test: whole matches played bot against bot in every mode, start to finish.
// Catches crashes, stuck states and matches that never end (the kind of bugs unit tests miss).
import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { newMatch, matchGames } from '../src/game/rules.js';
import { settings } from '../src/game/settings.js';
import { update, STEP } from '../src/game/update.js';
import { CAREER, ALL_EVENTS, startCareerEvent, leaveCareer } from '../src/meta/career.ts';
import { profile } from '../src/meta/profile.ts';
import { DOUBLES, startDoublesEvent } from '../src/meta/doubles.ts';
import { seasonFor, startSeasonEvent } from '../src/meta/season.ts';

const MAX_SIM_SECS = 1500; // a first-to-2 match between bots ends well before this

/** Plays the current match with bots in every place. Returns the winning team, or -1 if it never ended. */
function playOut() {
  for (const p of S.players) p.ctrl = 'ai';
  let ended = -1;
  for (let t = 0; t < MAX_SIM_SECS; t += STEP) {
    update(STEP);
    if (S.score.winner >= 0 && S.state === 'between' && !S.afterState) { ended = S.score.winner; break }
    if (S.score.winner >= 0 && S.stateT <= STEP * 2) { ended = S.score.winner; break }
  }
  return ended;
}
function check(label) {
  const w = playOut();
  expect(w, label + ': match never finished').toBeGreaterThanOrEqual(0);
  expect(S.score.games[w], label).toBe(matchGames());
  expect(Number.isFinite(S.ball.x) && Number.isFinite(S.ball.y), label + ': ball position').toBe(true);
}

describe('smoke: full matches, bot vs bot', () => {
  beforeEach(() => { localStorage.clear(); leaveCareer(); settings.games = 2 });

  for (const mode of ['1v1', '2v2', 'pvp', 'couch'])
    it('quick play ' + mode, () => { settings.mode = mode; S.couch = [{ dev: 'kb1' }, null, { dev: 'kb2' }, null]; newMatch(false, 11); check(mode) });

  it('career: a street court, a tour final and the world finals (court twists, no bounce marker)', () => {
    for (const id of ['a1_roof', 'a1_camp', 'a1_ware', 'b_riga3', 'e_mos3', 'p_fin']) {
      profile().career.won = ALL_EVENTS.map(e => e.id).filter(x => x !== id); // everything before it is open
      startCareerEvent(id); expect(CAREER.event.id).toBe(id);
      newMatch(false, 21); check(id);
    }
  });

  it('career doubles and an endless season defence', () => {
    profile().career.won = ALL_EVENTS.map(e => e.id);
    startDoublesEvent(DOUBLES[1].id); newMatch(false, 31); check('doubles');
    leaveCareer();
    seasonFor(); startSeasonEvent(0); newMatch(false, 41); check('season');
  });
});
