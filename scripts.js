(function () {
  var d = document, root = d.documentElement;
  var sys = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
  };
  var stopped = sys;
  if (stopped) root.classList.add('no-motion');
  var chatStop = null;

  /* mobile menu */
  var b = d.getElementById('menu-btn'), n = d.getElementById('site-nav');
  if (b && n) {
    var set = function (open) {
      n.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
    };
    b.addEventListener('click', function () { set(!n.classList.contains('open')); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && n.classList.contains('open')) { set(false); b.focus(); }
    });
    n.addEventListener('click', function (e) { if (e.target.tagName === 'A') set(false); });
  }

  /* header shadow on scroll */
  var hdr = d.querySelector('.site-header'), ticking = false;
  function onScroll() {
    if (hdr) hdr.classList.toggle('scrolled', (window.pageYOffset || root.scrollTop) > 12);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* counters: run once, ~1.2s */
  var counters = [].slice.call(d.querySelectorAll('[data-count]'));
  var final = function (el) { return (el.getAttribute('data-prefix') || '') + el.getAttribute('data-count'); };
  function run(el) {
    var to = parseInt(el.getAttribute('data-count'), 10), pre = el.getAttribute('data-prefix') || '', t0 = null;
    function step(t) {
      if (stopped) { el.textContent = final(el); return; }
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* gentle reveal on scroll (one time per element) */
  var sel = '.sec-head,.path,.process li,.facts li,.card,.c-item,.band,.highlight,.seek-box,.checklist,.compare,.chips';
  if (!stopped && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        t.classList.add('in');
        if (t.hasAttribute('data-count')) run(t);
        [].slice.call(t.querySelectorAll('[data-count]')).forEach(run);
        io.unobserve(t);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    [].slice.call(d.querySelectorAll(sel)).forEach(function (el) {
      var sib = [].slice.call(el.parentNode.children).filter(function (c) { return c.matches(sel); });
      el.style.setProperty('--d', Math.min(sib.indexOf(el), 5) * 0.07 + 's');
      el.classList.add('rv');
      io.observe(el);
    });
    counters.forEach(function (el) {
      el.textContent = (el.getAttribute('data-prefix') || '') + '0';
      if (!el.closest('.rv')) io.observe(el);
    });
  }

  /* client logos marquee pause */
  var pb = d.querySelector('.mq-pause'), mq = d.querySelector('.marquee');
  if (pb && mq) pb.addEventListener('click', function () {
    var p = mq.classList.toggle('paused');
    pb.setAttribute('aria-pressed', p ? 'true' : 'false');
  });

  /* global "stop animations" control */
  var mb = d.getElementById('motion-btn');
  function stopAllMotion() {
    stopped = true;
    root.classList.add('no-motion');
    [].slice.call(d.querySelectorAll('.rv')).forEach(function (el) { el.classList.add('in'); });
    counters.forEach(function (el) { el.textContent = final(el); });
    if (chatStop) chatStop();
    if (mb) mb.setAttribute('aria-pressed', 'true');
  }
  if (mb) {
    if (sys) { mb.hidden = true; }
    else {
      mb.setAttribute('aria-pressed', stopped ? 'true' : 'false');
      mb.addEventListener('click', function () {
        if (!stopped) { store.set('enosh-motion', 'off'); stopAllMotion(); }
        else { store.set('enosh-motion', 'on'); window.location.reload(); }
      });
    }
  }

  /* hero chat: messages appear once, calmly, then stay. No loop. */
  var ph = d.getElementById('phone'), cp = d.querySelector('.chat-pause');
  if (ph && !stopped) {
    var msgs = [].slice.call(ph.querySelectorAll('.msg')), i = 0, tmr = null, paused = false, vis = false;
    ph.classList.add('anim');
    var next = function () {
      tmr = null;
      if (paused || !vis || d.hidden) return;
      if (i >= msgs.length) { if (cp) cp.hidden = true; return; }
      msgs[i++].classList.add('show');
      if (i < msgs.length) tmr = setTimeout(next, 600); else if (cp) cp.hidden = true;
    };
    var go = function () { if (!tmr && !paused && vis && !d.hidden && i < msgs.length) tmr = setTimeout(next, i === 0 ? 300 : 600); };
    var halt = function () { if (tmr) { clearTimeout(tmr); tmr = null; } };
    chatStop = function () { halt(); ph.classList.remove('anim'); msgs.forEach(function (m) { m.classList.add('show'); }); if (cp) cp.hidden = true; };
    if (cp) cp.addEventListener('click', function () {
      paused = !paused;
      cp.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (paused) halt(); else go();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) go(); else halt(); }, { threshold: 0.3 }).observe(ph);
    } else { vis = true; go(); }
    d.addEventListener('visibilitychange', function () { if (d.hidden) halt(); else go(); });
  } else if (cp) { cp.hidden = true; }
})();
