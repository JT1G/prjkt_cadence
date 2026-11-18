/* Cadence app: state, small UI helpers, one view function per section, and one click handler. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fd = s => new Date(s + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/* ---------- State (loaded from localStorage; sample data only when nothing is saved) ---------- */
let S = Store.load();
if (!S) { S = buildSeed(); Store.save(S); }
const save = () => { if (!Store.save(S)) toast('Could not save: browser storage is unavailable.', true); };
const U = { route: '', last: '', tq: '', tc: '', tp: '', ts: '', nq: '', nid: null, month: new Date(today.getFullYear(), today.getMonth(), 1), did: null, ci: 0, qz: null, qi: 0, ans: [], res: null, tcr: '' };
const T = { mode: 'focus', left: S.timer.focus * 60, run: false, end: 0, id: 0 }; // timer lives outside views so it keeps running
const V = {}, FILL = {}, A = {};
const course = id => S.courses.find(c => c.id === id) || { name: 'General', color: '#94a3b8' };
const log = t => { S.activity.unshift({ t, at: Date.now() }); S.activity = S.activity.slice(0, 8); };
const commit = m => { log(m); save(); render(); toast(m); };
const ST = { todo: 'To Do', doing: 'In Progress', done: 'Completed' }, PR = { low: 'Low', med: 'Medium', high: 'High' };
const TYPE = { study: ['Study session', '#cbbcff'], exam: ['Exam', '#ffc9a8'], deadline: ['Deadline', '#a5e6ef'] };

/* ---------- Derived numbers (everything on Dashboard/Progress is computed from saved data) ---------- */
const week = () => Array.from({ length: 7 }, (_, i) => { const d = off(i - 6); return { d, m: S.sessions.filter(s => s.d === d).reduce((a, s) => a + s.m, 0) }; });
const streak = () => { const has = k => S.sessions.some(s => s.d === off(k)); let n = 0, i = has(0) ? 0 : -1; while (has(i)) { n++; i--; } return n; };
const prog = cid => { const t = S.tasks.filter(x => !cid || x.course === cid); return t.length ? Math.round(100 * t.filter(x => x.status === 'done').length / t.length) : 0; };
const hrs = m => (m / 60).toFixed(1);

/* ---------- UI helpers ---------- */
const P = { dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z', planner: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4', tasks: 'M9 11l3 3 8-8M4 12v8h16v-5', notes: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h3', cards: 'M3 6h14v12H3zM7 3h14v12', quiz: 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5a2.5 2.5 0 115 0c0 2-2.500 2-2.500 4M12 17h.01', timer: 'M12 21a8 8 0 100-16 8 8 0 000 16zM12 9v4l3 2M9 2h6', courses: 'M4 5l8-3 8 3-8 3zM6 10v6c3 2 9 2 12 0v-6', progress: 'M4 20V10M10 20V4M16 20v-8M22 20H2' };
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const NAV = [['dashboard', 'Dashboard'], ['planner', 'Planner'], ['tasks', 'Assignments'], ['notes', 'Notes'], ['cards', 'Flashcards'], ['quiz', 'Quizzes'], ['timer', 'Focus timer'], ['courses', 'Courses'], ['progress', 'Progress']];
const ring = (p, c) => `<svg class="ring" viewBox="0 0 100 100" role="img" aria-label="${p}%"><circle class="rt" cx="50" cy="50" r="40"/><circle class="rf" cx="50" cy="50" r="40" style="stroke:${c};--o:${251.3 * (1 - p / 100)}"/><text x="50" y="57" text-anchor="middle">${p}%</text></svg>`;
const bar = (p, c) => `<div class="bar"><i style="width:${p}%;background:${c}"></i></div>`;
const stat = (l, v, s) => `<div class="card stat lift"><div><span>${l}</span><b class="big">${v}</b><span>${s}</span></div></div>`;
const opts = (list, sel) => list.map(([k, x]) => `<option value="${esc(k)}"${k === sel ? ' selected' : ''}>${esc(x)}</option>`).join('');
const cOpts = () => S.courses.map(c => [c.id, c.name]);

let lastFocus = null;
const modal = $('#modal'), sheetEl = $('#sheet');
function sheet(html) { lastFocus = document.activeElement; sheetEl.innerHTML = html; modal.classList.add('open'); sheetEl.querySelector('input,select,textarea,button')?.focus(); }
function closeSheet() { modal.classList.remove('open'); lastFocus?.focus?.(); }
function toast(m, bad) { const t = $('#toast'); t.textContent = m; t.className = 'show' + (bad ? ' bad' : ''); clearTimeout(toast.id); toast.id = setTimeout(() => t.className = '', 2600); }
function ask(msg, yes, label = 'Delete') { sheet(`<h2>Are you sure?</h2><p class="mut" style="margin-bottom:18px">${esc(msg)}</p><div class="row"><button class="btn dng" id="yes">${label}</button><button class="btn" data-close>Cancel</button></div>`); $('#yes').onclick = () => { closeSheet(); yes(); }; }
/* fields: [name, label, type, required, selectOptions]; onSave may return an error string to keep the form open */
function openForm(title, fields, v, onSave, onDel) {
  const inner = fields.map(([n, l, t, r, o]) => `<label>${l}${t === 'select' ? `<select name="${n}">${opts(o, v[n])}</select>` : t === 'textarea' ? `<textarea name="${n}" rows="3">${esc(v[n])}</textarea>` : `<input name="${n}" type="${t}" value="${esc(v[n])}"${r ? ' required' : ''}${t === 'number' ? ' min="1" max="180"' : ''}>`}</label>`).join('');
  sheet(`<h2>${title}</h2><form id="mf" novalidate>${inner}<p class="err" id="err" role="alert"></p><div class="row"><button class="btn pri">Save</button><button type="button" class="btn" data-close>Cancel</button>${onDel ? '<button type="button" class="btn dng" id="del">Delete</button>' : ''}</div></form>`);
  $('#mf').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target)); fields.forEach(([n]) => d[n] = String(d[n] ?? '').trim());
    const miss = fields.find(([n, , , r]) => r && !d[n]);
    if (miss) { $('#err').textContent = `${miss[1]} is required.`; return; }
    const res = onSave(d);
    if (typeof res === 'string') $('#err').textContent = res; else closeSheet();
  };
  if (onDel) $('#del').onclick = onDel;
}

/* ---------- Views ---------- */
V.dashboard = () => {
  const done = S.tasks.filter(t => t.status === 'done').length, h = today.getHours();
  const up = S.tasks.filter(t => t.status !== 'done').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  const ev = S.events.filter(e => e.date === iso(today)).sort((a, b) => a.time.localeCompare(b.time));
  return `<header class="hd"><div><h1>${h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'}, ${esc(S.name)}</h1>
  <p class="mut">${today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}. Find your rhythm. Make progress.</p></div></header>
  <section class="grid stats"><div class="card stat lift">${ring(prog(), '#6d4aff')}<div><b>Overall progress</b><span>${done} of ${S.tasks.length} assignments done</span></div></div>
  ${stat('Completed', done, 'assignments')}${stat('Study this week', hrs(week().reduce((a, x) => a + x.m, 0)) + ' h', 'focus time')}${stat('Study streak', streak(), streak() === 1 ? 'day' : 'days')}</section>
  <section class="quick"><a class="btn pri" href="#timer">${ic('timer')}Start focus</a><a class="btn" href="#tasks">${ic('tasks')}Assignments</a><a class="btn" href="#cards">${ic('cards')}Flashcards</a><a class="btn" href="#quiz">${ic('quiz')}Take a quiz</a><a class="btn" href="#notes">${ic('notes')}Notes</a></section>
  <section class="grid two"><div class="card"><h2>Upcoming deadlines</h2>${up.map(t => `<div class="item"><span><b>${esc(t.title)}</b><small><i class="dot" style="background:${course(t.course).color}"></i>${esc(course(t.course).name)}</small></span><span class="pill ${t.due < iso(today) ? 'late' : ''}">${t.due < iso(today) ? 'Overdue · ' : ''}${fd(t.due)}</span></div>`).join('') || '<p class="empty">Nothing due. Add an assignment to get started.</p>'}</div>
  <div class="card"><h2>Today's schedule</h2>${ev.map(e => `<div class="item"><span><b>${esc(e.title)}</b><small>${TYPE[e.type][0]}</small></span><span class="pill" style="background:${TYPE[e.type][1]}">${esc(e.time || 'All day')}</span></div>`).join('') || '<p class="empty">Nothing scheduled today. Add a study session in the planner.</p>'}</div></section>
  <h2>Courses</h2><section class="grid cards">${S.courses.map(c => `<div class="card lift"><b><i class="dot" style="background:${c.color}"></i>${esc(c.name)}</b>${bar(prog(c.id), c.color)}<small>${prog(c.id)}% complete</small></div>`).join('')}</section>
  <div class="card"><h2>Recent activity</h2>${S.activity.map(a => `<div class="item"><span>${esc(a.t)}</span><small>${new Date(a.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></div>`).join('') || '<p class="empty">Your activity will show up here.</p>'}</div>`;
};

const EVF = [['title', 'Title', 'text', 1], ['type', 'Type', 'select', 0, Object.entries(TYPE).map(([k, v]) => [k, v[0]])], ['date', 'Date', 'date', 1], ['time', 'Time', 'time'], ['notes', 'Details', 'textarea']];
V.planner = () => {
  const m = U.month, lead = (m.getDay() + 6) % 7, days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), cells = [];
  for (let i = 0; i < lead; i++) cells.push('<div></div>');
  for (let d = 1; d <= days; d++) {
    const key = iso(new Date(m.getFullYear(), m.getMonth(), d));
    const ev = S.events.filter(e => e.date === key).sort((a, b) => a.time.localeCompare(b.time));
    cells.push(`<div class="day${key === iso(today) ? ' now' : ''}"><button class="dn" data-act="ev-add" data-d="${key}" aria-label="Add event on ${key}">${d}</button>${ev.map(e => `<button class="chip" style="background:${TYPE[e.type][1]}" data-act="ev-edit" data-id="${e.id}" title="${esc(e.title)}">${esc(e.title)}</button>`).join('')}</div>`);
  }
  return `<header class="hd"><h1>${m.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h1><div class="row"><button class="btn" data-act="mo" data-n="-1" aria-label="Previous month">‹</button><button class="btn" data-act="mo" data-n="0">Today</button><button class="btn" data-act="mo" data-n="1" aria-label="Next month">›</button><button class="btn pri" data-act="ev-add">Add event</button></div></header>
  <div class="card"><div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="dow">${d}</div>`).join('')}${cells.join('')}</div><div class="legend">${Object.values(TYPE).map(t => `<span><i class="dot" style="background:${t[1]}"></i>${t[0]}</span>`).join('')}</div></div>`;
};

const taskRow = t => { const c = course(t.course), late = t.status !== 'done' && t.due < iso(today);
  return `<div class="row-i${t.status === 'done' ? ' done' : ''}"><button class="chk" data-act="t-tog" data-id="${t.id}" role="checkbox" aria-checked="${t.status === 'done'}" aria-label="Mark ${esc(t.title)} complete"></button>
  <div class="grow"><b>${esc(t.title)}</b><small>${esc(t.desc)}</small><small><i class="dot" style="background:${c.color}"></i>${esc(c.name)} · Due ${fd(t.due)}</small></div>
  ${late ? '<span class="pill late">Overdue</span>' : ''}<span class="pill p-${t.priority}">${PR[t.priority]}</span><button class="pill st-${t.status}" data-act="t-cyc" data-id="${t.id}" title="Change status">${ST[t.status]}</button>
  <button class="btn sm" data-act="t-edit" data-id="${t.id}">Edit</button><button class="btn sm dng" data-act="t-del" data-id="${t.id}">Delete</button></div>`; };
V.tasks = () => `<header class="hd"><div><h1>Assignments</h1><p class="mut">${prog()}% complete overall</p></div><button class="btn pri" data-act="t-add">Add assignment</button></header>
  <div class="card">${bar(prog(), 'var(--pri)')}<div class="filters"><input data-f="tq" type="search" placeholder="Search assignments" aria-label="Search" value="${esc(U.tq)}">
  <select data-f="tc" aria-label="Subject">${opts([['', 'All subjects'], ...cOpts()], U.tc)}</select><select data-f="tp" aria-label="Priority">${opts([['', 'Any priority'], ...Object.entries(PR)], U.tp)}</select><select data-f="ts" aria-label="Status">${opts([['', 'Any status'], ...Object.entries(ST)], U.ts)}</select></div><div id="list"></div></div>`;
FILL.tasks = () => { const q = U.tq.toLowerCase(); const r = S.tasks.filter(t => (!U.tc || t.course === U.tc) && (!U.tp || t.priority === U.tp) && (!U.ts || t.status === U.ts) && (!q || (t.title + t.desc).toLowerCase().includes(q))).sort((a, b) => a.due.localeCompare(b.due));
  $('#list').innerHTML = r.map(taskRow).join('') || '<p class="empty">No assignments match. Clear the filters or add a new one.</p>'; };
const TF = () => [['title', 'Title', 'text', 1], ['desc', 'Description', 'textarea'], ['course', 'Subject', 'select', 0, cOpts()], ['due', 'Due date', 'date', 1], ['priority', 'Priority', 'select', 0, Object.entries(PR)], ['status', 'Status', 'select', 0, Object.entries(ST)]];

const note = () => S.notes.find(n => n.id === U.nid) || null;
V.notes = () => { if (!note() && S.notes.length) U.nid = [...S.notes].sort((a, b) => b.updated - a.updated)[0].id; const n = note();
  return `<header class="hd"><h1>Notes</h1><button class="btn pri" data-act="n-new">New note</button></header><div class="split"><div class="card"><input data-f="nq" type="search" placeholder="Search notes" aria-label="Search notes" value="${esc(U.nq)}"><div class="nl" id="list" style="margin-top:10px"></div></div>
  <div class="card">${n ? `<input id="ntitle" data-n="title" aria-label="Note title" value="${esc(n.title)}"><div class="row" style="align-items:center;margin:6px 0"><select data-n="course" aria-label="Subject" style="max-width:220px">${opts(cOpts(), n.course)}</select><small id="saved">Saved automatically</small><button class="btn sm dng" data-act="n-del" style="margin-left:auto">Delete</button></div><textarea id="nbody" data-n="body" aria-label="Note content" placeholder="Start writing…">${esc(n.body)}</textarea>` : '<p class="empty">No notes yet. Create one to start writing.</p>'}</div></div>`; };
FILL.notes = () => { const q = U.nq.toLowerCase(); const r = S.notes.filter(n => !q || (n.title + n.body).toLowerCase().includes(q)).sort((a, b) => b.updated - a.updated);
  $('#list').innerHTML = r.map(n => `<button class="${n.id === U.nid ? 'on' : ''}" data-act="n-pick" data-id="${n.id}"><b>${esc(n.title || 'Untitled')}</b><small>${esc(course(n.course).name)} · ${new Date(n.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></button>`).join('') || '<p class="empty">No notes found.</p>'; };

const deck = () => S.decks.find(d => d.id === U.did) || S.decks[0];
V.cards = () => { const d = deck(), n = d?.cards.length || 0; if (U.ci >= n) U.ci = 0; const c = d?.cards[U.ci];
  const know = d ? d.cards.filter(x => x.st === 'know').length : 0, pr = d ? d.cards.filter(x => x.st === 'practice').length : 0;
  return `<header class="hd"><div><h1>Flashcards</h1><p class="mut">${d ? `${know + pr} of ${n} reviewed · ${know} know · ${pr} need practice` : 'Create a deck to begin.'}</p></div><div class="row"><button class="btn" data-act="deck-add">New deck</button>${d ? '<button class="btn" data-act="card-add">Add card</button><button class="btn" data-act="fl-shuffle">Shuffle</button><button class="btn dng" data-act="deck-del">Delete deck</button>' : ''}</div></header>
  <div class="tabs">${S.decks.map(x => `<button class="btn ${x.id === d?.id ? 'on' : ''}" data-act="deck" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>
  ${c ? `<button class="fc" data-act="fl-flip" aria-label="Flip card"><span class="fi"><span class="face">${esc(c.q)}</span><span class="face back">${esc(c.a)}</span></span></button><p class="center mut">Card ${U.ci + 1} of ${n}${c.st ? ' · marked ' + (c.st === 'know' ? 'Know' : 'Need practice') : ''}</p>
  <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-act="fl-prev">Previous</button><button class="btn dng" data-act="fl-mark" data-s="practice">Need practice</button><button class="btn pri" data-act="fl-mark" data-s="know">Know</button><button class="btn" data-act="fl-next">Next</button></div>` : d ? '<div class="card empty">This deck is empty. Add your first card.</div>' : ''}`; };

V.quiz = () => {
  if (U.res) { const q = S.quizzes.find(z => z.id === U.qz), r = U.res;
    return `<header class="hd"><h1>${esc(q.title)}: results</h1></header><div class="card stat">${ring(r.pct, r.pct >= 70 ? '#15a362' : '#ff9f6b')}<div><b class="big">${r.score} / ${q.qs.length}</b><span>${r.pct >= 70 ? 'Great work.' : 'Review the answers below and try again.'}</span></div></div>
    ${q.qs.map((x, i) => `<div class="card" style="margin-top:14px"><b>${i + 1}. ${esc(x.q)}</b>${x.o.map((o, j) => `<div class="opt ${j === x.a ? 'ok' : j === U.ans[i] ? 'no' : ''}">${esc(o)}${j === x.a ? ' ✓ correct' : j === U.ans[i] ? ' ✗ your answer' : ''}</div>`).join('')}</div>`).join('')}
    <div class="row" style="margin-top:16px"><button class="btn pri" data-act="q-start" data-id="${q.id}">Retry quiz</button><button class="btn" data-act="q-exit">All quizzes</button></div>`; }
  if (U.qz) { const q = S.quizzes.find(z => z.id === U.qz), x = q.qs[U.qi], last = U.qi === q.qs.length - 1;
    return `<header class="hd"><div><h1>${esc(q.title)}</h1><p class="mut">Question ${U.qi + 1} of ${q.qs.length}</p></div><button class="btn" data-act="q-exit">Exit</button></header><div class="card">${bar(Math.round(100 * (U.qi + 1) / q.qs.length), 'var(--pri)')}<h2>${esc(x.q)}</h2>
    ${x.o.map((o, j) => `<label class="opt"><input type="radio" name="opt" value="${j}"${U.ans[U.qi] === j ? ' checked' : ''}>${esc(o)}</label>`).join('')}
    <div class="row"><button class="btn" data-act="q-prev"${U.qi ? '' : ' disabled'}>Previous</button>${last ? '<button class="btn pri" data-act="q-submit">Submit quiz</button>' : '<button class="btn pri" data-act="q-next">Next</button>'}</div></div>`; }
  return `<header class="hd"><h1>Quizzes</h1></header><div class="grid cards">${S.quizzes.map(z => { const l = [...S.quizLog].reverse().find(r => r.title === z.title);
    return `<div class="card lift"><h2>${esc(z.title)}</h2><p class="mut">${z.qs.length} questions${l ? ` · last score ${l.pct}%` : ''}</p><button class="btn pri" style="margin-top:14px" data-act="q-start" data-id="${z.id}">Start quiz</button></div>`; }).join('')}</div>`;
};

const dur = m => S.timer[m] * 60;
V.timer = () => { const td = S.sessions.filter(s => s.d === iso(today));
  return `<header class="hd"><h1>Focus timer</h1><button class="btn" data-act="tm-set">Customize</button></header><div class="card center"><div class="tabs" style="justify-content:center">${[['focus', 'Focus'], ['short', 'Short break'], ['long', 'Long break']].map(([k, l]) => `<button class="btn ${T.mode === k ? 'on' : ''}" data-act="tm-mode" data-m="${k}">${l}</button>`).join('')}</div>
  <div class="tm"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="90" stroke="#eef0f7"/><circle id="trf" class="rf" cx="100" cy="100" r="90"/></svg><div id="tm" role="timer"></div></div>
  <label style="max-width:260px;margin:0 auto 14px">Studying<select data-f="tcr">${opts([['', 'General'], ...cOpts()], U.tcr)}</select></label>
  <div class="row" style="justify-content:center"><button class="btn pri" id="tgo" data-act="tm-toggle"></button><button class="btn" data-act="tm-reset">Reset</button></div></div>
  <section class="grid stats" style="margin-top:16px">${stat('Sessions today', td.length, 'completed')}${stat('Focus time today', td.reduce((a, s) => a + s.m, 0) + ' min', 'today')}${stat('Total focus time', hrs(S.sessions.reduce((a, s) => a + s.m, 0)) + ' h', 'all time')}</section>`; };
function paint() { const el = $('#tm'); if (!el) return; const l = T.left, mm = String(Math.floor(l / 60)).padStart(2, '0'), ss = String(l % 60).padStart(2, '0');
  el.textContent = `${mm}:${ss}`; $('#trf').style.setProperty('--o', 565.5 * (1 - l / dur(T.mode))); $('#tgo').textContent = T.run ? 'Pause' : 'Start'; document.title = T.run ? `${mm}:${ss} · Cadence` : 'Cadence'; }
function stopTimer() { clearInterval(T.id); T.run = false; }
function setMode(m) { stopTimer(); T.mode = m; T.left = dur(m); if (U.route === 'timer') render(); }
function tick() { T.left = Math.max(0, Math.round((T.end - Date.now()) / 1000)); paint();
  if (T.left > 0) return; stopTimer();
  if (T.mode === 'focus') { S.sessions.push({ d: iso(new Date()), m: S.timer.focus, c: U.tcr }); log(`Finished a ${S.timer.focus}-minute focus session`); save(); toast('Focus session complete. Time for a break.'); setMode(S.sessions.filter(s => s.d === iso(today)).length % 4 === 0 ? 'long' : 'short'); }
  else { toast('Break over. Ready to focus?'); setMode('focus'); } }

V.courses = () => `<header class="hd"><h1>Courses</h1><button class="btn pri" data-act="c-add">Add course</button></header><div class="grid cards">${S.courses.map(c => { const t = S.tasks.filter(x => x.course === c.id), up = t.filter(x => x.status !== 'done').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 2);
  return `<div class="card lift" style="border-top:5px solid ${c.color}"><div class="row" style="justify-content:space-between"><h2>${esc(c.name)}</h2><button class="btn sm" data-act="c-edit" data-id="${c.id}">Edit</button></div><p class="mut">${esc(c.desc)}</p>${bar(prog(c.id), c.color)}<small>${prog(c.id)}% complete · ${t.length} assignments</small>
  <p style="margin-top:12px"><b>Upcoming</b></p>${up.map(x => `<small>${esc(x.title)} · ${fd(x.due)}</small>`).join('') || '<small>No open deadlines</small>'}<p style="margin-top:12px"><a href="#notes">${S.notes.filter(n => n.course === c.id).length} notes</a></p></div>`; }).join('') || '<p class="empty">No courses yet.</p>'}</div>`;

V.progress = () => { const w = week(), max = Math.max(60, ...w.map(x => x.m)), ql = S.quizLog.slice(-6), avg = ql.length ? Math.round(ql.reduce((a, r) => a + r.pct, 0) / ql.length) : 0;
  const by = S.courses.map(c => ({ c, m: w.reduce((a, x) => a + S.sessions.filter(s => s.d === x.d && s.c === c.id).reduce((b, s) => b + s.m, 0), 0) })), gen = w.reduce((a, x) => a + x.m, 0) - by.reduce((a, x) => a + x.m, 0);
  if (gen > 0) by.push({ c: { name: 'General', color: '#94a3b8' }, m: gen }); const tot = by.reduce((a, x) => a + x.m, 0); let acc = 0;
  const grad = tot ? by.filter(x => x.m).map(x => { const s = acc; acc += 100 * x.m / tot; return `${x.c.color} ${s}% ${acc}%`; }).join(',') : '#eef0f7 0 100%';
  return `<header class="hd"><h1>Progress</h1></header><section class="grid stats">${stat('Study hours this week', hrs(w.reduce((a, x) => a + x.m, 0)), 'hours')}${stat('Assignments completed', S.tasks.filter(t => t.status === 'done').length, 'of ' + S.tasks.length)}${stat('Quiz average', avg + '%', 'last ' + ql.length + ' quizzes')}${stat('Study streak', streak(), 'days')}</section>
  <section class="grid two"><div class="card"><h2>Weekly activity</h2><div class="cols">${w.map(x => `<div class="col"><i style="height:${Math.max(2, 100 * x.m / max)}%" title="${x.m} min"></i>${new Date(x.d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short' })}</div>`).join('')}</div></div>
  <div class="card"><h2>Study time by course</h2><div class="row" style="align-items:center"><div class="donut" style="background:conic-gradient(${grad})" role="img" aria-label="Study time distribution"></div><div>${by.map(x => `<small><i class="dot" style="background:${x.c.color}"></i>${esc(x.c.name)}: ${x.m} min</small>`).join('') || '<small>Complete a focus session to see this.</small>'}</div></div></div></section>
  <section class="grid two"><div class="card"><h2>Course completion</h2>${S.courses.map(c => `<small>${esc(c.name)} · ${prog(c.id)}%</small>${bar(prog(c.id), c.color)}`).join('')}</div>
  <div class="card"><h2>Quiz performance</h2>${ql.map(r => `<small>${esc(r.title)} · ${fd(r.d)} · ${r.pct}%</small>${bar(r.pct, r.pct >= 70 ? '#15a362' : '#ff9f6b')}`).join('') || '<p class="empty">Take a quiz to see your scores here.</p>'}</div></section>`; };

/* ---------- Actions (buttons use data-act="name") ---------- */
const byId = (arr, id) => arr.find(x => x.id === id);
const cycle = { todo: 'doing', doing: 'done', done: 'todo' };
Object.assign(A, {
  nav: () => document.body.classList.toggle('nav'),
  mo: d => { U.month = +d.n ? new Date(U.month.getFullYear(), U.month.getMonth() + +d.n, 1) : new Date(today.getFullYear(), today.getMonth(), 1); render(); },
  'ev-add': d => openForm('Add event', EVF, { type: 'study', date: d.d || iso(today) }, x => { S.events.push({ id: uid(), ...x }); commit('Scheduled ' + x.title); }),
  'ev-edit': d => { const e = byId(S.events, d.id); openForm('Edit event', EVF, e, x => { Object.assign(e, x); commit('Updated ' + x.title); }, () => ask(`Delete "${e.title}"?`, () => { S.events = S.events.filter(y => y !== e); commit('Deleted event ' + e.title); })); },
  't-add': () => S.courses.length ? openForm('Add assignment', TF(), { course: S.courses[0].id, priority: 'med', status: 'todo', due: off(7) }, x => { S.tasks.push({ id: uid(), ...x }); commit('Added ' + x.title); }) : toast('Add a course first.', true),
  't-edit': d => { const t = byId(S.tasks, d.id); openForm('Edit assignment', TF(), t, x => { Object.assign(t, x); commit('Updated ' + x.title); }); },
  't-del': d => { const t = byId(S.tasks, d.id); ask(`Delete "${t.title}"?`, () => { S.tasks = S.tasks.filter(x => x !== t); commit('Deleted ' + t.title); }); },
  't-tog': d => { const t = byId(S.tasks, d.id); t.status = t.status === 'done' ? 'todo' : 'done'; commit(t.status === 'done' ? 'Completed ' + t.title : 'Reopened ' + t.title); },
  't-cyc': d => { const t = byId(S.tasks, d.id); t.status = cycle[t.status]; commit(`${t.title}: ${ST[t.status]}`); },
  'n-new': () => { const n = { id: uid(), title: 'Untitled note', course: S.courses[0]?.id || '', body: '', updated: Date.now() }; S.notes.push(n); U.nid = n.id; U.nq = ''; commit('Created a note'); },
  'n-pick': d => { U.nid = d.id; render(); },
  'n-del': () => { const n = note(); ask(`Delete "${n.title}"?`, () => { S.notes = S.notes.filter(x => x !== n); U.nid = null; commit('Deleted note ' + n.title); }); },
  deck: d => { U.did = d.id; U.ci = 0; render(); },
  'deck-add': () => openForm('New deck', [['name', 'Deck name', 'text', 1]], {}, x => { const d = { id: uid(), name: x.name, cards: [] }; S.decks.push(d); U.did = d.id; commit('Created deck ' + x.name); }),
  'deck-del': () => { const d = deck(); ask(`Delete deck "${d.name}" and its cards?`, () => { S.decks = S.decks.filter(x => x !== d); U.did = null; commit('Deleted deck ' + d.name); }); },
  'card-add': () => openForm('Add card', [['q', 'Question', 'textarea', 1], ['a', 'Answer', 'textarea', 1]], {}, x => { deck().cards.push({ id: uid(), ...x }); U.ci = deck().cards.length - 1; commit('Added a flashcard'); }),
  'fl-flip': () => $('.fc').classList.toggle('flip'),
  'fl-next': () => { U.ci = (U.ci + 1) % deck().cards.length; render(); },
  'fl-prev': () => { const n = deck().cards.length; U.ci = (U.ci + n - 1) % n; render(); },
  'fl-mark': d => { const dk = deck(); dk.cards[U.ci].st = d.s; U.ci = (U.ci + 1) % dk.cards.length; save(); render(); },
  'fl-shuffle': () => { const c = deck().cards; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } U.ci = 0; save(); render(); toast('Deck shuffled'); },
  'q-start': d => { U.qz = d.id; U.qi = 0; U.ans = []; U.res = null; render(); },
  'q-exit': () => { U.qz = null; U.res = null; render(); },
  'q-next': () => { if (U.ans[U.qi] === undefined) return toast('Choose an answer first.', true); U.qi++; render(); },
  'q-prev': () => { U.qi--; render(); },
  'q-submit': () => { const q = S.quizzes.find(z => z.id === U.qz); if (q.qs.some((_, i) => U.ans[i] === undefined)) return toast('Answer every question before submitting.', true);
    const score = q.qs.filter((x, i) => U.ans[i] === x.a).length, pct = Math.round(100 * score / q.qs.length); U.res = { score, pct }; S.quizLog.push({ d: iso(new Date()), title: q.title, pct }); commit(`Scored ${pct}% on ${q.title}`); },
  'tm-mode': d => setMode(d.m),
  'tm-toggle': () => { if (T.run) { tick(); stopTimer(); } else { T.run = true; T.end = Date.now() + T.left * 1000; T.id = setInterval(tick, 250); } paint(); },
  'tm-reset': () => setMode(T.mode),
  'tm-set': () => openForm('Customize timer (minutes)', [['focus', 'Focus', 'number', 1], ['short', 'Short break', 'number', 1], ['long', 'Long break', 'number', 1]], S.timer, x => {
    const v = ['focus', 'short', 'long'].map(k => +x[k]); if (v.some(n => !(n >= 1 && n <= 180))) return 'Enter whole minutes between 1 and 180.';
    S.timer = { focus: v[0], short: v[1], long: v[2] }; save(); setMode(T.mode); toast('Timer updated'); }),
  'c-add': () => openForm('Add course', CF, { color: '#6d4aff' }, x => { S.courses.push({ id: uid(), ...x }); commit('Added course ' + x.name); }),
  'c-edit': d => { const c = byId(S.courses, d.id); openForm('Edit course', CF, c, x => { Object.assign(c, x); commit('Updated ' + x.name); }, () => ask(`Delete "${c.name}"? Its assignments and notes stay, filed under General.`, () => { S.courses = S.courses.filter(y => y !== c); commit('Deleted course ' + c.name); })); },
  name: () => openForm('Your name', [['name', 'Name', 'text', 1]], S, x => { S.name = x.name; save(); render(); toast('Name saved'); }),
  reset: () => ask('This replaces all your data with the sample data.', () => { Store.clear(); S = buildSeed(); save(); stopTimer(); T.left = dur(T.mode); render(); toast('Demo data restored'); }, 'Reset')
});
const CF = [['name', 'Course name', 'text', 1], ['desc', 'Description', 'text'], ['color', 'Color', 'color']];

/* ---------- Events and router ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b) { A[b.dataset.act]?.(b.dataset); return; }
  if (e.target === modal || e.target.closest('[data-close]')) closeSheet();
  if (e.target.closest('#nav a')) document.body.classList.remove('nav');
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSheet(); document.body.classList.remove('nav'); } });
document.addEventListener('input', e => {
  const t = e.target, f = t.dataset.f, n = t.dataset.n;
  if (t.name === 'opt') U.ans[U.qi] = +t.value;
  else if (f === 'tcr') U.tcr = t.value;
  else if (f) { U[f] = t.value; FILL[U.route]?.(); }
  else if (n && note()) { const x = note(); x[n] = t.value; x.updated = Date.now(); save(); FILL.notes(); $('#saved').textContent = 'Saved ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
});

function render() {
  U.route = location.hash.slice(1); if (!V[U.route]) U.route = 'dashboard';
  const enter = U.last !== U.route; U.last = U.route;
  $('#view').innerHTML = `<div class="page${enter ? ' enter' : ''}">${V[U.route]()}</div>`;
  FILL[U.route]?.(); if (U.route === 'timer') paint();
  document.querySelectorAll('#nav a').forEach(a => a.dataset.r === U.route ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  $('#who').textContent = S.name; $('#av').textContent = (S.name[0] || 'S').toUpperCase();
  if (enter) window.scrollTo(0, 0);
}
$('#nav').innerHTML = NAV.map(([r, l]) => `<a href="#${r}" data-r="${r}">${ic(r)}<span>${l}</span></a>`).join('');
window.addEventListener('hashchange', render);
render();
})();
