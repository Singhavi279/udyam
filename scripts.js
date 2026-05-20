/* India MSME Dialogue — experience layer
   Behaviors: video carousel, cursor, reveals, counters, tilt,
   horizontal tracks, magnetic CTA, sticky stats, preload curtain,
   constellation positioning, edition map sync */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fineCursor = window.matchMedia('(pointer: fine)').matches;

/* ── PRE-LOAD CURTAIN ─────────────────────────────── */
function initPreloadCurtain() {
  const curtain = document.getElementById('curtain');
  const fill    = document.querySelector('.curtain-bar-fill');
  if (!curtain) return;

  /* ── Progress bar ── */
  let progress = 0;
  const tickBar = () => {
    progress = Math.min(progress + Math.random() * 14, 95);
    if (fill) fill.style.width = progress + '%';
    if (progress < 95) setTimeout(tickBar, 130);
  };
  tickBar();

  /* ── Typewriter ── */
  const typedEl = document.getElementById('curtain-typed');
  const fullText = 'Atmanirbhar Udyam · Atmanirbhar Bharat';
  if (typedEl) {
    let i = 0;
    const type = () => {
      typedEl.textContent = fullText.slice(0, i);
      i++;
      if (i <= fullText.length) {
        // Natural pause after first phrase, then accelerate
        const delay = i === 18 ? 320 : i < 18 ? 62 : 38;
        setTimeout(type, delay);
      }
    };
    setTimeout(type, 500);
  }

  /* ── Language cycler ── */
  const badgeEl = document.getElementById('curtain-lang');
  const textEl  = document.getElementById('curtain-lang-text');
  const phrases = [
    { lang: 'EN',  text: 'Make in India'        },
    { lang: 'हिं', text: 'मेक इन इंडिया'        },
    { lang: 'ಕನ',  text: 'ಮೇಕ್ ಇನ್ ಇಂಡಿಯಾ'     },
    { lang: 'मरा', text: 'मेक इन इंडिया'        },
    { lang: 'বাং', text: 'মেক ইন ইন্ডিয়া'      },
    { lang: 'ગુ',  text: 'મેક ઇન ઇન્ડિયા'       },
    { lang: 'EN',  text: 'Made in India'         },
    { lang: 'हिं', text: 'मेड इन इंडिया'        },
    { lang: 'ಕನ',  text: 'ಮೇಡ್ ಇನ್ ಇಂಡಿಯಾ'     },
    { lang: 'मरा', text: 'मेड इन इंडिया'        },
    { lang: 'বাং', text: 'মেড ইন ইন্ডিয়া'      },
    { lang: 'ગુ',  text: 'મેઇડ ઇન ઇન્ડિયા'     },
  ];

  let phraseIdx = 0;
  let cycleTimer = null;

  const cycleLang = () => {
    if (!badgeEl || !textEl) return;
    badgeEl.style.opacity = '0';
    textEl.style.opacity  = '0';
    setTimeout(() => {
      const p = phrases[phraseIdx];
      badgeEl.textContent = p.lang;
      textEl.textContent  = p.text;
      badgeEl.style.opacity = '1';
      textEl.style.opacity  = '1';
      phraseIdx = (phraseIdx + 1) % phrases.length;
    }, 210);
  };

  setTimeout(() => {
    cycleLang();
    cycleTimer = setInterval(cycleLang, 720);
  }, 900);

  /* ── Dismiss ── */
  const hide = () => {
    clearInterval(cycleTimer);
    if (fill) fill.style.width = '100%';
    setTimeout(() => {
      curtain.classList.add('gone');
      setTimeout(() => { curtain.style.display = 'none'; }, 1400);
    }, 340);
  };

  const minDelay = new Promise(r => setTimeout(r, 3100));
  const loadDone = new Promise(r => {
    if (document.readyState === 'complete') r();
    else window.addEventListener('load', r, { once: true });
  });
  Promise.all([minDelay, loadDone]).then(hide);
  setTimeout(hide, 5500); // hard safety fallback
}

/* ── NAVBAR SCROLL STATE ──────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ── HERO VIDEO CAROUSEL ──────────────────────────── */
function initVideoCarousel() {
  const stack = document.querySelector('.hero-video-stack');
  if (!stack || reducedMotion) return;
  const videos = Array.from(stack.querySelectorAll('video'));
  if (!videos.length) return;

  videos.forEach((v, i) => {
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    if (i === 0) {
      v.classList.add('active');
      v.play().catch(() => {});
    }
  });

  // Lazy-trigger load() on the rest 800ms after DOM ready
  setTimeout(() => {
    videos.slice(1).forEach(v => {
      try { v.load(); } catch {}
    });
  }, 800);

  let idx = 0;
  const advance = () => {
    const next = (idx + 1) % videos.length;
    videos[next].play().catch(() => {});
    videos[next].classList.add('active');
    videos[idx].classList.remove('active');
    setTimeout(() => {
      if (!videos[idx].classList.contains('active')) {
        try { videos[idx].pause(); } catch {}
      }
    }, 1000);
    idx = next;
  };

  setInterval(advance, 2800);

  // Graceful fallback: if any video errors, just hide it
  videos.forEach(v => {
    v.addEventListener('error', () => {
      v.style.display = 'none';
    });
  });
}

/* ── CUSTOM CURSOR ────────────────────────────────── */
function initCursor() {
  if (!fineCursor || reducedMotion) return;
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;
  document.body.classList.add('cursor-ready');

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  const render = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(render);
  };
  render();

  const hoverable = 'a, button, .interactive, .track-card, .why-card, .exhibit-card, .edition-card, .who-tag, .cluster-chip, .stat-item, .big-stat';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverable)) ring.classList.add('hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverable)) ring.classList.remove('hover');
  });
}

/* ── REVEAL ANIMATIONS ────────────────────────────── */
function initReveals() {
  const items = document.querySelectorAll('.reveal, .reveal-mask, .reveal-tilt');
  if (!items.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => obs.observe(el));
}

/* ── COUNTERS ─────────────────────────────────────── */
function initCounters() {
  const nums = document.querySelectorAll('[data-count]');
  if (!nums.length) return;

  // Reset to zero so the increment is visible
  nums.forEach(el => {
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    el.textContent = prefix + '0' + suffix;
  });

  const run = el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
    const dur = 1100;
    const t0 = performance.now();
    el.classList.add('counting');
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const val = e * target;
      const out = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-IN');
      el.textContent = prefix + out + suffix;
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        el.classList.remove('counting');
        el.classList.add('counted');
      }
    };
    requestAnimationFrame(tick);
  };

  const startObserving = () => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          run(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
    nums.forEach(n => obs.observe(n));
  };

  // Defer until curtain wipes away (curtain minDelay is 2600ms + ~340ms dismiss)
  const curtain = document.getElementById('curtain');
  if (curtain && !curtain.classList.contains('gone')) {
    setTimeout(startObserving, 3600);
  } else {
    startObserving();
  }
}

/* ── 3D TILT (stat cards, exhibit cards) ──────────── */
function initTilt() {
  if (!fineCursor || reducedMotion) return;
  const cards = document.querySelectorAll('.stat-item, .big-stat, .exhibit-card, .contact-card, .edition-card');
  cards.forEach(card => {
    let raf = 0;
    card.addEventListener('mousemove', e => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
      });
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ── HORIZONTAL TRACKS ────────────────────────────── */
function initHorizontalTracks() {
  const pin = document.querySelector('.tracks-pin');
  const rail = document.querySelector('.tracks-rail');
  const fill = document.querySelector('.tracks-progress-fill');
  const counter = document.querySelector('.tracks-counter strong');
  if (!pin || !rail) return;
  if (window.matchMedia('(max-width: 900px)').matches) return;

  const cards = rail.querySelectorAll('.track-card');
  const totalCards = cards.length;

  const getCardWidth = () => {
    if (cards.length < 2) return 428;
    // measure actual rendered gap from bounding rects
    const r0 = cards[0].getBoundingClientRect();
    const r1 = cards[1].getBoundingClientRect();
    const gap = r1.left - r0.right;
    return r0.width + gap;
  };

  const update = () => {
    const pr = pin.getBoundingClientRect();
    const total = pin.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-pr.top, 0), total);
    const p = total > 0 ? scrolled / total : 0;
    const cardWidth = getCardWidth();
    const cardW = cards[0].getBoundingClientRect().width;
    // leftPad matches CSS: calc(50vw - 200px); bring last card fully into view with 80px right margin
    const leftPad = window.innerWidth * 0.5 - 200;
    const lastCardRight = leftPad + (totalCards - 1) * cardWidth + cardW;
    const maxShift = lastCardRight - window.innerWidth + 80;
    rail.style.transform = `translateX(${-p * maxShift}px)`;
    if (fill) fill.style.width = (10 + p * 90) + '%';
    if (counter) counter.textContent = String(Math.min(totalCards, Math.max(1, Math.ceil(p * totalCards) || 1))).padStart(2, '0');
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

/* ── MAGNETIC CTA ─────────────────────────────────── */
function initMagneticCTA() {
  if (!fineCursor || reducedMotion) return;
  const btns = document.querySelectorAll('.hero-cta-btn, .final-cta-btn, .partner-cta-btn');
  btns.forEach(b => {
    b.addEventListener('mousemove', e => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      b.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; });
  });
}

/* ── SCROLLYTELLING ABOUT ─────────────────────────── */
function initAboutScrollytelling() {
  const card = document.querySelector('.about-map-card');
  const texts = document.querySelectorAll('.about-text');
  if (!card) return;

  const cardObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) card.classList.add('lit');
    });
  }, { threshold: 0.3 });
  cardObs.observe(card);

  // Focus paragraphs sequentially
  texts.forEach((t, i) => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          texts.forEach(x => x.classList.remove('in-focus'));
          t.classList.add('in-focus');
        }
      });
    }, { threshold: 0.6 });
    obs.observe(t);
  });
}

/* ── CONSTELLATION POSITIONING ────────────────────── */
function initConstellation() {
  const wrap = document.querySelector('.constellation');
  if (!wrap) return;
  if (window.matchMedia('(max-width: 900px)').matches) return;

  const tags = Array.from(wrap.querySelectorAll('.who-tag'));
  const svg = wrap.querySelector('.constellation-svg');
  const N = tags.length;
  const layout = () => {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const cx = w / 2;
    const cy = h / 2;
    const rx = Math.min(w * 0.42, 520);
    const ry = Math.min(h * 0.42, 240);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    tags.forEach((tag, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      // alternate ring radius slightly
      const k = i % 2 === 0 ? 1 : 0.7;
      const x = cx + Math.cos(angle) * rx * k;
      const y = cy + Math.sin(angle) * ry * k;
      tag.style.left = x + 'px';
      tag.style.top = y + 'px';
      tag.style.setProperty('--delay', (i * 0.15) + 's');

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.dataset.idx = i;
      svg.appendChild(line);
    });

    tags.forEach((tag, i) => {
      tag.addEventListener('mouseenter', () => {
        svg.querySelectorAll('line').forEach(l => l.classList.add('dimmed'));
        const ln = svg.querySelector(`line[data-idx="${i}"]`);
        if (ln) {
          ln.classList.remove('dimmed');
          ln.classList.add('lit');
        }
        tags.forEach((t, j) => { if (j !== i) t.classList.add('dimmed'); });
      });
      tag.addEventListener('mouseleave', () => {
        svg.querySelectorAll('line').forEach(l => { l.classList.remove('dimmed'); l.classList.remove('lit'); });
        tags.forEach(t => t.classList.remove('dimmed'));
      });
    });
  };

  layout();
  window.addEventListener('resize', () => {
    // debounce
    clearTimeout(window.__constellationT);
    window.__constellationT = setTimeout(layout, 120);
  });
}

/* ── EDITION MAP SYNC ─────────────────────────────── */
function initEditionMapSync() {
  const cards = document.querySelectorAll('.edition-card');
  const blobs = document.querySelectorAll('.india-map-banner .state-blob');
  if (!cards.length || !blobs.length) return;

  const light = state => {
    blobs.forEach(b => b.classList.toggle('active', b.dataset.state === state));
  };

  cards.forEach(c => {
    c.addEventListener('mouseenter', () => light(c.dataset.state));
    c.addEventListener('mouseleave', () => light(null));
  });

  // also tie to viewport center on scroll
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio > 0.6) {
        light(e.target.dataset.state);
      }
    });
  }, { threshold: [0.6] });
  cards.forEach(c => obs.observe(c));
}

/* ── WHY CARD TAP-TO-FLIP (touch devices) ────────── */
function initWhyCardFlip() {
  if (fineCursor) return; // desktop uses CSS :hover
  const cards = document.querySelectorAll('.why-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const wasFlipped = card.classList.contains('flipped');
      document.querySelectorAll('.why-card.flipped').forEach(c => c.classList.remove('flipped'));
      if (!wasFlipped) card.classList.add('flipped');
    });
  });
}

/* ── EXHIBIT ICON PARALLAX ────────────────────────── */
function initExhibitParallax() {
  if (reducedMotion) return;
  const icons = document.querySelectorAll('.exhibit-card-icon');
  if (!icons.length) return;
  const update = () => {
    icons.forEach(icon => {
      const r = icon.getBoundingClientRect();
      const center = window.innerHeight / 2;
      const dist = (r.top + r.height / 2 - center) / window.innerHeight;
      icon.style.transform = `translateY(${-dist * 12}px)`;
    });
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ── MULTI-LANGUAGE SUBTITLE FLIP ─────────────────── */
function initSubtitleFlip() {
  const subtitle = document.getElementById('hero-subtitle-flip');
  if (!subtitle || reducedMotion) return;

  const phrases = [
    { p1: 'Atmanirbhar\u00a0Udyam',        p2: 'Atmanirbhar\u00a0Bharat'        },
    { p1: '\u0906\u0924\u094d\u092e\u0928\u093f\u0930\u094d\u092d\u0930\u00a0\u0909\u0926\u094d\u092f\u092e',       p2: '\u0906\u0924\u094d\u092e\u0928\u093f\u0930\u094d\u092d\u0930\u00a0\u092d\u093e\u0930\u0924'          },
    { p1: '\u0c86\u0ca4\u0ccd\u0cae\u0ca8\u0cbf\u0cb0\u0ccd\u0cad\u0cb0\u0ccd\u00a0\u0c89\u0ca6\u0ccd\u0caf\u0cae',    p2: '\u0c86\u0ca4\u0ccd\u0cae\u0ca8\u0cbf\u0cb0\u0ccd\u0cad\u0cb0\u0ccd\u00a0\u0cad\u0cbe\u0cb0\u0ca4'     },
    { p1: '\u0986\u09a4\u09cd\u09ae\u09a8\u09bf\u09b0\u09cd\u09ad\u09b0\u00a0\u0989\u09a6\u09cd\u09af\u09ae',    p2: '\u0986\u09a4\u09cd\u09ae\u09a8\u09bf\u09b0\u09cd\u09ad\u09b0\u00a0\u09ad\u09be\u09b0\u09a4'       },
    { p1: '\u0a86\u0aa4\u0acd\u0aae\u0aa8\u0abf\u0ab0\u0acd\u0aad\u0ab0\u00a0\u0a89\u0aa6\u0acd\u0aaf\u0aae',   p2: '\u0a86\u0aa4\u0acd\u0aae\u0aa8\u0abf\u0ab0\u0acd\u0aad\u0ab0\u00a0\u0aad\u0abe\u0ab0\u0aa4'      },
  ];

  const accent = subtitle.querySelector('.word.accent');
  const gold   = subtitle.querySelector('.word.gold');
  if (!accent || !gold) return;

  let idx = 0;

  const flip = () => {
    subtitle.classList.add('hero-subtitle-flipping');
    setTimeout(() => {
      idx = (idx + 1) % phrases.length;
      accent.textContent = phrases[idx].p1;
      gold.textContent   = phrases[idx].p2;
      subtitle.classList.remove('hero-subtitle-flipping');
      subtitle.classList.add('hero-subtitle-flipped');
      setTimeout(() => subtitle.classList.remove('hero-subtitle-flipped'), 500);
    }, 290);
  };

  // Start after preload curtain has cleared (~3.1s min + ~340ms dismiss + buffer)
  setTimeout(() => setInterval(flip, 3200), 5200);
}

/* ── BOOTSTRAP ────────────────────────────────────── */
function boot() {
  initPreloadCurtain();
  initNavbar();
  initVideoCarousel();
  initCursor();
  initReveals();
  initCounters();
  initTilt();
  initHorizontalTracks();
  initMagneticCTA();
  initAboutScrollytelling();
  initConstellation();
  initEditionMapSync();
  initExhibitParallax();
  initWhyCardFlip();
  initSubtitleFlip();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
