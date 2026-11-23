import { S } from '../state.js';
import { LOCS } from '../content/venues.js';
import { $, mulberry } from '../core/gfx.js';
import { buildBg, buildFront } from '../render/venue.js';
import { setCrowd } from '../render/grades.js';
import { press } from '../ui/ui.js';

/* ---------------- game state ---------------- */
import { settings } from './config.js';
export { settings };
/** Venue and (optionally) event grade: rebuilds the background, front glass and crowd. */
export function setLoc(l,grade=0){if(!LOCS[l])return;settings.loc=l;if(!grade)grade=LOCS[l].street?(l==='ware'?3:1):0;S.grade=grade;setCrowd(grade);S.BG=buildBg();S.FRONT=buildFront();S.rnd=mulberry(5);$('sub').textContent=LOCS[l].sub+' · glass walls in play';document.querySelectorAll('.seg[data-key="loc"]').forEach(s=>press(s,l))}

/** One-time side effects (DOM wiring, saved settings). Called from main.js. */
export function setup(){
  try{const l=localStorage.getItem('pixelpadel-venue');if(LOCS[l])settings.loc=l}catch(e){}
}
