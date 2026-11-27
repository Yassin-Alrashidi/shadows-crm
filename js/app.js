(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var T = function (k) { return I18N.t(k); };
  var CFG = window.CRM_CONFIG || {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ORDER = ['home', 'tickets', 'leaves', 'clients', 'resign', 'me'];
  var me = null, profiles = [], D = { tickets: [], ticket_comments: [], leaves: [], resignations: [], clients: [] };
  var cur = 0, dial = null, scope = 'mine', filters = { tickets: 'all', leaves: 'all', clients: 'all', q: '' };
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

  /* ---------- data ---------- */
  async function load() {
    profiles = await Store.profiles();
    var names = ['tickets', 'ticket_comments', 'leaves', 'resignations', 'clients'];
    var res = await Promise.all(names.map(function (n) { return Store.list(n); }));
    names.forEach(function (n, i) { D[n] = res[i]; });
  }
  async function act(fn, okMsg) { try { await fn(); await load(); render(0); if (okMsg) toast(T(okMsg)); return true; } catch (e) { toast(T('fail')); return false; } }

  /* ---------- panels ---------- */
  var V = {};
  V.home = function () {
    var myOpen = D.tickets.filter(function (t) { return t.user_id === me.id && (t.status === 'open' || t.status === 'in_progress'); }).length;
    var pend = D.leaves.filter(function (l) { return l.status === 'pending' && (isMgr() || l.user_id === me.id); }).length;
    var act = D.clients.filter(function (c) { return c.status === 'active'; }).length;
    var allOpen = D.tickets.filter(function (t) { return t.status === 'open' || t.status === 'in_progress'; }).length;
    var need = isMgr() ? pend + D.resignations.filter(function (r) { return r.status === 'pending'; }).length : 0;
    var used = D.leaves.filter(function (l) { return l.user_id === me.id && l.type === 'annual' && l.status !== 'rejected' && l.status !== 'cancelled'; }).reduce(function (a, l) { return a + (l.days || 0); }, 0);
    var tot = CFG.annualLeaveDays || 21, left = Math.max(0, tot - used);
    var h = '<h1>' + T('hi') + ' ' + esc((me.name || '').split(' ')[0]) + '</h1><p class="sub">' + T('hi.sub') + '</p><div class="grid">' +
      '<div class="kpi red"><b>' + (isMgr() ? need : myOpen) + '</b><span>' + (isMgr() ? T('k.pending') : T('k.tickets')) + '</span></div>' +
      '<div class="kpi"><b>' + (isMgr() ? allOpen : pend) + '</b><span>' + (isMgr() ? T('k.tickets') : T('k.leaves')) + '</span></div>' +
      '<div class="kpi"><b>' + act + '</b><span>' + T('k.clients') + '</span></div>' +
      '<div class="kpi"><b>' + left + '</b><span>' + T('k.balance') + ' (' + T('days') + ')</span></div></div>';
    var ev = [];
    D.tickets.forEach(function (t) { if (isMgr() || t.user_id === me.id) ev.push({ at: t.created_at, p: 'tickets', txt: t.title, who: t.user_id, st: t.status, k: 'st.' }); });
    D.leaves.forEach(function (l) { if (isMgr() || l.user_id === me.id) ev.push({ at: l.created_at, p: 'leaves', txt: T('lt.' + l.type) + ' · ' + l.days + ' ' + T('dayn'), who: l.user_id, st: l.status, k: 'ls.' }); });
    D.resignations.forEach(function (r) { ev.push({ at: r.created_at, p: 'resign', txt: T('resign'), who: r.user_id, st: r.status, k: 'rs.' }); });
    ev.sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); });
    h += '<h2>' + T('recent') + '</h2>';
    h += ev.length ? ev.slice(0, 8).map(function (e) { return '<button class="item" data-go="' + e.p + '"><div class="t">' + esc(e.txt) + '</div><div class="m">' + pill(e.st, T(e.k + e.st)) + '<span>' + esc(nameOf(e.who)) + '</span><span>' + I18N.ago(e.at) + '</span></div></button>'; }).join('') : '<div class="empty">' + T('none') + '</div>';
    return h;
  };
  V.tickets = function () {
    var rows = mineOrAll(D.tickets).filter(function (t) { return filters.tickets === 'all' || t.status === filters.tickets; });
    var h = '<h1>' + T('tickets') + '</h1>' + scopeBar() + chipBar('tickets', ['open', 'in_progress', 'resolved', 'closed'], 'st.');
    h += rows.length ? rows.map(function (t) { return '<button class="item" data-ticket="' + t.id + '"><div class="t">' + esc(t.title) + '</div><div class="m">' + pill(t.status, T('st.' + t.status)) + pill(t.priority, T('pr.' + t.priority)) + '<span>' + T('cat.' + (t.category || 'other')) + '</span>' + (scope === 'all' && isMgr() ? '<span>' + esc(nameOf(t.user_id)) + '</span>' : '') + '<span>' + I18N.ago(t.created_at) + '</span></div></button>'; }).join('') : '<div class="empty">' + T('none') + '</div>';
    return h;
  };
  V.leaves = function () {
    var used = {}; D.leaves.filter(function (l) { return l.user_id === me.id && l.status !== 'rejected' && l.status !== 'cancelled'; }).forEach(function (l) { used[l.type] = (used[l.type] || 0) + (l.days || 0); });
    var tot = CFG.annualLeaveDays || 21, u = used.annual || 0;
    var h = '<h1>' + T('leaves') + '</h1><div class="card"><div class="row"><b>' + T('lt.annual') + '</b><span>' + Math.max(0, tot - u) + ' ' + T('balance.of') + ' ' + tot + ' ' + T('days') + '</span></div><div class="bar"><i style="width:' + Math.min(100, u / tot * 100) + '%"></i></div><small style="color:var(--ash)">' + u + ' ' + T('days') + ' ' + T('used') + (used.sick ? ' · ' + T('lt.sick') + ' ' + used.sick : '') + (used.unpaid ? ' · ' + T('lt.unpaid') + ' ' + used.unpaid : '') + (used.emergency ? ' · ' + T('lt.emergency') + ' ' + used.emergency : '') + '</small></div>';
    var rows = mineOrAll(D.leaves).filter(function (l) { return filters.leaves === 'all' || l.status === filters.leaves; });
    h += scopeBar() + chipBar('leaves', ['pending', 'approved', 'rejected', 'cancelled'], 'ls.');
    h += rows.length ? rows.map(function (l) { return '<button class="item" data-leave="' + l.id + '"><div class="t">' + T('lt.' + l.type) + ' · ' + l.days + ' ' + T('dayn') + '</div><div class="m">' + pill(l.status, T('ls.' + l.status)) + '<span dir="ltr">' + I18N.date(l.start_date) + ' → ' + I18N.date(l.end_date) + '</span>' + (scope === 'all' && isMgr() ? '<span>' + esc(nameOf(l.user_id)) + '</span>' : '') + '</div></button>'; }).join('') : '<div class="empty">' + T('none') + '</div>';
    return h;
  };
  V.clients = function () {
    var q = filters.q.toLowerCase();
    var rows = D.clients.filter(function (c) { return (filters.clients === 'all' || c.status === filters.clients) && (!q || [c.name, c.contact, c.phone, c.email].join(' ').toLowerCase().indexOf(q) > -1); });
    var h = '<h1>' + T('clients') + '</h1><input id="q" type="search" placeholder="' + T('search') + '" value="' + esc(filters.q) + '" style="margin-bottom:10px">' + chipBar('clients', ['lead', 'active', 'paused', 'closed'], 'cs.');
    h += rows.length ? rows.map(function (c) { return '<button class="item" data-client="' + c.id + '"><div class="t">' + esc(c.name) + '</div><div class="m">' + pill(c.status, T('cs.' + c.status)) + (c.contact ? '<span>' + esc(c.contact) + '</span>' : '') + (c.phone ? '<span dir="ltr">' + esc(c.phone) + '</span>' : '') + '</div></button>'; }).join('') : '<div class="empty">' + T('none') + '</div>';
    return h;
  };
  V.resign = function () {
    var rows = mineOrAll(D.resignations);
    var h = '<h1>' + T('resign') + '</h1><p class="sub">' + T('resign.intro') + '</p>' + scopeBar();
    h += '<button class="btn" data-new="resign" style="margin-bottom:14px">' + T('new.resign') + '</button>';
    h += rows.length ? rows.map(function (r) { return '<button class="item" data-resign="' + r.id + '"><div class="t">' + T('resign.last') + ': ' + I18N.date(r.last_day) + '</div><div class="m">' + pill(r.status, T('rs.' + r.status)) + '<span>' + esc(nameOf(r.user_id)) + '</span><span>' + I18N.ago(r.created_at) + '</span></div></button>'; }).join('') : '<div class="empty">' + T('none') + '</div>';
    return h;
  };
  V.me = function () {
    var h = '<h1>' + esc(me.name) + '</h1><p class="sub" dir="ltr" style="text-align:start">' + esc(me.email) + ' · ' + T('role.' + me.role) + '</p>' +
      '<div class="acts" style="margin:0 0 14px"><button class="btn" id="mlang">' + T('lang') + '</button><button class="btn danger" id="mout">' + T('logout') + '</button></div><p class="sub">' + T('install') + '</p>';
    if (isMgr()) {
      h += '<h2>' + T('team.h') + '</h2>' + profiles.map(function (p) {
        var sel = me.role === 'admin' && p.id !== me.id ? '<select data-role="' + p.id + '" style="width:auto;padding:6px 30px 6px 10px">' + options(['employee', 'manager', 'admin'], 'role.', p.role) + '</select>' : pill(p.role, T('role.' + p.role));
        return '<div class="card row"><div><div class="t">' + esc(p.name) + '</div><small dir="ltr" style="color:var(--ash)">' + esc(p.email) + '</small></div>' + sel + '</div>'; }).join('');
    }
    return h;
  };

  /* ---------- render + transitions ---------- */
  function render(dir) {
    var stage = $('#stage'), id = ORDER[cur], old = stage.querySelector('.panel');
    var p = document.createElement('div'); p.className = 'panel'; p.innerHTML = V[id]();
    var keep = old && old.dataset.id === id ? old.scrollTop : 0; p.dataset.id = id;
    stage.appendChild(p); p.scrollTop = keep;
    $('#title').textContent = T(id);
    if (old) {
      if (dir && old.animate) {
        var x = dir * 60; old.style.pointerEvents = 'none';
        old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(' + (-x) + 'px)', opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' }).onfinish = function () { old.remove(); };
        p.animate([{ transform: 'translateX(' + x + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1)' });
      } else old.remove();
    }
  }
  function goto(i, dir) { if (i === cur) return; var d = dir || (i > cur ? 1 : -1); if (document.documentElement.dir === 'rtl') d = -d; cur = i; render(d); if (dial) dial.set(i); }

  /* ---------- forms ---------- */
  function f(sel) { return ($(sel, $('#sheetin')) || {}).value || ''; }
  function newTicket() {
    openSheet('<h2>' + T('new.ticket') + '</h2><label class="fld"><span>' + T('f.title') + '</span><input id="ft"></label><div class="two"><label class="fld"><span>' + T('f.cat') + '</span><select id="fc">' + options(['it', 'hr', 'finance', 'workspace', 'other'], 'cat.', 'it') + '</select></label><label class="fld"><span>' + T('f.prio') + '</span><select id="fp">' + options(['low', 'normal', 'high', 'urgent'], 'pr.', 'normal') + '</select></label></div><label class="fld"><span>' + T('f.desc') + '</span><textarea id="fd"></textarea></label><button class="btn big" id="ok">' + T('send') + '</button>');
    $('#ok').onclick = async function () { if (!f('#ft').trim()) return $('#ft').focus(); var ok = await act(function () { return Store.insert('tickets', { title: f('#ft').trim(), category: f('#fc'), priority: f('#fp'), description: f('#fd'), status: 'open' }); }, 'sent'); if (ok) { closeSheet(); goto(1); } };
  }
  function ticketDetail(id) {
    var t = D.tickets.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    var cm = D.ticket_comments.filter(function (c) { return c.ticket_id === id; }).sort(function (a, b) { return a.created_at.localeCompare(b.created_at); });
    openSheet('<h2>' + esc(t.title) + '</h2><div class="m" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' + pill(t.status, T('st.' + t.status)) + pill(t.priority, T('pr.' + t.priority)) + pill('', T('cat.' + (t.category || 'other'))) + '</div><p style="color:var(--ash)">' + esc(nameOf(t.user_id)) + ' · ' + I18N.ago(t.created_at) + '</p><p>' + esc(t.description) + '</p>' +
      (isMgr() ? '<label class="fld"><span>' + T('f.status') + '</span><select id="fs">' + options(['open', 'in_progress', 'resolved', 'closed'], 'st.', t.status) + '</select></label>' : '') +
      '<h2>' + T('comments') + '</h2>' + (cm.length ? cm.map(function (c) { return '<div class="cm"><small>' + esc(nameOf(c.user_id)) + ' · ' + I18N.ago(c.created_at) + '</small><div>' + esc(c.body) + '</div></div>'; }).join('') : '<div class="empty" style="padding:8px">' + T('none') + '</div>') +
      '<div class="row" style="margin-top:10px"><input id="fcm" placeholder="' + T('comment.ph') + '"><button class="btn" id="cmok">' + T('send') + '</button></div>');
    var s = $('#fs'); if (s) s.onchange = function () { act(function () { return Store.update('tickets', id, { status: s.value }); }, 'saved').then(function () { ticketDetail(id); }); };
    $('#cmok').onclick = function () { var b = f('#fcm').trim(); if (!b) return; act(function () { return Store.insert('ticket_comments', { ticket_id: id, body: b }); }).then(function () { ticketDetail(id); }); };
  }
  function newLeave() {
    var today = new Date().toISOString().slice(0, 10);
    openSheet('<h2>' + T('new.leave') + '</h2><label class="fld"><span>' + T('f.type') + '</span><select id="fl">' + options(['annual', 'sick', 'unpaid', 'emergency'], 'lt.', 'annual') + '</select></label><div class="two"><label class="fld"><span>' + T('f.from') + '</span><input id="fa" type="date" value="' + today + '" dir="ltr"></label><label class="fld"><span>' + T('f.to') + '</span><input id="fb" type="date" value="' + today + '" dir="ltr"></label></div><label class="fld"><span>' + T('f.reason') + '</span><textarea id="fr"></textarea></label><p class="err" id="ferr"></p><button class="btn big" id="ok">' + T('send') + '</button>');
    $('#ok').onclick = async function () {
      var a = f('#fa'), b = f('#fb'), err = $('#ferr'); if (!a || !b || b < a) { err.textContent = T('baddates'); return; }
      var clash = D.leaves.some(function (l) { return l.user_id === me.id && (l.status === 'pending' || l.status === 'approved') && !(b < l.start_date || a > l.end_date); });
      if (clash) { err.textContent = T('overlap'); return; }
      var ok = await act(function () { return Store.insert('leaves', { type: f('#fl'), start_date: a, end_date: b, days: daysBetween(a, b), reason: f('#fr'), status: 'pending' }); }, 'sent'); if (ok) { closeSheet(); goto(2); }
    };
  }
  function decideButtons(kind, id, row, yes, no, yesCls) {
    return (isMgr() && row.status === 'pending' ? '<label class="fld"><span>' + T('note') + '</span><input id="fn"></label><div class="acts"><button class="btn ok" id="dy">' + T(yes) + '</button><button class="btn danger" id="dn">' + T(no) + '</button></div>' : '') +
      (row.user_id === me.id && row.status === 'pending' ? '<div class="acts"><button class="btn" id="dc">' + T(kind === 'leaves' ? 'cancelreq' : 'withdraw') + '</button></div>' : '');
  }
  function wireDecide(kind, id, yesSt, noSt, selfSt, reopen) {
    var go = function (st) { return function () { act(function () { return Store.update(kind, id, { status: st, decided_by: me.id, decision_note: f('#fn') }); }, 'saved').then(closeSheet); }; };
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
      $('#yes').onclick = async function () { var ok = await act(function () { return Store.insert('resignations', { last_day: last, reason: reason, status: 'pending' }); }, 'sent'); if (ok) { closeSheet(); goto(4); } };
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
      var ok = await act(function () { return c.id ? Store.update('clients', c.id, row) : Store.insert('clients', row); }, 'saved'); if (ok) { closeSheet(); if (cur !== 3) goto(3); }
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
    var t = e.target.closest('[data-scope],[data-f],[data-go],[data-ticket],[data-leave],[data-client],[data-resign],[data-new],[data-role]'); if (!t) return;
    var d = t.dataset;
    if (d.scope) { scope = d.scope; render(0); }
    else if (d.f) { var p = d.f.split(':'); filters[p[0]] = p[1]; render(0); }
    else if (d.go) goto(ORDER.indexOf(d.go));
    else if (d.ticket) ticketDetail(d.ticket);
    else if (d.leave) leaveDetail(d.leave);
    else if (d.client) clientDetail(d.client);
    else if (d.resign) resignDetail(d.resign);
    else if (d.new === 'resign') newResign();
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'q') { filters.q = e.target.value; var pos = e.target.selectionStart; render(0); var q = $('#q'); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} } } });
  document.addEventListener('change', function (e) { var r = e.target.dataset && e.target.dataset.role; if (r) act(function () { return Store.setRole(r, e.target.value); }, 'saved'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetOpen) closeSheet(); });
  $('#stage').addEventListener('click', function (e) { var b = e.target.closest('#mlang'), o = e.target.closest('#mout'); if (b) toggleLang(); if (o) logout(); });

  function quickAdd() { var id = ORDER[cur]; if (id === 'tickets' || id === 'home') newTicket(); else if (id === 'leaves') newLeave(); else if (id === 'clients') clientForm(); else if (id === 'resign') newResign(); }
  function toggleLang() { I18N.set(I18N.lang === 'ar' ? 'en' : 'ar'); chrome(); if (me) { render(0); $('#dialhint').textContent = T('dial.hint'); } }
  function chrome() { applyText(); $('#applang').textContent = T('lang'); $('#authlang').textContent = T('lang'); setAuthMode(authMode); var d = $('#demobar'); if (Store.mode === 'demo' && me) { d.hidden = false; d.innerHTML = '<span>' + T('demo.bar') + '</span><button id="dreset">' + T('demo.reset') + '</button>'; $('#dreset').onclick = function () { Store.resetDemo(); location.reload(); }; } else d.hidden = true; }
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
    catch (x) { var m = String(x && x.message || x); err.textContent = /exist|registered/i.test(m) ? T('auth.exists') : /bad|invalid/i.test(m) ? T('auth.bad') : /confirm/i.test(m) ? T('auth.confirm') : T('auth.err'); }
  };
  if (Store.mode === 'demo') $('#demobtn').hidden = false;
  $('#demobtn').onclick = async function () { me = await Store.demoSeed(); enter(); };
  async function logout() { await Store.signOut(); me = null; $('#app').hidden = true; $('#auth').hidden = false; chrome(); }

  async function enter() {
    $('#auth').hidden = true; $('#app').hidden = false; cur = 0; $('#stage').innerHTML = '';
    me = Store.me() || me; await load(); me = (profiles.filter(function (p) { return p.id === me.id; })[0]) || me; chrome();
    var items = ORDER.map(function (id) { return { id: id, label: function () { return T(id); }, sub: function () { return id === 'home' ? '' : id === 'me' ? T('profile') : T('dial.tap'); } }; });
    if (!dial) dial = Dial({ el: $('#dial'), items: items, index: 0, onCommit: function (i, dir) { cur = i; render(document.documentElement.dir === 'rtl' ? -dir : dir); }, onTap: quickAdd });
    else dial.set(0);
    $('#dialhint').textContent = T('dial.hint'); render(0); setTimeout(function () { $('#dialhint').textContent = ''; }, 6000);
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
