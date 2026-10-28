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
    const heroEl = $('#hero');
    // um único movimento: a foto se afasta devagar com a rolagem
    gsap.to('.site-hero__photo img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.site-hero__content', { y: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: heroEl, start: '20% top', end: '70% top', scrub: true } });
    return () => {
      gsap.timeline()
        .fromTo('.site-hero__photo img', { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.4, ease: 'power2.out' }, 0)
        .from('.hero__title .w', { yPercent: 110, duration: 1.5, ease: 'power4.out', stagger: 0.12 }, 0.5)
        .from('.site-hero__content .eyebrow, .site-hero__row', { opacity: 0, y: 16, duration: 1.2, stagger: 0.15 }, 1);
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

  /* ---------- Alta Vista: planta real com pontos interativos ---------- */
  function masterplan() {
    // posições em % sobre a planta de implantação
    const SPOTS = [
      [13, 86, 'Portaria e acesso', 'Portaria social, portaria de serviço e administração com vestiário, na entrada pela Avenida de Acesso Social. Acesso controlado e estacionamento para visitantes.'],
      [25, 89, 'Espaço gourmet e lago', 'Espaço gourmet à beira de um dos dois lagos, com playground e estacionamento próprio, logo na chegada ao condomínio.'],
      [21, 34, 'Avenida das Flores', 'O eixo de entrada: uma avenida com canteiro central arborizado que distribui o trânsito e deixa as alamedas internas mais tranquilas.'],
      [15, 61, 'Clube oeste', 'Três quadras de tênis, espaço fitness, churrasqueira com vestiário, playground e estação de ginástica, numa faixa verde ao longo da avenida.'],
      [50, 14, 'Clube norte', 'Dois campos de futebol, quadra poliesportiva, churrasqueira com vestiário e playground, junto à mata do igarapé.'],
      [80, 6, 'Mata nativa e Igarapé Santa Cecília', 'Ao norte, a mata nativa às margens do igarapé fica preservada como área comum do condomínio.'],
      [52, 50, '21 quadras, 471 lotes', 'Lotes organizados em quadras curvas, voltados para alamedas arborizadas com nomes de flores. Área média em torno de 490 m² por lote.'],
      [84, 49, 'Pista de cooper e estares', 'Uma pista de cooper contorna o bairro, com 21 espaços de estar e estações de ginástica ao longo do caminho.']
    ];
    const box = $('#hotspots'), list = $('#zoneLegend');
    const num = $('#zoneNum'), name = $('#zoneName'), text = $('#zoneText');
    const set = (k) => {
      const sp = SPOTS[k];
      num.textContent = String(k + 1).padStart(2, '0'); name.textContent = sp[2]; text.textContent = sp[3];
      $$('.spot', box).forEach((b, i) => b.classList.toggle('is-on', i === k));
      $$('li', list).forEach((li, i) => li.classList.toggle('is-on', i === k));
      if (p3) p3.setActive(k);
    };
    let p3 = null, p3Loading = null;
    // abas: planta técnica × maquete 3D
    const view3d = $('#plan3d'), map2d = $('.av__map');
    $$('.av__tabs button').forEach((tab) => tab.addEventListener('click', () => {
      const is3d = tab.dataset.view === '3d';
      $$('.av__tabs button').forEach((t) => { t.classList.toggle('is-on', t === tab); t.setAttribute('aria-selected', t === tab); });
      view3d.hidden = !is3d; map2d.hidden = is3d;
      if (is3d && !p3Loading) {
        p3Loading = window.AVRAPlan3D.init({ canvas: $('#plan3dCanvas'), host: view3d, labels: $('#plan3dLabels'), image: $('#planImg').getAttribute('src'), spots: SPOTS, onSpot: (k) => set(k) })
          .then((api) => { p3 = api; $('#plan3dLoading').hidden = true; api.resize(); set(+num.textContent - 1); })
          .catch(() => { $('#plan3dLoading').textContent = 'Não foi possível carregar a maquete 3D neste navegador.'; });
      } else if (is3d && p3) p3.resize();
    }));
    $('#plan3dTop').addEventListener('click', () => p3 && p3.top());
    SPOTS.forEach((sp, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'spot'; b.style.left = sp[0] + '%'; b.style.top = sp[1] + '%';
      b.setAttribute('aria-label', sp[2]); b.innerHTML = `<span>${k + 1}</span>`;
      b.addEventListener('click', () => set(k)); b.addEventListener('pointerenter', () => set(k));
      box.appendChild(b);
      const li = document.createElement('li');
      li.innerHTML = `<b>${String(k + 1).padStart(2, '0')}</b>${sp[2]}`;
      li.addEventListener('click', () => set(k)); li.addEventListener('pointerenter', () => set(k));
      list.appendChild(li);
    });
    set(0);
    $$('.spot', box).forEach((b, i) => b.style.setProperty('--d', (i * 0.08) + 's'));
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { box.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(box);
    gsap.fromTo('#planImg', { scale: 1.08, filter: 'saturate(.6)' }, { scale: 1, filter: 'saturate(1)', ease: 'none', scrollTrigger: { trigger: '.av__map', start: 'top bottom', end: 'center center', scrub: true } });

    // planta ampliada
    const lb = $('#lightbox');
    $('#planZoom').addEventListener('click', () => { $('img', lb).src = $('#planImg').src; lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); if (lenis) lenis.stop(); });
    const close = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); if (lenis) lenis.start(); };
    $('.lightbox__close', lb).addEventListener('click', close);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    // números contam ao aparecer
    $$('.av__numbers dt').forEach((dt) => {
      const end = parseFloat(dt.dataset.count), dec = +(dt.dataset.dec || 0), pre = dt.dataset.prefix || '';
      const small = $('small', dt) ? $('small', dt).outerHTML : '';
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: dt, start: 'top 88%' },
        onUpdate: () => { dt.innerHTML = pre + o.v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + small; } });
    });
    gsap.from('.amen li', { y: 30, opacity: 0, stagger: 0.05, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.amen', start: 'top 85%' } });
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
