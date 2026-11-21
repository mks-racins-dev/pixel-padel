import { S } from '../state.js';
import { AMBIENT, CHAT, LINES, REACT, REPLY, WALLREACT } from '../content/mascots.js';
import { P, R, W, circ, ctx, shade, txt, txtW } from '../core/gfx.js';
import { settings } from '../game/settings.js';
import { K } from './sprites.js';

export const MASCOTS={
  ru:{say:'DA DA!',f(x,y,t,ch){ // bear in ushanka with balalaika
    y-=ch?(Math.floor(t*10)%2)*3:(Math.floor(t*3)%2);const B='#7a4a2a',D='#5e3820',Lt='#b07a50';
    const st=ch?Math.floor(t*6)%2:0;R(ctx,x-5,y-4+st,4,4,D);R(ctx,x+1,y-4-st,4,4,D);
    R(ctx,x-6,y-15,12,11,B);R(ctx,x-4,y-13,8,8,Lt);
    R(ctx,x-5,y-23,10,8,B);R(ctx,x-2,y-19,4,3,Lt);R(ctx,x-1,y-19,2,1,K);R(ctx,x-3,y-21,1,1,K);R(ctx,x+2,y-21,1,1,K);
    R(ctx,x-6,y-26,12,4,'#5a5560');R(ctx,x-7,y-23,2,5,'#5a5560');R(ctx,x+5,y-23,2,5,'#5a5560');R(ctx,x-5,y-27,10,1,'#6e6976');R(ctx,x,y-25,1,1,'#e4572e');
    R(ctx,x-7,y-16,1,7,'#8a5a3c');for(let i=0;i<5;i++)R(ctx,x-7,y-9+i,2+i*1.4,1,'#d9a35a');R(ctx,x-5,y-6,1,1,K);
    R(ctx,x+1+(Math.floor(t*8)%2)*2,y-8,4,3,B);R(ctx,x-8,y-15,3,3,B)}},
  lv:{say:'LABDIEN!',f(x,y,t,ch){ // stork on one leg, clacking beak
    const hop=ch?(Math.floor(t*8)%2)*2:0;y-=hop;const Wt='#f4f4f0',Rd='#e4572e';
    R(ctx,x,y-8,1,8,Rd);R(ctx,x+1,y-7,3,1,Rd);R(ctx,x+3,y-7,1,3,Rd);
    R(ctx,x-4,y-14,9,6,Wt);R(ctx,x-6,y-13,3,4,K);R(ctx,x-3,y-9,7,1,K);
    if(ch){R(ctx,x-8,y-17,6,2,Wt);R(ctx,x-10,y-18,3,2,K)}
    R(ctx,x+3,y-20,2,7,Wt);R(ctx,x+3,y-23,4,3,Wt);R(ctx,x+5,y-22,1,1,K);
    const open=Math.floor(t*(ch?12:2))%2;R(ctx,x+7,y-22,6,1,Rd);R(ctx,x+7,y-21+open,5,1,shade(Rd,-30))}},
  ee:{say:'TERE!',f(x,y,t,ch){ // sauna man with towel & birch whisk
    y-=ch?(Math.floor(t*8)%2)*2:0;const S='#f0a890',Sd='#d8887a';
    R(ctx,x-3,y-5,2,5,S);R(ctx,x+1,y-5,2,5,S);R(ctx,x-4,y-9,8,4,'#ffffff');R(ctx,x-4,y-6,8,1,'#d9d4cc');
    R(ctx,x-4,y-16,8,7,S);R(ctx,x+3,y-16,1,7,Sd);R(ctx,x-3,y-22,6,6,S);R(ctx,x-3,y-23,6,2,'#e9d8b4');R(ctx,x-2,y-20,1,1,K);R(ctx,x+1,y-20,1,1,K);R(ctx,x-1,y-18,3,1,'#b8483a');
    const a=Math.floor(t*(ch?10:3))%2;R(ctx,x+4,y-15,2,1,S);R(ctx,x+6,y-17-a*2,1,3,'#8a5a3c');R(ctx,x+5,y-22-a*2,4,5,'#4f8a4b');R(ctx,x+6,y-23-a*2,2,1,'#6fae5f');
    for(let i=0;i<3;i++){const sy=((t*8+i*7)%20);ctx.fillStyle='rgba(255,255,255,'+(0.5-sy/40)+')';ctx.fillRect(Math.round(x-6+i*5),Math.round(y-24-sy),2,2)}}},
  lt:{say:'LABAS!',f(x,y,t,ch){ // basketball player dribbling
    const S='#e8b48a';y-=ch?(Math.floor(t*6)%2)*4:0;
    R(ctx,x-3,y-6,2,6,S);R(ctx,x+1,y-6,2,6,S);R(ctx,x-4,y-10,8,4,'#006a44');
    R(ctx,x-4,y-19,8,9,'#fdb913');R(ctx,x-1,y-17,2,4,'#006a44');R(ctx,x-3,y-25,6,6,S);R(ctx,x-3,y-26,6,2,'#4a2c1a');R(ctx,x-2,y-23,1,1,K);R(ctx,x+1,y-23,1,1,K);
    R(ctx,x+4,y-18,1,5,S);
    const by=ch?y-32:y-2-Math.abs(Math.sin(t*6))*10;circ(ctx,x+6,by,2,'#e8762e');R(ctx,x+5,by,3,1,'#9a4a1a')}},
  es:{say:'OLE!',f(x,y,t,ch){ // bull with a rose
    const B='#2b2633',dx=ch?Math.round(Math.sin(t*14)*2):0;x+=dx;
    R(ctx,x-8,y-5,2,5,B);R(ctx,x-4,y-5,2,5,B);R(ctx,x+2,y-5,2,5,B);R(ctx,x+5,y-5,2,5,B);
    R(ctx,x-9,y-12,17,8,B);R(ctx,x-10,y-11,1,4,B);R(ctx,x+6,y-16,7,8,B);
    R(ctx,x+5,y-18,2,3,'#f4ead2');R(ctx,x+12,y-18,2,3,'#f4ead2');R(ctx,x+8,y-13,1,1,'#e4572e');R(ctx,x+11,y-13,1,1,'#e4572e');R(ctx,x+8,y-10,5,2,'#5a5560');
    R(ctx,x+13,y-10,4,1,'#4f8a4b');R(ctx,x+16,y-12,3,3,'#e4572e');
    if(ch||Math.floor(t*1.2)%3===0){ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(x+14,y-9+((t*10)%3|0),2,1);ctx.fillRect(x+6,y-9+((t*10)%3|0),2,1)}}},
  by:{say:'BULBA!',f(x,y,t,ch){ // dancing potato
    const sw=Math.round(Math.sin(t*(ch?14:4))*2);x+=sw;
    R(ctx,x-3,y-4,1,4,K);R(ctx,x+2,y-4,1,4,K);R(ctx,x-4,y-1,2,1,K);R(ctx,x+2,y-1,2,1,K);
    circ(ctx,x,y-11,6.5,'#c49a5a');circ(ctx,x-1,y-12,4,'#d4ac6c');for(const[a,b]of[[-4,-14],[3,-8],[-2,-7],[4,-15]])R(ctx,x+a,y+b,1,1,'#8a6a3a');
    R(ctx,x-3,y-14,2,2,'#fff');R(ctx,x+1,y-14,2,2,'#fff');R(ctx,x-2,y-13,1,1,K);R(ctx,x+2,y-13,1,1,K);R(ctx,x-2,y-10,4,1,K);R(ctx,x-3,y-11,1,1,K);R(ctx,x+2,y-11,1,1,K);
    const a=Math.floor(t*(ch?10:3))%2;R(ctx,x-9,y-12-a*3,3,1,K);R(ctx,x+7,y-12-(1-a)*3,3,1,K);
    R(ctx,x-3,y-18,7,1,'#4aa657');R(ctx,x-1,y-20,3,2,'#4aa657')}},
  us:{say:'USA USA!',f(x,y,t,ch){ // bald eagle in sunglasses
    const B='#5e3820',fl=ch?Math.floor(t*10)%2:0;
    R(ctx,x-2,y-3,1,3,'#f2c14e');R(ctx,x+1,y-3,1,3,'#f2c14e');R(ctx,x-4,y-14,8,11,B);R(ctx,x-3,y-5,6,2,'#f4f4f0');
    if(fl){R(ctx,x-12,y-18,8,3,B);R(ctx,x+4,y-18,8,3,B)}else{R(ctx,x-6,y-14,2,9,shade(B,-15));R(ctx,x+4,y-14,2,9,shade(B,-15))}
    R(ctx,x-4,y-21,8,7,'#f4f4f0');R(ctx,x+3,y-18,4,2,'#f2c14e');R(ctx,x+5,y-16,2,1,'#f2c14e');
    R(ctx,x-4,y-19,9,2,K);R(ctx,x-4,y-20,9,1,'#3a3a44')}},
  sunset:{say:'NICE!',f(x,y,t,ch){ // club cat
    y-=ch?(Math.floor(t*8)%2)*2:0;const C='#e8762e';
    R(ctx,x-4,y-7,9,7,C);R(ctx,x-3,y-3,7,3,'#f4ead2');R(ctx,x-4,y-13,8,6,C);R(ctx,x-4,y-15,2,2,C);R(ctx,x+2,y-15,2,2,C);
    R(ctx,x-2,y-11,1,1,K);R(ctx,x+1,y-11,1,1,K);R(ctx,x,y-9,1,1,'#d98ca0');
    const tw=Math.floor(t*(ch?8:2))%2;R(ctx,x+5,y-4-tw*3,1,4,C);R(ctx,x+5,y-8-tw*3,2,1,C)}}
};
export const MZ={x:7.3,y:0.6,path:[],mode:'idle',t:2,face:-1,say:null,sayT:0,cd:6,recent:[],buddy:null,chatT:0};
export function pickLine(list){const fresh=list.filter(l=>!MZ.recent.includes(l));const l=(fresh.length?fresh:list)[Math.floor(Math.random()*(fresh.length||list.length))];MZ.recent.push(l);if(MZ.recent.length>8)MZ.recent.shift();return l}
export function mSay(t,d){MZ.say=t;MZ.sayT=d||2.2;MZ.cd=7+Math.random()*9}
export function mascotReact(){if(MZ.cd>0||Math.random()>0.35)return;const own=LINES[settings.loc]||LINES.sunset;
  mSay(pickLine(S.R0&&S.R0.wallShot&&Math.random()<0.7?WALLREACT:Math.random()<0.4?own:REACT))}
export function mRoute(tx,ty){const sideA=MZ.x>0,sideB=tx>0;MZ.path=[];
  if(sideA!==sideB){const ey=Math.random()<0.5?11.6:-11.4;MZ.path.push({x:MZ.x>0?6.8:-7.4,y:ey},{x:tx>0?6.8:-7.4,y:ey})}
  MZ.path.push({x:tx,y:ty});MZ.mode='walk'}
export function updMascot(dt){
  if(MZ.sayT>0)MZ.sayT-=dt;MZ.cd-=dt;
  for(const sp of S.spectators)if(sp.sayT>0)sp.sayT-=dt;
  if(MZ.mode==='walk'){const w=MZ.path[0];if(!w){MZ.mode='idle';MZ.t=2+Math.random()*4;return}
    const dx=w.x-MZ.x,dy=w.y-MZ.y,d=Math.hypot(dx,dy),v=1.3*dt;
    if(Math.abs(dx)>0.05)MZ.face=dx>0?1:-1;
    if(d<=v){MZ.x=w.x;MZ.y=w.y;MZ.path.shift();if(!MZ.path.length){if(MZ.buddy){MZ.mode='chat';MZ.chatT=0;MZ.face=MZ.buddy.x<MZ.x?-1:1;mSay(pickLine(Math.random()<0.5?CHAT:(LINES[settings.loc]||LINES.sunset)),1.8)}else{MZ.mode='idle';MZ.t=2+Math.random()*4}}}
    else{MZ.x+=dx/d*v;MZ.y+=dy/d*v}
  }else if(MZ.mode==='chat'){MZ.chatT+=dt;const b=MZ.buddy;
    if(MZ.chatT>1.7&&b&&!b.sayT){b.say=pickLine(REPLY);b.sayT=1.8;if(b.say==='YES!'||b.say==='SURE!'||b.say==='HAHA!')b.cheer=0.8}
    if(MZ.chatT>3.8){MZ.buddy=null;MZ.mode='idle';MZ.t=1.5+Math.random()*3}
  }else{MZ.t-=dt;if(MZ.t>0)return;const r=Math.random();
    if(r<0.3&&S.spectators.length){const b=S.spectators[Math.floor(Math.random()*S.spectators.length)];MZ.buddy=b;mRoute(b.x+1.2,b.y-0.2)}
    else if(r<0.45)mRoute(-MZ.x>0?6.4+Math.random()*1.8:-7.4,(Math.random()-0.5)*14)
    else if(r<0.85)mRoute(MZ.x>0?6.4+Math.random()*1.8:-7.3-Math.random()*0.3,(Math.random()-0.5)*15)
    else{MZ.t=3+Math.random()*3;if(MZ.cd<=0&&Math.random()<0.6)mSay(pickLine(Math.random()<0.5?AMBIENT:(LINES[settings.loc]||LINES.sunset)))}}
}
export function bubble(x,y,text){const w=txtW(text);const bx=Math.max(3,Math.min(W-w-3,x-Math.round(w/2))),by=y;R(ctx,bx-3,by-3,w+6,11,K);R(ctx,bx-2,by-2,w+4,9,'#fff8e0');R(ctx,x-1,by+8,3,2,K);R(ctx,x,by+7,1,2,'#fff8e0');txt(ctx,text,bx,by,K)}
export function drawMascot(){
  const m=MASCOTS[settings.loc]||MASCOTS.sunset;const p=P(MZ.x,MZ.y,0);const x=Math.round(p.x);let y=Math.round(p.y);
  const walking=MZ.mode==='walk';const ch=!walking&&S.spectators.length&&S.spectators[0].cheer>0;
  ctx.fillStyle='rgba(16,12,40,0.3)';ctx.fillRect(x-7,y-1,15,2);
  if(walking)y-=Math.floor(S.time*7)%2;
  ctx.save();if(MZ.face<0){ctx.translate(2*x+1,0);ctx.scale(-1,1)}
  m.f(x,y,walking?S.time*2.5:S.time,ch);ctx.restore();
  if(MZ.sayT>0)bubble(x,y-38,MZ.say);
  for(const sp of S.spectators)if(sp.sayT>0){const q=P(sp.x,sp.y,0.5);bubble(Math.round(q.x),Math.round(q.y)-28,sp.say)}
}
