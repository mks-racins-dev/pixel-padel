var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../src/state.js
var S = {
  rnd: void 0,
  AC: null,
  muted: false,
  noiseBuf: null,
  myLookData: void 0,
  floatTxt: null,
  floats: [],
  players: [],
  ball: void 0,
  R0: void 0,
  state: "menu",
  stateT: 0,
  afterState: null,
  score: void 0,
  demo: true,
  paused: false,
  marker: null,
  trail: [],
  shake: 0,
  spectators: [],
  time: 0,
  lastWinner: -1,
  BG: void 0,
  NET: void 0,
  FRONT: void 0,
  msgTimer: null,
  net: null,
  last: void 0,
  acc: 0
};

// ../src/game/config.js
var settings = { mode: "1v1", diff: "normal", games: 3, assist: "on", style: "allround", loc: "sunset" };

// ../src/sim/hooks.js
var H = {
  sfx(_name, _volume) {
  },
  showMsg(_big, _small) {
  },
  hideMsg() {
  },
  updateHud() {
  },
  updateEnergy() {
  },
  showEnd() {
  },
  slowMo(_secs, _k) {
  },
  mascotReact() {
  },
  emit(_event) {
  },
  matchStart(_info) {
  },
  track(_name, _props) {
  },
  /** A point ended: the online host tells the other side. */
  pointWon(_team) {
  },
  /** Which team the local player is on (online). */
  myTeam: /* @__PURE__ */ __name(() => 0, "myTeam"),
  /** Movement input of a human player. */
  inputOf: /* @__PURE__ */ __name((_p) => ({ mx: 0, my: 0 }), "inputOf")
};

// ../src/sim/snapshot.js
var r3 = /* @__PURE__ */ __name((v) => Math.round(v * 1e3) / 1e3, "r3");
function mkSnap() {
  return {
    t: "s",
    st: S.state,
    b: [r3(S.ball.x), r3(S.ball.y), r3(S.ball.z), r3(S.ball.vx), r3(S.ball.vy), r3(S.ball.vz), S.ball.held ? 1 : 0, S.ball.out ? 1 : 0, S.ball.vib ? 1 : 0, S.ball.spin || 0],
    P: S.players.map((p) => [r3(p.x), r3(p.y), r3(p.vx), r3(p.vy), r3(p.swingT), p.swingType, p.flip ? 1 : 0, r3(p.anim), Math.round(p.energy), p.charging || 0, r3(p.charge), r3(p.serveAim)]),
    sc: S.score,
    r: [S.players.indexOf(S.R0.server), S.R0.boxX, S.R0.serve ? 1 : 0],
    mk: S.marker,
    ft: S.floatTxt,
    fl: S.floats,
    sh: r3(Math.max(0, S.shake)),
    fx: S.net && S.net.fx ? S.net.fx.splice(0) : []
  };
}
__name(mkSnap, "mkSnap");

// ../src/core/rng.ts
var seed = 1;
var a = 1;
function seedSim(s) {
  seed = s >>> 0;
  a = seed;
  return seed;
}
__name(seedSim, "seedSim");
function rand() {
  a |= 0;
  a = a + 1831565813 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
__name(rand, "rand");
function rngState() {
  return [seed, a];
}
__name(rngState, "rngState");
function setRngState(st) {
  seed = st[0];
  a = st[1];
}
__name(setRngState, "setRngState");

// ../src/game/constants.js
var G = 9.8;
var NET_H = 0.88;
var NET_POST = 0.92;
var SVC = 6.95;
var HW = 5;
var HL = 10;
var BACK_H = 4;
var BACK_GLASS = 3;
var SIDE_H = 3;
var REACH = 1.25;
var SPEED_H = 5.3;
var STYLES = { allround: { name: "ALL-ROUND", spd: 4, pow: 3, acc: 3 }, speed: { name: "SPEEDSTER", spd: 5, pow: 2, acc: 3 }, power: { name: "POWER", spd: 3, pow: 5, acc: 2 }, sniper: { name: "SNIPER", spd: 3, pow: 2, acc: 5 } };
function sweet(p) {
  return 0.58 + 0.07 * p.sk.acc;
}
__name(sweet, "sweet");
function movK(p) {
  return 0.82 + 0.07 * p.sk.spd;
}
__name(movK, "movK");
function powK(p) {
  return 0.8 + 0.08 * p.sk.pow;
}
__name(powK, "powK");
function overhit(p, power) {
  const sw = sweet(p);
  if (power <= sw + 5e-3) return false;
  const o = (power - sw) / (1 - sw);
  return rand() < o * (0.8 - 0.1 * p.sk.acc);
}
__name(overhit, "overhit");
var DIFF = { easy: { spd: 3.9, err: 1.25, react: 0.32, volley: false, miss: 0.14 }, normal: { spd: 4.7, err: 0.75, react: 0.18, volley: true, miss: 0.05 }, hard: { spd: 5.5, err: 0.4, react: 0.08, volley: true, miss: 0.01 } };

// ../src/game/physics.js
function stepBall(b, dt, ev) {
  const py = b.y;
  b.vz -= G * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.z += b.vz * dt;
  const k = 0.05 * dt;
  b.vx -= b.vx * k;
  b.vy -= b.vy * k;
  if (py < 0 !== b.y < 0) {
    const nh = NET_H + (NET_POST - NET_H) * Math.min(1, Math.abs(b.x) / HW);
    if (b.z < nh && b.z > -0.1 && !b.out) {
      b.y = py < 0 ? -0.06 : 0.06;
      b.vy *= -0.12;
      b.vx *= 0.3;
      b.vz = Math.min(b.vz, 0) * 0.3;
      ev("net");
    }
  }
  if (b.z <= 0) {
    b.z = 0;
    if (b.vz < -0.9) {
      const sp = -b.vz;
      bounceMods(b, sp);
      b.vz = -b.vz * 0.7;
      b.vx *= 0.86;
      b.vy *= 0.86;
      if (b.spin) {
        b.vx += b.spin * 4.8;
        b.spin = 0;
      }
      ev("floor", b.y < 0 ? 0 : 1, sp);
    } else {
      b.vz = 0;
      b.vx *= 0.985;
      b.vy *= 0.985;
      if (!b.rolling) {
        b.rolling = true;
        ev("roll", b.y < 0 ? 0 : 1);
      }
    }
  }
  if (Math.abs(b.x) > HW && !b.out) {
    const s = Math.sign(b.x);
    if (b.z < SIDE_H) {
      const glass = Math.abs(b.y) > 6;
      b.x = s * HW;
      b.vx *= -(glass ? 0.72 : 0.38);
      if (!glass) {
        b.vy *= 0.6;
        b.vz *= 0.6;
      }
      ev("wall", b.y < 0 ? 0 : 1, glass);
    } else {
      b.out = true;
      ev("out");
    }
  }
  if (Math.abs(b.y) > HL && !b.out) {
    const s = Math.sign(b.y);
    if (b.z < BACK_H) {
      const glass = b.z < BACK_GLASS;
      b.y = s * HL;
      b.vy *= -(glass ? 0.72 : 0.38);
      if (!glass) {
        b.vx *= 0.6;
        b.vz *= 0.6;
      }
      ev("wall", s < 0 ? 0 : 1, glass, true);
    } else {
      b.out = true;
      ev("out");
    }
  }
}
__name(stepBall, "stepBall");
function bounceMods(b, sp) {
  if (b.slice) {
    b.vz *= 0.62;
    b.vx *= 0.85;
    b.vy *= 0.8;
    b.slice = false;
  }
  if (b.kick) {
    b.vx = Math.sign(b.vx || b.x || 1) * 7 / 0.86;
    b.vy *= 0.3;
    b.vz = -11 / 0.7;
    b.kick = false;
  }
}
__name(bounceMods, "bounceMods");

// ../src/content/looks.js
var LOOKS = {
  p1: { id: "p1", skin: "#e8b48a", hair: "#4a2c1a", shirt: "#e4572e", shorts: "#2d2a3a", band: "#f4ead2", frame: "#f2c14e", skirt: false, tail: false },
  p2: { id: "p2", skin: "#b97a52", hair: "#1f1a17", shirt: "#f2c14e", shorts: "#3b5b8c", band: null, frame: "#e4572e", skirt: true, tail: true },
  o1: { id: "o1", skin: "#f0c4a0", hair: "#d9b26a", shirt: "#3fa7a8", shorts: "#1f2a44", band: "#1f2a44", frame: "#f4ead2", skirt: false, tail: false },
  o2: { id: "o2", skin: "#8d5a3b", hair: "#2b1d14", shirt: "#8e6cc1", shorts: "#f4ead2", band: "#f2c14e", frame: "#3fa7a8", skirt: true, tail: true }
};

// ../src/meta/profile.ts
var KEY = "pixelpadel-profile";
var VERSION = 1;
var MAX_LEVEL = 30;
var MAX_ALLOC = 8;
var PER_POINT = 0.25;
var fresh = /* @__PURE__ */ __name(() => ({ v: VERSION, xp: 0, level: 1, points: 0, alloc: { spd: 0, pow: 0, acc: 0, wall: 0 }, career: { won: [] }, unlocked: ["classic"], trail: "classic" }), "fresh");
var cur = null;
function migrate(raw) {
  const p = fresh();
  if (!raw || typeof raw !== "object") return p;
  const r = raw;
  const num = /* @__PURE__ */ __name((v, lo, hi, d) => typeof v === "number" && isFinite(v) ? Math.max(lo, Math.min(hi, Math.floor(v))) : d, "num");
  p.level = num(r.level, 1, MAX_LEVEL, 1);
  p.xp = num(r.xp, 0, 1e6, 0);
  p.points = num(r.points, 0, MAX_LEVEL * 2, 0);
  for (const k of Object.keys(p.alloc)) p.alloc[k] = num(r.alloc?.[k], 0, MAX_ALLOC, 0);
  if (Array.isArray(r.career?.won)) p.career.won = r.career.won.filter((x) => typeof x === "string");
  if (Array.isArray(r.unlocked)) p.unlocked = [.../* @__PURE__ */ new Set(["classic", ...r.unlocked.filter((x) => typeof x === "string")])];
  p.trail = typeof r.trail === "string" && p.unlocked.includes(r.trail) ? r.trail : "classic";
  if (r.ch && typeof r.ch === "object") p.ch = r.ch;
  if (r.cup && typeof r.cup === "object") p.cup = r.cup;
  return p;
}
__name(migrate, "migrate");
function profile() {
  if (!cur) {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {
    }
    cur = migrate(raw);
  }
  return cur;
}
__name(profile, "profile");
function careerSkills(base) {
  const a2 = profile().alloc;
  return { ...base, spd: base.spd + a2.spd * PER_POINT, pow: base.pow + a2.pow * PER_POINT, acc: base.acc + a2.acc * PER_POINT, wall: a2.wall * PER_POINT };
}
__name(careerSkills, "careerSkills");

// ../src/meta/career.ts
var TIERS = [
  { id: "club", name: "CLUB LADDER", reward: "fire", events: [
    { id: "club1", opp: "TOMI", venue: "sunset", skill: 0, games: 2, style: "allround" },
    { id: "club2", opp: "NORA", venue: "sunset", skill: 0.15, games: 2, style: "speed" },
    { id: "club3", opp: "COACH RAY", venue: "sunset", skill: 0.3, games: 3, final: true, style: "sniper" }
  ] },
  { id: "baltic", name: "BALTIC TOUR", reward: "gold", events: [
    { id: "bal1", opp: "ILZE", venue: "lv", skill: 0.35, games: 3, style: "sniper" },
    { id: "bal2", opp: "MART", venue: "ee", skill: 0.45, games: 3, style: "power" },
    { id: "bal3", opp: "RUTA", venue: "lt", skill: 0.55, games: 3, final: true, style: "speed" }
  ] },
  { id: "east", name: "EAST OPEN", events: [
    { id: "east1", opp: "ALES", venue: "by", skill: 0.62, games: 3, style: "power" },
    { id: "east2", opp: "IGOR", venue: "ru", skill: 0.7, games: 3, style: "allround" },
    { id: "east3", opp: "DASHA", venue: "ru", skill: 0.78, games: 4, final: true, style: "sniper" }
  ] },
  { id: "pro", name: "PRO TOUR", events: [
    { id: "pro1", opp: "PACO", venue: "es", skill: 0.85, games: 4, style: "speed" },
    { id: "pro2", opp: "JAY", venue: "us", skill: 0.92, games: 4, style: "power" },
    { id: "pro3", opp: "EL MAESTRO", venue: "es", skill: 1, games: 5, final: true, style: "sniper" }
  ] }
];
var ALL_EVENTS = TIERS.flatMap((t, ti) => t.events.map((e) => ({ ...e, tier: ti })));
var CAREER = { active: false, kind: "career", event: null };
function oppDiff(skill, easy, hard) {
  const k = Math.max(0, Math.min(1, skill)) * 1.15;
  const mix = /* @__PURE__ */ __name((a2, b) => a2 + (b - a2) * k, "mix");
  return { spd: mix(easy.spd, hard.spd), err: Math.max(0.2, mix(easy.err, hard.err)), react: Math.max(0.04, mix(easy.react, hard.react)), volley: skill >= 0.2, miss: Math.max(5e-3, mix(easy.miss, hard.miss)) };
}
__name(oppDiff, "oppDiff");

// ../src/game/practice.js
var DRILLS = [
  {
    id: "rally",
    name: "RALLY",
    tip: "Hit 5 balls back into the far court. Hold to power up, tap for a soft drop.",
    need: 5,
    feed: /* @__PURE__ */ __name(() => ({ tx: (rand() - 0.5) * 5, ty: -5.5 - rand(), spd: 10, clear: 1.4 }), "feed"),
    ok: /* @__PURE__ */ __name(() => true, "ok")
  },
  {
    id: "glass",
    name: "BACK GLASS",
    tip: "Let it bounce and come off the back glass, then hit it. Hold back to play a contrapared.",
    need: 3,
    feed: /* @__PURE__ */ __name(() => ({ tx: (rand() - 0.5) * 4, ty: -8.6, spd: 15, clear: 1.2 }), "feed"),
    ok: /* @__PURE__ */ __name((s) => s.offWall || s.shot === "contrapared", "ok")
  },
  {
    id: "lob",
    name: "LOB",
    tip: "Lob the ball deep over the machine (lob button). It has to land past the service line.",
    need: 3,
    feed: /* @__PURE__ */ __name(() => ({ tx: (rand() - 0.5) * 4, ty: -5, spd: 9, clear: 1.3 }), "feed"),
    ok: /* @__PURE__ */ __name((s, land) => s.shot === "lob" && Math.abs(land.y) > 6.95, "ok")
  },
  {
    id: "over",
    name: "OVERHEADS",
    tip: "High balls: hit soft for a bandeja, strong for a smash. Max power at the net = por tres.",
    need: 3,
    feed: /* @__PURE__ */ __name(() => ({ tx: (rand() - 0.5) * 3, ty: -4.2, spd: 6.5, clear: 4.2 }), "feed"),
    ok: /* @__PURE__ */ __name((s) => ["bandeja", "smash", "portres"].includes(s.shot), "ok")
  },
  {
    id: "vibora",
    name: "VIBORA",
    tip: "Your energy is full. Press vibora when the ball comes: a fast corner shot with side spin.",
    need: 2,
    feed: /* @__PURE__ */ __name(() => ({ tx: (rand() - 0.5) * 3, ty: -4.6, spd: 7, clear: 2.4 }), "feed"),
    ok: /* @__PURE__ */ __name((s) => s.shot === "vibora", "ok"),
    energy: true
  }
];
var KEY2 = "pixelpadel-practice";
var PR = { on: false, drill: 0, done: 0, feedT: 0, x: 0 };
function saved() {
  try {
    return JSON.parse(localStorage.getItem(KEY2) || "{}");
  } catch (e) {
    return {};
  }
}
__name(saved, "saved");
function save(o) {
  try {
    localStorage.setItem(KEY2, JSON.stringify({ ...saved(), ...o }));
  } catch (e) {
  }
}
__name(save, "save");
var isPractice = /* @__PURE__ */ __name(() => PR.on && !S.demo, "isPractice");
function startPractice() {
  PR.on = true;
  const done = saved().done || [];
  const first = DRILLS.findIndex((d) => !done.includes(d.id));
  beginDrill(first < 0 ? 0 : first);
}
__name(startPractice, "startPractice");
function stopPractice() {
  PR.on = false;
}
__name(stopPractice, "stopPractice");
function beginDrill(i) {
  PR.drill = i;
  PR.done = 0;
  const d = DRILLS[i];
  S.state = "between";
  S.afterState = () => feed();
  S.stateT = 2.6;
  S.ball.held = true;
  H.showMsg(`DRILL ${i + 1}/${DRILLS.length} \xB7 ${d.name}`, d.tip);
  practiceHud();
}
__name(beginDrill, "beginDrill");
function feed() {
  const d = DRILLS[PR.drill], p = S.players[0];
  if (d.energy) p.energy = 100;
  PR.x = (rand() - 0.5) * 4;
  Object.assign(S.ball, { x: PR.x, y: 9.4, z: 1.1, held: false });
  S.R0 = { serve: false, lastTeam: 1, bounces: 0, faults: 0, boxX: -1, net: false, hits: (S.R0?.hits || 0) + 1, server: p, backWall: -1 };
  const f = d.feed();
  launch(f.tx, f.ty, f.spd, f.clear);
  S.state = "play";
  H.sfx("hit", 0.6);
  practiceHud();
}
__name(feed, "feed");
function practiceLanded(land) {
  const d = DRILLS[PR.drill];
  const good = d.ok({ shot: S.R0.lastShot, offWall: S.R0.lastOffWall }, land);
  S.state = "between";
  S.stateT = 0.9;
  S.afterState = () => {
    H.hideMsg();
    next();
  };
  if (good) {
    PR.done++;
    S.floats.push({ x: land.x, y: land.y, t: 0.9, text: `${PR.done}/${d.need}`, c: "#9be37a" });
    H.sfx("point");
  } else S.floats.push({ x: land.x, y: land.y, t: 0.9, text: "IN \xB7 TRY THE DRILL SHOT", c: "#f7c993" });
  practiceHud();
}
__name(practiceLanded, "practiceLanded");
function practiceMiss(reason) {
  S.state = "between";
  S.stateT = 1.1;
  S.afterState = () => {
    H.hideMsg();
    next();
  };
  H.showMsg(reason, "TRY AGAIN");
}
__name(practiceMiss, "practiceMiss");
function next() {
  const d = DRILLS[PR.drill];
  if (PR.done < d.need) return feed();
  H.track("drill_done", { drill: d.id });
  H.emit({ type: "drill", id: d.id });
  const done = new Set(saved().done || []);
  done.add(d.id);
  save({ done: [...done] });
  if (PR.drill + 1 < DRILLS.length) return beginDrill(PR.drill + 1);
  H.track("practice_complete", {});
  S.state = "between";
  S.stateT = 3;
  S.afterState = () => beginDrill(Math.floor(rand() * DRILLS.length));
  H.showMsg("PRACTICE COMPLETE!", "Free play: drills now repeat at random. Quit from the pause menu.");
}
__name(next, "next");
function practiceHud() {
  const d = DRILLS[PR.drill], el = /* @__PURE__ */ __name((id) => document.getElementById(id), "el");
  if (!el("r0")) return;
  el("r0").querySelector(".nm").textContent = `DRILL ${PR.drill + 1}/${DRILLS.length}`;
  el("r0").querySelector(".g").textContent = "";
  el("r0").querySelector(".pt").textContent = PR.done;
  el("r1").querySelector(".nm").textContent = d.name;
  el("r1").querySelector(".g").textContent = "";
  el("r1").querySelector(".pt").textContent = d.need;
  el("info").textContent = "PRACTICE";
}
__name(practiceHud, "practiceHud");

// ../src/game/player.js
var LOOK_DEF = { gender: "boy", hand: "right", skin: "#e8b48a", hair: "#4a2c1a", shirt: "#e4572e", shorts: "#2d2a3a", frame: "#f2c14e", band: "#f4ead2" };
var HEX = /^#[0-9a-f]{6}$/i;
function cleanLook(d) {
  const o = { ...LOOK_DEF };
  if (d && typeof d === "object") {
    if (d.gender === "girl" || d.gender === "boy") o.gender = d.gender;
    if (d.hand === "left" || d.hand === "right") o.hand = d.hand;
    for (const k of ["skin", "hair", "shirt", "shorts", "frame"]) if (HEX.test(d[k])) o[k] = d[k];
    if (d.band === "none" || HEX.test(d.band)) o.band = d.band;
  }
  return o;
}
__name(cleanLook, "cleanLook");
function mkLook(d) {
  d = cleanLook(d);
  const g = d.gender === "girl";
  return { id: "c" + Object.values(d).join(""), skin: d.skin, hair: d.hair, shirt: d.shirt, shorts: d.shorts, frame: d.frame, band: d.band === "none" ? null : d.band, skirt: g, tail: g, hand: d.hand };
}
__name(mkLook, "mkLook");
function mkPlayer(team, look, ctrl, homeX) {
  return { team, look, ctrl, homeX, x: homeX, y: team === 0 ? -8 : 8, vx: 0, vy: 0, tx: homeX, ty: team === 0 ? -8 : 8, swingT: 0, swingType: "drive", swingReq: null, hitDone: true, think: 0, anim: 0, flip: false, willMiss: false, missLeg: -1, mvx: 0, mvy: 0, energy: 0, charging: null, charge: 0, power: 1, reqPower: 1, serveAim: 0.5, sk: STYLES.allround };
}
__name(mkPlayer, "mkPlayer");

// ../src/game/rules.js
function newMatch(isDemo, seed2) {
  const career = CAREER.active && !isDemo;
  seedSim(seed2 ?? (career && CAREER.event.seed != null ? CAREER.event.seed : Date.now() ^ Math.random() * 2147483647));
  S.demo = isDemo;
  if (!isDemo) H.matchStart({ career: career ? CAREER.event.id : null, mode: career ? CAREER.kind : settings.mode, diff: settings.diff, venue: settings.loc, games: settings.games, style: settings.style });
  stopPractice();
  const m = S.demo ? "2v2" : career ? "1v1" : settings.mode;
  const me = mkLook(S.myLookData);
  if (m === "practice") S.players = [mkPlayer(0, me, "h1", 0)];
  else if (m === "1v1") S.players = [mkPlayer(0, me, "h1", 0), mkPlayer(1, LOOKS.o1, "ai", 0)];
  else if (m === "2v2") S.players = [mkPlayer(0, me, S.demo ? "ai" : "h1", 2.4), mkPlayer(0, LOOKS.p2, "ai", -2.4), mkPlayer(1, LOOKS.o1, "ai", -2.4), mkPlayer(1, LOOKS.o2, "ai", 2.4)];
  else if (m === "online") {
    const role = S.net && S.net.role, lk = role === "host" ? [S.myLookData, S.net.guestLook] : S.net && S.net.looks || [];
    const ctrl = /* @__PURE__ */ __name((t) => role === "server" ? "net" : role === "guest" ? t === (S.net.team ?? 1) ? "h1" : "net" : t === 0 ? "h1" : "net", "ctrl");
    S.players = [0, 1].map((t) => mkPlayer(t, lk[t] ? mkLook(lk[t]) : t ? LOOKS.o1 : LOOKS.p1, ctrl(t), 0));
  } else S.players = [mkPlayer(0, me, "h1", 0), mkPlayer(1, LOOKS.o1, "h2", 0)];
  const ks = Object.keys(STYLES);
  for (const p of S.players) p.sk = isHuman(p) ? STYLES[settings.style] : STYLES[ks[Math.floor(rand() * ks.length)]];
  if (career) {
    S.players[0].sk = careerSkills(STYLES[settings.style]);
    S.players[1].sk = STYLES[CAREER.event.style] || STYLES.allround;
  }
  if (m === "online" && S.net) {
    const sty = S.net.role === "host" ? [settings.style, S.net.guestStyle] : S.net.styles || [];
    S.players.forEach((p, i) => p.sk = STYLES[sty[i]] || STYLES.allround);
  }
  S.score = { pts: [0, 0], games: [0, 0], winner: -1 };
  S.ball = { x: 0, y: -9, z: 1, vx: 0, vy: 0, vz: 0, held: true, out: false, rolling: false };
  S.R0 = { serve: true, lastTeam: 0, bounces: 0, faults: 0, boxX: -1, net: false, hits: 0 };
  S.marker = null;
  S.trail = [];
  if (m === "practice") return startPractice();
  setupServe(false);
  H.updateHud();
}
__name(newMatch, "newMatch");
function teamOf(t) {
  return S.players.filter((p) => p.team === t);
}
__name(teamOf, "teamOf");
function diffOf(p) {
  if (CAREER.active && !S.demo && p.team === 1) return careerDiff();
  return DIFF[S.demo ? "normal" : p.team === 0 && settings.mode === "2v2" ? "normal" : settings.diff];
}
__name(diffOf, "diffOf");
function isHuman(p) {
  return p.ctrl === "h1" || p.ctrl === "h2" || p.ctrl === "net";
}
__name(isHuman, "isHuman");
function setupServe(second) {
  const g = S.score.games[0] + S.score.games[1];
  const st = g % 2;
  const mates = teamOf(st);
  const srv = mates[Math.floor(g / 2) % mates.length];
  const rt = 1 - st;
  const deuce = (S.score.pts[0] + S.score.pts[1]) % 2 === 0;
  const sx = (st === 0 ? 1 : -1) * (deuce ? 1 : -1) * 2.4;
  srv.x = sx;
  srv.y = st === 0 ? -9.3 : 9.3;
  srv.homeX = mates.length > 1 ? sx : 0;
  const boxX = -Math.sign(sx);
  for (const q of mates) if (q !== srv) {
    q.x = -sx;
    q.y = st === 0 ? -3.2 : 3.2;
    q.homeX = -sx;
  }
  const recv = teamOf(rt);
  if (recv.length === 1) {
    recv[0].x = boxX * 2.4;
    recv[0].y = rt === 0 ? -8.8 : 8.8;
    recv[0].homeX = 0;
  } else {
    let a2 = recv[0], b = recv[1];
    if (Math.abs(a2.homeX - boxX * 2.4) > Math.abs(b.homeX - boxX * 2.4)) {
      const t = a2;
      a2 = b;
      b = t;
    }
    a2.x = boxX * 2.4;
    a2.y = rt === 0 ? -8.8 : 8.8;
    a2.homeX = boxX * 2.4;
    b.x = -boxX * 2.4;
    b.y = rt === 0 ? -7.6 : 7.6;
    b.homeX = -boxX * 2.4;
  }
  for (const p of S.players) {
    p.vx = p.vy = 0;
    p.tx = p.x;
    p.ty = p.y;
    p.swingT = 0;
    p.swingReq = null;
    p.hitDone = true;
    p.charging = null;
    p.charge = 0;
    p.serveAim = 0.5;
  }
  S.R0 = { serve: true, lastTeam: st, bounces: 0, faults: second ? 1 : 0, boxX, net: false, hits: S.R0 ? S.R0.hits + 1 : 0, server: srv };
  S.ball.held = true;
  S.ball.out = false;
  S.ball.rolling = false;
  S.ball.vx = S.ball.vy = S.ball.vz = 0;
  S.state = "serve";
  S.stateT = isHuman(srv) ? 0 : 0.9 + rand() * 0.5;
  S.marker = null;
  S.trail = [];
  H.updateHud();
}
__name(setupServe, "setupServe");
function aimVel(x0, y0, z0, tx, ty, spd, clear) {
  const d = Math.hypot(tx - x0, ty - y0);
  let T = Math.max(0.3, d / spd), v;
  for (let i = 0; i < 40; i++) {
    v = { vx: (tx - x0) / T, vy: (ty - y0) / T, vz: (-z0 + 0.5 * G * T * T) / T };
    const tn = -y0 / v.vy;
    if (!(tn > 0 && tn < T)) return v;
    const zn = z0 + v.vz * tn - 0.5 * G * tn * tn;
    if (zn > clear) return v;
    T *= 1.07;
  }
  return v;
}
__name(aimVel, "aimVel");
function gauss() {
  return (rand() + rand() + rand() - 1.5) * 1.15;
}
__name(gauss, "gauss");
function launch(tx, ty, spd, clear) {
  const v = aimVel(S.ball.x, S.ball.y, S.ball.z, tx, ty, spd, clear);
  S.ball.vx = v.vx;
  S.ball.vy = v.vy;
  S.ball.vz = v.vz;
  S.ball.held = false;
  S.ball.rolling = false;
  S.ball.out = false;
  S.ball.spin = 0;
  S.ball.vib = false;
  S.ball.kick = false;
  S.ball.slice = false;
  S.ball.porTres = false;
}
__name(launch, "launch");
function serveTarget(p, power) {
  const dir = p.team === 0 ? 1 : -1, bx = S.R0.boxX;
  return { tx: bx * (0.5 + p.serveAim * 3.6), ty: dir * (3.8 + power * 2.8) };
}
__name(serveTarget, "serveTarget");
function doServe(p, power) {
  const dir = p.team === 0 ? 1 : -1;
  if (!isHuman(p)) {
    p.serveAim = 0.1 + rand() * 0.8;
    power = Math.min(sweet(p), 0.45 + rand() * 0.5);
  }
  let { tx, ty } = serveTarget(p, power), clear = 1.12;
  const e = (isHuman(p) ? 0.22 : diffOf(p).err * 0.45) * (1.45 - 0.15 * p.sk.acc);
  tx += gauss() * e;
  ty += gauss() * e * 0.8;
  if (overhit(p, power)) {
    if (rand() < 0.5) ty = dir * (SVC + 1.2);
    else {
      clear = 0.35;
      ty = dir * 2.5;
    }
    S.floats.push({ x: p.x, y: p.y, t: 0.9, text: "OVERHIT!", c: "#e4572e" });
  }
  S.ball.x = p.x + (p.team === 0 ? 0.35 : -0.35);
  S.ball.y = p.y + (p.team === 0 ? 0.25 : -0.25);
  S.ball.z = 0.8;
  launch(tx, ty, (9 + power * 6) * powK(p), clear);
  S.R0.serve = true;
  S.R0.lastTeam = p.team;
  S.R0.bounces = 0;
  S.R0.net = false;
  S.R0.hits++;
  p.swingT = 0.3;
  p.swingType = "drive";
  p.hitDone = true;
  S.state = "play";
  H.sfx("hit", 0.9);
  setMarker(p.team);
}
__name(doServe, "doServe");
function canHit(p) {
  if (S.state !== "play" || S.ball.held) return false;
  if (S.R0.lastTeam === p.team) return false;
  if ((S.ball.y < 0 ? 0 : 1) !== p.team) return false;
  if (S.R0.serve && S.R0.bounces === 0) return false;
  if (S.ball.z > 2.8) return false;
  const dx = S.ball.x - p.x, dy = S.ball.y - p.y;
  return dx * dx + dy * dy < REACH * REACH;
}
__name(canHit, "canHit");
function performHit(p, type, aimX, power) {
  power = power == null ? 1 : Math.max(0, Math.min(1, power));
  const dir = p.team === 0 ? 1 : -1;
  const human = isHuman(p);
  const D = diffOf(p);
  const offWall = S.R0.backWall === p.team && type !== "vibora";
  if (offWall && type !== "lob") power = Math.max(power, 0.5);
  let ty, spd, clear = 1.05, smash = false, vib = false, tx = aimX, shot = null;
  const cp = type !== "vibora" && p.wantBack && canContrapared(p) ? contraparedVel(p, aimX) : null;
  if (type === "vibora") {
    vib = true;
    tx = (Math.abs(aimX) > 0.5 ? Math.sign(aimX) : rand() < 0.5 ? -1 : 1) * 4.3;
    ty = dir * (7.4 + rand() * 1.2);
    spd = 25;
    clear = 0.98;
  } else if (type === "lob") {
    ty = dir * (6.6 + power * 2.9);
    spd = 7.6;
    clear = 2.6;
  } else if (S.ball.z > 1.75 && power > 0.55) {
    smash = true;
    if (power >= 0.92 && S.ball.z > 2 && Math.abs(p.y) < 4.5) {
      shot = "portres";
      tx = Math.sign(aimX || p.x || 1) * 2.4;
      ty = dir * 3.6;
      spd = 24;
      clear = 0.97;
    } else {
      ty = dir * (3.6 + rand() * 2.4);
      spd = 22;
      clear = 0.97;
    }
  } else if (S.ball.z > 1.6 && type === "drive") {
    shot = "bandeja";
    ty = dir * (6.6 + power * 1.8);
    spd = 11 + power * 3;
    clear = 1.15;
  } else {
    ty = dir * (1.9 + power * 7);
    spd = 8 + power * 10;
    if (power < 0.3) clear = 1.02;
    if (type === "drive" && power < 0.3 && Math.abs(p.y) > 5.5) {
      shot = "chiquita";
      ty = dir * (2.4 + power * 2.5);
      clear = 0.98;
    }
  }
  if (!vib) spd *= powK(p);
  if (offWall && type !== "lob") spd *= 1.12 + (p.sk.wall || 0) * 0.06;
  const e = (vib ? 0.15 : human ? 0.3 : D.err) * (1.45 - 0.15 * p.sk.acc);
  tx += gauss() * e;
  ty += gauss() * e * (power < 0.3 ? 0.35 : 0.75);
  if (!vib && overhit(p, power)) {
    if (type === "lob" || rand() < 0.5) ty = dir * (HL + 1.5);
    else {
      clear = 0.3;
      ty = dir * 2;
    }
    S.floatTxt = { x: p.x, y: p.y, t: 0.9, text: "OVERHIT!", c: "#e4572e" };
  }
  if (!human && !vib) clear -= rand() * D.err * 0.22;
  tx = Math.max(-4.7, Math.min(4.7, tx));
  if (cp) {
    Object.assign(S.ball, { vx: cp.vx, vy: cp.vy, vz: cp.vz, held: false, rolling: false, out: false, spin: 0, vib: false, kick: false, slice: false, porTres: false });
    shot = "contrapared";
  } else launch(tx, ty, spd, clear);
  if (vib) {
    S.ball.spin = Math.sign(tx);
    S.ball.vib = true;
  }
  if (shot === "portres") {
    S.ball.kick = true;
    S.ball.porTres = true;
  }
  if (shot === "bandeja") S.ball.slice = true;
  if (shot && shot !== "portres") S.floats.push({ x: p.x, y: p.y, t: 0.9, text: SHOT_LABEL[shot][0], c: SHOT_LABEL[shot][1] });
  S.R0.lastShot = shot || (smash ? "smash" : type);
  S.R0.lastOffWall = offWall;
  if (!S.demo && (p.ctrl === "h1" || p.ctrl === "h2")) H.emit({ type: "shot", shot: S.R0.lastShot, offWall });
  S.R0.lastTeam = p.team;
  S.R0.bounces = 0;
  S.R0.serve = false;
  S.R0.net = false;
  S.R0.hits++;
  S.R0.backWall = -1;
  if (offWall) {
    S.R0.wallShot = true;
    p.energy = Math.min(100, p.energy + 10 + Math.round((p.sk.wall || 0) * 4));
    S.floats.push({ x: p.x, y: p.y, t: 1, text: "OFF THE WALL!", c: "#6fd3d2" });
    H.sfx("glass", 1);
  }
  p.hitDone = true;
  if (p.swingT < 0.12) p.swingT = 0.2;
  if (vib) {
    p.energy = 0;
    for (const q of teamOf(1 - p.team)) q.energy = Math.min(100, q.energy + 30);
    S.floatTxt = { x: p.x, y: p.y, t: 1.1, text: "VIBORA!", c: "#ff8a5c" };
    for (const q of teamOf(1 - p.team)) S.floats.push({ x: q.x, y: q.y, t: 1.1, text: "+30", c: "#f2c14e" });
    S.shake = 0.25;
    H.sfx("vibora");
  } else {
    p.energy = Math.min(100, p.energy + (smash ? 20 : 14));
    H.sfx(smash ? "smash" : "hit", 0.55 + power * 0.45);
    if (smash) S.shake = 0.18;
  }
  setMarker(p.team);
}
__name(performHit, "performHit");
function setMarker(hitTeam) {
  S.marker = null;
  if (settings.assist !== "on" || S.demo) return;
  const tgt = 1 - hitTeam;
  if (!teamOf(tgt).some(isHuman)) return;
  const b = { ...S.ball };
  for (let i = 0; i < 400; i++) {
    let hit = null;
    stepBall(b, 1 / 120, (t) => {
      if (t === "floor" || t === "roll") hit = true;
    });
    if (hit) {
      S.marker = { x: b.x, y: b.y };
      return;
    }
    if (b.out) return;
  }
}
__name(setMarker, "setMarker");
function soundOnly(t, a2, c) {
  if (t === "floor") H.sfx("bounce", Math.min(1, (c || 4) / 8));
  else if (t === "wall") H.sfx(c ? "glass" : "mesh");
  else if (t === "net") H.sfx("net");
}
__name(soundOnly, "soundOnly");
function onEvent(t, a2, c, back) {
  soundOnly(t, a2, c);
  if (S.state !== "play") return;
  const r = S.R0;
  if (t === "floor" || t === "roll") {
    if (S.marker) S.marker = null;
    if (r.bounces === 0) {
      if (a2 === r.lastTeam) return endPoint(1 - r.lastTeam, r.net ? "INTO THE NET" : "FAULT");
      if (r.serve) {
        const inBox = Math.abs(S.ball.y) <= SVC + 0.05 && S.ball.x * r.boxX >= -0.05;
        if (!inBox) return serveFault("SERVE OUT");
      }
      if (isPractice() && r.lastTeam === 0 && a2 === 1) return practiceLanded({ x: S.ball.x, y: S.ball.y });
      r.bounces = 1;
    } else return endPoint(r.lastTeam, "DOUBLE BOUNCE");
  } else if (t === "wall") {
    if (r.bounces === 0) {
      if (r.serve) return serveFault("WALL ON SERVE");
      if (a2 !== r.lastTeam) return endPoint(1 - r.lastTeam, "WALL BEFORE BOUNCE");
    } else if (r.serve && !c) return serveFault("SERVE INTO FENCE");
    if (back && c && r.bounces >= 1 && a2 !== r.lastTeam) r.backWall = a2;
  } else if (t === "out") {
    if (r.bounces >= 1) endPoint(r.lastTeam, S.ball.porTres ? "POR TRES!" : "OUT OF THE CAGE!");
    else if (r.serve) serveFault("SERVE OUT");
    else endPoint(1 - r.lastTeam, "OUT");
  } else if (t === "net") r.net = true;
}
__name(onEvent, "onEvent");
function teamName(t, short) {
  if (S.demo) return t ? "BLUE" : "RED";
  if (CAREER.active) return t ? CAREER.event.opp : "YOU";
  const m = settings.mode;
  if (m === "online") return t === H.myTeam() ? "YOU" : "RIVAL";
  if (m === "pvp") return t ? "P2" : "P1";
  if (m === "2v2") return t ? short ? "CPU" : "LEO & IVY" : short ? "YOU" : "YOU & MIA";
  return t ? "CPU" : "YOU";
}
__name(teamName, "teamName");
function serveFault(reason) {
  S.state = "between";
  if (S.R0.faults === 0) {
    H.showMsg("FAULT", reason + " \xB7 2ND SERVE");
    S.stateT = 1.1;
    S.afterState = () => setupServe(true);
  } else endPoint(1 - S.R0.lastTeam, "DOUBLE FAULT");
}
__name(serveFault, "serveFault");
function endPoint(team, reason) {
  if (isPractice()) return practiceMiss(reason);
  S.state = "between";
  S.stateT = 1.8;
  S.marker = null;
  for (const s of S.spectators) s.cheer = 1.6;
  H.mascotReact();
  if (!S.demo) {
    const me = S.players.find((p) => p.ctrl === "h1");
    H.emit({ type: "point", won: team === (me ? me.team : 0), wall: !!S.R0.wallShot, reason, golden: S.score.pts[0] === 3 && S.score.pts[1] === 3 });
  }
  S.score.pts[team]++;
  for (const q of teamOf(team)) q.energy = Math.min(100, q.energy + 8);
  let small = "POINT \xB7 " + teamName(team);
  if (S.score.pts[team] >= 4) {
    S.score.games[team]++;
    S.score.pts = [0, 0];
    small = "GAME \xB7 " + teamName(team);
    if (S.score.games[team] >= matchGames() && !S.demo) {
      S.score.winner = team;
      H.slowMo(1.4, 0.3);
    }
    if (S.demo && S.score.games[team] >= 6) S.score.games = [0, 0];
  }
  const human0 = teamOf(team).some(isHuman);
  if (!S.demo) H.sfx(settings.mode === "pvp" ? "point" : settings.mode === "online" ? team === H.myTeam() ? "point" : "lose" : human0 ? "point" : "lose");
  H.pointWon(team);
  H.showMsg(reason, small);
  H.updateHud();
  S.afterState = () => {
    if (S.score.winner >= 0) H.showEnd();
    else setupServe(false);
  };
}
__name(endPoint, "endPoint");
var SHOT_LABEL = { bandeja: ["BANDEJA", "#f7c993"], chiquita: ["CHIQUITA", "#9be37a"], contrapared: ["CONTRAPARED", "#c9a7ff"] };
function canContrapared(p) {
  const dir = p.team === 0 ? 1 : -1;
  return Math.abs(S.ball.y) > 7.6 && S.ball.z < 2.2 && Math.sign(S.ball.vy || -dir) === -dir;
}
__name(canContrapared, "canContrapared");
function contraparedVel(p, aimX) {
  const dir = p.team === 0 ? 1 : -1, wantX = Math.max(-3.5, Math.min(3.5, aimX || 0));
  let best = null, bs = 1e9;
  for (let vy = 9; vy <= 17; vy += 1) for (let vz = 4; vz <= 8.5; vz += 0.5) {
    const vx = (wantX - S.ball.x) * 0.12;
    const b = { x: S.ball.x, y: S.ball.y, z: Math.max(0.3, S.ball.z), vx, vy: -dir * vy, vz, out: false, rolling: false, spin: 0 };
    let land = null, bad = false, wall = false;
    for (let i = 0; i < 480 && !land && !bad; i++) stepBall(b, 1 / 120, (t, a2, g, back) => {
      if (t === "wall") {
        if (back && a2 === p.team) wall = true;
        else bad = true;
      } else if (t === "net" || t === "out") bad = true;
      else if (t === "floor" || t === "roll") land = { x: b.x, y: b.y, side: a2 };
    });
    if (bad || !wall || !land || land.side === p.team) continue;
    const sc = Math.abs(land.y - dir * 6.5) + Math.abs(land.x - wantX) * 0.5;
    if (sc < bs) {
      bs = sc;
      best = { vx, vy: -dir * vy, vz };
    }
  }
  return best;
}
__name(contraparedVel, "contraparedVel");
function matchGames() {
  return CAREER.active && !S.demo && CAREER.event ? CAREER.event.games : settings.games;
}
__name(matchGames, "matchGames");
var cdKey = null;
var cdVal = null;
function careerDiff() {
  const e = CAREER.event;
  if (cdKey !== e.id) {
    cdKey = e.id;
    cdVal = oppDiff(e.skill, DIFF.easy, DIFF.hard);
  }
  return cdVal;
}
__name(careerDiff, "careerDiff");

// ../src/ai/ai.js
var wallPref = { leg: null, on: false };
function predict(team, volley) {
  if (S.state !== "play" || S.R0.lastTeam === team || S.ball.held) return [];
  const b = { x: S.ball.x, y: S.ball.y, z: S.ball.z, vx: S.ball.vx, vy: S.ball.vy, vz: S.ball.vz, out: false, rolling: S.ball.rolling, spin: S.ball.spin, kick: S.ball.kick, slice: S.ball.slice };
  let bounces = S.R0.bounces, end = false, fault = false, wall = false;
  const out = [];
  let t = 0;
  const dt = 1 / 60;
  for (let i = 0; i < 180 && !end; i++) {
    stepBall(b, dt, (ty, a2, g, bk) => {
      if (ty === "floor" || ty === "roll") {
        if (bounces === 0 && a2 !== team) {
          end = true;
          fault = true;
        }
        bounces++;
        if (bounces >= 2) end = true;
      }
      if (ty === "out") {
        end = true;
        if (bounces === 0) fault = true;
      }
      if (ty === "wall" && bounces === 0 && a2 === team) {
        end = true;
        fault = true;
      }
      if (ty === "wall" && bounces >= 1 && a2 === team && bk) wall = true;
    });
    t += dt;
    if (end) break;
    if ((b.y < 0 ? 0 : 1) === team && b.z < 2.4 && b.z > 0.18 && (bounces >= 1 || !S.R0.serve && volley && Math.abs(b.y) < 5)) out.push({ x: b.x, y: b.y, z: b.z, t, wall });
  }
  return fault ? [] : out;
}
__name(predict, "predict");
function bestCand(q, cands) {
  const D = diffOf(q);
  const spd = (isHuman(q) ? SPEED_H : D.spd) * movK(q);
  let first = null, bs = -1e9, bc = null;
  for (const c of cands) {
    const need = Math.hypot(c.x - q.x, c.y - q.y) / spd + D.react;
    const sl = c.t - need;
    if (sl >= 0 && c.z < 1.7 && !first) first = { c, slack: sl };
    if (sl > bs) {
      bs = sl;
      bc = c;
    }
  }
  return first || (bc ? { c: bc, slack: bs } : null);
}
__name(bestCand, "bestCand");
function aiPlan(team) {
  const mates = teamOf(team);
  const D = diffOf(mates.find((q) => !isHuman(q)) || mates[0]);
  let cands = predict(team, D.volley);
  const dir = team === 0 ? -1 : 1;
  if (wallPref.leg !== S.R0.hits + "_" + team) {
    wallPref.leg = S.R0.hits + "_" + team;
    wallPref.on = rand() < (settings.diff === "easy" ? 0.25 : 0.5);
  }
  if (wallPref.on) {
    const wc = cands.filter((c) => c.wall);
    if (wc.length) cands = wc;
  }
  const attacking = S.state === "play" && S.R0.lastTeam === team;
  let chooser = null, pick = null;
  if (cands.length) {
    const ev = mates.map((q) => ({ q, b: bestCand(q, cands) })).filter((e) => e.b);
    const human = mates.find(isHuman);
    if (human) {
      const ai = ev.find((e) => !isHuman(e.q));
      if (ai && ai.b.c.x * Math.sign(ai.q.homeX || -1) > 0.2) {
        chooser = ai.q;
        pick = ai.b.c;
      }
    } else {
      ev.sort((a2, b) => (b.b.slack >= 0) - (a2.b.slack >= 0) || a2.b.c.t - b.b.c.t);
      if (ev.length) {
        chooser = ev[0].q;
        pick = ev[0].b.c;
      }
    }
  }
  for (const q of mates) {
    if (isHuman(q)) continue;
    if (q === chooser) {
      q.tx = pick.x - (pick.x > q.x ? 0.35 : -0.35) * 0.6;
      q.ty = pick.y + dir * 0.3;
    } else {
      q.tx = mates.length > 1 ? q.homeX : attacking ? S.ball.x * 0.4 : 0;
      q.ty = dir * (attacking ? mates.length > 1 ? 5.8 : 6.8 : 8.2);
    }
  }
}
__name(aiPlan, "aiPlan");
function aiShot(p) {
  const opp = teamOf(1 - p.team);
  let type = "drive";
  const oppNet = opp.some((q) => Math.abs(q.y) < 4.8);
  if (S.ball.z < 1.6 && rand() < (oppNet ? 0.45 : 0.16)) type = "lob";
  const back = canContrapared(p) && Math.abs(S.ball.y) > 8.6 && rand() < 0.35;
  let bx = 0, bs = -1;
  for (const x of [-3.8, -1.8, 0, 1.8, 3.8]) {
    const d = Math.min(...opp.map((q) => Math.abs(q.x - x))) + rand() * 1.3;
    if (d > bs) {
      bs = d;
      bx = x;
    }
  }
  if (p.energy >= 100 && rand() < 0.7) return { type: "vibora", aimX: bx, power: 1, back: false };
  let power = rand() < 0.15 ? sweet(p) + rand() * (1 - sweet(p)) : 0.5 + rand() * (sweet(p) - 0.5);
  if (type === "drive" && opp.every((q) => Math.abs(q.y) > 6.8) && rand() < 0.28) power = 0.08 + rand() * 0.14;
  return { type, aimX: bx, power, back };
}
__name(aiShot, "aiShot");

// ../src/game/update.js
var STEP = 1 / 120;
function update(dt) {
  S.time += dt;
  if (S.state === "serve") {
    const srv = S.R0.server;
    S.stateT -= dt;
    S.ball.x = srv.x + (srv.team === 0 ? 0.35 : -0.35);
    S.ball.y = srv.y + (srv.team === 0 ? 0.25 : -0.25);
    S.ball.z = 0.55 + Math.abs(Math.sin(S.time * 5)) * 0.5;
    if (isHuman(srv)) {
      if (srv.swingReq) {
        srv.swingReq = null;
        doServe(srv, srv.reqPower);
      }
    } else if (S.stateT <= 0) doServe(srv, 0);
  } else if (S.state === "play") {
    stepBall(S.ball, dt, onEvent);
    if (S.state === "play" && S.ball.rolling && S.R0.bounces >= 1) endPoint(S.R0.lastTeam, "DOUBLE BOUNCE");
  } else if (S.state === "between") {
    stepBall(S.ball, dt, soundOnly);
    S.stateT -= dt;
    if (S.stateT <= 0 && S.afterState) {
      const f = S.afterState;
      S.afterState = null;
      H.hideMsg();
      f();
    }
  }
  for (const t of [0, 1]) {
    const m = teamOf(t);
    if (m.some((q) => !isHuman(q))) {
      const q0 = m.find((q) => !isHuman(q));
      q0.think -= dt;
      if (q0.think <= 0) {
        q0.think = 0.08 + rand() * 0.06;
        if (S.state === "play") aiPlan(t);
        else for (const q of m) if (!isHuman(q) && S.state !== "serve") {
          q.tx = q.x;
          q.ty = q.y;
        }
      }
    }
  }
  for (const p of S.players) {
    const lim = p.team === 0 ? [-9.7, -0.5] : [0.5, 9.7];
    if (isHuman(p)) {
      const i = H.inputOf(p);
      const l = Math.hypot(i.mx, i.my) || 1;
      const sc = Math.min(1, Math.hypot(i.mx, i.my));
      const serving = S.state === "serve" && S.R0.server === p, locked = serving && p.charging;
      if (locked && i.mx) p.serveAim = Math.max(0, Math.min(1, p.serveAim + i.mx * S.R0.boxX * dt * 1.1));
      p.vx = locked ? 0 : i.mx / l * SPEED_H * movK(p) * sc;
      p.vy = locked ? 0 : i.my / l * SPEED_H * movK(p) * sc;
      if (p.charging) p.charge = Math.min(1, p.charge + dt / 0.75);
      if (S.state === "play" && p.swingReq && p.swingT <= 0.06) {
        if (p.swingReq === "vibora" && p.energy < 100) {
          p.swingReq = null;
        } else {
          p.swingT = 0.3;
          p.swingType = p.swingReq;
          p.power = p.reqPower;
          p.hitDone = false;
          p.swingReq = null;
        }
      }
      p.wantBack = p.team === 0 ? i.my < -0.3 : i.my > 0.3;
      if (p.swingT > 0 && !p.hitDone && canHit(p)) {
        const aim = i.mx < -0.3 ? -3.7 : i.mx > 0.3 ? 3.7 : -Math.sign(p.x || 0.1) * 2.2 + (rand() - 0.5) * 1.2;
        performHit(p, p.swingType, aim, p.power);
      }
    } else {
      const D = diffOf(p);
      if (S.state === "serve" || S.state === "between") {
        p.vx *= 0.8;
        p.vy *= 0.8;
      } else {
        const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
        if (d > 0.06) {
          const v = Math.min(D.spd * movK(p), d * 7);
          p.vx = dx / d * v;
          p.vy = dy / d * v;
        } else {
          p.vx = p.vy = 0;
        }
      }
      if (canHit(p)) {
        if (p.missLeg !== S.R0.hits) {
          p.missLeg = S.R0.hits;
          p.willMiss = rand() < D.miss;
        }
        if (!p.willMiss) {
          const s = aiShot(p);
          p.swingT = 0.3;
          p.swingType = s.type;
          p.wantBack = !!s.back;
          performHit(p, s.type, s.aimX, s.power);
        }
      }
    }
    if (p.swingT > 0) p.swingT -= dt;
    p.x = Math.max(-4.7, Math.min(4.7, p.x + p.vx * dt));
    p.y = Math.max(lim[0], Math.min(lim[1], p.y + p.vy * dt));
    if (S.state === "serve" && S.R0.server === p) {
      const sd = -S.R0.boxX;
      p.x = sd > 0 ? Math.max(0.3, p.x) : Math.min(-0.3, p.x);
      if (Math.abs(p.y) < SVC + 0.5) p.y = Math.sign(p.y) * (SVC + 0.5);
    }
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 0.4) p.anim += dt * sp * 2.2;
    if (!S.ball.held) p.flip = S.ball.x < p.x - 0.15;
  }
  if (S.shake > 0) S.shake -= dt;
  for (const s of S.spectators) if (s.cheer > 0) s.cheer -= dt;
  if (S.floatTxt) {
    S.floatTxt.t -= dt;
    if (S.floatTxt.t <= 0) S.floatTxt = null;
  }
  for (const f of S.floats) f.t -= dt;
  S.floats = S.floats.filter((f) => f.t > 0);
  if (!S.demo && S.score) H.updateEnergy();
}
__name(update, "update");

// ../src/game/actions.js
function startCharge(p, type) {
  if (p.charging) return;
  p.charging = type;
  p.charge = 0;
}
__name(startCharge, "startCharge");
function releaseCharge(p) {
  if (!p.charging) return;
  p.swingReq = p.charging;
  p.reqPower = Math.max(0.06, p.charge);
  p.charging = null;
  p.charge = 0;
}
__name(releaseCharge, "releaseCharge");
function tryVibora(p) {
  if (S.state === "serve" && S.R0.server === p) {
    p.swingReq = "drive";
    p.reqPower = sweet(p);
    return;
  }
  if (p.energy >= 100) {
    p.swingReq = "vibora";
    p.reqPower = 1;
  } else {
    S.floats.push({ x: p.x, y: p.y, t: 0.7, text: "NOT READY", c: "#c9bba6" });
  }
}
__name(tryVibora, "tryVibora");

// room.js
var VENUES = ["sunset", "lv", "ee", "lt", "es", "by", "us", "ru"];
var SNAP_EVERY = 1 / 30;
var MAX_MSGS_PER_SEC = 120;
var PRISTINE_S = { ...S };
var PRISTINE_SETTINGS = { ...settings };
var freshS = /* @__PURE__ */ __name(() => ({ ...PRISTINE_S, floats: [], players: [], trail: [], spectators: [], floatTxt: null }), "freshS");
var current = null;
Object.assign(H, {
  sfx: /* @__PURE__ */ __name((k, v) => current && current.fx.push([k, v == null ? 1 : v]), "sfx"),
  showMsg: /* @__PURE__ */ __name((b, s) => current && current.broadcast({ t: "msg", b, s: s || "" }), "showMsg"),
  hideMsg: /* @__PURE__ */ __name(() => current && current.broadcast({ t: "hide" }), "hideMsg"),
  pointWon: /* @__PURE__ */ __name((w) => current && current.broadcast({ t: "pt", w }), "pointWon"),
  showEnd: /* @__PURE__ */ __name(() => {
    S.state = "over";
    if (current) {
      current.broadcast(mkSnap());
      current.broadcast({ t: "end" });
    }
  }, "showEnd"),
  inputOf: /* @__PURE__ */ __name((p) => current && current.players[p.team] ? current.players[p.team].input : { mx: 0, my: 0 }, "inputOf"),
  myTeam: /* @__PURE__ */ __name(() => 0, "myTeam")
});
var clamp1 = /* @__PURE__ */ __name((v) => Math.max(-1, Math.min(1, +v || 0)), "clamp1");
var MatchRoom = class {
  static {
    __name(this, "MatchRoom");
  }
  /**
   * @param {{ code: string, kind: 'quick'|'private', seed?: number, now?: () => number }} opts
   */
  constructor(opts) {
    this.code = opts.code;
    this.kind = opts.kind;
    this.seed = opts.seed;
    this.players = [];
    this.fx = [];
    this.started = false;
    this.acc = 0;
    this.snapT = 0;
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
  run(fn) {
    this.enter();
    try {
      return fn();
    } finally {
      this.leave();
    }
  }
  broadcast(o) {
    const s = JSON.stringify(o);
    for (const p of this.players) p.send(s);
  }
  /* ---- connections ---- */
  /** A player connected. `send` takes a string. Returns their team, or -1 if refused. */
  join(send) {
    if (this.closed) {
      send(JSON.stringify({ t: "bye" }));
      return -1;
    }
    if (this.players.length >= 2) {
      send(JSON.stringify({ t: "full" }));
      return -1;
    }
    const p = { send, team: this.players.length, style: "allround", look: null, loc: "sunset", input: { mx: 0, my: 0 }, hello: false, msgs: 0, msgT: 0 };
    this.players.push(p);
    return p.team;
  }
  /** A player disconnected: the match is over for the other one. */
  leaveRoom(team) {
    const gone = this.players.find((p) => p.team === team);
    this.players = this.players.filter((p) => p !== gone);
    for (const p of this.players) p.send(JSON.stringify({ t: "bye" }));
    this.started = false;
    if (this.players.length) this.closed = true;
  }
  get empty() {
    return this.players.length === 0;
  }
  message(team, raw, nowSec = 0) {
    const p = this.players.find((q) => q.team === team);
    if (!p) return;
    if (nowSec - p.msgT >= 1) {
      p.msgT = nowSec;
      p.msgs = 0;
    }
    if (++p.msgs > MAX_MSGS_PER_SEC) return;
    let m;
    try {
      m = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      return;
    }
    if (!m || typeof m !== "object") return;
    if (m.t === "hello") {
      if (m.mode === "join" && this.kind === "private" && this.players.length === 1) {
        p.send(JSON.stringify({ t: "nogame" }));
        return;
      }
      p.hello = true;
      p.style = STYLES[m.style] ? m.style : "allround";
      p.look = m.look ? cleanLook(m.look) : null;
      if (VENUES.includes(m.loc)) p.loc = m.loc;
      p.send(JSON.stringify({ t: "joined", team: p.team, code: this.code }));
      if (this.players.length === 2 && this.players.every((q) => q.hello)) this.start();
      return;
    }
    if (m.t === "again") {
      if (this.started && this.run(() => S.state) === "over") this.start();
      return;
    }
    if (!this.started) return;
    this.run(() => {
      const pl = S.players[p.team];
      if (!pl) return;
      if (m.t === "m") p.input = { mx: clamp1(m.mx), my: clamp1(m.my) };
      else if (m.t === "d" && (m.a === "drive" || m.a === "lob")) startCharge(pl, m.a);
      else if (m.t === "u") {
        if (pl.charging === m.a) releaseCharge(pl);
      } else if (m.t === "v") tryVibora(pl);
    });
  }
  start() {
    const [a2, b] = this.players;
    const loc = this.kind === "private" ? a2.loc : VENUES[Math.floor(Math.random() * VENUES.length)];
    const seed2 = this.seed ?? (Date.now() ^ Math.random() * 2147483647) >>> 0;
    this.net = { role: "server", looks: [a2.look, b.look], styles: [a2.style, b.style], fx: this.fx };
    this.run(() => {
      Object.assign(settings, { mode: "online", games: 3, loc });
      newMatch(false, seed2);
    });
    this.started = true;
    this.acc = 0;
    this.snapT = 0;
    for (const p of this.players) p.send(JSON.stringify({ t: "start", team: p.team, styles: [a2.style, b.style], looks: [a2.look, b.look], loc, games: 3 }));
  }
  /** Advance real time by `dt` seconds: fixed simulation steps plus snapshots at 30 Hz. */
  tick(dt) {
    if (!this.started) return;
    this.run(() => {
      if (S.state === "over") return;
      this.acc += Math.min(dt, 0.25);
      while (this.acc >= STEP) {
        update(STEP);
        this.acc -= STEP;
      }
      this.snapT -= dt;
      if (this.snapT <= 0) {
        this.snapT = SNAP_EVERY;
        this.broadcast(mkSnap());
      }
    });
  }
};

// worker.js
function originOk(req, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.length) return true;
  return allowed.includes(req.headers.get("Origin") || "");
}
__name(originOk, "originOk");
var worker_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/health") return new Response("ok");
    if (req.headers.get("Upgrade") !== "websocket") return new Response("Pixel Padel game server. Connect with a WebSocket.", { status: 426 });
    if (!originOk(req, env)) return new Response("Forbidden", { status: 403 });
    if (url.pathname === "/quick") return env.LOBBY.get(env.LOBBY.idFromName("lobby")).fetch(req);
    const m = url.pathname.match(/^\/room\/([A-Z0-9]{4}|[A-Z0-9]{8})$/);
    if (m) return env.MATCH.get(env.MATCH.idFromName(m[1])).fetch(req);
    return new Response("Not found", { status: 404 });
  }
};
var CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var quickCode = /* @__PURE__ */ __name(() => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join(""), "quickCode");
var Lobby = class {
  static {
    __name(this, "Lobby");
  }
  constructor() {
    this.waiting = null;
  }
  async fetch() {
    const [client, ws] = Object.values(new WebSocketPair());
    ws.accept();
    const w = this.waiting;
    if (w && w.readyState === 1) {
      this.waiting = null;
      const go = JSON.stringify({ t: "go", code: quickCode() });
      try {
        w.send(go);
      } catch (e) {
      }
      ws.send(go);
    } else {
      this.waiting = ws;
      ws.send(JSON.stringify({ t: "wait" }));
      const drop = /* @__PURE__ */ __name(() => {
        if (this.waiting === ws) this.waiting = null;
      }, "drop");
      ws.addEventListener("close", drop);
      ws.addEventListener("error", drop);
    }
    return new Response(null, { status: 101, webSocket: client });
  }
};
var Match = class {
  static {
    __name(this, "Match");
  }
  constructor() {
    this.room = null;
    this.timer = null;
  }
  async fetch(req) {
    const code = new URL(req.url).pathname.split("/").pop();
    if (!this.room) this.room = new MatchRoom({ code, kind: code.length > 4 ? "quick" : "private" });
    const room = this.room;
    const [client, ws] = Object.values(new WebSocketPair());
    ws.accept();
    const team = room.join((s) => {
      try {
        ws.send(s);
      } catch (e) {
      }
    });
    if (team < 0) {
      setTimeout(() => {
        try {
          ws.close(1e3, "room unavailable");
        } catch (e) {
        }
      }, 200);
      return new Response(null, { status: 101, webSocket: client });
    }
    ws.addEventListener("message", (e) => room.message(team, e.data, Date.now() / 1e3));
    const gone = /* @__PURE__ */ __name(() => {
      room.leaveRoom(team);
      if (room.empty && this.room === room) {
        clearInterval(this.timer);
        this.timer = null;
        this.room = null;
      }
    }, "gone");
    ws.addEventListener("close", gone);
    ws.addEventListener("error", gone);
    if (!this.timer) {
      let last = Date.now();
      this.timer = setInterval(() => {
        const now = Date.now();
        if (this.room) this.room.tick((now - last) / 1e3);
        last = now;
      }, 1e3 / 60);
    }
    return new Response(null, { status: 101, webSocket: client });
  }
};

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-hExxFh/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-hExxFh/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Lobby,
  Match,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
