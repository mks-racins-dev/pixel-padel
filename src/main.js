// pixel fonts ship with the game (no Google Fonts request, works offline)
import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import '@fontsource/pixelify-sans';
import './style.css';
import './sim/clientHooks.js';
import { simTime, updateFx } from './render/fx.ts';
import { pollPads } from './input/input.js';
import { startSession } from './core/analytics.ts';
import { SERVER_URL } from './net/online.js';
import { initAccount, onAccountChange } from './net/account.ts';
import { renderMenu } from './ui/menu.js';
import { S } from './state.js';
import { curLoc } from './content/venues.js';
import { $, H, W, mulberry } from './core/gfx.js';
import { newMatch } from './game/rules.js';
import { STEP, update } from './game/update.js';
import { guestTick, mkSnap, netSend } from './net/online.js';
import { updMascot } from './render/mascot.js';
import { render } from './render/render.js';
import { buildBg, buildFront, buildNet } from './render/venue.js';
import { setCrowd } from './render/grades.js';
import { updateDrama } from './render/drama.ts';
import { matchGames } from './game/rules.js';
import { drawPreview } from './ui/preview.js';
import { setHelp } from './ui/ui.js';
import { setup as setupCoreGfx } from './core/gfx.js';
import { setup as setupGameSettings } from './game/settings.js';
import { setLoc, settings } from './game/settings.js';
import { setupOptions } from './ui/options.js';
import { setLang } from './ui/i18n.js';
import { OPTS } from './game/opts.js';
import { drawHelp } from './ui/help.js';
import { playMusic, nextStation } from './audio/music.js';
import { initAudio as initAudio2 } from './audio/sfx.js';
import { setup as setupGamePlayer } from './game/player.js';
import { setup as setupInputInput } from './input/input.js';
import { setup as setupUiUi } from './ui/ui.js';
import { setup as setupNetOnline } from './net/online.js';

startSession();
if (SERVER_URL) { onAccountChange(renderMenu); initAccount(SERVER_URL) }

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
if(curLoc().street)S.grade=settings.loc==='ware'?3:1;
S.BG=buildBg();
S.NET=buildNet();
$('sub').textContent=curLoc().sub+' · glass walls in play';
S.FRONT=buildFront();
S.rnd=mulberry(5);
setCrowd(S.grade);
setupOptions();
setLang(OPTS.lang);
setHelp();
newMatch(true);
// browsers only allow sound after a click or key press: start the audio (and the menu music) then
for(const ev of['pointerdown','keydown'])addEventListener(ev,()=>initAudio2(),{once:true,capture:true});
S.last=performance.now();
export function frame(now){const dt=Math.min(0.05,(now-S.last)/1000);S.last=now;
  if(S.net&&S.net.role==='guest'&&!S.demo)guestTick(dt);
  else if((!S.paused||(S.net&&!S.demo))&&S.state!=='over'){S.acc+=simTime(dt);while(S.acc>=STEP){update(STEP);S.acc-=STEP}}
  if(S.net&&S.net.role==='host'&&!S.demo&&S.net.conn&&S.net.conn.open){S.net.sendT-=dt;if(S.net.sendT<=0){S.net.sendT=1/30;netSend(mkSnap())}}
  pollPads();updMascot(dt);updateFx(dt);updateDrama(dt,matchGames());render();drawPreview();drawHelp();playMusic(!$('menu').hidden?'menu':!S.demo&&S.state!=='over'&&!S.paused?'match':'none');requestAnimationFrame(frame)}
requestAnimationFrame(frame);
// dev only: ?grade=7&loc=es shows that court grade without the menu (for checking the look)
if(import.meta.env.DEV){const q=new URLSearchParams(location.search);if(q.has('grade')){setLoc(q.get('loc')||settings.loc,+q.get('grade'));$('menu').hidden=true}}
// dev only: ?cine=plane plays that story scene (for checking cutscenes)
if(import.meta.env.DEV){const q=new URLSearchParams(location.search);if(q.has('cine'))Promise.all([import('./content/story.js'),import('./content/staging.js'),import('./render/cine.js'),import('./game/player.js')]).then(([st,sg,ci,pl])=>{const s=st.SCENES.find(x=>x.id===q.get('cine'));ci.playCine(sg.storyCine(s,{won:['a1_tomi','a1_king','b_riga3','b_vil2','e_min3','e_mos3','p_mad3','p_mia2','p_fin'],seen:[]},pl.mkLook(S.myLookData)))})}
// dev only: ?panel=quick opens a menu panel, ?play=1v1 starts a quick match (for screenshots)
if(import.meta.env.DEV){const q=new URLSearchParams(location.search);
  if(q.has('panel'))import('./ui/menu.js').then(m=>{if(q.get('mode'))settings.mode=q.get('mode');m.showPanel(q.get('panel'))});
  if(q.has('play'))import('./ui/ui.js').then(u=>{settings.mode=q.get('play');if(q.get('loc'))setLoc(q.get('loc'),+(q.get('g')||0));u.startGame()})}
// M switches the radio station (not while typing a name or remapping keys)
addEventListener('keydown',e=>{if(e.code!=='KeyM'||e.repeat)return;const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;initAudio2();nextStation(e.shiftKey?-1:1)});
