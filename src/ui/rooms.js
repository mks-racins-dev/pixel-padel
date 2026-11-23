// ROOMS and LEADERS panels.
// ROOMS: a list of public rooms on the game server (like a server browser): name, players, format,
// password, playing or waiting. Create a room with a name, an optional password and 1v1 / 2v2;
// join by clicking a row (a locked room asks for its password).
// LEADERS: this season's ranked tables: rating, longest win streak, who is on a run now, most wins.
import { S } from '../state.js';
import { roomList, ladder as getLadder, account } from '../net/account.ts';
import { joinServerRoom, onStatus, useServer, mkCode } from '../net/online.js';
import { initAudio } from '../audio/sfx.js';
import { profile } from '../meta/profile.ts';
import { settings } from '../game/settings.js';
import { leaveCareer } from '../meta/career.ts';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const R = { list: null, loadedAt: 0, sel: null, showLocked: true, showFull: true, showPlaying: true, form: false, ask: null, err: '' };

/** Opens the online screen (the room / lobby view) on top of the menu. */
function openOnline(status) {
  initAudio(); leaveCareer(); settings.mode = 'online';
  $('menu').hidden = true; $('end').hidden = true; $('online').hidden = false; $('codeShow').textContent = '';
  onStatus(status);
}
function joinRoom(r, pass) { openOnline('Joining ' + r.name + '…'); joinServerRoom(r.code, 'join', r.fmt, { pass }) }
function createRoom(name, pass, fmt) {
  const code = mkCode(); openOnline('Opening ' + name + '…');
  joinServerRoom(code, 'create', fmt, { pub: { name, pass } }); $('codeShow').textContent = code;
}

function load(force) {
  if (!useServer()) return;
  if (!force && Date.now() - R.loadedAt < 4000) return;
  R.loadedAt = Date.now();
  roomList().then(d => { R.list = d.rooms || []; R.err = ''; renderRooms() }).catch(() => { R.err = 'Could not load the room list.'; renderRooms() });
}

export function renderRooms() {
  const box = $('roomsBox'); if (!box) return;
  if (!useServer()) { box.innerHTML = '<div class="mtitle px">ROOMS</div><div class="help">The room list needs the game server.</div>'; return }
  load(false);
  const all = R.list || [];
  const rows = all.filter(r => (R.showLocked || !r.locked) && (R.showFull || r.players < r.max) && (R.showPlaying || !r.playing))
    .sort((a, b) => (a.playing - b.playing) || (b.players - a.players));
  const people = all.reduce((n, r) => n + r.players, 0);
  const cell = r => `<button class="rrow${R.sel === r.code ? ' sel' : ''}" data-code="${r.code}">
      <span class="rname">${r.locked ? '<i class="lock">⚿</i>' : ''}${esc(r.name)}</span><span>${r.players}/${r.max}</span><span class="px">${r.fmt.toUpperCase()}</span>
      <span>${r.locked ? 'YES' : 'NO'}</span><span class="${r.playing ? 'play' : 'wait'}">${r.playing ? 'PLAYING' : 'WAITING'}</span></button>`;
  const form = R.form ? `<div class="rform"><b class="px">CREATE ROOM</b>
      <label>NAME<input id="rfName" maxlength="24" value="${esc(R.formName || ((profile().name || 'PLAYER') + "'S ROOM"))}"></label>
      <label>PASSWORD<input id="rfPass" maxlength="16" placeholder="(none)" value=""></label>
      <div class="seg" id="rfFmt"><button data-v="1v1" aria-pressed="${R.fmt !== '2v2'}">1 VS 1</button><button data-v="2v2" aria-pressed="${R.fmt === '2v2'}">2 VS 2 · BOTS FILL</button></div>
      <div class="rbtns"><button class="big" id="rfGo">CREATE ▸</button><button class="big alt" id="rfCancel">CANCEL</button></div></div>` : '';
  const ask = R.ask ? `<div class="rform"><b class="px">PASSWORD FOR ${esc(R.ask.name)}</b><label>PASSWORD<input id="raPass" maxlength="16" autofocus></label>
      <div class="rbtns"><button class="big" id="raGo">JOIN ▸</button><button class="big alt" id="raCancel">CANCEL</button></div></div>` : '';
  box.innerHTML = `<div class="rhead"><span class="mtitle px">ROOM LIST</span><span class="rcount">${people} players in ${all.length} rooms</span></div>
    <div class="rgrid">
      <div class="rtable">
        <div class="rcols"><span>NAME</span><span>PLAYERS</span><span>MODE</span><span>PASS</span><span>STATUS</span></div>
        <div class="rlist">${R.err ? `<div class="help">${R.err}</div>` : R.list === null ? '<div class="help">Loading rooms…</div>' : rows.length ? rows.map(cell).join('') : '<div class="help rempty">No public rooms right now. Create one and invite your friends!</div>'}</div>
        <div class="rfilters"><button data-f="showLocked" aria-pressed="${R.showLocked}">SHOW LOCKED ${R.showLocked ? '✓' : ''}</button><button data-f="showFull" aria-pressed="${R.showFull}">SHOW FULL ${R.showFull ? '✓' : ''}</button><button data-f="showPlaying" aria-pressed="${R.showPlaying}">SHOW PLAYING ${R.showPlaying ? '✓' : ''}</button></div>
      </div>
      <div class="rside">
        <button class="big alt" id="rRefresh">⟳ REFRESH</button>
        <button class="big" id="rJoin" data-primary ${R.sel ? '' : 'disabled'}>▸ JOIN ROOM</button>
        <button class="big alt" id="rCreate">+ CREATE ROOM</button>
        <div class="help small">2 vs 2 rooms start any time: bots take the empty places. Rooms with a password show a key.</div>
      </div>
    </div>${form}${ask}`;
  box.querySelectorAll('.rrow').forEach(b => {
    b.onclick = () => { R.sel = b.dataset.code; renderRooms() };
    b.ondblclick = () => { R.sel = b.dataset.code; join() };
  });
  box.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { R[b.dataset.f] = !R[b.dataset.f]; renderRooms() });
  $('rRefresh').onclick = () => { load(true); renderRooms() };
  $('rJoin').onclick = join;
  $('rCreate').onclick = () => { R.form = true; R.ask = null; renderRooms(); $('rfName')?.focus() };
  if (R.form) {
    $('rfFmt').onclick = e => { const b = e.target.closest('button'); if (b) { R.fmt = b.dataset.v; R.formName = $('rfName').value; renderRooms() } };
    $('rfGo').onclick = () => { const name = $('rfName').value.trim() || 'PADEL ROOM'; R.form = false; createRoom(name, $('rfPass').value, R.fmt === '2v2' ? '2v2' : '1v1') };
    $('rfCancel').onclick = () => { R.form = false; renderRooms() };
  }
  if (R.ask) {
    $('raGo').onclick = () => { const r = R.ask; R.ask = null; joinRoom(r, $('raPass').value) };
    $('raCancel').onclick = () => { R.ask = null; renderRooms() };
    $('raPass').onkeydown = e => { if (e.key === 'Enter') $('raGo').click() };
  }
}
function join() {
  const r = (R.list || []).find(x => x.code === R.sel); if (!r) return;
  if (r.players >= r.max && !r.playing) return;
  if (r.locked) { R.ask = r; R.form = false; renderRooms(); $('raPass')?.focus(); return }
  joinRoom(r);
}

/* ---------------- leaders ---------------- */
const TABS = [['rating', 'RATING', r => r.r], ['best', 'BEST STREAK', r => r.best + ' WINS'], ['streak', 'ON FIRE', r => '🔥 ' + r.streak], ['wins', 'MOST WINS', r => r.w + ' W']];
const L = { by: 'rating', data: {}, at: {} };
export function renderLeaders() {
  const box = $('leadersBox'); if (!box) return;
  if (!useServer()) { box.innerHTML = '<div class="mtitle px">LEADERS</div><div class="help">Leaderboards need the game server.</div>'; return }
  const tab = TABS.find(t => t[0] === L.by), d = L.data[L.by];
  if (!d || Date.now() - (L.at[L.by] || 0) > 20000) {
    L.at[L.by] = Date.now();
    getLadder(L.by).then(x => { L.data[x.by || L.by] = x; renderLeaders() }).catch(() => { box.querySelector('.ltab2') && (box.querySelector('.ltab2').innerHTML = '<div class="help">Could not load the leaderboard.</div>') });
  }
  const me = d?.me, myName = profile().name || account()?.name || '—';
  const mine = me ? { rating: `RATING ${me.r} · RANK ${me.rank ? '#' + me.rank : '—'}`, best: `BEST STREAK ${me.best || 0}`, streak: `CURRENT RUN ${me.streak || 0}`, wins: `${me.w}W ${me.l}L` }[L.by] : 'PLAY A RANKED MATCH TO GET ON THE BOARD';
  box.innerHTML = `<div class="rhead"><span class="mtitle px">LEADERS</span><span class="rcount">${d ? 'SEASON ' + d.season + ' · ' + d.players + ' PLAYERS' : ''}</span></div>
    <div class="seg ltabs">${TABS.map(t => `<button data-by="${t[0]}" aria-pressed="${t[0] === L.by}">${t[1]}</button>`).join('')}</div>
    <div class="help small">${{ rating: 'Ranked rating this season (FIND AN OPPONENT matches).', best: 'The longest run of ranked wins in a row this season.', streak: 'Players on a winning run right now. One loss and the fire is out.', wins: 'Most ranked wins this season.' }[L.by]}</div>
    <div class="ltab2">${!d ? '<div class="help">Loading…</div>' : d.top.length ? d.top.map(r => `<div class="lrow${r.name === myName ? ' me' : ''}"><span class="px lrank">${r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</span><span class="lname">${esc(r.name)}</span><span class="lval px">${tab[2](r)}</span><span class="lwl">${r.w}W ${r.l}L</span></div>`).join('') : '<div class="help">Nobody here yet this season. Be the first!</div>'}</div>
    <div class="lme"><b class="px">${esc(myName)}</b><span>${mine}</span></div>`;
  box.querySelectorAll('[data-by]').forEach(b => b.onclick = () => { L.by = b.dataset.by; renderLeaders() });
}
