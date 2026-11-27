/* Data layer. One small API, two engines:
   - "live": Supabase (shared database + real login), used when js/config.js has the project URL and key.
   - "demo": everything stays in this device's localStorage (so the app can be tried before the backend is connected). */
(function () {
  'use strict';
  var CFG = window.CRM_CONFIG || {};
  var live = !!(CFG.supabaseUrl && CFG.supabaseKey);
  var LS = window.localStorage;
  var TABLES = ['tickets', 'ticket_comments', 'leaves', 'resignations', 'clients'];
  var me = null; // current profile {id,email,name,role}

  function uid() { return (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(16).slice(2)); }
  function jget(k, d) { try { var v = LS.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function jset(k, v) { LS.setItem(k, JSON.stringify(v)); }
  var now = function () { return new Date().toISOString(); };

  /* ---------------- DEMO engine ---------------- */
  var demo = {
    users: function () { return jget('crm.users', []); },
    saveUsers: function (u) { jset('crm.users', u); },
    t: function (n) { return jget('crm.t.' + n, []); },
    saveT: function (n, rows) { jset('crm.t.' + n, rows); },
    signUp: function (o) {
      var users = demo.users();
      if (users.some(function (u) { return u.email === o.email.toLowerCase(); })) throw new Error('exists');
      var u = { id: uid(), email: o.email.toLowerCase(), pw: o.password, name: o.name || o.email.split('@')[0], role: users.length ? 'employee' : 'admin', created_at: now() };
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
      var users = demo.users();
      var boss = { id: uid(), email: 'demo@shadows.local', pw: 'demo', name: 'Yassin (demo)', role: 'admin', created_at: now() };
      var a = { id: uid(), email: 'sara@shadows.local', pw: 'demo', name: 'Sara', role: 'employee', created_at: now() };
      var b = { id: uid(), email: 'omar@shadows.local', pw: 'demo', name: 'Omar', role: 'employee', created_at: now() };
      users.push(boss, a, b); demo.saveUsers(users);
      var d = function (n) { return new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); };
      var ago = function (n) { return new Date(Date.now() - n * 864e5).toISOString(); };
      demo.saveT('tickets', [
        { id: uid(), user_id: a.id, title: 'Camera battery grips missing', category: 'workspace', priority: 'high', status: 'open', description: 'Two grips are missing from the studio kit.', created_at: ago(1), updated_at: ago(1) },
        { id: uid(), user_id: b.id, title: 'Cloud storage is full', category: 'it', priority: 'urgent', status: 'in_progress', description: 'Cannot upload the Friday shoot.', created_at: ago(2), updated_at: ago(1) },
        { id: uid(), user_id: boss.id, title: 'Payslip question', category: 'finance', priority: 'low', status: 'resolved', description: '', created_at: ago(6), updated_at: ago(4) }
      ]);
      demo.saveT('leaves', [
        { id: uid(), user_id: a.id, type: 'annual', start_date: d(9), end_date: d(12), days: 4, reason: 'Family trip', status: 'pending', created_at: ago(1) },
        { id: uid(), user_id: b.id, type: 'sick', start_date: d(-5), end_date: d(-4), days: 2, reason: '', status: 'approved', created_at: ago(6) }
      ]);
      demo.saveT('clients', [
        { id: uid(), created_by: boss.id, name: 'Nour Bakery', contact: 'Mariam', phone: '+201000000001', email: '', status: 'active', notes: 'Monthly reels and product photos.', created_at: ago(20) },
        { id: uid(), created_by: boss.id, name: 'Atlas Fitness', contact: 'Hesham', phone: '+201000000002', email: '', status: 'lead', notes: 'Asked for a campaign quote.', created_at: ago(3) }
      ]);
      demo.saveT('resignations', []); demo.saveT('ticket_comments', []);
      jset('crm.session', boss.id); me = pub(boss); return me;
    }
  };
  function pub(u) { return { id: u.id, email: u.email, name: u.name, role: u.role }; }

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
      me = rows[0] ? { id: rows[0].id, email: rows[0].email, name: rows[0].name, role: rows[0].role } : { id: u.id, email: u.email, name: u.email, role: 'employee' };
      return me;
    },
    profiles: async function () { return api('/rest/v1/profiles?select=id,email,name,role&order=created_at.asc', {}); },
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
      if (t === 'clients') row.created_by = me.id; else row.user_id = me.id;
      if (live) return remote.insert(t, row);
      row.id = uid(); row.created_at = now(); if (t === 'tickets') row.updated_at = row.created_at;
      var rows = demo.t(t); rows.push(row); demo.saveT(t, rows); return row;
    },
    update: async function (t, id, patch) {
      patch = Object.assign({}, patch); if (t === 'tickets') patch.updated_at = now();
      if (live) return remote.update(t, id, patch);
      var rows = demo.t(t), r = rows.filter(function (x) { return x.id === id; })[0]; if (r) Object.assign(r, patch); demo.saveT(t, rows); return r;
    },
    remove: async function (t, id) { if (live) return remote.remove(t, id); demo.saveT(t, demo.t(t).filter(function (x) { return x.id !== id; })); },
    setRole: async function (id, role) {
      if (live) return remote.update('profiles', id, { role: role });
      var u = demo.users(); u.forEach(function (x) { if (x.id === id) x.role = role; }); demo.saveUsers(u);
    },
    resetDemo: function () { Object.keys(LS).filter(function (k) { return k.indexOf('crm.') === 0; }).forEach(function (k) { LS.removeItem(k); }); },
    me: function () { return me; },
    TABLES: TABLES
  };
  window.Store = Store;
})();
