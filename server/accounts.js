// Guest accounts, cloud saves and the ranked ladder. Plain classes over a small storage
// interface (get / put / list), so they run on Durable Object storage in production and on
// a Map in tests.
import { DEFAULT, rateMatch, seasonOf } from '../src/meta/glicko.ts';
import { isOffensive } from './moderation.js';

export const NAME_RE = /^[A-Z0-9]{3,10}$/;
export const MAX_PROFILE_BYTES = 64 * 1024;
const CHARS = 'abcdefghijkmnpqrstuvwxyz23456789';

export function randomId(n) { return Array.from(crypto.getRandomValues(new Uint8Array(n)), b => CHARS[b % CHARS.length]).join('') }
export async function sha256hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export const cleanName = n => (typeof n === 'string' ? n.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) : '');

/** One player's account: a hashed secret token, a nickname and the saved game profile. */
export class PlayerStore {
  constructor(storage) { this.st = storage }
  async init(tokenHash, name) {
    if (await this.st.get('tokenHash')) return false;
    await this.st.put('tokenHash', tokenHash);
    await this.st.put('name', name);
    await this.st.put('created', Date.now());
    return true;
  }
  async auth(token) {
    const h = await this.st.get('tokenHash');
    return !!h && typeof token === 'string' && h === await sha256hex(token);
  }
  async get() {
    return { name: await this.st.get('name'), profile: (await this.st.get('profile')) || null, updatedAt: (await this.st.get('updatedAt')) || 0 };
  }
  /** Saves a nickname and/or profile. Returns an error string, or null when saved. */
  async put(body) {
    if (body.name !== undefined) {
      const n = cleanName(body.name);
      if (!NAME_RE.test(n)) return 'Name must be 3–10 letters or digits.';
      if (isOffensive(n)) return 'Please choose another name.';
      await this.st.put('name', n);
    }
    if (body.profile !== undefined) {
      if (!body.profile || typeof body.profile !== 'object') return 'Bad profile.';
      if (JSON.stringify(body.profile).length > MAX_PROFILE_BYTES) return 'Profile too large.';
      await this.st.put('profile', body.profile);
      await this.st.put('updatedAt', Number(body.updatedAt) || Date.now());
    }
    return null;
  }
}

/** Ranked ratings, one table per monthly season. */
export class Ladder {
  constructor(storage) { this.st = storage; this.cache = null }
  key(season, id) { return `r:${season}:${id}` }
  async row(season, id, name) {
    return (await this.st.get(this.key(season, id))) || { id, name, ...DEFAULT, w: 0, l: 0 };
  }
  /** Records a ranked match and returns each player's rating before and after. */
  async report(winner, loser, now = Date.now()) {
    if (!winner?.id || !loser?.id || winner.id === loser.id) return null;
    const season = seasonOf(now);
    const W = await this.row(season, winner.id, winner.name), L = await this.row(season, loser.id, loser.name);
    const [w2, l2] = rateMatch(W, L);
    const streak = (W.streak || 0) + 1;
    const nw = { ...W, ...w2, name: winner.name || W.name, w: W.w + 1, last: now, streak, best: Math.max(W.best || 0, streak) };
    const nl = { ...L, ...l2, name: loser.name || L.name, l: L.l + 1, last: now, streak: 0, best: L.best || 0 };
    await this.st.put(this.key(season, winner.id), nw);
    await this.st.put(this.key(season, loser.id), nl);
    this.cache = null;
    return {
      season,
      [winner.id]: { before: Math.round(W.r), after: Math.round(nw.r), won: true },
      [loser.id]: { before: Math.round(L.r), after: Math.round(nl.r), won: false },
    };
  }
  async all(season) {
    if (this.cache && this.cache.season === season && Date.now() - this.cache.at < 15000) return this.cache.rows;
    const m = await this.st.list({ prefix: `r:${season}:` });
    const rows = [...m.values()].sort((a, b) => b.r - a.r);
    this.cache = { season, at: Date.now(), rows };
    return rows;
  }
  /** The top n by 'rating', 'best' (longest win streak), 'streak' (current run) or 'wins'. */
  async top(n = 10, now = Date.now(), by = 'rating') {
    const season = seasonOf(now);
    let rows = await this.all(season);
    const key = { best: r => r.best || 0, streak: r => r.streak || 0, wins: r => r.w }[by];
    if (key) rows = rows.filter(r => key(r) > 0).sort((a, b) => key(b) - key(a) || b.r - a.r);
    return { season, by: key ? by : 'rating', players: (await this.all(season)).length, top: rows.slice(0, n).map((r, i) => ({ rank: i + 1, name: r.name, r: Math.round(r.r), rd: Math.round(r.rd), w: r.w, l: r.l, streak: r.streak || 0, best: r.best || 0 })) };
  }
  async me(id, now = Date.now()) {
    const season = seasonOf(now);
    const rows = await this.all(season);
    const i = rows.findIndex(r => r.id === id);
    if (i < 0) return { season, r: DEFAULT.r, rd: DEFAULT.rd, w: 0, l: 0, rank: null };
    const r = rows[i];
    return { season, r: Math.round(r.r), rd: Math.round(r.rd), w: r.w, l: r.l, rank: i + 1, streak: r.streak || 0, best: r.best || 0 };
  }
  async rename(id, name, now = Date.now()) {
    const season = seasonOf(now), k = this.key(season, id), row = await this.st.get(k);
    if (row) { await this.st.put(k, { ...row, name }); this.cache = null }
  }
}

/** Storage over a Map, with the same calls as Durable Object storage. Used in tests. */
export class MapStorage {
  constructor() { this.m = new Map() }
  async get(k) { return this.m.get(k) }
  async put(k, v) { this.m.set(k, structuredClone(v)) }
  async list({ prefix = '' } = {}) { return new Map([...this.m].filter(([k]) => k.startsWith(prefix))) }
}
