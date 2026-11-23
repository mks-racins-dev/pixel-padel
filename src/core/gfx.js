import { S } from '../state.js';

'use strict';
export const W=480,H=270;
export const cv=document.getElementById('c');
export const ctx=cv.getContext('2d');
/* ---------------- projection ---------------- */
export const CAM=[0,-30,17],TGT=[0,0.5,0],FOC=520,CX=240,CY=150;
export const FW=(()=>{const d=[TGT[0]-CAM[0],TGT[1]-CAM[1],TGT[2]-CAM[2]];const l=Math.hypot(d[0],d[1],d[2]);return d.map(v=>v/l)})();
export const UP=[0,-FW[2],FW[1]];
export function P(x,y,z){const dx=x-CAM[0],dy=y-CAM[1],dz=z-CAM[2];const zc=dx*FW[0]+dy*FW[1]+dz*FW[2];const k=FOC/zc;return{x:CX+k*dx,y:CY-k*(dy*UP[1]+dz*UP[2]),s:k}}
/* ---------------- helpers ---------------- */
export function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function R(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
export function L(g,x0,y0,x1,y1,c,t){t=t||1;x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);g.fillStyle=c;const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;for(let i=0;i<3000;i++){g.fillRect(x0,y0,t,t);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}}
export function poly(g,pts,c){g.fillStyle=c;let a=1e9,b=-1e9;for(const p of pts){a=Math.min(a,p.y);b=Math.max(b,p.y)}const spans=[];
  for(let y=Math.ceil(a-0.5);y<=Math.floor(b-0.5);y++){const yc=y+0.5,xs=[];for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];if((p.y<=yc&&q.y>yc)||(q.y<=yc&&p.y>yc))xs.push(p.x+(yc-p.y)*(q.x-p.x)/(q.y-p.y))}
  xs.sort((m,n)=>m-n);for(let k=0;k+1<xs.length;k+=2){const x0=Math.round(xs[k]),x1=Math.round(xs[k+1]);if(x1>x0){g.fillRect(x0,y,x1-x0,1);spans.push([y,x0,x1])}}}return spans}
export function WL(g,a,b,c,t){const p=P(a[0],a[1],a[2]),q=P(b[0],b[1],b[2]);L(g,p.x,p.y,q.x,q.y,c,t)}
export function WQ(g,pts,c){return poly(g,pts.map(p=>P(p[0],p[1],p[2])),c)}
export function circ(g,cx,cy,r,c){g.fillStyle=c;const n=Math.ceil(r);for(let y=-n;y<=n;y++){const hw=Math.floor(Math.sqrt(Math.max(0,r*r-y*y)));g.fillRect(Math.round(cx-hw),Math.round(cy+y),hw*2+1,1)}}
export function ring(g,cx,cy,r,c){g.fillStyle=c;for(let a=0;a<64;a++){const t=a/64*Math.PI*2;g.fillRect(Math.round(cx+Math.cos(t)*r),Math.round(cy+Math.sin(t)*r),1,1)}}
export function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=(n>>16)+amt,g=(n>>8&255)+amt,b=(n&255)+amt;r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
/** Richer colour: push saturation and a little contrast on an already painted layer. */
export function vivid(c,sat,con){const g=c.getContext('2d');if(!g)return c;con=con||1;const id=g.getImageData(0,0,c.width,c.height),d=id.data;
  for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const r=d[i],gg=d[i+1],b=d[i+2],y=0.299*r+0.587*gg+0.114*b;d[i]=(y+(r-y)*sat-128)*con+128;d[i+1]=(y+(gg-y)*sat-128)*con+128;d[i+2]=(y+(b-y)*sat-128)*con+128}
  g.putImageData(id,0,0);return c}
export function newCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return[c,g]}
export const FONT={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',W:'101101111111101',Y:'101101010010010',V:'101101101101010',X:'101101010101101','!':'010010010000010','+':'000010111010000','3':'110001010001110','0':'111101101101111','1':'010110010010111','2':'110001010100111',J:'001001001101010',Q:'010101101110011',Z:'111001010100111','?':'110001010000010','.':'000000000000010',',':'000000000010100',"'":'010010000000000','4':'101101111001001','5':'111100110001110','6':'011100110101010','7':'111001010010010','8':'010101010101010','9':'010101011001110','-':'000000111000000',':':'000010000010000'};
export function txt(g,s,x,y,c,sc){sc=sc||1;let cx=x;for(const ch of s){const f=FONT[ch];if(f)for(let i=0;i<15;i++)if(f[i]==='1')R(g,cx+(i%3)*sc,y+Math.floor(i/3)*sc,sc,sc,c);cx+=4*sc}}
export function txtW(s,sc){sc=sc||1;return s.length*4*sc-sc}
/* ---------------- UI ---------------- */
export const $=id=>document.getElementById(id);

/** One-time side effects (DOM wiring, saved settings). Called from main.js. */
export function setup(){
  ctx.imageSmoothingEnabled=false;
  S.rnd=mulberry(7);
}
