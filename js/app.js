(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var T = function (k) { return I18N.t(k); };
  var CFG = window.CRM_CONFIG || {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ORDER = ['home', 'tasks', 'attend', 'leaves', 'clients', 'resign', 'me'];
  var me = null, profiles = [], D = { tasks: [], task_comments: [], attendance: [], notifications: [], decisions: [], task_ack: [], stars: [], broadcasts: [], leaves: [], resignations: [], clients: [] };
  var cur = 0, dial = null, scope = 'mine', filters = { tasks: 'all', leaves: 'all', clients: 'all', q: '' };
  var isMgr = function () { return me && (me.role === 'admin' || me.role === 'manager'); };
  var nameOf = function (id) { var p = profiles.filter(function (x) { return x.id === id; })[0]; return p ? p.name || p.email : '?'; };

  /* ---------- helpers ---------- */
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 2200); }
  function pill(cls, txt) { return '<span class="pill ' + esc(cls) + '">' + esc(txt) + '</span>'; }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5) + 1; }
  function applyText(root) { [].forEach.call((root || document).querySelectorAll('[data-t]'), function (n) { n.textContent = T(n.getAttribute('data-t')); }); }
  function options(list, prefix, sel) { return list.map(function (v) { return '<option value="' + v + '"' + (v === sel ? ' selected' : '') + '>' + esc(T(prefix + v)) + '</option>'; }).join(''); }
  function mineOrAll(rows, key) { return (isMgr() && scope === 'all') ? rows : rows.filter(function (r) { return r[key || 'user_id'] === me.id; }); }
  function scopeBar() { return isMgr() ? '<div class="chips"><button class="chip' + (scope === 'mine' ? ' on' : '') + '" data-scope="mine">' + T('mine') + '</button><button class="chip' + (scope === 'all' ? ' on' : '') + '" data-scope="all">' + T('team') + '</button></div>' : ''; }
  function chipBar(name, vals, prefix) { return '<div class="chips">' + ['all'].concat(vals).map(function (v) { return '<button class="chip' + (filters[name] === v ? ' on' : '') + '" data-f="' + name + ':' + v + '">' + (v === 'all' ? T('all') : T(prefix + v)) + '</button>'; }).join('') + '</div>'; }

  /* ---------- sheet ---------- */
  var sheetOpen = false;
  function openSheet(html) { $('#sheetin').innerHTML = html; $('#sheet').classList.add('on'); $('#sheetbg').classList.add('on'); sheetOpen = true; $('#sheet').scrollTop = 0; }
  function closeSheet() { $('#sheet').classList.remove('on'); $('#sheetbg').classList.remove('on'); sheetOpen = false; }
  $('#sheetbg').addEventListener('click', closeSheet);
  (function () { var sh = $('#sheet'), y0 = 0, dy = 0, on = false;
    sh.addEventListener('touchstart', function (e) { if (sh.scrollTop <= 0) { y0 = e.touches[0].clientY; on = true; dy = 0; } }, { passive: true });
    sh.addEventListener('touchmove', function (e) { if (!on) return; dy = e.touches[0].clientY - y0; if (dy > 0) { sh.style.transition = 'none'; sh.style.transform = 'translateY(' + dy + 'px)'; } }, { passive: true });
    sh.addEventListener('touchend', function () { if (!on) return; on = false; sh.style.transition = ''; sh.style.transform = ''; if (dy > 110) closeSheet(); }); })();

  /* ---------- voice, star, broadcast ---------- */
  var MIC = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  var Voice = (function () {
    var rec = null, chunks = [], t0 = 0, timer = null, stream = null;
    return {
      supported: function () { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); },
      start: function (tick) { return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) { stream = s; var mt = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].filter(function (m) { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m); })[0]; rec = new MediaRecorder(s, mt ? { mimeType: mt, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 }); chunks = []; rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); }; rec.start(); t0 = Date.now(); timer = setInterval(function () { tick(Math.round((Date.now() - t0) / 1000)); }, 250); }); },
      stop: function () { return new Promise(function (res) { clearInterval(timer); rec.onstop = function () { stream.getTracks().forEach(function (t) { t.stop(); }); var fr = new FileReader(), secs = Math.round((Date.now() - t0) / 1000); fr.onload = function () { res({ data: fr.result, secs: secs }); }; fr.readAsDataURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); }; rec.stop(); }); }
    };
  })();
  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function voiceBox(id) { return '<div class="vbox" id="' + id + '"><button type="button" class="btn" data-vb>' + MIC + T('voice.rec') + '</button><span class="vt"></span></div>'; }
  function bindVoice(id, onReady) {
    var box = $('#' + id), btn = box.querySelector('[data-vb]'), vt = box.querySelector('.vt'), on = false;
    if (!Voice.supported()) { btn.disabled = true; vt.textContent = T('voice.none'); return; }
    btn.onclick = async function () {
      if (!on) { try { await Voice.start(function (s) { vt.textContent = fmt(s); if (s >= 45) btn.click(); }); } catch (e) { toast(T('voice.deny')); return; } on = true; btn.className = 'btn rec'; btn.textContent = T('voice.stop'); }
      else { on = false; var r = await Voice.stop(); btn.className = 'btn'; btn.innerHTML = MIC + T('voice.rec'); vt.textContent = T('voice.ok') + ' ' + fmt(r.secs); onReady(r); }
    };
  }
  function weekStart() { var x = new Date(); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() - 6 + 7) % 7)); return x.toISOString().slice(0, 10); }
  function curStar() { return D.stars.filter(function (s) { return s.week_start === weekStart(); })[0]; }
  function allIds() { return profiles.map(function (p) { return p.id; }); }
  function banners() {
    var h = '', bc = D.broadcasts.filter(function (b) { return Date.now() - new Date(b.created_at) < 48 * 36e5; })[0], st = curStar();
    if (bc) h += '<div class="bc' + (bc.urgent ? ' urgent' : '') + '"><span class="stamp bcs">' + (bc.urgent ? T('bc.urgent') : T('bc.h')) + '</span><div class="l">' + T('bc.h') + (bc.urgent ? ' · ' + T('bc.urgent') : '') + '</div><div>' + esc(bc.body) + '</div><small style="color:var(--ash)">' + esc(nameOf(bc.from_user)) + ' · ' + I18N.ago(bc.created_at) + '</small></div>';
    if (st) h += '<div class="starcard"><img src="assets/owl-head.webp" alt=""><div><small>' + T('star.badge') + '</small><div class="t" style="font-weight:800;font-size:18px">' + esc(nameOf(st.user_id)) + ' ' + OWLM + '</div></div></div>';
    if (isMgr()) h += '<div class="acts" style="margin:0 0 12px"><button class="btn" data-act="bcast">' + T('bc.new') + '</button><button class="btn" data-act="star">' + T('star.pick') + '</button></div>';
    return h;
  }
  function bcastSheet() {
    openSheet('<h2>' + T('bc.h') + '</h2><label class="fld"><textarea id="bcb" placeholder="' + T('bc.ph') + '"></textarea></label><label class="row" style="justify-content:flex-start;margin-bottom:12px"><input type="checkbox" id="bcu" style="width:auto"> ' + T('bc.urgent') + '</label><button class="btn big" id="ok">' + T('send') + '</button>');
    $('#ok').onclick = async function () { var body = f('#bcb').trim(); if (!body) return $('#bcb').focus(); var urg = $('#bcu').checked; var ok = await act(async function () { await Store.insert('broadcasts', { from_user: me.id, body: body, urgent: urg }); await notify(allIds(), 'broadcast', 'home', body.slice(0, 90)); }, 'bc.sent'); if (ok) closeSheet(); };
  }
  function starSheet() {
    var st = curStar();
    openSheet('<h2>' + T('star.pick') + '</h2>' + profiles.filter(function (p) { return p.role !== 'admin'; }).map(function (p) { return '<button class="item" data-pickstar="' + p.id + '"><div class="t">' + esc(p.name || p.email) + (st && st.user_id === p.id ? ' ★' : '') + '</div></button>'; }).join(''));
  }
  async function pickStar(uid) { var old = curStar(); var ok = await act(async function () { if (old) await Store.remove('stars', old.id); await Store.insert('stars', { user_id: uid, week_start: weekStart(), picked_by: me.id }); await notify([uid], 'star', 'home', ''); }, 'star.set'); if (ok) closeSheet(); }

  /* ---------- notifications, decisions, profile, report ---------- */
  var admins = function () { return profiles.filter(function (p) { return p.role === 'admin'; }).map(function (p) { return p.id; }); };
  function notify(ids, kind, ref, subject) {
    var seen = {}; return Promise.all(ids.filter(function (x) { if (!x || x === me.id || seen[x]) return false; seen[x] = 1; return true; }).map(function (uid) { return Store.insert('notifications', { user_id: uid, kind: kind, ref: ref, subject: subject || '', actor: me.id, read: false }); }));
  }
  var unread = function () { return D.notifications.filter(function (n) { return n.user_id === me.id && !n.read; }); };
  function bell() { var n = unread().length, b = $('#belln'); b.hidden = !n; b.textContent = n > 9 ? '9+' : n; $('#burgerdot').hidden = !n; }
  function notifText(n) { var sub = n.subject; if (n.kind === 'leave_req') sub = T('lt.' + n.subject); else if (n.kind === 'leave_decided' || n.kind === 'resign_decided') sub = T('d.' + n.subject); return esc(nameOf(n.actor)) + ' ' + T('n.' + n.kind) + (sub ? ': ' + esc(sub) : ''); }
  function notifCenter() {
    var rows = D.notifications.filter(function (n) { return n.user_id === me.id; }).slice(0, 40);
    openSheet('<h2>' + T('bell') + '</h2>' + (rows.length ? rows.map(function (n) { return '<button class="item' + (n.read ? '' : ' unread') + '" data-nref="' + esc(n.ref || 'home') + '"><div class="t">' + notifText(n) + '</div><div class="m"><span>' + I18N.ago(n.created_at) + '</span></div></button>'; }).join('') + (unread().length ? '<button class="btn ghost" id="nread">' + T('n.markread') + '</button>' : '') : EMPTY()));
    if ($('#nread')) $('#nread').onclick = function () { act(function () { return Promise.all(unread().map(function (n) { return Store.update('notifications', n.id, { read: true }); })); }).then(closeSheet); };
  }
  $('#bell').onclick = function () { closeMenu(); notifCenter(); };
  function acked(t, uid) { return D.task_ack.some(function (x) { return x.task_id === t.id && x.user_id === uid; }); }
  var OWLM = '<svg class="owlm" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 5l5 3 4-2 4 2 5-3-1 8-4 7h-8l-4-7z" fill="#e11827"/><circle cx="9" cy="11" r="2.2" fill="#060608"/><circle cx="15" cy="11" r="2.2" fill="#060608"/></svg>';
  function wave(seed) { var w = document.createElement('div'), s = 0, i, h = ''; w.className = 'wv'; String(seed).split('').forEach(function (c) { s = (s * 31 + c.charCodeAt(0)) % 9973; });
    for (i = 0; i < 32; i++) { s = (s * 131 + 17) % 9973; h += '<i style="height:' + (18 + s % 70) + '%"></i>'; } w.innerHTML = h; return w; }
  function stamp(s) { return s === 'approved' || s === 'rejected' ? '<span class="stamp ' + (s === 'approved' ? 'ok' : 'no') + '">' + T('ls.' + s) + '</span>' : ''; }
  function eyeState() {
    if (!dial || !dial.setLid || !me) return;
    var on = D.attendance.some(function (r) { return r.user_id === me.id && !r.check_out; });
    var soon = D.tasks.some(function (t) { return t.status !== 'done' && (t.assigned_to === me.id || t.team) && t.due_date && t.due_date <= new Date(Date.now() + 864e5).toISOString().slice(0, 10); });
    dial.setLid(!on ? .72 : soon ? .3 : 0);
  }
  function isLate(t) { return t.due_date && t.status !== 'done' && t.due_date < new Date().toISOString().slice(0, 10); }
  function isSoon(t) { var d = new Date().toISOString().slice(0, 10), tm = new Date(Date.now() + 864e5).toISOString().slice(0, 10); return t.due_date && t.status !== 'done' && t.due_date >= d && t.due_date <= tm; }
  function logDecision(kind, row, st, note) {
    return Store.insert('decisions', { kind: kind === 'leaves' ? 'leave' : 'resignation', ref_id: row.id, subject_user: row.user_id, decided_by: me.id, decision: st, note: note || '' })
      .then(function () { return notify([row.user_id], kind === 'leaves' ? 'leave_decided' : 'resign_decided', kind === 'leaves' ? 'leaves' : 'resign', st); });
  }
  function hoursOf(rows) { return rows.reduce(function (s, r) { return s + ((r.check_out ? new Date(r.check_out) : new Date()) - new Date(r.check_in)) / 36e5; }, 0); }
  function profileSheet(uid) {
    var p = profiles.filter(function (x) { return x.id === uid; })[0]; if (!p) return;
    var since = new Date(Date.now() - 30 * 864e5).toISOString();
    var att = D.attendance.filter(function (r) { return r.user_id === uid && r.check_in >= since; });
    var days = {}; att.forEach(function (r) { days[r.check_in.slice(0, 10)] = 1; });
    var mine = D.tasks.filter(function (t) { return t.assigned_to === uid; });
    var done = mine.filter(function (t) { return t.status === 'done'; }), open = mine.filter(function (t) { return t.status !== 'done'; }), late = open.filter(isLate);
    var used = D.leaves.filter(function (l) { return l.user_id === uid && l.type === 'annual' && (l.status === 'approved' || l.status === 'pending'); }).reduce(function (s, l) { return s + (l.days || 0); }, 0), tot = CFG.annualLeaveDays || 21;
    openSheet('<h2>' + esc(p.name) + '</h2>' + (curStar() && curStar().user_id === uid ? '<div class="starcard"><img src="assets/owl-head.webp" alt=""><div><small>' + T('star.badge') + '</small></div></div>' : '') + '<p class="sub" dir="ltr" style="text-align:start">' + esc(p.email) + ' · ' + T('role.' + p.role) + '</p>' +
      '<div class="two3"><div class="kpi"><b>' + done.length + '</b><span>' + T('prof.done') + '</span></div><div class="kpi"><b>' + open.length + '</b><span>' + T('prof.open2') + '</span></div><div class="kpi red"><b>' + late.length + '</b><span>' + T('prof.late') + '</span></div></div>' +
      '<div class="card"><div class="row"><b>' + T('prof.leave') + '</b><span>' + Math.max(0, tot - used) + ' ' + T('balance.of') + ' ' + tot + '</span></div><div class="bar"><i style="width:' + Math.min(100, used / tot * 100) + '%"></i></div></div>' +
      '<div class="card"><b>' + T('prof.att') + '</b><div class="m" style="margin-top:6px;color:var(--ash)">' + Object.keys(days).length + ' ' + T('prof.days') + ' · ' + hoursOf(att).toFixed(1) + ' ' + T('prof.hours') + '</div></div>' +
      '<h2>' + T('prof.tasks') + '</h2>' + (done.length ? done.slice(0, 5).map(function (t) { return '<div class="item" style="cursor:default"><div class="t">' + esc(t.title) + '</div><div class="m"><span>' + I18N.ago(t.updated_at || t.created_at) + '</span></div></div>'; }).join('') : EMPTY()));
  }
  function reportData() {
    var since = new Date(Date.now() - 7 * 864e5).toISOString(), today = new Date().toISOString().slice(0, 10);
    return profiles.map(function (p) {
      var mine = D.tasks.filter(function (t) { return t.assigned_to === p.id; });
      return { name: p.name || p.email, done: mine.filter(function (t) { return t.status === 'done' && (t.updated_at || t.created_at) >= since; }).length, late: mine.filter(isLate).length, open: mine.filter(function (t) { return t.status !== 'done'; }).length,
        hours: hoursOf(D.attendance.filter(function (r) { return r.user_id === p.id && r.check_in >= since; })), lv: D.leaves.filter(function (l) { return l.user_id === p.id && l.status === 'pending'; }).length };
    });
  }
  function reportSheet() {
    var rows = reportData(), tot = rows.reduce(function (s, r) { return { done: s.done + r.done, late: s.late + r.late, hours: s.hours + r.hours, lv: s.lv + r.lv }; }, { done: 0, late: 0, hours: 0, lv: 0 });
    var line = function (r) { return r.name + ': ' + T('rep.done') + ' ' + r.done + ' · ' + T('prof.late') + ' ' + r.late + ' · ' + T('rep.hours') + ' ' + r.hours.toFixed(1) + ' · ' + T('rep.lv') + ' ' + r.lv; };
    var text = T('report') + ' (' + T('rep.period') + ')\n' + rows.map(line).join('\n') + '\n' + T('rep.tot') + ': ' + T('rep.done') + ' ' + tot.done + ' · ' + T('prof.late') + ' ' + tot.late + ' · ' + T('rep.hours') + ' ' + tot.hours.toFixed(1);
    openSheet('<div class="rp"><small>SHADOWS | WE MOVE IN SILENCE.</small><h2>' + T('report') + '</h2><p class="sub">' + T('rep.period') + '</p></div><div class="two3 rpk"><div class="kpi"><b>' + tot.done + '</b><span>' + T('rep.done') + '</span></div><div class="kpi red"><b>' + tot.late + '</b><span>' + T('prof.late') + '</span></div><div class="kpi"><b>' + tot.hours.toFixed(0) + '</b><span>' + T('rep.hours') + '</span></div></div>' +
      rows.map(function (r) { return '<div class="card"><div class="row"><b>' + esc(r.name) + '</b><span class="pill ' + (r.late ? 'urgent' : 'done') + '">' + r.late + ' ' + T('prof.late') + '</span></div><div class="m" style="color:var(--ash);margin-top:6px;font-size:13px">' + T('rep.done') + ' ' + r.done + ' · ' + r.hours.toFixed(1) + ' ' + T('prof.hours') + ' · ' + T('rep.lv') + ' ' + r.lv + '</div></div>'; }).join('') + '<button class="btn big" id="repcopy">' + T('rep.copy') + '</button>');
    $('#repcopy').onclick = function () { try { navigator.clipboard.writeText(text).then(function () { toast(T('rep.copied')); }); } catch (e) {} };
  }
  function logSheet() {
    var rows = D.decisions.slice(0, 60);
    openSheet('<h2>' + T('log') + '</h2>' + (rows.length ? rows.map(function (d) { return '<div class="item dos" style="cursor:default">' + stamp(d.decision) + '<div class="t">' + esc(nameOf(d.decided_by)) + ' ' + T('d.' + d.decision) + ' ' + T('d.' + d.kind) + ' · ' + esc(nameOf(d.subject_user)) + '</div><div class="m"><span>' + I18N.date(d.created_at) + ' ' + hm(d.created_at) + '</span>' + (d.note ? '<span>' + esc(d.note) + '</span>' : '') + '</div></div>'; }).join('') : EMPTY()));
  }

  /* ---------- data ---------- */
  async function load() {
    profiles = await Store.profiles();
    var names = ['tasks', 'task_comments', 'attendance', 'notifications', 'decisions', 'task_ack', 'stars', 'broadcasts', 'leaves', 'resignations', 'clients'];
    var res = await Promise.all(names.map(function (n) { return Store.list(n); }));
    names.forEach(function (n, i) { D[n] = res[i]; });
  }
  async function act(fn, okMsg) { try { await fn(); await load(); render(0); if (okMsg) toast(T(okMsg)); return true; } catch (e) { toast(T('fail')); return false; } }

  /* ---------- panels ---------- */
  var EMPTY = function () { return '<div class="empty e-' + (ORDER[cur] || 'home') + '"><img src="assets/' + (['tasks', 'clients', 'me'].indexOf(ORDER[cur]) > -1 ? 'owl-head' : 'owl-wings') + '.webp" alt=""><div>' + T('none') + '</div><small>SILENT WORK.</small></div>'; };
  var ENNAME = { home: 'DASHBOARD', tasks: 'TASKS', attend: 'ATTENDANCE', leaves: 'LEAVES', clients: 'CLIENTS', resign: 'RESIGNATIONS', me: 'PROFILE' };
  var V = {};
  V.home = function () {
    var myOpen = D.tasks.filter(function (t) { return (t.assigned_to === me.id || (t.team && t.created_by !== me.id && !acked(t, me.id))) && t.status !== 'done'; }).length;
    var pend = D.leaves.filter(function (l) { return l.status === 'pending' && (isMgr() || l.user_id === me.id); }).length;
    var act = D.clients.filter(function (c) { return c.status === 'active'; }).length;
    var allOpen = D.tasks.filter(function (t) { return t.status !== 'done'; }).length;
    var need = isMgr() ? pend + D.resignations.filter(function (r) { return r.status === 'pending'; }).length : 0;
    var used = D.leaves.filter(function (l) { return l.user_id === me.id && l.type === 'annual' && l.status !== 'rejected' && l.status !== 'cancelled'; }).reduce(function (a, l) { return a + (l.days || 0); }, 0);
    var tot = CFG.annualLeaveDays || 21, left = Math.max(0, tot - used);
    var h = '<h1>' + T('hi') + ' ' + esc((me.name || '').split(' ')[0]) + '</h1><p class="sub">' + T('hi.sub') + '</p>' + banners() + '<div class="grid">' +
      '<div class="kpi red"><b>' + (isMgr() ? need : myOpen) + '</b><span>' + (isMgr() ? T('k.pending') : T('k.tasks')) + '</span></div>' +
      '<div class="kpi"><b>' + (isMgr() ? allOpen : pend) + '</b><span>' + (isMgr() ? T('k.tasks') : T('k.leaves')) + '</span></div>' +
      '<div class="kpi"><b>' + act + '</b><span>' + T('k.clients') + '</span></div>' +
      '<div class="kpi"><b>' + left + '</b><span>' + T('k.balance') + ' (' + T('days') + ')</span></div></div>';
    var ev = [];
    D.tasks.forEach(function (t) { if (isMgr() || t.assigned_to === me.id || t.created_by === me.id) ev.push({ at: t.created_at, p: 'tasks', txt: t.title, who: t.assigned_to || t.created_by, st: t.status, k: 'st.' }); });
    D.leaves.forEach(function (l) { if (isMgr() || l.user_id === me.id) ev.push({ at: l.created_at, p: 'leaves', txt: T('lt.' + l.type) + ' · ' + l.days + ' ' + T('dayn'), who: l.user_id, st: l.status, k: 'ls.' }); });
    D.resignations.forEach(function (r) { ev.push({ at: r.created_at, p: 'resign', txt: T('resign'), who: r.user_id, st: r.status, k: 'rs.' }); });
    ev.sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); });
    var att = D.tasks.filter(function (t) { return (isLate(t) || isSoon(t)) && (isMgr() || t.assigned_to === me.id || (t.team && !acked(t, me.id))); }).sort(function (x, y) { return x.due_date.localeCompare(y.due_date); }).slice(0, 5);
    if (att.length) h += '<h2>' + T('attn') + '</h2>' + att.map(function (t) { var l = isLate(t); return '<button class="item ' + (l ? 'late' : 'soon') + '" data-task="' + t.id + '"><div class="t">' + esc(t.title) + '</div><div class="m">' + pill(l ? 'urgent' : 'high', T(l ? 'overdue' : 'soon')) + '<span>' + (t.team ? T('whole') : esc(nameOf(t.assigned_to))) + '</span><span>' + I18N.date(t.due_date) + '</span></div></button>'; }).join('');
    if (isMgr()) h += '<button class="item" data-act="report" style="margin-top:12px"><div class="t">' + T('report') + '</div><div class="m"><span>' + T('rep.line') + '</span></div></button>';
    h += '<h2>' + T('recent') + '</h2>';
    h += ev.length ? ev.slice(0, 8).map(function (e) { return '<button class="item" data-go="' + e.p + '"><div class="t">' + esc(e.txt) + '</div><div class="m">' + pill(e.st, T(e.k + e.st)) + '<span>' + esc(nameOf(e.who)) + '</span><span>' + I18N.ago(e.at) + '</span></div></button>'; }).join('') : EMPTY();
    return h;
  };
  V.tasks = function () {
    var rows = D.tasks.filter(function (t) { return (isMgr() && scope === 'all') || t.assigned_to === me.id || t.created_by === me.id || t.team; }).filter(function (t) { return filters.tasks === 'all' || t.status === filters.tasks; });
    var po = { urgent: 0, high: 1, normal: 2, low: 3 };
    rows.sort(function (a, b) { return (a.status === 'done') - (b.status === 'done') || po[a.priority] - po[b.priority] || (a.due_date || '9').localeCompare(b.due_date || '9'); });
    var h = '<h1>' + T('tasks') + '</h1>' + scopeBar() + chipBar('tasks', ['todo', 'in_progress', 'done'], 'st.');
    h += rows.length ? rows.map(function (t) { var late = isLate(t), soon = isSoon(t); return '<button class="item' + (late ? ' late' : soon ? ' soon' : '') + '" data-task="' + t.id + '"><div class="t">' + esc(t.title) + '</div><div class="m">' + pill(t.status, T('st.' + t.status)) + pill(t.priority, T('pr.' + t.priority)) + (late ? pill('urgent', T('overdue')) : soon ? pill('high', T('soon')) : '') + (t.team ? '<span>' + T('whole') + ' · ' + D.task_ack.filter(function (x) { return x.task_id === t.id; }).length + '/' + Math.max(1, profiles.length - 1) + '</span>' : t.assigned_to ? '<span>' + T('to') + ' ' + esc(nameOf(t.assigned_to)) + '</span>' : '') + (t.due_date ? '<span' + (late ? ' style="color:#ff6b74"' : '') + '>' + I18N.date(t.due_date) + '</span>' : '') + '</div></button>'; }).join('') : EMPTY();
    return h;
  };
  function hm(s) { return new Date(s).toLocaleTimeString(I18N.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { hour: '2-digit', minute: '2-digit' }); }
  function dur(a, b) { var m = Math.max(0, Math.round(((b ? new Date(b) : new Date()) - new Date(a)) / 60000)); return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2) + ' ' + T('hrs'); }
  var attFilter = 'all';
  V.attend = function () {
    var mine = D.attendance.filter(function (r) { return r.user_id === me.id; }), open = mine.filter(function (r) { return !r.check_out; })[0];
    var h = '<h1>' + T('attend') + '</h1><div class="card" style="text-align:center"><div style="color:var(--ash);margin-bottom:6px">' + (open ? T('att.since') + ' ' + hm(open.check_in) + ' · ' + dur(open.check_in) : T('att.out')) + '</div><button class="btn big' + (open ? ' danger' : '') + '" id="attbtn">' + T(open ? 'att.checkout' : 'att.checkin') + '</button></div>';
    if (isMgr()) {
      var here = D.attendance.filter(function (r) { return !r.check_out; });
      h += '<h2>' + T('att.now') + ' (' + here.length + ')</h2>' + (here.length ? here.map(function (r) { return '<div class="card row"><b>' + esc(nameOf(r.user_id)) + '</b><span style="color:var(--ash)">' + hm(r.check_in) + ' · ' + dur(r.check_in) + '</span></div>'; }).join('') : EMPTY());
      h += '<h2>' + T('att.hist') + '</h2><select id="attf" style="margin-bottom:10px"><option value="all">' + T('team') + '</option>' + profiles.map(function (p) { return '<option value="' + p.id + '"' + (attFilter === p.id ? ' selected' : '') + '>' + esc(p.name || p.email) + '</option>'; }).join('') + '</select>';
    } else h += '<h2>' + T('att.hist') + '</h2>';
    var rows = D.attendance.filter(function (r) { return isMgr() ? (attFilter === 'all' || r.user_id === attFilter) : r.user_id === me.id; }).sort(function (a, b) { return b.check_in.localeCompare(a.check_in); }).slice(0, 40);
    h += rows.length ? rows.map(function (r) { return '<div class="item" style="cursor:default"><div class="t">' + (isMgr() ? esc(nameOf(r.user_id)) + ' · ' : '') + I18N.date(r.check_in) + '</div><div class="m"><span dir="ltr">' + hm(r.check_in) + ' → ' + (r.check_out ? hm(r.check_out) : '…') + '</span>' + pill(r.check_out ? 'done' : 'active', r.check_out ? dur(r.check_in, r.check_out) : T('att.in')) + '</div></div>'; }).join('') : EMPTY();
    return h;
  };
  V.leaves = function () {
    var used = {}; D.leaves.filter(function (l) { return l.user_id === me.id && l.status !== 'rejected' && l.status !== 'cancelled'; }).forEach(function (l) { used[l.type] = (used[l.type] || 0) + (l.days || 0); });
    var tot = CFG.annualLeaveDays || 21, u = used.annual || 0;
    var h = '<h1>' + T('leaves') + '</h1><div class="card"><div class="row"><b>' + T('lt.annual') + '</b><span>' + Math.max(0, tot - u) + ' ' + T('balance.of') + ' ' + tot + ' ' + T('days') + '</span></div><div class="bar"><i style="width:' + Math.min(100, u / tot * 100) + '%"></i></div><small style="color:var(--ash)">' + u + ' ' + T('days') + ' ' + T('used') + (used.sick ? ' · ' + T('lt.sick') + ' ' + used.sick : '') + (used.unpaid ? ' · ' + T('lt.unpaid') + ' ' + used.unpaid : '') + (used.emergency ? ' · ' + T('lt.emergency') + ' ' + used.emergency : '') + '</small></div>';
    var rows = mineOrAll(D.leaves).filter(function (l) { return filters.leaves === 'all' || l.status === filters.leaves; });
    h += scopeBar() + chipBar('leaves', ['pending', 'approved', 'rejected', 'cancelled'], 'ls.');
    h += rows.length ? rows.map(function (l) { return '<button class="item" data-leave="' + l.id + '"><div class="t">' + T('lt.' + l.type) + ' · ' + l.days + ' ' + T('dayn') + '</div><div class="m">' + pill(l.status, T('ls.' + l.status)) + '<span dir="ltr">' + I18N.date(l.start_date) + ' → ' + I18N.date(l.end_date) + '</span>' + (scope === 'all' && isMgr() ? '<span>' + esc(nameOf(l.user_id)) + '</span>' : '') + '</div></button>'; }).join('') : EMPTY();
    return h;
  };
  V.clients = function () {
    var q = filters.q.toLowerCase();
    var rows = D.clients.filter(function (c) { return (filters.clients === 'all' || c.status === filters.clients) && (!q || [c.name, c.contact, c.phone, c.email].join(' ').toLowerCase().indexOf(q) > -1); });
    var h = '<h1>' + T('clients') + '</h1><input id="q" type="search" placeholder="' + T('search') + '" value="' + esc(filters.q) + '" style="margin-bottom:10px">' + chipBar('clients', ['lead', 'active', 'paused', 'closed'], 'cs.');
    h += rows.length ? rows.map(function (c) { return '<button class="item" data-client="' + c.id + '"><div class="t">' + esc(c.name) + '</div><div class="m">' + pill(c.status, T('cs.' + c.status)) + (c.contact ? '<span>' + esc(c.contact) + '</span>' : '') + (c.phone ? '<span dir="ltr">' + esc(c.phone) + '</span>' : '') + '</div></button>'; }).join('') : EMPTY();
    return h;
  };
  V.resign = function () {
    var rows = mineOrAll(D.resignations);
    var h = '<h1>' + T('resign') + '</h1><p class="sub">' + T('resign.intro') + '</p>' + scopeBar();
    h += '<button class="btn" data-new="resign" style="margin-bottom:14px">' + T('new.resign') + '</button>';
    h += rows.length ? rows.map(function (r) { return '<button class="item" data-resign="' + r.id + '"><div class="t">' + T('resign.last') + ': ' + I18N.date(r.last_day) + '</div><div class="m">' + pill(r.status, T('rs.' + r.status)) + '<span>' + esc(nameOf(r.user_id)) + '</span><span>' + I18N.ago(r.created_at) + '</span></div></button>'; }).join('') : EMPTY();
    return h;
  };
  V.me = function () {
    var h = '<h1>' + esc(me.name) + '</h1><p class="sub" dir="ltr" style="text-align:start">' + esc(me.email) + ' · ' + T('role.' + me.role) + '</p>' +
      '<div class="acts" style="margin:0 0 14px"><button class="btn" id="mlang">' + T('lang') + '</button><button class="btn danger" id="mout">' + T('logout') + '</button></div><p class="sub">' + T('install') + '</p>';
    h += '<button class="item" data-prof="' + me.id + '">' + T('prof.open') + '</button>';
    if (isMgr()) {
      h += '<div class="acts" style="margin:0 0 6px"><button class="btn" data-act="report">' + T('report') + '</button><button class="btn" data-act="log">' + T('log') + '</button></div>';
      h += '<h2>' + T('team.h') + '</h2>' + profiles.map(function (p) {
        var sel = pill(p.role, T('role.' + p.role));
        return '<button class="item row" data-prof="' + p.id + '"><div><div class="t">' + esc(p.name) + '</div><small dir="ltr" style="color:var(--ash)">' + esc(p.email) + '</small></div>' + sel + '</button>'; }).join('');
    }
    return h;
  };

  /* ---------- render + transitions ---------- */
  var inPanel = false, QUICK = { tasks: 1, leaves: 1, clients: 1, resign: 1 };
  function render(dir) {
    if (!inPanel) return;
    var stage = $('#stage'), id = ORDER[cur], old = [].slice.call(stage.querySelectorAll('.panel')).pop();
    var p = document.createElement('div'); p.className = 'panel'; p.setAttribute('data-n', ('0' + (cur + 1)).replace(/[0-9]/g, function (c) { return document.documentElement.lang === 'ar' ? AD[c] : c; })); p.innerHTML = '<div class="eyebrow"><span>0' + (cur + 1) + ' / ' + (document.documentElement.lang === 'ar' ? T(id) : ENNAME[id]) + '</span></div>' + V[id]();
    var keep = old && old.dataset.id === id ? old.scrollTop : 0; p.dataset.id = id; p.dataset.n = (I18N.lang === 'ar' ? '٠' : '0') + (I18N.lang === 'ar' ? AD[cur + 1] : (cur + 1));
    [].slice.call(stage.querySelectorAll('.panel')).forEach(function (x) { if (x !== old) x.remove(); });
    stage.appendChild(p); p.scrollTop = keep;
    $('#addb').hidden = !QUICK[id]; bell();
    if (old) {
      if (dir && dir !== 'open' && old.animate) {
        var x = dir * 60; old.style.pointerEvents = 'none';
        old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(' + (-x) + 'px)', opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' }).onfinish = function () { old.remove(); };
        p.animate([{ transform: 'translateX(' + x + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1)' });
      } else old.remove();
    } else if (dir === 'open' && p.animate) p.animate([{ transform: 'scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
  }
  function openPanel(anim) { if (!inPanel) { history.pushState({ p: 1 }, ''); } inPanel = true; document.body.classList.add('inpanel'); render(anim || 'open'); }
  function showHub(noBack) {
    if (!inPanel) return; inPanel = false; document.body.classList.remove('inpanel'); setTimeout(function () { owlXf(intro.step, false); }, 0); $('#addb').hidden = true;
    var stage = $('#stage'); [].slice.call(stage.querySelectorAll('.panel')).forEach(function (o) { if (o.animate) { o.style.pointerEvents = 'none'; o.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.04)' }], { duration: 240, fill: 'forwards' }).onfinish = function () { o.remove(); }; } else o.remove(); });
    if (dial) dial.set(cur); eyeState();
    if (window.__fx && dial && dial.fx) { window.__fx = 0; setTimeout(dial.fx, 450); }
  }
  window.addEventListener('popstate', function () { if (inPanel) showHub(true); });
  function goto(i, dir) {
    if (!inPanel) { cur = i; openPanel('open'); if (dial) dial.set(i); return; }
    if (i === cur) return; var d = dir || (i > cur ? 1 : -1); if (document.documentElement.dir === 'rtl') d = -d; cur = i; render(d); if (dial) dial.set(i);
  }

  /* ---------- intro: poster owl, tap to move in until the eye becomes the lens ---------- */
  var AD = '٠١٢٣٤٥٦٧٨٩', intro = { step: 4, N: 4 }, OW = 2064, FACE = [1032, 400], EYE = [959, 519], EYERING = 193;
  function arDig(root) {
    if (I18N.lang !== 'ar' || !root) return; var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) { var v = n.nodeValue; if (/[0-9]/.test(v) && v.indexOf('@') < 0 && !/^[\s+\d()-]{7,}$/.test(v) && !(n.parentNode.closest && n.parentNode.closest('script,style,textarea,input'))) list.push(n); }
    list.forEach(function (t) { t.nodeValue = t.nodeValue.replace(/[0-9]/g, function (d) { return AD[d]; }); });
  }
  new MutationObserver(function (ms) { ms.forEach(function (m) { if (m.type === 'characterData') arDig(m.target.parentNode); else m.addedNodes.forEach(function (x) { if (x.nodeType === 1) arDig(x); else if (x.nodeType === 3) arDig(x.parentNode); }); }); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  function owlXf(step, anim) {
    var img = $('#owl'), d = $('#dial').getBoundingClientRect(); if (!d.width) return;
    var cx = d.left + d.width / 2, cy = d.top + d.height / 2, S0 = Math.min(innerWidth * 1.0 / OW, innerHeight * .8 / 1460), Sf = $('#dial').offsetWidth * .5 / EYERING;
    var t = step / intro.N, S = S0 * Math.pow(Sf / S0, t), e = Math.pow(t, 1.6), px = FACE[0] + (EYE[0] - FACE[0]) * e, py = FACE[1] + (EYE[1] - FACE[1]) * e;
    img.style.transition = anim ? 'transform .9s cubic-bezier(.45,0,.2,1)' : 'none';
    img.style.transform = 'translate3d(' + (cx - px * S).toFixed(1) + 'px,' + (cy - py * S).toFixed(1) + 'px,0) scale(' + S.toFixed(4) + ')';
  }
  function introHint() {
    var s = intro.step, dots = ''; for (var i = 0; i < intro.N; i++) dots += '<i' + (i < s ? ' class="on"' : '') + '></i>';
    $('#introhint').innerHTML = '<span>' + T('intro.tap') + '</span><div class="dots">' + dots + '</div>';
    $('#introbrand').style.opacity = s === 0 ? 1 : 0;
  }
  function startIntro() {
    intro.step = 0; document.body.classList.add('intro'); owlXf(0, false); introHint();
  }
  $('#intro').onclick = function () {
    if (intro.step >= intro.N) return; intro.step++; owlXf(intro.step, true); introHint();
    if (intro.step >= intro.N) setTimeout(function () { document.body.classList.remove('intro'); }, 900);
  };
  window.addEventListener('resize', function () { if (!inPanel && me) owlXf(intro.step, false); });

  /* menu */
  function buildMenu() {
    $('#menulist').innerHTML = '<button class="menuitem hub" data-mi="hub"><span class="mn">00</span><span class="mi">' + T('lens') + '</span></button>' + ORDER.map(function (id, i) { return '<button class="menuitem' + (inPanel && cur === i ? ' on' : '') + '" data-mi="' + i + '"><span class="mn">0' + (i + 1) + '</span><span class="mi">' + T(id) + '</span></button>'; }).join('');
    $('#bellt').textContent = T('bell'); $('#mout2').textContent = T('logout');
  }
  function openMenu() { buildMenu(); $('#menu').classList.add('on'); $('#menubg').classList.add('on'); }
  function closeMenu() { $('#menu').classList.remove('on'); $('#menubg').classList.remove('on'); }
  $('#burger').onclick = openMenu; $('#menuclose').onclick = closeMenu; $('#menubg').onclick = closeMenu;
  $('#menulist').onclick = function (e) { var b = e.target.closest('[data-mi]'); if (!b) return; closeMenu(); var v = b.dataset.mi; if (v === 'hub') { if (inPanel) { history.back(); } } else goto(+v); };
  $('#mout2').onclick = function () { closeMenu(); logout(); };
  $('#addb').onclick = function () { quickAdd(); };

  /* ---------- forms ---------- */
  function f(sel) { return ($(sel, $('#sheetin')) || {}).value || ''; }
  function newTask() {
    var mgr = isMgr(), pv = null;
    var who = mgr ? '<label class="fld"><span>' + T('f.assignee') + '</span><select id="fw"><option value="*">' + T('whole') + '</option>' + profiles.map(function (p) { return '<option value="' + p.id + '"' + (p.id === me.id ? ' selected' : '') + '>' + esc(p.name || p.email) + '</option>'; }).join('') + '</select></label>' : '';
    openSheet('<h2>' + T('new.task') + '</h2><label class="fld"><span>' + T('f.title') + '</span><input id="ft"></label>' + who + '<div class="two"><label class="fld"><span>' + T('f.prio') + '</span><select id="fp">' + options(['low', 'normal', 'high', 'urgent'], 'pr.', 'normal') + '</select></label><label class="fld"><span>' + T('f.due') + '</span><input id="fdu" type="date" dir="ltr"></label></div><label class="fld"><span>' + T('f.desc') + '</span><textarea id="fd"></textarea></label>' + voiceBox('vb1') + '<button class="btn big" id="ok">' + T('send') + '</button>');
    bindVoice('vb1', function (r) { pv = r; });
    $('#ok').onclick = async function () {
      if (!f('#ft').trim()) return $('#ft').focus();
      var team = mgr && f('#fw') === '*';
      var row = { title: f('#ft').trim(), assigned_to: team ? null : (mgr ? f('#fw') : me.id), team: team, priority: f('#fp'), due_date: f('#fdu') || null, description: f('#fd'), status: 'todo' };
      var ok = await act(async function () { var r = await Store.insert('tasks', row); if (pv) await Store.insert('voice_notes', { task_id: r.id, audio: pv.data, secs: pv.secs }); await notify(team ? allIds() : [row.assigned_to], 'task_assigned', 'tasks', row.title); return r; }, 'sent');
      if (ok) { closeSheet(); goto(ORDER.indexOf('tasks')); }
    };
  }
  function taskDetail(id) {
    var t = D.tasks.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    var cm = D.task_comments.filter(function (c) { return c.task_id === id; }).sort(function (a, b) { return a.created_at.localeCompare(b.created_at); });
    var canSt = isMgr() || t.assigned_to === me.id || t.created_by === me.id;
    var members = profiles.filter(function (p) { return p.id !== t.created_by; });
    var team = t.team ? '<div class="ack">' + members.map(function (p) { return '<span class="' + (acked(t, p.id) ? 'y' : '') + '">' + (acked(t, p.id) ? '✓ ' : '') + esc(p.name || p.email) + '</span>'; }).join('') + '</div>' + (t.created_by !== me.id && !acked(t, me.id) ? '<button class="btn ok" id="ack" style="width:100%;margin-bottom:10px">' + T('ack.mine') + '</button>' : '') : '';
    openSheet('<h2>' + esc(t.title) + '</h2><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' + pill(t.status, T('st.' + t.status)) + pill(t.priority, T('pr.' + t.priority)) + (isLate(t) ? pill('urgent', T('overdue')) : '') + '</div><p style="color:var(--ash)">' + T('from.admin') + ': ' + esc(nameOf(t.created_by)) + ' · ' + (t.team ? T('whole') : t.assigned_to ? T('to') + ': ' + esc(nameOf(t.assigned_to)) : '') + (t.due_date ? ' · ' + I18N.date(t.due_date) : '') + '</p><p>' + esc(t.description) + '</p>' + team +
      '<div id="vlist"></div>' + voiceBox('vb2') +
      (canSt ? '<label class="fld"><span>' + T('f.status') + '</span><select id="fs">' + options(['todo', 'in_progress', 'done'], 'st.', t.status) + '</select></label>' : '') +
      '<h2>' + T('comments') + '</h2>' + (cm.length ? cm.map(function (c) { return '<div class="cm"><small>' + esc(nameOf(c.user_id)) + ' · ' + I18N.ago(c.created_at) + '</small><div>' + esc(c.body) + '</div></div>'; }).join('') : '<div class="empty" style="padding:8px">' + T('none') + '</div>') +
      '<div class="row" style="margin-top:10px"><input id="fcm" placeholder="' + T('comment.ph') + '"><button class="btn" id="cmok">' + T('send') + '</button></div>' + (isMgr() ? '<button class="btn ghost danger" id="tdel">' + T('delete') + '</button>' : ''));
    var others = function () { return [t.created_by, t.assigned_to].concat(t.team ? allIds() : []); };
    Store.where('voice_notes', 'task_id', id).then(function (rows) {
      var box = $('#vlist'); if (!box || !rows.length) return;
      box.innerHTML = '<h2>' + T('voice.h') + '</h2>';
      rows.forEach(function (v) { var d = document.createElement('div'); d.className = 'cm'; var sm = document.createElement('small'); sm.textContent = nameOf(v.user_id) + ' · ' + I18N.ago(v.created_at) + ' · ' + fmt(v.secs || 0); var au = document.createElement('audio'); au.controls = true; au.preload = 'none'; au.src = v.audio; d.appendChild(sm); d.appendChild(wave(v.id || v.created_at)); d.appendChild(au); box.appendChild(d); });
    }).catch(function () {});
    bindVoice('vb2', function (r) { act(async function () { await Store.insert('voice_notes', { task_id: id, audio: r.data, secs: r.secs }); await notify(others(), 'task_comment', 'tasks', t.title); }).then(function () { taskDetail(id); }); });
    var s = $('#fs'); if (s) s.onchange = function () { act(async function () { await Store.update('tasks', id, { status: s.value }); if (s.value === 'done') { window.__fx = 1; await notify([t.created_by], 'task_done', 'tasks', t.title); } }, 'saved').then(function () { taskDetail(id); }); };
    if ($('#ack')) $('#ack').onclick = function () { act(async function () { await Store.insert('task_ack', { task_id: id }); await notify([t.created_by], 'task_ack', 'tasks', t.title); }, 'ack.ok').then(function () { taskDetail(id); }); };
    $('#cmok').onclick = function () { var b = f('#fcm').trim(); if (!b) return; act(async function () { await Store.insert('task_comments', { task_id: id, body: b }); await notify(others(), 'task_comment', 'tasks', t.title); }).then(function () { taskDetail(id); }); };
    if ($('#tdel')) $('#tdel').onclick = function () { act(function () { return Store.remove('tasks', id); }, 'saved').then(closeSheet); };
  }
  function newLeave() {
    var today = new Date().toISOString().slice(0, 10);
    openSheet('<h2>' + T('new.leave') + '</h2><label class="fld"><span>' + T('f.type') + '</span><select id="fl">' + options(['annual', 'sick', 'unpaid', 'emergency'], 'lt.', 'annual') + '</select></label><div class="two"><label class="fld"><span>' + T('f.from') + '</span><input id="fa" type="date" value="' + today + '" dir="ltr"></label><label class="fld"><span>' + T('f.to') + '</span><input id="fb" type="date" value="' + today + '" dir="ltr"></label></div><label class="fld"><span>' + T('f.reason') + '</span><textarea id="fr"></textarea></label><p class="err" id="ferr"></p><button class="btn big" id="ok">' + T('send') + '</button>');
    $('#ok').onclick = async function () {
      var a = f('#fa'), b = f('#fb'), err = $('#ferr'); if (!a || !b || b < a) { err.textContent = T('baddates'); return; }
      var clash = D.leaves.some(function (l) { return l.user_id === me.id && (l.status === 'pending' || l.status === 'approved') && !(b < l.start_date || a > l.end_date); });
      if (clash) { err.textContent = T('overlap'); return; }
      var lt = f('#fl'); var ok = await act(async function () { await Store.insert('leaves', { type: lt, start_date: a, end_date: b, days: daysBetween(a, b), reason: f('#fr'), status: 'pending' }); await notify(admins(), 'leave_req', 'leaves', lt); }, 'sent'); if (ok) { closeSheet(); goto(ORDER.indexOf('leaves')); }
    };
  }
  function decideButtons(kind, id, row, yes, no, yesCls) {
    return (isMgr() && row.status === 'pending' ? '<label class="fld"><span>' + T('note') + '</span><input id="fn"></label><div class="acts"><button class="btn ok" id="dy">' + T(yes) + '</button><button class="btn danger" id="dn">' + T(no) + '</button></div>' : '') +
      (row.user_id === me.id && row.status === 'pending' ? '<div class="acts"><button class="btn" id="dc">' + T(kind === 'leaves' ? 'cancelreq' : 'withdraw') + '</button></div>' : '');
  }
  function wireDecide(kind, id, yesSt, noSt, selfSt, reopen) {
    var go = function (st) { return function () { var row = D[kind].filter(function (x) { return x.id === id; })[0], note = f('#fn'); act(async function () { await Store.update(kind, id, { status: st, decided_by: me.id, decision_note: note }); await logDecision(kind, row, st, note); }, 'saved').then(closeSheet); }; };
    if ($('#dy')) { $('#dy').onclick = go(yesSt); $('#dn').onclick = go(noSt); }
    if ($('#dc')) $('#dc').onclick = function () { act(function () { return Store.update(kind, id, { status: selfSt }); }, 'saved').then(closeSheet); };
  }
  function leaveDetail(id) {
    var l = D.leaves.filter(function (x) { return x.id === id; })[0]; if (!l) return;
    openSheet('<h2>' + T('lt.' + l.type) + ' · ' + l.days + ' ' + T('dayn') + '</h2><div style="margin-bottom:8px">' + pill(l.status, T('ls.' + l.status)) + '</div><p style="color:var(--ash)">' + esc(nameOf(l.user_id)) + '</p><p dir="ltr" style="text-align:start">' + I18N.date(l.start_date) + ' → ' + I18N.date(l.end_date) + '</p><p>' + esc(l.reason) + '</p>' + (l.decision_note ? '<p class="cm">' + esc(l.decision_note) + '</p>' : '') + decideButtons('leaves', id, l, 'approve', 'reject'));
    wireDecide('leaves', id, 'approved', 'rejected', 'cancelled');
  }
  function newResign() {
    var d = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    openSheet('<h2>' + T('new.resign') + '</h2><p class="sub">' + T('resign.warn') + '</p><label class="fld"><span>' + T('f.lastday') + '</span><input id="fa" type="date" value="' + d + '" dir="ltr"></label><label class="fld"><span>' + T('f.reason') + '</span><textarea id="fr"></textarea></label><button class="btn big" id="ok">' + T('send') + '</button>');
    $('#ok').onclick = function () {
      openSheet('<h2>' + T('resign.confirm') + '</h2><div class="acts"><button class="btn danger" id="yes">' + T('resign.yes') + '</button><button class="btn" id="no">' + T('cancel') + '</button></div>');
      var last = d, reason = ''; last = null;
    };
    $('#ok').onclick = function () {
      var last = f('#fa'), reason = f('#fr'); if (!last) return;
      openSheet('<h2>' + T('resign.confirm') + '</h2><p class="sub">' + T('resign.last') + ': ' + I18N.date(last) + '</p><div class="acts"><button class="btn danger" id="yes">' + T('resign.yes') + '</button><button class="btn" id="no">' + T('cancel') + '</button></div>');
      $('#no').onclick = closeSheet;
      $('#yes').onclick = async function () { var ok = await act(async function () { await Store.insert('resignations', { last_day: last, reason: reason, status: 'pending' }); await notify(admins(), 'resign_req', 'resign', ''); }, 'sent'); if (ok) { closeSheet(); goto(ORDER.indexOf('resign')); } };
    };
  }
  function resignDetail(id) {
    var r = D.resignations.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    openSheet('<h2>' + T('resign') + '</h2><div style="margin-bottom:8px">' + pill(r.status, T('rs.' + r.status)) + '</div><p style="color:var(--ash)">' + esc(nameOf(r.user_id)) + '</p><p>' + T('resign.last') + ': ' + I18N.date(r.last_day) + '</p><p>' + esc(r.reason) + '</p>' + (r.decision_note ? '<p class="cm">' + esc(r.decision_note) + '</p>' : '') + decideButtons('resignations', id, r, 'accept', 'reject'));
    wireDecide('resignations', id, 'accepted', 'rejected', 'withdrawn');
  }
  function clientForm(c) {
    c = c || {};
    openSheet('<h2>' + T(c.id ? 'edit' : 'new.client') + '</h2><label class="fld"><span>' + T('f.name') + '</span><input id="fn1" value="' + esc(c.name) + '"></label><div class="two"><label class="fld"><span>' + T('f.contact') + '</span><input id="fc1" value="' + esc(c.contact) + '"></label><label class="fld"><span>' + T('f.phone') + '</span><input id="fp1" type="tel" dir="ltr" value="' + esc(c.phone) + '"></label></div><div class="two"><label class="fld"><span>' + T('f.email') + '</span><input id="fe1" dir="ltr" value="' + esc(c.email) + '"></label><label class="fld"><span>' + T('f.status') + '</span><select id="fs1">' + options(['lead', 'active', 'paused', 'closed'], 'cs.', c.status || 'lead') + '</select></label></div><label class="fld"><span>' + T('f.notes') + '</span><textarea id="fno">' + esc(c.notes) + '</textarea></label><button class="btn big" id="ok">' + T('save') + '</button>' + (c.id && isMgr() ? '<button class="btn ghost danger" id="del">' + T('delete') + '</button>' : ''));
    $('#ok').onclick = async function () {
      if (!f('#fn1').trim()) return $('#fn1').focus();
      var row = { name: f('#fn1').trim(), contact: f('#fc1'), phone: f('#fp1'), email: f('#fe1'), status: f('#fs1'), notes: f('#fno') };
      var ok = await act(function () { return c.id ? Store.update('clients', c.id, row) : Store.insert('clients', row); }, 'saved'); if (ok) { closeSheet(); if (ORDER[cur] !== 'clients') goto(ORDER.indexOf('clients')); }
    };
    if ($('#del')) $('#del').onclick = function () { act(function () { return Store.remove('clients', c.id); }, 'saved').then(closeSheet); };
  }
  function clientDetail(id) {
    var c = D.clients.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    var ph = (c.phone || '').replace(/[^\d+]/g, ''), wa = ph.replace(/^\+/, '');
    openSheet('<h2>' + esc(c.name) + '</h2><div style="margin-bottom:8px">' + pill(c.status, T('cs.' + c.status)) + '</div>' + (c.contact ? '<p>' + esc(c.contact) + '</p>' : '') + (c.email ? '<p dir="ltr" style="text-align:start">' + esc(c.email) + '</p>' : '') + (c.notes ? '<p style="color:var(--ash)">' + esc(c.notes) + '</p>' : '') +
      '<div class="acts">' + (ph ? '<a class="btn" href="tel:' + esc(ph) + '">' + T('f.phone') + '</a><a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + esc(wa) + '">WhatsApp</a>' : '') + '<button class="btn" id="ed">' + T('edit') + '</button></div>');
    $('#ed').onclick = function () { clientForm(c); };
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-scope],[data-f],[data-go],[data-task],[data-leave],[data-client],[data-resign],[data-new],[data-role],[data-prof],[data-act],[data-nref],[data-pickstar]'); if (!t) return;
    var d = t.dataset;
    if (d.scope) { scope = d.scope; render(0); }
    else if (d.f) { var p = d.f.split(':'); filters[p[0]] = p[1]; render(0); }
    else if (d.go) goto(ORDER.indexOf(d.go));
    else if (d.task) taskDetail(d.task);
    else if (d.leave) leaveDetail(d.leave);
    else if (d.client) clientDetail(d.client);
    else if (d.resign) resignDetail(d.resign);
    else if (d.new === 'resign') newResign();
    else if (d.prof) profileSheet(d.prof);
    else if (d.pickstar) pickStar(d.pickstar);
    else if (d.act === 'bcast') bcastSheet();
    else if (d.act === 'star') starSheet();
    else if (d.act === 'report') reportSheet();
    else if (d.act === 'log') logSheet();
    else if (d.nref) { closeSheet(); goto(ORDER.indexOf(d.nref)); }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'q') { filters.q = e.target.value; var pos = e.target.selectionStart; render(0); var q = $('#q'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} } } });
  document.addEventListener('change', function (e) { if (e.target.id === 'attf') { attFilter = e.target.value; render(0); return; } var r = e.target.dataset && e.target.dataset.role; if (r) act(function () { return Store.setRole(r, e.target.value); }, 'saved'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetOpen) closeSheet(); });
  $('#stage').addEventListener('click', function (e) { var ab = e.target.closest('#attbtn'); if (ab) return toggleAttend(); var b = e.target.closest('#mlang'), o = e.target.closest('#mout'); if (b) toggleLang(); if (o) logout(); });

  function toggleAttend() { var open = D.attendance.filter(function (r) { return r.user_id === me.id && !r.check_out; })[0]; act(function () { return open ? Store.update('attendance', open.id, { check_out: new Date().toISOString() }) : Store.insert('attendance', {}); }, open ? 'att.bye' : 'att.hi'); }
  function quickAdd() { var id = ORDER[cur]; if (id === 'tasks') newTask(); else if (id === 'leaves') newLeave(); else if (id === 'clients') clientForm(); else if (id === 'resign') newResign(); }
  function toggleLang() { I18N.set(I18N.lang === 'ar' ? 'en' : 'ar'); chrome(); if (me) { render(0); buildMenu(); if (dial) dial.set(cur); } }
  function chrome() { applyText(); $('#applang').textContent = T('lang'); $('#authlang').textContent = T('lang'); setAuthMode(authMode); var d = $('#demobar'); $('#bellt').textContent = T('bell'); $('#mout2').textContent = T('logout'); if (Store.mode === 'demo' && me) { d.hidden = false; d.innerHTML = '<span>' + T('demo.bar') + '</span><button id="dreset">' + T('demo.reset') + '</button>'; $('#dreset').onclick = function () { Store.resetDemo(); location.reload(); }; } else d.hidden = true; }
  $('#applang').onclick = toggleLang; $('#authlang').onclick = toggleLang;

  /* ---------- auth ---------- */
  var authMode = 'in';
  function setAuthMode(m) { authMode = m; [].forEach.call(document.querySelectorAll('#authseg button'), function (b) { b.classList.toggle('on', b.dataset.m === m); }); $('#fname').hidden = m !== 'up'; $('#authhint').hidden = m !== 'up'; $('#authgo').textContent = T(m === 'up' ? 'auth.go.up' : 'auth.go.in'); }
  $('#authseg').onclick = function (e) { var b = e.target.closest('button'); if (b) { setAuthMode(b.dataset.m); $('#autherr').textContent = ''; } };
  $('#authform').onsubmit = async function (e) {
    e.preventDefault(); var fm = e.target, em = fm.email.value.trim(), pw = fm.password.value, err = $('#autherr'); err.textContent = '';
    if (!em || !pw) { err.textContent = T('auth.fill'); return; }
    if (authMode === 'up' && pw.length < 6) { err.textContent = T('auth.short'); return; }
    try { me = authMode === 'up' ? await Store.signUp({ email: em, password: pw, name: fm.name.value.trim() }) : await Store.signIn({ email: em, password: pw }); if (!me) { err.textContent = T('auth.confirm'); return; } enter(); }
    catch (x) { var m = String(x && x.message || x); err.textContent = /exist|registered/i.test(m) ? T('auth.exists') : /bad|invalid/i.test(m) ? T('auth.bad') : /confirm/i.test(m) ? T('auth.confirm') : /invit|database error/i.test(m) ? T('auth.notinvited') : T('auth.err'); }
  };
  if (Store.mode === 'demo') $('#demobtn').hidden = false;
  $('#demobtn').onclick = async function () { me = await Store.demoSeed(); enter(); };
  async function logout() { document.body.classList.remove('intro'); await Store.signOut(); me = null; inPanel = false; document.body.classList.remove('inpanel'); $('#stage').innerHTML = ''; $('#app').hidden = true; $('#auth').hidden = false; chrome(); }

  async function enter() {
    $('#auth').hidden = true; $('#app').hidden = false; cur = 0; inPanel = false; document.body.classList.remove('inpanel'); $('#stage').innerHTML = '';
    me = Store.me() || me; await load(); me = (profiles.filter(function (p) { return p.id === me.id; })[0]) || me; chrome();
    var items = ORDER.map(function (id) { return { id: id, label: function () { return T(id); }, sub: function () { return id === 'home' ? '' : id === 'me' ? T('profile') : T('dial.tap'); } }; });
    if (!dial) dial = Dial({ el: $('#dial'), items: items, index: 0, onCommit: function (i) { cur = i; openPanel('open'); }, onTap: function () { openPanel('open'); } });
    else dial.set(0);
    eyeState();
    if (Store.mode === 'live' && !enter.poll) enter.poll = setInterval(function () {
      if (!me || document.visibilityState !== 'visible') return;
      Store.list('notifications').then(function (rows) {
        var now = rows.filter(function (n) { return n.user_id === me.id && !n.read; }), had = unread().length;
        if (now.length > had) { load().then(function () { bell(); var n = unread()[0]; if (n) toast(nameOf(n.actor) + ' ' + T('n.' + n.kind)); if (!sheetOpen) render(0); }); }
        else { D.notifications = rows; bell(); }
      }).catch(function () {});
    }, 20000);
    $('#dialhint').textContent = T('dial.hint'); dial.set(0); buildMenu(); startIntro(); setTimeout(function () { $('#dialhint').textContent = ''; }, 6000);
  }

  /* ---------- boot ---------- */
  (async function () {
    chrome();
    try { me = await Store.session(); } catch (e) { me = null; }
    $('#boot').style.transition = 'opacity .4s'; 
    if (me) await enter(); else { $('#auth').hidden = false; }
    $('#boot').style.opacity = 0; setTimeout(function () { $('#boot').remove(); }, 450);
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(function () {});
  })();
})();
