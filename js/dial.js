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



  /* The owl eye: layered vector. Glow, dark rim, iris with fibres and a limbal ring, deep pupil with a real highlight, lids with thickness. Static gradients only; motion is transform-only. */
  function eyeSvg() {
    var AL = 'M3 34Q60 -8 117 34Q60 76 3 34Z', fib = '', i, an, r1, r2, c, s;
    for (i = 0; i < 44; i++) { an = i / 44 * Math.PI * 2; r1 = 10.4; r2 = i % 2 ? 17.6 : 19.4; c = Math.cos(an); s = Math.sin(an); fib += 'M' + (60 + c * r1).toFixed(2) + ' ' + (34 + s * r1).toFixed(2) + 'L' + (60 + c * r2).toFixed(2) + ' ' + (34 + s * r2).toFixed(2); }
    var tk1 = '', tk2 = ''; for (i = 0; i < 60; i++) { an = i / 60 * Math.PI * 2; c = Math.cos(an); s = Math.sin(an); var maj = i % 5 === 0, q = 'M' + (60 + c * 51.4).toFixed(2) + ' ' + (60 + s * 51.4).toFixed(2) + 'L' + (60 + c * (maj ? 55 : 53.4)).toFixed(2) + ' ' + (60 + s * (maj ? 55 : 53.4)).toFixed(2); if (maj) tk2 += q; else tk1 += q; }
    return '<button type="button" class="eyebtn" id="eyebtn" aria-label="Menu"><svg class="oeye" viewBox="0 0 120 120" aria-hidden="true"><defs>' +
      '<clipPath id="eClip"><path d="' + AL + '"/></clipPath>' +
      '<radialGradient id="eGl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff2535" stop-opacity=".5"/><stop offset=".55" stop-color="#E11827" stop-opacity=".18"/><stop offset="1" stop-color="#E11827" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="eSc" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#1b0b0e"/><stop offset="1" stop-color="#040203"/></radialGradient>' +
      '<radialGradient id="eIg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#2a0307"/><stop offset=".34" stop-color="#7d0812"/><stop offset=".6" stop-color="#E11827"/><stop offset=".84" stop-color="#ff4350"/><stop offset=".94" stop-color="#a30c18"/><stop offset="1" stop-color="#2a0307"/></radialGradient>' +
      '<radialGradient id="ePg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000"/><stop offset=".8" stop-color="#050203"/><stop offset="1" stop-color="#1a0407"/></radialGradient>' +
      '<linearGradient id="eSh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".78"/><stop offset=".42" stop-color="#000" stop-opacity=".18"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>' +
      '<linearGradient id="eLg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a0b13"/><stop offset="1" stop-color="#14050a"/></linearGradient>' +
      '<clipPath id="eLens"><circle cx="60" cy="60" r="47.5"/></clipPath><linearGradient id="eMt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a66"/><stop offset=".3" stop-color="#E11827"/><stop offset=".62" stop-color="#5a0610"/><stop offset="1" stop-color="#ff2f40"/></linearGradient><radialGradient id="eVg" cx="50%" cy="50%" r="50%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient><radialGradient id="eRg" cx="50%" cy="34%" r="72%"><stop offset="0" stop-color="#43434b"/><stop offset=".5" stop-color="#131317"/><stop offset="1" stop-color="#050507"/></radialGradient></defs>' +
      '<circle class="lens" cx="60" cy="60" r="57"/><g id="eRing"><path class="tk1" d="' + tk1 + '"/><path class="tk2" d="' + tk2 + '"/></g><circle class="bez" cx="60" cy="60" r="49"/>' +
      '<g clip-path="url(#eLens)"><g transform="translate(60 60) scale(.9) translate(-60 -34)">' +
      '<ellipse class="glow" cx="60" cy="34" rx="74" ry="46" fill="url(#eGl)"/>' +
      '<path d="' + AL + '" fill="url(#eSc)"/>' +
      '<g clip-path="url(#eClip)"><g id="eIris"><circle cx="60" cy="34" r="21" fill="url(#eIg)"/><path class="fib" d="' + fib + '"/><circle class="rg" cx="60" cy="34" r="20.2"/><circle class="rg2" cx="60" cy="34" r="10.6"/>' +
      '<circle id="ePup" cx="60" cy="34" r="10.4" fill="url(#ePg)"/><ellipse cx="55.4" cy="28.6" rx="3.6" ry="2.7" fill="#fff" opacity=".95" transform="rotate(-28 55.4 28.6)"/><circle cx="64.6" cy="39.6" r="1.2" fill="#fff" opacity=".5"/></g>' +
      '<rect x="0" y="0" width="120" height="68" fill="url(#eSh)"/>' +
      '<g id="eLu" class="lidg"><path class="lidb" d="M-10 -40H130V34Q60 76 -10 34Z"/><path class="lid" d="M-10 -40H130V34Q60 76 -10 34Z"/></g>' +
      '<g id="eLd" class="lidg"><path class="lidb" d="M-10 108H130V34Q60 -8 -10 34Z"/><path class="lid" d="M-10 108H130V34Q60 -8 -10 34Z"/></g></g>' +
      '<path class="olb" d="' + AL + '"/><path class="ol" d="' + AL + '"/></g></g><circle cx="60" cy="60" r="47.5" fill="url(#eVg)"/><circle class="lensr" cx="60" cy="60" r="57"/><path d="M22 40A44 44 0 0 1 64 17" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.2" stroke-linecap="round"/></svg></button><div class="dlabel" id="dlabel"></div>';
  }

  /* Camera-zoom dome: a red half circle at the bottom centre. Drag left or right to turn the wheel, release to open the page on top. */
  window.Dial = function (o) {
    var el = o.el, items = o.items, n = items.length, STEP = 27, R = 158, RHO = 118, cur = o.index || 0, cand = cur, base = cur * STEP, rot = base;
    var h = '<div class="dome"><div class="wheel" id="wheel">';
    items.forEach(function (it, i) {
      h += '<b class="tk" style="transform:rotate(' + (i * STEP - STEP / 2) + 'deg)"></b><button type="button" class="wi" data-i="' + i + '" aria-label="' + it.label() + '" style="transform:rotate(' + (i * STEP) + 'deg) translateY(-' + RHO + 'px)"><span style="transform:rotate(0deg)">' + icon(it.id, 24, 1.8) + '</span></button>';
    });
    h += '<b class="tk" style="transform:rotate(' + ((n - 1) * STEP + STEP / 2) + 'deg)"></b></div><i class="notch"></i></div>' + eyeSvg() + '<div class="dlabel" id="dlabel"></div><div class="pv"><div class="pvrow" id="pvrow">' + items.map(function (it, i) { return '<div class="pvt" style="left:' + (i * 100) + 'px">' + icon(it.id, 28, 1.7) + '<b>' + it.label() + '</b></div>'; }).join('') + '</div></div>';
    el.innerHTML = h;
    var wheel = el.querySelector('#wheel'), lab = el.querySelector('#dlabel'), btns = [].slice.call(el.querySelectorAll('.wi'));
    var open = false, idle = null, lastClose = 0, eb = el.querySelector('#eyebtn');
    function setOpen(v) { open = v; el.classList.toggle('open', v); if (v) { var pp = el.querySelector('#ePup'); if (pp && pp.animate) pp.animate([{ transform: 'scale(.62)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1)' }); } clearTimeout(idle); if (v) idle = setTimeout(function () { setOpen(false); lab.classList.remove('on'); }, 3500); else lastClose = Date.now(); }
    eb.addEventListener('click', function () { if (!open && Date.now() - lastClose > 350) setOpen(true); });
    var dragging = false, moved = false, sx = 0, startRot = 0, pup = el.querySelector('#eIris'), lu = el.querySelector('#eLu'), ld = el.querySelector('#eLd'), lidA = 0;
    function lean(x) { pup.style.transition = x ? 'none' : 'transform .35s ease'; pup.style.transform = 'translateX(' + (x * .9).toFixed(1) + 'px)'; }
    function lids(a, ms) { lidA = a; var e = Math.min(a, .72) * .35, u = -46 * (1 - e), t = ms == null ? '.5s' : ms + 'ms'; lu.style.transition = ld.style.transition = 'transform ' + t + ' ease'; lu.style.transform = 'translateY(' + u.toFixed(1) + 'px)'; ld.style.transform = 'translateY(' + (-u).toFixed(1) + 'px)'; }
    lids(0, 0);
    function blink() {
      if (lu.animate && !dragging && !document.hidden) { var e = Math.min(lidA, .72) * .35, u = -46 * (1 - e), kf = function (y) { return [{ transform: 'translateY(' + y + 'px)' }, { transform: 'translateY(0px)', offset: .45 }, { transform: 'translateY(' + y + 'px)' }]; };
        lu.animate(kf(u.toFixed(1)), { duration: 340, easing: 'ease-in-out' }); ld.animate(kf((-u).toFixed(1)), { duration: 340, easing: 'ease-in-out' }); }
      setTimeout(blink, 5000 + Math.random() * 4500);
    }
    setTimeout(blink, 3500);

    var pvrow = el.querySelector('#pvrow'), pvt = [].slice.call(el.querySelectorAll('.pvt')), ring = el.querySelector('#eRing');
    function pvset(deg, anim) { var pos = deg / STEP; pvrow.style.transition = anim ? 'transform .4s cubic-bezier(.25,.8,.3,1)' : 'none'; pvrow.style.transform = 'translateX(' + (-pos * 100).toFixed(1) + 'px)'; pvt.forEach(function (t, i) { var k = Math.max(0, 1 - Math.abs(i - pos)); t.style.transition = anim ? 'transform .4s, opacity .4s' : 'none'; t.style.transform = 'scale(' + (.86 + .24 * k).toFixed(3) + ')'; t.style.opacity = (.42 + .58 * k).toFixed(2); t.classList.toggle('on', k > .5); }); ring.style.transform = 'rotate(' + (deg * 2.4).toFixed(1) + 'deg)'; }
    function put(deg, anim) { pvset(deg, anim); wheel.style.transition = anim ? 'transform .4s cubic-bezier(.25,.8,.3,1)' : 'none'; wheel.style.transform = 'translateZ(0) rotate(' + (-deg).toFixed(2) + 'deg)'; rot = deg; }
    function mark(i) { btns.forEach(function (b, k) { b.classList.toggle('on', k === i); }); }
    function say(i, on) { lab.textContent = items[i].label(); lab.classList.toggle('on', !!on); }
    function commit(i) { var dir = i > cur ? 1 : i < cur ? -1 : 0, ch = i !== cur; cur = i; cand = i; mark(i); put(i * STEP, true); lab.classList.remove('on'); if (ch) o.onCommit(i, dir); }
    put(cur * STEP, false); mark(cur);
    /* Physical dial: put a finger on the eye and turn it, clockwise or counter-clockwise, no tap first.
       The wheel follows the finger around its pivot, the page under the notch is the pick, release opens it. */
    var GAIN = .85, piv = null, a0 = 0, aPrev = 0, aAcc = 0, downT = null;
    function ang(e) { return Math.atan2(e.clientY - piv.y, e.clientX - piv.x) * 180 / Math.PI; }
    function closeSoon(ms) { clearTimeout(idle); idle = setTimeout(function () { setOpen(false); lab.classList.remove('on'); }, ms); }
    el.addEventListener('pointerdown', function (e) {
      var t = e.target && e.target.closest ? e.target : null; if (!t) return;
      var onEye = !!t.closest('#eyebtn'), onDome = open && !!t.closest('.dome'); if (!onEye && !onDome) return;
      clearTimeout(idle); setOpen(true); clearTimeout(idle); downT = t; dragging = true; moved = false; sx = e.clientX;
      var r = wheel.getBoundingClientRect(); piv = { x: r.left, y: r.top }; aPrev = ang(e); aAcc = 0; startRot = cur * STEP; cand = cur;
      el.classList.add('turning'); try { el.setPointerCapture(e.pointerId); } catch (x) {}
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var a = ang(e), dd = a - aPrev; if (dd > 180) dd -= 360; if (dd < -180) dd += 360; aPrev = a; aAcc += dd;
      if (!moved && Math.abs(aAcc) < 4 && Math.abs(e.clientX - sx) < 6) return; moved = true;
      lean(Math.max(-6, Math.min(6, (e.clientX - sx) / 10)));
      var deg = Math.max(-8, Math.min((n - 1) * STEP + 8, startRot + aAcc * GAIN)); put(deg, false);
      var c = Math.max(0, Math.min(n - 1, Math.round(deg / STEP)));
      if (c !== cand) { cand = c; mark(c); say(c, true); if (navigator.vibrate) { try { navigator.vibrate(8); } catch (x) {} } }
    });
    function end() {
      if (!dragging) return; dragging = false; lean(0); el.classList.remove('turning');
      if (moved) { commit(cand); say(cand, true); closeSoon(700); return; }
      var b = downT && downT.closest ? downT.closest('.wi') : null;
      if (b) { commit(+b.dataset.i); say(+b.dataset.i, true); closeSoon(700); } else closeSoon(1400);
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', function () { if (dragging) { dragging = false; lean(0); el.classList.remove('turning'); put(cur * STEP, true); mark(cur); lab.classList.remove('on'); closeSoon(300); } });
    el.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); var i = Math.max(0, Math.min(n - 1, cur + d)); if (i !== cur) commit(i); } });
    return { set: function (i) { cur = i; cand = i; mark(i); put(i * STEP, true); }, caption: function () {}, icon: icon, fx: function () { if (el.animate) el.animate([{ opacity: 1 }, { opacity: .7, offset: .5 }, { opacity: 1 }], { duration: 900 }); }, setLid: function (a) { lids(a || 0); } };
  };
  window.Dial.icon = icon;
})();
