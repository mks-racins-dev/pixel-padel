import { rand } from '../core/rng.ts';
import { S } from '../state.js';
import { SPEED_H, movK, sweet } from '../game/constants.js';
import { stepBall } from '../game/physics.js';
import { diffOf, isHuman, teamOf } from '../game/rules.js';
import { settings } from '../game/settings.js';

/* ---------------- AI ---------------- */
export const wallPref={leg:null,on:false};
export function predict(team,volley){
  if(S.state!=='play'||S.R0.lastTeam===team||S.ball.held)return[];
  const b={x:S.ball.x,y:S.ball.y,z:S.ball.z,vx:S.ball.vx,vy:S.ball.vy,vz:S.ball.vz,out:false,rolling:S.ball.rolling,spin:S.ball.spin};
  let bounces=S.R0.bounces,end=false,fault=false,wall=false;const out=[];let t=0;const dt=1/60;
  for(let i=0;i<180&&!end;i++){
    stepBall(b,dt,(ty,a,g,bk)=>{if(ty==='floor'||ty==='roll'){if(bounces===0&&a!==team){end=true;fault=true}bounces++;if(bounces>=2)end=true}if(ty==='out'){end=true;if(bounces===0)fault=true}if(ty==='wall'&&bounces===0&&a===team){end=true;fault=true}if(ty==='wall'&&bounces>=1&&a===team&&bk)wall=true});
    t+=dt;if(end)break;
    if((b.y<0?0:1)===team&&b.z<2.4&&b.z>0.18&&(bounces>=1||(!S.R0.serve&&volley&&Math.abs(b.y)<5)))out.push({x:b.x,y:b.y,z:b.z,t,wall});
  }
  return fault?[]:out;
}
export function bestCand(q,cands){const D=diffOf(q);const spd=(isHuman(q)?SPEED_H:D.spd)*movK(q);let first=null,bs=-1e9,bc=null;
  for(const c of cands){const need=Math.hypot(c.x-q.x,c.y-q.y)/spd+D.react;const sl=c.t-need;if(sl>=0&&c.z<1.7&&!first)first={c,slack:sl};if(sl>bs){bs=sl;bc=c}}
  return first||(bc?{c:bc,slack:bs}:null)}
export function aiPlan(team){
  const mates=teamOf(team);const D=diffOf(mates.find(q=>!isHuman(q))||mates[0]);
  let cands=predict(team,D.volley);const dir=team===0?-1:1;
  if(wallPref.leg!==S.R0.hits+'_'+team){wallPref.leg=S.R0.hits+'_'+team;wallPref.on=rand()<(settings.diff==='easy'?0.25:0.5)}
  if(wallPref.on){const wc=cands.filter(c=>c.wall);if(wc.length)cands=wc}
  const attacking=S.state==='play'&&S.R0.lastTeam===team;
  let chooser=null,pick=null;
  if(cands.length){
    const ev=mates.map(q=>({q,b:bestCand(q,cands)})).filter(e=>e.b);
    const human=mates.find(isHuman);
    if(human){const ai=ev.find(e=>!isHuman(e.q));if(ai&&ai.b.c.x*Math.sign(ai.q.homeX||-1)>0.2){chooser=ai.q;pick=ai.b.c}}
    else{ev.sort((a,b)=>(b.b.slack>=0)-(a.b.slack>=0)||a.b.c.t-b.b.c.t);if(ev.length){chooser=ev[0].q;pick=ev[0].b.c}}
  }
  for(const q of mates){if(isHuman(q))continue;
    if(q===chooser){q.tx=pick.x-(pick.x>q.x?0.35:-0.35)*0.6;q.ty=pick.y+dir*0.3}
    else{q.tx=mates.length>1?q.homeX:(attacking?S.ball.x*0.4:0);q.ty=dir*(attacking?(mates.length>1?5.8:6.8):8.2)}
  }
}
export function aiShot(p){
  const opp=teamOf(1-p.team);let type='drive';
  const oppNet=opp.some(q=>Math.abs(q.y)<4.8);
  if(S.ball.z<1.6&&rand()<(oppNet?0.45:0.16))type='lob';
  let bx=0,bs=-1;for(const x of[-3.8,-1.8,0,1.8,3.8]){const d=Math.min(...opp.map(q=>Math.abs(q.x-x)))+rand()*1.3;if(d>bs){bs=d;bx=x}}
  if(p.energy>=100&&rand()<0.7)return{type:'vibora',aimX:bx,power:1};
  let power=rand()<0.15?sweet(p)+rand()*(1-sweet(p)):0.5+rand()*(sweet(p)-0.5);
  if(type==='drive'&&opp.every(q=>Math.abs(q.y)>6.8)&&rand()<0.28)power=0.08+rand()*0.14;
  return{type,aimX:bx,power};
}
