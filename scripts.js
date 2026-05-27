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
    { lang: 'EN',  text: 'Atmanirbhar Bharat'       },
    { lang: 'हिं', text: 'आत्मनिर्भर भारत'          },
    { lang: 'मरा', text: 'आत्मनिर्भर भारत'          },
    { lang: 'ಕನ',  text: 'ಆತ್ಮನಿರ್ಭರ್ ಭಾರತ'        },
    { lang: 'বাং', text: 'আত্মনির্ভর ভারত'          },
    { lang: 'ગુ',  text: 'આત્મનિર્ભર ભારત'         },
    { lang: 'తె',  text: 'ఆత్మనిర్భర్ భారత్'        },
    { lang: 'த',   text: 'ஆத்மநிர்பர் பாரத்'        },
    { lang: 'ਪੰ',  text: 'ਆਤਮਨਿਰਭਰ ਭਾਰਤ'           },
    { lang: 'ଓ',   text: 'ଆତ୍ମନିର୍ଭର ଭାରତ'         },
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

  const minDelay = new Promise(r => setTimeout(r, 1400));
  const loadDone = new Promise(r => {
    if (document.readyState === 'complete') r();
    else window.addEventListener('load', r, { once: true });
  });
  Promise.all([minDelay, loadDone]).then(hide);
  setTimeout(hide, 3200); // hard safety fallback
}

/* ── NAVBAR SCROLL STATE + HAMBURGER + ACTIVE LINKS ─ */
function initNavbar() {
  const nav        = document.getElementById('navbar');
  const hamburger  = document.getElementById('nav-hamburger');
  const mobile     = document.getElementById('nav-mobile');
  if (!nav) return;

  // Scroll state
  const updateScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });

  // Hamburger toggle
  if (hamburger && mobile) {
    const openMenu = () => {
      hamburger.classList.add('open');
      mobile.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      mobile.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeMenu = () => {
      hamburger.classList.remove('open');
      mobile.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobile.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', () =>
      hamburger.classList.contains('open') ? closeMenu() : openMenu()
    );

    // Close on mobile link click
    mobile.querySelectorAll('.nav-mobile-link, .nav-mobile-cta').forEach(el => {
      el.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && hamburger.classList.contains('open')) closeMenu();
    });
  }

  // Active section highlighting via IntersectionObserver
  const sections = ['hero', 'about', 'tracks', 'partner', 'contact'];
  const navLinks  = nav.querySelectorAll('.nav-link');

  const setActive = id => {
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
  };

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) setActive(e.target.id);
    });
  }, { threshold: 0.35 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });
}

/* ── HERO VIDEO CAROUSEL ──────────────────────────── */
function initVideoCarousel() {
  const stack = document.querySelector('.hero-video-stack');
  if (!stack || reducedMotion) return;
  const allVideos = Array.from(stack.querySelectorAll('video'));
  if (!allVideos.length) return;

  // Track which videos are healthy (can be played)
  const healthy = new Set(allVideos);

  allVideos.forEach((v, i) => {
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = i === 0 ? 'auto' : 'metadata';
    v.addEventListener('error', () => {
      healthy.delete(v);
      v.style.display = 'none';
      v.classList.remove('active');
    });
  });

  // Start the first healthy video immediately
  const first = allVideos.find(v => healthy.has(v));
  if (!first) return;
  first.classList.add('active');
  first.play().catch(() => {});

  // Lazy-load the rest after first frame paints
  setTimeout(() => {
    allVideos.forEach(v => {
      if (v !== first && healthy.has(v)) { try { v.load(); } catch {} }
    });
  }, 1200);

  let currentIdx = allVideos.indexOf(first);

  const advance = () => {
    const videos = allVideos.filter(v => healthy.has(v));
    if (videos.length < 2) return;

    const prevIdx = currentIdx;
    const prevVideo = allVideos[prevIdx];

    // Find next healthy video after currentIdx
    let nextIdx = currentIdx;
    for (let i = 1; i <= allVideos.length; i++) {
      const candidate = (currentIdx + i) % allVideos.length;
      if (healthy.has(allVideos[candidate])) { nextIdx = candidate; break; }
    }
    if (nextIdx === currentIdx) return;

    const nextVideo = allVideos[nextIdx];

    // Reset next video to start so each cycle shows fresh content
    try { nextVideo.currentTime = 0; } catch {}
    nextVideo.play().catch(() => {});
    nextVideo.classList.add('active');
    prevVideo.classList.remove('active');
    currentIdx = nextIdx;

    // Pause the previous video AFTER the CSS opacity transition (0.9s)
    setTimeout(() => {
      if (!prevVideo.classList.contains('active')) {
        try { prevVideo.pause(); } catch {}
      }
    }, 950);
  };

  setInterval(advance, 5000);
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

  // Defer until curtain wipes away (1.4s minDelay + 1.4s dismiss + buffer)
  const curtain = document.getElementById('curtain');
  if (curtain && !curtain.classList.contains('gone')) {
    setTimeout(startObserving, 2000);
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
  const btns = document.querySelectorAll('.hero-cta-btn, .partner-cta-btn');
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
    { p1: '\u0a06\u0a24\u0a2e\u0a28\u0a3f\u0a30\u0a2d\u0a30\u00a0\u0a09\u0a26\u0a2f\u0a2e',        p2: '\u0a06\u0a24\u0a2e\u0a28\u0a3f\u0a30\u0a2d\u0a30\u00a0\u0a2d\u0a3e\u0a30\u0a24'         },
    { p1: '\u0c06\u0c24\u0c4d\u0c2e\u0c28\u0c3f\u0c30\u0c4d\u0c2d\u0c30\u0c4d\u00a0\u0c09\u0c26\u0c4d\u0c2f\u0c2e\u0c4d',    p2: '\u0c06\u0c24\u0c4d\u0c2e\u0c28\u0c3f\u0c30\u0c4d\u0c2d\u0c30\u0c4d\u00a0\u0c2d\u0c3e\u0c30\u0c24\u0c4d'     },
    { p1: '\u0b86\u0ba4\u0bcd\u0bae\u0ba8\u0bbf\u0bb0\u0bcd\u0baa\u0bb0\u0bcd\u00a0\u0b89\u0ba4\u0bcd\u0baf\u0bae\u0bcd',    p2: '\u0b86\u0ba4\u0bcd\u0bae\u0ba8\u0bbf\u0bb0\u0bcd\u0baa\u0bb0\u0bcd\u00a0\u0baa\u0bbe\u0bb0\u0ba4\u0bcd'     },
    { p1: '\u0986\u09a4\u09cd\u09ae\u09a8\u09bf\u09f0\u09cd\u09ad\u09f0\u00a0\u0989\u09a6\u09cd\u09af\u09ae',       p2: '\u0986\u09a4\u09cd\u09ae\u09a8\u09bf\u09f0\u09cd\u09ad\u09f0\u00a0\u09ad\u09be\u09f0\u09a4'        },
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

  // Start after preload curtain has cleared (~1.4s min + 1.4s dismiss + buffer)
  setTimeout(() => setInterval(flip, 3200), 3400);
}

/* ── STATE DATA ───────────────────────────────────── */
const aboutStates = {
  up: {
    name: 'Uttar Pradesh',
    nameLocal: 'उत्तर प्रदेश',
    tag: 'inaugural',
    tagLabel: 'Inaugural Edition',
    p1: `Uttar Pradesh sits at the centre of India's MSME engine, with over <strong>90 lakh enterprises</strong> driving employment, exports, and district-level industrialisation through initiatives like ODOP, digital single-window clearances, and targeted credit expansion. The state has built scale; the next challenge is coordination – connecting policy intent with capital, technology, compliance, and market access to unlock real growth.`,
    p2: `Achieving a <strong>$1 trillion economy</strong> target by 2030 demands sharper collaboration between government, MSMEs, investors, and solution providers across finance, technology, marketing, and regulatory support. The inaugural edition of the India MSME Dialogue in Uttar Pradesh will aim to create a focused platform to bring together decision-makers and enablers to address execution gaps, accelerate innovation, strengthen women-led enterprises, and convert the state's MSME base into a high-growth, globally competitive ecosystem.`,
    clusters: ['Kanpur · Leather', 'Firozabad · Glassware', 'Bhadohi · Carpets', 'Varanasi · Handloom', 'Moradabad · Brassware'],
    map: './assets/up_map.png',
  },
  maharashtra: {
    name: 'Maharashtra',
    nameLocal: 'महाराष्ट्र',
    tag: 'upcoming',
    tagLabel: 'Upcoming Edition',
    p1: `Maharashtra leads every state in MSME registrations, accounting for over <strong>1 crore enterprises</strong> — roughly 13% of all Udyam registrations nationally. The state's industrial presence spans pharmaceuticals, auto components, engineering, food processing, and more. Maharashtra is India's second-largest MSME exporting state by value, anchoring a significant share of the country's manufacturing output.`,
    p2: `Yet Maharashtra's size creates its own coordination problem: credit access, technology support, and market linkages remain concentrated in a few metros. Fulfilling Maharashtra's Atmanirbhar role — as the country's single largest MSME state — demands that policy reach extends beyond Mumbai and Pune. In view of this context, the Maharashtra edition of the India MSME Dialogue will enable a focused platform to do that, connecting enterprises across the state's full industrial geography with finance, compliance, and market solutions.`,
    clusters: ['Pune & Nashik · Auto & Engineering', 'MMR · Electronics, Pharma & Jewellery', 'Nagpur · Textiles & Agro', 'Kolhapur · Foundry', 'Sangli · Agro & Engineering'],
    map: './assets/maharashtra_map.png',
  },
  karnataka: {
    name: 'Karnataka',
    nameLocal: 'ಕರ್ನಾಟಕ',
    tag: 'upcoming',
    tagLabel: 'Upcoming Edition',
    p1: `Karnataka leads India in innovation per NITI Aayog and contributes <strong>7% of the country's exports</strong>. The state's over 50 lakh Udyam MSME units span electronics, food processing, garments, auto components, and chemicals. Yet the state's own RAMP Strategic Investment Plan of 2023 flags that 40% of MSMEs are unaware of single-window clearances, while 78% seeks adequate maintenance of core public infrastructure like power, water, roads, and common facility centres.`,
    p2: `Karnataka's GSDP is estimated at <strong>Rs 28.83 lakh crore</strong> in 2024–25, with the state contributing 9.19% to the national GDP. However, this growth needs to reach deeper into the MSME fabric. The Karnataka MSME Conclave and Awards will aim to address this gap precisely, connecting the state's enterprise base with capital, compliance support, and global market access to fulfil its Atmanirbhar potential.`,
    clusters: ['Bengaluru · Machine Tools & Auto Components', 'Ballari · Textiles', 'Mysuru · Handloom', 'Mangaluru · Petrochemicals', 'Belagavi · Foundry & Auto Components'],
    map: './assets/karnataka_map.png',
  },
  wb: {
    name: 'West Bengal',
    nameLocal: 'পশ্চিমবঙ্গ',
    tag: 'upcoming',
    tagLabel: 'Upcoming Edition',
    p1: `West Bengal has the <strong>second-largest MSME base in India</strong>, with around 90 lakh units. Development bank NABARD, in its state focus paper 2026–27, has estimated a priority sector lending potential of Rs 4 lakh crore for West Bengal for FY27, over half of which is for the MSME sector, reaffirming its role as the major driver of industrial growth. Despite this density, per capita GSDP remains below the national average.`,
    p2: `In this context, realising Atmanirbhar Bharat's promise in West Bengal requires connecting its unmatched enterprise base to formal credit, technology, and export markets. Hence, the West Bengal Summit and Awards will aim to be the platform to convene government, financial institutions, and industry to close that gap between West Bengal's MSME scale and its economic output.`,
    clusters: ['Kolkata · Leather', 'Durgapur · Heavy Engineering', 'South 24 Parganas · Textiles', 'Bankura · Handicrafts', 'Howrah · Light Engineering & Manufacturing'],
    map: './assets/wb_map.png',
  },
  gujarat: {
    name: 'Gujarat',
    nameLocal: 'ગુજરાત',
    tag: 'upcoming',
    tagLabel: 'Upcoming Edition',
    p1: `Gujarat retained its position as <strong>India's top exporting state</strong> in 2024–25, with merchandise exports amounting to around Rs 10 lakh crore — 26% of the country's total exports — led by petroleum products, gems and jewellery, organic chemicals, pharmaceuticals, and engineering goods. Over the past five years, the state has attracted Rs 86,418 crore in MSME sector investment and generated 3.98 lakh jobs.`,
    p2: `The foundation is strong, but sustaining Gujarat's position as the backbone of India's export-led Atmanirbhar agenda requires MSMEs to upgrade on technology, green compliance, and access to formal finance. The Gujarat MSME Conclave and Awards envisions helping build that ecosystem, connecting the state's MSME community with the policy, capital, and market enablers that can take cluster-level growth to a globally competitive scale.`,
    clusters: ['Rajkot · Machine Tools', 'Ahmedabad · Foundry', 'Morbi · Ceramic', 'Surat · Textiles & Jewellery', 'Vadodara · Pharma'],
    map: './assets/gujarat_map.png',
  },
};


/* ── STATE SELECTOR ───────────────────────────────── */
function initStateSelector() {
  const trigger  = document.getElementById('about-state-trigger');
  const menu     = document.getElementById('about-state-menu');
  const grid     = document.getElementById('about-grid');
  const options  = menu ? Array.from(menu.querySelectorAll('.about-state-option')) : [];
  if (!trigger || !menu) return;

  let activeState = 'up';

  const closeMenu = () => {
    menu.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    menu.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
  };

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#about-state-dropdown')) closeMenu();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  const applyState = key => {
    const s = aboutStates[key];
    if (!s || !grid) return;

    grid.classList.add('switching');

    setTimeout(() => {
      // Heading
      const heading = document.getElementById('about-state-heading');
      if (heading) heading.textContent = s.name;

      // Top edition badge
      const editionBadge = document.getElementById('about-edition-badge');
      if (editionBadge) {
        editionBadge.textContent = s.tag === 'inaugural' ? '★ Inaugural Edition' : '◎ Upcoming Edition';
        editionBadge.className   = `about-edition-badge ${s.tag}`;
      }

      // Trigger name
      const triggerName = document.getElementById('about-trigger-name');
      if (triggerName) triggerName.textContent = s.name;

      // Paragraphs
      const p1 = document.getElementById('about-p1');
      const p2 = document.getElementById('about-p2');
      if (p1) p1.innerHTML = s.p1;
      if (p2) p2.innerHTML = s.p2;

      // Cluster chips
      const chips = document.getElementById('about-clusters-chips');
      if (chips) chips.innerHTML = s.clusters.map(c => `<span class="about-cluster-chip">${c}</span>`).join('');

      // Map image + label
      const mapImg   = document.getElementById('about-map-img');
      const mapBadge = document.getElementById('about-map-badge');
      const mapState = document.getElementById('about-map-state');
      const mapCard  = document.getElementById('about-map-card');
      if (mapImg)   { mapImg.src = s.map; mapImg.alt = s.name + ' map'; }
      if (mapBadge) mapBadge.textContent = s.tagLabel;
      if (mapState) mapState.textContent = s.name;
      if (mapCard)  {
        mapCard.classList.remove('lit');
        requestAnimationFrame(() => requestAnimationFrame(() => mapCard.classList.add('lit')));
      }

      if (window._headingFlipRestart) window._headingFlipRestart(key);

      grid.classList.remove('switching');
    }, 220);

    options.forEach(opt => {
      const isActive = opt.dataset.state === key;
      opt.classList.toggle('active', isActive);
      opt.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    activeState = key;
    closeMenu();
  };

  options.forEach(opt => {
    opt.addEventListener('click', () => applyState(opt.dataset.state));
    opt.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyState(opt.dataset.state); }
    });
  });

}

/* ── REGISTRATION MODAL ───────────────────────────── */
function initRegisterModal() {
  const modal       = document.getElementById('register-modal');
  const backdrop    = document.getElementById('rmodal-backdrop');
  const closeBtn    = document.getElementById('rmodal-close');
  const form        = document.getElementById('register-form');
  const successEl   = document.getElementById('rmodal-success');
  const successClose = document.getElementById('rmodal-success-close');
  if (!modal) return;

  const triggers = [
    document.getElementById('nav-register-btn'),
    document.getElementById('nav-mobile-register-btn'),
    document.getElementById('hero-register-btn'),
  ];

  const open = () => {
    if (form && successEl) { form.hidden = false; successEl.hidden = true; }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const first = modal.querySelector('.pf-input');
      if (first) first.focus();
    }, 350);
  };

  const close = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  triggers.forEach(t => t && t.addEventListener('click', e => {
    e.preventDefault();
    // Close mobile nav drawer if open
    const hamburger = document.getElementById('nav-hamburger');
    const mobileNav = document.getElementById('nav-mobile');
    if (hamburger?.classList.contains('open')) {
      hamburger.classList.remove('open');
      mobileNav?.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    open();
  }));

  backdrop?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  successClose?.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });

  // Validation
  form?.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach(el => {
      const val = el.value.trim();
      let ok = !!val;
      if (ok && el.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (ok && el.type === 'tel')   ok = /^[\d\s+\-()]{8,}$/.test(val);
      if (!ok) {
        el.classList.add('error');
        if (valid) el.focus();
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });

    if (!valid) return;

    form.hidden = true;
    successEl.hidden = false;
  });

  form?.querySelectorAll('.pf-input').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });
}

/* ── PARTNERSHIP MODAL ────────────────────────────── */
function initPartnerModal() {
  const modal      = document.getElementById('partner-modal');
  const backdrop   = document.getElementById('pmodal-backdrop');
  const closeBtn   = document.getElementById('pmodal-close');
  const form       = document.getElementById('partner-form');
  const successEl  = document.getElementById('pmodal-success');
  const successClose = document.getElementById('pmodal-success-close');

  // Triggers
  const triggers = [
    document.getElementById('nav-partner-btn'),
    document.getElementById('nav-mobile-partner-btn'),
    document.querySelector('.partner-cta-btn'),
  ];

  if (!modal) return;

  const open = () => {
    // Reset to form view on each open
    if (form && successEl) {
      form.hidden = false;
      successEl.hidden = true;
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const first = modal.querySelector('.pf-input');
      if (first) first.focus();
    }, 350);
  };

  const close = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  triggers.forEach(t => t && t.addEventListener('click', e => {
    e.preventDefault();
    // Also close mobile nav if open
    const hamburger = document.getElementById('nav-hamburger');
    const mobileNav = document.getElementById('nav-mobile');
    if (hamburger?.classList.contains('open')) {
      hamburger.classList.remove('open');
      mobileNav?.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    open();
  }));

  backdrop?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  successClose?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  /* ── OTP flow ── */
  const phoneInput    = document.getElementById('pf-phone');
  const sendBtn       = document.getElementById('pf-otp-send');
  const otpRow        = document.getElementById('pf-otp-row');
  const otpInput      = document.getElementById('pf-otp');
  const verifyBtn     = document.getElementById('pf-otp-verify');
  const verifiedEl    = document.getElementById('pf-phone-verified');
  const otpHint       = document.getElementById('pf-otp-hint');
  let phoneVerified   = false;
  let resendTimer     = null;

  const startResendCountdown = () => {
    sendBtn.disabled = true;
    let secs = 30;
    sendBtn.textContent = `Resend (${secs}s)`;
    resendTimer = setInterval(() => {
      secs--;
      sendBtn.textContent = `Resend (${secs}s)`;
      if (secs <= 0) {
        clearInterval(resendTimer);
        sendBtn.disabled = false;
        sendBtn.textContent = 'Resend OTP';
      }
    }, 1000);
  };

  sendBtn?.addEventListener('click', () => {
    const phone = phoneInput?.value.trim();
    if (!phone || phone.length < 8) {
      phoneInput?.classList.add('error');
      phoneInput?.focus();
      return;
    }
    phoneInput?.classList.remove('error');
    otpRow.hidden = false;
    otpHint.hidden = false;
    otpHint.textContent = `OTP sent to ${phone}`;
    otpInput?.focus();
    startResendCountdown();
  });

  verifyBtn?.addEventListener('click', () => {
    const code = otpInput?.value.trim();
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      otpInput?.classList.add('error');
      otpInput?.focus();
      return;
    }
    // Mock verify — accept any 6-digit code
    phoneVerified = true;
    otpInput?.classList.remove('error');
    otpRow.hidden = true;
    otpHint.hidden = true;
    verifiedEl.hidden = false;
    clearInterval(resendTimer);
    sendBtn.disabled = true;
    sendBtn.textContent = 'Verified';
  });

  /* ── Form submission ── */
  form?.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    // Basic required field check
    form.querySelectorAll('[required]').forEach(el => {
      if (!el.value.trim()) {
        el.classList.add('error');
        if (valid) el.focus();
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });

    if (!phoneVerified) {
      phoneInput?.classList.add('error');
      phoneInput?.focus();
      valid = false;
    }

    if (!valid) return;

    // Show success
    form.hidden = true;
    successEl.hidden = false;
  });

  // Remove error class on input
  form?.querySelectorAll('.pf-input').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });
}

/* ── ABOUT HEADING LANGUAGE FLIP ─────────────────── */
function initHeadingFlip() {
  const el = document.getElementById('about-state-heading');
  if (!el || reducedMotion) return;

  let state = 'up';
  let showLocal = false;
  let timer = null;

  const swap = () => {
    const s = aboutStates[state];
    if (!s?.nameLocal) return;
    el.classList.add('about-heading-flipping');
    setTimeout(() => {
      showLocal = !showLocal;
      el.textContent = showLocal ? s.nameLocal : s.name;
      el.classList.remove('about-heading-flipping');
    }, 240);
  };

  const restart = key => {
    if (timer) clearInterval(timer);
    el.classList.remove('about-heading-flipping');
    state = key;
    showLocal = false;
    // slight delay so the content-switch animation settles first
    setTimeout(() => { timer = setInterval(swap, 2800); }, 1000);
  };

  restart('up');
  window._headingFlipRestart = restart;
}

/* ── BOOTSTRAP ────────────────────────────────────── */
function boot() {
  initPreloadCurtain();
  initNavbar();
  initVideoCarousel();
  initReveals();
  initCounters();
  initTilt();
  initHorizontalTracks();
  initMagneticCTA();
  initPartnerModal();
  initRegisterModal();
  initAboutScrollytelling();
  initStateSelector();
  initHeadingFlip();
  initConstellation();
  initExhibitParallax();
  initWhyCardFlip();
  initSubtitleFlip();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
