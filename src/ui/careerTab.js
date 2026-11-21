// The CAREER tab in the menu: level and XP, skill points, the tour ladder and trail unlocks.
import { TIERS, eventState, nextEvent, tierUnlocked, startCareerEvent } from '../meta/career.ts';
import { profile, spendPoint, refundPoints, xpToNext, MAX_ALLOC, MAX_LEVEL, TRAILS, LEVEL_UNLOCKS, equipTrail } from '../meta/profile.ts';
import { LOCS } from '../content/venues.js';
import { startGame } from './ui.js';
import { initAudio } from '../audio/sfx.js';

const STAT_NAMES = { spd: 'SPEED', pow: 'POWER', acc: 'ACCURACY', wall: 'WALL PLAY' };
const city = v => (LOCS[v] && LOCS[v].city) || v.toUpperCase();

export function renderCareerTab() {
  const box = document.getElementById('careerBox');
  if (!box) return;
  const p = profile(), nx = nextEvent();
  const pct = p.level >= MAX_LEVEL ? 100 : Math.round(100 * p.xp / xpToNext(p.level));
  const stat = k => `<div class="cstat"><span>${STAT_NAMES[k]}</span><span class="cbar">${'■'.repeat(p.alloc[k])}${'□'.repeat(MAX_ALLOC - p.alloc[k])}</span>`
    + `<button data-spend="${k}" ${p.points && p.alloc[k] < MAX_ALLOC ? '' : 'disabled'}>+</button></div>`;
  const tiers = TIERS.map((t, ti) => {
    const open = tierUnlocked(ti);
    const evs = t.events.map(e => {
      const st = eventState(e.id);
      return `<span class="cev ${st}">${st === 'won' ? '✓ ' : ''}${e.final ? '★ ' : ''}${open ? e.opp : '???'}<i>${open ? city(e.venue) : ''}</i></span>`;
    }).join('');
    return `<div class="ctier ${open ? '' : 'locked'}"><b>${t.name}</b>${evs}</div>`;
  }).join('');
  const trails = TRAILS.map(tr => {
    const has = p.unlocked.includes(tr.id);
    const how = has ? '' : (LEVEL_UNLOCKS.find(u => u.id === tr.id) ? 'LV ' + LEVEL_UNLOCKS.find(u => u.id === tr.id).level : TIERS.find(t => t.reward === tr.id)?.name.split(' ')[0] || '');
    return `<button data-trail="${tr.id}" aria-pressed="${p.trail === tr.id}" ${has ? '' : 'disabled'}>${has ? tr.name : how}</button>`;
  }).join('');
  box.innerHTML = `
    <div class="clevel"><span class="px">LEVEL ${p.level}</span><span class="cxp"><span style="width:${pct}%"></span></span><span>${p.level >= MAX_LEVEL ? 'MAX' : p.xp + '/' + xpToNext(p.level) + ' XP'}</span></div>
    <div class="cgrid">
      <div class="cstats"><div class="help"><b>SKILL POINTS: ${p.points}</b></div>${['spd', 'pow', 'acc', 'wall'].map(stat).join('')}
        <button class="clink" data-refund ${Object.values(p.alloc).some(v => v) ? '' : 'disabled'}>RESET POINTS</button></div>
      <div class="ctiers">${tiers}</div>
    </div>
    <div class="opt"><span class="px">TRAIL</span><div class="seg ctrail">${trails}</div></div>
    <button class="big" id="careerPlay">PLAY: ${nx.final ? 'FINAL · ' : ''}${nx.opp} · ${city(nx.venue)} ▸</button>`;
  box.querySelectorAll('[data-spend]').forEach(b => b.onclick = () => { spendPoint(b.dataset.spend); renderCareerTab() });
  const rf = box.querySelector('[data-refund]'); if (rf) rf.onclick = () => { refundPoints(); renderCareerTab() };
  box.querySelectorAll('[data-trail]').forEach(b => b.onclick = () => { equipTrail(b.dataset.trail); renderCareerTab() });
  document.getElementById('careerPlay').onclick = () => { initAudio(); startCareerEvent(); startGame() };
}
