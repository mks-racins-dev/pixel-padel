import { S } from '../state.js';
import { $ } from '../core/gfx.js';
import { mkLook } from '../game/player.js';
import { getSprite } from '../render/sprites.js';

export const prevG=$('prevC').getContext('2d');
export function drawPreview(){
  if($('menu').hidden||document.querySelector('#menu .mp[data-p="player"]').hidden)return;
  // turn around every few seconds and take a practice swing now and then
  const lk=mkLook(S.myLookData),cyc=S.time%3.6,front=Math.floor(S.time/3.6)%2===0,pose=cyc>2.9&&cyc<3.15?'back':cyc>=3.15&&cyc<3.45?'follow':'idle',img=getSprite(lk,front?'front':'back',pose,0);
  prevG.clearRect(0,0,24,30);
  if(front!==(lk.hand==='left')){prevG.save();prevG.translate(24,0);prevG.scale(-1,1);prevG.drawImage(img,0,0);prevG.restore()}else prevG.drawImage(img,0,0)}
