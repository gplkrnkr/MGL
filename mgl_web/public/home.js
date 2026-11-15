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

  // Hero portraits: the shuffle button cycles through sets of four workers.
  var crew = document.querySelector('.crew');
  var shuffle = crew && crew.querySelector('.shuffle');
  if (crew && shuffle) {
    var sets = [
      [['mason-1', 'Mason'], ['welder-1', 'Welder'], ['electrician-1', 'Electrician'], ['housekeeping-1', 'Housekeeping']],
      [['construction-1', 'Construction'], ['technician-1', 'Technician'], ['electrician-2', 'Electrician'], ['facility-1', 'Facility staff']],
      [['mason-2', 'Mason'], ['plumber-1', 'Plumber'], ['factory-1', 'Factory worker'], ['housekeeping-2', 'Housekeeping']],
    ];
    var strips = crew.querySelectorAll('.strip');
    var current = 0;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var apply = function (set) {
      strips.forEach(function (strip, i) {
        strip.querySelector('img').src = '/portraits/' + set[i][0] + '.webp';
        strip.querySelector('figcaption').textContent = set[i][1];
      });
    };
    var preload = function (set) {
      set.forEach(function (item) { new Image().src = '/portraits/' + item[0] + '.webp'; });
    };

    shuffle.addEventListener('click', function () {
      current = (current + 1) % sets.length;
      var next = sets[current];
      preload(sets[(current + 1) % sets.length]);
      if (reduceMotion) { apply(next); return; }
      crew.classList.add('swapping');
      setTimeout(function () {
        apply(next);
        crew.classList.remove('swapping');
      }, 250);
    });
    // Warm the cache for the first shuffle once the page has settled.
    window.addEventListener('load', function () { preload(sets[1]); });
  }
})();
