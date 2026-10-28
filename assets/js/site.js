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
  // layout mudou (foto removida ou carregada): recalcula os gatilhos de rolagem
  let rt; const refreshSoon = () => { clearTimeout(rt); rt = setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 200); };
  window.addEventListener('load', refreshSoon);
  // fotos externas (Wikimedia Commons): se não carregarem, usa a imagem local
  $$('img[data-fallback]').forEach((img) => {
    const fb = () => {
      if (img.dataset.fallback === 'hide') { const f = img.closest('figure'); if (f) f.hidden = true; refreshSoon(); return; }
      if (img.dataset.fallback && img.src.indexOf(img.dataset.fallback) < 0) {
        img.src = img.dataset.fallback; img.classList.add('is-fallback');
        if (img.closest('.site-hero')) { const c = $('.hero__credit'); if (c) c.hidden = true; }
      }
    };
    img.addEventListener('error', fb, { once: true });
    if (img.complete && img.naturalWidth === 0 && img.src) fb();
  });
  $$('[data-interest]').forEach((a) => a.addEventListener('click', () => { const sel = $('#fInterest'); if (sel) sel.value = a.dataset.interest; }));
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

    gsap.from('.dif', { y: 50, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.difs', start: 'top 85%' } });


    // frase-assinatura
    gsap.fromTo('.statement__text', { letterSpacing: '0.06em' }, { letterSpacing: '0.01em', ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.facts > div', { y: 30, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.facts', start: 'top 90%' } });
    $$('.city__photos figure').forEach((f, i) => {
      gsap.from(f, { y: 60, opacity: 0, duration: 1.4, delay: i * 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.city__photos', start: 'top 88%' } });
      gsap.fromTo($('img', f), { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.fromTo('.city__map img', { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.city__map', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Alta Vista
    gsap.fromTo('.av__intro-bg img', { scale: 1.2, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.av__intro', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.av__pillars article', { y: 50, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.av__pillars', start: 'top 85%' } });
    gsap.from('.av__checks li', { x: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.av__checks', start: 'top 85%' } });
    gsap.from('.tl li', { y: 30, opacity: 0, stagger: 0.1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.tl', start: 'top 88%' } });

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
    masterplan();
  }

  /* ---------- Alta Vista: implantação ilustrativa ---------- */
  function masterplan() {
    const svg = $('#masterplan'), NS = 'http://www.w3.org/2000/svg';
    const el = (t, a, parent) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); (parent || svg).appendChild(e); return e; };
    const ZONES = {
      lotes: ['Lotes residenciais', 'Terrenos voltados para ruas internas tranquilas, com espaço para jardim e recuos generosos.'],
      verde: ['Áreas verdes', 'Faixas de vegetação preservada e arborização que sombreiam as ruas e mantêm o microclima mais fresco.'],
      lazer: ['Lazer e convivência', 'Espaço central de encontro, a poucos passos de qualquer lote, para crianças, esporte e convivência.'],
      avenida: ['Avenida principal', 'Eixo arborizado que organiza o bairro e distribui o trânsito, deixando as ruas internas mais calmas.'],
      portaria: ['Portaria', 'Acesso único e controlado, para a segurança e a tranquilidade de quem mora.']
    };
    const g = { verde: el('g', { 'data-zone': 'verde' }), avenida: el('g', { 'data-zone': 'avenida' }), lotes: el('g', { 'data-zone': 'lotes' }), lazer: el('g', { 'data-zone': 'lazer' }), portaria: el('g', { 'data-zone': 'portaria' }) };
    // perímetro e áreas verdes
    el('path', { d: 'M40 120 C120 40 300 30 420 50 C560 70 700 40 770 110 L760 560 C600 600 300 600 60 570 Z', class: 'mp-site' }, g.verde);
    el('path', { d: 'M40 120 C90 220 70 380 60 570 L130 572 C150 420 150 260 120 140 Z', class: 'mp-green' }, g.verde);
    el('path', { d: 'M640 60 C700 50 760 80 770 110 L765 260 C720 230 680 160 640 60 Z', class: 'mp-green' }, g.verde);
    for (let i = 0; i < 46; i++) { const x = 150 + Math.random() * 600, y = 70 + Math.random() * 500; if (Math.hypot(x - 430, y - 330) < 90) continue; el('circle', { cx: x, cy: y, r: 3 + Math.random() * 4, class: 'mp-tree' }, g.verde); }
    // avenida central em curva (até a portaria, embaixo)
    el('path', { d: 'M430 600 C430 520 430 460 430 420 C430 330 330 250 260 120', class: 'mp-road mp-road--main' }, g.avenida);
    el('path', { d: 'M430 420 C520 360 620 300 740 300', class: 'mp-road mp-road--main' }, g.avenida);
    // ruas internas
    ['M160 200 C260 190 360 200 470 180 C560 170 640 160 720 170', 'M160 300 C230 290 300 300 350 310', 'M520 400 C600 390 680 400 740 410', 'M160 420 C230 420 300 430 360 450', 'M160 510 C250 510 330 520 400 540', 'M480 520 C560 500 650 500 740 500'].forEach((d) => el('path', { d, class: 'mp-road' }, g.avenida));
    // lotes ao longo das ruas
    const rows = [[165, 150, 14], [165, 225, 10], [165, 255, 5], [165, 335, 5], [520, 330, 6], [165, 375, 5], [165, 450, 6], [520, 430, 6], [165, 470, 6], [490, 455, 7], [490, 530, 7], [165, 540, 6], [510, 190, 6], [500, 115, 6]];
    rows.forEach(([x, y, n]) => { for (let k = 0; k < n; k++) el('rect', { x: x + k * 32, y, width: 28, height: 34, rx: 2, class: 'mp-lot' }, g.lotes); });
    // lazer
    el('circle', { cx: 430, cy: 330, r: 62, class: 'mp-leisure' }, g.lazer);
    el('circle', { cx: 430, cy: 330, r: 26, class: 'mp-leisure-core' }, g.lazer);
    // portaria
    el('rect', { x: 400, y: 572, width: 60, height: 22, rx: 3, class: 'mp-gate' }, g.portaria);
    el('text', { x: 430, y: 614, class: 'mp-label', 'text-anchor': 'middle' }, g.portaria).textContent = 'ACESSO';
    el('text', { x: 780, y: 40, class: 'mp-label', 'text-anchor': 'end' }, svg).textContent = 'N ↑';

    const name = $('#zoneName'), text = $('#zoneText');
    const set = (z) => {
      svg.dataset.active = z;
      name.textContent = ZONES[z][0]; text.textContent = ZONES[z][1];
      $$('#zoneLegend li').forEach((li) => li.classList.toggle('is-on', li.dataset.zone === z));
    };
    Object.keys(g).forEach((z) => { g[z].addEventListener('pointerenter', () => set(z)); });
    $$('#zoneLegend li').forEach((li) => { li.addEventListener('pointerenter', () => set(li.dataset.zone)); li.addEventListener('click', () => set(li.dataset.zone)); });
    set('lotes');
    // desenho de entrada
    const paths = $$('.mp-road', svg);
    paths.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 80%' } });
    tl.to(paths, { strokeDashoffset: 0, duration: 1.6, stagger: 0.08, ease: 'power2.inOut' })
      .from($$('.mp-lot', svg), { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.5, stagger: 0.004 }, 0.6)
      .from($$('.mp-tree, .mp-green', svg), { opacity: 0, duration: 0.8, stagger: 0.01 }, 0.4)
      .from($$('.mp-leisure, .mp-leisure-core, .mp-gate', svg), { scale: 0, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(1.6)' }, 1.2);
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
