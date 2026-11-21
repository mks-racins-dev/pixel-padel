// Career panel: the next match (venue, opponent, reward, tour progress) and a skills view
// for spending skill points and choosing a ball trail.
import { TIERS, nextEvent, tierUnlocked, startCareerEvent, xpForWin } from '../meta/career.ts';
import { profile, spendPoint, refundPoints, xpToNext, MAX_ALLOC, MAX_LEVEL, TRAILS, LEVEL_UNLOCKS, equipTrail } from '../meta/profile.ts';
import { STYLES } from '../game/constants.js';
import { LOCS } from '../content/venues.js';
import { startGame } from './ui.js';
import { initAudio } from '../audio/sfx.js';

const STAT_NAMES = { spd: 'SPEED', pow: 'POWER', acc: 'ACCURACY', wall: 'WALL PLAY' };
const city = v => (LOCS[v] && LOCS[v].city) || v.toUpperCase();
const bar = (v, n = 5) => '■'.repeat(v) + '□'.repeat(n - v);
let view = 'match'; // or 'skills'

export function renderCareerTab() {
  const box = document.getElementById('careerBox');
  if (!box) return;
  if (view === 'skills') return renderSkills(box);
  const p = profile(), nx = nextEvent(), tier = TIERS[nx.tier], loc = LOCS[nx.venue] || LOCS.sunset;
  const won = p.career.won, allDone = TIERS.every(t => t.events.every(e => won.includes(e.id)));
  const idx = tier.events.findIndex(e => e.id === nx.id);
  const st = STYLES[nx.style] || STYLES.allround;
  const sky = loc.sky.slice(1, 6).map(c => `<span style="background:${c}"></span>`).join('');
  const reward = tier.reward ? `WIN THE TOUR: ${TRAILS.find(t => t.id === tier.reward).name} TRAIL` : 'WIN THE TOUR: NEXT TIER';
  const chips = TIERS.map((t, ti) => {
    const n = t.events.filter(e => won.includes(e.id)).length, open = tierUnlocked(ti);
    const cls = n === t.events.length ? 'won' : open ? 'next' : '';
    return `<span class="cchip ${cls}">${t.name.split(' ')[0]} ${n === t.events.length ? '✓' : open ? n + '/' + t.events.length : '???'}</span>`;
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
      <button class="big alt" id="skillsBtn">SKILLS${p.points ? ' · ' + p.points : ''}</button>
    </div>`;
  document.getElementById('careerPlay').onclick = () => { initAudio(); startCareerEvent(); startGame() };
  document.getElementById('skillsBtn').onclick = () => { view = 'skills'; renderCareerTab() };
}

function renderSkills(box) {
  const p = profile();
  const pct = p.level >= MAX_LEVEL ? 100 : Math.round(100 * p.xp / xpToNext(p.level));
  const stat = k => `<div class="cstat"><span>${STAT_NAMES[k]}</span><span class="cbar">${bar(p.alloc[k], MAX_ALLOC)}</span>`
    + `<button data-spend="${k}" aria-label="Add a point to ${STAT_NAMES[k]}" ${p.points && p.alloc[k] < MAX_ALLOC ? '' : 'disabled'}>+</button></div>`;
  const trails = TRAILS.map(tr => {
    const has = p.unlocked.includes(tr.id), lv = LEVEL_UNLOCKS.find(u => u.id === tr.id);
    const how = has ? tr.name : lv ? 'LV ' + lv.level : (TIERS.find(t => t.reward === tr.id)?.name.split(' ')[0] || '');
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
  document.getElementById('skillsBack').onclick = () => { view = 'match'; renderCareerTab() };
}
