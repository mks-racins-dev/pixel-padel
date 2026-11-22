import { describe, it, expect, beforeEach } from 'vitest';
import { profile, migrate } from '../src/meta/profile.ts';
import { coins, earnCoins, buy, equip, owns, equipped, gearBonus, gearLook, matchCoins } from '../src/meta/gear.ts';

describe('coins and the pro shop', () => {
  beforeEach(() => { localStorage.clear(); const p = profile(); p.gear = undefined; p.career.won = [] });
  it('starts with the free gear equipped and no coins', () => {
    expect(coins()).toBe(0);
    expect(equipped('racket').id).toBe('r_wood');
    expect(gearBonus()).toEqual({ spd: 0, pow: 0, acc: 0, wall: 0 });
  });
  it('buying needs coins and story progress, then equips and boosts stats', () => {
    expect(buy('r_club')).toBe(false);
    earnCoins(600);
    expect(buy('r_club')).toBe(true);
    expect(coins()).toBe(480);
    expect(gearBonus().pow).toBe(0.25);
    expect(buy('r_amber')).toBe(false); // locked until the Riga Open
    profile().career.won.push('b_riga3');
    expect(buy('r_amber')).toBe(true);
    equip('r_club'); expect(equipped('racket').id).toBe('r_club');
    expect(owns('r_amber')).toBe(true);
  });
  it('gear changes the look and coins pay more for first wins higher up', () => {
    earnCoins(200); buy('s_grip');
    const l = gearLook({ id: 'me', frame: '#000' });
    expect(l.shoe).toBe('#e4572e'); expect(l.id).not.toBe('me');
    expect(matchCoins(true, 2, true)).toBeGreaterThan(matchCoins(true, 0, false));
    expect(matchCoins(false, 3, false)).toBeLessThan(matchCoins(true, 0, false));
  });
  it('gear survives a save round trip', () => {
    const p = migrate({ gear: { coins: 50, owned: ['r_club'], eq: { racket: 'r_club' } } });
    expect(p.gear.coins).toBe(50);
  });
});
