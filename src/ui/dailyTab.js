// The DAILY tab: today's and this week's challenges, and the Weekly Cup.
import { S } from '../state.js';
import { chState, dailySet, weeklySet, msToNextDay, onChallengeComplete } from '../meta/challenges.ts';
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

export function renderDailyTab() {
  const box = document.getElementById('dailyBox');
  if (!box) return;
  const st = chState(), cup = cupFor(), cs = cupState();
  const city = (LOCS[cup[0].venue] || {}).city || '';
  const best = cs.champion ? 'CHAMPION ★' : cs.best ? ROUNDS[cs.best - 1] + ' WON' : 'NOT PLAYED YET';
  box.innerHTML = `
    <div class="dhead"><span class="px">DAILY</span><span>NEW IN ${hm(msToNextDay())}</span></div>
    ${dailySet(st.day).map(c => row(c, st.daily[c.id])).join('')}
    <div class="dhead"><span class="px">WEEKLY</span><span>RESETS MONDAY</span></div>
    ${weeklySet(st.week).map(c => row(c, st.weekly[c.id])).join('')}
    <div class="dhead"><span class="px">WEEKLY CUP · ${city}</span><span>BEST: ${best}</span></div>
    <div class="dcup">${cup.map((e, i) => `<span class="cev ${i < RUN.round ? 'won' : i === RUN.round ? 'next' : ''}">${e.round}<i>${e.opp}</i></span>`).join('')}</div>
    <button class="big" id="cupPlay">${RUN.round ? 'CONTINUE CUP: ' + cup[RUN.round].round : 'PLAY THE WEEKLY CUP'} ▸</button>`;
  document.getElementById('cupPlay').onclick = () => { initAudio(); startCup(false); startGame() };
}

// a small pop-up on court when a challenge completes mid-match
onChallengeComplete(c => {
  const me = S.players.find(p => p.ctrl === 'h1');
  if (me) S.floats.push({ x: me.x, y: me.y, t: 1.4, text: 'CHALLENGE DONE!', c: '#9be37a' });
});
