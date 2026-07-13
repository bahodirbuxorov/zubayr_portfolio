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

  // ---------- Videos: play only when visible, respect reduced motion ----------
  var heroVideo = document.querySelector('.hero-video');
  var reelVideos = document.querySelectorAll('.reel-video');

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
    reelVideos.forEach(function (v) { v.pause(); });
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
    }, { threshold: 0.35 });

    reelVideos.forEach(function (v) { videoIO.observe(v); });
    if (heroVideo) videoIO.observe(heroVideo);
  }
})();
