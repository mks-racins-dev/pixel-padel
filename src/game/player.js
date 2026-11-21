import { S } from '../state.js';
import { STYLES } from './constants.js';
import { settings } from './settings.js';

/* ---------------- custom player ---------------- */
export const PAL={skin:['#f6d2b4','#e8b48a','#c98d62','#b97a52','#8d5a3b','#5e3a26'],hair:['#1f1a17','#4a2c1a','#7a3a22','#d9b26a','#e86a3a','#8e6cc1'],
  shirt:['#e4572e','#f2c14e','#3fa7a8','#4f9a5b','#8e6cc1','#f4ead2'],shorts:['#2d2a3a','#3b5b8c','#f4ead2','#1f2a44','#b8483a','#4f9a5b'],
  frame:['#f2c14e','#e4572e','#3fa7a8','#f4ead2','#8e6cc1','#2d2a3a'],band:['none','#f4ead2','#e4572e','#f2c14e','#3fa7a8','#8e6cc1']};
export const LOOK_DEF={gender:'boy',hand:'right',skin:'#e8b48a',hair:'#4a2c1a',shirt:'#e4572e',shorts:'#2d2a3a',frame:'#f2c14e',band:'#f4ead2'};
export const HEX=/^#[0-9a-f]{6}$/i;
export function cleanLook(d){const o={...LOOK_DEF};if(d&&typeof d==='object'){if(d.gender==='girl'||d.gender==='boy')o.gender=d.gender;if(d.hand==='left'||d.hand==='right')o.hand=d.hand;for(const k of['skin','hair','shirt','shorts','frame'])if(HEX.test(d[k]))o[k]=d[k];if(d.band==='none'||HEX.test(d.band))o.band=d.band}return o}
export function mkLook(d){d=cleanLook(d);const g=d.gender==='girl';return{id:'c'+Object.values(d).join(''),skin:d.skin,hair:d.hair,shirt:d.shirt,shorts:d.shorts,frame:d.frame,band:d.band==='none'?null:d.band,skirt:g,tail:g,hand:d.hand}}
export function saveLook(){try{localStorage.setItem('pixelpadel-player',JSON.stringify({look:S.myLookData,style:settings.style}))}catch(e){}}
export function mkPlayer(team,look,ctrl,homeX){return{team,look,ctrl,homeX,x:homeX,y:team===0?-8:8,vx:0,vy:0,tx:homeX,ty:team===0?-8:8,swingT:0,swingType:'drive',swingReq:null,hitDone:true,think:0,anim:0,flip:false,willMiss:false,missLeg:-1,mvx:0,mvy:0,energy:0,charging:null,charge:0,power:1,reqPower:1,serveAim:0.5,sk:STYLES.allround}}

/** One-time side effects (DOM wiring, saved settings). Called from main.js. */
export function setup(){
  S.myLookData={...LOOK_DEF};
  try{const s=JSON.parse(localStorage.getItem('pixelpadel-player')||'null');if(s){S.myLookData=cleanLook(s.look);if(STYLES[s.style])settings.style=s.style}}catch(e){}
}
