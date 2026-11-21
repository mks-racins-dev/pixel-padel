import { menuMove, menuPrimary } from '../ui/menu.js';
import { S } from '../state.js';
import { sweet } from '../game/constants.js';
import { isHuman } from '../game/rules.js';
import { settings } from '../game/settings.js';
import { netSend } from '../net/online.js';
import { togglePause } from '../ui/ui.js';

/* ---------------- input ---------------- */
export const keys={};
export const touchIn={mx:0,my:0};
export const SCHEMES={
  solo:{up:['KeyW','ArrowUp'],down:['KeyS','ArrowDown'],left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],drive:['Space','KeyJ'],lob:['KeyK','ShiftLeft','ShiftRight'],vib:['KeyL','KeyE']},
  p1:{up:['KeyW'],down:['KeyS'],left:['KeyA'],right:['KeyD'],drive:['KeyF'],lob:['KeyG'],vib:['KeyR']},
  p2:{up:['ArrowUp'],down:['ArrowDown'],left:['ArrowLeft'],right:['ArrowRight'],drive:['KeyK','Enter'],lob:['KeyL'],vib:['KeyO']}
};
export function schemeOf(p){if(settings.mode==='pvp')return p.ctrl==='h1'?SCHEMES.p1:SCHEMES.p2;return SCHEMES.solo}
export function inputOf(p){if(p.ctrl==='net')return(S.net&&S.net.remoteIn)||{mx:0,my:0};const s=schemeOf(p);const on=a=>a.some(k=>keys[k]);let mx=(on(s.right)?1:0)-(on(s.left)?1:0),my=(on(s.up)?1:0)-(on(s.down)?1:0);if(p.ctrl==='h1'&&(touchIn.mx||touchIn.my)){mx=touchIn.mx;my=touchIn.my}const g=padMove(padOf(p));if(g){mx=g.mx;my=g.my}return{mx,my}}
export const isGuest=()=>!!(S.net&&S.net.role==='guest'&&!S.demo);
export function actStart(p,a){if(isGuest())netSend({t:'d',a});else startCharge(p,a)}
export function actRelease(p,a){if(isGuest())netSend({t:'u',a});else if(p.charging===a)releaseCharge(p)}
export function actVib(p){if(isGuest())netSend({t:'v'});else tryVibora(p)}
export function startCharge(p,type){if(p.charging)return;p.charging=type;p.charge=0}
export function releaseCharge(p){if(!p.charging)return;p.swingReq=p.charging;p.reqPower=Math.max(0.06,p.charge);p.charging=null;p.charge=0}
export function tryVibora(p){if(S.state==='serve'&&S.R0.server===p){p.swingReq='drive';p.reqPower=sweet(p);return}if(p.energy>=100){p.swingReq='vibora';p.reqPower=1}else{S.floats.push({x:p.x,y:p.y,t:0.7,text:'NOT READY',c:'#c9bba6'})}}

/* ---------------- gamepad ---------------- */
// Standard mapping: A = hit, B/X = lob, Y/RB/RT = vibora, Start = pause / menu confirm.
// Player 1 uses the first connected pad; in 2-player mode player 2 uses the second.
const PAD={drive:[0],lob:[1,2],vib:[3,5,7],start:[9]};
const padPrev=[{},{}];let padNavPrev=0;
function pads(){try{return[...(navigator.getGamepads?navigator.getGamepads():[])].filter(g=>g&&g.connected)}catch(e){return[]}}
function padSlot(p){return settings.mode==='pvp'&&p.ctrl==='h2'?1:0}
function padOf(p){return p.ctrl==='net'?null:pads()[padSlot(p)]||null}
const down=(g,list)=>list.some(i=>g.buttons[i]&&g.buttons[i].pressed);
export function padMove(g){
  if(!g)return null;
  let mx=g.axes[0]||0,my=-(g.axes[1]||0);
  if(Math.hypot(mx,my)<0.25){mx=0;my=0}
  if(down(g,[14]))mx=-1;else if(down(g,[15]))mx=1;
  if(down(g,[12]))my=1;else if(down(g,[13]))my=-1;
  return mx||my?{mx:Math.max(-1,Math.min(1,mx)),my:Math.max(-1,Math.min(1,my))}:null;
}
/** Call once per frame: turns pad button edges into the same actions as the keyboard. */
export function pollPads(){
  const ps=pads();if(!ps.length)return;
  ps.slice(0,2).forEach((g,slot)=>{
    const prev=padPrev[slot],now={};for(const k in PAD)now[k]=down(g,PAD[k]);padPrev[slot]=now;
    const pressed=k=>now[k]&&!prev[k],released=k=>!now[k]&&prev[k];
    // up/down on the stick or d-pad moves through the main menu
    const vy=down(g,[12])?-1:down(g,[13])?1:Math.abs(g.axes[1]||0)>0.6?Math.sign(g.axes[1]):0;
    if(slot===0&&vy&&vy!==padNavPrev&&document.getElementById('menu')&&!document.getElementById('menu').hidden)menuMove(vy);
    if(slot===0)padNavPrev=vy;
    if(pressed('start')){menuConfirm(true);return}
    if(pressed('drive')&&slot===0&&menuConfirm(false))return;
    if(S.demo||S.paused)return;
    for(const p of S.players){if(!isHuman(p)||p.ctrl==='net'||padSlot(p)!==slot)continue;
      if(pressed('drive'))actStart(p,'drive');if(released('drive'))actRelease(p,'drive');
      if(pressed('lob'))actStart(p,'lob');if(released('lob'))actRelease(p,'lob');
      if(pressed('vib'))actVib(p)}
  });
}
/** Start / A on menus: play, play again, pause and resume. Returns true if the press was used. */
function menuConfirm(start){
  const vis=id=>{const e=document.getElementById(id);return!!e&&!e.hidden};
  if(vis('menu'))return menuPrimary();
  if(vis('end')){document.getElementById('againBtn').click();return true}
  if(vis('pause')||(start&&!S.demo&&S.state!=='menu')){togglePause();return true}
  return false;
}

/** One-time side effects (DOM wiring, saved settings). Called from main.js. */
export function setup(){
  addEventListener('keydown',e=>{
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
    if(e.repeat){keys[e.code]=true;return}
    keys[e.code]=true;
    if((e.code==='Escape'||e.code==='KeyP')&&!S.demo&&S.state!=='menu'&&document.getElementById('end').hidden){togglePause();return}
    if(S.demo||S.paused)return;
    for(const p of S.players){if(!isHuman(p)||p.ctrl==='net')continue;const s=schemeOf(p);if(s.drive.includes(e.code))actStart(p,'drive');else if(s.lob.includes(e.code))actStart(p,'lob');else if(s.vib.includes(e.code))actVib(p)}
  });
  addEventListener('keyup',e=>{keys[e.code]=false;if(S.demo)return;for(const p of S.players){if(!isHuman(p)||p.ctrl==='net')continue;const s=schemeOf(p);for(const a of['drive','lob'])if(s[a].includes(e.code))actRelease(p,a)}});
  addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
}
