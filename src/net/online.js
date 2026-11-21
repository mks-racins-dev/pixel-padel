import { S } from '../state.js';
import { mkSnap, r3 } from '../sim/snapshot.js';
export { mkSnap, r3 };
import { initAudio, sfx } from '../audio/sfx.js';
import { LOCS } from '../content/venues.js';
import { $ } from '../core/gfx.js';
import { G, STYLES } from '../game/constants.js';
import { cleanLook } from '../game/player.js';
import { newMatch } from '../game/rules.js';
import { setLoc, settings } from '../game/settings.js';
import { inputOf, releaseCharge, startCharge, tryVibora } from '../input/input.js';
import { mascotReact } from '../render/mascot.js';
import { showEnd, showGameUI, showMsg, toMenu, updateEnergy, updateHud } from '../ui/ui.js';

export const NET_PREFIX='pixelpadel-v1-';
/** Game server address (wss://...). Without it, online play falls back to peer-to-peer (PeerJS). */
export const SERVER_URL=(import.meta.env&&import.meta.env.VITE_SERVER_URL||'').replace(/\/$/,'');
export const useServer=()=>!!SERVER_URL;

/** A WebSocket with the same small interface as a PeerJS connection: on(), send(obj), open, close(). */
export function wsConn(url){
  const ws=new WebSocket(url),h={data:[],close:[],error:[],open:[]};
  const c={open:false,on(e,f){h[e].push(f)},send(o){if(c.open)ws.send(JSON.stringify(o))},close(){try{ws.close()}catch(e){}}};
  ws.onopen=()=>{c.open=true;h.open.forEach(f=>f())};
  ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(_){return}h.data.forEach(f=>f(m))};
  ws.onclose=()=>{const was=c.open;c.open=false;h.close.forEach(f=>f(was))};
  ws.onerror=()=>h.error.forEach(f=>f());
  return c;
}
/** Connect to a match room on the game server. mode: 'create' | 'join' | 'quick'. */
export function joinServerRoom(code,mode){
  netClose();
  const n={role:'guest',server:true,code,mode,conn:null,inp:{mx:9,my:9},inT:0,snap:null,snapAt:0,hk:'',team:null};S.net=n;
  const c=wsConn(SERVER_URL+'/room/'+code);n.conn=c;bindConn(c);
  c.on('open',()=>c.send({t:'hello',mode,style:settings.style,look:S.myLookData,loc:settings.loc}));
  c.on('error',()=>{if(S.net===n)onStatus('Could not reach the game server.')});
}
/** Find a random opponent: the lobby pairs two waiting players and gives them a room code. */
export function quickMatch(){
  netClose();$('codeShow').textContent='';onStatus('Connecting…');
  const c=wsConn(SERVER_URL+'/quick'),n={role:'lobby',conn:c};S.net=n;
  c.on('data',m=>{if(S.net!==n)return;if(m.t==='wait')onStatus('Looking for an opponent…');else if(m.t==='go'){S.net=null;c.close();onStatus('Opponent found! Starting…');joinServerRoom(m.code,'quick')}});
  c.on('close',()=>{if(S.net===n){S.net=null;onStatus('Connection lost. Try again.')}});
  c.on('error',()=>{if(S.net===n)onStatus('Could not reach the game server.')});
}
export function myTeam(){return S.net&&S.net.role==='guest'?(S.net.team??1):0}
export function netSend(o){if(S.net&&S.net.conn&&S.net.conn.open)try{S.net.conn.send(o)}catch(e){}}
export function onStatus(t){$('onStatus').textContent=t}
export function loadPeer(cb){if(window.Peer)return cb();const sc=document.createElement('script');sc.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';sc.onload=cb;sc.onerror=()=>onStatus('Could not load the networking library. Check your connection.');document.head.appendChild(sc)}
export function mkCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ';let c='';for(let i=0;i<4;i++)c+=A[Math.floor(Math.random()*A.length)];return c}
export function netClose(){if(!S.net)return;netSend({t:'bye'});const n=S.net;S.net=null;setTimeout(()=>{try{n.conn&&n.conn.close()}catch(e){}try{n.peer&&n.peer.destroy()}catch(e){}},150)}
export function handleLeft(){if(!S.net)return;const n=S.net;S.net=null;try{n.peer&&n.peer.destroy()}catch(e){}try{n.conn&&n.conn.close()}catch(e){}
  if(!S.demo){S.paused=true;$('msgBig').textContent='RIVAL LEFT';$('msgSmall').textContent='back to menu…';$('msg').classList.add('show');setTimeout(()=>{$('msg').classList.remove('show');toMenu()},2200)}
  else{$('codeShow').textContent='';onStatus('Connection closed.')}}
export function bindConn(c){c.on('data',onNet);c.on('close',()=>{if(S.net&&S.net.conn===c)handleLeft()});c.on('error',()=>{})}
export function hostGame(){
  if(useServer()){const code=mkCode();joinServerRoom(code,'create');$('codeShow').textContent=code;onStatus('Opening a room…');return}
  netClose();$('codeShow').textContent='';onStatus('Opening a room…');
  loadPeer(()=>{const code=mkCode();const peer=new Peer(NET_PREFIX+code);
    const n={role:'host',peer,conn:null,remoteIn:{mx:0,my:0},fx:[],code,sendT:0,guestStyle:'allround'};S.net=n;
    peer.on('open',()=>{if(S.net!==n)return;$('codeShow').textContent=code;onStatus('Share this code. Waiting for your rival…')});
    peer.on('connection',c=>{if(S.net!==n)return;if(n.conn){c.on('open',()=>{c.send({t:'full'});setTimeout(()=>c.close(),300)});return}n.conn=c;bindConn(c);c.on('open',()=>onStatus('Rival connected! Starting…'))});
    peer.on('error',e=>{if(S.net!==n)return;if(e.type==='unavailable-id'){S.net=null;try{peer.destroy()}catch(_){}hostGame()}else onStatus('Network error: '+e.type)});
  })}
export function joinGame(){
  const code=$('codeIn').value.trim().toUpperCase();if(!/^[A-Z]{4}$/.test(code)){onStatus('Enter the 4-letter code.');return}
  if(useServer()){$('codeShow').textContent='';onStatus('Joining '+code+'…');joinServerRoom(code,'join');return}
  netClose();$('codeShow').textContent='';onStatus('Joining '+code+'…');
  loadPeer(()=>{const peer=new Peer();const n={role:'guest',peer,conn:null,inp:{mx:9,my:9},inT:0,snap:null,snapAt:0,hk:''};S.net=n;
    peer.on('open',()=>{if(S.net!==n)return;const c=peer.connect(NET_PREFIX+code,{reliable:true,serialization:'json'});n.conn=c;bindConn(c);
      c.on('open',()=>{c.send({t:'hello',style:settings.style,look:S.myLookData});onStatus('Connected! Waiting for host…')})});
    peer.on('error',e=>{if(S.net!==n)return;onStatus(e.type==='peer-unavailable'?'No game found with code '+code+'.':'Network error: '+e.type)});
  })}
export function startOnline(){showGameUI();newMatch(false);netSend({t:'start',styles:[settings.style,S.net.guestStyle],looks:[S.myLookData,S.net.guestLook],loc:settings.loc,games:settings.games})}
export function onNet(m){
  if(!S.net||!m)return;
  if(S.net.role==='host'){
    if(m.t==='hello'){S.net.guestStyle=STYLES[m.style]?m.style:'allround';S.net.guestLook=m.look?cleanLook(m.look):null;startOnline();return}
    if(m.t==='bye'){handleLeft();return}
    if(m.t==='again'){if(S.state==='over')startOnline();return}
    const p=S.players.find(q=>q.ctrl==='net');if(!p||S.demo)return;
    if(m.t==='m'){S.net.remoteIn={mx:Math.max(-1,Math.min(1,+m.mx||0)),my:Math.max(-1,Math.min(1,+m.my||0))}}
    else if(m.t==='d'&&(m.a==='drive'||m.a==='lob'))startCharge(p,m.a);
    else if(m.t==='u'){if(p.charging===m.a)releaseCharge(p)}
    else if(m.t==='v')tryVibora(p);
  }else{
    if(m.t==='start'){if(m.team===0||m.team===1)S.net.team=m.team;settings.games=m.games;S.net.styles=m.styles;S.net.looks=Array.isArray(m.looks)?m.looks:[];if(LOCS[m.loc])setLoc(m.loc);S.net.snap=null;S.net.hk='';showGameUI();newMatch(false)}
    else if(m.t==='s'){if(!S.demo)applySnap(m)}
    else if(m.t==='msg')showMsg(m.b,m.s);
    else if(m.t==='hide')$('msg').classList.remove('show');
    else if(m.t==='pt'){for(const sp of S.spectators)sp.cheer=1.6;mascotReact();sfx(m.w===myTeam()?'point':'lose')}
    else if(m.t==='end'){S.score=S.net.snap?S.net.snap.sc:S.score;showEnd()}
    else if(m.t==='full')onStatus('That room is already full.');
    else if(m.t==='joined'){if(S.net.mode==='create')onStatus('Share this code. Waiting for your rival…');else onStatus('Connected! Starting…')}
    else if(m.t==='nogame'){onStatus('No game found with code '+S.net.code+'.');netClose()}
    else if(m.t==='bye')handleLeft();
  }
}
export function applySnap(m){
  S.net.snap=m;S.net.snapAt=performance.now();if(S.state!=='over')S.state=m.st;
  const b=m.b;S.ball.x=b[0];S.ball.y=b[1];S.ball.z=b[2];S.ball.vx=b[3];S.ball.vy=b[4];S.ball.vz=b[5];S.ball.held=!!b[6];S.ball.out=!!b[7];S.ball.vib=!!b[8];S.ball.spin=b[9];
  m.P.forEach((a,i)=>{const p=S.players[i];if(!p)return;p.x=a[0];p.y=a[1];p.vx=a[2];p.vy=a[3];p.swingT=a[4];p.swingType=a[5];p.flip=!!a[6];p.anim=a[7];p.energy=a[8];p.charging=a[9]||null;p.charge=a[10];p.serveAim=a[11]});
  S.score=m.sc;S.R0=S.R0||{};S.R0.server=S.players[m.r[0]]||S.players[0];S.R0.boxX=m.r[1];S.R0.serve=!!m.r[2];
  S.marker=m.mk;S.floatTxt=m.ft;S.floats=m.fl||[];if(m.sh>S.shake)S.shake=m.sh;
  for(const x of m.fx||[])sfx(x[0],x[1]);
  const k=JSON.stringify(S.score);if(k!==S.net.hk){S.net.hk=k;updateHud()}
}
export function guestTick(dt){
  S.time+=dt;if(S.shake>0)S.shake-=dt;for(const sp of S.spectators)if(sp.cheer>0)sp.cheer-=dt;
  const m=S.net.snap;
  if(m){const t=Math.min(0.07,(performance.now()-S.net.snapAt)/1000),b=m.b;
    if(!b[6]&&m.st!=='serve'){S.ball.x=b[0]+b[3]*t;S.ball.y=b[1]+b[4]*t;S.ball.z=Math.max(0,b[2]+b[5]*t-0.5*G*t*t)}
    m.P.forEach((a,i)=>{const p=S.players[i];if(p){p.x=a[0]+a[2]*t;p.y=a[1]+a[3]*t}})}
  const me=S.players.find(q=>q.ctrl==='h1');
  if(me){const i=inputOf(me),mx=Math.round(i.mx*100)/100,my=Math.round(i.my*100)/100;S.net.inT-=dt;
    if(mx!==S.net.inp.mx||my!==S.net.inp.my||S.net.inT<=0){S.net.inp={mx,my};S.net.inT=0.3;netSend({t:'m',mx,my})}}
  if(S.score)updateEnergy();
}

/** One-time side effects (DOM wiring, saved settings). Called from main.js. */
export function setup(){
  $('hostBtn').onclick=()=>{initAudio();hostGame()};
  if(useServer()){$('quickBtn').hidden=false;$('quickBtn').onclick=()=>{initAudio();quickMatch()}}
  $('joinBtn').onclick=()=>{initAudio();joinGame()};
  $('codeIn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')joinGame()});
  $('codeIn').addEventListener('keyup',e=>e.stopPropagation());
  $('onBack').onclick=()=>{netClose();$('online').hidden=true;$('menu').hidden=false};
}
