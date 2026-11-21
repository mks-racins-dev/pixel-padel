// Side effects the simulation can trigger (sound, HUD, messages, effects, network, analytics).
// The simulation only calls these hooks, so it can run without a page: in tests and on the game server.
// In the browser, src/sim/clientHooks.js replaces them with the real UI, sound and network code.
export const H = {
  sfx(_name, _volume) {},
  showMsg(_big, _small) {},
  hideMsg() {},
  updateHud() {},
  updateEnergy() {},
  showEnd() {},
  slowMo(_secs, _k) {},
  mascotReact() {},
  emit(_event) {},
  matchStart(_info) {},
  track(_name, _props) {},
  /** A point ended: the online host tells the other side. */
  pointWon(_team) {},
  /** Which team the local player is on (online). */
  myTeam: () => 0,
  /** Movement input of a human player. */
  inputOf: _p => ({ mx: 0, my: 0 }),
};
