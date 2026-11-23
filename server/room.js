// One online match on the game server. The server runs the real simulation and plays the
// "host" role for both players: they send only inputs and draw the snapshots they get back,
// so neither side can fake a point.
//
// Several rooms can share one JavaScript process (Cloudflare may put many Durable Objects
// in one isolate), and the simulation keeps its state in module globals. So each room keeps
// its own copy of that state and swaps it in around every step (JS is single-threaded,
// so nothing else can run in between).
//
// A room is 1 vs 1 (2 slots) or 2 vs 2 (4 slots: 0,1 = team 0, 2,3 = team 1). In 2 vs 2 the host
// starts the match from a lobby; empty slots are played by bots, and a player who leaves
// mid-match is replaced by a bot.
import { S } from '../src/state.js';
import { settings } from '../src/game/config.js';
import { H } from '../src/sim/hooks.js';
import { mkSnap } from '../src/sim/snapshot.js';
import { rngState, setRngState } from '../src/core/rng.ts';
import { wallPref } from '../src/ai/ai.js';
import { newMatch } from '../src/game/rules.js';
import { update, STEP } from '../src/game/update.js';
import { isOffensive } from './moderation.js';
import { STYLES } from '../src/game/constants.js';
import { cleanLook } from '../src/game/player.js';
import { startCharge, releaseCharge, tryVibora } from '../src/game/actions.js';

const VENUES = ['sunset', 'lv', 'ee', 'lt', 'es', 'by', 'us', 'ru'];
const SNAP_EVERY = 1 / 30;
const MAX_MSGS_PER_SEC = 120;
export const SLOT_TEAM = { 2: [0, 1], 4: [0, 0, 1, 1] };
const SLOT_ORDER = { 2: [0, 1], 4: [0, 2, 1, 3] }; // joiners go to the other team first

// Fresh simulation state, taken before any room ran.
const PRISTINE_S = { ...S };
const PRISTINE_SETTINGS = { ...settings };
const freshS = () => ({ ...PRISTINE_S, floats: [], players: [], trail: [], spectators: [], floatTxt: null });

let current = null; // the room whose state is swapped in right now

// Server versions of the simulation's side effects: they go to this room's players.
Object.assign(H, {
  sfx: (k, v) => current && current.fx.push([k, v == null ? 1 : v]),
  showMsg: (b, s) => current && current.broadcast({ t: 'msg', b, s: s || '' }),
  hideMsg: () => current && current.broadcast({ t: 'hide' }),
  pointWon: w => current && current.broadcast({ t: 'pt', w }),
  showEnd: () => { S.state = 'over'; if (current) { current.broadcast(mkSnap()); current.broadcast({ t: 'end' }); current.finished(S.score.winner) } },
  inputOf: p => { const q = current && current.players.find(x => x.slot === S.players.indexOf(p)); return q ? q.input : { mx: 0, my: 0 } },
  myTeam: () => 0,
});

const clamp1 = v => Math.max(-1, Math.min(1, +v || 0));

/** Room names: letters, digits, spaces and a few symbols, up to 24 characters. */
export const cleanRoomName = n => (typeof n === 'string' ? n.replace(/[^\p{L}\p{N} .,!?#&+\-|]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 24) : '');

/** Online pause: each player may pause once per match, for up to this many seconds. */
export const PAUSE_SECS = 30;

export class MatchRoom {
  /**
   * @param {{ code: string, kind: 'quick'|'private', seed?: number,
   *           onResult?: (r: { winner: {id:string,name:string}, loser: {id:string,name:string}, reason: string }) => void }} opts
   *   onResult is called once per ranked match (quick match, two different signed-in players).
   */
  constructor(opts) {
    this.code = opts.code;
    this.kind = opts.kind;
    this.seed = opts.seed;
    this.onResult = opts.onResult;
    this.reported = false;
    this.players = [];      // [{ cid, slot, team, send, style, look, loc, input, msgs, msgT }]
    this.size = 2;          // 4 once the host asks for a 2 vs 2 room
    this.host = null;
    this.cids = 0;
    this.fx = [];
    this.started = false;
    this.acc = 0; this.snapT = 0;
    this.sim = { S: freshS(), settings: { ...PRISTINE_SETTINGS }, rng: [1, 1], wp: { leg: null, on: false } };
  }

  /* ---- state swapping ---- */
  enter() {
    current = this;
    for (const k of Object.keys(S)) delete S[k];
    Object.assign(S, this.sim.S);
    Object.assign(settings, this.sim.settings);
    setRngState(this.sim.rng);
    Object.assign(wallPref, this.sim.wp);
    S.net = this.net;
  }
  leave() {
    this.sim = { S: { ...S }, settings: { ...settings }, rng: rngState(), wp: { ...wallPref } };
    current = null;
  }
  run(fn) { this.enter(); try { return fn() } finally { this.leave() } }

  broadcast(o) { const s = JSON.stringify(o); for (const p of this.players) p.send(s) }

  /* ---- connections ---- */
  /** A player connected. `send` takes a string; `who` is the signed-in player, if any. Returns their team, or -1 if refused. */
  join(send, who = {}) {
    if (this.closed) { send(JSON.stringify({ t: 'bye' })); return -1 } // someone left: this room is finished
    const slot = this.started ? undefined : SLOT_ORDER[this.size].find(i => !this.players.some(p => p.slot === i));
    if (slot === undefined) { send(JSON.stringify({ t: 'full' })); return -1 }
    const p = { cid: this.cids++, slot, team: SLOT_TEAM[this.size][slot], send, id: who.id || null, name: who.name || null, ip: who.ip || '', style: 'allround', look: null, loc: 'sunset', input: { mx: 0, my: 0 }, hello: false, msgs: 0, msgT: 0 };
    this.players.push(p);
    return p.cid;
  }
  /** Who is in which slot, sent to everyone in a 2 vs 2 room while it waits to start. */
  lobby() {
    const slots = [0, 1, 2, 3].map(i => { const p = this.players.find(q => q.slot === i && q.hello); return p ? { name: p.name || 'PLAYER ' + (i + 1), style: p.style } : null });
    for (const p of this.players) p.send(JSON.stringify({ t: 'lobby', slots, you: p.slot, host: this.host ? this.host.slot : -1, code: this.code }));
  }

  /** A player disconnected: the match is over for the other one. */
  leaveRoom(cid) {
    const gone = this.players.find(p => p.cid === cid);
    if (!gone) return; // already removed (e.g. refused with a wrong password)
    if (this.size === 4) return this.leave4(gone);
    // quitting a ranked match that is still running counts as a loss
    if (gone && this.started && this.run(() => S.state) !== 'over') {
      const other = this.players.find(p => p !== gone);
      if (other) { this.report(other, gone, 'left'); other.send(JSON.stringify({ t: 'forfeit', winner: other.team, by: gone.name || 'RIVAL' })) }
    }
    this.players = this.players.filter(p => p !== gone);
    for (const p of this.players) p.send(JSON.stringify({ t: 'bye' }));
    this.started = false;
    if (this.players.length) this.closed = true;
  }

  /** 2 vs 2: a bot takes over the slot of a player who leaves; the lobby just frees it. */
  leave4(gone) {
    this.players = this.players.filter(p => p !== gone);
    if (!this.players.length) { this.started = false; return }
    if (this.host === gone) this.host = this.players.find(p => p.hello) || this.players[0];
    if (this.started && this.run(() => S.state) !== 'over') {
      this.run(() => { const pl = S.players[gone.slot]; if (pl) { pl.ctrl = 'ai'; pl.charging = null } });
      this.broadcast({ t: 'msg', b: 'BOT TAKES OVER', s: (gone.name || 'a player') + ' left' });
      this.broadcast({ t: 'swap', slot: gone.slot });
    } else if (!this.started) this.lobby();
  }

  get empty() { return this.players.length === 0 }
  /** What the room list shows for a public room (null for private and quick rooms). */
  info() {
    if (!this.pub || this.closed) return null;
    const playing = this.started && this.run(() => S.state) !== 'over';
    return { code: this.code, name: this.pub.name, fmt: this.size === 4 ? '2v2' : '1v1', players: this.players.filter(p => p.hello).length, max: this.size, locked: !!this.pass, playing };
  }

  get ranked() { if (this.size !== 2) return false; const [a, b] = this.players; return this.kind === 'quick' && !!a?.id && !!b?.id && a.id !== b.id }
  report(w, l, reason) {
    if (this.reported || this.kind !== 'quick' || !w.id || !l.id || w.id === l.id) return; // ranked = quick match between two signed-in players
    this.reported = true;
    this.onResult?.({ winner: { id: w.id, name: w.name }, loser: { id: l.id, name: l.name }, reason });
  }
  /** Called when the match ends normally. */
  finished(winTeam) {
    const w = this.players.find(p => p.team === winTeam), l = this.players.find(p => p.team !== winTeam);
    if (w && l) this.report(w, l, 'played');
  }
  /** Sends each player their own rating change. */
  sendRatings(res) {
    if (!res) return;
    for (const p of this.players) if (res[p.id]) p.send(JSON.stringify({ t: 'rating', season: res.season, ...res[p.id] }));
  }

  message(cid, raw, nowSec = 0) {
    const p = this.players.find(q => q.cid === cid);
    if (!p) return;
    // basic flood protection
    if (nowSec - p.msgT >= 1) { p.msgT = nowSec; p.msgs = 0 }
    if (++p.msgs > MAX_MSGS_PER_SEC) return;
    let m; try { m = typeof raw === 'string' ? JSON.parse(raw) : raw } catch (e) { return }
    if (!m || typeof m !== 'object') return;

    if (m.t === 'hello') {
      if (m.mode === 'join' && this.kind === 'private' && this.players.length === 1) { p.send(JSON.stringify({ t: 'nogame' })); return }
      if (m.mode === 'join' && this.pass && m.pass !== this.pass) { p.send(JSON.stringify({ t: 'badpass' })); this.players = this.players.filter(q => q !== p); return }
      if (!this.host && m.mode !== 'join') {
        this.host = p; if (m.fmt === '2v2' && this.kind === 'private' && this.players.length === 1) this.size = 4;
        // a public room shows in the room list; it may have a password
        if (m.pub && typeof m.pub === 'object' && this.kind === 'private') {
          const rn = cleanRoomName(m.pub.name);
          this.pub = { name: rn && !isOffensive(rn) ? rn : 'PADEL ROOM' };
          this.pass = typeof m.pub.pass === 'string' ? m.pub.pass.slice(0, 16) : '';
        }
      }
      p.hello = true;
      if (typeof m.name === 'string' && !p.name) { const n = m.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10); p.name = n && !isOffensive(n) ? n : null }
      p.style = STYLES[m.style] ? m.style : 'allround';
      p.look = m.look ? cleanLook(m.look) : null;
      if (VENUES.includes(m.loc)) p.loc = m.loc;
      p.send(JSON.stringify({ t: 'joined', team: p.team, slot: p.slot, size: this.size, code: this.code, cid: p.cid }));
      if (this.size === 4) { if (!this.started) this.lobby(); return }
      if (this.players.length === 2 && this.players.every(q => q.hello)) this.start();
      return;
    }
    if (this.size === 4) {
      const waiting = !this.started || this.run(() => S.state) === 'over';
      if (m.t === 'slot' && waiting && [0, 1, 2, 3].includes(m.i) && !this.players.some(q => q.slot === m.i)) {
        p.slot = m.i; p.team = SLOT_TEAM[4][m.i]; this.started = false; this.lobby(); return }
      if ((m.t === 'go' || m.t === 'again') && waiting && p === this.host) { this.start(); return }
      if (m.t === 'again' && waiting) return;
    }
    if (m.t === 'again') { if (this.started && this.run(() => S.state) === 'over') this.start(); return }
    if (!this.started) return;
    if (m.t === 'pause') return this.askPause(p);
    if (m.t === 'resume') { if (this.pause && this.pause.cid === p.cid) this.endPause(); return }
    if (this.pause && !this.pause.pending) return; // frozen: ignore moves and swings
    this.run(() => {
      const pl = S.players[p.slot];
      if (pl && pl.ctrl === 'ai') return; // a bot plays this slot
      if (!pl) return;
      if (m.t === 'm') p.input = { mx: clamp1(m.mx), my: clamp1(m.my) };
      else if (m.t === 'd' && (m.a === 'drive' || m.a === 'lob')) startCharge(pl, m.a);
      else if (m.t === 'u') { if (pl.charging === m.a) releaseCharge(pl) }
      else if (m.t === 'v') tryVibora(pl);
    });
  }

  /* ---- pauses ---- */
  askPause(p) {
    if (this.pause || this.run(() => S.state) === 'over') return;
    this.pausesUsed ||= new Set();
    if (this.pausesUsed.has(p.cid)) { p.send(JSON.stringify({ t: 'msg', b: 'NO PAUSES LEFT', s: 'one pause per player per match' })); return }
    this.pausesUsed.add(p.cid);
    const pending = this.run(() => S.state) === 'play'; // wait for the rally to end
    this.pause = { cid: p.cid, by: p.name || 'PLAYER ' + (p.slot + 1), left: PAUSE_SECS, shown: PAUSE_SECS, pending };
    this.sendPause();
  }
  sendPause() { const q = this.pause; this.broadcast({ t: 'pause', by: q.by, left: Math.ceil(q.left), pending: q.pending, cid: q.cid }) }
  endPause() { this.pause = null; this.broadcast({ t: 'resume' }) }

  start() {
    this.pause = null; this.pausesUsed = new Set();
    if (this.size === 4) return this.start4();
    const [a, b] = [0, 1].map(i => this.players.find(p => p.slot === i));
    const loc = this.kind === 'private' ? a.loc : VENUES[Math.floor(Math.random() * VENUES.length)];
    const seed = this.seed ?? ((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
    this.net = { role: 'server', looks: [a.look, b.look], styles: [a.style, b.style], fx: this.fx };
    this.run(() => {
      Object.assign(settings, { mode: 'online', games: 3, loc });
      newMatch(false, seed);
    });
    this.started = true; this.acc = 0; this.snapT = 0; this.reported = false;
    const names = [a.name, b.name], ranked = this.ranked;
    for (const p of this.players) p.send(JSON.stringify({ t: 'start', team: p.team, styles: [a.style, b.style], looks: [a.look, b.look], names, ranked, loc, games: 3 }));
  }

  /** 2 vs 2: humans in their slots, bots everywhere else. */
  start4() {
    const by = i => this.players.find(p => p.slot === i && p.hello);
    const slots = [0, 1, 2, 3].map(by);
    const loc = this.host ? this.host.loc : 'sunset';
    const seed = this.seed ?? ((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
    const looks = slots.map(p => (p ? p.look : null)), styles = slots.map(p => (p ? p.style : 'allround'));
    const humans = slots.map(p => !!p), names = slots.map(p => (p ? p.name || null : null));
    this.net = { role: 'server', size: 4, humans, looks, styles, fx: this.fx };
    this.run(() => {
      Object.assign(settings, { mode: 'online', games: 3, loc });
      newMatch(false, seed);
    });
    this.started = true; this.acc = 0; this.snapT = 0;
    for (const p of this.players) p.send(JSON.stringify({ t: 'start', team: p.team, slot: p.slot, size: 4, humans, styles, looks, names, ranked: false, loc, games: 3 }));
  }

  /** Advance real time by `dt` seconds: fixed simulation steps plus snapshots at 30 Hz. */
  tick(dt) {
    if (!this.started) return;
    if (this.pause && !this.pause.pending) {
      this.pause.left -= Math.min(dt, 0.25);
      if (this.pause.left <= 0) return this.endPause();
      if (Math.ceil(this.pause.left) !== this.pause.shown) { this.pause.shown = Math.ceil(this.pause.left); this.sendPause() }
      return;
    }
    if (this.pause && this.pause.pending && this.run(() => S.state) !== 'play') { this.pause.pending = false; this.sendPause() }
    this.run(() => {
      if (S.state === 'over') return;
      this.acc += Math.min(dt, 0.25);
      while (this.acc >= STEP) { update(STEP); this.acc -= STEP }
      this.snapT -= dt;
      if (this.snapT <= 0) { this.snapT = SNAP_EVERY; this.broadcast(mkSnap()) }
    });
  }
}
