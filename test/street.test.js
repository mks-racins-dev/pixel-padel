import { describe, it, expect } from 'vitest';
import { S } from '../src/state.js';
import { settings } from '../src/game/settings.js';
import { streetKind } from '../src/render/street.js';

describe('street courts', () => {
  it('only grade 1 at a street venue gets its own home-made scene', () => {
    settings.loc = 'roof'; S.grade = 1; expect(streetKind()).toBe('roof');
    settings.loc = 'camp'; expect(streetKind()).toBe('camp');
    settings.loc = 'market'; expect(streetKind()).toBe('market');
    settings.loc = 'sunset'; expect(streetKind()).toBe(null);
    settings.loc = 'roof'; S.grade = 5; expect(streetKind()).toBe(null);
    S.grade = 0; settings.loc = 'sunset';
  });
});

import { LOCS } from '../src/content/venues.js';
import { VENUE_RULES, VENUE_TWIST } from '../src/game/venueRules.js';
describe('street house rules', () => {
  it('every street venue has a house rule and a line for the match card', () => {
    for (const [k, l] of Object.entries(LOCS)) if (l.street) { expect(VENUE_RULES[k]).toBeTruthy(); expect(VENUE_TWIST[k]).toBeTruthy() }
    for (const k of Object.keys(VENUE_RULES)) expect(LOCS[k]?.street).toBe(true);
  });
});
