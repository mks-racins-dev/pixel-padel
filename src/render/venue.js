import { S } from '../state.js';
import { TOWNS, curLoc } from '../content/venues.js';
import { H, R, W, WL, WQ, circ, mulberry, newCanvas, shade, txt, txtW } from '../core/gfx.js';
import { HW, NET_H, NET_POST, SVC } from '../game/constants.js';
import { settings } from '../game/settings.js';
import { grade, gradeGround, gradeBack, gradeFloor, gradeWall, gradeProps, gradeFront } from './grades.js';
import { basket, bench, bikes, building, lamp, obj, pot, skyline, tree, umbrella } from './background.js';

export function drawFlag(g,x,y,w,h,f){
  R(g,x-1,y-1,w+2,h+2,'#17131c');
  if(f.us){for(let i=0;i<7;i++)R(g,x,y+i*h/7,w,h/7+1,i%2?'#ffffff':'#b22234');R(g,x,y,Math.ceil(w*0.45),Math.ceil(h*4/7),'#3c3b6e');for(let i=0;i<3;i++)for(let j=0;j<2;j++)R(g,x+1+i*2,y+1+j*2,1,1,'#fff');return}
  const tot=f.s.reduce((a,s)=>a+s[1],0);let yy=y;for(const[c,n]of f.s){const hh=Math.round(h*n/tot);R(g,x,yy,w,Math.max(1,hh),c);yy+=hh}
  if(f.orn){R(g,x,y,2,h,'#ffffff');for(let k=0;k<h;k+=2)R(g,x+(k%4?0:1),y+k,1,1,'#c8313e')}
}
export function buildBg(){
  S.rnd=mulberry(11);const LC0=curLoc();
  const[c,g]=newCanvas(W,H);
  const B=LC0.sky;
  for(let i=0;i<B.length;i++){const y0=i*9;R(g,0,y0,W,9,B[i]);if(i<B.length-1)for(let x=0;x<W;x++){if((x&1)===0)R(g,x,y0+7,1,1,B[i+1]);if((x&3)!==1)R(g,x,y0+8,1,1,B[i+1])}}
  if(LC0.night)for(let k=0;k<40;k++)R(g,S.rnd()*W,S.rnd()*40,1,1,S.rnd()<0.5?'#fff8e0':'#b9c0e8');
  circ(g,396,44,14,LC0.sun[0]);circ(g,396,44,11,LC0.sun[1]);
  for(const[cx,cy,w]of[[60,18,40],[150,10,28],[300,22,36],[430,14,30]]){R(g,cx,cy,w,3,'#f3c2b6');R(g,cx+5,cy-2,w-12,2,'#f8d6c9');R(g,cx+3,cy+3,w-6,1,'#d9a3b1')}
  for(const[bx,by]of[[110,28],[118,25],[350,16]]){R(g,bx,by,2,1,'#4a3a5a');R(g,bx+2,by+1,1,1,'#4a3a5a');R(g,bx+3,by,2,1,'#4a3a5a')}
  const T=TOWNS[settings.loc]||TOWNS.sunset;
  let x=0;while(x<W){const w=10+S.rnd()*18,h=18+S.rnd()*20;R(g,x,64-h,w,h,T.far);for(let k=0;k<w*h/30;k++)R(g,x+1+S.rnd()*(w-2),64-h+2+S.rnd()*(h-4),1,1,T.farL);if(S.rnd()<0.3)R(g,x+w/2,64-h-6,1,6,T.far);x+=w}
  // landmarks go in front of the far silhouette strip so they are not hidden by it
  skyline(g,T,T.far,T.farL);if(settings.loc==='ru')skyline(g,{land:'kremlin'});
  const pals=T.pals;
  x=-6;let i=0;while(x<W+6){const w=T.w[0]+Math.floor(S.rnd()*T.w[1]),h=T.h[0]+Math.floor(S.rnd()*T.h[1]);building(g,x,66,w,h,pals[pals.length===5?(i*2+1)%5:(i*3+1)%pals.length],T);x+=w+(S.rnd()<0.3?3:0);i++}
  // club billboard
  const bw=96,bx=240-bw/2,by=6;R(g,bx+12,by+18,2,26,'#2f2d38');R(g,bx+bw-14,by+18,2,26,'#2f2d38');R(g,bx-2,by-2,bw+4,22,'#17131c');R(g,bx,by,bw,18,'#2b2540');R(g,bx,by,bw,1,'#4a3f58');
  txt(g,LC0.city,240-txtW(LC0.city,2)/2,by+2,'#f7c993',2);txt(g,'PADEL CLUB',240-txtW('PADEL CLUB')/2,by+13,'#ff8a5c');
  for(let k=0;k<8;k++)R(g,bx+4+k*12,by+20,2,1,'#fff1c1');
  if(LC0.flag)for(const fx of[bx-22,bx+bw+8]){R(g,fx-2,by-4,1,48,'#2f2d38');R(g,fx-3,by-5,3,1,'#c7c1d0');drawFlag(g,fx-1,by-3,15,10,LC0.flag)}
  // cafe sign
  R(g,18,30,26,9,'#17131c');R(g,19,31,24,7,'#3fa7a8');txt(g,'CAFE',21,32,'#f4ead2');
  gradeBack(g,LC0);
  // ground
  R(g,0,64,W,H-64,'#b5a596');
  for(let k=0;k<1400;k++)R(g,S.rnd()*W,66+S.rnd()*(H-66),1,1,S.rnd()<0.5?'#c3b4a6':'#a59484');
  for(let gx=-30;gx<=30;gx+=2.5)WL(g,[gx,-13,0],[gx,16.6,0],'#a69585');
  for(let gy=-12.5;gy<=16.5;gy+=2.5)WL(g,[-34,gy,0],[34,gy,0],'#a69585');
  // hedge
  R(g,0,61,W,9,'#3f6b45');for(let hx=0;hx<W;hx+=3)R(g,hx,58+S.rnd()*3,3,5,S.rnd()<0.5?'#4e7f50':'#457447');for(let k=0;k<140;k++)R(g,S.rnd()*W,59+S.rnd()*9,1,1,['#f5d76e','#e86a6a','#f4ead2','#2d4f35','#6fae5f'][k%5]);R(g,0,69,W,1,'#2d4f35');R(g,0,70,W,1,'#8c7d70');
  gradeGround(g);
  // concrete curb around court
  WQ(g,[[-5.5,-10.5,0],[5.5,-10.5,0],[5.5,10.5,0],[-5.5,10.5,0]],'#7d7782');
  // court floor
  const spans=WQ(g,[[-5,-10,0],[5,-10,0],[5,10,0],[-5,10,0]],LC0.court);const cD=shade(LC0.court,-9),cL=shade(LC0.court,9);
  for(const[y,x0,x1]of spans){for(let xx=x0;xx<x1;xx++){const r=S.rnd();if(r<0.07)R(g,xx,y,1,1,cD);else if(r<0.12)R(g,xx,y,1,1,cL)}}
  for(let k=0;k<6;k++){const a=-4+k*1.6;WL(g,[a,-9.5,0],[a+0.4,9.5,0],'rgba(255,255,255,0.025)')}
  const LC='#e8eef5';
  WL(g,[-5,-SVC,0],[5,-SVC,0],LC,2);WL(g,[-5,SVC,0],[5,SVC,0],LC);WL(g,[0,-SVC,0],[0,SVC,0],LC);WL(g,[0.03,-SVC,0],[0.03,-3,0],LC);
  gradeFloor(g);
  // far wall
  WQ(g,[[-5,10,0],[5,10,0],[5,10,3],[-5,10,3]],'rgba(190,225,235,0.22)');
  for(let k=0;k<5;k++){const a=-5+k*2;WQ(g,[[a,10,0],[a+2,10,0],[a+2,10,0.45],[a,10,0.45]],['#e4572e','#2b2540','#3fa7a8','#2b2540','#f2c14e'][k]);WL(g,[a+0.3,10,0.6],[a+0.9,10,2.6],'rgba(255,255,255,0.25)')}
  gradeWall(g);for(let xx=-5;xx<=5.01;xx+=0.4)WL(g,[xx,10,3],[xx,10,4],'rgba(40,36,52,0.6)');
  for(let z=3.2;z<4;z+=0.2)WL(g,[-5,10,z],[5,10,z],'rgba(40,36,52,0.6)');
  // side walls
  for(const sx of[-5,5]){
    for(const sgn of[-1,1]){WQ(g,[[sx,sgn*6,0],[sx,sgn*10,0],[sx,sgn*10,3],[sx,sgn*6,3]],'rgba(190,225,235,0.18)');WL(g,[sx,sgn*8.5,0.5],[sx,sgn*7.4,2.6],'rgba(255,255,255,0.22)')}
    for(let yy=-6;yy<=6.01;yy+=0.5)WL(g,[sx,yy,0],[sx,yy,3],'rgba(40,36,52,0.5)');
    for(let z=0.3;z<3;z+=0.3)WL(g,[sx,-6,z],[sx,6,z],'rgba(40,36,52,0.5)');
    for(let yy=-10;yy<=10.01;yy+=(grade().pano?4:2))WL(g,[sx,yy,0],[sx,yy,(Math.abs(yy)===10)?4:3],'#2f2d38',Math.abs(yy)>8?2:1);
    WL(g,[sx,-10,3],[sx,10,3],'#2f2d38');WL(g,[sx,-6,0.02],[sx,6,0.02],'#2f2d38');
    for(let yy=8;yy<=10.01;yy+=0.4){WL(g,[sx,yy,3],[sx,yy,4],'rgba(40,36,52,0.6)');WL(g,[sx,-yy,3],[sx,-yy,4],'rgba(40,36,52,0.5)')}
    WL(g,[sx,8,4],[sx,10,4],'#2f2d38');WL(g,[sx,-8,4],[sx,-10,4],'#2f2d38');
  }
  for(const xx of(grade().pano?[-5,5]:[-5,-3,-1,1,3,5]))WL(g,[xx,10,0],[xx,10,4],'#2f2d38',Math.abs(xx)===5?2:1);
  WL(g,[-5,10,3],[5,10,3],'#2f2d38');WL(g,[-5,10,4],[5,10,4],'#2f2d38',2);
  // props, far to near
  const props=[
    {x:-10.5,y:12.5,f:tree},{x:10.8,y:12.8,f:tree},{x:-7.2,y:12.2,f:pot},{x:7.4,y:12.2,f:pot},
    {x:-12.5,y:4,f:tree},{x:8.8,y:7,f:o=>umbrella(o,'#e4572e','#f4ead2')},{x:-8.7,y:6,f:bench},{x:-8.7,y:3,f:bench},
    {x:10.2,y:2.2,f:o=>umbrella(o,'#3fa7a8','#f4ead2')},{x:-8.7,y:0,f:bench},{x:-8.7,y:-3,f:bench},
    {x:13,y:-2,f:tree},{x:7.6,y:-4.5,f:pot},{x:7.2,y:-7,f:basket},{x:-9.6,y:-7.5,f:bikes},{x:-12.6,y:-6,f:tree}
  ];
  const PL=grade().floor?props.filter(p=>p.f===bench):props;
  PL.sort((a,b)=>b.y-a.y);for(const p of PL)p.f(obj(g,p.x,p.y));
  gradeProps(g);
  if(!grade().flood&&!grade().indoor){lamp(g,-6,10.6,1);lamp(g,6,10.6,-1)}
  return c;
}
export function buildNet(){
  const[c,g]=newCanvas(W,H);
  WL(g,[-5.05,0,0],[-5.05,0,1.0],'#2a2733',2);WL(g,[5.05,0,0],[5.05,0,1.0],'#2a2733',2);
  for(let x=-5;x<=5.01;x+=0.2){const top=NET_H+(NET_POST-NET_H)*Math.abs(x)/HW;WL(g,[x,0,0.04],[x,0,top],'rgba(25,22,32,0.55)')}
  for(let z=0.12;z<0.86;z+=0.12)WL(g,[-5,0,z],[5,0,z+0.0],'rgba(25,22,32,0.4)');
  WL(g,[-5,0,0.02],[5,0,0.02],'#1d1a24');
  WL(g,[-5,0,NET_POST],[0,0,NET_H],'#eef2f6');WL(g,[0,0,NET_H],[5,0,NET_POST],'#eef2f6');
  WL(g,[-5,0,NET_POST-0.04],[0,0,NET_H-0.04],'#cfd6de');WL(g,[0,0,NET_H-0.04],[5,0,NET_POST-0.04],'#cfd6de');
  WL(g,[0,0,0],[0,0,NET_H],'#eef2f6');
  return c;
}
export function buildFront(){
  const[c,g]=newCanvas(W,H);
  WQ(g,[[-5,-10,0],[5,-10,0],[5,-10,1.6],[-5,-10,1.6]],'rgba(205,235,245,0.07)');
  for(const a of[-5,-3,-1,1,3]){WL(g,[a+0.25,-10,0.2],[a+0.6,-10,1.4],'rgba(255,255,255,0.14)')}
  for(const x of[-3,-1,1,3])WL(g,[x,-10,0],[x,-10,1.6],'rgba(30,28,40,0.22)');
  WL(g,[-5,-10,0],[-5,-10,2.2],'#25222e',2);WL(g,[5,-10,0],[5,-10,2.2],'#25222e',2);
  if(!grade().indoor){lamp(g,-6,-10.6,1);lamp(g,6,-10.6,-1)}
  gradeFront(g);
  return c;
}
