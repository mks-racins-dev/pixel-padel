import './style.css';
import { simTime, updateFx } from './render/fx.ts';
import { pollPads } from './input/input.js';
import { startSession } from './core/analytics.ts';
import { S } from './state.js';
import { curLoc } from './content/venues.js';
import { $, H, W, mulberry } from './core/gfx.js';
import { newMatch } from './game/rules.js';
import { STEP, update } from './game/update.js';
import { guestTick, mkSnap, netSend } from './net/online.js';
import { updMascot } from './render/mascot.js';
import { render } from './render/render.js';
import { buildBg, buildFront, buildNet } from './render/venue.js';
import { drawPreview } from './ui/preview.js';
import { setHelp } from './ui/ui.js';
import { setup as setupCoreGfx } from './core/gfx.js';
import { setup as setupGameSettings } from './game/settings.js';
import { setup as setupGamePlayer } from './game/player.js';
import { setup as setupInputInput } from './input/input.js';
import { setup as setupUiUi } from './ui/ui.js';
import { setup as setupNetOnline } from './net/online.js';

startSession();

// one-time setup of each module, in the original top-to-bottom order
setupCoreGfx();
setupGameSettings();
setupGamePlayer();
setupInputInput();
setupUiUi();
setupNetOnline();

/* ---------------- sizing & loop ---------------- */
export function fit(){const s0=Math.min(innerWidth/W,innerHeight/H);const s=s0>=2?Math.floor(s0):s0;const st=$('stage');st.style.width=W*s+'px';st.style.height=H*s+'px';document.documentElement.style.setProperty('--u',s+'px')}
addEventListener('resize',fit);
fit();
S.BG=buildBg();
S.NET=buildNet();
$('sub').textContent=curLoc().sub+' · glass walls in play';
S.FRONT=buildFront();
S.rnd=mulberry(5);
export const SPEC=[['#e86a6a','#2d2a3a','#e8b48a','#4a2c1a'],['#f4ead2','#3b5b8c','#8d5a3b','#1f1a17'],['#6fae5f','#2d2a3a','#f0c4a0','#d9b26a'],['#8e6cc1','#5a3b2c','#c98d62','#2b1d14'],['#f2c14e','#1f2a44','#e8b48a','#7a3a22'],['#3fa7a8','#2d2a3a','#b97a52','#1f1a17'],['#d98ca0','#3b5b8c','#f0c4a0','#4a2c1a']];
[[6.2,-0.45],[5.7,0.35],[3.2,-0.3],[2.7,0.4],[0.2,-0.2],[-2.6,0.3],[-3.3,-0.35]].forEach(([y,dx],i)=>{const c=SPEC[i%SPEC.length];S.spectators.push({x:-8.7+dx,y,shirt:c[0],pants:c[1],skin:c[2],hair:c[3],ph:i*1.7,cheer:0})});
setHelp();
newMatch(true);
S.last=performance.now();
export function frame(now){const dt=Math.min(0.05,(now-S.last)/1000);S.last=now;
  if(S.net&&S.net.role==='guest'&&!S.demo)guestTick(dt);
  else if((!S.paused||(S.net&&!S.demo))&&S.state!=='over'){S.acc+=simTime(dt);while(S.acc>=STEP){update(STEP);S.acc-=STEP}}
  if(S.net&&S.net.role==='host'&&!S.demo&&S.net.conn&&S.net.conn.open){S.net.sendT-=dt;if(S.net.sendT<=0){S.net.sendT=1/30;netSend(mkSnap())}}
  pollPads();updMascot(dt);updateFx(dt);render();drawPreview();requestAnimationFrame(frame)}
requestAnimationFrame(frame);
