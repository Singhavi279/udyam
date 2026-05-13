/* India MSME Dialogue — experience layer
   Behaviors: video carousel, cursor, reveals, counters, tilt,
   horizontal tracks, magnetic CTA, sticky stats, preload curtain,
   constellation positioning, edition map sync */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fineCursor = window.matchMedia('(pointer: fine)').matches;

/* ── PRE-LOAD CURTAIN ─────────────────────────────── */
function initPreloadCurtain() {
  const curtain = document.getElementById('curtain');
  const fill = document.querySelector('.curtain-bar-fill');
  if (!curtain) return;

  let progress = 0;
  const tick = () => {
    progress = Math.min(progress + Math.random() * 18, 100);
    if (fill) fill.style.width = progress + '%';
    if (progress < 100) setTimeout(tick, 110);
  };
  tick();

  const hide = () => {
    if (fill) fill.style.width = '100%';
    setTimeout(() => {
      curtain.classList.add('gone');
      setTimeout(() => { curtain.style.display = 'none'; }, 1400);
    }, 320);
  };

  const minDelay = new Promise(r => setTimeout(r, 1100));
  const loadDone = new Promise(r => {
    if (document.readyState === 'complete') r();
    else window.addEventListener('load', r, { once: true });
  });
  Promise.all([minDelay, loadDone]).then(hide);
  // hard fallback
  setTimeout(hide, 3500);
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
    const dur = 2400;
    const t0 = performance.now();
    el.classList.add('counting');
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
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
    }, { threshold: 0.25 });
    nums.forEach(n => obs.observe(n));
  };

  // Defer until curtain is dismissed so the increment is seen
  const curtain = document.getElementById('curtain');
  if (curtain && !curtain.classList.contains('gone')) {
    setTimeout(startObserving, 1500);
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
  const cardWidth = 400 + 28; // matches CSS

  const update = () => {
    const pr = pin.getBoundingClientRect();
    const total = pin.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-pr.top, 0), total);
    const p = total > 0 ? scrolled / total : 0;
    const maxShift = (totalCards * cardWidth) - window.innerWidth + 200;
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
