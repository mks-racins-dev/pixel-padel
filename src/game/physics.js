import { BACK_GLASS, BACK_H, G, HL, HW, NET_H, NET_POST, SIDE_H } from './constants.js';

/* ---------------- court twists (career street courts) ---------------- */
/** wind: sideways push on high balls (m/s²) · sand: dead, low bounces · deadBack: chain-link back fence instead of glass · roof: beam height (m), a ball above it is a fault */
export const COURT={wind:0,sand:false,deadBack:false,roof:0};
export function setCourt(m){COURT.wind=m?.wind||0;COURT.sand=!!m?.sand;COURT.deadBack=!!m?.deadBack;COURT.roof=m?.roof||0}

/* ---------------- ball physics ---------------- */
export function stepBall(b,dt,ev){
  const py=b.y;
  if(b.ext&&Math.abs(b.x)<HW-0.05&&Math.abs(b.y)<HL-0.05)b.ext=false; // a ball returned from outside is back in the cage
  b.vz-=G*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
  const k=0.05*dt;b.vx-=b.vx*k;b.vy-=b.vy*k;
  if(COURT.wind&&b.z>1.5)b.vx+=COURT.wind*dt;
  if(COURT.roof&&b.z>COURT.roof&&!b.out){b.out=true;b.vz=-Math.abs(b.vz)*0.3;ev('roof');return}
  if((py<0)!==(b.y<0)){const nh=NET_H+(NET_POST-NET_H)*Math.min(1,Math.abs(b.x)/HW);if(b.z<nh&&b.z>-0.1&&!b.out){b.y=py<0?-0.06:0.06;b.vy*=-0.12;b.vx*=0.3;b.vz=Math.min(b.vz,0)*0.3;ev('net')}}
  if(b.z<=0){b.z=0;if(b.vz<-0.9){const sp=-b.vz;bounceMods(b,sp);b.vz=-b.vz*(COURT.sand?0.5:0.7);b.vx*=COURT.sand?0.72:0.86;b.vy*=COURT.sand?0.72:0.86;if(b.spin){b.vx+=b.spin*4.8;b.spin=0}ev('floor',b.y<0?0:1,sp)}else{b.vz=0;b.vx*=0.985;b.vy*=0.985;if(!b.rolling){b.rolling=true;ev('roll',b.y<0?0:1)}}}
  if(Math.abs(b.x)>HW&&!b.out&&!b.ext){const s=Math.sign(b.x);if(b.z<SIDE_H){const glass=Math.abs(b.y)>6;b.x=s*HW;b.vx*=-(glass?0.72:0.38);if(!glass){b.vy*=0.6;b.vz*=0.6}ev('wall',b.y<0?0:1,glass)}else{b.out=true;ev('out')}}
  if(Math.abs(b.y)>HL&&!b.out&&!b.ext){const s=Math.sign(b.y);if(b.z<BACK_H){const glass=b.z<BACK_GLASS&&!COURT.deadBack;b.y=s*HL;b.vy*=-(glass?0.72:0.38);if(!glass){b.vx*=0.6;b.vz*=0.6}ev('wall',s<0?0:1,glass,true)}else{b.out=true;ev('out')}}
}

/** Spin effects applied on top of the normal floor bounce (runs before it, so factors stack). */
function bounceMods(b,sp){
  if(b.slice){b.vz*=0.62;b.vx*=0.85;b.vy*=0.8;b.slice=false}
  if(b.kick){ // topspin smash: the ball jumps sideways towards the fence
    b.vx=Math.sign(b.vx||b.x||1)*7/0.86;b.vy*=0.3;b.vz=-11/0.7;b.kick=false}
}
