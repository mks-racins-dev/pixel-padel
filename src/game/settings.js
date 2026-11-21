import { S } from '../state.js';
import { LOCS } from '../content/venues.js';
import { $, mulberry } from '../core/gfx.js';
import { buildBg } from '../render/venue.js';
import { press } from '../ui/ui.js';

/* ---------------- game state ---------------- */
import { settings } from './config.js';
export { settings };
export function setLoc(l){if(!LOCS[l])return;settings.loc=l;S.BG=buildBg();S.rnd=mulberry(5);$('sub').textContent=LOCS[l].sub+' · glass walls in play';document.querySelectorAll('.seg[data-key="loc"]').forEach(s=>press(s,l))}

/** One-time side effects (DOM wiring, saved settings). Called from main.js. */
export function setup(){
  try{const l=localStorage.getItem('pixelpadel-venue');if(LOCS[l])settings.loc=l}catch(e){}
}
