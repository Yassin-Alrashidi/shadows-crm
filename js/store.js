/* Data layer. One small API, two engines:
   - "live": Supabase (shared database + real login), used when js/config.js has the project URL and key.
   - "demo": everything stays in this device's localStorage (so the app can be tried before the backend is connected). */
(function () {
  'use strict';
  var CFG = window.CRM_CONFIG || {};
  var live = !!(CFG.supabaseUrl && CFG.supabaseKey);
  var LS = window.localStorage;
  var TABLES = ['tasks', 'task_comments', 'leaves', 'resignations', 'clients', 'attendance', 'notifications', 'decisions', 'task_ack', 'stars', 'broadcasts', 'expenses', 'assets', 'client_members', 'client_notes', 'invoices', 'retainers', 'time_entries', 'content_items', 'meeting_notes'];
  var me = null; // current profile {id,email,name,role}

  function uid() { return (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(16).slice(2)); }
  function jget(k, d) { try { var v = LS.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function jset(k, v) { LS.setItem(k, JSON.stringify(v)); }
  var now = function () { return new Date().toISOString(); };

  /* ---------------- DEMO engine ---------------- */
  function SL(en, ar) { try { return localStorage.getItem('crm.lang') === 'ar' ? ar : en; } catch (e) { return en; } }
  var demo = {
    users: function () { return jget('crm.users', []); },
    saveUsers: function (u) { jset('crm.users', u); },
    t: function (n) { return jget('crm.t.' + n, []); },
    saveT: function (n, rows) { jset('crm.t.' + n, rows); },
    signUp: function (o) {
      var users = demo.users();
      if (users.some(function (u) { return u.email === o.email.toLowerCase(); })) throw new Error('exists');
      var u = { id: uid(), email: o.email.toLowerCase(), pw: o.password, name: o.name || o.email.split('@')[0], role: ((window.CRM_CONFIG||{}).adminEmails||[]).map(function(x){return x.toLowerCase()}).indexOf(o.email.toLowerCase()) > -1 ? 'admin' : 'employee', created_at: now() };
      users.push(u); demo.saveUsers(users); jset('crm.session', u.id); me = pub(u); return me;
    },
    signIn: function (o) {
      var u = demo.users().filter(function (x) { return x.email === o.email.toLowerCase() && x.pw === o.password; })[0];
      if (!u) throw new Error('bad');
      jset('crm.session', u.id); me = pub(u); return me;
    },
    session: function () { var id = jget('crm.session', null); var u = demo.users().filter(function (x) { return x.id === id; })[0]; me = u ? pub(u) : null; return me; },
    profiles: function () { return demo.users().map(pub); },
    seed: function () {
      if (jget('crm.seedv', 0) < 3) { Object.keys(LS).filter(function (k) { return k.indexOf('crm.') === 0 && k !== 'crm.lang' && k !== 'crm.theme'; }).forEach(function (k) { LS.removeItem(k); }); jset('crm.seedv', 3); }
      var users = demo.users(), ex = users.filter(function (u) { return u.email === 'demo@shadows.local'; })[0];
      if (ex) { jset('crm.session', ex.id); me = pub(ex); return me; }
      var boss = { id: uid(), email: 'demo@shadows.local', pw: 'demo', name: SL('Yassin (demo)', 'ياسين (تجريبي)'), role: 'admin', created_at: now() };
      var a = { id: uid(), email: 'sara@shadows.local', pw: 'demo', name: SL('Sara', 'سارة'), role: 'employee', created_at: now() };
      var b = { id: uid(), email: 'omar@shadows.local', pw: 'demo', name: SL('Omar', 'عمر'), role: 'employee', created_at: now() };
      users.push(boss, a, b); demo.saveUsers(users);
      var d = function (n) { return new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); };
      var ago = function (n) { return new Date(Date.now() - n * 864e5).toISOString(); };
      demo.saveT('tasks', [
        { id: uid(), created_by: boss.id, assigned_to: a.id, title: SL('Shoot the Nour Bakery reel', 'تصوير ريل مخبز نور'), description: SL('Friday morning. Bring the grips.', 'الجمعة الصبح. هاتوا معدات التثبيت.'), priority: 'high', status: 'in_progress', due_date: d(1), created_at: ago(1), updated_at: ago(1) },
        { id: uid(), created_by: boss.id, assigned_to: b.id, title: SL('Edit the Atlas Fitness teaser', 'عمل مونتاج تيزر أطلس فيتنس'), description: SL('Cut to 20 seconds, vertical.', 'قصّه لـ 20 ثانية بالطول.'), priority: 'urgent', status: 'todo', due_date: d(-1), created_at: ago(2), updated_at: ago(2) },
        { id: uid(), created_by: boss.id, assigned_to: a.id, title: SL('Send the weekly report', 'إرسال التقرير الأسبوعي'), description: '', priority: 'normal', status: 'done', due_date: d(-1), created_at: ago(6), updated_at: ago(4) }
      ]);
      demo.saveT('broadcasts', [
        { id: uid(), from_user: boss.id, body: SL('Client meeting moved to 4 PM today. Everyone in the studio by 3:30.', 'اجتماع العميل اتأجل لـ 4 العصر النهارده. الكل في الاستوديو 3:30.'), urgent: true, created_at: ago(0.1) }
      ]);
      demo.saveT('stars', [
        { id: uid(), user_id: a.id, week_start: (function () { var x = new Date(); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() - 6 + 7) % 7)); return x.toISOString().slice(0, 10); })(), picked_by: boss.id, created_at: ago(1) }
      ]);
      demo.saveT('task_ack', []); demo.saveT('voice_notes', []);
      demo.saveT('notifications', [
        { id: uid(), user_id: boss.id, kind: 'leave_req', ref: 'leaves', subject: 'annual', actor: a.id, read: false, created_at: ago(0.05) },
        { id: uid(), user_id: boss.id, kind: 'task_done', ref: 'tasks', subject: 'Send the weekly report', actor: a.id, read: false, created_at: ago(0.3) }
      ]);
      demo.saveT('decisions', [
        { id: uid(), kind: 'leave', ref_id: uid(), subject_user: b.id, decided_by: boss.id, decision: 'approved', note: '', created_at: ago(5) }
      ]);
      demo.saveT('leaves', [
        { id: uid(), user_id: a.id, type: 'annual', start_date: d(9), end_date: d(12), days: 4, reason: SL('Family trip', 'سفر عائلي'), status: 'pending', created_at: ago(1) },
        { id: uid(), user_id: b.id, type: 'sick', start_date: d(-5), end_date: d(-4), days: 2, reason: '', status: 'approved', created_at: ago(6) }
      ]);
      demo.saveT('clients', [
        { id: uid(), created_by: boss.id, name: SL('Nour Bakery', 'مخبز نور'), contact: SL('Mariam', 'مريم'), phone: '+201000000001', email: '', status: 'active', notes: SL('Monthly reels and product photos.', 'ريلز شهرية وصور منتجات.'), created_at: ago(20) },
        { id: uid(), created_by: boss.id, name: SL('Atlas Fitness', 'أطلس فيتنس'), contact: SL('Hesham', 'هشام'), phone: '+201000000002', email: '', status: 'lead', notes: SL('Asked for a campaign quote.', 'طلب عرض سعر لحملة.'), created_at: ago(3) }
      ]);
      demo.saveT('attendance', [
        { id: uid(), user_id: a.id, check_in: ago(0.3), check_out: null, created_at: ago(0.3) },
        { id: uid(), user_id: b.id, check_in: ago(1.4), check_out: ago(1.05), created_at: ago(1.4) },
        { id: uid(), user_id: a.id, check_in: ago(1.4), check_out: ago(1.08), created_at: ago(1.4) }
      ]);
      var tk = demo.t('tasks'); tk.push({ id: uid(), created_by: boss.id, assigned_to: null, team: true, title: SL('Everyone: prepare for tomorrow\'s presentation', 'الكل: جهّزوا لعرض بكرة'), description: SL('Read the deck and note two questions each.', 'اقرأوا العرض وسجّلوا سؤالين لكل واحد.'), priority: 'high', status: 'todo', due_date: d(1), created_at: ago(0.2), updated_at: ago(0.2) }); demo.saveT('tasks', tk);
      demo.saveT('expenses', [
        { id: uid(), user_id: a.id, kind: 'expense', amount: 350, note: SL('Props for the bakery shoot', 'إكسسوارات تصوير المخبز'), status: 'pending', created_at: ago(0.5) },
        { id: uid(), user_id: b.id, kind: 'advance', amount: 2000, note: SL('Advance on this month', 'سلفة على الشهر ده'), status: 'approved', created_at: ago(4) }
      ]);
      var cl = demo.t('clients');
      demo.saveT('assets', [
        { id: uid(), user_id: boss.id, scope: 'company', client_id: null, name: SL('Brand kit', 'هوية الشركة'), url: 'https://example.com/brand-kit', note: SL('Logos and colours', 'اللوجوهات والألوان'), created_at: ago(30) },
        { id: uid(), user_id: boss.id, scope: 'client', client_id: cl[0] && cl[0].id, name: SL('Nour Bakery photos', 'صور مخبز نور'), url: 'https://example.com/nour', note: '', created_at: ago(10) }
      ]);
      demo.saveT('resignations', []); demo.saveT('task_comments', []);
      /* richer demo data: more people in teams, clients with members, client-linked tasks, leaves for the calendar */
      (function () {
        var us = demo.users(), nm = function (en, ar, em, team) { var u = { id: uid(), email: em, pw: 'demo', name: SL(en, ar), role: 'employee', team: team, created_at: now() }; us.push(u); return u; };
        us.forEach(function (u) { if (u.email === 'sara@shadows.local') u.team = 'production'; if (u.email === 'omar@shadows.local') u.team = 'editing'; });
        var nada = nm('Nada', 'ندى', 'nada@shadows.local', 'design'), karim = nm('Karim', 'كريم', 'karim@shadows.local', 'editing'), hana = nm('Hana', 'هنا', 'hana@shadows.local', 'social');
        demo.saveUsers(us);
        var sara = us.filter(function (u) { return u.email === 'sara@shadows.local'; })[0], omar = us.filter(function (u) { return u.email === 'omar@shadows.local'; })[0];
        var cs = demo.t('clients');
        var zahra = { id: uid(), created_by: boss.id, name: SL('Zahra Dental', 'عيادات زهرة'), contact: SL('Dr. Zahra', 'د. زهرة'), phone: '+201000000003', email: '', status: 'active', notes: SL('Weekly social posts and a Ramadan campaign.', 'بوستات أسبوعية وحملة رمضان.'), created_at: ago(20) };
        var pixel = { id: uid(), created_by: boss.id, name: SL('Pixel Studio', 'بيكسل ستوديو'), contact: SL('Tamer', 'تامر'), phone: '+201000000004', email: '', status: 'paused', notes: SL('Paused until next quarter.', 'موقوف لحد الربع الجاي.'), created_at: ago(40) };
        cs.push(zahra, pixel); demo.saveT('clients', cs);
        var nour = cs.filter(function (c) { return c.name === SL('Nour Bakery', 'مخبز نور'); })[0], atlas = cs.filter(function (c) { return c.name === SL('Atlas Fitness', 'أطلس فيتنس'); })[0];
        var cm = function (c, u) { return { id: uid(), client_id: c.id, user_id: u.id, created_at: ago(5) }; };
        demo.saveT('client_members', [cm(nour, sara), cm(nour, hana), cm(nour, nada), cm(atlas, omar), cm(atlas, karim), cm(zahra, hana), cm(zahra, nada), cm(zahra, sara)]);
        var tk = demo.t('tasks');
        tk.forEach(function (t) { if (/Nour|نور/.test(t.title)) t.client_id = nour.id; if (/Atlas|أطلس/.test(t.title)) t.client_id = atlas.id; });
        tk.push({ id: uid(), created_by: boss.id, assigned_to: nada.id, title: SL('Design the Ramadan post set', 'تصميم بوستات رمضان'), description: SL('6 posts, brand colours.', '6 بوستات بألوان الهوية.'), priority: 'high', status: 'in_progress', due_date: d(2), client_id: zahra.id, created_at: ago(3), updated_at: ago(1) });
        tk.push({ id: uid(), created_by: boss.id, assigned_to: hana.id, title: SL('Schedule next week captions', 'جدولة كابشنز الأسبوع الجاي'), description: '', priority: 'normal', status: 'todo', due_date: d(4), client_id: zahra.id, created_at: ago(2), updated_at: ago(2) });
        tk.push({ id: uid(), created_by: boss.id, assigned_to: karim.id, title: SL('Colour grade the gym promo', 'كولور جريدينج لإعلان الجيم'), description: SL('Warm, high contrast.', 'ألوان دافية وكونتراست عالي.'), priority: 'normal', status: 'todo', due_date: d(-1), client_id: atlas.id, created_at: ago(5), updated_at: ago(5) });
        demo.saveT('tasks', tk);
        var lv = demo.t('leaves');
        lv.push({ id: uid(), user_id: nada.id, type: 'annual', start_date: d(3), end_date: d(5), days: 3, reason: '', status: 'approved', created_at: ago(8) });
        lv.push({ id: uid(), user_id: karim.id, type: 'annual', start_date: d(8), end_date: d(10), days: 3, reason: SL('Short break', 'راحة قصيرة'), status: 'approved', created_at: ago(7) });
        lv.push({ id: uid(), user_id: hana.id, type: 'sick', start_date: d(1), end_date: d(1), days: 1, reason: '', status: 'approved', created_at: ago(1) });
        demo.saveT('leaves', lv);
      })();
      jset('crm.session', boss.id); me = pub(boss); return me;
    }
  };
  function pub(u) { return { id: u.id, email: u.email, name: u.name, role: u.role, team: u.team || '' }; }

  /* ---------------- LIVE engine (Supabase REST) ---------------- */
  var base = (CFG.supabaseUrl || '').replace(/\/+$/, '');
  var tok = jget('crm.tok', null); // {access, refresh, exp}
  function hdr(extra) {
    var h = { apikey: CFG.supabaseKey, 'Content-Type': 'application/json' };
    h.Authorization = 'Bearer ' + (tok ? tok.access : CFG.supabaseKey);
    for (var k in extra) h[k] = extra[k]; return h;
  }
  async function refresh() {
    if (!tok || !tok.refresh) return false;
    var r = await fetch(base + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: CFG.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: tok.refresh }) });
    if (!r.ok) { tok = null; LS.removeItem('crm.tok'); return false; }
    setTok(await r.json()); return true;
  }
  function setTok(j) { tok = { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000, uid: j.user && j.user.id || (tok && tok.uid) }; jset('crm.tok', tok); }
  async function api(path, opt) {
    if (tok && Date.now() > tok.exp) await refresh();
    var r = await fetch(base + path, { method: opt.method || 'GET', headers: hdr(opt.headers || {}), body: opt.body ? JSON.stringify(opt.body) : undefined });
    if (r.status === 401 && await refresh()) r = await fetch(base + path, { method: opt.method || 'GET', headers: hdr(opt.headers || {}), body: opt.body ? JSON.stringify(opt.body) : undefined });
    var txt = await r.text(), j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok) { var m = (j && (j.msg || j.message || j.error_description || j.error)) || ('HTTP ' + r.status); var e = new Error(m); e.status = r.status; throw e; }
    return j;
  }
  var remote = {
    signUp: async function (o) {
      var j = await api('/auth/v1/signup', { method: 'POST', body: { email: o.email, password: o.password, data: { name: o.name } } });
      if (!j.access_token) throw new Error('confirm');      // the project still asks for e-mail confirmation
      setTok(j); return remote.session();
    },
    signIn: async function (o) {
      var j = await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: o.email, password: o.password } });
      setTok(j); return remote.session();
    },
    session: async function () {
      if (!tok) { me = null; return null; }
      if (Date.now() > tok.exp && !(await refresh())) { me = null; return null; }
      var u = await api('/auth/v1/user', {}); var rows = await api('/rest/v1/profiles?id=eq.' + u.id + '&select=*', {});
      me = rows[0] ? { id: rows[0].id, email: rows[0].email, name: rows[0].name, role: rows[0].role, team: rows[0].team || '' } : { id: u.id, email: u.email, name: u.email, role: 'employee' };
      return me;
    },
    profiles: async function () { return api('/rest/v1/profiles?select=id,email,name,role,team&order=created_at.asc', {}); },
    list: async function (t) { return api('/rest/v1/' + t + '?select=*&order=created_at.desc&limit=1000', {}); },
    insert: async function (t, row) { var j = await api('/rest/v1/' + t, { method: 'POST', body: row, headers: { Prefer: 'return=representation' } }); return j[0]; },
    update: async function (t, id, patch) { var j = await api('/rest/v1/' + t + '?id=eq.' + id, { method: 'PATCH', body: patch, headers: { Prefer: 'return=representation' } }); return j[0]; },
    remove: async function (t, id) { await api('/rest/v1/' + t + '?id=eq.' + id, { method: 'DELETE' }); }
  };

  /* ---------------- public API ---------------- */
  var Store = {
    mode: live ? 'live' : 'demo',
    signUp: async function (o) { return live ? remote.signUp(o) : demo.signUp(o); },
    signIn: async function (o) { return live ? remote.signIn(o) : demo.signIn(o); },
    session: async function () { return live ? remote.session() : demo.session(); },
    signOut: async function () { me = null; if (live) { try { await api('/auth/v1/logout', { method: 'POST' }); } catch (e) {} tok = null; LS.removeItem('crm.tok'); } else LS.removeItem('crm.session'); },
    demoSeed: async function () { return demo.seed(); },
    profiles: async function () { return live ? remote.profiles() : demo.profiles(); },
    list: async function (t) {
      if (live) return remote.list(t);
      return demo.t(t).slice().sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
    },
    insert: async function (t, row) {
      row = Object.assign({}, row);
      if (t === 'clients' || t === 'tasks') row.created_by = me.id; else if (['notifications', 'decisions', 'stars', 'broadcasts', 'client_members', 'retainers'].indexOf(t) < 0) row.user_id = me.id;
      if (live) return remote.insert(t, row);
      row.id = uid(); row.created_at = now(); if (t === 'tasks') row.updated_at = row.created_at; if (t === 'attendance') { row.check_in = row.created_at; row.check_out = null; }
      var rows = demo.t(t); rows.push(row); demo.saveT(t, rows); return row;
    },
    update: async function (t, id, patch) {
      patch = Object.assign({}, patch); if (t === 'tasks') patch.updated_at = now();
      if (live) return remote.update(t, id, patch);
      var rows = demo.t(t), r = rows.filter(function (x) { return x.id === id; })[0]; if (r) Object.assign(r, patch); demo.saveT(t, rows); return r;
    },
    where: async function (t, col, val) {
      if (live) return api('/rest/v1/' + t + '?select=*&' + col + '=eq.' + encodeURIComponent(val) + '&order=created_at.asc', {});
      return demo.t(t).filter(function (r) { return r[col] === val; });
    },
    remove: async function (t, id) { if (live) return remote.remove(t, id); demo.saveT(t, demo.t(t).filter(function (x) { return x.id !== id; })); },
    setRole: async function (id, role) {
      if (live) return remote.update('profiles', id, { role: role });
      var u = demo.users(); u.forEach(function (x) { if (x.id === id) x.role = role; }); demo.saveUsers(u);
    },
    setTeam: async function (id, team) {
      if (live) return remote.update('profiles', id, { team: team });
      var u = demo.users(); u.forEach(function (x) { if (x.id === id) x.team = team; }); demo.saveUsers(u);
    },
    resetDemo: function () { Object.keys(LS).filter(function (k) { return k.indexOf('crm.') === 0; }).forEach(function (k) { LS.removeItem(k); }); },
    me: function () { return me; },
    TABLES: TABLES
  };
  window.Store = Store;
})();
