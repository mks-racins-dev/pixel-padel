// Match drama, client only (never touches the simulation): match/set point banners with a
// heartbeat and a hushed crowd, a rally counter that builds the crowd up, a standing wave
// after long rallies, and confetti for a win.
import { S } from '../state.js';
import { R, P, txt, txtW } from '../core/gfx.js';
import { burst, zoomIn } from './fx.ts';
import { tone } from '../audio/sfx.js';

const D = { banner: '', bannerT: 0, beatT: 0, lastHits: 0, lastState: '', rally: 0, rallyPeak: 0, waveT: -1 };

/** 'MATCH POINT' / 'GAME POINT' for whoever is one point from it, or ''. */
export function pointDrama(score: { pts: number[]; games: number[] }, toWin: number): string {
  const { pts, games } = score;
  for (const t of [0, 1]) {
    const o = 1 - t, gp = pts[t] === 3 && pts[o] <= 3; // 40 vs anything, or golden point at 40-40
    if (gp && games[t] === toWin - 1) return 'MATCH POINT';
  }
  return pts[0] === 3 && pts[1] === 3 ? 'GOLDEN POINT' : '';
}

function beat() { if (!S.AC || S.muted) return; try { tone('sine', 70, 45, 0.12, 0.35); tone('sine', 62, 40, 0.14, 0.28, 0.16) } catch (e) {} }

/** Called every frame from the main loop. */
export function updateDrama(dt: number, toWin: number) {
  if (S.demo || !S.score) { D.banner = ''; S.hush = false; return }
  const ch = (S as any).chase; if (S.state === 'chase' && ch) zoomIn(0.07, 0.25, S.ball as any);
  const st = S.state as string;
  // a new point is being served: check for match / golden point
  if (st === 'serve' && D.lastState !== 'serve') {
    const b = pointDrama(S.score, toWin);
    D.banner = b; D.bannerT = b ? 2.2 : 0; D.rally = 0; D.rallyPeak = 0; D.lastHits = 0;
  }
  // the point ended: long rallies get a standing wave
  if (D.lastState === 'play' && st !== 'play') { if (D.rallyPeak >= 10) D.waveT = 0; S.hush = false }
  D.lastState = st;
  const tense = D.banner === 'MATCH POINT' && (st === 'serve' || st === 'play');
  S.hush = tense;
  if (tense) { D.beatT -= dt; if (D.beatT <= 0) { beat(); D.beatT = 0.85 - Math.min(0.35, D.rally * 0.03) } }
  if (D.bannerT > 0) D.bannerT -= dt;
  // rally counter from the shot count of this point
  const hits = ((S as any).R0 && (S as any).R0.hits) || 0;
  if (st === 'play' && hits > D.lastHits) { D.rally += hits - D.lastHits; D.rallyPeak = Math.max(D.rallyPeak, D.rally);
    if (D.rally >= 6 && D.rally % 2 === 0) for (const s of S.spectators as any[]) s.cheer = Math.max(s.cheer, 0.35) }
  D.lastHits = hits;
  if (D.waveT >= 0) { D.waveT += dt; const n = S.spectators.length; S.spectators.forEach((s: any, i: number) => { const k = D.waveT * 6 - i * 0.5; if (k > 0 && k < 1.2) s.cheer = 0.3 }); if (D.waveT > n * 0.09 + 1.5) D.waveT = -1 }
}

/** Banner and rally counter, drawn over the court. */
export function drawDrama(ctx: CanvasRenderingContext2D) {
  if (S.demo) return;
  const ch = (S as any).chase;
  if (S.state === 'chase' && ch && ch.reach && /^h[1-4]$/.test(ch.p.ctrl) && Math.floor(performance.now() / 120) % 2) {
    const q = P(ch.p.x, ch.p.y, 2.6); R(ctx, q.x - 14, q.y - 12, 28, 13, '#e4572e'); txt(ctx, 'HIT!', q.x - 9, q.y - 9, '#ffffff', 2);
  }
  if (D.bannerT > 0 && D.banner) {
    const a = Math.min(1, D.bannerT * 2, (2.2 - D.bannerT) * 6), w = txtW(D.banner, 3) + 24, x = 240 - w / 2, y = 56;
    ctx.globalAlpha = a; R(ctx, x, y, w, 25, '#17131c'); R(ctx, x, y + 23, w, 2, D.banner === 'MATCH POINT' ? '#e4572e' : '#f2c14e');
    txt(ctx, D.banner, x + 12, y + 5, D.banner === 'MATCH POINT' ? '#ff8a5c' : '#f2c14e', 3); ctx.globalAlpha = 1;
  }
  if (S.state === 'play' && D.rally >= 5) {
    const s = 'RALLY ' + D.rally, big = D.rally >= 10, sc = big ? 2 : 1, w = txtW(s, sc);
    R(ctx, 240 - w / 2 - 3, 30, w + 6, 5 * sc + 4, 'rgba(23,19,28,0.75)'); txt(ctx, s, 240 - w / 2, 32, big ? '#ff8a5c' : '#f4ead2', sc);
  }
  if (S.hush) { ctx.fillStyle = 'rgba(10,8,16,0.12)'; ctx.fillRect(0, 0, 480, 270) }
}


/** A shower of confetti over the court (match won). */
export function confetti() {
  for (let k = 0; k < 6; k++) burst(-4 + k * 1.6, -2 + Math.random() * 6, 6, 22, ['#e4572e', '#f2c14e', '#3fa7a8', '#ff6ad5', '#9be37a', '#ffffff'], 3, 0.5, 2.2, 2.6);
}
