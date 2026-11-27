/* Light effects: night tint from the device clock, gentle gyro parallax. Transform-only, no filters. */
(function () {
  'use strict';
  function night() {
    var h = new Date().getHours() + new Date().getMinutes() / 60, k;
    k = h >= 21 || h < 5 ? 1 : h >= 18 ? (h - 18) / 3 : h < 7 ? (7 - h) / 2 : 0;
    k = Math.max(0, Math.min(1, k));
    var r = Math.round(225 - 45 * k), g = Math.round(24 - 10 * k), b = Math.round(39 - 12 * k);
    var s = document.documentElement.style; s.setProperty('--red', 'rgb(' + r + ',' + g + ',' + b + ')'); s.setProperty('--night', k.toFixed(2));
  }
  night(); setInterval(night, 600000);
  var bg = null, dw = null, tx = 0, ty = 0, cx = 0, cy = 0, run = false;
  function frame() {
    cx += (tx - cx) * .12; cy += (ty - cy) * .12;
    if (bg) bg.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) scale(1.06)';
    if (dw) dw.style.transform = 'translate3d(' + (-cx * .4).toFixed(1) + 'px,' + (-cy * .4).toFixed(1) + 'px,0)';
    if (Math.abs(tx - cx) + Math.abs(ty - cy) > .05) requestAnimationFrame(frame); else run = false;
  }
  function on(e) {
    if (document.body.classList.contains('intro') || document.body.classList.contains('inpanel') || e.gamma == null) return;
    tx = Math.max(-9, Math.min(9, e.gamma / 4)); ty = Math.max(-7, Math.min(7, (e.beta - 50) / 6));
    if (!run) { run = true; requestAnimationFrame(frame); }
  }
  function start() {
    bg = document.getElementById('hubbg'); dw = document.querySelector('.dialwrap');
    if (bg) bg.style.willChange = 'transform';
    window.addEventListener('deviceorientation', on, { passive: true });
  }
  function arm() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    var D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') {
      document.addEventListener('click', function once() { document.removeEventListener('click', once); D.requestPermission().then(function (s) { if (s === 'granted') start(); }).catch(function () {}); });
    } else start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
})();
