import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { newMatch } from '../src/game/rules.js';
import { update, STEP } from '../src/game/update.js';
import { settings } from '../src/game/settings.js';
import { PR, DRILLS, practiceLanded } from '../src/game/practice.js';

const run = secs => { for (let t = 0; t < secs; t += STEP) update(STEP) };

describe('practice mode', () => {
  beforeEach(() => { localStorage.clear(); settings.mode = 'practice'; newMatch(false, 5) });

  it('starts the first drill with only the human on court', () => {
    expect(S.players.length).toBe(1);
    expect(PR.on).toBe(true);
    expect(PR.drill).toBe(0);
    run(3); // intro message, then the machine feeds
    expect(S.state).toBe('play');
    expect(S.R0.lastTeam).toBe(1);
  });

  it('a missed ball does not count and the machine feeds again', () => {
    run(3);
    const hits = S.R0.hits;
    run(5); // player stands still: double bounce on our side
    expect(PR.done).toBe(0);
    expect(S.R0.hits).toBeGreaterThan(hits);
  });

  it('good shots advance the drill and finishing it saves progress', () => {
    run(3);
    for (let i = 0; i < DRILLS[0].need; i++) {
      S.state = 'play'; S.R0.lastShot = 'drive';
      practiceLanded({ x: 0, y: 5 });
      run(1.2);
    }
    expect(PR.drill).toBe(1);
    expect(JSON.parse(localStorage.getItem('pixelpadel-practice')).done).toContain('rally');
  });

  it('drill shots are checked: a drive does not count in the lob drill', () => {
    newMatch(false, 5);
    PR.drill = 2; PR.done = 0;
    S.state = 'play'; S.R0.lastShot = 'drive';
    practiceLanded({ x: 0, y: 8 });
    expect(PR.done).toBe(0);
    S.state = 'play'; S.R0.lastShot = 'lob';
    practiceLanded({ x: 0, y: 8 });
    expect(PR.done).toBe(1);
  });

  it('leaving practice turns it off', () => {
    newMatch(true);
    expect(PR.on).toBe(false);
  });
});
