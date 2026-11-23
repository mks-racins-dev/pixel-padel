// The DAILY tab: today's and this week's challenges, and the Weekly Cup.
import { S } from '../state.js';
import { chState, dailySet, weeklySet, msToNextDay, onChallengeComplete, streak, CHEST, weekNumber } from '../meta/challenges.ts';
import { mulberry } from '../core/gfx.js';
import { venueThumb } from '../render/venue.js';
import { t } from './i18n.js';
import { cupFor, cupState, startCup, RUN, ROUNDS } from '../meta/cup.ts';
import { LOCS } from '../content/venues.js';
import { startGame } from './ui.js';
import { initAudio } from '../audio/sfx.js';

const hm = ms => { const m = Math.max(0, Math.round(ms / 6e4)); return `${Math.floor(m / 60)}H ${m % 60}M` };

function row(c, slot) {
  const n = slot ? slot.n : 0, done = slot && slot.done;
  return `<div class="dch ${done ? 'done' : ''}"><span>${done ? '✓ ' : ''}${c.text}</span>`
    + `<span class="dbar"><span style="width:${Math.round(100 * n / c.need)}%"></span></span><span>${n}/${c.need}</span><b>+${c.xp}</b></div>`;
}

function chest(open) { // a pixel chest drawn with boxes
  return `<span class="chest${open ? ' open' : ''}" aria-hidden="true"><i class="lid"></i><i class="body"></i><i class="lock"></i></span>`;
}
export function renderDailyTab() {
  const box = document.getElementById('dailyBox');
  if (!box) return;
  const st = chState(), sk = streak(), set = dailySet(st.day), n = set.filter(c => st.daily[c.id]?.done).length;
  const dots = Array.from({ length: 7 }, (_, i) => `<i class="${i < Math.min(7, sk.n) ? 'on' : ''}${i === 6 ? ' big' : ''}"></i>`).join('');
  box.innerHTML = `
    <div class="dtop">
      <div class="dstreak"><span class="px">${t('d_streak')}</span><b class="px">${sk.n} ${t('d_days')}</b><span class="ddots">${dots}</span></div>
      <div class="dchest ${sk.chest ? 'done' : ''}">${chest(sk.chest)}<span>${sk.chest ? t('d_opened') : t('d_chest')}</span><b class="px">${n}/3</b></div>
    </div>
    <div class="dhead"><span class="px">${t('d_daily')}</span><span>${t('d_new')} ${hm(msToNextDay())}</span></div>
    ${set.map(c => row(c, st.daily[c.id])).join('')}
    <div class="dhead"><span class="px">${t('d_weekly')}</span><span>${t('d_reset')}</span></div>
    ${weeklySet(st.week).map(c => row(c, st.weekly[c.id])).join('')}
    <div class="help small">${t('d_note')}</div>`;
}

const EXTRA = ['KAI', 'MILA', 'TOMAS', 'ELIF', 'RUBEN', 'NORA', 'YUKI', 'PAVEL', 'AINO', 'BRUNO'];
export function renderCupTab() {
  const box = document.getElementById('cupBox');
  if (!box) return;
  const cup = cupFor(), cs = cupState();
  const city = (LOCS[cup[0].venue] || {}).city || '';
  const best = cs.champion ? 'CHAMPION ★' : cs.best ? ROUNDS[cs.best - 1] + ' ✓' : t('c_none');
  const r = mulberry(weekNumber() * 7 + 3), pool = EXTRA.filter(x => !cup.some(e => e.opp === x));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
  const [o0, o1, o2] = cup.map(e => e.opp), [n1, n2, n3, n4] = pool, you = t('c_you'), at = RUN.round;
  const m = (a, b, cls) => `<div class="bm ${cls || ''}"><span class="${a === you ? 'me' : ''}">${a}</span><span class="${b === you ? 'me' : ''}">${b}</span></div>`;
  const st = i => (i < at ? 'won' : i === at ? 'next' : 'later');
  box.innerHTML = `
    <div class="mtitle px">${t('c_title')} · ${city}</div>
    <div class="help small">${t('c_info')}</div>
    <div class="bracket">
      <div class="bcol"><span class="px">QF</span>${m(you, o0, 'mine ' + st(0))}${m(o1, n1)}${m(o2, n2)}${m(n3, n4)}</div>
      <div class="bcol"><span class="px">SF</span>${m(you, o1, 'mine ' + st(1))}${m(o2, n3)}</div>
      <div class="bcol"><span class="px">FINAL</span>${m(you, o2, 'mine ' + st(2))}</div>
      <div class="bcol prize"><span class="px">${t('c_prize')}</span><span class="trophy" aria-hidden="true"><i></i><i></i><i></i></span><b class="px">+150 XP</b><span class="vthumb" id="cupThumb"></span></div>
    </div>
    <div class="dhead"><span>${t('c_best')}</span><span class="px">${best}</span></div>
    <button class="big" data-primary id="cupPlay">${at ? t('c_cont') + ': ' + cup[at].round + ' ▸' : t('c_play')}</button>`;
  document.getElementById('cupPlay').onclick = () => { initAudio(); startCup(false); startGame() };
  setTimeout(() => { const u = venueThumb(cup[0].venue), el = document.getElementById('cupThumb'); if (u && el) el.style.backgroundImage = `url(${u})` }, 30);
}

// a small pop-up on court when a challenge completes mid-match
onChallengeComplete(c => {
  const me = S.players.find(p => p.ctrl === 'h1');
  if (me) S.floats.push({ x: me.x, y: me.y, t: 1.4, text: 'CHALLENGE DONE!', c: '#9be37a' });
});
