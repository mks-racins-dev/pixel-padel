import { S } from '../state.js';
import { TOWNS } from '../content/venues.js';
import { L, P, R, W, WL, circ, ring, shade } from '../core/gfx.js';

/* ---------------- background ---------------- */
export function building(g,x,base,w,h,pal,T){
  T=T||TOWNS.sunset;const top=base-h;const WN=T.win||[10,11,6,7];
  R(g,x,top,w,h,pal.wall);
  for(let k=0;k<w*h/12;k++)R(g,x+S.rnd()*w,top+S.rnd()*h,2,1,pal.brick);
  R(g,x+w-2,top,2,h,pal.dark);
  R(g,x-1,top-3,w+2,3,pal.trim);R(g,x-1,top,w+2,1,pal.dark);
  const shopH=13;
  roof(g,x,top,w,pal,T);
  for(let wy=top+6;wy+WN[3]+2<=base-shopH-3;wy+=WN[1]){
    for(let wx=x+5;wx+WN[2]+1<=x+w-5;wx+=WN[0]){const ww=WN[2],wh=WN[3];
      const lit=S.rnd()<0.32;
      R(g,wx-1,wy-1,ww+2,wh+2,pal.trim);
      R(g,wx,wy,ww,wh,lit?(S.rnd()<0.5?'#ffd27a':'#f6b25e'):'#3d3656');
      if(lit)R(g,wx+1,wy+1,2,2,'#fff0bd');else R(g,wx+1,wy+1,1,2,'#6a6390');
      if(ww>=6){R(g,wx,wy+3,ww,1,pal.trim);R(g,wx+3,wy,1,wh,pal.trim)}
      if(T.arch&&ww>=6){R(g,wx,wy,1,1,pal.trim);R(g,wx+ww-1,wy,1,1,pal.trim)}
      if(ww>=6&&S.rnd()<0.2)R(g,wx,wy,2,wh,S.rnd()<0.5?'#d98ca0':'#e9d8b4');
      R(g,wx-1,wy+wh+1,ww+2,1,pal.dark);
      if(T.balcony&&S.rnd()<0.45){R(g,wx-2,wy+wh,ww+4,1,'#2f2d38');for(let bx=wx-2;bx<wx+ww+2;bx+=2)R(g,bx,wy+wh-2,1,2,'#2f2d38')}
      else if(ww>=6&&S.rnd()<0.18){R(g,wx,wy+wh-1,ww,2,'#4f8a4b');R(g,wx+1,wy+wh-2,1,1,'#e86a6a');R(g,wx+4,wy+wh-2,1,1,'#f5d76e')}
    }
  }
  const sb=base-shopH;
  R(g,x+3,sb,w-6,shopH,'#3a3044');
  for(let k=0;k<10;k++)R(g,x+5+S.rnd()*(w-12),sb+4+S.rnd()*7,2,2,S.rnd()<0.5?'#f0b46a':'#e57f5a');
  R(g,x+3,sb+5,w-6,1,'#5a4a62');
  const ac=[['#e4572e','#f4ead2'],['#3fa7a8','#f4ead2'],['#4f8a4b','#f4ead2'],['#8e6cc1','#f7c993']][Math.floor(S.rnd()*4)];
  for(let sx=x+2,i=0;sx<x+w-2;sx+=3,i++){R(g,sx,sb-4,3,4,i%2?ac[1]:ac[0]);if(i%2===0)R(g,sx,sb,3,1,ac[0])}
  R(g,x+2,sb-5,w-4,1,shade(ac[0],-40));
  const dx=x+Math.floor(w/2)-3;R(g,dx,base-10,7,10,'#5a3b2c');R(g,dx+1,base-9,5,4,'#7a5240');R(g,dx+5,base-5,1,1,'#f7c993');
  if(!T.flat)return;
  if(S.rnd()<0.45){const tx=x+6+S.rnd()*(w-22);R(g,tx+1,top-9,1,6,'#3a2f3e');R(g,tx+9,top-9,1,6,'#3a2f3e');R(g,tx,top-17,11,9,'#7a5a46');R(g,tx,top-17,11,2,'#5e4434');R(g,tx+1,top-15,1,6,'#8d6a52');R(g,tx+4,top-19,3,2,'#5e4434')}
  if(S.rnd()<0.5){const ax=x+4+S.rnd()*(w-14);R(g,ax,top-6,8,5,'#a49db0');R(g,ax,top-6,8,1,'#c7c1d0');R(g,ax+2,top-4,4,2,'#6d6680')}
  if(S.rnd()<0.35){const ax=x+w-8;R(g,ax,top-14,1,11,'#3a2f3e');R(g,ax-2,top-12,5,1,'#3a2f3e');R(g,ax,top-15,1,1,'#ff6a5a')}
}
export function roof(g,x,top,w,pal,T){
  const rc=T.roofC||pal.dark,rd=shade(rc,-25);
  if(T.roof==='gable'){const n=Math.ceil(w/2)-1;for(let i=0;i<n;i++)R(g,x-1+i,top-3-Math.floor(i*0.9),w+2-2*i,1,i%3?rc:rd);const cx=x+Math.floor(w/2);if(w>30){R(g,cx-3,top-Math.floor(n*0.45)-2,6,5,pal.trim);R(g,cx-2,top-Math.floor(n*0.45)-1,4,3,'#3d3656')}}
  else if(T.roof==='step'){let ww=w+2,yy=top-3,xx=x-1;while(ww>6){R(g,xx,yy-4,ww,5,pal.wall);R(g,xx,yy-5,ww,1,pal.trim);xx+=4;ww-=8;yy-=4}R(g,x+w/2-1,yy-6,2,3,rc)}
  else if(T.roof==='cone'){const tw=Math.min(18,w-6),tx=x+S.rnd()*(w-tw);R(g,tx,top-14,tw,14,pal.wall);R(g,tx+tw/2-1,top-10,3,5,'#3d3656');const n=Math.ceil(tw/2)+1;for(let i=0;i<n;i++)R(g,tx-1+i,top-15-i*2,tw+2-2*i,2,i%2?rc:rd);R(g,tx+tw/2,top-17-n*2,1,4,'#2f2d38');R(g,x-1,top-6,w+2,4,rc);R(g,x-1,top-7,w+2,1,rd)}
  else if(T.roof==='tile'){for(let i=0;i<4;i++)R(g,x-2+i,top-3-i,w+4-2*i,1,i%2?rc:rd)}
  else if(T.roof==='merlon'){for(let mx=x;mx<x+w-2;mx+=5){R(g,mx,top-6,4,4,rc);R(g,mx,top-6,1,1,rd);R(g,mx+3,top-6,1,1,rd)}}
  else if(T.roof==='deco'){R(g,x+4,top-6,w-8,4,pal.trim);R(g,x+10,top-10,w-20,4,pal.wall);R(g,x+10,top-10,w-20,1,pal.trim);R(g,x+3,top-2,w-6,1,T.neon||'#ff6ad5');R(g,x+12,top-7,w-24,1,T.neon2||'#6fe8ff')}
}
export function skyline(g,T,c,c2){
  const L=T.land;
  if(L==='spire')for(const[sx,hh]of[[150,58],[330,44]]){R(g,sx-5,64-hh*0.55,10,hh*0.55,c);for(let i=0;i<hh*0.45;i++)R(g,sx-Math.max(0,3-i/6),64-hh*0.55-i,Math.max(1,6-i/3),1,c);R(g,sx,64-hh-4,1,5,'#d9a35a')}
  if(L==='towers')for(const sx of[70,140,300,420]){R(g,sx-4,30,9,34,c);for(let i=0;i<8;i++)R(g,sx-5+i*0.6,30-i*2,11-i*1.2,2,'#a8503a');R(g,sx,12,1,3,c)}
  if(L==='dome')for(const sx of[120,350]){R(g,sx-10,36,20,28,c);circ(g,sx,34,8,c);R(g,sx,20,1,7,c);for(const d of[-14,14]){R(g,sx+d-3,30,6,34,c);circ(g,sx+d,29,3,c)}}
  if(L==='onion')for(const[sx,cc,hh]of[[132,'#d9a35a',40],[158,'#4f8a4b',46],[400,'#e4572e',44],[438,'#3b5b8c',38]]){const top=64-hh;R(g,sx-5,top+8,10,hh-8,c);R(g,sx-6,top+6,12,2,c2);circ(g,sx,top+2,6,cc);R(g,sx-3,top-5,6,3,cc);R(g,sx-1,top-7,3,2,cc);R(g,sx,top-13,1,6,'#f2c14e');R(g,sx-1,top-11,3,1,'#f2c14e');R(g,sx-4,top,2,3,shade(cc,40));for(let k=0;k<3;k++)R(g,sx-3+k*3,top+14,1,3,'#f2d27a')}
  if(L==='kremlin'){const kx=300;R(g,kx,44,84,20,'#7a2e2a');for(let mx=kx;mx<kx+84;mx+=5){R(g,mx,40,3,4,'#7a2e2a');R(g,mx,40,1,1,'#5e2220')}for(const tx of[kx+4,kx+70]){R(g,tx,28,10,16,'#8a3430');for(let i=0;i<5;i++)R(g,tx+i,28-i*2,10-2*i,2,'#4f8a4b')}R(g,kx+34,10,14,34,'#8a3430');R(g,kx+36,18,10,3,'#f2d27a');for(let i=0;i<7;i++)R(g,kx+34+i,10-i*2,14-2*i,2,'#4f8a4b');R(g,kx+40,-4,2,3,'#e4572e');R(g,kx+39,-1,4,1,'#e4572e')}
  if(L==='blocks')for(let bx=10;bx<W;bx+=48+((bx*7)%20)){const hh=30+((bx*13)%14);R(g,bx,64-hh,24,hh,c);for(let wy=64-hh+3;wy<62;wy+=4)for(let wx=bx+2;wx<bx+22;wx+=4)R(g,wx,wy,2,2,c2)}
  if(L==='palms')for(const sx of[40,200,290,450]){for(let i=0;i<30;i++)R(g,sx+Math.sin(i/9)*4,64-i,2,1,c);const ty=34;for(const[a,b]of[[-1,0],[1,0],[-1,1],[1,1],[0,-1]])for(let i=0;i<9;i++)R(g,sx+a*i,ty+b*Math.floor(i*i/14)-(b<0?i:0),2,1,c2)}
}
export function tree(o){
  o.r(-0.65,0,1.3,0.5,'#b5654a');o.r(-0.7,0.45,1.4,0.1,'#d07d5f');
  o.r(-0.12,0.5,0.24,1.7,'#6b4a35');o.r(-0.12,0.5,0.08,1.7,'#80583f');
  o.c(0,2.9,1.25,'#356b3c');o.c(-0.6,2.55,0.85,'#3f7a45');o.c(0.6,2.65,0.85,'#2f5f37');
  o.c(-0.3,3.3,0.65,'#4f8f4f');o.c(0.15,3.55,0.4,'#6fae5f');
  for(let k=0;k<30;k++){const a=S.rnd()*6.28,d=S.rnd()*1.3;o.dot(Math.cos(a)*d,2.9+Math.sin(a)*d,S.rnd()<0.5?'#28512e':'#7fbd6a')}
}
export function bench(o){o.r(-0.9,0.4,1.8,0.1,'#8a5a3c');o.r(-0.9,0.5,1.8,0.04,'#a5714e');o.r(-0.85,0,0.08,0.4,'#3a2f3e');o.r(0.77,0,0.08,0.4,'#3a2f3e');o.r(-0.9,0.62,1.8,0.08,'#8a5a3c');o.r(-0.9,0.78,1.8,0.08,'#8a5a3c')}
export function umbrella(o,c1,c2){
  o.r(-0.04,0,0.08,2.2,'#e8e0d0');
  for(let i=0;i<6;i++){const z=2.1+i*0.08,w=2.2-i*0.34;o.r(-w/2,z,w,0.09,i%2?c1:c2)}
  for(let i=0;i<5;i++)o.r(-1.1+i*0.44,2.02,0.22,0.08,c1);
  o.r(-0.45,0.72,0.9,0.06,'#f4ead2');o.r(-0.03,0,0.06,0.72,'#6d6680');
  o.r(-1.0,0,0.06,0.85,'#4a3f58');o.r(-1.0,0.42,0.4,0.05,'#4a3f58');o.r(0.94,0,0.06,0.85,'#4a3f58');o.r(0.6,0.42,0.4,0.05,'#4a3f58');
  o.r(-0.15,0.78,0.1,0.1,'#f4ead2');o.r(0.12,0.78,0.08,0.12,'#e4572e');
}
export function pot(o){o.r(-0.3,0,0.6,0.5,'#c9734f');o.r(-0.34,0.45,0.68,0.08,'#e08b66');o.c(0,0.85,0.45,'#4a8a4f');o.c(-0.15,0.95,0.25,'#68a75e');for(let k=0;k<5;k++)o.dot((S.rnd()-0.5)*0.7,0.7+S.rnd()*0.5,['#f5d76e','#e86a6a','#f4ead2'][k%3])}
export function bikes(o){for(const off of[-0.5,0.5]){const s=o.s;const b=o.at(off,0);ring(o.g,b.x-0.45*s,b.y-0.33*s,0.33*s,'#2b2633');ring(o.g,b.x+0.45*s,b.y-0.33*s,0.33*s,'#2b2633');L(o.g,b.x-0.45*s,b.y-0.33*s,b.x,b.y-0.7*s,off<0?'#e4572e':'#3fa7a8');L(o.g,b.x,b.y-0.7*s,b.x+0.45*s,b.y-0.33*s,off<0?'#e4572e':'#3fa7a8');L(o.g,b.x-0.1*s,b.y-0.85*s,b.x+0.3*s,b.y-0.85*s,'#2b2633')}}
export function basket(o){o.r(-0.4,0.3,0.8,0.5,'#3a3a44');for(let k=0;k<14;k++)o.dot(-0.32+S.rnd()*0.64,0.62+S.rnd()*0.2,'#e2ef3c');o.r(-0.4,0.3,0.8,0.04,'#6d6680');o.r(-0.36,0,0.05,0.3,'#3a3a44');o.r(0.31,0,0.05,0.3,'#3a3a44')}
export function lamp(g,x,y,dir){WL(g,[x,y,0],[x,y,6.5],'#2f2d38',2);WL(g,[x,y,6.5],[x+dir*0.8,y,6.5],'#2f2d38',1);const p=P(x+dir*0.8,y,6.4);R(g,p.x-3,p.y-1,7,3,'#2f2d38');R(g,p.x-2,p.y+1,5,1,'#fff1c1');g.fillStyle='rgba(255,241,193,0.12)';g.fillRect(Math.round(p.x-4),Math.round(p.y+2),9,2)}
/** A sagging wire of bulbs between world points (club nights). */
export function stringLights(g,pts){const cols=['#ffd27a','#ff8a5c','#9be37a','#6fe8ff','#ff6ad5'];let k=0;
  for(let i=0;i+1<pts.length;i++){const a=P(...pts[i]),b=P(...pts[i+1]);const n=Math.max(4,Math.round(Math.hypot(b.x-a.x,b.y-a.y)/2));let px=a.x,py=a.y;
    for(let j=1;j<=n;j++){const t=j/n,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t+Math.sin(t*Math.PI)*6;L(g,px,py,x,y,'#2b2633');px=x;py=y;if(j%3===0){R(g,x,y+1,2,2,cols[k%5]);g.fillStyle='rgba(255,230,160,0.18)';g.fillRect(Math.round(x-1),Math.round(y),3,4);k++}}}}
/** Triangle flags strung across the plaza for the opens. */
export function bunting(g,y0){const cols=['#e4572e','#f2c14e','#3fa7a8','#f4ead2','#8e6cc1','#4f9a5b'];let k=0;
  for(let x0=0;x0<480;x0+=96){for(let x=0;x<96;x+=2){const y=y0+Math.sin(x/96*Math.PI)*7;R(g,x0+x,y,2,1,'#2b2633');if(x%8===0){const c=cols[k++%6];for(let r=0;r<5;r++)R(g,x0+x-2+Math.ceil(r/2),y+1+r,5-r,1,c)}}}}
export function obj(g,x,y){const p=P(x,y,0),s=p.s;return{g,s,at:(xm,zm)=>({x:p.x+xm*s,y:p.y-zm*s}),r:(xm,zm,wm,hm,c)=>R(g,p.x+xm*s,p.y-(zm+hm)*s,wm*s,hm*s,c),c:(xm,zm,rm,c)=>circ(g,p.x+xm*s,p.y-zm*s,rm*s,c),dot:(xm,zm,c)=>R(g,p.x+xm*s,p.y-zm*s,1,1,c)}}
