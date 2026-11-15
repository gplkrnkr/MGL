// Scripts for the public home page (home.html), served at / by nginx.
// Kept in this file rather than inline: the site's Content-Security-Policy blocks inline scripts.
(function () {
  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  var links = document.getElementById('nav-links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      links.classList.toggle('open', !open);
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menuBtn.setAttribute('aria-expanded', 'false');
        links.classList.remove('open');
      });
    });
  }

  // Workers / Employers / Government tabs
  var tabs = document.querySelectorAll('.tab[data-panel]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-pressed', String(on));
        var panel = document.getElementById('panel-' + t.dataset.panel);
        if (panel) panel.hidden = !on;
      });
    });
  });

  // Hero portraits: rotate through sets of four workers with a staggered crossfade
  // (each strip changes ~180ms after the one to its left; delays live in the CSS).
  // Pauses on hover and in hidden tabs; the button pauses/plays it.
  // With reduced motion it never starts on its own.
  var crew = document.querySelector('.crew');
  var toggle = crew && crew.querySelector('.shuffle');
  if (crew && toggle) {
    var sets = [
      [['mason-1', 'Mason'], ['welder-1', 'Welder'], ['electrician-1', 'Electrician'], ['housekeeping-1', 'Housekeeping']],
      [['construction-1', 'Construction'], ['technician-1', 'Technician'], ['electrician-2', 'Electrician'], ['facility-1', 'Facility staff']],
      [['mason-2', 'Mason'], ['plumber-1', 'Plumber'], ['factory-1', 'Factory worker'], ['housekeeping-2', 'Housekeeping']],
    ];
    var INTERVAL = 4500;
    var FADE = 900 + 3 * 180; // longest fade incl. stagger
    var strips = Array.prototype.slice.call(crew.querySelectorAll('.strip'));
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = 0;
    var playing = !reduceMotion;
    var hovering = false;
    var busy = false;
    var timer = null;

    var url = function (name) { return '/portraits/' + name + '.webp'; };
    var decode = function (src) {
      var img = new Image();
      img.src = src;
      return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    };

    var show = function (index) {
      var set = sets[index];
      busy = true;
      // Decode the whole set first so no strip fades in blank.
      return Promise.all(set.map(function (item) { return decode(url(item[0])); })).then(function () {
        strips.forEach(function (strip, i) {
          var layers = strip.querySelectorAll('img');
          var front = strip.querySelector('img.on');
          var back = layers[0] === front ? layers[1] : layers[0];
          back.src = url(set[i][0]);
          back.classList.add('on');
          front.classList.remove('on');
          var label = strip.querySelector('figcaption');
          strip.classList.add('relabel');
          setTimeout(function () {
            label.textContent = set[i][1];
            strip.classList.remove('relabel');
          }, reduceMotion ? 0 : 400 + i * 180);
        });
        current = index;
        setTimeout(function () { busy = false; }, reduceMotion ? 0 : FADE);
      });
    };

    var schedule = function () {
      clearTimeout(timer);
      if (!playing || hovering || document.hidden) return;
      timer = setTimeout(function () {
        if (busy) { schedule(); return; }
        show((current + 1) % sets.length).then(schedule);
      }, INTERVAL);
    };

    var render = function () {
      toggle.setAttribute('aria-pressed', String(!playing));
      toggle.setAttribute('aria-label', playing ? 'Pause the changing portraits' : 'Play the changing portraits');
      toggle.querySelector('use').setAttribute('href', playing ? '#i-pause' : '#i-play');
    };

    toggle.addEventListener('click', function () {
      playing = !playing;
      render();
      schedule();
    });
    var strip = crew.querySelector('.crew-strips');
    strip.addEventListener('mouseenter', function () { hovering = true; schedule(); });
    strip.addEventListener('mouseleave', function () { hovering = false; schedule(); });
    document.addEventListener('visibilitychange', schedule);

    render();
    window.addEventListener('load', function () {
      sets[1].forEach(function (item) { decode(url(item[0])); });
      schedule();
    });
  }
})();
