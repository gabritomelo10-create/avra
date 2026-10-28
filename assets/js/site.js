/* =========================================================
   AVRA — site institucional
   ========================================================= */
(function () {
  'use strict';

  // Dados de contato — EXEMPLOS: substituir pelos dados oficiais da AVRA.
  const CONTATO = {
    whatsapp: '5595900000000',            // DDI + DDD + número, só dígitos
    whatsappLabel: '(95) 9 0000-0000',
    email: 'contato@avra.com.br'
  };

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  gsap.registerPlugin(ScrollTrigger);

  $$('.js-logo path').forEach((p) => { p.setAttribute('d', AVRA_LOGO.d); p.setAttribute('fill-rule', 'evenodd'); });
  $('#loaderPath').setAttribute('d', AVRA_LOGO.d);
  $('#ctWhats').textContent = CONTATO.whatsappLabel;
  $('#ctMail').textContent = CONTATO.email;

  /* ---------- scroll suave ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const go = (target) => { if (lenis) lenis.scrollTo(target, { duration: 1.8 }); else target.scrollIntoView({ behavior: 'smooth' }); };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const el = a.getAttribute('href').length > 1 && $(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault(); document.body.classList.remove('menu-open'); go(el);
  }));

  /* ---------- menu móvel ---------- */
  $('#menuBtn').addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    $('#menuBtn').setAttribute('aria-expanded', open);
  });

  /* ---------- barra: sólida ao rolar, some ao descer ---------- */
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    $('#progressBar').style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    const bar = $('#topbar');
    bar.classList.toggle('is-solid', y > innerHeight * 0.6);
    bar.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;
  }, { passive: true });

  /* ---------- texto dividido ---------- */
  $$('.split-lines').forEach((el) => {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((p) => `<span class="line"><span>${p.trim()}</span></span>`).join('');
  });
  $$('.hero__title .split').forEach((el) => { el.innerHTML = `<span class="w">${el.textContent}</span>`; });
  // manifesto palavra por palavra (preserva o <em>)
  const man = $('#manifestoText');
  man.innerHTML = man.innerHTML.replace(/(<em>.*?<\/em>)|([^\s<]+)/g, (m, em, w) => `<span class="mw">${em || w}</span>`);

  /* ---------- cursor ---------- */
  if (!touch) {
    const cur = $('#cursor'), dot = $('.cursor__dot', cur), ring = $('.cursor__ring', cur), lab = $('#cursorLabel');
    const p = { x: innerWidth / 2, y: innerHeight / 2 }, r = { x: p.x, y: p.y };
    window.addEventListener('pointermove', (e) => { p.x = e.clientX; p.y = e.clientY; });
    gsap.ticker.add(() => {
      r.x += (p.x - r.x) * 0.15; r.y += (p.y - r.y) * 0.15;
      dot.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${r.x}px, ${r.y}px) translate(-50%,-50%)`;
      const l = document.body.classList.contains('hero-hover') ? 'arraste' : '';
      cur.classList.toggle('is-label', !!l); lab.textContent = l;
    });
    $$('a, button, input, select, textarea').forEach((el) => {
      el.addEventListener('pointerenter', () => cur.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cur.classList.remove('is-hover'));
    });
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const b = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - b.left - b.width / 2) * 0.2, y: (e.clientY - b.top - b.height / 2) * 0.3, duration: 0.7, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1,.5)' }));
    });
  }

  /* ---------- hero ---------- */
  function hero() {
    const st = window.AVRA3D && window.AVRA3D.initHero();
    const heroEl = $('#hero');
    const mouse = { x: 0, y: 0 }, sm = { x: 0, y: 0 };
    heroEl.addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
    gsap.ticker.add(() => {
      sm.x += (mouse.x - sm.x) * 0.025; sm.y += (mouse.y - sm.y) * 0.025;
      gsap.set('.glow--a', { x: sm.x * 80, y: sm.y * 50 });
      gsap.set('.glow--b', { x: sm.x * -60, y: sm.y * -40 });
      gsap.set('.site-hero__photo', { x: sm.x * -24, y: sm.y * -16 });
    });
    // pattern fino e texturizado em duas profundidades, com respiro sobre a assinatura
    BR20.animate($('#heroPatternFar'), { color: '#B6A078', alpha: 0.32, seed: 31, speed: 0.35, width: 0.7, fine: true, textured: true, density: 1.5, mirror: true, align: { ax: 0.1, ay: 0.5, scale: 1.3 }, offsetX: () => sm.x * -14, offsetY: () => sm.y * -10, fade: { x: 0.5, y: 0.3, r: 0.4, soft: 0.5 } });
    BR20.animate($('#heroPatternNear'), { color: '#D9B49A', alpha: 0.4, seed: 20, speed: 0.45, width: 0.85, fine: true, textured: true, density: 1.3, interactive: true, host: heroEl, radius: 120, force: 34, align: { ax: 0.9, ay: 0.4, scale: 1.08 }, offsetX: () => sm.x * 22, offsetY: () => sm.y * 15, fade: { x: 0.5, y: 0.3, r: 0.34, soft: 0.45 } });
    // na home a assinatura fica acima do texto
    const fit = () => { if (!st) return; const narrow = innerWidth < 700; st.lift = narrow ? 6.5 : 1.75; st.size = narrow ? 1 : 0.72; };
    fit(); window.addEventListener('resize', fit);
    if (st) ScrollTrigger.create({ trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => { st.scroll = s.progress; } });
    gsap.to('.site-hero__content', { y: -100, opacity: 0, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: '60% top', scrub: true } });
    gsap.to('.hero__descriptor', { opacity: 0, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: '35% top', scrub: true } });
    gsap.to('.site-hero__photo img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
    return () => {
      const tl = gsap.timeline();
      if (st) tl.to(st, { reveal: 1, duration: 2.6, ease: 'power2.inOut' }, 0.1);
      tl.fromTo('.hero__descriptor', { opacity: 0, letterSpacing: '0.2em' }, { opacity: 0.9, letterSpacing: touch ? '0.5em' : '0.9em', duration: 2, ease: 'power3.out' }, 1.6)
        .from('.hero__title .w', { yPercent: 110, duration: 1.5, ease: 'power4.out', stagger: 0.12 }, 1.8)
        .from('.site-hero__content .eyebrow, .site-hero__ctas, .hero__foot', { opacity: 0, y: 20, duration: 1.2, stagger: 0.12 }, 2.1);
    };
  }

  /* ---------- animações de rolagem ---------- */
  function scrollFx() {
    $$('.split-lines').forEach((el) => gsap.from($$('.line > span', el), { yPercent: 110, duration: 1.4, ease: 'power4.out', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 85%' } }));
    $$('.reveal-up, .note').forEach((el) => gsap.from(el, { y: 30, opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

    // manifesto acende palavra por palavra
    const words = $$('.mw', man);
    ScrollTrigger.create({ trigger: man, start: 'top 75%', end: 'bottom 45%', scrub: true,
      onUpdate: (s) => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => { w.style.opacity = i < n ? 1 : 0.14; }); } });
    gsap.from('.manifesto__sign', { y: 30, opacity: 0, duration: 1.2, scrollTrigger: { trigger: '.manifesto__sign', start: 'top 90%' } });

    // cartões de propósito com parallax interno
    $$('.pcard').forEach((c, i) => {
      gsap.from(c, { y: 80, opacity: 0, duration: 1.4, ease: 'power3.out', delay: i * 0.1, scrollTrigger: { trigger: c, start: 'top 88%' } });
      gsap.fromTo($('img', c), { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // empreendimento: segunda imagem cobre a primeira ao rolar
    gsap.to('.project__frame--b', { clipPath: 'inset(0% 0 0 0)', ease: 'none', scrollTrigger: { trigger: '.project', start: 'top top', end: 'bottom bottom', scrub: true } });
    $$('.project__frame img').forEach((img) => gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.project', start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.from('.project__list li', { x: 30, opacity: 0, stagger: 0.08, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.project__list', start: 'top 85%' } });

    gsap.from('.dif', { y: 50, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.difs', start: 'top 85%' } });

    // pavilhão: a imagem se abre até ocupar a tela
    const pav = gsap.timeline({ scrollTrigger: { trigger: '.pavilion', start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
    pav.to('#pavImg', { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 0.6 }, 0)
      .to('#pavImg img', { scale: 1, ease: 'none', duration: 0.6 }, 0)
      .to('.pavilion__shade', { opacity: 1, duration: 0.25 }, 0.45)
      .to('.pavilion__text', { opacity: 1, duration: 0.25 }, 0.55);

    // frase-assinatura
    gsap.fromTo('.statement__text', { letterSpacing: '0.06em' }, { letterSpacing: '0.01em', ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.city__facts li', { y: 30, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.city__facts', start: 'top 90%' } });

    // jornada: linha se desenha e acende as etapas
    const steps = $$('.step');
    gsap.from(steps, { y: 40, opacity: 0, stagger: 0.12, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '#steps', start: 'top 85%' } });
    ScrollTrigger.create({ trigger: '#steps', start: 'top 80%', end: 'bottom 50%', scrub: true,
      onUpdate: (s) => { $('#stepsLine').style.transform = `scaleX(${s.progress})`; steps.forEach((el, i) => el.classList.toggle('is-on', s.progress >= i / steps.length)); } });

    gsap.from('.site-footer__brand', { y: 60, opacity: 0, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: '.site-footer', start: 'top 85%' } });
  }

  /* ---------- padrões BR20 de apoio ---------- */
  function patterns() {
    const fine = { fine: true, textured: true, density: 1.4 };
    BR20.animate($('#manifestoPattern'), Object.assign({ color: '#C99073', alpha: 0.42, seed: 44, speed: 0.3, width: 0.7, interactive: true, host: $('#sobre'), force: 28, radius: 120, align: { ax: 1, ay: 0.5, scale: 0.95 } }, fine));
    BR20.animate($('#valuesPattern'), Object.assign({ color: '#A6533C', alpha: 0.5, seed: 8, speed: 0.3, width: 0.7, interactive: true, host: $('.values-band'), force: 28, align: { ax: 1, ay: 0.3 } }, fine));
    BR20.animate($('#statementPattern'), Object.assign({ color: '#F2EBDD', alpha: 0.38, seed: 12, speed: 0.3, width: 0.7, interactive: true, host: $('.statement'), force: 30, align: { ax: 0.5, ay: 0.5, scale: 1.1 }, fade: { x: 0.5, y: 0.5, r: 0.38, soft: 0.5 } }, fine));
    BR20.animate($('#footerPattern'), Object.assign({ color: '#B6A078', alpha: 0.32, seed: 20, speed: 0.25, width: 0.7, align: { ax: 1, ay: 0.5, scale: 1.1 } }, fine));
    cityPlan();
  }

  /* ---------- Boa Vista: traçado radial desenhado com a rolagem ---------- */
  function cityPlan() {
    const c = $('#cityPlan'), g = c.getContext('2d');
    const st = { p: 0 };
    let w = 0, h = 0, dpr = 1;
    function size() {
      const r = c.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr; draw();
    }
    function draw() {
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      // centro do leque junto à margem do rio, à direita da seção
      const cx = w * 0.98, cy = h * 0.55, R = Math.max(w, h) * 0.95, p = st.p;
      g.lineCap = 'round';
      // rio
      g.strokeStyle = 'rgba(201,144,115,.55)'; g.lineWidth = 1.2;
      g.beginPath();
      for (let i = 0; i <= 60 * p; i++) { const t = i / 60, y = h * (t * 1.1 - 0.05); const x = cx + 26 + Math.sin(t * 5) * 18; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      // avenidas radiais (leque para oeste)
      g.strokeStyle = 'rgba(182,160,120,.42)'; g.lineWidth = 0.8;
      const rays = 15, a0 = Math.PI * 0.62, a1 = Math.PI * 1.38;
      for (let i = 0; i < rays; i++) {
        const a = a0 + (a1 - a0) * (i / (rays - 1));
        const len = R * Math.min(1, Math.max(0, p * 1.4 - i * 0.02));
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); g.stroke();
      }
      // anéis concêntricos
      g.setLineDash([2, 5]);
      for (let k = 1; k <= 9; k++) {
        const rr = (R / 9) * k, e = Math.min(1, Math.max(0, p * 1.6 - k * 0.08));
        if (!e) continue;
        g.strokeStyle = `rgba(242,235,221,${0.1 + (k % 3 === 0 ? 0.12 : 0)})`;
        g.beginPath(); g.arc(cx, cy, rr, a0, a0 + (a1 - a0) * e); g.stroke();
      }
      g.setLineDash([]);
      // centro cívico
      g.fillStyle = 'rgba(201,144,115,.9)'; g.beginPath(); g.arc(cx, cy, 4 * Math.min(1, p * 3), 0, Math.PI * 2); g.fill();
    }
    window.addEventListener('resize', size); size();
    gsap.to(st, { p: 1, ease: 'none', onUpdate: draw, scrollTrigger: { trigger: '#boavista', start: 'top 75%', end: 'bottom 40%', scrub: 1 } });
  }

  /* ---------- formulário → WhatsApp ---------- */
  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target, status = $('#formStatus');
    const req = [$('#fName'), $('#fPhone')];
    let ok = true;
    req.forEach((i) => { const bad = !i.value.trim(); i.parentElement.classList.toggle('is-error', bad); if (bad) ok = false; });
    if (!ok) { status.textContent = 'Preencha nome e telefone para continuar.'; return; }
    const d = new FormData(f);
    const msg = `Olá, AVRA! Meu nome é ${d.get('nome')}.\nInteresse: ${d.get('interesse')}\nTelefone: ${d.get('telefone')}` + (d.get('email') ? `\nE-mail: ${d.get('email')}` : '') + (d.get('mensagem') ? `\n\n${d.get('mensagem')}` : '');
    const url = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(msg)}`;
    status.textContent = 'Abrindo o WhatsApp com sua mensagem…';
    window.open(url, '_blank', 'noopener');
  });

  /* ---------- loader e início ---------- */
  function start() {
    const intro = hero();
    scrollFx(); patterns();
    ScrollTrigger.refresh();
    const loader = $('#loader');
    gsap.timeline({ onComplete: () => {
      loader.classList.add('is-done'); document.body.classList.remove('is-loading');
      if (lenis) lenis.start();
      setTimeout(() => { loader.style.display = 'none'; }, 1300);
      intro();
    } })
      .to('#loaderPath', { strokeDashoffset: 0, duration: reduce ? 0.1 : 1.6, ease: 'power2.inOut' })
      .to('#loaderBar', { scaleX: 1, duration: reduce ? 0.1 : 1.8, ease: 'power1.inOut' }, 0)
      .to('#loaderPath', { fill: '#F2EBDD', strokeOpacity: 0, duration: 0.5 }, '-=0.3')
      .to('.loader__desc', { opacity: 0.85, letterSpacing: '0.62em', duration: 0.7 }, '-=0.35');
  }
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fonts, new Promise((r) => setTimeout(r, 2500))]).then(start);
})();
