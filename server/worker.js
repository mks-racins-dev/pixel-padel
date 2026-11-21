// Pixel Padel game server on Cloudflare Workers.
//   GET /health            -> "ok"
//   WS  /quick             -> matchmaking: waits for another player, then sends {t:'go', code}
//   WS  /room/<CODE>       -> a match room (4 letters = private room, 8 = quick match)
// Each room is a Durable Object, so both players of a match always reach the same instance.
import { MatchRoom } from './room.js';

function originOk(req, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!allowed.length) return true;
  return allowed.includes(req.headers.get('Origin') || '');
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/health') return new Response('ok');
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Pixel Padel game server. Connect with a WebSocket.', { status: 426 });
    if (!originOk(req, env)) return new Response('Forbidden', { status: 403 });
    if (url.pathname === '/quick') return env.LOBBY.get(env.LOBBY.idFromName('lobby')).fetch(req);
    const m = url.pathname.match(/^\/room\/([A-Z0-9]{4}|[A-Z0-9]{8})$/);
    if (m) return env.MATCH.get(env.MATCH.idFromName(m[1])).fetch(req);
    return new Response('Not found', { status: 404 });
  },
};

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const quickCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => CODE_CHARS[b % CODE_CHARS.length]).join('');

/** Pairs up players who pressed "find opponent". */
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
  constructor() { this.room = null; this.timer = null }
  async fetch(req) {
    const code = new URL(req.url).pathname.split('/').pop();
    if (!this.room) this.room = new MatchRoom({ code, kind: code.length > 4 ? 'quick' : 'private' });
    const room = this.room;
    const [client, ws] = Object.values(new WebSocketPair());
    ws.accept();
    const team = room.join(s => { try { ws.send(s) } catch (e) {} });
    if (team < 0) { setTimeout(() => { try { ws.close(1000, 'room unavailable') } catch (e) {} }, 200); return new Response(null, { status: 101, webSocket: client }) }
    ws.addEventListener('message', e => room.message(team, e.data, Date.now() / 1000));
    const gone = () => {
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
