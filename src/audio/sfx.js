import { S } from '../state.js';

export function initAudio(){try{if(!S.AC){S.AC=new(window.AudioContext||window.webkitAudioContext)();S.noiseBuf=S.AC.createBuffer(1,S.AC.sampleRate*0.3,S.AC.sampleRate);const d=S.noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}if(S.AC.state==='suspended')S.AC.resume()}catch(e){S.AC=null}}
export function tone(type,f0,f1,dur,vol,delay){const t=S.AC.currentTime+(delay||0);const o=S.AC.createOscillator(),g=S.AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g).connect(S.AC.destination);o.start(t);o.stop(t+dur+0.02)}
export function noise(dur,vol,freq,q){const t=S.AC.currentTime;const s=S.AC.createBufferSource();s.buffer=S.noiseBuf;const f=S.AC.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q||1;const g=S.AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(f).connect(g).connect(S.AC.destination);s.start(t);s.stop(t+dur)}
export function sfx(k,v){if(S.net&&S.net.role==='host'&&!S.demo&&k!=='point'&&k!=='lose'&&k!=='win')S.net.fx.push([k,v==null?1:v]);if(!S.AC||S.muted||S.demo)return;v=v==null?1:v;try{
  if(k==='hit'){tone('triangle',320,120,0.09,0.35*v);noise(0.05,0.25*v,2400,0.8)}
  else if(k==='smash'){tone('square',260,80,0.14,0.22);noise(0.09,0.4,1800,0.6)}
  else if(k==='vibora'){tone('sawtooth',520,140,0.18,0.18);noise(0.14,0.45,2600,0.5);tone('square',990,990,0.06,0.07,0.05)}
  else if(k==='bounce'){tone('sine',170,90,0.07,0.3*v)}
  else if(k==='glass'){tone('triangle',1100,700,0.06,0.12*v);noise(0.08,0.2*v,4200,2)}
  else if(k==='mesh'){noise(0.12,0.25*v,900,0.7)}
  else if(k==='net'){noise(0.1,0.25,500,0.6)}
  else if(k==='point'){tone('square',660,660,0.08,0.08);tone('square',880,880,0.12,0.08,0.09)}
  else if(k==='lose'){tone('square',330,330,0.08,0.07);tone('square',247,247,0.14,0.07,0.09)}
  else if(k==='win'){[523,659,784,1046].forEach((f,i)=>tone('square',f,f,0.12,0.08,i*0.11))}
}catch(e){}}
