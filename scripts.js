/* =========================================================
   India MSME Dialogue — UP Edition
   Mobile-first interactions. Vanilla JS, no dependencies.
   ========================================================= */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. Language toggle (Hindi default <-> English)
     - Stores choice in localStorage
     - Button label always shows the *target* language
     - Minimal v1: toggles the document lang attribute and a body class.
       Real translation would swap [data-i18n] strings; this hook is here
       for that future work.
  ------------------------------------------------------------------ */
  var langToggle = document.getElementById('langToggle');
  var STORAGE_KEY = 'msme-lang';

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.body.classList.toggle('lang-en', lang === 'en');
    document.body.classList.toggle('lang-hi', lang === 'hi');
    if (langToggle) langToggle.textContent = lang === 'hi' ? 'English' : 'हिंदी';
  }

  var savedLang = null;
  try { savedLang = localStorage.getItem(STORAGE_KEY); } catch (_) {}
  applyLang(savedLang === 'en' ? 'en' : 'hi');

  if (langToggle) {
    langToggle.addEventListener('click', function () {
      var next = document.documentElement.lang === 'hi' ? 'en' : 'hi';
      try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
      applyLang(next);
    });
  }

  /* ------------------------------------------------------------------
     2. Smooth-scroll offset for sticky nav (anchor links)
     - CSS already has scroll-behavior:smooth, but sticky nav can hide
       the section heading. We adjust the destination by nav height.
  ------------------------------------------------------------------ */
  var nav = document.getElementById('nav');
  function scrollOffset() {
    return (nav ? nav.offsetHeight : 0) + 8;
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - scrollOffset();
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.replaceState(null, '', href);
    });
  });

  /* ------------------------------------------------------------------
     3. Sticky CTA visibility (hide once user reaches the form)
  ------------------------------------------------------------------ */
  var sticky = document.querySelector('.sticky-cta');
  var applySection = document.getElementById('apply');
  if (sticky && applySection && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        sticky.style.display = entry.isIntersecting ? 'none' : '';
      });
    }, { rootMargin: '-40% 0px -40% 0px' });
    io.observe(applySection);
  }

  /* ------------------------------------------------------------------
     4. WhatsApp FAB — collapse to icon after 4 seconds, expand on hover
  ------------------------------------------------------------------ */
  var fab = document.querySelector('.fab');
  if (fab) {
    setTimeout(function () { fab.classList.add('is-collapsed'); }, 4000);
    fab.addEventListener('mouseenter', function () { fab.classList.remove('is-collapsed'); });
    fab.addEventListener('mouseleave', function () { fab.classList.add('is-collapsed'); });
  }

  /* ------------------------------------------------------------------
     5. Form validation + submit (client-side only demo flow)
     - Vernacular error messages (no Google-Translate-y phrasing)
     - Saves draft to localStorage so a mid-form drop-off recovers
     - On submit: shows the warm post-submit screen named in copywrite.md
  ------------------------------------------------------------------ */
  var form = document.getElementById('applyForm');
  var success = document.getElementById('formSuccess');
  var successName = document.getElementById('successName');
  var DRAFT_KEY = 'msme-apply-draft';

  if (form) {
    // 5a. Restore draft
    try {
      var draftRaw = localStorage.getItem(DRAFT_KEY);
      if (draftRaw) {
        var draft = JSON.parse(draftRaw);
        Object.keys(draft).forEach(function (name) {
          var el = form.elements.namedItem(name);
          if (el && typeof draft[name] === 'string') el.value = draft[name];
        });
      }
    } catch (_) {}

    // 5b. Persist draft on every change
    form.addEventListener('input', function () {
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name) data[el.name] = el.value;
      });
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (_) {}
    });

    // 5c. Per-field validators (vernacular messages)
    var validators = {
      name: function (v) {
        if (!v.trim()) return 'नाम छूट गया — एक second में लिख दीजिए।';
        if (v.trim().length < 2) return 'पूरा नाम लिखिए।';
        return '';
      },
      business: function (v) {
        if (!v.trim()) return 'Business / दुकान / factory का नाम चाहिए।';
        return '';
      },
      role: function (v) {
        if (!v) return 'एक option चुनिए।';
        return '';
      },
      city: function (v) {
        if (!v.trim()) return 'District और state बताइए।';
        return '';
      },
      sector: function (v) {
        if (!v.trim()) return 'एक line में बताइए — क्या बनाते / बेचते हैं?';
        return '';
      },
      whatsapp: function (v) {
        var clean = (v || '').replace(/[^0-9]/g, '');
        if (!clean) return 'WhatsApp number ज़रूरी है।';
        if (clean.length < 10) return 'पूरा 10-digit number लिखिए।';
        return '';
      },
      email: function (v) {
        if (!v) return ''; // optional
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email सही नहीं लग रहा। दोबारा देख लीजिए।';
        return '';
      }
    };

    function showError(field, msg) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.toggle('is-error', !!msg);
      var hint = wrap.querySelector('.hint');
      if (hint) hint.textContent = msg || hint.dataset.defaultHint || '';
    }

    // capture default hints so we can restore them after errors clear
    form.querySelectorAll('.hint').forEach(function (h) {
      h.dataset.defaultHint = h.textContent;
    });

    // 5d. Inline validation on blur
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || !validators[el.name]) return;
      el.addEventListener('blur', function () {
        showError(el, validators[el.name](el.value));
      });
    });

    // 5e. Submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      Object.keys(validators).forEach(function (name) {
        var el = form.elements.namedItem(name);
        if (!el) return;
        var msg = validators[name](el.value);
        showError(el, msg);
        if (msg && !firstInvalid) firstInvalid = el;
      });

      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: false });
        return;
      }

      // Demo "submit": in production this hits a backend or Google Form.
      // For now we simulate success and keep the experience warm.
      var name = (form.elements.namedItem('name') || {}).value || '';
      var firstName = name.split(' ')[0] || 'ji';
      if (successName) successName.textContent = firstName + ' ji';

      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Clear draft post-submit
      try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
    });
  }

  /* ------------------------------------------------------------------
     6. Subtle scroll-in for cards (reduced-motion respected via CSS)
  ------------------------------------------------------------------ */
  if ('IntersectionObserver' in window) {
    var revealEls = document.querySelectorAll('.card, .cluster, .edition, .fear, .tracks li, .contact');
    revealEls.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.transition = 'opacity 240ms ease, transform 240ms ease';
    });
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

})();
