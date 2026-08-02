/* =========================================================
   Njike Ange Joachim — Portfolio JS (ES6+, modulaire)
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Menu mobile ---------- */
  const initMobileNav = () => {
    const toggle = document.getElementById('navToggle');
    const navList = document.getElementById('navList');
    if (!toggle || !navList) return;

    const closeNav = () => {
      navList.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });
  };

  /* ---------- Reveal au scroll (Intersection Observer) ---------- */
  const initScrollReveal = () => {
    const targets = document.querySelectorAll('.reveal, .gallery-card');
    if (!('IntersectionObserver' in window) || !targets.length) {
      targets.forEach(t => t.classList.add('in-view'));
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(t => observer.observe(t));
  };

  /* ---------- Galerie Lightbox ---------- */
  const initLightbox = () => {
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightboxImg');
    const lbCaption = document.getElementById('lightboxCaption');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    if (!lightbox) return;

    let currentGroup = [];
    let currentIndex = 0;

    const collectGroup = (groupName) => {
      const cards = Array.from(document.querySelectorAll(`[data-lightbox-group="${groupName}"]`));
      return cards.map(card => ({
        src: card.querySelector('img').getAttribute('src'),
        alt: card.querySelector('img').getAttribute('alt'),
        caption: card.querySelector('figcaption')?.textContent || ''
      }));
    };

    const openLightbox = (groupName, index) => {
      currentGroup = collectGroup(groupName);
      currentIndex = index;
      renderLightbox();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };

    const renderLightbox = () => {
      const item = currentGroup[currentIndex];
      if (!item) return;
      lbImg.src = item.src;
      lbImg.alt = item.alt;
      lbCaption.textContent = item.caption;
    };

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };

    const step = (dir) => {
      if (!currentGroup.length) return;
      currentIndex = (currentIndex + dir + currentGroup.length) % currentGroup.length;
      renderLightbox();
    };

    document.querySelectorAll('.gallery-card').forEach(card => {
      const open = () => {
        const group = card.dataset.lightboxGroup;
        const index = Number(card.dataset.index);
        openLightbox(group, index);
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  };

  /* ---------- Retour en haut de page ---------- */
  const initBackToTop = () => {
    const btn = document.getElementById('toTop');
    if (!btn) return;
    const toggleVisibility = () => {
      btn.classList.toggle('visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    toggleVisibility();
  };

  /* ---------- Barre de progression de lecture ---------- */
  const initScrollProgress = () => {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
        bar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  };

  /* ---------- Header compact au scroll ---------- */
  const initHeaderState = () => {
    const header = document.querySelector('header');
    if (!header) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  /* ---------- Lien de navigation actif selon la section visible ---------- */
  const initActiveNav = () => {
    const sections = document.querySelectorAll('main section[id], section[id]');
    const links = document.querySelectorAll('nav a[href^="#"]');
    if (!sections.length || !links.length || !('IntersectionObserver' in window)) return;

    const setActive = (id) => {
      links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(section => observer.observe(section));
  };

  /* ---------- Parallaxe légère du Hero ---------- */
  const initHeroParallax = () => {
    const hero = document.querySelector('.hero');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hero || prefersReduced) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        if (rect.bottom > 0) {
          const shift = Math.max(-1, Math.min(1, rect.top / (rect.height || 1)));
          hero.style.setProperty('--parallax', (shift * -22).toFixed(1) + 'px');
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  /* ---------- Compteur animé (statistiques) ---------- */
  const initStatsCounter = () => {
    const numbers = document.querySelectorAll('.stat-number[data-count]');
    if (!numbers.length) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animateNumber = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || '';
      if (prefersReduced) {
        el.textContent = target + suffix;
        return;
      }
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      numbers.forEach(animateNumber);
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateNumber(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    numbers.forEach(el => observer.observe(el));
  };

  /* ---------- Initialisation ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initScrollReveal();
    initLightbox();
    initBackToTop();
    initScrollProgress();
    initHeaderState();
    initActiveNav();
    initHeroParallax();
    initStatsCounter();
  });
})();
