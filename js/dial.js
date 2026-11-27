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
    var AL = 'M12 54 L28 41 L50 34 L72 41 L88 54 L72 66 L50 72 L28 66 Z';
    var ticks = '', i, a, big, r1, r2;
    for (i = 0; i < 48; i++) { a = i * 7.5 * Math.PI / 180; big = i % 4 === 0; r1 = big ? 39 : 41.5; r2 = 45.5; ticks += '<line x1="' + (50 + Math.sin(a) * r1).toFixed(2) + '" y1="' + (52 - Math.cos(a) * r1).toFixed(2) + '" x2="' + (50 + Math.sin(a) * r2).toFixed(2) + '" y2="' + (52 - Math.cos(a) * r2).toFixed(2) + '" stroke="' + (big ? '#ff3a3f' : '#f7f5f5') + '" stroke-opacity="' + (big ? 1 : .3) + '" stroke-width="' + (big ? 1.5 : .8) + '"/>'; }
    var facets = '', k, a1, a2;
    for (k = 0; k < 24; k++) { a1 = k * 15 * Math.PI / 180; a2 = (k + 1) * 15 * Math.PI / 180; facets += '<path d="M50 52 L' + (50 + Math.sin(a1) * 30).toFixed(1) + ' ' + (52 - Math.cos(a1) * 30).toFixed(1) + ' L' + (50 + Math.sin(a2) * 30).toFixed(1) + ' ' + (52 - Math.cos(a2) * 30).toFixed(1) + 'Z" fill="' + (k % 2 ? '#000' : '#ff5a3c') + '" fill-opacity="' + (k % 2 ? .22 : .10) + '"/>'; }
    return '<svg viewBox="-4 -14 108 118" aria-hidden="true"><defs>' +
      '<radialGradient id="bz" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#050405"/><stop offset=".9" stop-color="#1a0407"/><stop offset="1" stop-color="#3a0710"/></radialGradient>' +
      '<radialGradient id="ir" cx="50%" cy="52%" r="50%"><stop offset="0" stop-color="#ffb08a"/><stop offset=".22" stop-color="#ff6a3c"/><stop offset=".5" stop-color="#ff2a30"/><stop offset=".82" stop-color="#7d0714"/><stop offset="1" stop-color="#1c0206"/></radialGradient>' +
      '<radialGradient id="sc" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="#3a0710"/><stop offset="1" stop-color="#0a0204"/></radialGradient>' +
      '<radialGradient id="gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e11827" stop-opacity=".55"/><stop offset="1" stop-color="#e11827" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="alc"><path d="' + AL + '"/></clipPath></defs>' +
      '<path class="brow" d="M4 10 L50 -10 L96 10" fill="none" stroke="#e11827" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter"/>' +
      '<path d="M16 14 L50 0 L84 14" fill="none" stroke="#910814" stroke-width="1.2"/>' +
      '<circle cx="50" cy="52" r="48" fill="url(#bz)" stroke="#e11827" stroke-opacity=".8" stroke-width="1.4"/>' +
      '<circle cx="50" cy="52" r="47" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="2"/>' +
      '<g id="dRing" style="transform-origin:50px 52px">' + ticks + '</g>' +
      '<circle cx="50" cy="52" r="38" fill="url(#gl)"/>' +
      '<path d="' + AL + '" fill="url(#sc)"/>' +
      '<g clip-path="url(#alc)"><g id="dIris" style="transform-origin:50px 52px"><circle cx="50" cy="52" r="27" fill="url(#ir)"/>' + facets +
      '<circle cx="50" cy="52" r="27" fill="none" stroke="#1c0206" stroke-width="2.4"/><circle cx="50" cy="52" r="19" fill="none" stroke="#ff8a6a" stroke-opacity=".22" stroke-width="1"/><circle cx="50" cy="52" r="11" fill="none" stroke="#2a0409" stroke-opacity=".5" stroke-width="1"/></g>' +
      '<g id="dPupil"><path d="M50 37 L56 52 L50 67 L44 52 Z" fill="#030203"/><path d="M47 44 L49 40 L49.6 47 Z" fill="#fff" fill-opacity=".8"/></g>' +
      '<path d="M0 20 L100 20 L100 38 L50 45 L0 38 Z" fill="#050405" fill-opacity=".82"/>' +
      '<path d="M0 38 L50 45 L100 38" fill="none" stroke="#ff3a3f" stroke-opacity=".5" stroke-width=".8"/>' +
      '<path d="M0 84 L100 84 L100 66 L50 62 L0 66Z" fill="#050405" fill-opacity=".45"/></g>' +
      '<path d="' + AL + '" fill="none" stroke="#ff3a3f" stroke-width="1.3" stroke-linejoin="miter"/>' +
      '<g id="dLid" style="transform-origin:50px 52px;transform:scaleY(0)"><path d="' + AL + '" fill="#050405"/></g></svg>';
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
    return { set: function (i) { cur = i; cand = i; rot = i * 40; setRot(rot, true); caption(); }, caption: caption, icon: icon };
  };
  window.Dial.icon = icon;
})();
