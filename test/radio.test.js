import { describe, it, expect } from 'vitest';
import { STATIONS, station, nextStation, setStation } from '../src/audio/music.js';
import { OPTS } from '../src/game/opts.js';

describe('in-game radio', () => {
  it('has several stations with full 16-step patterns', () => {
    expect(STATIONS.length).toBeGreaterThanOrEqual(5);
    for (const s of STATIONS) for (const k of ['kick', 'snare', 'hat', 'bass', 'lead']) expect(s[k].length).toBe(16);
  });
  it('the dial goes through every station, then off, then wraps', () => {
    setStation(STATIONS[0].id);
    const seen = [station().id];
    for (let i = 0; i < STATIONS.length; i++) { nextStation(1); seen.push(station().id) }
    expect(seen.slice(0, STATIONS.length)).toEqual(STATIONS.map(s => s.id));
    expect(seen[STATIONS.length]).toBe('off');
    nextStation(1); expect(station().id).toBe(STATIONS[0].id);
    nextStation(-1); expect(OPTS.radio).toBe('off');
  });
});
