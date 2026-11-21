// The state a host or game server sends to players about 30 times a second.
import { S } from '../state.js';

export const r3=v=>Math.round(v*1000)/1000;
export function mkSnap(){return{t:'s',st:S.state,b:[r3(S.ball.x),r3(S.ball.y),r3(S.ball.z),r3(S.ball.vx),r3(S.ball.vy),r3(S.ball.vz),S.ball.held?1:0,S.ball.out?1:0,S.ball.vib?1:0,S.ball.spin||0],
  P:S.players.map(p=>[r3(p.x),r3(p.y),r3(p.vx),r3(p.vy),r3(p.swingT),p.swingType,p.flip?1:0,r3(p.anim),Math.round(p.energy),p.charging||0,r3(p.charge),r3(p.serveAim)]),
  sc:S.score,r:[S.players.indexOf(S.R0.server),S.R0.boxX,S.R0.serve?1:0],mk:S.marker,ft:S.floatTxt,fl:S.floats,sh:r3(Math.max(0,S.shake)),fx:S.net&&S.net.fx?S.net.fx.splice(0):[]}}
