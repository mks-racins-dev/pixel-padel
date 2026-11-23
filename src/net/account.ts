// Guest account on the game server: created quietly on first launch, no sign-up.
// Keeps the profile backed up in the cloud (the newer of local and cloud wins), uses the
// server's clock for challenges, and reads the ranked ladder.
import { profile, onProfileSave, adoptProfile, saveProfile } from '../meta/profile.ts';
import { setClockOffset } from '../meta/challenges.ts';

const KEY = 'pixelpadel-account';
export interface Account { id: string; token: string; name: string }
export interface LadderRow { rank: number; name: string; r: number; rd: number; w: number; l: number }
export interface MyRating { season: string; r: number; rd: number; w: number; l: number; rank: number | null }

let base = '';
let acct: Account | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
const listeners: (() => void)[] = [];

export const signedIn = () => !!acct;
export const account = () => acct;
/** "?auth=..." for WebSocket URLs (browsers cannot send headers on WebSockets). */
export const wsAuth = () => (acct ? 'auth=' + encodeURIComponent(acct.id + ':' + acct.token) : '');
/** Runs when the account, profile or rating changed (to refresh the menu). */
export function onAccountChange(fn: () => void) { listeners.push(fn) }
const changed = () => listeners.forEach(f => f());

async function api(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (acct) headers.Authorization = 'Bearer ' + acct.id + ':' + acct.token;
  const res = await fetch(base + path, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || res.statusText), { status: res.status });
  return body;
}

/** Starts the account: call once with the game server address (wss://…). Never throws. */
export async function initAccount(serverUrl: string) {
  base = serverUrl.replace(/^ws/, 'http');
  try { acct = JSON.parse(localStorage.getItem(KEY) || 'null') } catch (e) { acct = null }
  try {
    const t0 = Date.now(), { now } = await api('/api/time');
    setClockOffset(now - Math.round((t0 + Date.now()) / 2));
  } catch (e) { /* offline: keep the device clock */ }
  try {
    if (!acct) {
      acct = await api('/api/guest', { method: 'POST', body: JSON.stringify({ name: profile().name }) });
      try { localStorage.setItem(KEY, JSON.stringify(acct)) } catch (e) {}
    }
    await pull();
  } catch (e: any) {
    if (e && e.status === 401) { acct = null; try { localStorage.removeItem(KEY) } catch (_) {} }
  }
  onProfileSave(schedulePush);
  changed();
}

let rating: MyRating | null = null;
export const myRating = () => rating;

/** Downloads the cloud save and keeps whichever is newer. */
async function pull() {
  const me = await api('/api/me');
  rating = me.rating || null;
  const local = profile();
  if (me.name && !local.name) { local.name = me.name; saveProfile(false) }
  if (me.profile && (me.updatedAt || 0) > (local.updatedAt || 0)) adoptProfile(me.profile);
  else if ((local.updatedAt || 0) > (me.updatedAt || 0)) await push();
  if (acct && local.name && acct.name !== profile().name) acct.name = profile().name;
}

function schedulePush() {
  if (!acct) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { push().catch(() => {}) }, 2500);
}
async function push() {
  if (!acct) return;
  const p = profile();
  await api('/api/me', { method: 'PUT', body: JSON.stringify({ profile: p, updatedAt: p.updatedAt, ...(p.name ? { name: p.name } : {}) }) });
}

/** Sets the nickname locally and on the server. Returns an error message or null. */
export async function setName(raw: string): Promise<string | null> {
  const n = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  if (n.length < 3) return 'Use 3–10 letters or digits.';
  profile().name = n; saveProfile();
  if (!acct) return null;
  try { await api('/api/me', { method: 'PUT', body: JSON.stringify({ name: n }) }); acct.name = n; changed(); return null }
  catch (e: any) { return e.message || 'Could not save the name.' }
}

/** Public rooms on the game server (the ROOMS panel). */
export async function roomList(): Promise<{ rooms: { code: string; name: string; fmt: string; players: number; max: number; locked: boolean; playing: boolean }[] }> {
  return await api('/api/rooms');
}

/** The ranked leaderboard and the player's own rating. */
export async function ladder(by = 'rating'): Promise<{ season: string; by?: string; players: number; top: LadderRow[]; me: MyRating | null }> {
  const lad = await api('/api/ladder?by=' + encodeURIComponent(by));
  if (acct) { try { rating = (await api('/api/me')).rating } catch (e) {} }
  return { ...lad, me: rating };
}
