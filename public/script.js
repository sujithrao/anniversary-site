(function () {
  // A missing photo removes its <img>, so the gradient placeholder shows
  document.querySelectorAll('.scene img').forEach(function (img) {
    function drop() { img.remove(); }
    if (img.complete && img.naturalWidth === 0) drop(); else img.addEventListener('error', drop);
  });

  // Days married, counted from the wedding to the 5th anniversary
  var parts = document.getElementById('main').dataset.wedding.split('-');
  var wed = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
  var fifth = new Date(Date.UTC(+parts[0] + 5, +parts[1] - 1, +parts[2]));
  var days = Math.round((fifth - wed) / 86400000);
  if (days > 0) {
    var d = days.toLocaleString('en-IN');
    document.getElementById('s-days').textContent = d;
    document.getElementById('chip-days').textContent = d + ' days married';
  }
  var pad = function (n) { return String(n).padStart(2, '0'); };
  document.getElementById('dates').textContent =
    pad(wed.getUTCDate()) + ' · ' + pad(wed.getUTCMonth() + 1) + ' · ' + wed.getUTCFullYear() + ' — ' +
    pad(wed.getUTCDate()) + ' · ' + pad(wed.getUTCMonth() + 1) + ' · ' + (wed.getUTCFullYear() + 5);

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero photo slowly zooms as you scroll
  var hs = document.getElementById('hero-scene'), ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = Math.min(window.scrollY, window.innerHeight);
      hs.style.transform = 'scale(' + (1 + y / window.innerHeight * 0.18) + ')';
      ticking = false;
    });
  }
  if (!reduce) window.addEventListener('scroll', onScroll, { passive: true });

  // Carousel buttons
  var track = document.getElementById('track');
  function step(dir) { var c = track.querySelector('.card'); track.scrollBy({ left: dir * (c.offsetWidth + 18), behavior: reduce ? 'auto' : 'smooth' }); }
  document.getElementById('prev').addEventListener('click', function () { step(-1); });
  document.getElementById('next').addEventListener('click', function () { step(1); });

  // Photo viewer: tap a photo, then use arrows, swipe or Esc
  var lb = document.getElementById('lb'), lbImg = document.getElementById('lb-img'), lbCap = document.getElementById('lb-cap');
  var list = [], idx = 0, opener = null;
  function show(i) {
    idx = (i + list.length) % list.length;
    lbImg.src = list[idx].dataset.full;
    lbCap.textContent = (list[idx].dataset.cap ? list[idx].dataset.cap + '  ·  ' : '') + (idx + 1) + ' of ' + list.length;
  }
  document.querySelectorAll('.ph-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      list = Array.prototype.slice.call(b.parentNode.querySelectorAll('.ph-btn'));
      opener = b; lb.hidden = false; show(list.indexOf(b));
      document.getElementById('lb-close').focus();
    });
  });
  function closeLb() { lb.hidden = true; lbImg.removeAttribute('src'); if (opener) opener.focus(); }
  document.getElementById('lb-close').addEventListener('click', closeLb);
  document.getElementById('lb-prev').addEventListener('click', function () { show(idx - 1); });
  document.getElementById('lb-next').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
  });

  // Song: the button only appears when music/our-song.mp3 exists
  var p = document.getElementById('play'), song = document.getElementById('song');
  fetch(song.getAttribute('src'), { method: 'HEAD' }).then(function (r) { if (r.ok) p.hidden = false; }).catch(function () {});
  p.addEventListener('click', function () {
    if (song.paused) song.play(); else song.pause();
  });
  song.addEventListener('play', function () { p.classList.add('on'); p.setAttribute('aria-pressed', 'true'); document.getElementById('play-label').textContent = 'Pause our song'; });
  song.addEventListener('pause', function () { p.classList.remove('on'); p.setAttribute('aria-pressed', 'false'); document.getElementById('play-label').textContent = 'Play our song'; });

  // Fade-in only for items below the first screen
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.fade').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
  }
})();
