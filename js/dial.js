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
    expenses: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>',
    assets: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    resign: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5"/><path d="M14 8l4 4-4 4M18 12H9"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
  };
  function icon(id, size, sw) { return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.7) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[id] + '</svg>'; }


  /* Camera-zoom dome: a red half circle at the bottom centre. Drag left or right to turn the wheel, release to open the page on top. */
  window.Dial = function (o) {
    var el = o.el, items = o.items, n = items.length, STEP = 27, R = 158, RHO = 118, cur = o.index || 0, cand = cur, base = cur * STEP, rot = base;
    var h = '<div class="dome"><div class="wheel" id="wheel">';
    items.forEach(function (it, i) {
      h += '<b class="tk" style="transform:rotate(' + (i * STEP - STEP / 2) + 'deg)"></b><button type="button" class="wi" data-i="' + i + '" aria-label="' + it.label() + '" style="transform:rotate(' + (i * STEP) + 'deg) translateY(-' + RHO + 'px)"><span style="transform:rotate(0deg)">' + icon(it.id, 24, 1.8) + '</span></button>';
    });
    h += '<b class="tk" style="transform:rotate(' + ((n - 1) * STEP + STEP / 2) + 'deg)"></b></div><i class="notch"></i></div><button type="button" class="eyebtn" id="eyebtn" aria-label="Menu"><img src="assets/eye.webp?v=31" alt="" width="300" height="300" draggable="false"></button><div class="dlabel" id="dlabel"></div>';
    el.innerHTML = h;
    var wheel = el.querySelector('#wheel'), lab = el.querySelector('#dlabel'), btns = [].slice.call(el.querySelectorAll('.wi'));
    var open = false, idle = null, lastClose = 0, eb = el.querySelector('#eyebtn');
    function setOpen(v) { open = v; el.classList.toggle('open', v); clearTimeout(idle); if (v) idle = setTimeout(function () { setOpen(false); lab.classList.remove('on'); }, 3500); else lastClose = Date.now(); }
    eb.addEventListener('click', function () { if (!open && Date.now() - lastClose > 350) setOpen(true); });
    var dragging = false, moved = false, sx = 0, startRot = 0, pup = el.querySelector('#eyebtn img');
    function lean(x) { pup.style.transition = x ? 'none' : 'transform .35s ease'; pup.style.transform = 'translateX(' + (x / 2).toFixed(1) + 'px)'; }

    function put(deg, anim) { wheel.style.transition = anim ? 'transform .4s cubic-bezier(.25,.8,.3,1)' : 'none'; wheel.style.transform = 'translateZ(0) rotate(' + (-deg).toFixed(2) + 'deg)'; rot = deg; }
    function mark(i) { btns.forEach(function (b, k) { b.classList.toggle('on', k === i); }); }
    function say(i, on) { lab.textContent = items[i].label(); lab.classList.toggle('on', !!on); }
    function commit(i) { var dir = i > cur ? 1 : i < cur ? -1 : 0, ch = i !== cur; cur = i; cand = i; mark(i); put(i * STEP, true); lab.classList.remove('on'); if (ch) o.onCommit(i, dir); }
    put(cur * STEP, false); mark(cur);
    el.addEventListener('pointerdown', function (e) { if (!open) return; clearTimeout(idle); dragging = true; moved = false; sx = e.clientX; startRot = cur * STEP; cand = cur; try { el.setPointerCapture(e.pointerId); } catch (x) {} });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return; var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) < 6) return; moved = true;
      lean(Math.max(-6, Math.min(6, dx / 14))); var deg = Math.max(-8, Math.min((n - 1) * STEP + 8, startRot - dx * .38)); put(deg, false);
      var c = Math.max(0, Math.min(n - 1, Math.round(deg / STEP)));
      if (c !== cand) { cand = c; mark(c); say(c, true); if (navigator.vibrate) { try { navigator.vibrate(6); } catch (x) {} } }
    });
    function end(e) {
      if (!dragging) return; dragging = false; lean(0);
      if (moved) { commit(cand); setOpen(true); return; }
      var b = e && e.target && e.target.closest ? e.target.closest('.wi') : null; if (b) { commit(+b.dataset.i); setOpen(true); } else if (e && e.target && e.target.closest && e.target.closest('#eyebtn')) setOpen(false); else setOpen(true);
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', function () { if (dragging) { dragging = false; lean(0); put(cur * STEP, true); mark(cur); lab.classList.remove('on'); } });
    el.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); var i = Math.max(0, Math.min(n - 1, cur + d)); if (i !== cur) commit(i); } });
    return { set: function (i) { cur = i; cand = i; mark(i); put(i * STEP, true); }, caption: function () {}, icon: icon, fx: function () { if (el.animate) el.animate([{ opacity: 1 }, { opacity: .7, offset: .5 }, { opacity: 1 }], { duration: 900 }); }, setLid: function () {} };
  };
  window.Dial.icon = icon;
})();
