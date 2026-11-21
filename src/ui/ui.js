import { isPractice, practiceHud } from '../game/practice.js';
import { matchEnd, matchQuit } from '../core/analytics.ts';
import { S } from '../state.js';
import { initAudio, sfx } from '../audio/sfx.js';
import { $ } from '../core/gfx.js';
import { STYLES } from '../game/constants.js';
import { PAL, mkLook, saveLook } from '../game/player.js';
import { isHuman, newMatch, teamName } from '../game/rules.js';
import { setLoc, settings } from '../game/settings.js';
import { actRelease, actStart, actVib, touchIn } from '../input/input.js';
import { myTeam, netClose, netSend, onStatus, startOnline } from '../net/online.js';
import { prevG } from './preview.js';

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
  $('info').textContent=gp?'GOLDEN POINT!':'FIRST TO '+settings.games+' GAMES';
}
export function showMsg(big,small){if(S.demo)return;if(S.net&&S.net.role==='host')netSend({t:'msg',b:big,s:small||''});$('msgBig').textContent=big;$('msgSmall').textContent=small||'';$('msg').classList.add('show')}
export function hideMsg(){if(S.net&&S.net.role==='host'&&!S.demo)netSend({t:'hide'});$('msg').classList.remove('show')}
export function showEnd(){
  S.state='over';const w=S.score.winner;
  const on=settings.mode==='online';const human=on?w===myTeam():(settings.mode!=='pvp'&&w===0);
  matchEnd({won:human,games:S.score.games.slice()});
  if(S.net&&S.net.role==='host')netSend({t:'end'});
  $('endTitle').textContent=settings.mode==='pvp'?(w===0?'PLAYER 1 WINS!':'PLAYER 2 WINS!'):(human?'YOU WIN!':(on?'RIVAL WINS':'CPU WINS'));
  $('endScore').textContent=S.score.games[0]+' – '+S.score.games[1];
  $('end').hidden=false;$('touch').hidden=true;sfx(human||settings.mode==='pvp'?'win':'lose');
}
export function setHelp(){
  const m=settings.mode,st=STYLES[settings.style],bar=v=>'■'.repeat(v)+'□'.repeat(5-v);
  $('styleInfo').innerHTML='<b>'+st.name+'</b> &nbsp;SPD '+bar(st.spd)+' PWR '+bar(st.pow)+' ACC '+bar(st.acc)+'<br>'+(S.myLookData.hand==='left'?'Left':'Right')+'-handed · saved on this device';
  $('help').innerHTML=(m==='pvp'
    ?'<b>P1</b> (near): WASD · F hit · G lob · R vibora &nbsp; <b>P2</b> (far): arrows · K hit · L lob · O vibora<br>Hold to power up, tap for a soft drop. Past the white line = risk of overhit. Full energy = vibora. Serve: move, then hold hit + left/right to aim.<br>Ball must bounce before their walls; then glass is in play: let it come off the back glass for a boosted wall shot. 2nd bounce = point.'
    :'<b>Move</b> WASD / arrows · <b>Hit</b> Space/J · <b>Lob</b> K/Shift · <b>Vibora</b> L/E · hold left/right to aim<br><b>Hold</b> hit for power, tap for a soft drop. Past the white line = risk of overhit. <b>Serve:</b> move into place, hold hit + left/right to aim, release. Hits fill energy; full bar = vibora (gives the other side +30).<br>Ball must bounce before their walls; then glass is in play: let it come off the back glass for a boosted wall shot. 2nd bounce = point. Golden point at 40–40.'+(m==='2v2'?' Mia covers the left side.':''))+'<br><b>Shots:</b> high ball + hit = <b>bandeja</b> (sliced, stays low); high ball + strong hit = smash; max-power smash near the net = <b>por tres</b> (kicks out over the fence); soft hit from the back = <b>chiquita</b>. <b>Gamepad:</b> A hit · B lob · Y vibora · Start pause.'+(m==='practice'?'<br><b>Practice:</b> a ball machine feeds you balls through 5 short drills: rally, back glass, lob, overheads, vibora. Progress is saved on this device.':'')+(m==='online'?'<br><b>Online:</b> host shares a 4-letter code, the other player joins. Host plays the near side.':'');
}
export function press(seg,v){seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===String(v)?'true':'false'))}
export const coarse=matchMedia('(pointer:coarse)').matches;
export function showGameUI(){initAudio();$('menu').hidden=true;$('online').hidden=true;$('end').hidden=true;$('pause').hidden=true;S.paused=false;$('hud').hidden=false;$('touch').hidden=!(coarse&&settings.mode!=='pvp');$('msg').classList.remove('show')}
export function startGame(){
  if(settings.mode==='online'){
    if(S.net&&S.net.conn&&S.net.conn.open){if(S.net.role==='host')startOnline();else{netSend({t:'again'});$('endTitle').textContent='WAITING FOR HOST…'}}
    else{initAudio();$('menu').hidden=true;$('end').hidden=true;$('online').hidden=false;$('codeShow').textContent='';onStatus('Host to get a code, or type a friend\'s code and join.')}
    return}
  showGameUI();newMatch(false)}
export function toMenu(){matchQuit();netClose();$('online').hidden=true;S.paused=false;$('pause').hidden=true;$('end').hidden=true;$('hud').hidden=true;$('touch').hidden=true;$('menu').hidden=false;hideMsg();newMatch(true)}
export function togglePause(){if(S.net&&!S.demo){$('pause').hidden=!$('pause').hidden;return}S.paused=!S.paused;$('pause').hidden=!S.paused}

/** One-time side effects (DOM wiring, saved settings). Called from main.js. */
export function setup(){
  document.querySelectorAll('.sw').forEach(sw=>{for(const c of PAL[sw.dataset.look]){const b=document.createElement('button');b.dataset.v=c;b.setAttribute('aria-label',sw.dataset.look+' '+c);if(c==='none'){b.textContent='×';b.style.background='#17131c'}else b.style.background=c;sw.appendChild(b)}});
  document.querySelectorAll('.seg').forEach(seg=>{
    press(seg,seg.dataset.look?S.myLookData[seg.dataset.look]:settings[seg.dataset.key]);
    seg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const v=b.dataset.v;press(seg,v);
      if(seg.dataset.look){S.myLookData={...S.myLookData,[seg.dataset.look]:v};saveLook();if(S.demo&&S.players[0])S.players[0].look=mkLook(S.myLookData)}
      else if(seg.dataset.key==='loc'){setLoc(v);try{localStorage.setItem('pixelpadel-venue',v)}catch(e){}}
      else{const k=seg.dataset.key;settings[k]=k==='games'?+v:v;if(k==='style')saveLook()}
      setHelp()})});
  document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('#tabs button').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));
    document.querySelectorAll('.sec').forEach(s=>s.hidden=s.dataset.sec!==b.dataset.sec)}));
  prevG.imageSmoothingEnabled=false;
  $('playBtn').onclick=startGame;
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
