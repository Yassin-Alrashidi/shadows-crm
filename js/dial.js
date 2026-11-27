/* The owl-eye lens dial: fixed at the bottom centre. Drag it left or right like a camera zoom wheel:
   the lens turns, the pupil leans, candidate panels appear on that side, and letting go opens the one
   in the middle. A tap (no drag) is the quick-add of the open panel. Arrow keys work too. */
(function () {
  'use strict';
  var ICON = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    tasks: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
    attend: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    leaves: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    clients: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c3 .2 5 2.3 5 5.3"/>',
    resign: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5"/><path d="M14 8l4 4-4 4M18 12H9"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
  };
  function icon(id, size, sw) { return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.7) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[id] + '</svg>'; }

  var EYE = (function () {
    function oct(r, rot) { var p = [], i, a; for (i = 0; i < 8; i++) { a = (i * 45 + (rot || 22.5)) * Math.PI / 180; p.push((50 + Math.sin(a) * r).toFixed(1) + ' ' + (52 - Math.cos(a) * r * .86).toFixed(1)); } return 'M' + p.join(' L') + 'Z'; }
    var ticks = '', i, a, big, r1, r2;
    for (i = 0; i < 48; i++) { a = i * 7.5 * Math.PI / 180; big = i % 4 === 0; r1 = big ? 39.5 : 42; r2 = 46; ticks += '<line x1="' + (50 + Math.sin(a) * r1).toFixed(2) + '" y1="' + (52 - Math.cos(a) * r1).toFixed(2) + '" x2="' + (50 + Math.sin(a) * r2).toFixed(2) + '" y2="' + (52 - Math.cos(a) * r2).toFixed(2) + '" stroke="' + (big ? '#ff3a3f' : '#f7f5f5') + '" stroke-opacity="' + (big ? 1 : .3) + '" stroke-width="' + (big ? 1.6 : .8) + '"/>'; }
    var spokes = '', k, b; for (k = 0; k < 8; k++) { b = k * 45 * Math.PI / 180; spokes += '<line x1="' + (50 + Math.sin(b) * 9).toFixed(1) + '" y1="' + (52 - Math.cos(b) * 9 * .86).toFixed(1) + '" x2="' + (50 + Math.sin(b) * 25).toFixed(1) + '" y2="' + (52 - Math.cos(b) * 25 * .86).toFixed(1) + '" stroke="#ffb09a" stroke-opacity=".28" stroke-width=".7"/>'; }
    var FR = 'M6 53 L24 38 L50 33 L76 38 L94 53 L76 69 L50 75 L24 69Z';
    return '<svg viewBox="-4 -14 108 118" aria-hidden="true"><defs>' +
      '<radialGradient id="bz" cx="50%" cy="50%" r="50%"><stop offset=".5" stop-color="#040203"/><stop offset=".92" stop-color="#1d0508"/><stop offset="1" stop-color="#4a0912"/></radialGradient>' +
      '<linearGradient id="rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a50"/><stop offset=".45" stop-color="#d4121f"/><stop offset="1" stop-color="#6a0a14"/></linearGradient>' +
      '<radialGradient id="r1" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ff6a5a"/><stop offset=".5" stop-color="#e11827"/><stop offset="1" stop-color="#7a0714"/></radialGradient>' +
      '<radialGradient id="r2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff7a5a"/><stop offset=".6" stop-color="#ff2a30"/><stop offset="1" stop-color="#b40f1c"/></radialGradient>' +
      '<radialGradient id="gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e11827" stop-opacity=".6"/><stop offset="1" stop-color="#e11827" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="alc"><path d="' + FR + '"/></clipPath></defs>' +
      '<path class="brow" d="M2 12 L50 -12 L98 12" fill="none" stroke="#e11827" stroke-width="3.2" stroke-linecap="square" stroke-linejoin="miter"/>' +
      '<path d="M14 15 L50 -1 L86 15" fill="none" stroke="#910814" stroke-width="1.2"/><path d="M50 -1 L50 9" stroke="#e11827" stroke-width="1.2"/>' +
      '<circle cx="50" cy="52" r="48" fill="url(#bz)" stroke="#e11827" stroke-opacity=".85" stroke-width="1.4"/>' +
      '<circle cx="50" cy="52" r="47" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="2"/>' +
      '<g id="dRing" style="transform-origin:50px 52px">' + ticks + '</g>' +
      '<circle cx="50" cy="52" r="40" fill="url(#gl)"/>' +
      '<path d="' + FR + '" fill="url(#rb)"/>' +
      '<path d="M6 53 L24 38 L50 33 L50 75 L24 69Z" fill="#fff" fill-opacity=".07"/><path d="M50 33 L76 38 L94 53 L76 69 L50 75Z" fill="#000" fill-opacity=".18"/>' +
      '<g clip-path="url(#alc)"><path d="' + oct(29) + '" fill="#2a0409"/>' +
      '<g id="dIris" style="transform-origin:50px 52px">' +
      '<path d="' + oct(26) + '" fill="url(#r1)"/><path d="' + oct(26) + '" fill="none" stroke="#ffb0a0" stroke-opacity=".5" stroke-width=".8"/>' +
      '<path d="' + oct(19.5) + '" fill="#1c0206"/>' +
      '<path d="' + oct(15.5) + '" fill="url(#r2)"/><path d="' + oct(15.5) + '" fill="none" stroke="#ffd0c0" stroke-opacity=".45" stroke-width=".7"/>' + spokes + '</g>' +
      '<g id="dPupil"><path d="' + oct(8.5, 0) + '" fill="#050203"/><path d="M52.5 45 L56 46.5 L54 50 L51.5 48Z" fill="#fff" fill-opacity=".92"/><circle cx="46" cy="57" r="1" fill="#ff8a7a" fill-opacity=".7"/></g>' +
      '<path d="M0 22 L100 22 L100 37 L50 46 L0 37 Z" fill="#040203"/><path d="M0 37 L50 46 L100 37" fill="none" stroke="#ff5a50" stroke-opacity=".8" stroke-width=".9"/>' +
      '<path d="M0 86 L100 86 L100 68 L50 63 L0 68Z" fill="#040203" fill-opacity=".4"/></g>' +
      '<path d="' + FR + '" fill="none" stroke="#ff6a5a" stroke-width="1.4" stroke-linejoin="miter"/>' +
      '<g id="dLid" style="transform-origin:50px 52px;transform:scaleY(0)"><path d="' + FR + '" fill="#050405"/></g></svg>';
  })();

  window.Dial = function (o) {
    var el = o.el, items = o.items, n = items.length, STEP = 56, cur = o.index || 0;
    el.innerHTML = EYE;
    var ring = el.querySelector('#dRing'), pupil = el.querySelector('#dPupil'), iris = el.querySelector('#dIris'), lid = el.querySelector('#dLid');
    var cands = document.getElementById('cands'), cap = document.getElementById('dialcap');
    cands.innerHTML = '<div class="cw"><div class="cwrow">' + items.map(function (it, i) { return '<div class="wc" data-i="' + i + '">' + icon(it.id, 22) + '</div>'; }).join('') + '</div></div>' +
      '<div class="pcard" id="pcard"><div class="pcard__i"></div><div class="pcard__t"></div><div class="pcard__s"></div></div>';
    var row = cands.querySelector('.cwrow'), chips = [].slice.call(cands.querySelectorAll('.wc')), card = cands.querySelector('#pcard');
    var dragging = false, moved = false, sx = 0, base = 0, cand = cur, rot = cur * 40, lastDir = 1, capT = null;

    function setRot(deg, anim) { ring.style.transition = anim ? 'transform .5s cubic-bezier(.2,.9,.3,1)' : 'none'; ring.style.transform = 'rotate(' + deg + 'deg)'; iris.style.transition = ring.style.transition; iris.style.transform = 'rotate(' + (-deg * .5) + 'deg)'; }
    function setPupil(x) { pupil.style.transition = x === 0 ? 'transform .4s ease' : 'none'; pupil.style.transform = 'translateX(' + x.toFixed(1) + 'px)'; }
    setRot(rot, false);
    function layoutWheel() {
      var W = 52; row.style.transform = 'translateX(' + ((((n - 1) / 2) - cand) * W).toFixed(1) + 'px)';
      chips.forEach(function (c, i) { var d = Math.abs(i - cand); c.style.transform = 'scale(' + (d === 0 ? 1.28 : Math.max(.55, 1 - d * .18)).toFixed(2) + ')'; c.style.opacity = d === 0 ? 1 : Math.max(.22, 1 - d * .3); c.classList.toggle('is', d === 0); });
    }
    function layoutCard(dir) {
      var it = items[cand];
      card.querySelector('.pcard__i').innerHTML = icon(it.id, 34, 1.5);
      card.querySelector('.pcard__t').textContent = it.label();
      card.querySelector('.pcard__s').textContent = it.sub ? it.sub() : '';
      if (card.animate) card.animate([{ transform: 'translateX(' + (dir * 46) + 'px) scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1)' });
    }
    function show(on) { cands.classList.toggle('on', on); document.body.classList.toggle('dialing', on); el.classList.toggle('drag', on); }
    function caption() { cap.textContent = items[cur].label(); cap.classList.add('on'); }
    function commit(i) {
      var changed = i !== cur; show(false); setPupil(0); rot = i * 40; setRot(rot, true);
      var dir = i > cur ? 1 : i < cur ? -1 : 0; cur = i; o.onCommit(i, dir); caption();
    }
    function blink() { if (!lid.animate) return; lid.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)', offset: .45 }, { transform: 'scaleY(0)' }], { duration: 240 }); setTimeout(blink, 3500 + Math.random() * 3500); }
    setTimeout(blink, 2500);

    var ccx = 0, ccy = 0, lastA = 0, total = 0, STEPDEG = 40;
    function ang(ev) { return Math.atan2(ev.clientY - ccy, ev.clientX - ccx) * 180 / Math.PI; }
    el.addEventListener('pointerdown', function (e) {
      var r = el.getBoundingClientRect(); ccx = r.left + r.width / 2; ccy = r.top + r.height / 2;
      dragging = true; moved = false; total = 0; base = cur; cand = cur; lastA = ang(e); sx = e.clientX;
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      el.classList.add('press');
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - ccx, dy = e.clientY - ccy;
      if (Math.sqrt(dx * dx + dy * dy) < 22) return;
      var a = ang(e), da = a - lastA; if (da > 180) da -= 360; if (da < -180) da += 360; lastA = a;
      var prev = total; total += da;
      if (!moved && Math.abs(total) < 6) return;
      if (!moved) { moved = true; show(true); layoutWheel(); layoutCard(total > 0 ? 1 : -1); }
      var lo = -base * STEPDEG, hi = (n - 1 - base) * STEPDEG; total = Math.max(lo - 14, Math.min(hi + 14, total));
      var c = Math.max(0, Math.min(n - 1, base + Math.round(total / STEPDEG)));
      setRot(base * STEPDEG + total, false); setPupil(Math.max(-9, Math.min(9, (total - prev) * 3 + 0)));
      if (c !== cand) { var dir = c > cand ? 1 : -1; cand = c; lastDir = dir; layoutWheel(); layoutCard(dir); if (navigator.vibrate) { try { navigator.vibrate(8); } catch (x) {} } }
    });
    function end() {
      if (!dragging) return; dragging = false; el.classList.remove('press');
      if (moved) commit(cand); else if (o.onTap) o.onTap();
    }
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', function () { if (dragging) { dragging = false; el.classList.remove('press'); show(false); setPupil(0); setRot(cur * 40, true); } });
    el.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); var i = Math.max(0, Math.min(n - 1, cur + d)); if (i !== cur) commit(i); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (o.onTap) o.onTap(); }
    });
    return { set: function (i) { cur = i; cand = i; rot = i * 40; setRot(rot, true); caption(); }, caption: caption, icon: icon };
  };
  window.Dial.icon = icon;
})();
