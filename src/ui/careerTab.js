// Career panel. Act 1 is a town map of street courts played in any order, with story scenes
// between matches. Later tiers show the next match (venue, opponent, reward, tour progress).
// Also a skills view for spending skill points and choosing a ball trail.
import { TIERS, nextEvent, tierUnlocked, startCareerEvent, xpForWin, eventState, prizes, streetRep, streetRepMax, townDone, worldRank, activeGoal, sponsorSigned, SPONSOR, GOALS, IDENTITIES, needsIdentity, chooseIdentity, PRESS, pendingPress, answerPress, fans } from '../meta/career.ts';
import { profile, saveProfile, spendPoint, refundPoints, xpToNext, MAX_ALLOC, MAX_LEVEL, TRAILS, LEVEL_UNLOCKS, equipTrail } from '../meta/profile.ts';
import { STYLES } from '../game/constants.js';
import { LOCS } from '../content/venues.js';
import { WHO, pendingScene, preScene } from '../content/story.js';
import { startGame, toMenu } from './ui.js';
import { playCine, parkIntro, parkOutro } from '../render/cine.js';
import { DRILLS, setPracticeCustom } from '../game/practice.js';
import { settings } from '../game/settings.js';
import { totalStars, eventStars, starGoals } from '../meta/stars.ts';
import { mkLook } from '../game/player.js';
import { S } from '../state.js';
import { leaveCareer } from '../meta/career.ts';
import { showPanel } from './menu.js';
import { initAudio } from '../audio/sfx.js';
import { seasonsOpen, seasonFor, seasonState, startSeasonEvent, CROWN_STREAK } from '../meta/season.ts';
import { weekNumber } from '../meta/challenges.ts';
import { PARTNERS, DOUBLES, CHEM_STEPS, doublesOpen, doublesState, doublesEventOpen, currentPartner, choosePartner, chemistry, startDoublesEvent } from '../meta/doubles.ts';

const STAT_NAMES = { spd: 'SPEED', pow: 'POWER', acc: 'ACCURACY', wall: 'WALL PLAY' };
const city = v => (LOCS[v] && LOCS[v].city) || v.toUpperCase();
const bar = (v, n = 5) => '■'.repeat(v) + '□'.repeat(n - v);
const tierLabel = t => t.id === 'town' ? 'TOWN' : t.name.split(' ')[0];
let view = null; // 'map' | 'match' | 'skills'; null = pick by progress
let sel = null;  // selected town court
let scene = null; // { s, i, done } while a story scene is playing

export function renderCareerTab() {
  renderCareer();
  const db = document.getElementById('dblBtn'); if (db) db.onclick = () => { view = 'doubles'; renderCareerTab() };
}
const dblBtn = () => doublesOpen() ? '<button class="big alt" id="dblBtn">DOUBLES</button>' : '';

function renderCareer() {
  const box = document.getElementById('careerBox');
  if (!box) return;
  if (scene) return renderScene(box);
  const s = pendingScene(profile().career);
  if (s && s.cine) return renderChapter(box, s);
  if (s) return playScene(s, () => renderCareerTab());
  if (needsIdentity()) return renderIdentity(box);
  if (pendingPress()) return renderPress(box);
  if (!view) view = townDone() ? 'match' : 'map';
  if (view === 'skills') return renderSkills(box);
  if (view === 'doubles' && doublesOpen()) return renderDoubles(box);
  if (view === 'map') return renderMap(box);
  const nx = nextEvent();
  if (TIERS[nx.tier].stops && !profile().career.won.includes(nx.id)) return renderTour(box, nx);
  if (seasonsOpen() && view !== 'replay') return renderSeason(box);
  renderMatch(box);
}

/* ---------------- story scenes ---------------- */
function playScene(s, done) { scene = { s, i: 0, done }; renderCareerTab() }
function endScene() {
  const { s, done } = scene; scene = null;
  const c = profile().career; if (!c.seen.includes(s.id)) { c.seen.push(s.id); saveProfile() }
  done();
}
function renderScene(box) {
  const { s, i } = scene, [who, text] = s.lines[i], w = WHO[who] || WHO.note, note = who === 'note';
  box.innerHTML = `
    <div class="scene${note ? ' note' : ''}">
      ${note ? '' : `<div class="sface" style="--c:${w.c};--h:${w.hair}" aria-hidden="true"><i></i><b></b></div>`}
      <div class="stext">${note ? '' : `<span class="px sname">${w.name}</span>`}<p>${text}</p></div>
    </div>
    <div class="sdots" aria-hidden="true">${s.lines.map((_, k) => `<span class="${k <= i ? 'on' : ''}"></span>`).join('')}</div>
    <div class="cacts">
      <button class="big" data-primary id="sceneNext">${i < s.lines.length - 1 ? 'NEXT ▸' : 'CONTINUE ▸'}</button>
      <button class="big alt" id="sceneSkip">SKIP</button>
    </div>`;
  document.getElementById('sceneNext').onclick = () => { if (scene.i < s.lines.length - 1) { scene.i++; renderCareerTab() } else endScene() };
  document.getElementById('sceneSkip').onclick = endScene;
  document.getElementById('sceneNext').focus();
}

/* ---------------- cinematic story chapters ---------------- */
function renderChapter(box, s) {
  box.innerHTML = `<div class="chapter"><span class="px">CHAPTER 1</span><b class="px">THE CRACKED COURT</b><p>A new town. A park at dusk. Someone is short a player.</p></div>
    <div class="cacts"><button class="big" data-primary id="chapGo">▶ PLAY</button></div>`;
  document.getElementById('chapGo').onclick = () => runParkIntro(s);
}
/** The opening: watch the park scene, return three balls (the first game), then the outro. */
async function runParkIntro(s) {
  initAudio();
  const you = mkLook(S.myLookData);
  await playCine(parkIntro(you));
  const prev = settings.mode;
  leaveCareer(); settings.mode = 'practice';
  setPracticeCustom({
    drill: { ...DRILLS[0], id: 'first', name: 'RETURN 3 BALLS', need: 3, tip: 'Hit the ball back over the net. Hit: Space/J.',
      feed: () => ({ tx: (Math.random() - 0.5) * 3, ty: -5.5, spd: 8, clear: 1.5 }) },
    onDone: async () => {
      settings.mode = prev;
      await playCine(parkOutro(you));
      const c = profile().career; if (!c.seen.includes(s.id)) { c.seen.push(s.id); saveProfile() }
      toMenu(); showPanel('career');
    },
  });
  startGame();
}

function play(id) {
  initAudio();
  const go = () => { startCareerEvent(id); startGame() };
  const s = preScene(profile().career, id);
  if (s) playScene(s, go); else go();
}

/* ---------------- act 1: the town map ---------------- */
function renderMap(box) {
  const c = profile().career, town = TIERS[0].events;
  const open = town.filter(e => eventState(e.id) === 'next');
  if (!sel || !town.some(e => e.id === sel)) sel = (open[0] || town[0]).id;
  const e = town.find(x => x.id === sel), state = eventState(e.id);
  const pins = town.map(ev => {
    const st = eventState(ev.id), hidden = st === 'locked' && (ev.rival || ev.final);
    return `<button class="tpin ${st}${ev.id === sel ? ' sel' : ''}${ev.final ? ' king' : ''}" data-pin="${ev.id}" style="left:${ev.map[0]}%;top:${ev.map[1]}%"
      aria-label="${hidden ? 'LOCKED' : ev.place}${st === 'won' ? ', done' : ''}"><i>${st === 'won' ? '✓' : hidden ? '?' : ev.final ? '♛' : ev.rival ? '!' : '●'}</i><span>${hidden ? '???' : ev.place}</span></button>`;
  }).join('');
  const st = STYLES[e.style] || STYLES.allround;
  const locked = state === 'locked', hiddenSel = locked && (e.rival || e.final);
  const need = e.needsAny ? `WIN ${e.needsAny[0]} STREET COURTS FIRST` : e.final ? 'WIN ALL STREET COURTS AND MEET THE STRANGER' : 'BEAT TOMI AT SUNSET CLUB FIRST';
  const dare = e.dare ? `<span class="tdare${c.dares.includes(e.id) ? ' ok' : ''}">DARE: ${e.dare.text}${c.dares.includes(e.id) ? ' ✓' : ` · WIN: ${e.prize}`}</span>` : '';
  const rep = streetRep(), repMax = streetRepMax();
  const items = prizes();
  box.innerHTML = `
    <div class="thead"><span class="px">ACT 1 · THE NEIGHBOURHOOD</span><span class="trep" title="Street rep">REP <b>${'★'.repeat(rep)}</b>${'☆'.repeat(repMax - rep)}</span></div>
    <div class="tgrid">
      <div class="tmap" aria-label="Town map"><span class="troad h"></span><span class="troad v"></span><span class="tpond"></span>${pins}</div>
      <div class="tcard">
        <span class="px tplace">${hiddenSel ? '???' : e.place}</span>
        ${hiddenSel ? '' : `<span class="tstars" title="${starGoals(e.id).map(g => g.text).join(' · ')}">${'★'.repeat(eventStars(e.id))}${'☆'.repeat(3 - eventStars(e.id))}</span>`}
        ${hiddenSel ? `<span class="ttwist">${need}</span>` : `
        <span class="ttwist">${e.twist}</span>
        <span>VS <b class="px">${e.opp}</b></span>
        <span class="cstyle">${st.name} · FIRST TO ${e.games}</span>
        <span class="cstyle">SPD ${bar(st.spd)} PWR ${bar(st.pow)} ACC ${bar(st.acc)}</span>
        ${dare}
        <span class="txp">${state === 'won' ? 'DONE · REPLAY FOR XP' : `+${xpForWin(e)} XP`}${e.final ? ' · FIRE TRAIL' : ''}</span>
        ${locked ? `<span class="ttwist">${need}</span>` : ''}`}
      </div>
    </div>
    <div class="tpocket"><span>POCKET</span>${items.length ? items.map(x => `<b>${x}</b>`).join('') : '<em>win dares to fill your pockets</em>'}</div>
    <div class="cacts">
      <button class="big" data-primary id="careerPlay" ${locked ? 'disabled' : ''}>${locked ? 'LOCKED' : e.rival && state !== 'won' ? 'FACE THE STRANGER ▸' : 'PLAY ▸'}</button>
      ${townDone() ? '<button class="big alt" id="toTour">TOUR ▸</button>' : ''}
      ${dblBtn()}
      <button class="big alt" id="skillsBtn">SKILLS${profile().points ? ' · ' + profile().points : ''}</button>
    </div>`;
  box.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => { sel = b.dataset.pin; renderCareerTab(); box.querySelector(`[data-pin="${sel}"]`)?.focus() });
  if (!locked) document.getElementById('careerPlay').onclick = () => play(e.id);
  const tt = document.getElementById('toTour'); if (tt) tt.onclick = () => { view = 'match'; renderCareerTab() };
  document.getElementById('skillsBtn').onclick = () => { view = 'skills'; renderCareerTab() };
}

/* ---------------- doubles: partners, chemistry, the doubles circuit ---------------- */
function renderDoubles(box) {
  const s = doublesState(), pa = currentPartner(), ch = chemistry(pa.id);
  const partners = PARTNERS.map(x => {
    const open = x.unlock(profile().career), c = chemistry(x.id);
    return `<button data-partner="${x.id}" aria-pressed="${x.id === pa.id}" ${open ? '' : 'disabled'} title="${open ? x.name : x.how}">${open ? `${x.name}<br><small>${c}/100</small>` : '???'}</button>`;
  }).join('');
  const perks = CHEM_STEPS.map(([n, t]) => `<span class="${ch >= n ? 'won' : ''}">${n}: ${t}</span>`).join('');
  const evs = DOUBLES.map(e => {
    const won = s.won.includes(e.id), open = doublesEventOpen(e.id);
    return `<button class="tid sdef${won ? ' won' : ''}" data-dbl="${e.id}" ${open ? '' : 'disabled'}><span>${won ? 'WON ✓' : open ? 'OPEN' : 'LOCKED'}</span><b class="px">${open || won ? e.opp : '???'}</b><span>${open || won ? city(e.venue) + ' · FIRST TO ' + e.games : e.needsText}</span></button>`;
  }).join('');
  box.innerHTML = `
    <div class="thead"><span class="px">DOUBLES CIRCUIT</span><span class="trep">${s.won.length}/${DOUBLES.length} WON</span></div>
    <div class="opt"><span class="px">PARTNER</span><div class="seg dpart">${partners}</div></div>
    <div class="tpocket dchem"><span>CHEMISTRY WITH ${pa.name}</span><span class="cxp"><span style="width:${ch}%"></span></span><b>${ch}/100</b></div>
    <div class="dperks">${perks}</div>
    <div class="tids dgrid">${evs}</div>
    <div class="cacts"><button class="big" id="dblBack">◂ BACK TO CAREER</button></div>`;
  box.querySelectorAll('[data-partner]').forEach(b => b.onclick = () => { choosePartner(b.dataset.partner); renderCareerTab() });
  box.querySelectorAll('[data-dbl]').forEach(b => b.onclick = () => { initAudio(); startDoublesEvent(b.dataset.dbl); startGame() });
  document.getElementById('dblBack').onclick = () => { view = null; renderCareerTab() };
  const first = box.querySelector('[data-dbl]:not([disabled]):not(.won)') || document.getElementById('dblBack');
  first.setAttribute('data-primary', '');
}

/* ---------------- endless seasons: weekly title defences ---------------- */
function renderSeason(box) {
  const p = profile(), st = seasonState(), evs = seasonFor(), done = st.won.length === 3;
  const ms = Math.max(0, (weekNumber() + 1) * 7 - 3) * 864e5 - Date.now(), days = Math.ceil(ms / 864e5);
  const cards = evs.map((e, i) => {
    const s = STYLES[e.style] || STYLES.allround, won = st.won.includes(i);
    return `<button class="tid sdef${won ? ' won' : ''}" data-def="${i}"><span>${e.label}${won ? ' ✓' : ''}</span><b class="px">${e.opp}</b>
      <span>${e.place || city(e.venue)} · FIRST TO ${e.games}</span>${e.twist ? `<span class="ttwist">${e.twist}</span>` : `<span class="cstyle">SPD ${bar(s.spd)} PWR ${bar(s.pow)} ACC ${bar(s.acc)}</span>`}
      <span class="txp">${won ? 'REPLAY · +60 XP' : '+' + (120 + i * 30) + ' XP'}</span></button>`;
  }).join('');
  const crown = p.unlocked.includes('crown') ? 'CROWN TRAIL OWNED' : `CROWN TRAIL: ${Math.max(0, CROWN_STREAK - st.streak)} MORE WEEK${CROWN_STREAK - st.streak === 1 ? '' : 'S'} IN A ROW`;
  box.innerHTML = `
    <div class="thead"><span class="px">SEASON · WEEK ${weekNumber()} · DEFEND #1</span><span class="trep">${days} DAY${days === 1 ? '' : 'S'} LEFT</span></div>
    <div class="help">${done ? '<b>TITLE DEFENDED THIS WEEK.</b> New challengers arrive on Monday.' : `Win all 3 this week to defend your title (+300 XP). Play them in any order, retry any time.`}</div>
    <div class="tids">${cards}</div>
    <div class="tpocket"><span>STREAK</span><b>${st.streak} WEEK${st.streak === 1 ? '' : 'S'}</b><span>BEST</span><b>${st.best}</b><span>DEFENCES</span><b>${st.total}</b><em>${crown}</em></div>
    <div class="cacts">
      <button class="big alt" id="replayBtn">REPLAY FINAL</button>
      <button class="big alt" id="townBtn">TOWN</button>
      ${dblBtn()}
      <button class="big alt" id="skillsBtn">SKILLS${p.points ? ' · ' + p.points : ''}</button>
    </div>`;
  box.querySelectorAll('[data-def]').forEach(b => b.onclick = () => { initAudio(); startSeasonEvent(+b.dataset.def); startGame() });
  document.getElementById('replayBtn').onclick = () => { view = 'replay'; renderCareerTab() };
  document.getElementById('townBtn').onclick = () => { view = 'map'; renderCareerTab() };
  document.getElementById('skillsBtn').onclick = () => { view = 'skills'; renderCareerTab() };
  const first = box.querySelector('.sdef:not(.won)') || box.querySelector('[data-def]');
  first.setAttribute('data-primary', '');
}

/* ---------------- act 4: press conference ---------------- */
function renderPress(box) {
  box.innerHTML = `
    <div class="mtitle px">PRESS CONFERENCE</div>
    <div class="help">Pick your answer. Fans remember.</div>
    <div class="tids">${PRESS.map(x => `<button class="tid" data-id="${x.id}"><b class="px">${x.name}</b><span>${x.quote}</span><span class="txp">+${x.fans.toLocaleString('en')} FANS</span></button>`).join('')}</div>`;
  box.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { answerPress(b.dataset.id); renderCareerTab() });
  box.querySelector('[data-id]').focus();
}

/* ---------------- act 3: choose a playing identity ---------------- */
function renderIdentity(box) {
  box.innerHTML = `
    <div class="mtitle px">WHO ARE YOU ON COURT?</div>
    <div class="help">Pick once. The bonus is permanent in career matches.</div>
    <div class="tids">${IDENTITIES.map(i => `<button class="tid" data-id="${i.id}"><b class="px">${i.name}</b><span>${i.text}</span></button>`).join('')}</div>`;
  box.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { chooseIdentity(b.dataset.id); renderCareerTab() });
  box.querySelector('[data-id]').focus();
}

/* ---------------- act 2: tour stops with knockout brackets ---------------- */
function renderTour(box, nx) {
  const p = profile(), tier = TIERS[nx.tier], stop = tier.stops.find(s => s.id === nx.stop), loc = LOCS[stop.venue] || LOCS.sunset;
  const st = STYLES[nx.style] || STYLES.allround, won = p.career.won;
  const sky = loc.sky.slice(1, 6).map(c => `<span style="background:${c}"></span>`).join('');
  const stops = tier.stops.map(s => {
    const evs = tier.events.filter(e => e.stop === s.id), done = evs.every(e => won.includes(e.id)), here = s.id === stop.id;
    const rounds = evs.map(e => `<span class="${won.includes(e.id) ? 'won' : e.id === nx.id ? 'next' : ''}">${e.stage === 'FINAL' ? 'F' : e.stage === 'SEMI-FINAL' ? 'SF' : 'R1'}</span>`).join('');
    return `<div class="tstop${done ? ' done' : here ? ' here' : ''}"><b class="px">${s.name}</b><span>${city(s.venue)}${done ? ' ✓' : ''}</span><div class="tround">${rounds}</div></div>`;
  }).join('');
  const g = activeGoal(), gi = g ? GOALS.indexOf(g) : GOALS.length;
  const sponsor = sponsorSigned()
    ? `<div class="ccard tspon"><span>SPONSOR · ${SPONSOR} · GOAL ${Math.min(gi + 1, GOALS.length)}/${GOALS.length}</span>${g ? `<b>${g.text}</b><span class="txp">+${g.xp} XP · +${g.rp} RP</span>` : '<b>ALL GOALS DONE. THE KEBABS ARE FREE.</b>'}</div>`
    : `<div class="ccard tspon"><span>SPONSOR</span><b>NO SPONSOR YET</b><span>win a tournament to get noticed</span></div>`;
  box.innerHTML = `
    <div class="chead"><span class="csky" aria-hidden="true">${sky}</span>
      <span class="px csub">ACT ${nx.tier + 1} · ${tier.name} · ${stop.name}</span>
      <span class="px ccity">${nx.stage}</span>
      <span class="px trank">WORLD RANK #${worldRank()} · ★ ${totalStars()} · ${p.career.rp} RP${nx.tier >= 3 ? ' · ' + fans().toLocaleString('en') + ' FANS' : ''}</span></div>
    <div class="tstops">${stops}</div>
    <div class="ccards">
      <div class="ccard"><span>${nx.stage} · ${city(nx.venue)}</span><b class="px">${nx.opp}</b><span>${st.name} · FIRST TO ${nx.games}</span><span class="cstyle">SPD ${bar(st.spd)} PWR ${bar(st.pow)} ACC ${bar(st.acc)}</span><span class="txp">+${xpForWin(nx)} XP · +${nx.rp} RP</span></div>
      ${sponsor}
    </div>
    <div class="help">KNOCKOUT: lose a round and the tournament starts again from round 1.${nx.noMarker ? ' NO COACH: no bounce marker.' : ''}${p.career.identity ? ' YOU: ' + IDENTITIES.find(i => i.id === p.career.identity).name + '.' : ''}</div>
    <div class="cacts">
      <button class="big" data-primary id="careerPlay">PLAY ${nx.stage} ▸</button>
      <button class="big alt" id="townBtn">TOWN</button>
      ${dblBtn()}
      <button class="big alt" id="skillsBtn">SKILLS${p.points ? ' · ' + p.points : ''}</button>
    </div>`;
  document.getElementById('careerPlay').onclick = () => play(nx.id);
  document.getElementById('townBtn').onclick = () => { view = 'map'; renderCareerTab() };
  document.getElementById('skillsBtn').onclick = () => { view = 'skills'; renderCareerTab() };
}

/* ---------------- later tiers: next match ---------------- */
function renderMatch(box) {
  const p = profile(), nx = nextEvent(), tier = TIERS[nx.tier], loc = LOCS[nx.venue] || LOCS.sunset;
  const won = p.career.won, allDone = TIERS.every(t => t.events.every(e => won.includes(e.id)));
  const idx = tier.events.findIndex(e => e.id === nx.id);
  const st = STYLES[nx.style] || STYLES.allround;
  const sky = loc.sky.slice(1, 6).map(c => `<span style="background:${c}"></span>`).join('');
  const reward = tier.reward ? `WIN THE TOUR: ${TRAILS.find(t => t.id === tier.reward).name} TRAIL` : 'WIN THE TOUR: NEXT TIER';
  const chips = TIERS.map((t, ti) => {
    const n = t.events.filter(e => won.includes(e.id)).length, open = tierUnlocked(ti);
    const cls = n === t.events.length ? 'won' : open ? 'next' : '';
    return `<span class="cchip ${cls}">${tierLabel(t)} ${n === t.events.length ? '✓' : open ? n + '/' + t.events.length : '???'}</span>`;
  }).join('');
  box.innerHTML = `
    <div class="chead"><span class="csky" aria-hidden="true">${sky}</span>
      <span class="px csub">${allDone ? 'CAREER COMPLETE · REPLAY THE FINAL' : `${tier.name} · ${nx.final ? 'FINAL' : 'MATCH ' + (idx + 1) + ' OF ' + tier.events.length}`}</span>
      <span class="px ccity">${city(nx.venue)}</span></div>
    <div class="ccards">
      <div class="ccard"><span>OPPONENT</span><b class="px">${nx.opp}</b><span>${st.name} · FIRST TO ${nx.games}</span><span class="cstyle">SPD ${bar(st.spd)} PWR ${bar(st.pow)} ACC ${bar(st.acc)}</span></div>
      <div class="ccard"><span>REWARD</span><b class="px xp">+${xpForWin(nx)} XP</b><span>${reward}</span></div>
    </div>
    <div class="ctour"><span>TOUR</span><div>${chips}</div></div>
    <div class="cacts">
      <button class="big" data-primary id="careerPlay">PLAY MATCH ▸</button>
      <button class="big alt" id="townBtn">TOWN</button>
      ${seasonsOpen() ? '<button class="big alt" id="seasonBtn">SEASON</button>' : ''}
      ${dblBtn()}
      <button class="big alt" id="skillsBtn">SKILLS${p.points ? ' · ' + p.points : ''}</button>
    </div>`;
  document.getElementById('careerPlay').onclick = () => play(nx.id);
  document.getElementById('townBtn').onclick = () => { view = 'map'; renderCareerTab() };
  const sb = document.getElementById('seasonBtn'); if (sb) sb.onclick = () => { view = 'match'; renderCareerTab() };
  document.getElementById('skillsBtn').onclick = () => { view = 'skills'; renderCareerTab() };
}

function renderSkills(box) {
  const p = profile();
  const pct = p.level >= MAX_LEVEL ? 100 : Math.round(100 * p.xp / xpToNext(p.level));
  const stat = k => `<div class="cstat"><span>${STAT_NAMES[k]}</span><span class="cbar">${bar(p.alloc[k], MAX_ALLOC)}</span>`
    + `<button data-spend="${k}" aria-label="Add a point to ${STAT_NAMES[k]}" ${p.points && p.alloc[k] < MAX_ALLOC ? '' : 'disabled'}>+</button></div>`;
  const trails = TRAILS.map(tr => {
    const has = p.unlocked.includes(tr.id), lv = LEVEL_UNLOCKS.find(u => u.id === tr.id);
    const t = TIERS.find(t => t.reward === tr.id);
    const how = has ? tr.name : lv ? 'LV ' + lv.level : (t ? tierLabel(t) : tr.id === 'crown' ? 'SEASONS' : '');
    return `<button data-trail="${tr.id}" aria-pressed="${p.trail === tr.id}" ${has ? '' : 'disabled'}>${how}</button>`;
  }).join('');
  box.innerHTML = `
    <div class="mtitle px">SKILLS</div>
    <div class="clevel"><span class="px">LEVEL ${p.level}</span><span class="cxp"><span style="width:${pct}%"></span></span><span>${p.level >= MAX_LEVEL ? 'MAX' : p.xp + '/' + xpToNext(p.level) + ' XP'}</span></div>
    <div class="help"><b>SKILL POINTS: ${p.points}</b> · one per level, used in career matches</div>
    <div class="cstats">${['spd', 'pow', 'acc', 'wall'].map(stat).join('')}</div>
    <div class="opt"><span class="px">TRAIL</span><div class="seg ctrail">${trails}</div></div>
    <div class="cacts">
      <button class="big" data-primary id="skillsBack">◂ BACK TO CAREER</button>
      <button class="big alt" data-refund ${Object.values(p.alloc).some(v => v) ? '' : 'disabled'}>RESET POINTS</button>
    </div>`;
  box.querySelectorAll('[data-spend]').forEach(b => b.onclick = () => { spendPoint(b.dataset.spend); renderCareerTab() });
  box.querySelector('[data-refund]').onclick = () => { refundPoints(); renderCareerTab() };
  box.querySelectorAll('[data-trail]').forEach(b => b.onclick = () => { equipTrail(b.dataset.trail); renderCareerTab() });
  document.getElementById('skillsBack').onclick = () => { view = null; renderCareerTab() };
}
