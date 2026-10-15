/* NIGHTJAR RADIO - main.js
   Theme toggle (nj-theme), mobile nav, carrier-wave progress bar,
   reveal-on-scroll with IntersectionObserver fallback, tuning needle,
   on-air clock, demo forms, press-R time-signal chime. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */
  var KEY = 'nj-theme';
  try {
    var saved = localStorage.getItem(KEY);
    if (saved === 'after-hours' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.setAttribute('data-theme', 'after-hours');
    }
  } catch (e) {}
  var tbtn = d.querySelector('.theme-btn');
  if (tbtn) {
    tbtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'after-hours' ? '' : 'after-hours';
      if (next) { root.setAttribute('data-theme', next); } else { root.removeAttribute('data-theme'); }
      try { localStorage.setItem(KEY, next || 'daytime'); } catch (e) {}
      tbtn.textContent = next === 'after-hours' ? 'Daytime band' : 'After hours';
    });
    tbtn.textContent = root.getAttribute('data-theme') === 'after-hours' ? 'Daytime band' : 'After hours';
  }

  /* ---------- mobile nav ---------- */
  var tog = d.querySelector('.nav-toggle'), nav = d.querySelector('.nav');
  if (tog && nav) {
    tog.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- progress bar ---------- */
  var bar = d.querySelector('.progress span');
  if (bar && !reduced) {
    var upd = function () {
      var h = d.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ---------- reveals ---------- */
  var rvs = [].slice.call(d.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- tuning needle sweep ---------- */
  var needle = d.querySelector('.needle');
  if (needle) {
    var stations = [8, 18, 27, 41, 55, 63, 74, 88];
    var target = function () {
      var p = stations[Math.floor(Math.random() * stations.length)];
      needle.style.left = p + '%';
    };
    target();
    if (!reduced) { setInterval(target, 4200); }
    var readout = d.querySelector('.station-readout b');
    if (readout) {
      var names = ['Gullwrack Point 88.9', 'Dunmore Reach 101.3', 'Harbour Relay 94.6', 'The Net 91.7'];
      setInterval(function () {
        readout.textContent = names[Math.floor(Math.random() * names.length)];
      }, 4200);
    }
  }

  /* ---------- on-air clock ---------- */
  var clock = d.querySelector('.onair-clock');
  if (clock) {
    var tick = function () {
      var now = new Date();
      var t = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      clock.textContent = t;
    };
    tick(); setInterval(tick, 15000);
  }

  /* ---------- demo forms ---------- */
  d.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      f.querySelectorAll('[required]').forEach(function (inp) {
        var fld = inp.closest('.field');
        var bad = !inp.value.trim() || (inp.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value));
        if (fld) { fld.classList.toggle('invalid', bad); }
        if (bad) { ok = false; }
      });
      if (!ok) { return; }
      f.querySelectorAll('button[type="submit"]').forEach(function (b) { b.classList.add('loading'); b.disabled = true; });
      window.setTimeout(function () {
        f.querySelectorAll('button[type="submit"]').forEach(function (b) { b.classList.remove('loading'); b.disabled = false; });
        njToast('This is a demonstration form. Nothing was sent.');
        f.reset();
      }, 700);
    });
  });

  /* ---------- toast ---------- */
  var toastEl;
  function njToast(msg) {
    if (!toastEl) {
      toastEl = d.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      d.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    window.clearTimeout(njToast.t);
    njToast.t = window.setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }
  window.njToast = njToast;

  /* ---------- press-R time-signal chime (six pips) ---------- */
  var audioCtx = null;
  function pip(freq, when) {
    var o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.14, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(when); o.stop(when + 0.24);
  }
  d.addEventListener('keydown', function (ev) {
    if (ev.key !== 'r' && ev.key !== 'R') { return; }
    if (ev.target && /input|textarea|select/i.test(ev.target.tagName)) { return; }
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var t = audioCtx.currentTime + 0.05;
      for (var i = 0; i < 5; i++) { pip(1000, t + i * 0.5); }
      pip(1500, t + 2.5);
    } catch (e) {}
  });

  /* ---------- footer year ---------- */
  d.querySelectorAll('.yr').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
/* depth pass: marquee duplicate, chart bars, transcript drawer */
(function () {
  'use strict';
  var d = document;
  d.querySelectorAll('.freq-marquee .track').forEach(function (t) {
    t.innerHTML = t.innerHTML + t.innerHTML;
  });
  d.querySelectorAll('.chart-bars').forEach(function (c) {
    var bars = [].slice.call(c.children);
    bars.forEach(function (b, i) {
      b.style.height = (18 + Math.round(72 * Math.abs(Math.sin(i * 1.7)))) + '%';
      b.style.transition = 'height 0.9s cubic-bezier(0.22,1,0.36,1)';
    });
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      c.style.setProperty('--h', '0');
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) {
            bars.forEach(function (b, i) { b.style.height = (18 + Math.round(72 * Math.abs(Math.sin(i * 1.7)))) + '%'; });
            io.unobserve(c);
          }
        });
      }, { threshold: 0.3 });
      bars.forEach(function (b) { b.style.height = '6%'; });
      io.observe(c);
    }
  });
})();
