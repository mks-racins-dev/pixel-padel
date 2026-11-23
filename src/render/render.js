import { trailColor } from '../meta/profile.ts';
import { isPractice, PR } from '../game/practice.js';
import { cameraOffset, drawFx, zoomTransform, zoomOrigin } from './fx.ts';
import { drawDrama } from './drama.ts';
import { drawNpcs } from './npcs.ts';
import { cv } from '../core/gfx.js';
import { S } from '../state.js';
import { L, P, R, ctx, shade, txt, txtW } from '../core/gfx.js';
import { sweet } from '../game/constants.js';
import { isHuman, serveTarget, serveAimIn } from '../game/rules.js';
import { settings } from '../game/settings.js';
import { drawMascot } from './mascot.js';
import { getSprite } from './sprites.js';
import { gradeFrame } from './grades.js';
import { drawAmbient } from './ambient.js';
import { OPTS } from '../game/opts.js';

export function drawPlayer(p){
  const g0=P(p.x,p.y,0);const x=Math.round(g0.x),y=Math.round(g0.y);
  ctx.fillStyle='rgba(16,12,40,0.35)';ctx.fillRect(x-5,y-1,10,3);ctx.fillRect(x-6,y,12,1);
  const moving=Math.hypot(p.vx,p.vy)>0.4;
  const pose=p.swingT>0.17?'back':p.swingT>0?'follow':((S.state==='serve'&&S.R0.server===p)||p.charging?'back':'idle');
  const leg=moving?(Math.floor(p.anim)%2)+1:0;
  const img=getSprite(p.look,p.team===0?'back':'front',pose,leg);
  const dx=x-12,dy=y-29;
  /* idle: racket in the natural hand (facing camera mirrors it); swinging: toward the ball */
  const fl=pose==='idle'?((p.team===1)!==(p.look.hand==='left')):p.flip;
  if(fl){ctx.save();ctx.translate(dx+24,dy);ctx.scale(-1,1);ctx.drawImage(img,0,0);ctx.restore()}else ctx.drawImage(img,dx,dy);
  if(!S.demo){const full=p.energy>=100;const bx=x-7,by=dy-4;R(ctx,bx-1,by-1,16,4,'#17131c');R(ctx,bx,by,14,2,'#3a3146');const w=Math.round(14*p.energy/100);if(w>0)R(ctx,bx,by,w,2,full?((Math.floor(S.time*8)%2)?'#fff1c1':'#ff8a5c'):'#f2c14e');
    if(p.charging){const h=Math.round(16*p.charge);R(ctx,x+9,dy+10,4,18,'#17131c');R(ctx,x+10,dy+11,2,16,'#3a3146');if(h>0)R(ctx,x+10,dy+27-h,2,h,p.charge>sweet(p)?'#e4572e':p.charge>0.35?'#f2c14e':'#9fd38a');const sy=dy+27-Math.round(16*sweet(p));R(ctx,x+8,sy,6,1,'#fff1c1')}}
  if(isHuman(p)&&!S.demo&&p.ctrl!=='net'){const c={h1:'#ff8a5c',h2:'#6fd3d2',h3:'#9be37a',h4:'#ff6ad5'}[p.ctrl]||'#ff8a5c';const ty=dy-11;R(ctx,x-2,ty,5,1,c);R(ctx,x-1,ty+1,3,1,c);R(ctx,x,ty+2,1,1,c);
    if(settings.mode==='pvp'||settings.mode==='couch'){const lab='P'+p.ctrl.slice(1);R(ctx,x-5,ty-8,10,7,'#17131c');txt(ctx,lab,x-3,ty-7,c)}}
}
export function drawBallShadow(){if(S.ball.out&&S.ball.z>4)return;const g0=P(S.ball.x,S.ball.y,0);ctx.fillStyle='rgba(16,12,40,'+Math.max(0.12,0.4-S.ball.z*0.05)+')';ctx.fillRect(Math.round(g0.x)-1,Math.round(g0.y),3,1)}
export function drawBall(){
  const p=P(S.ball.x,S.ball.y,S.ball.z);const x=Math.round(p.x),y=Math.round(p.y)-2;
  for(let i=0;i<S.trail.length;i++){const t=S.trail[i];ctx.fillStyle=S.ball.vib?'rgba(255,120,70,'+(0.25+i*0.12)+')':trailColor(i,S.time);ctx.fillRect(t.x,t.y,1,1)}
  const o='#1c1a22';R(ctx,x-1,y-2,3,1,o);R(ctx,x-1,y+2,3,1,o);R(ctx,x-2,y-1,1,3,o);R(ctx,x+2,y-1,1,3,o);
  R(ctx,x-1,y-1,3,3,'#e2ef3c');R(ctx,x-1,y-1,1,1,'#fbffb8');R(ctx,x+1,y+1,1,1,'#a9b82a');
}
export function drawSpectators(){
  drawNpcs(ctx);
  gradeFrame(ctx);
  for(const s of S.spectators){const p=P(s.x,s.y,0.5);const x=Math.round(p.x),y=Math.round(p.y);
    const bob=(s.cheer>0)?(Math.floor(S.time*8+s.ph)%2):(!S.hush&&Math.floor(S.time*1.5+s.ph)%2===0&&Math.sin(S.time+s.ph)>0.6?1:0);
    R(ctx,x-1,y-4,5,4,s.pants);R(ctx,x+2,y-1,2,4,s.pants);R(ctx,x+3,y+2,2,1,'#f4f4f0');
    R(ctx,x-2,y-10-bob,6,7,s.shirt);R(ctx,x-2,y-10-bob,1,7,shade(s.shirt,-30));
    R(ctx,x-1,y-15-bob,5,5,s.skin);R(ctx,x-1,y-16-bob,5,2,s.hair);R(ctx,x-1,y-14-bob,1,2,s.hair);
    const look=S.ball.x<-1?0:1;R(ctx,x+2+look,y-13-bob,1,1,'#2a1e1e');
    if(s.phone&&s.cheer<=0){R(ctx,x+3,y-14-bob,3,4,'#1c1a22');R(ctx,x+4,y-13-bob,1,2,'#9be3ff')}
    if(s.cheer>0){R(ctx,x-3,y-15-bob,1,5,s.skin);R(ctx,x+4,y-15-bob,1,5,s.skin)}else{R(ctx,x+3,y-8-bob,2,1,s.skin)}
  }
}
export function drawMarker(){if(!S.marker)return;const p=P(S.marker.x,S.marker.y,0);const x=Math.round(p.x),y=Math.round(p.y);const c=(Math.floor(S.time*6)%2)?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.45)';
  R(ctx,x-3,y-1,1,1,c);R(ctx,x-2,y,1,1,c);R(ctx,x,y,1,1,c);R(ctx,x+2,y,1,1,c);R(ctx,x+3,y-1,1,1,c);R(ctx,x-1,y,1,1,c);R(ctx,x+1,y,1,1,c);R(ctx,x-3,y+1,1,1,c);R(ctx,x+3,y+1,1,1,c)}
export function drawServeAim(){
  if(S.demo||S.state!=='serve'||!S.R0||!S.R0.server||!/^h[1-4]$/.test(S.R0.server.ctrl))return;const p=S.R0.server;
  const pw=p.charging?Math.max(0.06,p.charge):sweet(p);const t=serveTarget(p,pw);
  const a=P(S.ball.x,S.ball.y,0),b=P(t.tx,t.ty,0);const over=p.charging&&p.charge>sweet(p);
  const c=over||!serveAimIn(p)?'#e4572e':(p.ctrl==='h1'?'#ff8a5c':'#6fd3d2');
  const n=Math.max(2,Math.floor(Math.hypot(b.x-a.x,b.y-a.y)/3));
  for(let k=1;k<n;k++){if(((k+Math.floor(S.time*12))%2))continue;const u=k/n;R(ctx,a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u,1,1,c)}
  const ang=Math.atan2(b.y-a.y,b.x-a.x);for(const s of[-1,1]){const q=ang+Math.PI+s*0.55;L(ctx,b.x,b.y,b.x+Math.cos(q)*5,b.y+Math.sin(q)*5,c)}
  R(ctx,b.x-3,b.y+2,7,1,'rgba(255,255,255,0.35)');
}
export function render(){
  ctx.save();
  {const o=OPTS.shake?cameraOffset():{x:0,y:0};if(o.x||o.y)ctx.translate(o.x,o.y)}
  if(S.shake>0&&OPTS.shake)ctx.translate(Math.round((Math.random()-0.5)*3),Math.round((Math.random()-0.5)*3));
  ctx.drawImage(S.BG,0,0);
  drawAmbient(ctx);
  drawSpectators();drawMascot();
  if(!S.ball.held){const p=P(S.ball.x,S.ball.y,S.ball.z);S.trail.push({x:Math.round(p.x),y:Math.round(p.y)-2});{const sp=Math.hypot(S.ball.vx,S.ball.vy);while(S.trail.length>(sp>17?9:sp>13?7:5))S.trail.shift()}if(Math.hypot(S.ball.vx,S.ball.vy)<9&&!S.ball.vib)S.trail.length=0}
  drawMarker();drawServeAim();
  const far=S.players.filter(p=>p.y>=0).sort((a,b)=>b.y-a.y),near=S.players.filter(p=>p.y<0).sort((a,b)=>b.y-a.y);
  const ballFar=S.ball.y>=0;
  if(ballFar)drawBallShadow();
  if(isPractice())drawMachine();
  drawGroup(far,ballFar);
  ctx.drawImage(S.NET,0,0);
  if(!ballFar)drawBallShadow();
  drawGroup(near,!ballFar);
  drawFx(ctx);
  ctx.drawImage(S.FRONT,0,0);
  for(const f of(S.floatTxt?[S.floatTxt]:[]).concat(S.floats)){const q=P(f.x,f.y,2.2);const rise=Math.round((1.1-f.t)*14);const w=txtW(f.text,f===S.floatTxt?2:1);const sc=f===S.floatTxt?2:1;R(ctx,q.x-w/2-2,q.y-rise-2,w+4,5*sc+4,'rgba(23,19,28,0.75)');txt(ctx,f.text,Math.round(q.x-w/2),Math.round(q.y-rise),f.c,sc)}
  drawDrama(ctx);
  ctx.restore();
  {const z=zoomTransform();if(z){cv.style.transformOrigin=zoomOrigin();cv.style.transform=z}else if(cv.style.transform)cv.style.transform=''}
}
export function drawGroup(list,withBall){
  let drawn=!withBall;
  for(const p of list){if(!drawn&&S.ball.y>p.y){drawBall();drawn=true}drawPlayer(p)}
  if(!drawn)drawBall();
}

/** The practice ball machine behind the far baseline. */
function drawMachine(){
  const p=P(PR.x,9.6,0);const x=Math.round(p.x),y=Math.round(p.y);
  ctx.fillStyle='rgba(16,12,40,0.3)';ctx.fillRect(x-7,y-1,14,2);
  R(ctx,x-6,y-9,12,8,'#3a3a44');R(ctx,x-6,y-9,12,1,'#6d6680');R(ctx,x-5,y-1,2,2,'#1c1a22');R(ctx,x+3,y-1,2,2,'#1c1a22');
  R(ctx,x-4,y-15,8,6,'#e4572e');R(ctx,x-4,y-15,8,1,'#ff8a5c');
  for(let k=0;k<5;k++)R(ctx,x-3+k*1.5,y-17+(k%2),1,1,'#e2ef3c');
  R(ctx,x-1,y-7,3,3,'#1c1a22');R(ctx,x,y-6,1,1,S.state==='play'?'#9be37a':'#e4572e');
}
