// Minimal, privacy-friendly analytics.
// - Always: keeps local counters (first seen, days played) so retention can be computed.
// - Only if VITE_ANALYTICS_URL is set at build time: batches anonymous events to that URL.
// No cookies, no third-party SDK, no personal data. The id is a random per-browser string.
const URL_: string = import.meta.env?.VITE_ANALYTICS_URL || '';
const KEY = 'pixelpadel-stats';
type Props = Record<string, unknown>;
interface Stats { id: string; first: number; days: number[]; matches: number }
const queue: Props[] = [];
let stats: Stats = { id: '', first: 0, days: [], matches: 0 };
let matchT0 = 0, matchInfo: Props | null = null;

function load() {
  try { stats = { ...stats, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch (e) {}
  if (!stats.id) stats.id = Math.random().toString(36).slice(2, 12);
  if (!stats.first) stats.first = Date.now();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(stats)) } catch (e) {} }
const dayNo = (t: number) => Math.floor(t / 864e5);

export function track(name: string, props: Props = {}) {
  const e = { name, t: Date.now(), id: stats.id, day: dayNo(Date.now()) - dayNo(stats.first), ...props };
  queue.push(e);
  if (import.meta.env?.DEV) console.debug('[analytics]', name, props);
  if (queue.length >= 10) flush();
}
export function flush() {
  if (!URL_ || !queue.length) { queue.length = 0; return }
  const body = JSON.stringify(queue.splice(0));
  try { navigator.sendBeacon ? navigator.sendBeacon(URL_, body) : fetch(URL_, { method: 'POST', body, keepalive: true }) } catch (e) {}
}

export function startSession() {
  load();
  const today = dayNo(Date.now());
  const returning = stats.days.length > 0 && !stats.days.includes(today);
  if (!stats.days.includes(today)) stats.days = [...stats.days.slice(-59), today];
  save();
  track('session_start', { returning, daysPlayed: stats.days.length, d1: stats.days.includes(dayNo(stats.first) + 1) });
  addEventListener('pagehide', () => { if (matchInfo) matchQuit(); track('session_end', { secs: Math.round(performance.now() / 1000) }); flush() });
}
export function matchStart(info: Props) { matchT0 = performance.now(); matchInfo = info; stats.matches++; save(); track('match_start', info) }
export function matchEnd(result: Props) { if (!matchInfo) return; track('match_end', { ...matchInfo, ...result, secs: Math.round((performance.now() - matchT0) / 1000) }); matchInfo = null }
export function matchQuit() { if (!matchInfo) return; track('match_quit', { ...matchInfo, secs: Math.round((performance.now() - matchT0) / 1000) }); matchInfo = null }
export function localStats() { return { ...stats } }
