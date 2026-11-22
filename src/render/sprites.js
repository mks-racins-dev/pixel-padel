import { R, newCanvas, shade } from '../core/gfx.js';

/* ---------------- sprites ---------------- */
export { LOOKS } from '../content/looks.js';
export const sprCache={};
export function getSprite(look,view,pose,leg){
  const key=look.id+view+pose+leg;if(sprCache[key])return sprCache[key];
  const[c,g]=newCanvas(24,30);const r=(x,y,w,h,col)=>R(g,x,y,w,h,col);
  const sk=look.skin,skD=shade(sk,-28),sh=look.shirt,shD=shade(sh,-38),shL=shade(sh,28),so=look.shorts,soD=shade(so,-30);
  const back=view==='back';
  // legs
  const lUp=leg===1?1:0,rUp=leg===2?1:0;
  r(9,20-lUp,2,6,sk);r(9,20-lUp,1,6,skD);r(13,20-rUp,2,6,sk);r(14,20-rUp,1,6,skD);
  r(9,25-lUp,2,2,'#f2f2ee');r(13,25-rUp,2,2,'#f2f2ee');
  r(8,27-lUp,4,2,look.shoe||'#f4f4f0');r(8,28-lUp,4,1,'#3a3540');r(12,27-rUp,4,2,look.shoe||'#f4f4f0');r(12,28-rUp,4,1,'#3a3540');
  r(back?8:10,27-lUp,1,1,look.frame);r(back?15:13,27-rUp,1,1,look.frame);
  // shorts / skirt
  if(look.skirt){r(7,17,10,4,so);r(7,20,10,1,soD);r(8,17,1,3,shade(so,20))}else{r(8,17,8,4,so);r(8,20,3,1,soD);r(13,20,3,1,soD);r(11,18,2,3,soD)}
  // torso
  r(8,9,8,8,sh);r(8,9,1,8,shL);r(15,9,1,8,shD);r(8,16,8,1,shD);
  r(9,12,6,1,shade(sh,-18));
  if(back){r(11,9,2,1,shD);r(11,11,2,3,shL)}else{r(11,9,2,2,sk);r(11,11,1,1,skD)}
  r(7,9,1,2,sh);r(16,9,1,2,sh);
  // left arm
  r(7,11,1,5,sk);r(7,16,1,1,skD);
  // right arm + racket by pose
  const fr=look.frame,face='#26222c',hole='#4a4452',grip='#f4ead2',hd='#1d1a24';
  const racket=(x,y)=>{r(x+1,y,3,1,fr);r(x,y+1,5,4,fr);r(x+1,y+5,3,1,fr);r(x+1,y+1,3,4,face);r(x+1,y+1,1,1,hole);r(x+3,y+2,1,1,hole);r(x+2,y+3,1,1,hole);r(x+1,y+4,1,1,hole);r(x+3,y+4,1,1,hole)};
  if(pose==='idle'){r(16,11,1,5,sk);r(16,16,1,1,skD);r(17,16,1,2,hd);r(17,15,1,1,grip);racket(16,18)}
  else if(pose==='back'){r(16,7,1,4,sk);r(17,6,1,1,skD);r(18,5,1,2,hd);racket(17,0)}
  else{r(9,11,7,1,sk);r(8,11,1,1,skD);r(6,11,2,1,hd);racket(1,8)}
  // neck & head
  r(11,8,2,1,skD);
  r(9,2,6,6,sk);r(10,7,4,1,sk);r(14,3,1,4,skD);
  if(back){r(9,1,6,5,look.hair);r(10,0,4,1,look.hair);r(9,5,1,1,sk);r(14,5,1,1,skD);r(10,6,4,1,look.hair);r(10,1,2,1,shade(look.hair,25))}
  else{r(9,1,6,2,look.hair);r(10,0,4,1,look.hair);r(9,3,1,2,look.hair);r(14,3,1,2,look.hair);r(10,1,2,1,shade(look.hair,25));r(10,5,1,1,'#2a1e1e');r(13,5,1,1,'#2a1e1e');r(11,7,2,1,skD);r(9,6,1,1,shade(sk,-12))}
  if(look.band){r(9,3,6,1,look.band)}
  if(look.tail){if(back){r(11,6,2,4,look.hair);r(11,10,2,1,shade(look.hair,-15))}else{r(15,3,1,4,look.hair);r(16,5,1,2,look.hair)}}
  // outline
  const id=g.getImageData(0,0,24,30),d=id.data,o=new Uint8ClampedArray(d);
  for(let y=0;y<30;y++)for(let x=0;x<24;x++){const i=(y*24+x)*4;if(d[i+3])continue;let n=false;for(const[ax,ay]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+ax,Y=y+ay;if(X<0||Y<0||X>=24||Y>=30)continue;if(d[(Y*24+X)*4+3]){n=true;break}}if(n){o[i]=23;o[i+1]=19;o[i+2]=28;o[i+3]=255}}
  g.putImageData(new ImageData(o,24,30),0,0);
  sprCache[key]=c;return c;
}
/* ---------------- venue mascots ---------------- */
export const K='#1c1a22';
