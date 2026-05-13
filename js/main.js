/* ================================================================
   TROPA DOS GORILLAS — main.js
   Lógica principal: grain, cursor, hero glow, botão magnético,
   back-to-top e animações GSAP ScrollTrigger
================================================================ */

/* ----------------------------------------------------------------
   FILM GRAIN — canvas procedural (animado em 60fps)
   Ajustar opacity em .grain no CSS para mais/menos granulação
---------------------------------------------------------------- */
(function initGrain() {
  const canvas = document.getElementById('grain-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let raf;

  function tick() {
    const w = canvas.width, h = canvas.height;
    const img = ctx.createImageData(w, h);
    const d   = img.data;

    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
    raf = requestAnimationFrame(tick);
  }

  tick();

  /* pausa quando aba não está visível — economiza CPU */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else tick();
  });
})();

/* ----------------------------------------------------------------
   CURSOR CUSTOMIZADO com lerp suave
---------------------------------------------------------------- */
(function initCursor() {
  const dot  = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  }, { passive: true });

  (function lerpRing() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(lerpRing);
  })();

  /* ring expande sobre elementos clicáveis */
  document.querySelectorAll('a, button, .lk-card, .ig-card, #btt, .yt-player').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
})();

/* ----------------------------------------------------------------
   HERO GLOW — segue o mouse
---------------------------------------------------------------- */
(function initHeroGlow() {
  const glow = document.getElementById('hero-glow');
  const hero = document.getElementById('hero');
  if (!glow || !hero) return;

  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    glow.style.transform = `translate(${e.clientX - r.left - 350}px, ${e.clientY - r.top - 350}px)`;
  }, { passive: true });
})();

/* ----------------------------------------------------------------
   BOTÃO MAGNÉTICO — CTA hero
---------------------------------------------------------------- */
(function initMagneticBtn() {
  const btn = document.getElementById('h-cta');
  if (!btn) return;

  btn.addEventListener('mousemove', (e) => {
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) * 0.28;
    const y = (e.clientY - r.top  - r.height / 2) * 0.28;
    btn.style.transform  = `translate(${x}px, ${y}px)`;
    btn.style.transition = 'transform 0.1s linear';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform  = 'translate(0, 0)';
    btn.style.transition = 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  });
})();

/* ----------------------------------------------------------------
   BACK TO TOP
---------------------------------------------------------------- */
(function initBackToTop() {
  const btt = document.getElementById('btt');
  if (!btt) return;

  window.addEventListener('scroll', () => {
    btt.classList.toggle('vis', window.scrollY > 500);
  }, { passive: true });

  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ----------------------------------------------------------------
   YOUTUBE PLAYER — click para carregar iframe com autoplay
   O thumbnail é inserido por thumbnails.js
---------------------------------------------------------------- */
(function initYouTubePlayer() {
  const player = document.getElementById('yt-player');
  if (!player) return;

  const videoId = player.dataset.videoId;

  player.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&color=white`;
    iframe.title            = 'Tropa dos Gorillas — A Tropa em Ação';
    iframe.allow            = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen  = true;

    /* remove thumb + overlay, insere iframe */
    player.querySelector('.yt-thumb')?.remove();
    player.querySelector('.yt-overlay')?.remove();
    player.appendChild(iframe);
    player.style.cursor = 'default';
  }, { once: true });
})();

/* ----------------------------------------------------------------
   GSAP SCROLL ANIMATIONS
   Requer GSAP + ScrollTrigger (carregados no <head> do HTML)
---------------------------------------------------------------- */
(function initGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* reveal genérico .rv */
  gsap.utils.toArray('.rv').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 48, filter: 'blur(6px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  /* reveal scale .rv-s */
  gsap.utils.toArray('.rv-s').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1, scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  /* hero timeline de entrada */
  gsap.timeline({ delay: 0.2 })
    .from('#h-label', { opacity: 0, y: 20, duration: 0.7,  ease: 'power3.out' })
    .from('#h-logo',  { opacity: 0, scale: 0.78, duration: 1,   ease: 'back.out(2)' },   '-=0.3')
    .from('#h-title', { opacity: 0, y: 65, duration: 1.05, ease: 'power4.out' },          '-=0.55')
    .from('#h-sub',   { opacity: 0, y: 30, duration: 0.75, ease: 'power3.out' },          '-=0.65')
    .from('#h-cta',   { opacity: 0, y: 28, duration: 0.7,  ease: 'power3.out' },          '-=0.55')
    .from('#h-scroll',{ opacity: 0, duration: 0.5 },                                       '-=0.3');

  /* parallax suave no título hero */
  gsap.to('#h-title', {
    y: -90,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2,
    },
  });

  /* link cards — stagger da esquerda */
  gsap.fromTo(['#lk1', '#lk2', '#lk3'],
    { opacity: 0, x: -44 },
    {
      opacity: 1, x: 0,
      duration: 0.7,
      stagger: 0.14,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#links', start: 'top 72%' },
    }
  );

  /* instagram cards — scale in stagger */
  gsap.fromTo(['#ig1', '#ig2', '#ig3', '#ig4', '#ig5'],
    { opacity: 0, scale: 0.93 },
    {
      opacity: 1, scale: 1,
      duration: 0.6,
      stagger: 0.09,
      ease: 'power2.out',
      scrollTrigger: { trigger: '#social', start: 'top 72%' },
    }
  );

  /* stats — slide up */
  gsap.utils.toArray('.stat-num').forEach((el, i) => {
    gsap.from(el, {
      opacity: 0, y: 35,
      duration: 0.7,
      delay: i * 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
})();
