// Server-side safety: a word filter for player-written names (nicknames and room names)
// and a small per-IP rate limiter. Plain functions and classes so they run in tests too.

/* ---------------- word filter ---------------- */
// Lower-case stems; a name is blocked when, after normalising, it contains one of them.
// Normalising folds look-alike letters (Latin / Cyrillic / digits) and drops spaces and symbols,
// so "F.U.C.K", "fvck" with digits, or "х у й" written with Latin x/y are caught too.
const STEMS = [
  // english
  'fuck', 'fuk', 'fck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'nigg', 'nigga', 'fag', 'retard', 'rape', 'nazi', 'hitler', 'kkk', 'penis', 'vagina', 'porn', 'sex', 'asshole', 'bastard', 'wank', 'twat', 'kys', 'killyourself',
  // russian (and translit)
  'хуй', 'хуе', 'хуё', 'хую', 'хуя', 'пизд', 'ебат', 'ебан', 'ебал', 'ебу', 'ёб', 'еба', 'бляд', 'блят', 'бля', 'сука', 'суки', 'мудак', 'мудил', 'пидор', 'пидр', 'пидар', 'гандон', 'залуп', 'шлюх', 'дроч', 'хер', 'жоп', 'уеб', 'выеб', 'наху', 'похуй', 'нахуй', 'чмо', 'даун', 'хохол', 'хач', 'жид', 'чурк',
  'huy', 'hui', 'pizd', 'ebat', 'eban', 'blyat', 'blyad', 'suka', 'pidor', 'pidar', 'mudak', 'gandon', 'zalup', 'nahui', 'nahuy',
  // latvian
  'pimp', 'dirsa', 'mauka', 'pidars', 'pizdec',
];
// look-alike letters: Cyrillic that looks Latin and digits that look like letters, folded both ways
const LAT = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's', '!': 'i', '|': 'i', 'v': 'u' };
const CYR_TO_LAT = { 'а': 'a', 'в': 'b', 'е': 'e', 'ё': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y', 'х': 'x', 'и': 'u' };
const LAT_TO_CYR = { 'a': 'а', 'b': 'в', 'e': 'е', 'k': 'к', 'm': 'м', 'h': 'н', 'o': 'о', 'p': 'р', 'c': 'с', 't': 'т', 'y': 'у', 'x': 'х', 'u': 'у', '3': 'з', '6': 'б', '0': 'о' };
const strip = s => s.toLowerCase().replace(/[\s._\-*+,'"`~^#&|/\\()[\]{}<>:;=?%]+/g, '');
/** The forms a name is checked in: plain, digits folded to letters, all-Latin and all-Cyrillic. */
function forms(name) {
  const s = strip(String(name || ''));
  const lat = [...s].map(c => LAT[c] || CYR_TO_LAT[c] || c).join('');
  const cyr = [...s].map(c => LAT_TO_CYR[c] || c).join('');
  const deDup = x => x.replace(/(.)\1+/g, '$1'); // "fuuuck" -> "fuck"
  return [s, lat, cyr, deDup(lat), deDup(cyr)];
}
const STEMS_NORM = STEMS.map(w => strip(w));
/** True when a player-written name contains an offensive word. */
export function isOffensive(name) {
  const fs = forms(name);
  return STEMS_NORM.some(w => w.length >= 3 ? fs.some(f => f.includes(w)) : false) || fs.some(f => SHORT.has(f));
}
// two-letter words only blocked as the whole name
const SHORT = new Set(['ёб', 'еб']);

/* ---------------- rate limiter ---------------- */
/** Fixed limits per IP: at most `n` actions of a kind in a sliding window of `secs`. */
export const LIMITS = {
  guest: { n: 5, secs: 3600 },   // new guest accounts per hour
  conn: { n: 40, secs: 60 },     // game connections (rooms, matchmaking) per minute
  room: { n: 6, secs: 600 },     // public rooms in the room list per 10 minutes
  name: { n: 10, secs: 600 },    // nickname changes per 10 minutes
};
export class RateLimiter {
  constructor(limits = LIMITS) { this.limits = limits; this.hits = new Map() }
  /** Records one action and returns true if it is allowed. */
  allow(kind, ip, now = Date.now()) {
    const lim = this.limits[kind]; if (!lim || !ip) return true;
    const k = kind + ':' + ip, from = now - lim.secs * 1000;
    const list = (this.hits.get(k) || []).filter(t => t > from);
    if (list.length >= lim.n) { this.hits.set(k, list); return false }
    list.push(now); this.hits.set(k, list);
    if (this.hits.size > 20000) this.prune(now);
    return true;
  }
  prune(now = Date.now()) {
    for (const [k, list] of this.hits) { const lim = this.limits[k.split(':')[0]]; const keep = list.filter(t => t > now - (lim ? lim.secs * 1000 : 0)); if (keep.length) this.hits.set(k, keep); else this.hits.delete(k) }
  }
}

/* ---------------- allowed origins ---------------- */
/** Origin check with wildcards: "https://*.itch.zone" matches any subdomain over https. */
export function originAllowed(origin, list) {
  if (!list.length) return true;
  return list.some(a => {
    if (a === origin) return true;
    const m = /^(https?:\/\/)\*\.(.+)$/.exec(a);
    if (!m) return false;
    return origin.startsWith(m[1]) && origin.endsWith('.' + m[2]) && /^[a-z0-9.-]+$/i.test(origin.slice(m[1].length, -m[2].length - 1));
  });
}
