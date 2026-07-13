// Zubayr Production - scroll reveal + nav state

(function () {
  var nav = document.getElementById('nav');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav background after leaving the hero top
  var navObserverTarget = document.createElement('div');
  navObserverTarget.style.cssText = 'position:absolute;top:0;left:0;height:80px;width:1px;pointer-events:none;';
  document.body.prepend(navObserverTarget);

  new IntersectionObserver(function (entries) {
    nav.classList.toggle('scrolled', !entries[0].isIntersecting);
  }).observe(navObserverTarget);

  // Reveal on scroll
  var revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(function (el) { io.observe(el); });
})();
