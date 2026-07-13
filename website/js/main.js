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

    document.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // The App Store badges are placeholders (href="#") until the app ships and
  // a real App Store URL is wired in. Clicking a real "#" link jumps the page
  // to the top, appends "#" to the URL, and — because :focus-visible treats
  // links conservatively — leaves a focus ring stuck on the badge after the
  // click. None of that is meaningful for a placeholder, so we stop it here.
  // Tab-key focus (real keyboard navigation) is untouched: the ring still
  // shows while tabbing, exactly as it should. Once href is replaced with a
  // real URL this selector stops matching and normal navigation resumes
  // automatically — no further edit needed here.
  document.querySelectorAll('.store-badge[href="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      link.blur();
    });
  });
})();
