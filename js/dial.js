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



  /* The lens: the SHADOWS camera lens as vector, after the original photo. Thick segmented red ring, dark inner ring,
     inner red shutter ring, dark round centre with a glint. The centre is a wide round pupil (owl), never a narrow human eye.
     Motion is a camera shutter: the centre closes in, the blades slide inward and open out again. Transform-only. */
  function eyeSvg() {
    var i, an, c, s, seg = '', div = '', bl = '', bd = '', N = 12, gap = .9, RO = 58, RI = 41;
    function pt(r, a) { return (60 + r * Math.cos(a)).toFixed(2) + ' ' + (60 + r * Math.sin(a)).toFixed(2); }
    for (i = 0; i < N; i++) {
      var a0 = i / N * Math.PI * 2 + gap / RO, a1 = (i + 1) / N * Math.PI * 2 - gap / RO, b0 = i / N * Math.PI * 2 + gap / RI, b1 = (i + 1) / N * Math.PI * 2 - gap / RI;
      seg += '<path d="M' + pt(RO, a0) + 'A' + RO + ' ' + RO + ' 0 0 1 ' + pt(RO, a1) + 'L' + pt(RI, b1) + 'A' + RI + ' ' + RI + ' 0 0 0 ' + pt(RI, b0) + 'Z" fill="url(#lgR' + (i % 2) + ')"/>';
    }
    for (i = 0; i < 6; i++) {
      var q0 = i / 6 * Math.PI * 2, q1 = (i + 1) / 6 * Math.PI * 2 - .05, R1 = 30, R0 = 19;
      bl += '<path d="M' + pt(R0, q0 + .5) + 'L' + pt(R1, q0) + 'A' + R1 + ' ' + R1 + ' 0 0 1 ' + pt(R1, q1) + 'L' + pt(R0, q1 + .5) + 'Z" fill="url(#lgB)" stroke="rgba(0,0,0,.55)" stroke-width=".7"/>';
      bd += 'M' + pt(R0, q0 + .5) + 'L' + pt(R1, q0);
    }
    return '<button type="button" class="eyebtn" id="eyebtn" aria-label="Menu"><svg class="oeye" viewBox="0 0 120 120" aria-hidden="true"><defs>' +
      '<linearGradient id="lgR0" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8101d"/><stop offset="1" stop-color="#7c0a14"/></linearGradient>' +
      '<linearGradient id="lgR1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9c0d19"/><stop offset="1" stop-color="#5e070f"/></linearGradient>' +
      '<radialGradient id="lgB" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#4a050c"/><stop offset="1" stop-color="#8a0b16"/></radialGradient>' +
      '<radialGradient id="lgP" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#14070a"/><stop offset="1" stop-color="#020102"/></radialGradient></defs>' +
      '<circle cx="60" cy="60" r="59.4" fill="#4a050c"/>' +
      '<g id="eRing">' + seg + '</g>' +
      '<circle cx="60" cy="60" r="' + (RI - 1) + '" fill="#0a0507"/>' +
      '<circle cx="60" cy="60" r="35" fill="none" stroke="rgba(255,90,100,.22)" stroke-width="1"/>' +
      '<circle cx="60" cy="60" r="31.5" fill="#2a040a"/>' +
      '<g id="eBl" style="transform-origin:60px 60px;transform-box:view-box">' + bl + '<path d="' + bd + '" stroke="rgba(255,120,120,.25)" stroke-width=".6" fill="none"/></g>' +
      '<g id="eIris"><circle id="ePup" cx="60" cy="60" r="17.5" fill="url(#lgP)"/><circle cx="60" cy="60" r="17.5" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1"/>' +
      '<ellipse cx="54.6" cy="53.8" rx="4.6" ry="3.5" fill="#fff" opacity=".92" transform="rotate(-28 55.2 54.6)"/><circle cx="65.4" cy="66" r="1.3" fill="#fff" opacity=".5"/></g>' +
      '<path d="M22 40A44 44 0 0 1 64 17" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>' +
      '</svg></button><div class="dlabel" id="dlabel"></div>';
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
    function setOpen(v) { open = v; el.classList.toggle('open', v); if (v) { shutter(true); } clearTimeout(idle); if (v) idle = setTimeout(function () { setOpen(false); lab.classList.remove('on'); }, 3500); else { lastClose = Date.now(); shutter(false); } }
    eb.addEventListener('click', function () { if (!open && Date.now() - lastClose > 350) setOpen(true); });
    var dragging = false, moved = false, sx = 0, startRot = 0, pup = el.querySelector('#eIris'), pp = el.querySelector('#ePup'), bl = el.querySelector('#eBl'), lidA = 0;
    function lean(x) { pup.style.transition = x ? 'none' : 'transform .35s ease'; pup.style.transform = 'translateX(' + (x * .9).toFixed(1) + 'px)'; }
    /* shutter: centre closes in, blades slide inward past it, then open out. */
    function shutter(opening) {
      if (!pp.animate) return;
      var base = 1 - Math.min(lidA, .72) * .5;
      pp.animate(opening ? [{ transform: 'scale(' + base + ')' }, { transform: 'scale(.34)', offset: .35 }, { transform: 'scale(1.06)', offset: .8 }, { transform: 'scale(1)' }] : [{ transform: 'scale(1)' }, { transform: 'scale(.4)', offset: .45 }, { transform: 'scale(' + base + ')' }], { duration: opening ? 560 : 240, easing: 'cubic-bezier(.3,.8,.3,1)' });
      bl.animate(opening ? [{ transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(.52) rotate(-28deg)', offset: .4 }, { transform: 'scale(1) rotate(-60deg)' }] : [{ transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(.6) rotate(24deg)', offset: .5 }, { transform: 'scale(1) rotate(60deg)' }], { duration: opening ? 560 : 240, easing: 'cubic-bezier(.3,.8,.3,1)' });
    }
    function lids(a, ms) { lidA = a; var k = 1 - Math.min(a, .72) * .5; pp.style.transition = 'transform ' + (ms == null ? 500 : ms) + 'ms ease'; pp.style.transform = 'scale(' + k.toFixed(2) + ')'; }
    lids(0, 0);
    function blink() {
      if (pp.animate && !dragging && !document.hidden) {
        var k = 1 - Math.min(lidA, .72) * .5;
        pp.animate([{ transform: 'scale(' + k + ')' }, { transform: 'scale(.08)', offset: .45 }, { transform: 'scale(' + k + ')' }], { duration: 300, easing: 'ease-in-out' });
        bl.animate([{ transform: 'scale(1)' }, { transform: 'scale(.62)', offset: .45 }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-in-out' });
      }
      setTimeout(blink, 5000 + Math.random() * 4500);
    }
    setTimeout(blink, 3500);

    var pvrow = el.querySelector('#pvrow'), pvt = [].slice.call(el.querySelectorAll('.pvt')), ring = el.querySelector('#eRing');
    function pvset(deg, anim) { var pos = deg / STEP; pvrow.style.transition = anim ? 'transform .2s cubic-bezier(.25,.8,.3,1)' : 'none'; pvrow.style.transform = 'translateX(' + (-pos * 100).toFixed(1) + 'px)'; pvt.forEach(function (t, i) { var k = Math.max(0, 1 - Math.abs(i - pos)); t.style.transition = anim ? 'transform .2s, opacity .2s' : 'none'; t.style.transform = 'scale(' + (.86 + .24 * k).toFixed(3) + ')'; t.style.opacity = (.42 + .58 * k).toFixed(2); t.classList.toggle('on', k > .5); }); ring.style.transform = 'rotate(' + (deg * 2.4).toFixed(1) + 'deg)'; }
    function put(deg, anim) { pvset(deg, anim); wheel.style.transition = anim ? 'transform .2s cubic-bezier(.25,.8,.3,1)' : 'none'; wheel.style.transform = 'translateZ(0) rotate(' + (-deg).toFixed(2) + 'deg)'; rot = deg; }
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
      var deg = Math.max(-8, Math.min((n - 1) * STEP + 8, startRot + aAcc * GAIN)); put(deg, false); if (o.onDrag) o.onDrag((deg - cur * STEP) / STEP);
      var c = Math.max(0, Math.min(n - 1, Math.round(deg / STEP)));
      if (c !== cand) { cand = c; mark(c); say(c, true); if (navigator.vibrate) { try { navigator.vibrate(8); } catch (x) {} } }
    });
    function end() {
      if (!dragging) return; dragging = false; lean(0); el.classList.remove('turning');
      if (moved) { commit(cand); say(cand, true); closeSoon(0); if (o.onDragEnd) o.onDragEnd(); return; }
      var b = downT && downT.closest ? downT.closest('.wi') : null;
      if (b) { commit(+b.dataset.i); say(+b.dataset.i, true); closeSoon(700); } else closeSoon(1400);
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', function () { if (dragging) { dragging = false; lean(0); el.classList.remove('turning'); put(cur * STEP, true); mark(cur); lab.classList.remove('on'); closeSoon(300); if (o.onDragEnd) o.onDragEnd(); } });
    el.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); var i = Math.max(0, Math.min(n - 1, cur + d)); if (i !== cur) commit(i); } });
    return { set: function (i) { cur = i; cand = i; mark(i); put(i * STEP, true); }, caption: function () {}, icon: icon, fx: function () { if (el.animate) el.animate([{ opacity: 1 }, { opacity: .7, offset: .5 }, { opacity: 1 }], { duration: 900 }); }, setLid: function (a) { lids(a || 0); } };
  };
  window.Dial.icon = icon;
})();
