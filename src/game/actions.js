// What a player's buttons do: start charging a shot, release it, ask for a vibora.
// Shared by local input, the online host and the game server.
import { S } from '../state.js';
import { sweet } from './constants.js';

export function startCharge(p,type){if(p.charging)return;p.charging=type;p.charge=0}
export function releaseCharge(p){if(!p.charging)return;p.swingReq=p.charging;p.reqPower=Math.max(0.06,p.charge);p.charging=null;p.charge=0}
export function tryVibora(p){if(S.state==='serve'&&S.R0.server===p){p.swingReq='drive';p.reqPower=sweet(p);return}if(p.energy>=100){p.swingReq='vibora';p.reqPower=1}else{S.floats.push({x:p.x,y:p.y,t:0.7,text:'NOT READY',c:'#c9bba6'})}}
