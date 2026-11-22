import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../src/state.js';
import { newMatch, diffOf, teamName, matchGames } from '../src/game/rules.js';
import { DIFF, STYLES } from '../src/game/constants.js';
import { settings } from '../src/game/settings.js';
import { profile, addXp, spendPoint, migrate, resetProfileCache, xpToNext, MAX_ALLOC } from '../src/meta/profile.ts';
import { worldRank, activeGoal, GOALS, needsIdentity, chooseIdentity, pendingPress, answerPress, fans } from '../src/meta/career.ts';
import { CAREER, TIERS, ALL_EVENTS, nextEvent, startCareerEvent, finishCareerMatch, leaveCareer, oppDiff, tierUnlocked, eventOpen, prizes, streetRep } from '../src/meta/career.ts';
import { COURT } from '../src/game/physics.js';
import { doublesOpen, currentPartner, doublesEventOpen, startDoublesEvent, finishDoublesMatch, choosePartner, chemistry } from '../src/meta/doubles.ts';
import { seasonsOpen, seasonFor, seasonState, startSeasonEvent, finishSeasonMatch } from '../src/meta/season.ts';
import { stepBall } from '../src/game/physics.js';
import { pendingScene, preScene } from '../src/content/story.js';

beforeEach(() => { localStorage.clear(); resetProfileCache(); leaveCareer(); settings.mode = '1v1' });

describe('profile', () => {
  it('levels up and gives one skill point per level', () => {
    const gained = addXp(xpToNext(1) + xpToNext(2) + 5);
    expect(gained).toBe(2);
    expect(profile().level).toBe(3);
    expect(profile().points).toBe(2);
    expect(profile().xp).toBe(5);
  });
  it('unlocks the ice trail at level 3', () => {
    addXp(xpToNext(1) + xpToNext(2));
    expect(profile().unlocked).toContain('ice');
  });
  it('skill points are capped per stat', () => {
    profile().points = 20;
    for (let i = 0; i < 20; i++) spendPoint('pow');
    expect(profile().alloc.pow).toBe(MAX_ALLOC);
    expect(profile().points).toBe(20 - MAX_ALLOC);
  });
  it('survives a reload and repairs bad saves', () => {
    addXp(500); spendPoint('spd');
    resetProfileCache();
    expect(profile().alloc.spd).toBe(1);
    const fixed = migrate({ level: 999, alloc: { spd: -4, pow: 'x' }, unlocked: ['gold', 3], trail: 'nope' });
    expect(fixed.level).toBe(30);
    expect(fixed.alloc.spd).toBe(0);
    expect(fixed.unlocked).toEqual(['classic', 'gold']);
    expect(fixed.trail).toBe('classic');
  });
});

describe('career', () => {
  it('starts at the first club match and locks later tiers', () => {
    expect(nextEvent().id).toBe('a1_tomi');
    expect(tierUnlocked(1)).toBe(false);
  });
  it('opponents get harder along the tour', () => {
    const a = oppDiff(0, DIFF.easy, DIFF.hard), b = oppDiff(1, DIFF.easy, DIFF.hard);
    expect(b.spd).toBeGreaterThan(a.spd);
    expect(b.err).toBeLessThan(a.err);
    expect(b.spd).toBeGreaterThan(DIFF.hard.spd); // the last boss is beyond "hard"
  });
  it('a career match uses the event: opponent name, games, skills and difficulty', () => {
    profile().points = 4; spendPoint('spd'); spendPoint('spd'); spendPoint('wall');
    startCareerEvent();
    newMatch(false, 1);
    expect(S.players.length).toBe(2);
    expect(teamName(1)).toBe('TOMI');
    expect(matchGames()).toBe(2);
    expect(S.players[0].sk.spd).toBeCloseTo(STYLES[settings.style].spd + 0.5);
    expect(S.players[0].sk.wall).toBeCloseTo(0.25);
    expect(diffOf(S.players[1]).spd).toBeCloseTo(DIFF.easy.spd);
  });
  it('winning the town courts and the king of the court completes act 1 and unlocks its reward', () => {
    startCareerEvent();
    let r = finishCareerMatch(true, 2);
    expect(r.won).toBe(true);
    expect(r.toMap).toBe(true);
    for (const id of ['a1_roof', 'a1_market', 'a1_camp', 'a1_ware', 'a1_ruta']) { startCareerEvent(id); finishCareerMatch(true, 2) }
    startCareerEvent('a1_king');
    r = finishCareerMatch(true, 3);
    expect(r.tierDone).toBe(TIERS[0].name);
    expect(profile().unlocked).toContain('fire');
    expect(tierUnlocked(1)).toBe(true);
    expect(nextEvent().id).toBe('b_riga1');
  });
  it('losing gives some XP but does not advance', () => {
    startCareerEvent();
    const r = finishCareerMatch(false, 1);
    expect(r.xp).toBeGreaterThan(0);
    expect(nextEvent().id).toBe('a1_tomi');
  });
  it('quick matches are not affected by career progress', () => {
    profile().points = 2; spendPoint('pow'); spendPoint('pow');
    newMatch(false, 1);
    expect(S.players[0].sk).toBe(STYLES[settings.style]);
    expect(teamName(1)).toBe('CPU');
    expect(CAREER.active).toBe(false);
  });
  it('every event has a known venue', () => {
    for (const e of ALL_EVENTS) expect(['sunset', 'roof', 'market', 'camp', 'ware', 'lv', 'ee', 'lt', 'es', 'by', 'us', 'ru']).toContain(e.venue);
  });
});

describe('act 1: the neighbourhood', () => {
  const win = (id, lost = 0) => { startCareerEvent(id); return finishCareerMatch(true, 2, lost) };
  it('street courts open after Tomi, the rival after 3 of them, the king after everything', () => {
    expect(eventOpen('a1_roof')).toBe(false);
    win('a1_tomi');
    for (const id of ['a1_roof', 'a1_market', 'a1_camp', 'a1_ware']) expect(eventOpen(id)).toBe(true);
    expect(eventOpen('a1_ruta')).toBe(false);
    win('a1_roof'); win('a1_market'); win('a1_camp');
    expect(eventOpen('a1_ruta')).toBe(true);
    expect(eventOpen('a1_king')).toBe(false);
    win('a1_ware'); win('a1_ruta');
    expect(eventOpen('a1_king')).toBe(true);
    expect(tierUnlocked(1)).toBe(false);
  });
  it('losing to the rival still moves the story on', () => {
    for (const id of ['a1_tomi', 'a1_roof', 'a1_market', 'a1_camp']) win(id);
    profile().career.seen.push('intro', 'ray');
    startCareerEvent('a1_ruta');
    const r = finishCareerMatch(false, 0, 2);
    expect(r.rival).toBe(true);
    expect(profile().career.won).toContain('a1_ruta');
    expect(pendingScene(profile().career).id).toBe('ruta_loss');
  });
  it('dares give a prize only when won within the allowed games lost', () => {
    win('a1_tomi');
    let r = win('a1_roof', 1);
    expect(r.dareMissed).toBe(true);
    expect(prizes()).toEqual([]);
    r = win('a1_roof', 0);
    expect(r.prize).toBe('PIGEON FEATHER');
    expect(prizes()).toEqual(['PIGEON FEATHER']);
    expect(streetRep()).toBe(3); // tomi + rooftop + its dare
  });
  it('a street court applies its twist and quick matches clear it', () => {
    startCareerEvent('a1_camp'); newMatch(false, 1);
    expect(COURT.sand).toBe(true);
    leaveCareer(); newMatch(false, 1);
    expect(COURT.sand).toBe(false);
  });
  it('the warehouse roof turns a high ball into a roof event', () => {
    startCareerEvent('a1_ware'); newMatch(false, 1);
    const b = { x: 0, y: -8, z: 5.5, vx: 0, vy: 3, vz: 4, out: false };
    const evs = []; for (let i = 0; i < 60; i++) stepBall(b, 1 / 120, t => evs.push(t));
    expect(evs).toContain('roof');
  });
  it('story: intro first, Ray after Tomi, pre-match scenes for the rival and the king', () => {
    expect(pendingScene(profile().career).id).toBe('intro');
    profile().career.seen.push('intro');
    win('a1_tomi');
    expect(pendingScene(profile().career).id).toBe('ray');
    expect(preScene(profile().career, 'a1_ruta').id).toBe('ruta');
    expect(preScene(profile().career, 'a1_king').id).toBe('king');
  });
  it('old club-ladder saves move onto the town map', () => {
    const p = migrate({ career: { won: ['club1', 'club2', 'club3'] } });
    expect(p.career.won).toEqual(expect.arrayContaining(['a1_tomi', 'a1_market', 'a1_king']));
    expect(p.career.won).not.toContain('club1');
    expect(pendingScene(p.career)).toBeUndefined();
  });
});

describe('act 2: the baltic tour', () => {
  const town = ['a1_tomi', 'a1_roof', 'a1_market', 'a1_camp', 'a1_ware', 'a1_ruta', 'a1_king'];
  const result = (id, won, lost = 0) => { startCareerEvent(id); return finishCareerMatch(won, won ? 3 : 1, lost) };
  beforeEach(() => { profile().career.won.push(...town) });
  it('tour rounds go in order and give ranking points once', () => {
    expect(nextEvent().id).toBe('b_riga1');
    const before = worldRank();
    const r = result('b_riga1', true, 2);
    expect(r.rp).toBe(15);
    expect(r.rank).toBeLessThan(before);
    expect(nextEvent().id).toBe('b_riga2');
    expect(r.toMap).toBe(false);
  });
  it('losing a round knocks you out and the tournament starts again', () => {
    result('b_riga1', true, 2);
    const r = result('b_riga2', false, 3);
    expect(r.knocked).toBe('SEMI-FINAL');
    expect(r.toMap).toBe(true);
    expect(nextEvent().id).toBe('b_riga1');
    expect(CAREER.event.id).toBe('b_riga1');
    expect(profile().career.rp).toBe(15); // points already earned are kept
    expect(result('b_riga1', true, 2).rp).toBe(0); // and not paid twice
  });
  it('winning riga signs the sponsor, whose goals pay out in order', () => {
    for (const id of ['b_riga1', 'b_riga2', 'b_riga3']) result(id, true, 2);
    expect(activeGoal()).toBeUndefined();
    profile().career.seen.push('sponsor');
    expect(activeGoal().id).toBe(GOALS[0].id);
    const r = result('b_tal1', true, 1);
    expect(r.goal).toBe(GOALS[0].text);
    expect(activeGoal().id).toBe('g_streak');
  });
  it('beating ruta in the vilnius final completes act 2 and opens the east open', () => {
    for (const e of TIERS[1].events) result(e.id, true, 2);
    expect(tierUnlocked(2)).toBe(true);
    expect(profile().unlocked).toContain('gold');
    expect(worldRank()).toBeLessThan(250);
  });
  it('old baltic saves move onto the new brackets', () => {
    const p = migrate({ career: { won: ['club3', 'bal1', 'bal2'] } });
    expect(p.career.won).toEqual(expect.arrayContaining(['b_riga3', 'b_tal2']));
    expect(p.career.won).not.toContain('b_vil1');
  });
});

describe('act 3: the east open', () => {
  const before = ['a1_tomi', 'a1_roof', 'a1_market', 'a1_camp', 'a1_ware', 'a1_ruta', 'a1_king', 'b_riga1', 'b_riga2', 'b_riga3', 'b_tal1', 'b_tal2', 'b_vil1', 'b_vil2'];
  const result = (id, won, lost = 0) => { startCareerEvent(id); return finishCareerMatch(won, won ? 3 : 1, lost) };
  beforeEach(() => { profile().career.won.push(...before) });
  it('starts in minsk with no bounce marker', () => {
    expect(nextEvent().id).toBe('e_min1');
    settings.assist = 'on';
    startCareerEvent(); newMatch(false, 1);
    expect(CAREER.event.noMarker).toBe(true);
  });
  it('winning minsk asks for an identity, which boosts career stats', () => {
    for (const id of ['e_min1', 'e_min2', 'e_min3']) result(id, true, 2);
    expect(needsIdentity()).toBe(true);
    chooseIdentity('wall');
    expect(needsIdentity()).toBe(false);
    startCareerEvent(); newMatch(false, 1);
    expect(S.players[0].sk.wall).toBeCloseTo(1);
    chooseIdentity('nope');
    expect(profile().career.identity).toBe('wall');
  });
  it('beating dasha completes act 3 and opens the pro tour', () => {
    for (const e of TIERS[2].events) result(e.id, true, 2);
    expect(tierUnlocked(3)).toBe(true);
    expect(nextEvent().id).toBe('p_mad1');
  });
  it('the old tallinn goal can still be finished on any final', () => {
    profile().career.goals.push('g_close', 'g_streak', 'g_clean');
    profile().career.seen.push('sponsor');
    for (const id of ['e_min1', 'e_min2']) result(id, true, 2);
    expect(activeGoal().id).toBe('g_tallinn');
    result('e_min3', true, 2);
    expect(activeGoal().id).toBe('g_comeback');
  });
});

describe('act 4: the pro tour', () => {
  const before = ['a1_tomi', 'a1_roof', 'a1_market', 'a1_camp', 'a1_ware', 'a1_ruta', 'a1_king', 'b_riga1', 'b_riga2', 'b_riga3', 'b_tal1', 'b_tal2', 'b_vil1', 'b_vil2', 'e_min1', 'e_min2', 'e_min3', 'e_mos1', 'e_mos2', 'e_mos3'];
  const result = (id, won, lost = 0) => { startCareerEvent(id); return finishCareerMatch(won, won ? 4 : 1, lost) };
  beforeEach(() => { profile().career.won.push(...before) });
  it('winning madrid calls a press conference; the answer wins fans', () => {
    for (const id of ['p_mad1', 'p_mad2', 'p_mad3']) result(id, true, 2);
    expect(pendingPress()).toBe('madrid');
    const f = fans();
    answerPress('cocky');
    expect(pendingPress()).toBeUndefined();
    expect(fans()).toBe(f + 9000);
  });
  it('beating el maestro wins the career and makes you world number 1', () => {
    let r;
    for (const e of TIERS[3].events) r = result(e.id, true, 2);
    expect(r.last).toBe(true);
    expect(worldRank()).toBe(1);
    expect(pendingPress()).toBe('madrid'); // press answers are still waiting
  });
  it('old pro saves move onto the new tour', () => {
    const p = migrate({ career: { won: ['club3', 'bal1', 'bal2', 'bal3', 'east1', 'east2', 'east3', 'pro1'] } });
    expect(p.career.won).toEqual(expect.arrayContaining(['p_mad3']));
    expect(p.career.press).toContain('madrid:humble');
  });
});

describe('endless seasons', () => {
  const finish = () => { for (const e of ALL_EVENTS) profile().career.won.push(e.id) };
  const play = (i, won = true) => { startSeasonEvent(i); return finishSeasonMatch(won, won ? 4 : 1) };
  it('open only after the story career is finished', () => {
    expect(seasonsOpen()).toBe(false);
    finish();
    expect(seasonsOpen()).toBe(true);
  });
  it('a week has 3 seeded defences, the same every time, one on a street court', () => {
    const a = seasonFor(3000, 0), b = seasonFor(3000, 0);
    expect(a).toEqual(b);
    expect(a.length).toBe(3);
    expect(a[1].court).toBeTruthy();
    expect(new Set(a.map(e => e.opp)).size).toBe(3);
  });
  it('winning all 3 defends the title; losses can be retried', () => {
    finish();
    play(0); expect(play(1, false).won).toBe(false);
    const r1 = play(1); expect(r1.left).toBe(1);
    const r = play(2);
    expect(r.defended).toBe(true);
    expect(r.streak).toBe(1);
    expect(seasonState().total).toBe(1);
    expect(play(2).defended).toBe(false); // replays don't defend twice
  });
  it('3 weeks in a row unlock the crown trail; a missed week resets the streak', () => {
    finish();
    const st = seasonState();
    Object.assign(st, { streak: 2, lastWeek: st.week - 1 });
    for (const i of [0, 1, 2]) play(i);
    expect(seasonState().streak).toBe(3);
    expect(profile().unlocked).toContain('crown');
    const later = seasonState(st.week + 2);
    expect(later.streak).toBe(0);
    expect(later.best).toBe(3);
  });
  it('a season match uses the defence: opponent, games, court twist and identity', () => {
    finish();
    startSeasonEvent(1); newMatch(false, 1);
    expect(teamName(1)).toBe(seasonFor()[1].opp);
    expect(matchGames()).toBe(3);
    expect(COURT.wind || COURT.sand || COURT.deadBack || COURT.roof).toBeTruthy();
  });
});

describe('career doubles', () => {
  const won = ids => profile().career.won.push(...ids);
  const play = (id, w = true) => { startDoublesEvent(id); return finishDoublesMatch(w, w ? 3 : 1) };
  it('opens with Tomi after King of the Court', () => {
    expect(doublesOpen()).toBe(false);
    won(['a1_tomi', 'a1_king']);
    expect(doublesOpen()).toBe(true);
    expect(currentPartner().id).toBe('tomi');
    expect(doublesEventOpen('d_town')).toBe(true);
    expect(doublesEventOpen('d_riga')).toBe(false);
  });
  it('a doubles match is 2 vs 2 with the partner and the story pair', () => {
    won(['a1_king']);
    startDoublesEvent('d_town'); newMatch(false, 1);
    expect(S.players.length).toBe(4);
    expect(S.players.filter(p => p.ctrl === 'h1').length).toBe(1);
    expect(teamName(0)).toBe('YOU & TOMI');
    expect(teamName(1)).toBe('PETE & VASQUEZ');
    expect(COURT.wind).toBeGreaterThan(0);
    expect(S.chem.mirror).toBe(false);
  });
  it('chemistry grows by playing together and unlocks perks', () => {
    won(['a1_king']);
    let r = play('d_town');
    expect(r.chem).toBe(12);
    for (let i = 0; i < 3; i++) r = play('d_town');
    expect(r.chem).toBe(48);
    r = play('d_town');
    expect(r.perk).toBe('BOTH UP, BOTH BACK WITH YOU');
    startDoublesEvent('d_town'); newMatch(false, 1);
    expect(S.chem.mirror).toBe(true);
    expect(diffOf(S.players[1]).spd).toBeGreaterThan(oppDiff(0.3, DIFF.easy, DIFF.hard).spd);
    for (let i = 0; i < 10; i++) play('d_town');
    expect(chemistry('tomi')).toBe(100);
  });
  it('the circuit goes in order and each step needs its story moment', () => {
    won(['a1_king', 'b_riga3']);
    expect(doublesEventOpen('d_riga')).toBe(false);
    play('d_town');
    expect(doublesEventOpen('d_riga')).toBe(true);
    expect(doublesEventOpen('d_tallinn')).toBe(false);
  });
  it('partners need their unlock; picking a locked one is ignored', () => {
    won(['a1_king']);
    choosePartner('maestro');
    expect(currentPartner().id).toBe('tomi');
    won(['p_fin']);
    choosePartner('maestro');
    expect(currentPartner().id).toBe('maestro');
  });
  it('singles career matches stay 1 vs 1 with no chemistry', () => {
    startCareerEvent(); newMatch(false, 1);
    expect(S.players.length).toBe(2);
    expect(S.chem).toBe(null);
  });
});
