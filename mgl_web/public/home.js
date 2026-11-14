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
})();
