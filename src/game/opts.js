// Player options saved on this device: volumes, screen shake, language, custom keys.
// Free of page code so the simulation and tests can import it.
const KEY = 'pixelpadel-opts';
const DEF = { radio: 'padelfm', sfx: 8, music: 5, shake: true, lang: 'en', keys: {} };
export const OPTS = { ...DEF };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') Object.assign(OPTS, s, { keys: { ...(s.keys || {}) } }) } catch (e) {}
export function saveOpts() { try { localStorage.setItem(KEY, JSON.stringify(OPTS)) } catch (e) {} }
export const vol = k => Math.max(0, Math.min(10, OPTS[k])) / 10;
