import { S } from '../state.js';
import { $ } from '../core/gfx.js';
import { mkLook } from '../game/player.js';
import { getSprite } from '../render/sprites.js';

export const prevG=$('prevC').getContext('2d');
export function drawPreview(){
  if($('menu').hidden||document.querySelector('#menu .mp[data-p="player"]').hidden)return;
  const lk=mkLook(S.myLookData),front=Math.floor(S.time/1.8)%2===0,img=getSprite(lk,front?'front':'back','idle',0);
  prevG.clearRect(0,0,24,30);
  if(front!==(lk.hand==='left')){prevG.save();prevG.translate(24,0);prevG.scale(-1,1);prevG.drawImage(img,0,0);prevG.restore()}else prevG.drawImage(img,0,0)}
