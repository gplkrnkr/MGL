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

  // Hero portraits: every few seconds ONE strip crossfades to its next worker,
  // taking turns left to right, so the change is gradual rather than all at once.
  // Each strip keeps its colour and cycles through its own column of portraits.
  // Pauses only while the tab is hidden. Reduced-motion users get a plain fade (no zoom, see CSS).
  var crew = document.querySelector('.crew');
  if (crew) {
    var columns = [
      [['mason-1', 'Mason'], ['construction-1', 'Construction'], ['mason-3', 'Mason']],
      [['welder-2', 'Welder'], ['technician-1', 'Technician'], ['plumber-1', 'Plumber']],
      [['electrician-1', 'Electrician'], ['electrician-2', 'Electrician'], ['factory-1', 'Factory worker']],
      [['housekeeping-1', 'Housekeeping'], ['facility-1', 'Facility staff'], ['housekeeping-2', 'Housekeeping']],
    ];
    var STEP = 2800; // time between one strip changing and the next
    var strips = Array.prototype.slice.call(crew.querySelectorAll('.strip'));
    var shown = strips.map(function () { return 0; }); // index into each column
    var turn = 0; // which strip changes next
    var timer = null;

    var url = function (name) { return '/portraits/' + name + '.webp'; };
    var decode = function (src) {
      var img = new Image();
      img.src = src;
      return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    };
    var swapLayers = function (strip, selector, update) {
      var layers = strip.querySelectorAll(selector);
      var front = strip.querySelector(selector + '.on');
      var back = layers[0] === front ? layers[1] : layers[0];
      update(back);
      back.classList.add('on');
      front.classList.remove('on');
      return [front, back];
    };

    var advance = function () {
      var i = turn;
      var strip = strips[i];
      var next = (shown[i] + 1) % columns[i].length;
      var item = columns[i][next];
      return decode(url(item[0])).then(function () {
        swapLayers(strip, 'img', function (img) { img.src = url(item[0]); });
        var labels = swapLayers(strip, 'figcaption', function (label) { label.textContent = item[1]; });
        labels[0].setAttribute('aria-hidden', 'true');
        labels[1].removeAttribute('aria-hidden');
        shown[i] = next;
        turn = (turn + 1) % strips.length;
        // Warm the cache for this strip's following portrait.
        decode(url(columns[i][(next + 1) % columns[i].length][0]));
      });
    };

    var schedule = function () {
      clearTimeout(timer);
      if (document.hidden) return;
      timer = setTimeout(function () { advance().then(schedule); }, STEP);
    };

    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('load', function () {
      columns.forEach(function (col) { decode(url(col[1][0])); });
      schedule();
    });
  }
})();
