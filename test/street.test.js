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
