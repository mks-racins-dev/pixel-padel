import { emit } from '../meta/events.ts';
import { takeRecent } from '../meta/challenges.ts';
import { finishCupMatch, startCup } from '../meta/cup.ts';
import { CAREER, finishCareerMatch, leaveCareer } from '../meta/career.ts';
import { finishSeasonMatch, CROWN_STREAK } from '../meta/season.ts';
import { finishDoublesMatch } from '../meta/doubles.ts';
import { buildMenu, renderMenu } from './menu.js';
import { isPractice, practiceHud } from '../game/practice.js';
import { matchEnd, matchQuit } from '../core/analytics.ts';
import { S } from '../state.js';
import { initAudio, sfx } from '../audio/sfx.js';
import { $ } from '../core/gfx.js';
import { STYLES } from '../game/constants.js';
import { PAL, mkLook, saveLook } from '../game/player.js';
import { isHuman, matchGames, newMatch, teamName } from '../game/rules.js';
import { setLoc, settings } from '../game/settings.js';
import { gradeFor } from '../render/grades.js';
import { confetti } from '../render/drama.ts';
import { renderCouch } from './couch.js';
import { resetStars, finishStars } from '../meta/stars.ts';
import { addXp, profile } from '../meta/profile.ts';
import { earnCoins, matchCoins } from '../meta/gear.ts';
const coinLine=n=>'<div class="coinln">+'+n+' COINS</div>';
import { actRelease, actStart, actVib, touchIn } from '../input/input.js';
import { myTeam, netClose, netSend, onStatus, startOnline } from '../net/online.js';
import { prevG } from './preview.js';
import { renderHelp } from './help.js';
import { t } from './i18n.js';

export const PT=['0','15','30','40'];
export function updateEnergy(){
  const hs=S.players.filter(isHuman);
  for(let i=0;i<2;i++){const el=$('e'+i),p=hs[i];if(!p){el.hidden=true;continue}el.hidden=false;
    el.querySelector('.enm').textContent=settings.mode==='pvp'?(p.ctrl==='h1'?'P1':'P2'):settings.mode==='online'?(p.ctrl==='h1'?'YOUR':'RIVAL'):'YOUR';
    el.querySelector('i').style.width=p.energy+'%';const full=p.energy>=100;el.classList.toggle('full',full);
    const k=settings.mode==='pvp'?(p.ctrl==='h1'?'R':'O'):(coarse?'VIB':'L / E');
    el.querySelector('.ehint').textContent=full?'VIBORA READY · '+k:'hit to charge'}
}
export function updateHud(){
  if(!S.score)return;
  if(isPractice())return practiceHud();
  $('r0').querySelector('.nm').textContent=teamName(0);$('r1').querySelector('.nm').textContent=teamName(1);
  $('r0').querySelector('.g').textContent=S.score.games[0];$('r1').querySelector('.g').textContent=S.score.games[1];
  $('r0').querySelector('.pt').textContent=PT[S.score.pts[0]]||'0';$('r1').querySelector('.pt').textContent=PT[S.score.pts[1]]||'0';
  const st=(S.score.games[0]+S.score.games[1])%2;$('r0').classList.toggle('serving',st===0);$('r1').classList.toggle('serving',st===1);
  const gp=S.score.pts[0]===3&&S.score.pts[1]===3;
  $('info').textContent=gp?'GOLDEN POINT!':CAREER.active&&CAREER.kind==='cup'?'WEEKLY CUP · '+CAREER.event.round:'FIRST TO '+matchGames()+' GAMES';
}
export function showMsg(big,small){if(S.demo)return;if(S.net&&S.net.role==='host')netSend({t:'msg',b:big,s:small||''});$('msgBig').textContent=big;$('msgSmall').textContent=small||'';$('msg').classList.add('show')}
export function hideMsg(){if(S.net&&S.net.role==='host'&&!S.demo)netSend({t:'hide'});$('msg').classList.remove('show')}
export function showEnd(){
  S.state='over';const w=S.score.winner;
  const on=settings.mode==='online';const human=on?w===myTeam():(settings.mode!=='pvp'&&settings.mode!=='couch'&&w===0);
  matchEnd({won:human,games:S.score.games.slice()});
  if(on)try{const me=myTeam(),rec=JSON.parse(localStorage.getItem('pixelpadel-recent')||'[]');rec.unshift({name:teamName(1-me),won:human,score:S.score.games[me]+'-'+S.score.games[1-me],ranked:!!(S.net&&S.net.ranked),at:Date.now()});localStorage.setItem('pixelpadel-recent',JSON.stringify(rec.slice(0,8)))}catch(e){}
  if(S.net&&S.net.role==='host')netSend({t:'end'});
  $('endTitle').textContent=settings.mode==='couch'?(w===0?'TEAM A WINS!':'TEAM B WINS!'):settings.mode==='pvp'?(w===0?'PLAYER 1 WINS!':'PLAYER 2 WINS!'):(human?'YOU WIN!':(on?'RIVAL WINS':'CPU WINS'));
  $('endScore').textContent=S.score.games[0]+' – '+S.score.games[1];
  $('againBtn').textContent='REMATCH';$('endInfo').innerHTML='';$('endRank').hidden=true;$('endRank').classList.remove('pop');
  const me=S.players.find(p=>p.ctrl==='h1'),myT=me?me.team:0;
  emit({type:'match',won:human,mode:settings.mode,venue:settings.loc,gamesLost:S.score.games[1-myT],career:CAREER.active&&CAREER.kind==='career',cup:CAREER.active&&CAREER.kind==='cup'});
  let lines='';
  if(CAREER.active&&CAREER.kind==='cup'){const r=finishCupMatch(human);lines=cupSummary(r);$('againBtn').textContent=r.over?'NEW CUP RUN':'NEXT ROUND'}
  else if(CAREER.active&&CAREER.kind==='doubles'){const dt=CAREER.event.tier;const r=finishDoublesMatch(human,S.score.games[0]);const cn=earnCoins(matchCoins(human,dt,r.first));lines=coinLine(cn)+['+'+r.xp+' XP','CHEMISTRY WITH '+r.partner+': '+r.chem+'/100'+(r.gained?' (+'+r.gained+')':''),r.perk?'NEW: '+r.partner+' '+r.perk:''].filter(Boolean).join('<br>');$('againBtn').textContent='DOUBLES ▸'}
  else if(CAREER.active&&CAREER.kind==='season'){const r=finishSeasonMatch(human,S.score.games[0]);lines=coinLine(earnCoins(matchCoins(human,3,false)))+seasonSummary(r);$('againBtn').textContent='SEASON ▸'}
  else if(CAREER.active){const evId=CAREER.event.id,evTier=CAREER.event.tier,wasWon=profile().career.won.includes(evId);const r=finishCareerMatch(human,S.score.games[0],S.score.games[1]);const st=finishStars(evId,human,S.score.games[1]);if(st.xp)addXp(st.xp);lines=starsHtml(st)+coinLine(earnCoins(matchCoins(human,evTier,!wasWon,st.newStars)))+careerSummary(r);if(r.rankBefore>r.rank)setTimeout(()=>animRank(r.rankBefore,r.rank),500);CAREER.toMap=!!r.toMap;const nx=!r.toMap&&r.won&&CAREER.event;if(nx&&!r.last)lines+='<div class="nextup"><span class="px">NEXT</span> '+(nx.stage?nx.stage+' · ':'')+nx.opp+'</div>';$('againBtn').textContent=r.toMap?(r.free?'TOWN MAP ▸':'CONTINUE ▸'):r.last&&r.won?'PLAY AGAIN':r.won?'PLAY NEXT ▸':'RETRY';if(r.rival&&!r.won)$('endTitle').textContent='RUTA WINS… FOR NOW'}
  const ch=takeRecent().map(c=>'CHALLENGE DONE: '+c.text+' +'+c.xp+' XP');
  $('endInfo').innerHTML=[lines,...ch].filter(Boolean).join('<br>');
  $('end').hidden=false;$('touch').hidden=true;sfx(human||settings.mode==='pvp'?'win':'lose');if(human||settings.mode==='pvp'||settings.mode==='couch')confetti();
}
export function setHelp(){
  const st=STYLES[settings.style];
  const bar=(k,v)=>`<span class="sbar"><i>${t(k)}</i><b>${'<u class="on"></u>'.repeat(Math.round(v))}${'<u></u>'.repeat(5-Math.round(v))}</b></span>`;
  $('styleInfo').innerHTML=`<div class="srow"><b class="px">${st.name}</b>${bar('pl_spd',st.spd)}${bar('pl_pow',st.pow)}${bar('pl_acc',st.acc)}</div><div class="sdesc">${t('st_'+settings.style)} · ${S.myLookData.hand==='left'?'Left':'Right'}-handed · saved on this device</div>`;
  renderHelp();
}
export function press(seg,v){seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===String(v)?'true':'false'))}
export const coarse=matchMedia('(pointer:coarse)').matches;
export function showGameUI(){initAudio();$('menu').hidden=true;$('online').hidden=true;$('end').hidden=true;$('pause').hidden=true;S.paused=false;$('hud').hidden=false;$('touch').hidden=!(coarse&&settings.mode!=='pvp'&&settings.mode!=='couch');$('msg').classList.remove('show')}
export function startGame(){
  if(settings.mode==='online'){
    if(S.net&&S.net.conn&&S.net.conn.open){if(S.net.role==='host')startOnline();else{netSend({t:'again'});$('endTitle').textContent='WAITING FOR HOST…'}}
    else{initAudio();$('menu').hidden=true;$('end').hidden=true;$('online').hidden=false;$('codeShow').textContent='';onStatus('Host to get a code, or type a friend\'s code and join.')}
    return}
  if(CAREER.active&&CAREER.kind!=='cup'&&CAREER.toMap)return toMenu();
  if(CAREER.active&&CAREER.kind==='cup')startCup(false); // next round, or round 1 after a run ended
  resetStars(!!(CAREER.active&&CAREER.kind==='career'));
  if(CAREER.active)setLoc(CAREER.event.venue,gradeFor(CAREER.event));else if(S.grade)setLoc(settings.loc,0);
  showGameUI();newMatch(false)}
export function toMenu(){if(S.grade)setLoc(settings.loc,0);matchQuit();leaveCareer();netClose();$('online').hidden=true;S.paused=false;$('pause').hidden=true;$('end').hidden=true;$('hud').hidden=true;$('touch').hidden=true;$('menu').hidden=false;hideMsg();newMatch(true);renderMenu()}
export function togglePause(){if(S.net&&!S.demo){$('pause').hidden=!$('pause').hidden;return}S.paused=!S.paused;$('pause').hidden=!S.paused}

function cupSummary(r){
  const bits=[r.won?r.round+' WON!':'OUT IN THE '+r.round,'+'+r.xp+' XP'];
  if(r.champion)bits.push('WEEKLY CUP CHAMPION!');
  bits.push('BEST THIS WEEK: '+(r.best>=3?'CHAMPION':r.best?['','QUARTER-FINAL WON','SEMI-FINAL WON'][r.best]:'NO WINS YET'));
  return bits.join('<br>');
}
function seasonSummary(r){
  const bits=['+'+r.xp+' XP'];
  if(r.defended)bits.push('TITLE DEFENDED! STREAK: '+r.streak+' WEEK'+(r.streak>1?'S':''));
  else if(r.won)bits.push(r.left?r.left+' DEFENCE'+(r.left>1?'S':'')+' LEFT THIS WEEK':'ALREADY DEFENDED THIS WEEK');
  else bits.push('NO HARM DONE · TRY AGAIN ANY TIME THIS WEEK');
  if(r.crown)bits.push('UNLOCKED: CROWN TRAIL');
  else if(r.defended&&r.streak<CROWN_STREAK)bits.push((CROWN_STREAK-r.streak)+' MORE WEEK'+(CROWN_STREAK-r.streak>1?'S':'')+' IN A ROW FOR THE CROWN TRAIL');
  return bits.join('<br>');
}
/** The three match stars and their goals. */
function starsHtml(st){
  return '<div class="mstars">'+st.got.map((g,i)=>'<span class="'+(g?'on':'')+'" style="--d:'+(0.25+i*0.35)+'s">★</span>').join('')+'</div>'
    +'<div class="sgoals">'+st.goals.map((t,i)=>(st.got[i]?'✓ ':'· ')+t).join('<br>')+'</div>'
    +(st.newStars?'<div>+'+st.newStars+' NEW STAR'+(st.newStars>1?'S':'')+' · +'+st.xp+' XP</div>':'');
}
/** World rank counts down after a win. */
function animRank(from,to){
  const el=$('endRank');if(!el)return;el.hidden=false;const t0=performance.now(),dur=Math.min(2200,600+(from-to)*6);
  const step=now=>{const k=Math.min(1,(now-t0)/dur),e=1-(1-k)**3,v=Math.round(from-(from-to)*e);el.innerHTML='WORLD RANK <b>#'+v+'</b>'+(k>=1?' <i>▲'+(from-to)+'</i>':'');
    if(k<1){if(Math.random()<0.3)sfx('hit',0.15);requestAnimationFrame(step)}else{el.classList.add('pop');sfx('point')}};
  requestAnimationFrame(step);
}
function careerSummary(r){
  const bits=['+'+r.xp+' XP'];
  if(r.prize)bits.push('DARE WON! IN YOUR POCKET: '+r.prize);
  if(r.dareMissed)bits.push('DARE MISSED · TRY AGAIN FOR THE PRIZE');
  if(r.rival)bits.push('THE STORY MOVES ON');
  if(r.knocked)bits.push('KNOCKED OUT IN THE '+r.knocked+' · THE TOURNAMENT STARTS AGAIN');
  if(r.rp)bits.push('+'+r.rp+' RANKING POINTS');
  if(r.goal)bits.push('SPONSOR GOAL DONE: '+r.goal);
  if(r.levels)bits.push('LEVEL UP! +'+r.levels+' SKILL POINT'+(r.levels>1?'S':''));
  if(r.tierDone)bits.push(r.tierDone+' COMPLETE!');
  for(const u of r.unlocked)bits.push('UNLOCKED: '+u);
  if(r.won&&r.last)bits.push('YOU WON THE WHOLE CAREER!');
  return bits.join('<br>');
}

/** One-time side effects (DOM wiring, saved settings). Called from main.js. */
export function setup(){
  buildMenu();
  document.querySelectorAll('.sw').forEach(sw=>{for(const c of PAL[sw.dataset.look]){const b=document.createElement('button');b.dataset.v=c;b.setAttribute('aria-label',sw.dataset.look+' '+c);if(c==='none'){b.textContent='×';b.style.background='#17131c'}else b.style.background=c;sw.appendChild(b)}});
  document.querySelectorAll('.seg').forEach(seg=>{
    press(seg,seg.dataset.look?S.myLookData[seg.dataset.look]:settings[seg.dataset.key]);
    if(!seg.dataset.key&&!seg.dataset.look)return; // segs with their own handler (sound)
    seg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const v=b.dataset.v;press(seg,v);
      if(seg.dataset.look){S.myLookData={...S.myLookData,[seg.dataset.look]:v};saveLook();if(S.demo&&S.players[0])S.players[0].look=mkLook(S.myLookData)}
      else if(seg.dataset.key==='loc'){setLoc(v);try{localStorage.setItem('pixelpadel-venue',v)}catch(e){}}
      else{const k=seg.dataset.key;settings[k]=k==='games'?+v:v;if(k==='style')saveLook();if(k==='mode')renderCouch()}
      setHelp()})});
  prevG.imageSmoothingEnabled=false;
  $('againBtn').onclick=startGame;
  $('menuBtn').onclick=toMenu;
  $('quitBtn').onclick=toMenu;
  $('resumeBtn').onclick=togglePause;
  $('pauseBtn').onclick=togglePause;
  $('soundBtn').onclick=()=>{S.muted=!S.muted;$('soundBtn').textContent='SOUND: '+(S.muted?'OFF':'ON');initAudio()};
  (function(){const st=$('stick'),nub=$('nub');let id=null,cx=0,cy=0;
    st.addEventListener('pointerdown',e=>{id=e.pointerId;st.setPointerCapture(id);const r=st.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;mv(e)});
    function mv(e){if(e.pointerId!==id)return;const r=st.getBoundingClientRect();const max=r.width/2;let dx=e.clientX-cx,dy=e.clientY-cy;const l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max}nub.style.transform='translate('+dx+'px,'+dy+'px)';touchIn.mx=Math.abs(dx/max)>0.25?dx/max:0;touchIn.my=Math.abs(dy/max)>0.25?-dy/max:0}
    st.addEventListener('pointermove',mv);
    const end=e=>{if(e.pointerId!==id)return;id=null;nub.style.transform='';touchIn.mx=touchIn.my=0};st.addEventListener('pointerup',end);st.addEventListener('pointercancel',end);
    const me=()=>S.players.find(q=>q.ctrl==='h1');
    const hb=(btn,type)=>{btn.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();btn.setPointerCapture(e.pointerId);const p=me();if(p)actStart(p,type)});const up=e=>{const p=me();if(p)actRelease(p,type)};btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up)};
    hb($('tDrive'),'drive');hb($('tLob'),'lob');
    $('tVib').addEventListener('pointerdown',e=>{e.preventDefault();const p=me();if(p)actVib(p)});
  })();
}
