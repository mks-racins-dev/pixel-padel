import { H } from '../sim/hooks.js';
import { rand } from '../core/rng.ts';
import { S } from '../state.js';
import { aiPlan, aiShot } from '../ai/ai.js';
import { SPEED_H, SVC, movK } from './constants.js';
import { stepBall } from './physics.js';
import { stepChase, stepReturn } from './chase.js';
import { SERVE_AIM_MIN, SERVE_AIM_MAX } from './rules.js';
import { canHit, diffOf, doServe, endPoint, isHuman, onEvent, performHit, soundOnly, teamOf } from './rules.js';

/* ---------------- update ---------------- */
export const STEP=1/120;
export function update(dt){
  S.time+=dt;
  if(S.state==='serve'){
    const srv=S.R0.server;S.stateT-=dt;
    S.ball.x=srv.x+(srv.team===0?0.35:-0.35);S.ball.y=srv.y+(srv.team===0?0.25:-0.25);S.ball.z=0.55+Math.abs(Math.sin(S.time*5))*0.5;
    if(isHuman(srv)){if(srv.swingReq){srv.swingReq=null;doServe(srv,srv.reqPower)}}
    else if(S.stateT<=0)doServe(srv,0);
  }else if(S.state==='play'){
    stepBall(S.ball,dt,onEvent);
    if(S.state==='play'&&S.ball.rolling&&S.R0.bounces>=1)endPoint(S.R0.lastTeam,'DOUBLE BOUNCE');
  }else if(S.state==='chase'){
    stepChase(dt);
  }else if(S.state==='between'){
    stepBall(S.ball,dt,soundOnly);
    S.stateT-=dt;if(S.stateT<=0&&S.afterState){const f=S.afterState;S.afterState=null;H.hideMsg();f()}
  }
  for(const t of[0,1]){const m=teamOf(t);if(m.some(q=>!isHuman(q))){const q0=m.find(q=>!isHuman(q));q0.think-=dt;if(q0.think<=0){q0.think=0.08+rand()*0.06;if(S.state==='play')aiPlan(t);else for(const q of m)if(!isHuman(q)&&S.state!=='serve'){q.tx=q.x;q.ty=q.y}}}}
  for(const p of S.players){
    // out of the cage: the chaser and anyone walking back in are moved by chase.js
    if((S.chase&&S.chase.p===p)||(p.ret&&stepReturn(p,dt))){if(p.swingT>0)p.swingT-=dt;continue}
    const lim=p.team===0?[-9.7,-0.5]:[0.5,9.7];
    if(isHuman(p)){
      const i=H.inputOf(p);const l=Math.hypot(i.mx,i.my)||1;const sc=Math.min(1,Math.hypot(i.mx,i.my));
      const serving=S.state==='serve'&&S.R0.server===p,locked=serving&&p.charging;
      if(locked&&i.mx)p.serveAim=Math.max(SERVE_AIM_MIN,Math.min(SERVE_AIM_MAX,p.serveAim+i.mx*S.R0.boxX*dt*1.5));
      p.vx=locked?0:i.mx/l*SPEED_H*movK(p)*sc;p.vy=locked?0:i.my/l*SPEED_H*movK(p)*sc;
      if(p.charging)p.charge=Math.min(1,p.charge+dt/0.75);
      if(S.state==='play'&&p.swingReq&&p.swingT<=0.06){if(p.swingReq==='vibora'&&p.energy<100){p.swingReq=null}else{p.swingT=0.3;p.swingType=p.swingReq;p.power=p.reqPower;p.hitDone=false;p.swingReq=null}}
      p.wantBack=p.team===0?i.my<-0.3:i.my>0.3;
      if(p.swingT>0&&!p.hitDone&&canHit(p)){const aim=i.mx<-0.3?-3.7:i.mx>0.3?3.7:(-Math.sign(p.x||0.1)*2.2+(rand()-0.5)*1.2);performHit(p,p.swingType,aim,p.power)}
    }else{
      const D=diffOf(p);
      if(S.state==='serve'||S.state==='between'){p.vx*=0.8;p.vy*=0.8}else{
        const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);
        if(d>0.06){const v=Math.min(D.spd*movK(p),d*7);p.vx=dx/d*v;p.vy=dy/d*v}else{p.vx=p.vy=0}}
      if(canHit(p)){if(p.missLeg!==S.R0.hits){p.missLeg=S.R0.hits;p.willMiss=rand()<D.miss}if(!p.willMiss){const s=aiShot(p);p.swingT=0.3;p.swingType=s.type;p.wantBack=!!s.back;performHit(p,s.type,s.aimX,s.power)}}
    }
    if(p.swingT>0)p.swingT-=dt;
    p.x=Math.max(-4.7,Math.min(4.7,p.x+p.vx*dt));p.y=Math.max(lim[0],Math.min(lim[1],p.y+p.vy*dt));
    if(S.state==='serve'&&S.R0.server===p){const sd=-S.R0.boxX;p.x=sd>0?Math.max(0.3,p.x):Math.min(-0.3,p.x);if(Math.abs(p.y)<SVC+0.5)p.y=Math.sign(p.y)*(SVC+0.5)}
    const sp=Math.hypot(p.vx,p.vy);if(sp>0.4)p.anim+=dt*sp*2.2;
    if(!S.ball.held)p.flip=S.ball.x<p.x-0.15;
  }
  if(S.shake>0)S.shake-=dt;
  for(const s of S.spectators)if(s.cheer>0)s.cheer-=dt;
  if(S.floatTxt){S.floatTxt.t-=dt;if(S.floatTxt.t<=0)S.floatTxt=null}
  for(const f of S.floats)f.t-=dt;S.floats=S.floats.filter(f=>f.t>0);
  if(!S.demo&&S.score)H.updateEnergy();
}
