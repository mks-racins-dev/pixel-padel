// Glicko-2 skill rating (Mark Glickman, http://www.glicko.net/glicko/glicko2.pdf).
// Each ranked match is treated as its own rating period with one game.
// Ratings are shown on the familiar 1500 scale; internally Glicko-2 uses a scaled version.

export interface Rating { r: number; rd: number; vol: number }

export const DEFAULT: Rating = { r: 1500, rd: 350, vol: 0.06 };
const TAU = 0.5;          // how fast volatility can change
const SCALE = 173.7178;
const MIN_RD = 30, MAX_RD = 350;

const g = (phi: number) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
const E = (mu: number, muJ: number, phiJ: number) => 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));

/** New rating for `p` after one game against `opp`. score: 1 win, 0 loss, 0.5 draw. */
export function rate(p: Rating, opp: Rating, score: number): Rating { return rateMany(p, [{ opp, score }]) }

/** New rating after a rating period with several games (steps 3–8 of the paper). */
export function rateMany(p: Rating, games: { opp: Rating; score: number }[], round = true): Rating {
  const mu = (p.r - 1500) / SCALE, phi = p.rd / SCALE;
  let vInv = 0, sum = 0;
  for (const { opp, score } of games) {
    const muJ = (opp.r - 1500) / SCALE, phiJ = opp.rd / SCALE, gJ = g(phiJ), e = E(mu, muJ, phiJ);
    vInv += gJ * gJ * e * (1 - e);
    sum += gJ * (score - e);
  }
  const v = 1 / vInv;
  const delta = v * sum;

  // new volatility (Illinois algorithm, step 5)
  const a = Math.log(p.vol * p.vol);
  const f = (x: number) => {
    const ex = Math.exp(x), d = phi * phi + v + ex;
    return (ex * (delta * delta - phi * phi - v - ex)) / (2 * d * d) - (x - a) / (TAU * TAU);
  };
  let A = a, B: number;
  if (delta * delta > phi * phi + v) B = Math.log(delta * delta - phi * phi - v);
  else { let k = 1; while (f(a - k * TAU) < 0) k++; B = a - k * TAU }
  let fA = f(A), fB = f(B);
  for (let i = 0; i < 100 && Math.abs(B - A) > 1e-6; i++) {
    const C = A + ((A - B) * fA) / (fB - fA), fC = f(C);
    if (fC * fB <= 0) { A = B; fA = fB } else fA /= 2;
    B = C; fB = fC;
  }
  const vol = Math.exp(A / 2);

  const phiStar = Math.sqrt(phi * phi + vol * vol);
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const muNew = mu + phiNew * phiNew * sum;
  const r = muNew * SCALE + 1500, rd = phiNew * SCALE;
  if (!round) return { r, rd, vol };
  return { r: Math.round(r * 10) / 10, rd: Math.max(MIN_RD, Math.min(MAX_RD, Math.round(rd * 10) / 10)), vol };
}

/** Updates both players after a match. Returns [winner, loser]. */
export function rateMatch(winner: Rating, loser: Rating): [Rating, Rating] {
  return [rate(winner, loser, 1), rate(loser, winner, 0)];
}

/** Season id from a date: one season per calendar month (UTC), e.g. "2026-12". */
export function seasonOf(t: number): string { const d = new Date(t); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') }
