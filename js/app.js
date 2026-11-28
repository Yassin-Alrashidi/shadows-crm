(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var T = function (k) { return I18N.t(k); };
  var CFG = window.CRM_CONFIG || {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ORDER = ['home', 'tasks', 'attend', 'leaves', 'clients', 'expenses', 'assets', 'resign', 'me'];
  /* wheel order: Home sits in the middle, next pages go right, previous pages go left */
  var DIALORD = ['expenses', 'assets', 'resign', 'me', 'home', 'tasks', 'attend', 'leaves', 'clients'];
  function DI(oi) { return DIALORD.indexOf(ORDER[oi]); }
  var me = null, profiles = [], D = { tasks: [], task_comments: [], attendance: [], notifications: [], decisions: [], task_ack: [], stars: [], broadcasts: [], leaves: [], resignations: [], clients: [], expenses: [], assets: [], client_members: [] };
  var cur = 0, dial = null, scope = 'mine', filters = { tasks: 'all', leaves: 'all', clients: 'all', q: '', view: 'board' };
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


  /* ---------- teams, client members, leave calendar ---------- */
  var TEAMS = ['production', 'editing', 'design', 'social'];
  var PAL = ['#E11827', '#8A8A92', '#A9A9B0', '#55555C', '#6B6B73', '#7A7A82', '#C4C4CA', '#5C6B7A'];
  var colOf = function (id) { var n = 0; String(id).split('').forEach(function (c) { n = (n * 31 + c.charCodeAt(0)) % 997; }); return PAL[n % PAL.length]; };
  var teamLabel = function (t) { return t ? T('team.' + t) : T('team.none'); };
  var clientName = function (id) { var c = D.clients.filter(function (x) { return x.id === id; })[0]; return c ? c.name : ''; };
  var membersOf = function (cid) { var ids = D.client_members.filter(function (m) { return m.client_id === cid; }).map(function (m) { return m.user_id; }); return profiles.filter(function (p) { return ids.indexOf(p.id) > -1; }); };
  var avatar = function (p) { var n = (p.name || p.email || '?').trim(); return '<span class="av" style="background:' + colOf(p.id) + '" title="' + esc(n) + '">' + esc(n.charAt(0).toUpperCase()) + '</span>'; };
  var calM = null, calDay = null;
  function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function leaveCal() {
    var loc = I18N.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', today = ymd(new Date());
    if (!calM) { calM = new Date(); calM.setDate(1); } if (!calDay) calDay = today;
    var vis = D.leaves.filter(function (l) { return l.status === 'approved' || (l.status === 'pending' && (isMgr() || l.user_id === me.id)); });
    var first = new Date(calM.getFullYear(), calM.getMonth(), 1), dim = new Date(calM.getFullYear(), calM.getMonth() + 1, 0).getDate();
    var wk = I18N.lang === 'ar' ? 6 : 1, off = (first.getDay() - wk + 7) % 7;
    var h = '<div class="cal"><div class="calh"><button class="calnav" data-cal="prev" aria-label="prev">' + (document.documentElement.dir === 'rtl' ? '&rsaquo;' : '&lsaquo;') + '</button><b>' + first.toLocaleDateString(loc, { month: 'long', year: 'numeric' }) + '</b><button class="calnav" data-cal="next" aria-label="next">' + (document.documentElement.dir === 'rtl' ? '&lsaquo;' : '&rsaquo;') + '</button></div><div class="calg">';
    for (var i = 0; i < 7; i++) { var dd = new Date(2024, 0, 7 + wk + i); h += '<i class="wd">' + dd.toLocaleDateString(loc, { weekday: 'narrow' }) + '</i>'; }
    for (i = 0; i < off; i++) h += '<span class="cd e"></span>';
    for (var day = 1; day <= dim; day++) {
      var key = calM.getFullYear() + '-' + ('0' + (calM.getMonth() + 1)).slice(-2) + '-' + ('0' + day).slice(-2);
      var who = vis.filter(function (l) { return l.start_date <= key && l.end_date >= key; });
      var dots = who.slice(0, 3).map(function (l) { return '<u style="background:' + colOf(l.user_id) + (l.status === 'pending' ? ';opacity:.4' : '') + '"></u>'; }).join('') + (who.length > 3 ? '<em>+</em>' : '');
      h += '<button class="cd' + (key === today ? ' today' : '') + (key === calDay ? ' sel' : '') + '" data-cal="day:' + key + '"><span>' + day + '</span><div class="dots">' + dots + '</div></button>';
    }
    h += '</div>';
    var offs = vis.filter(function (l) { return l.start_date <= calDay && l.end_date >= calDay; });
    h += '<div class="calday"><small>' + I18N.date(calDay) + '</small>' + (offs.length ? offs.map(function (l) { var p = profiles.filter(function (x) { return x.id === l.user_id; })[0] || { id: l.user_id, name: '?' }; return '<div class="calrow">' + avatar(p) + '<b>' + esc(p.name || p.email) + '</b><span>' + T('lt.' + l.type) + (l.status === 'pending' ? ' · ' + T('cal.pending') : '') + '</span></div>'; }).join('') : '<div class="calnone">' + T('cal.none') + '</div>') + '</div></div>';
    return h;
  }
  function clientTeamSheet(cid) {
    var c = D.clients.filter(function (x) { return x.id === cid; })[0]; if (!c) return;
    var on = membersOf(cid).map(function (p) { return p.id; });
    openSheet('<h2>' + T('cl.manage') + '</h2><p class="sub">' + esc(c.name) + '</p>' + TEAMS.concat(['']).map(function (tm) {
      var ps = profiles.filter(function (p) { return (p.team || '') === tm; }); if (!ps.length) return '';
      return '<h2>' + teamLabel(tm) + '</h2><div class="pick">' + ps.map(function (p) { return '<button class="pk' + (on.indexOf(p.id) > -1 ? ' on' : '') + '" data-cm="' + cid + ':' + p.id + '">' + avatar(p) + '<span>' + esc(p.name || p.email) + '</span></button>'; }).join('') + '</div>';
    }).join('') + '<button class="btn big" data-cmdone="' + cid + '">' + T('save') + '</button>');
  }
  function toggleMember(cid, uid) {
    var ex = D.client_members.filter(function (m) { return m.client_id === cid && m.user_id === uid; })[0];
    return act(function () { return ex ? Store.remove('client_members', ex.id) : Store.insert('client_members', { client_id: cid, user_id: uid }); }).then(function () { clientTeamSheet(cid); });
  }
  function toggleMemberFromProfile(cid, uid) {
    var ex = D.client_members.filter(function (m) { return m.client_id === cid && m.user_id === uid; })[0];
    return act(function () { return ex ? Store.remove('client_members', ex.id) : Store.insert('client_members', { client_id: cid, user_id: uid }); }).then(function () { profileSheet(uid); });
  }

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
  function notifText(n) { var sub = n.subject; if (n.kind === 'leave_req') sub = T('lt.' + n.subject); else if (n.kind === 'leave_decided' || n.kind === 'resign_decided' || n.kind === 'expense_decided') sub = T('d.' + n.subject); return esc(nameOf(n.actor)) + ' ' + T('n.' + n.kind) + (sub ? ': ' + esc(sub) : ''); }
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
    return Store.insert('decisions', { kind: kind === 'leaves' ? 'leave' : kind === 'expenses' ? 'expense' : 'resignation', ref_id: row.id, subject_user: row.user_id, decided_by: me.id, decision: st, note: note || '' })
      .then(function () { return notify([row.user_id], kind === 'leaves' ? 'leave_decided' : kind === 'expenses' ? 'expense_decided' : 'resign_decided', kind === 'leaves' ? 'leaves' : kind === 'expenses' ? 'expenses' : 'resign', st); });
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
      (isMgr() ? '<label class="fld"><span>' + T('team.of') + '</span><select data-team="' + uid + '">' + ['']. concat(TEAMS).map(function (tm) { return '<option value="' + tm + '"' + ((p.team || '') === tm ? ' selected' : '') + '>' + teamLabel(tm) + '</option>'; }).join('') + '</select></label>' : (p.team ? '<p class="sub">' + teamLabel(p.team) + '</p>' : '')) +
      (me.role === 'admin' && uid !== me.id ? '<h2>' + L('Access', 'الصلاحيات') + '</h2><div class="chips">' + ['employee', 'manager', 'admin'].map(function (r) { return '<button class="' + (p.role === r ? 'on' : '') + '" data-setrole="' + uid + ':' + r + '">' + T('role.' + r) + '</button>'; }).join('') + '</div><p class="m" style="color:var(--mut);margin:8px 0 0">' + L('Employee: own tasks, leaves and expenses. Manager: also approves requests, runs the team and clients. Admin: everything, including roles.', 'موظف: مهامه وإجازاته ومصروفاته. مدير: كمان بيوافق على الطلبات وبيدير الفريق والعملاء. أدمن: كل حاجة، ومعاها الصلاحيات.') + '</p>' : '') +
      '<h2>' + T('prof.clients') + '</h2>' + (isMgr() ? '<div class="pick">' + D.clients.filter(function (c) { return c.status !== 'closed'; }).map(function (c) { var on = D.client_members.some(function (m) { return m.client_id === c.id && m.user_id === uid; }); return '<button class="pk' + (on ? ' on' : '') + '" data-cmp="' + c.id + ':' + uid + '"><span>' + esc(c.name) + '</span></button>'; }).join('') + '</div>' : D.client_members.filter(function (m) { return m.user_id === uid; }).map(function (m) { return pill('active', clientName(m.client_id)); }).join('')) +
      '<div class="two3" style="margin-top:14px"><div class="kpi"><b>' + done.length + '</b><span>' + T('prof.done') + '</span></div><div class="kpi"><b>' + open.length + '</b><span>' + T('prof.open2') + '</span></div><div class="kpi red"><b>' + late.length + '</b><span>' + T('prof.late') + '</span></div></div>' +
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
      rows.map(function (r) { return '<div class="card"><div class="row"><b>' + esc(r.name) + '</b><span class="pill ' + (r.late ? 'urgent' : 'done') + '">' + r.late + ' ' + T('prof.late') + '</span></div><div class="m" style="color:var(--ash);margin-top:6px;font-size:13px">' + T('rep.done') + ' ' + r.done + ' · ' + r.hours.toFixed(1) + ' ' + T('prof.hours') + ' · ' + T('rep.lv') + ' ' + r.lv + '</div></div>'; }).join('') + '<button class="btn big" id="repcopy">' + T('rep.copy') + '</button><button class="btn big" id="repprint" style="margin-top:10px">' + L('Save as PDF', 'احفظ PDF') + '</button>');
    $('#repprint').onclick = function () { window.print(); };
    $('#repcopy').onclick = function () { try { navigator.clipboard.writeText(text).then(function () { toast(T('rep.copied')); }); } catch (e) {} };
  }
  function logSheet() {
    var rows = D.decisions.slice(0, 60);
    openSheet('<h2>' + T('log') + '</h2>' + (rows.length ? rows.map(function (d) { return '<div class="item dos" style="cursor:default">' + stamp(d.decision) + '<div class="t">' + esc(nameOf(d.decided_by)) + ' ' + T('d.' + d.decision) + ' ' + T('d.' + d.kind) + ' · ' + esc(nameOf(d.subject_user)) + '</div><div class="m"><span>' + I18N.date(d.created_at) + ' ' + hm(d.created_at) + '</span>' + (d.note ? '<span>' + esc(d.note) + '</span>' : '') + '</div></div>'; }).join('') : EMPTY()));
  }

  /* ---------- data ---------- */
  async function load() {
    profiles = await Store.profiles();
    var names = ['tasks', 'task_comments', 'attendance', 'notifications', 'decisions', 'task_ack', 'stars', 'broadcasts', 'leaves', 'resignations', 'clients', 'expenses', 'assets', 'client_members', 'client_notes'];
    var res = await Promise.all(names.map(function (n) { return Store.list(n).catch(function (e) { if (n === 'client_notes') return []; throw e; }); }));
    names.forEach(function (n, i) { D[n] = res[i]; });
  }
  window.addEventListener('offline', function () { toast(T('offline')); });
  async function act(fn, okMsg) { try { await fn(); await load(); render(0); if (okMsg) toast(T(okMsg)); return true; } catch (e) { toast(T('fail')); return false; } }

  /* ---------- panels ---------- */
  var EMPTY = function () { return '<div class="empty e-' + (ORDER[cur] || 'home') + '"><svg class="emptyeye" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".55"/></svg><div>' + EMPTYTXT() + '</div></div>'; };
  function openLbl(n) { return I18N.lang === 'ar' ? (n ? 'Tasks مفتوحة: ' + n : 'مفيش Tasks مفتوحة') : (n === 0 ? 'No open tasks' : n + (n === 1 ? ' open task' : ' open tasks')); }
  function EMPTYTXT() { var m = { home: ['All quiet. Nothing needs you.', 'هادي. مفيش حاجة محتاجاك.'], tasks: ['No tasks here. Tap + to add one.', 'مفيش مهام هنا. دوس + وضيف واحدة.'], attend: ['No check-ins yet.', 'مفيش حضور متسجل لسه.'], leaves: ['No leave requests.', 'مفيش طلبات إجازة.'], clients: ['No clients yet. Tap + to add one.', 'مفيش عملاء لسه. دوس + وضيف واحد.'], expenses: ['No expenses yet.', 'مفيش مصروفات لسه.'], assets: ['No files yet. Tap New asset to add a link.', 'مفيش ملفات لسه. دوس ملف جديد وضيف لينك.'], resign: ['No resignations.', 'مفيش استقالات.'], me: ['Nothing here.', 'مفيش حاجة هنا.'] }[ORDER[cur] || 'home']; return m ? L(m[0], m[1]) : T('none'); }
  var ENNAME = { expenses: 'EXPENSES', assets: 'ASSETS', home: 'DASHBOARD', tasks: 'TASKS', attend: 'ATTENDANCE', leaves: 'LEAVES', clients: 'CLIENTS', resign: 'RESIGNATIONS', me: 'PROFILE' };
  var V = {};
  V.home = function () {
    var myOpen = D.tasks.filter(function (t) { return (t.assigned_to === me.id || (t.team && t.created_by !== me.id && !acked(t, me.id))) && t.status !== 'done'; }).length;
    var pend = D.leaves.filter(function (l) { return l.status === 'pending' && (isMgr() || l.user_id === me.id); }).length;
    var act = D.clients.filter(function (c) { return c.status === 'active'; }).length;
    var allOpen = D.tasks.filter(function (t) { return t.status !== 'done'; }).length;
    var need = isMgr() ? pend + D.expenses.filter(function (r) { return r.status === 'pending'; }).length + D.resignations.filter(function (r) { return r.status === 'pending'; }).length : 0;
    var used = D.leaves.filter(function (l) { return l.user_id === me.id && l.type === 'annual' && l.status !== 'rejected' && l.status !== 'cancelled'; }).reduce(function (a, l) { return a + (l.days || 0); }, 0);
    var tot = CFG.annualLeaveDays || 21, left = Math.max(0, tot - used);
    var h = '<h1>' + T('hi') + ' ' + esc((me.name || '').split(' ')[0]) + '</h1><button class="item" data-act="gsearch" style="margin:4px 0 14px;color:var(--mut)">' + L('Search tasks, clients, people', 'ابحث في المهام والعملاء والفريق') + '</button>' + banners() + '<div class="grid">' +
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
  /* ---------- deadlines view for tasks ---------- */
  function viewBar() { return '<div class="chips"><button class="chip' + (filters.view === 'board' ? ' on' : '') + '" data-f="view:board">' + L('Board', 'اللوحة') + '</button><button class="chip' + (filters.view === 'deadlines' ? ' on' : '') + '" data-f="view:deadlines">' + L('Deadlines', 'المواعيد') + '</button></div>'; }
  function deadlines(rows) {
    var open = rows.filter(function (t) { return t.status !== 'done' && t.due_date; }).sort(function (a, b) { return a.due_date.localeCompare(b.due_date); });
    if (!open.length) return EMPTY();
    var today = ymd(new Date()), tom = ymd(new Date(Date.now() + 864e5)), groups = [], idx = {};
    open.forEach(function (t) {
      var k = t.due_date < today ? 'late' : t.due_date; if (!(k in idx)) { idx[k] = groups.length; groups.push({ k: k, rows: [] }); } groups[idx[k]].rows.push(t);
    });
    var wd = function (d) { return new Date(d + 'T12:00:00').toLocaleDateString(I18N.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); };
    return groups.map(function (g) {
      var lbl = g.k === 'late' ? L('Overdue', 'متأخرة') : g.k === today ? L('Today', 'النهارده') : g.k === tom ? L('Tomorrow', 'بكرة') : wd(g.k);
      return '<div class="dl' + (g.k === 'late' ? ' late' : g.k === today ? ' today' : '') + '"><h2>' + lbl + '<em>' + g.rows.length + '</em></h2>' + g.rows.map(function (t) {
        return '<button class="item dlrow" data-task="' + t.id + '"><span class="dlbar"></span><div><div class="t">' + esc(t.title) + '</div><div class="m">' + (t.client_id ? '<span>' + esc(clientName(t.client_id)) + '</span>' : '') + '<span>' + (t.team ? T('whole') : esc(nameOf(t.assigned_to))) + '</span>' + (g.k === 'late' ? '<span>' + I18N.date(t.due_date) + '</span>' : '') + ckChip(t) + '</div></div></button>';
      }).join('') + '</div>';
    }).join('');
  }
  V.tasks = function () {
    var rows = D.tasks.filter(function (t) { return (isMgr() && scope === 'all') || t.assigned_to === me.id || t.created_by === me.id || t.team; }).filter(function (t) { return filters.tasks === 'all' || t.status === filters.tasks; });
    var po = { urgent: 0, high: 1, normal: 2, low: 3 };
    rows.sort(function (a, b) { return (a.status === 'done') - (b.status === 'done') || po[a.priority] - po[b.priority] || (a.due_date || '9').localeCompare(b.due_date || '9'); });
    var h = '<h1>' + T('tasks') + '</h1>' + scopeBar() + chipBar('tasks', ['todo', 'in_progress', 'done'], 'st.');
    h += viewBar();
    if (filters.view === 'deadlines') return h + deadlines(rows);
    h += rows.length ? '<div class="board">' + rows.map(function (t, k) { var late = isLate(t), soon = isSoon(t); return '<button class="item note ' + (late ? 'nr' : t.status === 'done' ? 'ng' : t.status === 'in_progress' ? 'nb2' : 'ny') + '" data-task="' + t.id + '"><div class="t">' + esc(t.title) + '</div>' + (t.description ? '<p class="nd">' + esc(String(t.description).slice(0, 70)) + '</p>' : '') + '<div class="m">' + pill(t.status, T('st.' + t.status)) + (late ? pill('urgent', T('overdue')) : soon ? pill('high', T('soon')) : '') + (t.due_date ? '<span>' + I18N.date(t.due_date) + '</span>' : '') + ckChip(t) + '</div>' + (t.client_id || (isMgr() && scope === 'all' && t.assigned_to) ? '<div class="nf">' + (t.client_id ? '<span class="ncl">' + esc(clientName(t.client_id)) + '</span>' : '') + (isMgr() && scope === 'all' && t.assigned_to ? '<span>' + esc((nameOf(t.assigned_to) || '').split(' ')[0]) + '</span>' : '') + '</div>' : '') + '</button>'; }).join('') + '</div>' : EMPTY();
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
    h += '<h2>' + T('cal.h') + '</h2>' + leaveCal() + '<h2>' + T('leaves') + '</h2>';
    h += scopeBar() + chipBar('leaves', ['pending', 'approved', 'rejected', 'cancelled'], 'ls.');
    h += rows.length ? rows.map(function (l) { return '<button class="item" data-leave="' + l.id + '"><div class="t">' + T('lt.' + l.type) + ' · ' + l.days + ' ' + T('dayn') + '</div><div class="m">' + pill(l.status, T('ls.' + l.status)) + '<span dir="ltr">' + I18N.date(l.start_date) + ' → ' + I18N.date(l.end_date) + '</span>' + (scope === 'all' && isMgr() ? '<span>' + esc(nameOf(l.user_id)) + '</span>' : '') + '</div></button>'; }).join('') : EMPTY();
    return h;
  };
  V.clients = function () {
    var q = filters.q.toLowerCase();
    var rows = D.clients.filter(function (c) { return (filters.clients === 'all' || c.status === filters.clients) && (!q || [c.name, c.contact, c.phone, c.email].join(' ').toLowerCase().indexOf(q) > -1); });
    var h = '<h1>' + T('clients') + '</h1><input id="q" type="search" placeholder="' + T('search') + '" value="' + esc(filters.q) + '" style="margin-bottom:10px">' + chipBar('clients', ['lead', 'active', 'paused', 'closed'], 'cs.');
    h += rows.length ? rows.map(function (c) { return '<button class="item" data-client="' + c.id + '"><div class="t">' + esc(c.name) + '</div><div class="m">' + pill(c.status, T('cs.' + c.status)) + (c.contact ? '<span>' + esc(c.contact) + '</span>' : '') + (c.phone ? '<span dir="ltr">' + esc(c.phone) + '</span>' : '') + '</div><div class="cmeta"><div class="avs">' + membersOf(c.id).slice(0, 5).map(avatar).join('') + '</div><span>' + openLbl(D.tasks.filter(function (t) { return t.client_id === c.id && t.status !== 'done'; }).length) + '</span></div></button>'; }).join('') : EMPTY();
    return h;
  };
  V.resign = function () {
    var rows = mineOrAll(D.resignations);
    var h = '<h1>' + T('resign') + '</h1><p class="sub">' + T('resign.intro') + '</p>' + scopeBar();
    h += '<button class="btn" data-new="resign" style="margin-bottom:14px">' + T('new.resign') + '</button>';
    h += rows.length ? rows.map(function (r) { return '<button class="item" data-resign="' + r.id + '"><div class="t">' + T('resign.last') + ': ' + I18N.date(r.last_day) + '</div><div class="m">' + pill(r.status, T('rs.' + r.status)) + '<span>' + esc(nameOf(r.user_id)) + '</span><span>' + I18N.ago(r.created_at) + '</span></div></button>'; }).join('') : EMPTY();
    return h;
  };
  /* ---------- global search and CSV export ---------- */
  var L = function (en, ar) { return I18N.lang === 'ar' ? ar : en; };
  function searchSheet() {
    openSheet('<h2>' + L('Search', 'بحث') + '</h2><input id="gq" type="search" placeholder="' + L('Tasks, clients, people', 'مهام، عملاء، أشخاص') + '" autocomplete="off"><div id="gres"></div>');
    var inp = $('#gq'); inp.focus();
    inp.oninput = function () {
      var q = inp.value.trim().toLowerCase(), h = '';
      if (q) {
        var tk = D.tasks.filter(function (t) { return (t.title + ' ' + (t.description || '')).toLowerCase().indexOf(q) > -1; }).slice(0, 8);
        var cl = D.clients.filter(function (c) { return (c.name + ' ' + (c.contact || '')).toLowerCase().indexOf(q) > -1; }).slice(0, 6);
        var pp = profiles.filter(function (p) { return (p.name + ' ' + (p.email || '')).toLowerCase().indexOf(q) > -1; }).slice(0, 6);
        if (tk.length) h += '<h2>Tasks</h2>' + tk.map(function (t) { return '<button class="item" data-task="' + t.id + '"><div class="t">' + esc(t.title) + '</div></button>'; }).join('');
        if (cl.length) h += '<h2>Clients</h2>' + cl.map(function (c) { return '<button class="item" data-client="' + c.id + '"><div class="t">' + esc(c.name) + '</div></button>'; }).join('');
        if (pp.length) h += '<h2>' + L('People', 'الفريق') + '</h2>' + pp.map(function (p) { return '<button class="item" data-prof="' + p.id + '"><div class="t">' + esc(p.name) + '</div></button>'; }).join('');
        if (!h) h = '<p class="m" style="padding:14px 0">' + L('Nothing found.', 'مفيش نتيجة.') + '</p>';
      }
      $('#gres').innerHTML = h;
    };
  }
  function exportCSV() {
    var q = function (v) { v = v == null ? '' : String(v); return '"' + v.replace(/"/g, '""') + '"'; };
    var sets = { tasks: ['title', 'status', 'priority', 'due_date', 'assigned_to', 'client_id'], leaves: ['user_id', 'type', 'start_date', 'end_date', 'status'], expenses: ['user_id', 'kind', 'amount', 'note', 'status'], attendance: ['user_id', 'check_in', 'check_out'] };
    var out = '';
    Object.keys(sets).forEach(function (k) { out += k + '\n' + sets[k].map(q).join(',') + '\n' + (D[k] || []).map(function (r) { return sets[k].map(function (c) { return q(r[c]); }).join(','); }).join('\n') + '\n\n'; });
    var b = new Blob(['\ufeff' + out], { type: 'text/csv;charset=utf-8' }), u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = 'shadows-export.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); URL.revokeObjectURL(u); }, 500);
  }
  V.me = function () {
    var h = '<h1>' + esc(me.name) + '</h1><p class="sub" dir="ltr" style="text-align:start">' + esc(me.email) + ' · ' + T('role.' + me.role) + (me.team ? ' · ' + teamLabel(me.team) : '') + '</p>' +
      '<div class="acts" style="margin:0 0 14px"><button class="btn" id="mlang">' + T('lang') + '</button><button class="btn danger" id="mout">' + T('logout') + '</button></div><p class="sub">' + T('install') + '</p>';
    h += '<button class="item" data-prof="' + me.id + '">' + T('prof.open') + '</button><button class="item" data-act="gsearch">' + L('Search', 'بحث') + '</button>';
    if (isMgr()) {
      h += '<div class="acts" style="margin:0 0 6px"><button class="btn" data-act="report">' + T('report') + '</button><button class="btn" data-act="log">' + T('log') + '</button><button class="btn" data-act="csv">' + L('Export CSV', 'تصدير CSV') + '</button></div>';
      h += '<h2>' + T('team.h') + '</h2>' + profiles.map(function (p) {
        var sel = pill(p.role, T('role.' + p.role));
        return '<button class="item row" data-prof="' + p.id + '"><div><div class="t">' + esc(p.name) + '</div><small dir="ltr" style="color:var(--ash)">' + esc(p.email) + '</small>' + (p.team ? '<small style="color:var(--ash);display:block">' + teamLabel(p.team) + '</small>' : '') + '</div>' + sel + '</button>'; }).join('');
    }
    return h;
  };

  /* ---------- render + transitions ---------- */
  var inPanel = false, QUICK = { expenses: 1, assets: 1, tasks: 1, leaves: 1, clients: 1, resign: 1 };
  function render(dir) {
    if (!inPanel) return;
    var stage = $('#stage'), id = ORDER[cur], old = [].slice.call(stage.querySelectorAll('.panel')).pop();
    var p = document.createElement('div'); p.className = 'panel'; p.setAttribute('data-n', ('0' + (cur + 1)).replace(/[0-9]/g, function (c) { return document.documentElement.lang === 'ar' ? AD[c] : c; })); p.innerHTML = '<div class="eyebrow"><span>0' + (cur + 1) + ' / ' + (document.documentElement.lang === 'ar' ? T(id) : ENNAME[id]) + '</span></div>' + V[id]();
    var keep = old && old.dataset.id === id ? old.scrollTop : 0; p.dataset.id = id; p.dataset.n = ('0') + (I18N.lang === 'ar' ? AD[cur + 1] : (cur + 1));
    [].slice.call(stage.querySelectorAll('.panel')).forEach(function (x) { if (x !== old) x.remove(); });
    stage.appendChild(p); p.scrollTop = keep;
    $('#addb').hidden = !QUICK[id]; bell();
    if (old) {
      if (dir && dir !== 'open' && old.animate) {
        /* page turn: short and snappy, small travel. New page comes from its own side (right = forward, left = back), old one steps back. Transforms and opacity only. */
        var EASE = 'cubic-bezier(.2,.8,.2,1)', DUR = 120, st0 = old.style.transform || 'none', op0 = old.style.opacity || 1;
        old.style.pointerEvents = 'none'; old.style.transform = ''; old.style.opacity = '';
        p.style.zIndex = 2; old.style.zIndex = 1;
        old.animate([{ transform: st0, opacity: op0 }, { transform: 'translate3d(' + (-dir * 18) + 'px,0,0)', opacity: 0 }], { duration: 80, easing: 'ease-out', fill: 'forwards' }).onfinish = function () { old.remove(); };
        var a2 = p.animate([{ transform: 'translate3d(' + (dir * 36) + 'px,0,0)', opacity: 0 }, { transform: 'translate3d(0,0,0)', opacity: 1 }], { duration: DUR, easing: EASE });
        a2.onfinish = function () { p.style.zIndex = ''; old.remove(); };
      } else old.remove();
    } else if (dir === 'open' && p.animate) p.animate([{ transform: 'scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
  }
  /* live drag: the page under the lens leans with the finger while the wheel turns */
  function dragFollow(f) {
    var pn = [].slice.call(document.querySelectorAll('#stage .panel')).pop(); if (!pn) return; pn.style.pointerEvents = 'none';
    var k = Math.max(-1, Math.min(1, f)); pn.style.transition = 'none'; pn.style.transform = 'translate3d(' + (-k * 26).toFixed(1) + 'px,0,0)';
  }
  function dragRelease() {
    [].slice.call(document.querySelectorAll('#stage .panel')).forEach(function (pn) {
      if (!pn.style.transform || pn.style.pointerEvents === '' ) return;
      var st = pn.style.transform, op = pn.style.opacity || 1; pn.style.transform = ''; pn.style.opacity = ''; pn.style.pointerEvents = '';
      if (pn.animate) pn.animate([{ transform: st, opacity: op }, { transform: 'none', opacity: 1 }], { duration: 140, easing: 'cubic-bezier(.2,.9,.3,1)' });
    });
  }
  /* decode the pin and owl art once, up front, so the first page turn never waits on an image */
  ['assets/pin.webp', 'assets/owl-head.webp', 'assets/grain.png'].forEach(function (u) { var im = new Image(); im.decoding = 'async'; im.src = u; if (im.decode) im.decode().catch(function () {}); });
  function openPanel(anim) { inPanel = true; document.body.classList.add('inpanel'); render(anim || 'open'); }
  function showHub() { cur = 0; inPanel = true; document.body.classList.add('inpanel'); render('open'); if (dial) dial.set(DI(0)); }
  
  function goto(i, dir) {
    if (!inPanel) { cur = i; openPanel('open'); if (dial) dial.set(DI(i)); return; }
    if (i === cur) return; var d = dir || (DI(i) > DI(cur) ? 1 : -1); cur = i; render(d); if (dial) dial.set(DI(i));
  }

  /* ---------- intro: poster owl, tap to move in until the eye becomes the lens ---------- */
  var AD = '0123456789', intro = { step: 4, N: 4 }, OW = 2064, FACE = [1032, 400], EYE = [959, 519], EYERING = 193;
  function arDig(root) {
    return; var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) { var v = n.nodeValue; if (/[0-9]/.test(v) && v.indexOf('@') < 0 && !/^[\s+\d()-]{7,}$/.test(v) && !(n.parentNode.closest && n.parentNode.closest('script,style,textarea,input'))) list.push(n); }
    list.forEach(function (t) { t.nodeValue = t.nodeValue.replace(/[0-9]/g, function (d) { return AD[d]; }); });
  }
  new MutationObserver(function (ms) { ms.forEach(function (m) { if (m.type === 'characterData') arDig(m.target.parentNode); else m.addedNodes.forEach(function (x) { if (x.nodeType === 1) arDig(x); else if (x.nodeType === 3) arDig(x.parentNode); }); }); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  function owlXf(step, anim) {
    var img = $('#owl'), d = $('#dial').getBoundingClientRect(); if (!d.width) return;
    var cx = d.left + d.width / 2, cy = d.top + d.height / 2, S0 = Math.min(innerWidth * 1.0 / OW, innerHeight * .8 / 1460), Sf = $('#dial').offsetWidth * .5 / EYERING;
    var t = step / intro.N, S = S0 * Math.pow(Sf / S0, t), e = Math.pow(t, 1.6), px = FACE[0] + (EYE[0] - FACE[0]) * e, py = FACE[1] + (EYE[1] - FACE[1]) * e;
    img.style.transition = anim ? 'transform 1.2s cubic-bezier(.45,.05,.25,1)' : 'none';
    img.style.transform = 'translate3d(' + (cx - px * S).toFixed(1) + 'px,' + (cy - py * S).toFixed(1) + 'px,0) scale(' + S.toFixed(4) + ')';
  }
  function introHint() {
    var s = intro.step, dots = ''; for (var i = 0; i < intro.N; i++) dots += '<i' + (i < s ? ' class="on"' : '') + '></i>';
    $('#introhint').innerHTML = '<span>' + T('intro.tap') + '</span><div class="dots">' + dots + '</div>';
    $('#introbrand').style.opacity = s === 0 ? 1 : 0;
  }
  function startIntro() {
    document.body.classList.remove('intro'); cur = 0; inPanel = true; document.body.classList.add('inpanel'); render('open'); if (dial) dial.set(DI(0));
  }
  $('#intro').onclick = function () {
    if (intro.step >= intro.N) return; intro.step++; owlXf(intro.step, true); introHint();
    if (intro.step >= intro.N) setTimeout(function () { document.body.classList.remove('intro'); }, 900);
  };
  window.addEventListener('resize', function () { if (!inPanel && me) owlXf(intro.step, false); });

  /* menu */
  function buildMenu() {
    $('#menulist').innerHTML = ORDER.map(function (id, i) { return '<button class="menuitem' + (inPanel && cur === i ? ' on' : '') + '" data-mi="' + i + '"><span class="mn">0' + (i + 1) + '</span><span class="mi">' + T(id) + '</span></button>'; }).join('');
    $('#bellt').textContent = T('bell'); $('#mout2').textContent = T('logout');
  }
  function openMenu() { buildMenu(); $('#menu').classList.add('on'); $('#menubg').classList.add('on'); }
  function closeMenu() { $('#menu').classList.remove('on'); $('#menubg').classList.remove('on'); }
  $('#burger').onclick = openMenu; $('#menuclose').onclick = closeMenu; $('#menubg').onclick = closeMenu;
  $('#menulist').onclick = function (e) { var b = e.target.closest('[data-mi]'); if (!b) return; closeMenu(); goto(+b.dataset.mi); };
  $('#mout2').onclick = function () { closeMenu(); logout(); };
  $('#addb').onclick = function () { quickAdd(); };

  /* ---------- forms ---------- */
  function f(sel) { return ($(sel, $('#sheetin')) || {}).value || ''; }
  function newTask(cid0) {
    var mgr = isMgr(), pv = null;
    var clSel = '<label class="fld"><span>' + T('f.client') + '</span><select id="fcl"><option value="">' + T('none.client') + '</option>' + D.clients.filter(function (c) { return c.status !== 'closed'; }).map(function (c) { return '<option value="' + c.id + '"' + (c.id === cid0 ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></label>';
    var who = mgr ? '<label class="fld"><span>' + T('f.assignee') + '</span><select id="fw"><option value="*">' + T('whole') + '</option>' + profiles.map(function (p) { return '<option value="' + p.id + '"' + (p.id === me.id ? ' selected' : '') + '>' + esc(p.name || p.email) + '</option>'; }).join('') + '</select></label>' : '';
    openSheet('<h2>' + T('new.task') + '</h2><label class="fld"><span>' + T('f.title') + '</span><input id="ft"></label>' + who + clSel + '<div class="two"><label class="fld"><span>' + T('f.prio') + '</span><select id="fp">' + options(['low', 'normal', 'high', 'urgent'], 'pr.', 'normal') + '</select></label><label class="fld"><span>' + T('f.due') + '</span><input id="fdu" type="date" dir="ltr"></label></div><label class="fld"><span>' + T('f.desc') + '</span><textarea id="fd"></textarea></label>' + voiceBox('vb1') + '<button class="btn big" id="ok">' + T('send') + '</button>');
    bindVoice('vb1', function (r) { pv = r; });
    $('#ok').onclick = async function () {
      if (!f('#ft').trim()) return $('#ft').focus();
      var team = mgr && f('#fw') === '*';
      var row = { title: f('#ft').trim(), assigned_to: team ? null : (mgr ? f('#fw') : me.id), team: team, priority: f('#fp'), due_date: f('#fdu') || null, description: f('#fd'), status: 'todo', client_id: f('#fcl') || null };
      var ok = await act(async function () { var r = await Store.insert('tasks', row); if (pv) await Store.insert('voice_notes', { task_id: r.id, audio: pv.data, secs: pv.secs }); await notify(team ? allIds() : [row.assigned_to], 'task_assigned', 'tasks', row.title); return r; }, 'sent');
      if (ok) { closeSheet(); goto(ORDER.indexOf('tasks')); }
    };
  }
  /* ---------- checklist and links on a task ---------- */
  function ckChip(t) { var c = t.checklist || []; if (!c.length) return ''; var d = c.filter(function (x) { return x.d; }).length; return '<span class="ckchip">' + d + '/' + c.length + '</span>'; }
  function goodUrl(u) { return /^https?:\/\/[^\s]+\.[^\s]+/i.test(u); }
  function checklistBlock(t, can) {
    var ck = t.checklist || [], d = ck.filter(function (x) { return x.d; }).length;
    return '<h2>' + L('Checklist', 'الخطوات') + (ck.length ? ' · ' + d + '/' + ck.length : '') + '</h2>' + (ck.length ? '<div class="bar"><i style="width:' + Math.round(d / ck.length * 100) + '%"></i></div>' : '') +
      '<div id="cklist">' + ck.map(function (x, i) { return '<button type="button" class="ckrow' + (x.d ? ' on' : '') + '" data-ck="' + i + '"' + (can ? '' : ' disabled') + '><i></i><span>' + esc(x.t) + '</span></button>'; }).join('') + '</div>' +
      (can ? '<div class="row" style="margin-top:8px"><input id="fck" placeholder="' + L('Add a step', 'ضيف خطوة') + '"><button class="btn" id="ckadd">+</button></div>' : '') + (ck.length ? '' : '<div class="calnone">' + L('No steps yet.', 'مفيش خطوات لسه.') + '</div>');
  }
  function linksBlock(t, can) {
    var lk = t.links || [];
    return '<h2>' + L('Links', 'الروابط') + '</h2>' + (lk.length ? lk.map(function (x, i) { return '<div class="lkrow"><a href="' + esc(x.u) + '" target="_blank" rel="noopener"><b>' + esc(x.n || x.u) + '</b><small dir="ltr">' + esc(x.u.replace(/^https?:\/\//, '').slice(0, 42)) + '</small></a>' + (can ? '<button type="button" class="lkdel" data-lkdel="' + i + '" aria-label="' + T('delete') + '">×</button>' : '') + '</div>'; }).join('') : '<div class="calnone">' + L('No links yet.', 'مفيش روابط لسه.') + '</div>') +
      (can ? '<div class="two" style="margin-top:8px"><input id="fln" placeholder="' + L('Name', 'الاسم') + '"><input id="flu" dir="ltr" placeholder="https://"></div><button class="btn" id="lkadd" style="margin-top:8px">' + L('Add link', 'ضيف رابط') + '</button>' : '');
  }
  /* ---------- notes log on a client ---------- */
  function notesBlock(c) {
    var ns = D.client_notes.filter(function (n) { return n.client_id === c.id; }).sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
    return '<h2>' + L('Notes', 'الملاحظات') + (ns.length ? ' · ' + ns.length : '') + '</h2><div class="row"><input id="fcn" placeholder="' + L('Call, meeting, decision…', 'مكالمة، اجتماع، قرار…') + '"><button class="btn" id="cnadd">+</button></div>' +
      (ns.length ? ns.slice(0, 30).map(function (n) { return '<div class="cnrow"><div class="cnh"><b>' + esc(nameOf(n.user_id)) + '</b><small>' + I18N.ago(n.created_at) + '</small>' + (isMgr() || n.user_id === me.id ? '<button type="button" class="lkdel" data-cndel="' + n.id + '" aria-label="' + T('delete') + '">×</button>' : '') + '</div><div>' + esc(n.body) + '</div></div>'; }).join('') : '<div class="calnone">' + L('No notes yet.', 'مفيش ملاحظات لسه.') + '</div>');
  }
  function bindTaskExtras(t, id, can, reopen, table) {
    if (!can) return;
    var save = function (patch) { return act(function () { return Store.update(table || 'tasks', id, patch); }); };
    [].slice.call(document.querySelectorAll('#sheetin [data-ck]')).forEach(function (b) {
      b.onclick = function () { var i = +b.dataset.ck, ck = (t.checklist || []).map(function (x) { return { t: x.t, d: x.d }; }); ck[i].d = !ck[i].d; t.checklist = ck; b.classList.toggle('on', ck[i].d); save({ checklist: ck }).then(function () { reopen(true); }); };
    });
    var add = $('#ckadd'); if (add) { var go = function () { var v = f('#fck').trim(); if (!v) return; var ck = (t.checklist || []).concat([{ t: v.slice(0, 120), d: false }]); save({ checklist: ck }).then(function () { reopen(true); }); }; add.onclick = go; $('#fck').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } }; }
    [].slice.call(document.querySelectorAll('#sheetin [data-lkdel]')).forEach(function (b) { b.onclick = function () { var lk = (t.links || []).slice(); lk.splice(+b.dataset.lkdel, 1); save({ links: lk }).then(function () { reopen(true); }); }; });
    var la = $('#lkadd'); if (la) la.onclick = function () { var u = f('#flu').trim(); if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u; if (!goodUrl(u)) { toast(T('a.badurl')); return $('#flu').focus(); } var lk = (t.links || []).concat([{ n: f('#fln').trim().slice(0, 60), u: u }]); save({ links: lk }).then(function () { reopen(true); }); };
  }
  function taskDetail(id) {
    var t = D.tasks.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    var cm = D.task_comments.filter(function (c) { return c.task_id === id; }).sort(function (a, b) { return a.created_at.localeCompare(b.created_at); });
    var canSt = isMgr() || t.assigned_to === me.id || t.created_by === me.id;
    var members = profiles.filter(function (p) { return p.id !== t.created_by; });
    var team = t.team ? '<div class="ack">' + members.map(function (p) { return '<span class="' + (acked(t, p.id) ? 'y' : '') + '">' + (acked(t, p.id) ? '✓ ' : '') + esc(p.name || p.email) + '</span>'; }).join('') + '</div>' + (t.created_by !== me.id && !acked(t, me.id) ? '<button class="btn ok" id="ack" style="width:100%;margin-bottom:10px">' + T('ack.mine') + '</button>' : '') : '';
    openSheet('<h2>' + esc(t.title) + '</h2><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' + (t.client_id ? '<button class="pill" data-client="' + t.client_id + '">' + esc(clientName(t.client_id)) + '</button>' : '') + pill(t.status, T('st.' + t.status)) + pill(t.priority, T('pr.' + t.priority)) + (isLate(t) ? pill('urgent', T('overdue')) : '') + '</div><p style="color:var(--ash)">' + T('from.admin') + ': ' + esc(nameOf(t.created_by)) + ' · ' + (t.team ? T('whole') : t.assigned_to ? T('to') + ': ' + esc(nameOf(t.assigned_to)) : '') + (t.due_date ? ' · ' + I18N.date(t.due_date) : '') + '</p><p>' + esc(t.description) + '</p>' + team + checklistBlock(t, canSt) + linksBlock(t, canSt) +
      '<div id="vlist"></div>' + voiceBox('vb2') +
      (canSt ? '<label class="fld"><span>' + T('f.status') + '</span><select id="fs">' + options(['todo', 'in_progress', 'done'], 'st.', t.status) + '</select></label>' : '') +
      '<h2>' + T('comments') + '</h2>' + (cm.length ? cm.map(function (c) { return '<div class="cm"><small>' + esc(nameOf(c.user_id)) + ' · ' + I18N.ago(c.created_at) + '</small><div>' + esc(c.body) + '</div></div>'; }).join('') : '<div class="empty" style="padding:8px">' + T('none') + '</div>') +
      '<div class="row" style="margin-top:10px"><input id="fcm" placeholder="' + T('comment.ph') + '"><button class="btn" id="cmok">' + T('send') + '</button></div>' + (isMgr() ? '<button class="btn ghost danger" id="tdel">' + T('delete') + '</button>' : ''));
    var others = function () { return [t.created_by, t.assigned_to].concat(t.team ? allIds() : []); };
    bindTaskExtras(t, id, canSt, function (keep) { var y = $('#sheet').scrollTop; taskDetail(id); if (keep) $('#sheet').scrollTop = y; });
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
      '<div class="acts">' + (ph ? '<a class="btn" href="tel:' + esc(ph) + '">' + T('f.phone') + '</a><a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + esc(wa) + '">WhatsApp</a>' : '') + '<button class="btn" id="ed">' + T('edit') + '</button></div>' +
      linksBlock(c, isMgr() || c.created_by === me.id) + notesBlock(c) +
      '<h2>' + T('cl.members') + '</h2>' + (function () { var ms = membersOf(id); return (ms.length ? '<div class="avl">' + ms.map(function (p) { return '<button class="pk on" data-prof="' + p.id + '">' + avatar(p) + '<span>' + esc(p.name || p.email) + '<small>' + teamLabel(p.team) + '</small></span></button>'; }).join('') + '</div>' : '<div class="calnone">' + T('cl.nomem') + '</div>') + (isMgr() ? '<button class="btn" data-cmopen="' + id + '" style="margin-top:10px">' + T('cl.manage') + '</button>' : ''); })() +
      '<h2>' + T('cl.tasks') + '</h2>' + (function () { var ts = D.tasks.filter(function (t) { return t.client_id === id; }); return (ts.length ? ts.map(function (t) { return '<button class="item" data-task="' + t.id + '"><div class="t">' + esc(t.title) + '</div><div class="m">' + pill(t.status, T('st.' + t.status)) + '<span>' + esc(t.team ? T('whole') : nameOf(t.assigned_to)) + '</span>' + (t.due_date ? '<span>' + I18N.date(t.due_date) + '</span>' : '') + '</div></button>'; }).join('') : '<div class="calnone">' + T('cl.notask') + '</div>') + '<button class="btn" data-newtask="' + id + '" style="margin-top:10px">' + T('cl.addtask') + '</button>'; })());
    $('#ed').onclick = function () { clientForm(c); };
    bindTaskExtras(c, id, isMgr() || c.created_by === me.id, function (keep) { var y = $('#sheet').scrollTop; clientDetail(id); if (keep) $('#sheet').scrollTop = y; }, 'clients');
    var na = $('#cnadd'); if (na) { var gon = function () { var v = f('#fcn').trim(); if (!v) return; act(function () { return Store.insert('client_notes', { client_id: id, body: v.slice(0, 600) }); }).then(function () { var y = $('#sheet').scrollTop; clientDetail(id); $('#sheet').scrollTop = y; }); }; na.onclick = gon; $('#fcn').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); gon(); } }; }
    [].slice.call(document.querySelectorAll('#sheetin [data-cndel]')).forEach(function (b) { b.onclick = function () { act(function () { return Store.remove('client_notes', b.dataset.cndel); }).then(function () { clientDetail(id); }); }; });
  }


  /* ---------- expenses and advances ---------- */
  function money(n) { var v = Number(n || 0); var s = v.toLocaleString(I18N.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US'); return s + ' ' + T('e.cur'); }
  V.expenses = function () {
    var rows = mineOrAll(D.expenses), pend = rows.filter(function (r) { return r.status === 'pending'; }).length;
    var tot = rows.filter(function (r) { return r.status === 'approved' || r.status === 'settled'; }).reduce(function (s, r) { return s + Number(r.amount || 0); }, 0);
    var h = '<h1>' + T('expenses') + '</h1><p class="sub">' + T('e.intro') + '</p>' + scopeBar();
    h += '<div class="two3"><div class="kpi red"><b>' + pend + '</b><span>' + T('ls.pending') + '</span></div><div class="kpi"><b>' + money(tot) + '</b><span>' + T('ls.approved') + '</span></div></div>';
    h += '<button class="btn" data-new="expense" style="margin:4px 0 14px">' + T('new.expense') + '</button>';
    h += rows.length ? rows.map(function (r) { return '<button class="item" data-expense="' + r.id + '"><div class="t">' + money(r.amount) + ' · ' + T('e.' + r.kind) + '</div><div class="m">' + pill(r.status, T('ls.' + r.status)) + '<span>' + esc(nameOf(r.user_id)) + '</span><span>' + I18N.ago(r.created_at) + '</span></div></button>'; }).join('') : EMPTY();
    return h;
  };
  function newExpense() {
    openSheet('<h2>' + T('new.expense') + '</h2><label class="fld"><span>' + T('e.kind') + '</span><select id="fk">' + options(['expense', 'advance'], 'e.', 'expense') + '</select></label><label class="fld"><span>' + T('e.amount') + '</span><input id="fm" type="number" inputmode="decimal" min="1" step="any" dir="ltr"></label><label class="fld"><span>' + T('e.note') + '</span><textarea id="fr"></textarea></label><p class="err" id="ferr"></p><button class="btn big" id="ok">' + T('send') + '</button>');
    $('#ok').onclick = async function () {
      var amt = parseFloat(f('#fm')); if (!(amt > 0) || amt > 1000000) { $('#ferr').textContent = T('e.badamt'); return; }
      var k = f('#fk'), note = f('#fr');
      var ok = await act(async function () { await Store.insert('expenses', { kind: k, amount: amt, note: note, status: 'pending' }); await notify(admins(), 'expense_req', 'expenses', ''); }, 'sent'); if (ok) { closeSheet(); goto(ORDER.indexOf('expenses')); }
    };
  }
  function expenseDetail(id) {
    var r = D.expenses.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    openSheet('<h2>' + money(r.amount) + ' · ' + T('e.' + r.kind) + '</h2><div style="margin-bottom:8px">' + pill(r.status, T('ls.' + r.status)) + '</div><p style="color:var(--ash)">' + esc(nameOf(r.user_id)) + '</p><p>' + esc(r.note) + '</p>' + (r.decision_note ? '<p class="cm">' + esc(r.decision_note) + '</p>' : '') + decideButtons('expenses', id, r, 'approve', 'reject') + (isMgr() && r.status === 'approved' ? '<div class="acts"><button class="btn" id="dset">' + T('e.settle') + '</button></div>' : ''));
    wireDecide('expenses', id, 'approved', 'rejected', 'cancelled');
    if ($('#dset')) $('#dset').onclick = function () { act(async function () { await Store.update('expenses', id, { status: 'settled' }); await logDecision('expenses', r, 'settled', ''); }, 'saved').then(closeSheet); };
  }

  /* ---------- asset library (links; company assets are admin only) ---------- */
  function isAdm() { return me && me.role === 'admin'; }
  V.assets = function () {
    var rows = D.assets.filter(function (x) { return x.scope === 'client' || isAdm(); });
    var h = '<h1>' + T('assets') + '</h1><p class="sub">' + T('a.intro') + '</p><button class="btn" data-new="asset" style="margin-bottom:14px">' + T('new.asset') + '</button>';
    ['company', 'client'].forEach(function (sc) {
      var list = rows.filter(function (x) { return x.scope === sc; }); if (!list.length) return;
      h += '<h2 style="margin:18px 0 8px;font-size:15px;color:var(--mut)">' + T('a.' + sc) + '</h2>';
      h += list.map(function (x) { var c = D.clients.filter(function (k) { return k.id === x.client_id; })[0]; return '<button class="item" data-asset="' + x.id + '"><div class="t">' + esc(x.name) + '</div><div class="m">' + (c ? '<span>' + esc(c.name) + '</span>' : '') + '<span>' + I18N.ago(x.created_at) + '</span></div></button>'; }).join('');
    });
    return rows.length ? h : h + EMPTY();
  };
  function newAsset() {
    var scopes = isAdm() ? ['client', 'company'] : ['client'];
    openSheet('<h2>' + T('new.asset') + '</h2><label class="fld"><span>' + T('a.scope') + '</span><select id="fs">' + options(scopes, 'a.', 'client') + '</select></label><label class="fld"><span>' + T('a.client.pick') + '</span><select id="fc">' + D.clients.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></label><label class="fld"><span>' + T('a.name') + '</span><input id="fnm"></label><label class="fld"><span>' + T('a.url') + '</span><input id="fu" type="url" dir="ltr" placeholder="https://"></label><label class="fld"><span>' + T('e.note') + '</span><textarea id="fr"></textarea></label><p class="err" id="ferr"></p><button class="btn big" id="ok">' + T('save') + '</button>');
    $('#ok').onclick = async function () {
      var nm = f('#fnm'), u = f('#fu'), sc = f('#fs'); if (!nm || !/^https:\/\/\S+$/i.test(u)) { $('#ferr').textContent = T('a.badurl'); return; }
      if (sc === 'company' && !isAdm()) return;
      var ok = await act(function () { return Store.insert('assets', { scope: sc, client_id: sc === 'client' ? (f('#fc') || null) : null, name: nm, url: u, note: f('#fr') }); }, 'saved'); if (ok) { closeSheet(); goto(ORDER.indexOf('assets')); }
    };
  }
  function assetDetail(id) {
    var x = D.assets.filter(function (r) { return r.id === id; })[0]; if (!x || (x.scope === 'company' && !isAdm())) return;
    var safe = /^https:\/\//i.test(x.url) ? x.url : '#';
    openSheet('<h2>' + esc(x.name) + '</h2><p style="color:var(--ash)">' + T('a.' + x.scope) + ' · ' + esc(nameOf(x.user_id)) + '</p><p>' + esc(x.note) + '</p><a class="btn big" href="' + esc(safe) + '" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;text-decoration:none">' + T('a.open') + '</a>' + (isAdm() || x.user_id === me.id ? '<div class="acts"><button class="btn danger" id="adel">' + T('delete') + '</button></div>' : ''));
    if ($('#adel')) $('#adel').onclick = function () { act(function () { return Store.remove('assets', id); }, 'saved').then(closeSheet); };
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-scope],[data-f],[data-go],[data-task],[data-leave],[data-client],[data-resign],[data-expense],[data-asset],[data-new],[data-role],[data-prof],[data-act],[data-nref],[data-pickstar],[data-cal],[data-cm],[data-cmp],[data-cmopen],[data-cmdone],[data-newtask],[data-setrole]'); if (!t) return;
    var d = t.dataset;
    if (d.scope) { scope = d.scope; render(0); }
    else if (d.f) { var p = d.f.split(':'); filters[p[0]] = p[1]; render(0); }
    else if (d.go) goto(ORDER.indexOf(d.go));
    else if (d.task) taskDetail(d.task);
    else if (d.leave) leaveDetail(d.leave);
    else if (d.client) clientDetail(d.client);
    else if (d.resign) resignDetail(d.resign);
    else if (d.expense) expenseDetail(d.expense);
    else if (d.asset) assetDetail(d.asset);
    else if (d.new === 'resign') newResign();
    else if (d.new === 'expense') newExpense();
    else if (d.new === 'asset') newAsset();
    else if (d.prof) profileSheet(d.prof);
    else if (d.pickstar) pickStar(d.pickstar);
    else if (d.cal) { if (d.cal === 'prev') calM = new Date(calM.getFullYear(), calM.getMonth() - 1, 1); else if (d.cal === 'next') calM = new Date(calM.getFullYear(), calM.getMonth() + 1, 1); else calDay = d.cal.slice(4); render(0); }
    else if (d.cm) { var q = d.cm.split(':'); toggleMember(q[0], q[1]); }
    else if (d.setrole) { var sr = d.setrole.split(':'); act(function () { return Store.update('profiles', sr[0], { role: sr[1] }); }, 'saved').then(function () { profileSheet(sr[0]); }); }
    else if (d.cmp) { var q2 = d.cmp.split(':'); toggleMemberFromProfile(q2[0], q2[1]); }
    else if (d.cmopen) clientTeamSheet(d.cmopen);
    else if (d.cmdone) clientDetail(d.cmdone);
    else if (d.newtask) newTask(d.newtask);
    else if (d.act === 'bcast') bcastSheet();
    else if (d.act === 'star') starSheet();
    else if (d.act === 'gsearch') searchSheet();
    else if (d.act === 'csv') exportCSV();
    else if (d.act === 'report') reportSheet();
    else if (d.act === 'log') logSheet();
    else if (d.nref) { closeSheet(); goto(ORDER.indexOf(d.nref)); }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'q') { filters.q = e.target.value; var pos = e.target.selectionStart; render(0); var q = $('#q'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} } } });
  document.addEventListener('change', function (e) { if (e.target.id === 'attf') { attFilter = e.target.value; render(0); return; } if (e.target.dataset && e.target.dataset.team !== undefined) { var tu = e.target.dataset.team, tv = e.target.value; act(function () { return Store.setTeam(tu, tv); }, 'saved').then(function () { profileSheet(tu); }); return; } var r = e.target.dataset && e.target.dataset.role; if (r) act(function () { return Store.setRole(r, e.target.value); }, 'saved'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetOpen) closeSheet(); });
  $('#stage').addEventListener('click', function (e) { var ab = e.target.closest('#attbtn'); if (ab) return toggleAttend(); var b = e.target.closest('#mlang'), o = e.target.closest('#mout'); if (b) toggleLang(); if (o) logout(); });

  function toggleAttend() { var open = D.attendance.filter(function (r) { return r.user_id === me.id && !r.check_out; })[0]; act(function () { return open ? Store.update('attendance', open.id, { check_out: new Date().toISOString() }) : Store.insert('attendance', {}); }, open ? 'att.bye' : 'att.hi'); }
  function quickAdd() { var id = ORDER[cur]; if (id === 'tasks') newTask(); else if (id === 'leaves') newLeave(); else if (id === 'clients') clientForm(); else if (id === 'resign') newResign(); else if (id === 'expenses') newExpense(); else if (id === 'assets') newAsset(); }
  function toggleLang() { I18N.set(I18N.lang === 'ar' ? 'en' : 'ar'); chrome(); if (me) { render(0); buildMenu(); if (dial) dial.set(DI(cur)); } }
  function chrome() { applyText(); if (window.__theme) window.__theme(document.documentElement.getAttribute('data-theme') || 'light'); $('#applang').textContent = T('lang'); $('#authlang').textContent = T('lang'); setAuthMode(authMode); var d = $('#demobar'); $('#bellt').textContent = T('bell'); $('#mout2').textContent = T('logout'); if (Store.mode === 'demo' && me) { d.hidden = false; d.innerHTML = '<span>' + T('demo.bar') + '</span><button id="dreset">' + T('demo.reset') + '</button>'; $('#dreset').onclick = function () { Store.resetDemo(); location.reload(); }; } else d.hidden = true; }
  function theme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('crm.theme', t); } catch (e) {} [].forEach.call(document.querySelectorAll('meta[name=theme-color]'), function (m) { m.removeAttribute('media'); m.setAttribute('content', t === 'dark' ? '#0E0E10' : '#FFFFFF'); }); var b = $('#apptheme'); if (b) b.textContent = t === 'dark' ? (I18N.lang === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (I18N.lang === 'ar' ? 'الوضع الليلي' : 'Dark mode'); }
  $('#apptheme').onclick = function () { theme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); };
  window.__theme = theme; theme(document.documentElement.getAttribute('data-theme') || 'light');
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
    try { localStorage.setItem('crm.entered', '1'); } catch (e) {}
    $('#auth').hidden = true; $('#app').hidden = false; cur = 0; inPanel = false; document.body.classList.remove('inpanel'); $('#stage').innerHTML = '';
    me = Store.me() || me; await load(); me = (profiles.filter(function (p) { return p.id === me.id; })[0]) || me; chrome();
    var items = DIALORD.map(function (id) { return { id: id, label: function () { return T(id); }, sub: function () { return id === 'home' ? '' : id === 'me' ? T('profile') : T('dial.tap'); } }; });
    if (!dial) dial = Dial({ el: $('#dial'), items: items, index: DI(0), onCommit: function (i, d) { var was = cur; cur = ORDER.indexOf(DIALORD[i]); openPanel(was === cur ? 'open' : d); }, onTap: function () { openPanel('open'); }, onDrag: dragFollow, onDragEnd: dragRelease });
    else dial.set(DI(0));
    eyeState();
    if (Store.mode === 'live' && !enter.poll) enter.poll = setInterval(function () {
      if (!me || document.visibilityState !== 'visible') return;
      Store.list('notifications').then(function (rows) {
        var now = rows.filter(function (n) { return n.user_id === me.id && !n.read; }), had = unread().length;
        if (now.length > had) { load().then(function () { bell(); var n = unread()[0]; if (n) toast(nameOf(n.actor) + ' ' + T('n.' + n.kind)); if (!sheetOpen) render(0); }); }
        else { D.notifications = rows; bell(); }
      }).catch(function () {});
    }, 20000);
    $('#dialhint').textContent = T('dial.hint'); dial.set(DI(0)); buildMenu(); startIntro(); setTimeout(function () { $('#dialhint').textContent = ''; }, 6000);
  }

  /* ---------- boot ---------- */
  (async function () {
    chrome();
    var chosen = false; try { chosen = localStorage.getItem('crm.entered') === '1'; } catch (e) {}
    if (!chosen) { try { await Store.signOut(); } catch (e) {} me = null; }
    else { try { me = await Store.session(); } catch (e) { me = null; } }
    $('#boot').style.transition = 'opacity .4s'; 
    if (me) await enter(); else { $('#auth').hidden = false; }
    $('#boot').style.opacity = 0; setTimeout(function () { $('#boot').remove(); }, 450);
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(function () {});
  })();
})();
