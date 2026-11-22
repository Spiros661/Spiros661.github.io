(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add('loaded'); }); });

  // inertial smooth scrolling; native scrolling if the library is unavailable
  var lenis = null;
  if (!reduce && window.Lenis) {
    try {
      lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    } catch (e) { lenis = null; }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.6 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  var bar = document.getElementById('progress');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
  }
  if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // resume pop-up: shows resume.pdf if it exists, otherwise the placeholder
  var dlg = document.getElementById('resume');
  var body = document.getElementById('resume-body');
  var dl = document.getElementById('resume-dl');
  var pdfChecked = false;
  function loadPdf() {
    if (pdfChecked) return; pdfChecked = true;
    fetch('resume.pdf', { method: 'HEAD' }).then(function (r) {
      var type = r.headers.get('content-type') || '';
      if (r.ok && type.indexOf('pdf') !== -1) {
        body.innerHTML = '<iframe src="resume.pdf#view=FitH" title="Resume"></iframe>';
      } else { dl.hidden = true; }
    }).catch(function () { dl.hidden = true; });
  }
  function openResume() {
    loadPdf();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    if (lenis) lenis.stop();
  }
  function closeResume() { if (dlg.open) dlg.close(); }
  document.querySelectorAll('[data-resume]').forEach(function (b) { b.addEventListener('click', openResume); });
  document.getElementById('resume-close').addEventListener('click', closeResume);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeResume(); });
  dlg.addEventListener('close', function () { if (lenis) lenis.start(); });

  if (reduce || !finePointer) return;

  // run at most one style update per frame for pointer-driven effects
  function perFrame(fn) {
    var queued = false, last;
    return function (e) { last = e; if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; fn(last); }); };
  }

  var hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', perFrame(function (e) {
    var r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }), { passive: true });

  document.querySelectorAll('.profile').forEach(function (card) {
    card.addEventListener('pointermove', perFrame(function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.classList.add('tilting');
      card.style.setProperty('--ry', ((x - .5) * 8).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
      card.style.setProperty('--gx', (x * 100) + '%');
      card.style.setProperty('--gy', (y * 100) + '%');
    }), { passive: true });
    card.addEventListener('pointerleave', function () {
      card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
    });
  });
})();
