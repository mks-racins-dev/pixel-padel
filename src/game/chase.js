// Out-of-court play: a ball that bounces and then flies out over the side fence can still be
// returned. The closest defender sprints out through the door next to the net and hits it back
// over the fence before it bounces twice outside. Part of the shared simulation (deterministic).
import { H } from '../sim/hooks.js';
import { rand } from '../core/rng.ts';
import { S } from '../state.js';
import { HW, SPEED_H, movK } from './constants.js';
import { stepBall } from './physics.js';
import { endPoint, launch, isHuman, teamOf, diffOf } from './rules.js';

const DOOR_Y = 1.6; // doors are in the side walls, just either side of the net

/** Where and when the ball lands outside, and when it would bounce twice. */
function predictOutside(b0) {
  const b = { ...b0, out: true }; let t = 0, land = null, n = 0;
  for (let i = 0; i < 600; i++) { t += 1 / 120; stepBall(b, 1 / 120, ty => { if (ty === 'floor' || ty === 'roll') { n++; if (n === 1) land = { x: b.x, y: b.y, t } } }); if (n >= 2) return { land, t2: t } }
  return land ? { land, t2: t } : null;
}
const speedOf = p => (isHuman(p) ? SPEED_H : diffOf(p).spd) * movK(p) * 1.08; // a sprint
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Called when the ball leaves the cage after a bounce. Returns true if a chase starts. */
export function tryChase() {
  const r = S.R0, b = S.ball;
  if (r.serve || Math.abs(b.x) <= HW - 0.01 || S.demo) return false; // only out over a side fence
  const team = 1 - r.lastTeam, side = team === 0 ? -1 : 1;
  const pr = predictOutside(b); if (!pr) return false;
  const door = { x: Math.sign(b.x) * (HW + 0.4), y: side * DOOR_Y };
  const p = teamOf(team).slice().sort((u, v) => dist(u, door) - dist(v, door))[0];
  const need = (dist(p, door) + dist(door, pr.land)) / speedOf(p);
  if (need > pr.t2 - 0.15) return false; // too far: the point ends as before
  S.chase = { p, team, door, stage: 0, bounces: 0, ok: false, reach: false };
  S.state = 'chase'; p.outside = true; p.swingReq = null;
  H.showMsg('OUT OF THE CAGE!', isHuman(p) ? 'RUN! PRESS HIT WHEN IT DROPS' : 'THE CHASE IS ON!');
  return true;
}

/** One simulation step of a chase (called from update while S.state === 'chase'). */
export function stepChase(dt) {
  const c = S.chase, p = c.p, b = S.ball;
  stepBall(b, dt, ty => { if (ty === 'floor' || ty === 'roll') { c.bounces++; H.sfx('bounce', 0.6) } });
  if (c.bounces >= 2) return lose();
  // run: to the door, then to the ball
  const tgt = c.stage === 0 ? c.door : { x: b.x, y: b.y };
  if (c.stage === 0 && dist(p, c.door) < 0.3) c.stage = 1;
  const d = dist(p, tgt), v = Math.min(speedOf(p), d * 8);
  p.vx = d > 0.05 ? (tgt.x - p.x) / d * v : 0; p.vy = d > 0.05 ? (tgt.y - p.y) / d * v : 0;
  p.x += p.vx * dt; p.y += p.vy * dt; p.anim += dt * Math.hypot(p.vx, p.vy) * 2.2; p.flip = b.x < p.x;
  // in reach once outside, near the ball, and it is dropping after the outside bounce
  c.reach = c.stage === 1 && dist(p, b) < 1.1 && b.z < 1.7 && c.bounces >= 1;
  if (!c.reach) return;
  if (isHuman(p)) { if (p.swingReq) { p.swingReq = null; hitBack() } }
  else if (!c.tried) { c.tried = true; if (rand() < 0.55 + 0.25 * (p.sk?.acc || 3) / 5) hitBack(); else c.whiff = true }
}

function hitBack() {
  const c = S.chase, p = c.p, b = S.ball, opp = c.team === 0 ? 1 : -1;
  p.swingT = 0.3; p.swingType = 'lob'; p.hitDone = true;
  launch((rand() - 0.5) * 6, opp * (4 + rand() * 4), 10, 5.2); // high over the fence, deep into their court
  b.ext = true; // outside the cage: walls are ignored until the ball is back inside
  const r = S.R0; r.lastTeam = c.team; r.bounces = 0; r.hits++; r.net = false; r.backWall = -1; r.chased = true;
  S.state = 'play'; S.chase = null; p.ret = true;
  H.hideMsg(); H.sfx('smash'); H.slowMo(0.6, 0.35);
  S.floats.push({ x: p.x, y: p.y, t: 1.3, text: 'FROM OUTSIDE!', c: '#ff8a5c' });
}
function lose() {
  const c = S.chase; S.chase = null; S.state = 'play'; c.p.ret = true;
  endPoint(1 - c.team, S.ball.porTres ? 'POR TRES!' : 'OUT OF THE CAGE!');
}

/** A player who went outside walks back in through the door before normal movement resumes. */
export function stepReturn(p, dt) {
  const side = p.team === 0 ? -1 : 1, inside = Math.abs(p.x) < HW - 0.3;
  if (inside) { p.ret = false; p.outside = false; return false }
  const tgt = Math.abs(p.y - side * DOOR_Y) > 0.3 ? { x: Math.sign(p.x) * (HW + 0.4), y: side * DOOR_Y } : { x: Math.sign(p.x) * (HW - 1), y: side * DOOR_Y };
  const d = dist(p, tgt), v = speedOf(p);
  p.vx = (tgt.x - p.x) / (d || 1) * v; p.vy = (tgt.y - p.y) / (d || 1) * v;
  p.x += p.vx * dt; p.y += p.vy * dt; p.anim += dt * v * 2.2;
  return true;
}
