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
export function inputOf(p){if(p.ctrl==='net')return(S.net&&S.net.remoteIn)||{mx:0,my:0};const s=schemeOf(p);const on=a=>a.some(k=>keys[k]);let mx=(on(s.right)?1:0)-(on(s.left)?1:0),my=(on(s.up)?1:0)-(on(s.down)?1:0);if(p.ctrl==='h1'&&(touchIn.mx||touchIn.my)){mx=touchIn.mx;my=touchIn.my}return{mx,my}}
export const isGuest=()=>!!(S.net&&S.net.role==='guest'&&!S.demo);
export function actStart(p,a){if(isGuest())netSend({t:'d',a});else startCharge(p,a)}
export function actRelease(p,a){if(isGuest())netSend({t:'u',a});else if(p.charging===a)releaseCharge(p)}
export function actVib(p){if(isGuest())netSend({t:'v'});else tryVibora(p)}
export function startCharge(p,type){if(p.charging)return;p.charging=type;p.charge=0}
export function releaseCharge(p){if(!p.charging)return;p.swingReq=p.charging;p.reqPower=Math.max(0.06,p.charge);p.charging=null;p.charge=0}
export function tryVibora(p){if(S.state==='serve'&&S.R0.server===p){p.swingReq='drive';p.reqPower=sweet(p);return}if(p.energy>=100){p.swingReq='vibora';p.reqPower=1}else{S.floats.push({x:p.x,y:p.y,t:0.7,text:'NOT READY',c:'#c9bba6'})}}

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
