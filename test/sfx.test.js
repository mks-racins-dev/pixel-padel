import { describe, it, expect } from 'vitest';
import { S } from '../src/state.js';
import { sfxOut } from '../src/audio/sfx.js';

describe('sound effects output', () => {
  it('the effects volume node goes to the speakers, not back into itself', () => {
    const gain = () => ({ gain: { value: 0 }, to: null, connect(x) { this.to = x; return x } });
    S.AC = { createGain: gain, destination: 'SPEAKERS' }; S.sfxGain = null;
    const g = sfxOut();
    expect(g.to).toBe('SPEAKERS');
    S.AC = null; S.sfxGain = null;
  });
});
