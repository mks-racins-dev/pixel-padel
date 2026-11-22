import { H } from '../sim/hooks.js';
import { LOOKS } from '../content/looks.js';
import { settings } from './config.js';
import { CAREER, oppDiff } from '../meta/career.ts';
import { careerSkills } from '../meta/profile.ts';
import { PARTNERS, chemistry, chemPerks } from '../meta/doubles.ts';
import { isPractice, practiceLanded, practiceMiss, startPractice, stopPractice } from './practice.js';
import { rand, seedSim } from '../core/rng.ts';
import { S } from '../state.js';
import { DIFF, G, HL, REACH, STYLES, SVC, overhit, powK, sweet } from './constants.js';
import { stepBall, setCourt } from './physics.js';
import { mkLook, mkPlayer } from './player.js';

export function newMatch(isDemo,seed){
  const career=CAREER.active&&!isDemo;
  seedSim(seed ?? (career&&CAREER.event.seed!=null?CAREER.event.seed:(Date.now() ^ (Math.random()*0x7fffffff))));
  S.demo=isDemo;
  if(!isDemo)H.matchStart({career:career?CAREER.event.id:null,mode:career?CAREER.kind:settings.mode,diff:settings.diff,venue:settings.loc,games:settings.games,style:settings.style});
  stopPractice();
  setCourt(career&&CAREER.event.court||null);
  const dbl=career&&!!CAREER.event.doubles;
  const m=S.demo?'2v2':career?(dbl?'2v2':'1v1'):settings.mode;const me=mkLook(S.myLookData);
  if(m==='practice')S.players=[mkPlayer(0,me,'h1',0)];
  else if(m==='1v1')S.players=[mkPlayer(0,me,'h1',0),mkPlayer(1,LOOKS.o1,'ai',0)];
  else if(m==='2v2')S.players=[mkPlayer(0,me,S.demo?'ai':'h1',2.4),mkPlayer(0,LOOKS.p2,'ai',-2.4),mkPlayer(1,LOOKS.o1,'ai',-2.4),mkPlayer(1,LOOKS.o2,'ai',2.4)];
  else if(m==='online'){
    // host: we are team 0. guest: our team comes from the host or server (P2P guests are team 1). server: both remote.
    const role=S.net&&S.net.role,lk=role==='host'?[S.myLookData,S.net.guestLook]:(S.net&&S.net.looks)||[];
    const ctrl=t=>role==='server'?'net':role==='guest'?(t===(S.net.team??1)?'h1':'net'):(t===0?'h1':'net');
    S.players=[0,1].map(t=>mkPlayer(t,lk[t]?mkLook(lk[t]):(t?LOOKS.o1:LOOKS.p1),ctrl(t),0))}
  else S.players=[mkPlayer(0,me,'h1',0),mkPlayer(1,LOOKS.o1,'h2',0)];
  const ks=Object.keys(STYLES);for(const p of S.players)p.sk=isHuman(p)?STYLES[settings.style]:STYLES[ks[Math.floor(rand()*ks.length)]];
  if(career&&!dbl){S.players[0].sk=careerSkills(STYLES[settings.style]);S.players[1].sk=STYLES[CAREER.event.style]||STYLES.allround}
  S.chem=null;
  if(dbl){ // career doubles: you + a story partner vs a story pair; chemistry shapes the partner
    const e=CAREER.event,pa=PARTNERS.find(x=>x.id===e.partner)||PARTNERS[0],pk=chemPerks(chemistry(pa.id)),base=STYLES[pa.style]||STYLES.allround;
    S.chem=pk;S.players[0].sk=careerSkills(STYLES[settings.style]);
    S.players[1].sk={...base,spd:base.spd+pk.bonus,pow:base.pow+pk.bonus,acc:base.acc+pk.bonus};
    S.players[2].sk=STYLES[e.styles[0]]||STYLES.allround;S.players[3].sk=STYLES[e.styles[1]]||STYLES.allround}
  if(m==='online'&&S.net){const sty=S.net.role==='host'?[settings.style,S.net.guestStyle]:S.net.styles||[];S.players.forEach((p,i)=>p.sk=STYLES[sty[i]]||STYLES.allround)}
  S.score={pts:[0,0],games:[0,0],winner:-1};
  S.ball={x:0,y:-9,z:1,vx:0,vy:0,vz:0,held:true,out:false,rolling:false};
  S.R0={serve:true,lastTeam:0,bounces:0,faults:0,boxX:-1,net:false,hits:0};
  S.marker=null;S.trail=[];
  if(m==='practice')return startPractice();
  setupServe(false);H.updateHud();
}
export function teamOf(t){return S.players.filter(p=>p.team===t)}
export function diffOf(p){if(CAREER.active&&!S.demo&&p.team===1)return careerDiff();if(CAREER.active&&!S.demo&&CAREER.event.doubles&&p.team===0)return partnerDiff();return DIFF[S.demo?'normal':(p.team===0&&settings.mode==='2v2'?'normal':settings.diff)]}
export function isHuman(p){return p.ctrl==='h1'||p.ctrl==='h2'||p.ctrl==='net'}
export function setupServe(second){
  const g=S.score.games[0]+S.score.games[1];
  const st=g%2;const mates=teamOf(st);const srv=mates[Math.floor(g/2)%mates.length];
  const rt=1-st;const deuce=(S.score.pts[0]+S.score.pts[1])%2===0;
  const sx=(st===0?1:-1)*(deuce?1:-1)*2.4;
  srv.x=sx;srv.y=st===0?-9.3:9.3;srv.homeX=mates.length>1?sx:0;
  const boxX=-Math.sign(sx);
  for(const q of mates)if(q!==srv){q.x=-sx;q.y=st===0?-3.2:3.2;q.homeX=-sx}
  const recv=teamOf(rt);
  if(recv.length===1){recv[0].x=boxX*2.4;recv[0].y=rt===0?-8.8:8.8;recv[0].homeX=0}
  else{let a=recv[0],b=recv[1];if(Math.abs(a.homeX-boxX*2.4)>Math.abs(b.homeX-boxX*2.4)){const t=a;a=b;b=t}a.x=boxX*2.4;a.y=rt===0?-8.8:8.8;a.homeX=boxX*2.4;b.x=-boxX*2.4;b.y=rt===0?-7.6:7.6;b.homeX=-boxX*2.4}
  for(const p of S.players){p.vx=p.vy=0;p.tx=p.x;p.ty=p.y;p.swingT=0;p.swingReq=null;p.hitDone=true;p.charging=null;p.charge=0;p.serveAim=0.5}
  S.R0={serve:true,lastTeam:st,bounces:0,faults:second?1:0,boxX,net:false,hits:S.R0?S.R0.hits+1:0,server:srv};
  S.ball.held=true;S.ball.out=false;S.ball.rolling=false;S.ball.vx=S.ball.vy=S.ball.vz=0;
  S.state='serve';S.stateT=isHuman(srv)?0:0.9+rand()*0.5;S.marker=null;S.trail=[];
  H.updateHud();
}
export function aimVel(x0,y0,z0,tx,ty,spd,clear){
  const d=Math.hypot(tx-x0,ty-y0);let T=Math.max(0.3,d/spd),v;
  for(let i=0;i<40;i++){
    v={vx:(tx-x0)/T,vy:(ty-y0)/T,vz:(-z0+0.5*G*T*T)/T};
    const tn=-y0/v.vy;if(!(tn>0&&tn<T))return v;
    const zn=z0+v.vz*tn-0.5*G*tn*tn;if(zn>clear)return v;T*=1.07;
  }return v;
}
export function gauss(){return(rand()+rand()+rand()-1.5)*1.15}
export function launch(tx,ty,spd,clear){const v=aimVel(S.ball.x,S.ball.y,S.ball.z,tx,ty,spd,clear);S.ball.vx=v.vx;S.ball.vy=v.vy;S.ball.vz=v.vz;S.ball.held=false;S.ball.rolling=false;S.ball.out=false;S.ball.spin=0;S.ball.vib=false;S.ball.kick=false;S.ball.slice=false;S.ball.porTres=false}
export function serveTarget(p,power){const dir=p.team===0?1:-1,bx=S.R0.boxX;return{tx:bx*(0.5+p.serveAim*3.6),ty:dir*(3.8+power*2.8)}}
export function doServe(p,power){
  const dir=p.team===0?1:-1;
  if(!isHuman(p)){p.serveAim=0.1+rand()*0.8;power=Math.min(sweet(p),0.45+rand()*0.5)}
  let {tx,ty}=serveTarget(p,power),clear=1.12;
  const e=(isHuman(p)?0.22:diffOf(p).err*0.45)*(1.45-0.15*p.sk.acc);tx+=gauss()*e;ty+=gauss()*e*0.8;
  if(overhit(p,power)){if(rand()<0.5)ty=dir*(SVC+1.2);else{clear=0.35;ty=dir*2.5}S.floats.push({x:p.x,y:p.y,t:0.9,text:'OVERHIT!',c:'#e4572e'})}
  S.ball.x=p.x+(p.team===0?0.35:-0.35);S.ball.y=p.y+(p.team===0?0.25:-0.25);S.ball.z=0.8;
  launch(tx,ty,(9+power*6)*powK(p),clear);
  S.R0.serve=true;S.R0.lastTeam=p.team;S.R0.bounces=0;S.R0.net=false;S.R0.hits++;
  p.swingT=0.3;p.swingType='drive';p.hitDone=true;S.state='play';
  H.sfx('hit',0.9);setMarker(p.team);
}
export function canHit(p){
  if(S.state!=='play'||S.ball.held)return false;
  if(S.R0.lastTeam===p.team)return false;
  if((S.ball.y<0?0:1)!==p.team)return false;
  if(S.R0.serve&&S.R0.bounces===0)return false;
  if(S.ball.z>2.8)return false;
  const dx=S.ball.x-p.x,dy=S.ball.y-p.y;return dx*dx+dy*dy<REACH*REACH;
}
export function performHit(p,type,aimX,power){
  power=power==null?1:Math.max(0,Math.min(1,power));
  const dir=p.team===0?1:-1;const human=isHuman(p);const D=diffOf(p);
  const offWall=S.R0.backWall===p.team&&type!=='vibora';if(offWall&&type!=='lob')power=Math.max(power,0.5);
  let ty,spd,clear=1.05,smash=false,vib=false,tx=aimX,shot=null;
  const cp=type!=='vibora'&&p.wantBack&&canContrapared(p)?contraparedVel(p,aimX):null;
  if(type==='vibora'){vib=true;tx=(Math.abs(aimX)>0.5?Math.sign(aimX):(rand()<0.5?-1:1))*4.3;ty=dir*(7.4+rand()*1.2);spd=25;clear=0.98}
  else if(type==='lob'){ty=dir*(6.6+power*2.9);spd=7.6;clear=2.6}
  else if(S.ball.z>1.75&&power>0.55){smash=true;
    // por tres: a full-power smash from near the net kicks up and out over the side fence
    if(power>=0.92&&S.ball.z>2&&Math.abs(p.y)<4.5){shot='portres';tx=Math.sign(aimX||p.x||1)*2.4;ty=dir*3.6;spd=24;clear=0.97}
    else{ty=dir*(3.6+rand()*2.4);spd=22;clear=0.97}}
  // bandeja: a controlled sliced overhead that keeps the ball deep and low
  else if(S.ball.z>1.6&&type==='drive'){shot='bandeja';ty=dir*(6.6+power*1.8);spd=11+power*3;clear=1.15}
  else{ty=dir*(1.9+power*7.0);spd=8+power*10;if(power<0.3)clear=1.02;
    // chiquita: a soft dipping ball at the feet of a team waiting at the net, played from the back
    if(type==='drive'&&power<0.3&&Math.abs(p.y)>5.5){shot='chiquita';ty=dir*(2.4+power*2.5);clear=0.98}}
  if(!vib)spd*=powK(p);
  if(offWall&&type!=='lob')spd*=1.12+(p.sk.wall||0)*0.06;
  const e=(vib?0.15:(human?0.3:D.err))*(1.45-0.15*p.sk.acc);tx+=gauss()*e;ty+=gauss()*e*(power<0.3?0.35:0.75);
  if(!vib&&overhit(p,power)){if(type==='lob'||rand()<0.5)ty=dir*(HL+1.5);else{clear=0.3;ty=dir*2}S.floatTxt={x:p.x,y:p.y,t:0.9,text:'OVERHIT!',c:'#e4572e'}}
  if(!human&&!vib)clear-=rand()*D.err*0.22;
  tx=Math.max(-4.7,Math.min(4.7,tx));
  if(cp){Object.assign(S.ball,{vx:cp.vx,vy:cp.vy,vz:cp.vz,held:false,rolling:false,out:false,spin:0,vib:false,kick:false,slice:false,porTres:false});shot='contrapared'}
  else launch(tx,ty,spd,clear);
  if(vib){S.ball.spin=Math.sign(tx);S.ball.vib=true}
  if(shot==='portres'){S.ball.kick=true;S.ball.porTres=true}
  if(shot==='bandeja')S.ball.slice=true;
  if(shot&&shot!=='portres')S.floats.push({x:p.x,y:p.y,t:0.9,text:SHOT_LABEL[shot][0],c:SHOT_LABEL[shot][1]});
  S.R0.lastShot=shot||(smash?'smash':type);S.R0.lastOffWall=offWall;
  if(!S.demo&&(p.ctrl==='h1'||p.ctrl==='h2'))H.emit({type:'shot',shot:S.R0.lastShot,offWall});
  S.R0.lastTeam=p.team;S.R0.bounces=0;S.R0.serve=false;S.R0.net=false;S.R0.hits++;S.R0.backWall=-1;
  if(offWall){S.R0.wallShot=true;p.energy=Math.min(100,p.energy+10+Math.round((p.sk.wall||0)*4));S.floats.push({x:p.x,y:p.y,t:1,text:'OFF THE WALL!',c:'#6fd3d2'});H.sfx('glass',1)}
  p.hitDone=true;if(p.swingT<0.12)p.swingT=0.2;
  if(vib){p.energy=0;for(const q of teamOf(1-p.team))q.energy=Math.min(100,q.energy+30);S.floatTxt={x:p.x,y:p.y,t:1.1,text:'VIBORA!',c:'#ff8a5c'};for(const q of teamOf(1-p.team))S.floats.push({x:q.x,y:q.y,t:1.1,text:'+30',c:'#f2c14e'});S.shake=0.25;H.sfx('vibora')}
  else{p.energy=Math.min(100,p.energy+(smash?20:14));H.sfx(smash?'smash':'hit',0.55+power*0.45);if(smash)S.shake=0.18}
  setMarker(p.team);
}
export function setMarker(hitTeam){
  S.marker=null;if(settings.assist!=='on'||S.demo||(CAREER.active&&CAREER.event&&CAREER.event.noMarker))return;
  const tgt=1-hitTeam;if(!teamOf(tgt).some(isHuman))return;
  const b={...S.ball};for(let i=0;i<400;i++){let hit=null;stepBall(b,1/120,(t)=>{if(t==='floor'||t==='roll')hit=true});if(hit){S.marker={x:b.x,y:b.y};return}if(b.out)return}
}
export function soundOnly(t,a,c){if(t==='floor')H.sfx('bounce',Math.min(1,(c||4)/8));else if(t==='wall')H.sfx(c?'glass':'mesh');else if(t==='net')H.sfx('net')}
export function onEvent(t,a,c,back){
  soundOnly(t,a,c);if(S.state!=='play')return;
  const r=S.R0;
  if(t==='floor'||t==='roll'){
    if(S.marker)S.marker=null;
    if(r.bounces===0){
      if(a===r.lastTeam)return endPoint(1-r.lastTeam,r.net?'INTO THE NET':'FAULT');
      if(r.serve){const inBox=Math.abs(S.ball.y)<=SVC+0.05&&S.ball.x*r.boxX>=-0.05;if(!inBox)return serveFault('SERVE OUT')}
      if(isPractice()&&r.lastTeam===0&&a===1)return practiceLanded({x:S.ball.x,y:S.ball.y});
      r.bounces=1;
    }else return endPoint(r.lastTeam,'DOUBLE BOUNCE');
  }else if(t==='wall'){
    if(r.bounces===0){if(r.serve)return serveFault('WALL ON SERVE');if(a!==r.lastTeam)return endPoint(1-r.lastTeam,'WALL BEFORE BOUNCE')}
    else if(r.serve&&!c)return serveFault('SERVE INTO FENCE');
    if(back&&c&&r.bounces>=1&&a!==r.lastTeam)r.backWall=a;
  }else if(t==='out'){
    if(r.bounces>=1)endPoint(r.lastTeam,S.ball.porTres?'POR TRES!':'OUT OF THE CAGE!');else if(r.serve)serveFault('SERVE OUT');else endPoint(1-r.lastTeam,'OUT');
  }else if(t==='roof'){if(r.serve&&r.bounces===0)serveFault('HIT THE ROOF');else endPoint(1-r.lastTeam,'HIT THE ROOF!');
  }else if(t==='net')r.net=true;
}
export function teamName(t,short){if(S.demo)return t?'BLUE':'RED';if(CAREER.active)return t?CAREER.event.opp:(CAREER.event.doubles&&!short?'YOU & '+((PARTNERS.find(x=>x.id===CAREER.event.partner)||PARTNERS[0]).name):'YOU');const m=settings.mode;if(m==='online')return t===H.myTeam()?'YOU':((S.net&&S.net.names&&S.net.names[t])||'RIVAL');if(m==='pvp')return t?'P2':'P1';if(m==='2v2')return t?(short?'CPU':'LEO & IVY'):(short?'YOU':'YOU & MIA');return t?'CPU':'YOU'}
export function serveFault(reason){
  S.state='between';
  if(S.R0.faults===0){H.showMsg('FAULT',reason+' · 2ND SERVE');S.stateT=1.1;S.afterState=()=>setupServe(true)}
  else endPoint(1-S.R0.lastTeam,'DOUBLE FAULT');
}
export function endPoint(team,reason){
  if(isPractice())return practiceMiss(reason);
  S.state='between';S.stateT=1.8;S.marker=null;
  for(const s of S.spectators)s.cheer=1.6;
  H.mascotReact();
  if(!S.demo){const me=S.players.find(p=>p.ctrl==='h1');H.emit({type:'point',won:team===(me?me.team:0),wall:!!S.R0.wallShot,reason,golden:S.score.pts[0]===3&&S.score.pts[1]===3})}
  S.score.pts[team]++;for(const q of teamOf(team))q.energy=Math.min(100,q.energy+8);
  let small='POINT · '+teamName(team);
  if(S.score.pts[team]>=4){S.score.games[team]++;S.score.pts=[0,0];small='GAME · '+teamName(team);
    if(S.score.games[team]>=matchGames()&&!S.demo){S.score.winner=team;H.slowMo(1.4,0.3)}
    if(S.demo&&S.score.games[team]>=6)S.score.games=[0,0];}
  const human0=teamOf(team).some(isHuman);
  if(!S.demo)H.sfx(settings.mode==='pvp'?'point':settings.mode==='online'?(team===H.myTeam()?'point':'lose'):human0?'point':'lose');
  H.pointWon(team);
  H.showMsg(reason,small);H.updateHud();
  S.afterState=()=>{if(S.score.winner>=0)H.showEnd();else setupServe(false)};
}

const SHOT_LABEL={bandeja:['BANDEJA','#f7c993'],chiquita:['CHIQUITA','#9be37a'],contrapared:['CONTRAPARED','#c9a7ff']};

/** Contrapared: the ball got past you, so you hit it backwards into your own back glass and it rebounds over the net. */
export function canContrapared(p){
  const dir=p.team===0?1:-1;
  return Math.abs(S.ball.y)>7.6&&S.ball.z<2.2&&Math.sign(S.ball.vy||-dir)===-dir;
}
/** Finds a hit into your own back wall that rebounds cleanly over the net and lands in, using the real ball physics. */
export function contraparedVel(p,aimX){
  const dir=p.team===0?1:-1,wantX=Math.max(-3.5,Math.min(3.5,aimX||0));let best=null,bs=1e9;
  for(let vy=9;vy<=17;vy+=1)for(let vz=4;vz<=8.5;vz+=0.5){
    const vx=(wantX-S.ball.x)*0.12;
    const b={x:S.ball.x,y:S.ball.y,z:Math.max(0.3,S.ball.z),vx,vy:-dir*vy,vz,out:false,rolling:false,spin:0};
    let land=null,bad=false,wall=false;
    for(let i=0;i<480&&!land&&!bad;i++)stepBall(b,1/120,(t,a,g,back)=>{if(t==='wall'){if(back&&a===p.team)wall=true;else bad=true}else if(t==='net'||t==='out'||t==='roof')bad=true;else if(t==='floor'||t==='roll')land={x:b.x,y:b.y,side:a}});
    if(bad||!wall||!land||land.side===p.team)continue;
    const sc=Math.abs(land.y-dir*6.5)+Math.abs(land.x-wantX)*0.5;if(sc<bs){bs=sc;best={vx,vy:-dir*vy,vz}}
  }
  return best;
}

/** Games needed to win the current match. */
export function matchGames(){return CAREER.active&&!S.demo&&CAREER.event?CAREER.event.games:settings.games}
let cdKey=null,cdVal=null;
let pdKey='',pdVal=null;
function partnerDiff(){const e=CAREER.event,pa=PARTNERS.find(x=>x.id===e.partner)||PARTNERS[0],k=pa.id+':'+chemistry(pa.id);if(pdKey!==k){pdKey=k;pdVal=oppDiff(pa.skill+chemPerks(chemistry(pa.id)).skill,DIFF.easy,DIFF.hard)}return pdVal}
function careerDiff(){const e=CAREER.event;if(cdKey!==e.id){cdKey=e.id;cdVal=oppDiff(e.skill,DIFF.easy,DIFF.hard)}return cdVal}
