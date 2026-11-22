// Mutable game state shared between modules (ES module bindings are read-only for importers).
export const S = {
  rnd: undefined,
  AC: null,
  muted: false,
  noiseBuf: null,
  myLookData: undefined,
  floatTxt: null,
  floats: [],
  players: [],
  ball: undefined,
  R0: undefined,
  state: 'menu',
  stateT: 0,
  afterState: null,
  score: undefined,
  demo: true,
  paused: false,
  marker: null,
  trail: [],
  shake: 0,
  spectators: [],
  couch: null, // couch 2v2 slots: [{dev}|null] x4 (ui/couch.js)
  hush: false, // the crowd holds its breath (match point)
  grade: 0, // how big the event looks (render/grades.js)
  time: 0,
  lastWinner: -1,
  BG: undefined,
  NET: undefined,
  FRONT: undefined,
  msgTimer: null,
  net: null,
  last: undefined,
  acc: 0,
  chem: null, // career doubles: chemistry perks for the partner AI (null outside career doubles)
};
