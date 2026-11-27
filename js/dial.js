/* The owl-eye lens dial: fixed at the bottom centre. Drag it left or right like a camera zoom wheel:
   the lens turns, the pupil leans, candidate panels appear on that side, and letting go opens the one
   in the middle. A tap (no drag) is the quick-add of the open panel. Arrow keys work too. */
(function () {
  'use strict';
  var ICON = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    tickets: '<path d="M4 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h16v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H4z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/>',
    leaves: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    clients: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c3 .2 5 2.3 5 5.3"/>',
    resign: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5"/><path d="M14 8l4 4-4 4M18 12H9"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
  };
  function icon(id, size, sw) { return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.7) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[id] + '</svg>'; }

  var EYE = '' +
    '<svg viewBox="-4 -14 108 118" aria-hidden="true">' +
    '<defs><radialGradient id="ir" cx="50%" cy="46%" r="55%"><stop offset="0" stop-color="#ff4a52"/><stop offset=".45" stop-color="#e11827"/><stop offset="1" stop-color="#4a0510"/></radialGradient>' +
    '<radialGradient id="bz" cx="50%" cy="50%" r="50%"><stop offset=".78" stop-color="#0b0b0e"/><stop offset="1" stop-color="#1c1013"/></radialGradient></defs>' +
    '<path class="brow" d="M6 8 L50 -8 L94 8" fill="none" stroke="#e11827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="50" cy="52" r="48" fill="url(#bz)" stroke="#e11827" stroke-opacity=".75" stroke-width="1.6"/>' +
    '<g class="ring" id="dRing" style="transform-origin:50px 52px">' + (function () { var s = ''; for (var i = 0; i < 48; i++) { var a = i * 7.5 * Math.PI / 180, big = i % 4 === 0, r1 = big ? 38.5 : 41, r2 = 45; s += '<line x1="' + (50 + Math.sin(a) * r1).toFixed(2) + '" y1="' + (52 - Math.cos(a) * r1).toFixed(2) + '" x2="' + (50 + Math.sin(a) * r2).toFixed(2) + '" y2="' + (52 - Math.cos(a) * r2).toFixed(2) + '" stroke="' + (big ? '#e11827' : '#f7f5f5') + '" stroke-opacity="' + (big ? 1 : .35) + '" stroke-width="' + (big ? 1.6 : 1) + '"/>'; } return s; })() + '</g>' +
    '<circle cx="50" cy="52" r="34" fill="url(#ir)"/>' +
    '<g id="dIris" style="transform-origin:50px 52px"><circle cx="50" cy="52" r="27" fill="none" stroke="#2a0409" stroke-opacity=".7" stroke-width="2.2"/><circle cx="50" cy="52" r="20" fill="none" stroke="#2a0409" stroke-opacity=".6" stroke-width="2"/><circle cx="50" cy="52" r="13.5" fill="none" stroke="#2a0409" stroke-opacity=".55" stroke-width="1.8"/></g>' +
    '<g id="dPupil"><ellipse cx="50" cy="52" rx="6.2" ry="15" fill="#050506"/><ellipse cx="47.5" cy="44" rx="1.8" ry="3" fill="#fff" fill-opacity=".75"/></g>' +
    '<g id="dLid" style="transform-origin:50px 52px;transform:scaleY(0)"><circle cx="50" cy="52" r="34" fill="#0b0b0e"/></g>' +
    '</svg>';

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
    function caption() { cap.textContent = items[cur].label(); cap.classList.add('on'); clearTimeout(capT); capT = setTimeout(function () { cap.classList.remove('on'); }, 1500); }
    function commit(i) {
      var changed = i !== cur; show(false); setPupil(0); rot = i * 40; setRot(rot, true);
      if (changed) { var dir = i > cur ? 1 : -1; cur = i; o.onCommit(i, dir); caption(); } else caption();
    }
    function blink() { if (!lid.animate) return; lid.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)', offset: .45 }, { transform: 'scaleY(0)' }], { duration: 240 }); setTimeout(blink, 3500 + Math.random() * 3500); }
    setTimeout(blink, 2500);

    el.addEventListener('pointerdown', function (e) {
      dragging = true; moved = false; sx = e.clientX; base = cur; cand = cur;
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      el.classList.add('press');
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) < 7) return;
      if (!moved) { moved = true; show(true); layoutWheel(); layoutCard(dx > 0 ? 1 : -1); }
      var c = Math.max(0, Math.min(n - 1, base + Math.round(dx / STEP)));
      setRot(base * 40 + dx * .75, false); setPupil(Math.max(-9, Math.min(9, dx / 7)));
      if (c !== cand) { var dir = c > cand ? 1 : -1; cand = c; lastDir = dir; layoutWheel(); layoutCard(dir); if (navigator.vibrate) { try { navigator.vibrate(6); } catch (x) {} } }
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
    return { set: function (i) { cur = i; cand = i; rot = i * 40; setRot(rot, true); }, caption: caption, icon: icon };
  };
  window.Dial.icon = icon;
})();
