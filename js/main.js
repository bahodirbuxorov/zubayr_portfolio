// Zubayr Production - scroll reveal, nav state, showreel zoom, before/after slider, video control

(function () {
  var nav = document.getElementById('nav');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Nav background after leaving the hero top ----------
  var navObserverTarget = document.createElement('div');
  navObserverTarget.style.cssText = 'position:absolute;top:0;left:0;height:80px;width:1px;pointer-events:none;';
  document.body.prepend(navObserverTarget);

  new IntersectionObserver(function (entries) {
    nav.classList.toggle('scrolled', !entries[0].isIntersecting);
  }).observe(navObserverTarget);

  // ---------- Reveal on scroll ----------
  var revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  }

  // ---------- Showreel scroll zoom ----------
  var zoomWrap = document.querySelector('.showreel-zoom');

  if (zoomWrap && !reduceMotion) {
    var zoomTicking = false;

    var updateZoom = function () {
      zoomTicking = false;
      var rect = zoomWrap.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh - rect.top) / (vh * 0.9);
      progress = Math.max(0, Math.min(1, progress));
      var eased = 1 - Math.pow(1 - progress, 3);
      zoomWrap.style.setProperty('--zoom', (0.85 + 0.15 * eased).toFixed(4));
    };

    var requestZoom = function () {
      if (!zoomTicking) {
        zoomTicking = true;
        requestAnimationFrame(updateZoom);
      }
    };

    window.addEventListener('scroll', requestZoom, { passive: true });
    window.addEventListener('resize', requestZoom, { passive: true });
    updateZoom();
  }

  // ---------- Before / After slider ----------
  var ba = document.getElementById('ba');
  var baKnob = document.getElementById('ba-knob');

  if (ba && baKnob) {
    var dragging = false;

    var setPos = function (percent) {
      percent = Math.max(0, Math.min(100, percent));
      ba.style.setProperty('--pos', percent + '%');
      baKnob.setAttribute('aria-valuenow', String(Math.round(percent)));
    };

    var posFromEvent = function (e) {
      var rect = ba.getBoundingClientRect();
      setPos(((e.clientX - rect.left) / rect.width) * 100);
    };

    ba.addEventListener('pointerdown', function (e) {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      posFromEvent(e);
    });

    ba.addEventListener('pointermove', function (e) {
      if (dragging) posFromEvent(e);
    });

    ba.addEventListener('pointerup', function () { dragging = false; });
    ba.addEventListener('pointercancel', function () { dragging = false; });

    baKnob.addEventListener('keydown', function (e) {
      var current = parseFloat(baKnob.getAttribute('aria-valuenow'));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        setPos(current - 3);
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        setPos(current + 3);
        e.preventDefault();
      }
    });
  }

  // ---------- Reels row: mouse drag-to-scroll (touch scrolls natively) ----------
  var reelsRow = document.querySelector('.reels-row');

  if (reelsRow) {
    var rowDrag = null;
    var suppressClick = false;

    reelsRow.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      rowDrag = { x: e.clientX, left: reelsRow.scrollLeft, id: e.pointerId, moved: false };
    });

    reelsRow.addEventListener('pointermove', function (e) {
      if (!rowDrag) return;
      var dx = e.clientX - rowDrag.x;
      if (!rowDrag.moved && Math.abs(dx) > 6) {
        rowDrag.moved = true;
        reelsRow.classList.add('dragging');
        reelsRow.setPointerCapture(rowDrag.id);
      }
      if (rowDrag.moved) reelsRow.scrollLeft = rowDrag.left - dx;
    });

    var endRowDrag = function () {
      if (!rowDrag) return;
      suppressClick = rowDrag.moved;
      rowDrag = null;
      reelsRow.classList.remove('dragging');
    };

    reelsRow.addEventListener('pointerup', endRowDrag);
    reelsRow.addEventListener('pointercancel', endRowDrag);

    // a drag must not count as a click on the phone links
    reelsRow.addEventListener('click', function (e) {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
      }
    }, true);
  }

  // ---------- Background music (starts at 0:42, restarts there on end) ----------
  var music = document.getElementById('bg-music');
  var musicBtn = document.getElementById('music-btn');
  var MUSIC_START = 42;

  if (music && musicBtn) {
    music.volume = 0.65;

    // The track is fetched once as a blob: blob URLs are always seekable,
    // so the 0:42 start works even behind servers without Range support.
    var musicReadyPromise = null;
    var ensureMusic = function () {
      if (!musicReadyPromise) {
        musicReadyPromise = fetch(music.getAttribute('src'))
          .then(function (r) { return r.blob(); })
          .then(function (blob) {
            return new Promise(function (resolve) {
              music.src = URL.createObjectURL(blob);
              music.addEventListener('loadedmetadata', resolve, { once: true });
              music.load();
            });
          })
          .catch(function () { /* fall back to the original src */ });
      }
      return musicReadyPromise;
    };

    var startedOnce = false;
    var startMusic = function () {
      return ensureMusic().then(function () {
        if (!startedOnce) music.currentTime = MUSIC_START;
        var p = music.play();
        if (p && p.then) return p.then(function () { startedOnce = true; });
        startedOnce = true;
      });
    };

    var mutedByUser = false;

    musicBtn.addEventListener('click', function () {
      if (music.paused) {
        mutedByUser = false;
        startMusic().catch(function () { /* blocked */ });
      } else {
        mutedByUser = true;
        music.pause();
      }
    });

    music.addEventListener('play', function () {
      musicBtn.classList.add('playing');
      musicBtn.setAttribute('aria-pressed', 'true');
    });

    music.addEventListener('pause', function () {
      musicBtn.classList.remove('playing');
      musicBtn.setAttribute('aria-pressed', 'false');
    });

    music.addEventListener('ended', function () {
      music.currentTime = MUSIC_START;
      var p = music.play();
      if (p && p.catch) p.catch(function () { /* ignore */ });
    });

    // Autoplay on entry. Browsers usually block un-muted autoplay, so if the
    // attempt is rejected, start on the visitor's first tap, click or key.
    var kickOnGesture = function () {
      if (mutedByUser || !music.paused) return;
      startMusic().catch(function () { /* still blocked */ });
    };

    startMusic().catch(function () {
      ['pointerup', 'keydown', 'touchend'].forEach(function (ev) {
        window.addEventListener(ev, kickOnGesture, { once: true, passive: true });
      });
    });
  }

  // ---------- Scrollspy: highlight the nav link of the section in view ----------
  // sections without their own nav link roll up into the nearest logical one
  var SPY_MAP = {
    ishlar: 'ishlar', reels: 'ishlar', grading: 'ishlar',
    xizmatlar: 'xizmatlar', jarayon: 'xizmatlar',
    narxlar: 'narxlar',
    haqida: 'haqida', savollar: 'haqida', aloqa: 'haqida'
  };
  var spyLinks = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
    spyLinks[a.getAttribute('href').slice(1)] = a;
  });

  if (Object.keys(spyLinks).length && 'IntersectionObserver' in window) {
    var setActiveLink = function (id) {
      Object.keys(spyLinks).forEach(function (key) {
        spyLinks[key].classList.toggle('active', key === id);
      });
    };

    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        setActiveLink(SPY_MAP[entry.target.id] || null);
      });
    }, { rootMargin: '-35% 0px -55% 0px' });

    Object.keys(SPY_MAP).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spyIO.observe(section);
    });

    // clear the highlight while the hero / trust band is on screen
    var heroSection = document.querySelector('.hero');
    if (heroSection) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) setActiveLink(null);
      }, { rootMargin: '-35% 0px -55% 0px' }).observe(heroSection);
    }
  }

  // ---------- Showreel lightbox: replay with sound and controls ----------
  var lightbox = document.getElementById('lightbox');
  var lightboxFrame = document.getElementById('lightbox-frame');
  var showreelPlay = document.getElementById('showreel-play');
  var SHOWREEL_ID = 'QBpvtIF6uOY';

  if (lightbox && lightboxFrame && showreelPlay) {
    var musicWasPlaying = false;

    var openLightbox = function () {
      musicWasPlaying = !!(music && !music.paused);
      if (musicWasPlaying) music.pause();
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + SHOWREEL_ID +
        '?autoplay=1&controls=1&rel=0&playsinline=1';
      iframe.title = 'Showreel 2026';
      iframe.allow = 'autoplay; encrypted-media; fullscreen';
      iframe.setAttribute('allowfullscreen', '');
      lightboxFrame.appendChild(iframe);
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lightbox.querySelector('.lightbox-close').focus();
    };

    var closeLightbox = function () {
      lightbox.hidden = true;
      lightboxFrame.innerHTML = '';
      document.body.style.overflow = '';
      if (musicWasPlaying && music) {
        var p = music.play();
        if (p && p.catch) p.catch(function () { /* ignore */ });
      }
      showreelPlay.focus();
    };

    showreelPlay.addEventListener('click', openLightbox);
    lightbox.querySelectorAll('[data-lightbox-close]').forEach(function (el) {
      el.addEventListener('click', closeLightbox);
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });
  }

  // ---------- Scroll timecode: page progress as film TC ----------
  var timecode = document.getElementById('timecode');

  if (timecode) {
    var TC_FPS = 24;
    var TC_TOTAL_SECONDS = 120; // the whole page "runs" two minutes of footage
    var tcTicking = false;

    var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

    var updateTimecode = function () {
      tcTicking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      var frames = Math.round(progress * TC_TOTAL_SECONDS * TC_FPS);
      var f = frames % TC_FPS;
      var s = Math.floor(frames / TC_FPS) % 60;
      var m = Math.floor(frames / (TC_FPS * 60));
      timecode.textContent = 'TC 00:' + pad2(m) + ':' + pad2(s) + ':' + pad2(f);
    };

    var requestTimecode = function () {
      if (!tcTicking) {
        tcTicking = true;
        requestAnimationFrame(updateTimecode);
      }
    };

    window.addEventListener('scroll', requestTimecode, { passive: true });
    window.addEventListener('resize', requestTimecode, { passive: true });
    updateTimecode();
  }

  // ---------- Magnetic CTA buttons (fine pointers, motion allowed) ----------
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.btn-primary, .btn-ghost').forEach(function (btn) {
      var MAGNET_MAX = 5;

      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        btn.style.transform = 'translate(' + (dx * MAGNET_MAX).toFixed(1) + 'px,' + (dy * MAGNET_MAX).toFixed(1) + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  // ---------- Videos: play only when visible, respect reduced motion ----------
  var heroVideo = document.querySelector('.hero-video');
  var reelVideos = document.querySelectorAll('.reel-video, .work-video, .ba-video');

  if (heroVideo) {
    heroVideo.addEventListener('playing', function () {
      heroVideo.parentElement.classList.add('video-live');
    });
    heroVideo.addEventListener('error', function () {
      heroVideo.parentElement.classList.remove('video-live');
    });
  }

  if (reduceMotion) {
    if (heroVideo) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    }
    reelVideos.forEach(function (v) {
      v.removeAttribute('autoplay');
      v.pause();
    });
  } else if ('IntersectionObserver' in window) {
    var videoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          var playing = video.play();
          if (playing && playing.catch) playing.catch(function () { /* autoplay blocked */ });
        } else {
          video.pause();
        }
      });
    // videos ship with preload="none"; play() inside the expanded viewport
    // both starts the download ahead of time and keeps offscreen videos paused
    }, { rootMargin: '200px 0px', threshold: 0 });

    reelVideos.forEach(function (v) { videoIO.observe(v); });
    if (heroVideo) videoIO.observe(heroVideo);
  }
})();
