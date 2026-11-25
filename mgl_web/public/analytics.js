// Google Analytics 4, loaded only after the visitor accepts. Shared by the home page, the privacy
// page and the React app (which calls window.mglAnalytics.pageView on each route).
// A file, not inline: the site's Content-Security-Policy blocks inline scripts.
// Nothing happens (no banner, no requests) without an ID or on any other host.
(function () {
  var MEASUREMENT_ID = ''; // "G-..." from Google Analytics; public by design
  var HOST = 'mygrandlabour.com';
  var KEY = 'mgl_analytics_consent';
  if (!MEASUREMENT_ID || location.hostname !== HOST) return;

  var DISABLE = 'ga-disable-' + MEASUREMENT_ID;
  var started = false;
  var page = null; // the current page, or null when it isn't tracked
  var lastUrl = null; // the last page sent
  var memory = null; // this visit's choice when storage is blocked

  function choice() {
    try { return localStorage.getItem(KEY) || memory; } catch { return memory; }
  }
  function remember(value) {
    memory = value;
    try { localStorage.setItem(KEY, value); } catch { /* storage blocked */ }
  }

  // The path to report: no query, private IDs masked, unknown paths collapsed (they could hold
  // anything). null = not tracked.
  function safePath(path) {
    path = path.replace(/\/+$/, '') || '/';
    if (/^\/(admin|agent|demo)(\/|$)/.test(path)) return null;
    if (/^\/employer\/jobs\/new$/.test(path)) return path;
    if (/^\/employer\/jobs\/[^/]+\/applicants$/.test(path)) return '/employer/jobs/:id/applicants';
    if (/^\/employer\/jobs\/[^/]+$/.test(path)) return '/employer/jobs/:id';
    if (/^\/jobs\/[\w-]+$/.test(path)) return path;
    var known = ['/', '/privacy.html', '/login', '/jobs', '/applications', '/profile',
      '/worker/verify/digilocker', '/employer', '/employer/login', '/employer/company', '/employer/workers'];
    return known.indexOf(path) >= 0 ? path : '/not-found';
  }

  function safeReferrer() {
    try {
      var url = new URL(document.referrer);
      if (url.hostname !== HOST) return url.origin + '/';
      var path = safePath(url.pathname);
      return path ? url.origin + path : '';
    } catch { return ''; }
  }

  function gtag() { window.dataLayer.push(arguments); }

  function start() {
    started = true;
    window.dataLayer = window.dataLayer || [];
    gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    });
    gtag('js', new Date());
    gtag('set', { page_location: page.url, page_title: page.title, page_referrer: safeReferrer() });
    gtag('config', MEASUREMENT_ID, {
      send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
    });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  function update() {
    var allowed = !!page && choice() === 'granted';
    window[DISABLE] = !allowed; // also stops automatic events on untracked pages
    if (allowed && page.url !== lastUrl) {
      if (!started) start();
      var referrer = lastUrl || safeReferrer();
      gtag('set', { page_location: page.url, page_title: page.title, page_referrer: referrer });
      gtag('event', 'page_view', { page_location: page.url, page_title: page.title, page_referrer: referrer });
      lastUrl = page.url;
    }
    if (page && !choice()) showBanner();
    else hideBanner();
  }

  function clearCookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^_ga(_|$)/.test(name)) return;
      document.cookie = name + '=; Max-Age=0; path=/';
      document.cookie = name + '=; Max-Age=0; path=/; domain=.' + HOST;
    });
  }

  function choose(value) {
    remember(value);
    if (value === 'denied') { lastUrl = null; clearCookies(); }
    hideBanner();
    update();
  }

  function button(text, value, style) {
    var el = document.createElement('button');
    el.type = 'button';
    el.textContent = text;
    el.style.cssText = 'font:600 15px Inter,system-ui,sans-serif;padding:10px 20px;border-radius:10px;cursor:pointer;border:1px solid #05254e;' + style;
    el.addEventListener('click', function () { choose(value); });
    return el;
  }

  function hideBanner() {
    var el = document.getElementById('mgl-consent');
    if (el) el.remove();
  }

  function showBanner() {
    if (document.getElementById('mgl-consent')) return;
    var box = document.createElement('div');
    box.id = 'mgl-consent';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Cookie choice');
    box.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:40;max-width:560px;margin:0 auto;box-sizing:border-box;padding:16px;background:#fff;color:#05254e;border:1px solid #dfe5ee;border-radius:16px;box-shadow:0 8px 30px rgba(5,37,78,.18);font:400 14px/1.5 Inter,system-ui,sans-serif';
    var text = document.createElement('p');
    text.style.cssText = 'margin:0 0 12px';
    text.textContent = 'May we use Google Analytics cookies to see how the site is used and improve it? The site works the same either way. ';
    var link = document.createElement('a');
    link.href = '/privacy.html';
    link.textContent = 'Privacy';
    link.style.cssText = 'color:#05479d;text-decoration:underline';
    text.appendChild(link);
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap';
    row.appendChild(button('Accept', 'granted', 'background:#05254e;color:#fff'));
    row.appendChild(button('Decline', 'denied', 'background:#fff;color:#05254e'));
    box.appendChild(text);
    box.appendChild(row);
    document.body.appendChild(box);
  }

  window.mglAnalytics = {
    pageView: function (path, title) {
      var safe = safePath(path);
      page = safe ? { url: location.origin + safe, title: title } : null;
      // Coming back from an untracked page counts as a new view.
      if (!page) lastUrl = null;
      update();
    },
  };

  // "Cookie settings" buttons, on any page.
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-cookie-settings]')) showBanner();
  });

  // Plain HTML pages report themselves; the React app reports each route.
  if (document.currentScript && document.currentScript.hasAttribute('data-auto')) {
    window.mglAnalytics.pageView(location.pathname, document.title);
  }
})();
