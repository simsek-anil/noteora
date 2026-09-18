/*
 * Noteora website — tiny vanilla JS.
 * No analytics, no tracking, no cookies. The only persisted value is the
 * light/dark theme preference, stored in localStorage (never sent anywhere).
 */
(function () {
  'use strict';

  var THEME_KEY = 'noteora-theme';
  var root = document.documentElement;
  var toggle = document.querySelector('[data-theme-toggle]');

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
  }

  function currentEffectiveTheme() {
    var stored = root.getAttribute('data-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  try {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) applyTheme(saved);
  } catch (e) {
    /* localStorage unavailable (private mode etc.) — silently fall back to system theme */
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentEffectiveTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        /* ignore */
      }
    });
  }

  var navToggle = document.querySelector('[data-nav-toggle]');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var isOpen = document.body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    function closeNav(returnFocus) {
      if (!document.body.classList.contains('nav-open')) return;
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) navToggle.focus();
    }

    document.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', function () { closeNav(false); });
    });

    /* The open panel covers the screen, so Escape must get you back out. */
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav(true);
    });

    /* A resize past the mobile breakpoint leaves the panel stranded open. */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) closeNav(false);
    });
  }


  /* Screenshot rail — arrow buttons alongside native scroll/swipe. */
  var rail = document.querySelector('[data-shots-rail]');
  if (rail) {
    var prev = document.querySelector('[data-shots-prev]');
    var next = document.querySelector('[data-shots-next]');

    function step() {
      var card = rail.querySelector('.shot');
      if (!card) return rail.clientWidth;
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function scrollBy(dir) {
      rail.scrollBy({ left: dir * step(), behavior: 'smooth' });
    }

    function syncButtons() {
      var max = rail.scrollWidth - rail.clientWidth - 1;
      if (prev) prev.disabled = rail.scrollLeft <= 0;
      if (next) next.disabled = rail.scrollLeft >= max;
    }

    if (prev) prev.addEventListener('click', function () { scrollBy(-1); });
    if (next) next.addEventListener('click', function () { scrollBy(1); });
    rail.addEventListener('scroll', syncButtons, { passive: true });
    window.addEventListener('resize', syncButtons);
    syncButtons();
  }


  /* ------------------------------------------------------------------
   * Cookie consent (Google Consent Mode v2)
   * The Google tag itself is loaded in <head> on every page, but every
   * storage signal starts as "denied" there. Nothing is written to the
   * browser until the visitor accepts below, at which point we send a
   * consent update rather than injecting a second tag.
   * The choice is kept in localStorage (a first-party value on this
   * device), never in a cookie, and is never transmitted anywhere.
   * ------------------------------------------------------------------ */
  var CONSENT_KEY = 'noteora-analytics-consent';
  var banner = document.querySelector('[data-cookie-banner]');

  function readConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      return null; /* storage blocked — treat as "not decided", never assume consent */
    }
  }

  function writeConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (e) {
      /* ignore — the choice simply won't persist to the next visit */
    }
  }

  function updateConsent(granted) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied'
    });
  }

  function clearAnalyticsCookies() {
    /* If consent is withdrawn, drop any _ga / _gid cookies already set. */
    var host = location.hostname;
    var domains = ['', host, '.' + host];
    var parts = host.split('.');
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));

    document.cookie.split(';').forEach(function (entry) {
      var name = entry.split('=')[0].trim();
      if (name.indexOf('_ga') !== 0 && name !== '_gid') return;
      domains.forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
      });
    });
  }

  function showBanner() {
    if (!banner) return;
    banner.hidden = false;
    /* Let the element paint before animating it in. */
    requestAnimationFrame(function () { banner.classList.add('is-visible'); });
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove('is-visible');
    banner.hidden = true;
  }

  function decide(value, returnFocusTo) {
    var granted = value === 'granted';
    writeConsent(value);
    updateConsent(granted);
    if (!granted) clearAnalyticsCookies();
    hideBanner();
    if (returnFocusTo && typeof returnFocusTo.focus === 'function') returnFocusTo.focus();
  }

  if (banner) {
    var accept = banner.querySelector('[data-cookie-accept]');
    var decline = banner.querySelector('[data-cookie-decline]');
    var reopenSource = null;

    if (accept) accept.addEventListener('click', function () { decide('granted', reopenSource); });
    if (decline) decline.addEventListener('click', function () { decide('denied', reopenSource); });

    if (!readConsent()) showBanner();

    /* "Cookie settings" links let visitors change their mind at any time. */
    document.querySelectorAll('[data-cookie-settings]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        reopenSource = link;
        showBanner();
        if (accept) accept.focus();
      });
    });
  }

})();
