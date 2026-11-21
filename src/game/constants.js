import { rand } from '../core/rng.ts';


/* ---------------- court constants ---------------- */
export const G=9.8,NET_H=0.88,NET_POST=0.92,SVC=6.95,HW=5,HL=10,BACK_H=4,BACK_GLASS=3,SIDE_H=3;
export const REACH=1.25,SPEED_H=5.3;
export const STYLES={allround:{name:'ALL-ROUND',spd:4,pow:3,acc:3},speed:{name:'SPEEDSTER',spd:5,pow:2,acc:3},power:{name:'POWER',spd:3,pow:5,acc:2},sniper:{name:'SNIPER',spd:3,pow:2,acc:5}};
export function sweet(p){return 0.58+0.07*p.sk.acc}
/* perfect-power line on the charge bar */
export function movK(p){return 0.82+0.07*p.sk.spd}
export function powK(p){return 0.8+0.08*p.sk.pow}
export function overhit(p,power){const sw=sweet(p);if(power<=sw+0.005)return false;const o=(power-sw)/(1-sw);return rand()<o*(0.8-0.1*p.sk.acc)}
export const DIFF={easy:{spd:3.9,err:1.25,react:0.32,volley:false,miss:0.14},normal:{spd:4.7,err:0.75,react:0.18,volley:true,miss:0.05},hard:{spd:5.5,err:0.4,react:0.08,volley:true,miss:0.01}};
