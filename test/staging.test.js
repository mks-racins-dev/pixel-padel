import { describe, it, expect } from 'vitest';
import { SCENES } from '../src/content/story.js';
import { storyCine, CAST } from '../src/content/staging.js';

const career = { won: ['a1_tomi', 'a1_king', 'b_riga3', 'b_vil2', 'e_min3', 'e_mos3', 'p_mad3', 'p_mia2', 'p_fin'], seen: [] };
const you = { id: 'me', skin: '#fff', hair: '#000', shirt: '#f00', shorts: '#000', frame: '#fff' };

describe('story cutscenes', () => {
  it('every scene builds with a backdrop, a line per story line, and known characters', () => {
    for (const s of SCENES.filter(x => !x.cine)) {
      const c = storyCine(s, career, you);
      expect(['venue', 'road', 'plane', 'room']).toContain(c.bg);
      expect(c.steps.filter(x => x.line !== undefined).length).toBe(s.lines.length);
      for (const a of c.actors) if (a.id !== 'you') expect(CAST[a.id]).toBeTruthy();
      if (c.bg === 'venue') expect(c.loc).toBeTruthy();
    }
  });
  it('phone callers stay off stage; the finals are staged in the arena', () => {
    const sick = storyCine(SCENES.find(s => s.id === 'ray_sick'), career, you);
    expect(sick.actors.map(a => a.id)).toEqual(['you']);
    expect(sick.steps.find(x => x.who === 'ray').remote).toBeTruthy();
    expect(storyCine(SCENES.find(s => s.id === 'maestro'), career, you).grade).toBe(8);
  });
});
