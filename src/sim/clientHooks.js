// Connects the simulation's hooks to the real browser UI, sound, effects, network and analytics.
import { H } from './hooks.js';
import { S } from '../state.js';
import { sfx } from '../audio/sfx.js';
import { showMsg, hideMsg, updateHud, updateEnergy, showEnd } from '../ui/ui.js';
import { slowMo } from '../render/fx.ts';
import { mascotReact } from '../render/mascot.js';
import { emit } from '../meta/events.ts';
import { matchStart, track } from '../core/analytics.ts';
import { myTeam, netSend } from '../net/online.js';
import { inputOf } from '../input/input.js';

Object.assign(H, {
  sfx, showMsg, hideMsg, updateHud, updateEnergy, showEnd, slowMo, mascotReact, emit, matchStart, track,
  pointWon: team => { if (S.net && S.net.role === 'host') netSend({ t: 'pt', w: team }) },
  myTeam, inputOf,
});
