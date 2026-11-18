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

  // Year slideshows: swipe, or use the arrows
  document.querySelectorAll('.panel').forEach(function (panel) {
    var track = panel.querySelector('.slides'), count = panel.querySelector('.count');
    if (!track || !count) return;
    var total = track.querySelectorAll('.slide').length;
    var ctl = panel.querySelector('.slide-ctl');
    if (total < 2) { ctl.hidden = true; return; }
    function current() { return Math.round(track.scrollLeft / track.clientWidth); }
    function update() { count.textContent = (current() + 1) + ' / ' + total; }
    function go(dir) {
      var next = (current() + dir + total) % total;
      track.scrollTo({ left: next * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    }
    panel.querySelector('.prev').addEventListener('click', function () { go(-1); });
    panel.querySelector('.next').addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    update();
  });

  // Song: a YouTube video if data-youtube is set, otherwise music/our-song.mp3 when it exists
  var p = document.getElementById('play'), song = document.getElementById('song');
  var yt = document.getElementById('yt'), ytId = yt.dataset.youtube, ytPlayer = null, ytPlaying = false;
  function setPlaying(on) {
    p.classList.toggle('on', on);
    p.setAttribute('aria-pressed', on);
    document.getElementById('play-label').textContent = on ? 'Pause our song' : 'Play our song';
  }
  if (ytId) {
    // Browsers mute a video that starts after the tap has "expired", so the player is
    // loaded ahead of time (when the letter comes near) and the tap starts it directly.
    var ytWanted = false;
    function loadYouTube() {
      if (window.YT || document.getElementById('yt-api')) return;
      yt.hidden = false;  // stays collapsed (see .yt) until the song plays
      window.onYouTubeIframeAPIReady = function () {
        ytPlayer = new YT.Player('yt-player', {
          videoId: ytId,
          playerVars: { playsinline: 1, rel: 0, loop: 1, playlist: ytId },
          events: {
            onReady: function () { if (ytWanted) { ytPlayer.unMute(); ytPlayer.playVideo(); } },
            onStateChange: function (e) {
              ytPlaying = e.data === YT.PlayerState.PLAYING;
              setPlaying(ytPlaying);
              if (ytPlaying) yt.classList.add('open');
            },
            onError: function () {
              // the uploader has blocked playing on other sites: offer the song on YouTube instead
              yt.innerHTML = '<a class="yt-out" href="https://www.youtube.com/watch?v=' + ytId + '" target="_blank" rel="noopener">Listen on YouTube ↗</a>';
              p.hidden = true;
              yt.classList.add('open');
            }
          }
        });
      };
      var tag = document.createElement('script');
      tag.id = 'yt-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    p.hidden = false;
    p.addEventListener('click', function () {
      if (ytPlayer && ytPlayer.playVideo) {
        if (ytPlaying) { ytPlayer.pauseVideo(); return; }
        ytPlayer.unMute(); ytPlayer.setVolume(100); ytPlayer.playVideo();
      } else {
        ytWanted = true; loadYouTube();
      }
    });
    if ('IntersectionObserver' in window) {
      var near = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { loadYouTube(); near.disconnect(); }
      }, { rootMargin: '600px 0px' });
      near.observe(document.getElementById('letter'));
    } else {
      loadYouTube();
    }
  } else {
    fetch(song.getAttribute('src'), { method: 'HEAD' }).then(function (r) { if (r.ok) p.hidden = false; }).catch(function () {});
    p.addEventListener('click', function () { if (song.paused) song.play(); else song.pause(); });
    song.addEventListener('play', function () { setPlaying(true); });
    song.addEventListener('pause', function () { setPlaying(false); });
  }

  // The map of us
  var mapEl = document.getElementById('mapview');
  if (mapEl && window.L && window.PLACES) {
    var map = L.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true, attributionControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 12,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);
    var bounds = [];
    PLACES.forEach(function (pl) {
      var icon = L.divIcon({ className: '', html: '<div class="pin' + (pl.kind === 'dream' ? ' dream' : '') + '"></div>', iconSize: [14, 14], iconAnchor: [7, 7] });
      L.marker([pl.lat, pl.lng], { icon: icon, title: pl.name }).addTo(map)
        .bindPopup('<b>' + pl.name + '</b><span>' + pl.when + '</span>');
      bounds.push([pl.lat, pl.lng]);
    });
    map.fitBounds(bounds, { padding: [30, 30] });
    var been = PLACES.filter(function (pl) { return pl.kind === 'been'; }).length;
    var dreams = PLACES.length - been;
    document.getElementById('map-sum').textContent = been + ' places from our photos' +
      (dreams ? ', and ' + dreams + ' still to go. Gold pins are where we\'ve been; dashed pins are next.' : '. Tap a pin to see when we were there.');
  }

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
