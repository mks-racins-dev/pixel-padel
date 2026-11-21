// Pixel Padel game server on Cloudflare Workers.
//
//   GET  /health                -> "ok"
//   GET  /api/time              -> { now }                    server clock for daily/weekly challenges
//   POST /api/guest             -> { id, token, name }        new anonymous account
//   GET  /api/me        (auth)  -> { name, profile, updatedAt, rating }
//   PUT  /api/me        (auth)  <- { name?, profile?, updatedAt? }   cloud save
//   GET  /api/ladder            -> { season, players, top[] }  ranked leaderboard
//   WS   /quick                 -> matchmaking: waits for another player, then sends {t:'go', code}
//   WS   /room/<CODE>           -> a match room (4 characters = private room, 8 = quick match)
//
// Auth: "Authorization: Bearer <id>:<token>" on HTTP, "?auth=<id>:<token>" on WebSockets
// (browsers cannot set headers on WebSockets). Tokens are random and stored only as SHA-256 hashes.
// Each account, the ladder, the lobby and each match room are Durable Objects.
import { DurableObject } from 'cloudflare:workers';
import { MatchRoom } from './room.js';
import { PlayerStore, Ladder, randomId, sha256hex, cleanName, NAME_RE } from './accounts.js';

function allowedOrigin(req, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.get('Origin') || '';
  if (!allowed.length) return origin || '*';
  return allowed.includes(origin) ? origin : null;
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: {
    'Content-Type': 'application/json',
    ...(origin ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : {}),
  } });
}
const player = (env, id) => env.PLAYER.get(env.PLAYER.idFromName(id));
const ladder = env => env.LADDER.get(env.LADDER.idFromName('ladder'));

/** Checks "<id>:<token>". Returns { id, name } or null. */
async function authenticate(env, cred) {
  const m = /^([a-z0-9]{10}):([a-z0-9]{32})$/.exec(cred || '');
  if (!m) return null;
  return await player(env, m[1]).auth(m[2]) ? { id: m[1], name: await player(env, m[1]).getName() } : null;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/health') return new Response('ok');
    const origin = allowedOrigin(req, env);

    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: origin ? {
        'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, PUT', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' } : {} });
      if (!origin) return json({ error: 'forbidden' }, 403);
      const who = await authenticate(env, (req.headers.get('Authorization') || '').replace(/^Bearer /, ''));
      try {
        if (url.pathname === '/api/time') return json({ now: Date.now() }, 200, origin);
        if (url.pathname === '/api/ladder') return json(await ladder(env).top(10), 200, origin);
        if (url.pathname === '/api/guest' && req.method === 'POST') {
          const body = await req.json().catch(() => ({}));
          let name = cleanName(body.name);
          if (!NAME_RE.test(name)) name = 'PLAYER' + String(Math.floor(Math.random() * 9000) + 1000);
          const id = randomId(10), token = randomId(32);
          if (!await player(env, id).init(await sha256hex(token), name)) return json({ error: 'try again' }, 409, origin);
          return json({ id, token, name }, 200, origin);
        }
        if (url.pathname === '/api/me') {
          if (!who) return json({ error: 'not signed in' }, 401, origin);
          if (req.method === 'GET') return json({ ...(await player(env, who.id).get()), rating: await ladder(env).me(who.id) }, 200, origin);
          if (req.method === 'PUT') {
            const body = await req.json().catch(() => null);
            if (!body) return json({ error: 'bad request' }, 400, origin);
            const err = await player(env, who.id).put(body);
            if (err) return json({ error: err }, 400, origin);
            if (body.name !== undefined) await ladder(env).rename(who.id, cleanName(body.name));
            return json({ ok: true }, 200, origin);
          }
        }
      } catch (e) {
        return json({ error: 'server error' }, 500, origin);
      }
      return json({ error: 'not found' }, 404, origin);
    }

    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Pixel Padel game server. Connect with a WebSocket.', { status: 426 });
    if (!origin) return new Response('Forbidden', { status: 403 });
    // who is connecting: set by us, never taken from the client
    const who = await authenticate(env, url.searchParams.get('auth'));
    const headers = new Headers(req.headers);
    headers.delete('X-Player-Id'); headers.delete('X-Player-Name');
    if (who) { headers.set('X-Player-Id', who.id); headers.set('X-Player-Name', who.name || '') }
    const fwd = new Request(req, { headers });
    if (url.pathname === '/quick') return env.LOBBY.get(env.LOBBY.idFromName('lobby')).fetch(fwd);
    const m = url.pathname.match(/^\/room\/([A-Z0-9]{4}|[A-Z0-9]{8})$/);
    if (m) return env.MATCH.get(env.MATCH.idFromName(m[1])).fetch(fwd);
    return new Response('Not found', { status: 404 });
  },
};

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const quickCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => CODE_CHARS[b % CODE_CHARS.length]).join('');

/** Pairs up players who pressed "find an opponent". */
export class Lobby {
  constructor() { this.waiting = null }
  async fetch() {
    const [client, ws] = Object.values(new WebSocketPair());
    ws.accept();
    const w = this.waiting;
    if (w && w.readyState === 1) {
      this.waiting = null;
      const go = JSON.stringify({ t: 'go', code: quickCode() });
      try { w.send(go) } catch (e) {}
      ws.send(go);
    } else {
      this.waiting = ws;
      ws.send(JSON.stringify({ t: 'wait' }));
      const drop = () => { if (this.waiting === ws) this.waiting = null };
      ws.addEventListener('close', drop);
      ws.addEventListener('error', drop);
    }
    return new Response(null, { status: 101, webSocket: client });
  }
}

/** One match. Runs the simulation at a fixed rate while players are connected. */
export class Match {
  constructor(state, env) { this.env = env; this.room = null; this.timer = null }
  async fetch(req) {
    const code = new URL(req.url).pathname.split('/').pop();
    if (!this.room) {
      const room = new MatchRoom({
        code, kind: code.length > 4 ? 'quick' : 'private',
        onResult: async r => { try { room.sendRatings(await ladder(this.env).report(r.winner, r.loser)) } catch (e) { console.error('ladder report failed', e) } },
      });
      this.room = room;
    }
    const room = this.room;
    const [client, ws] = Object.values(new WebSocketPair());
    ws.accept();
    const team = room.join(s => { try { ws.send(s) } catch (e) {} }, { id: req.headers.get('X-Player-Id'), name: req.headers.get('X-Player-Name') });
    if (team < 0) { setTimeout(() => { try { ws.close(1000, 'room unavailable') } catch (e) {} }, 200); return new Response(null, { status: 101, webSocket: client }) }
    ws.addEventListener('message', e => room.message(team, e.data, Date.now() / 1000));
    let left = false;
    const gone = () => {
      if (left) return; left = true;
      room.leaveRoom(team);
      if (room.empty && this.room === room) { clearInterval(this.timer); this.timer = null; this.room = null }
    };
    ws.addEventListener('close', gone);
    ws.addEventListener('error', gone);
    if (!this.timer) {
      let last = Date.now();
      this.timer = setInterval(() => { const now = Date.now(); if (this.room) this.room.tick((now - last) / 1000); last = now }, 1000 / 60);
    }
    return new Response(null, { status: 101, webSocket: client });
  }
}

/** One player's account (RPC methods are called by the Worker above). */
export class Player extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.p = new PlayerStore(ctx.storage) }
  init(tokenHash, name) { return this.p.init(tokenHash, name) }
  auth(token) { return this.p.auth(token) }
  async getName() { return (await this.p.get()).name }
  get() { return this.p.get() }
  put(body) { return this.p.put(body) }
}

/** The ranked ladder: one object for everyone, fine for the beta's scale. */
export class LadderDO extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.l = new Ladder(ctx.storage) }
  report(w, l) { return this.l.report(w, l) }
  top(n) { return this.l.top(n) }
  me(id) { return this.l.me(id) }
  rename(id, name) { return this.l.rename(id, name) }
}
