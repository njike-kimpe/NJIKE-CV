(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js-ready');
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  // Mobile navigation: state, keyboard close, and close after selecting a destination.
  const toggle = $('#navToggle');
  const nav = $('#primaryNav');
  const navList = $('#navList');
  const closeMenu = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Ouvrir le menu');
    nav.classList.remove('open');
  };
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.setAttribute('aria-label', expanded ? 'Ouvrir le menu' : 'Fermer le menu');
      nav.classList.toggle('open', !expanded);
    });
    $$('#navList a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    document.addEventListener('click', event => {
      if (nav.classList.contains('open') && !nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 760) closeMenu(); });
  }

  // Reveal-on-scroll is progressive enhancement: content stays visible if observer is unavailable.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Counters animate once when visible; exact final values remain accessible as text.
  const counters = $$('.stat-number[data-count]');
  const animateCounter = el => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || '';
    if (!Number.isFinite(target)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = `${target}${suffix}`; return;
    }
    const start = performance.now();
    const duration = 1000;
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { animateCounter(entry.target); counterObserver.unobserve(entry.target); }
    }), { threshold: 0.5 });
    counters.forEach(counter => counterObserver.observe(counter));
  } else counters.forEach(animateCounter);

  // Scroll progress and back-to-top button, updated in one animation frame.
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');
  let scrollTicking = false;
  const updateScrollUI = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
    if (toTop) toTop.classList.toggle('visible', window.scrollY > 520);
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollTicking) { window.requestAnimationFrame(updateScrollUI); scrollTicking = true; }
  }, { passive: true });
  updateScrollUI();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));

  // Gallery lightbox with arrow-key navigation and focus restoration.
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const caption = $('#lightboxCaption');
  const closeBtn = $('#lightboxClose');
  const prevBtn = $('#lightboxPrev');
  const nextBtn = $('#lightboxNext');
  const cards = $$('.gallery-card');
  let activeCards = [];
  let activeIndex = 0;
  let previousFocus = null;
  let bodyOverflow = '';
  const cardImage = card => $('img', card);
  const showImage = index => {
    if (!activeCards.length || !lightboxImg) return;
    activeIndex = (index + activeCards.length) % activeCards.length;
    const card = activeCards[activeIndex];
    const img = cardImage(card);
    if (!img) return;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || '';
    caption.textContent = card.querySelector('figcaption')?.textContent?.trim() || img.alt || '';
    prevBtn.disabled = activeCards.length < 2;
    nextBtn.disabled = activeCards.length < 2;
  };
  const openLightbox = card => {
    if (!lightbox) return;
    previousFocus = document.activeElement;
    activeCards = cards.filter(item => item.dataset.lightboxGroup === card.dataset.lightboxGroup);
    if (!activeCards.length) activeCards = cards;
    activeIndex = Math.max(0, activeCards.indexOf(card));
    showImage(activeIndex);
    bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    closeBtn?.focus();
  };
  const closeLightbox = () => {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = bodyOverflow;
    if (lightboxImg) { lightboxImg.removeAttribute('src'); lightboxImg.alt = ''; }
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  };
  cards.forEach(card => {
    card.addEventListener('click', () => openLightbox(card));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openLightbox(card); }
    });
  });
  closeBtn?.addEventListener('click', closeLightbox);
  prevBtn?.addEventListener('click', () => showImage(activeIndex - 1));
  nextBtn?.addEventListener('click', () => showImage(activeIndex + 1));
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', event => {
    if (!lightbox?.classList.contains('open')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeLightbox(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(activeIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showImage(activeIndex + 1); }
    // Keep keyboard focus inside the modal while open.
    if (event.key === 'Tab') {
      const focusable = [closeBtn, prevBtn, nextBtn].filter(el => el && !el.disabled);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const year = $('#currentYear');
  if (year) year.textContent = String(new Date().getFullYear());
})();
