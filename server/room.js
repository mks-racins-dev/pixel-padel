// One online match on the game server. The server runs the real simulation and plays the
// "host" role for both players: they send only inputs and draw the snapshots they get back,
// so neither side can fake a point.
//
// Several rooms can share one JavaScript process (Cloudflare may put many Durable Objects
// in one isolate), and the simulation keeps its state in module globals. So each room keeps
// its own copy of that state and swaps it in around every step (JS is single-threaded,
// so nothing else can run in between).
import { S } from '../src/state.js';
import { settings } from '../src/game/config.js';
import { H } from '../src/sim/hooks.js';
import { mkSnap } from '../src/sim/snapshot.js';
import { rngState, setRngState } from '../src/core/rng.ts';
import { wallPref } from '../src/ai/ai.js';
import { newMatch } from '../src/game/rules.js';
import { update, STEP } from '../src/game/update.js';
import { STYLES } from '../src/game/constants.js';
import { cleanLook } from '../src/game/player.js';
import { startCharge, releaseCharge, tryVibora } from '../src/game/actions.js';

const VENUES = ['sunset', 'lv', 'ee', 'lt', 'es', 'by', 'us', 'ru'];
const SNAP_EVERY = 1 / 30;
const MAX_MSGS_PER_SEC = 120;

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
  showEnd: () => { S.state = 'over'; if (current) { current.broadcast(mkSnap()); current.broadcast({ t: 'end' }) } },
  inputOf: p => (current && current.players[p.team] ? current.players[p.team].input : { mx: 0, my: 0 }),
  myTeam: () => 0,
});

const clamp1 = v => Math.max(-1, Math.min(1, +v || 0));

export class MatchRoom {
  /**
   * @param {{ code: string, kind: 'quick'|'private', seed?: number, now?: () => number }} opts
   */
  constructor(opts) {
    this.code = opts.code;
    this.kind = opts.kind;
    this.seed = opts.seed;
    this.players = [];      // [{ send, team, style, look, loc, input, msgs, msgT }]
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
  /** A player connected. `send` takes a string. Returns their team, or -1 if refused. */
  join(send) {
    if (this.closed) { send(JSON.stringify({ t: 'bye' })); return -1 } // someone left: this room is finished
    if (this.players.length >= 2) { send(JSON.stringify({ t: 'full' })); return -1 }
    const p = { send, team: this.players.length, style: 'allround', look: null, loc: 'sunset', input: { mx: 0, my: 0 }, hello: false, msgs: 0, msgT: 0 };
    this.players.push(p);
    return p.team;
  }

  /** A player disconnected: the match is over for the other one. */
  leaveRoom(team) {
    const gone = this.players.find(p => p.team === team);
    this.players = this.players.filter(p => p !== gone);
    for (const p of this.players) p.send(JSON.stringify({ t: 'bye' }));
    this.started = false;
    if (this.players.length) this.closed = true;
  }

  get empty() { return this.players.length === 0 }

  message(team, raw, nowSec = 0) {
    const p = this.players.find(q => q.team === team);
    if (!p) return;
    // basic flood protection
    if (nowSec - p.msgT >= 1) { p.msgT = nowSec; p.msgs = 0 }
    if (++p.msgs > MAX_MSGS_PER_SEC) return;
    let m; try { m = typeof raw === 'string' ? JSON.parse(raw) : raw } catch (e) { return }
    if (!m || typeof m !== 'object') return;

    if (m.t === 'hello') {
      if (m.mode === 'join' && this.kind === 'private' && this.players.length === 1) { p.send(JSON.stringify({ t: 'nogame' })); return }
      p.hello = true;
      p.style = STYLES[m.style] ? m.style : 'allround';
      p.look = m.look ? cleanLook(m.look) : null;
      if (VENUES.includes(m.loc)) p.loc = m.loc;
      p.send(JSON.stringify({ t: 'joined', team: p.team, code: this.code }));
      if (this.players.length === 2 && this.players.every(q => q.hello)) this.start();
      return;
    }
    if (m.t === 'again') { if (this.started && this.run(() => S.state) === 'over') this.start(); return }
    if (!this.started) return;
    this.run(() => {
      const pl = S.players[p.team];
      if (!pl) return;
      if (m.t === 'm') p.input = { mx: clamp1(m.mx), my: clamp1(m.my) };
      else if (m.t === 'd' && (m.a === 'drive' || m.a === 'lob')) startCharge(pl, m.a);
      else if (m.t === 'u') { if (pl.charging === m.a) releaseCharge(pl) }
      else if (m.t === 'v') tryVibora(pl);
    });
  }

  start() {
    const [a, b] = this.players;
    const loc = this.kind === 'private' ? a.loc : VENUES[Math.floor(Math.random() * VENUES.length)];
    const seed = this.seed ?? ((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
    this.net = { role: 'server', looks: [a.look, b.look], styles: [a.style, b.style], fx: this.fx };
    this.run(() => {
      Object.assign(settings, { mode: 'online', games: 3, loc });
      newMatch(false, seed);
    });
    this.started = true; this.acc = 0; this.snapT = 0;
    for (const p of this.players) p.send(JSON.stringify({ t: 'start', team: p.team, styles: [a.style, b.style], looks: [a.look, b.look], loc, games: 3 }));
  }

  /** Advance real time by `dt` seconds: fixed simulation steps plus snapshots at 30 Hz. */
  tick(dt) {
    if (!this.started) return;
    this.run(() => {
      if (S.state === 'over') return;
      this.acc += Math.min(dt, 0.25);
      while (this.acc >= STEP) { update(STEP); this.acc -= STEP }
      this.snapT -= dt;
      if (this.snapT <= 0) { this.snapT = SNAP_EVERY; this.broadcast(mkSnap()) }
    });
  }
}
