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

  $$('.js-logo path, .js-logo-path').forEach((p) => { p.setAttribute('d', AVRA_LOGO.d); p.setAttribute('fill-rule', 'evenodd'); });
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
    window.__avraLenis = lenis;
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
    const heroEl = $('#hero'), logo = $('#heroLogo'), sheen = $('#heroSheen');
    const m = { x: 0.5, y: 0.45 }, c = { x: 0.5, y: 0.45 };
    let t0 = performance.now(), moved = false;
    heroEl.addEventListener('pointermove', (e) => {
      const r = heroEl.getBoundingClientRect();
      m.x = (e.clientX - r.left) / r.width; m.y = (e.clientY - r.top) / r.height; moved = true;
    });
    heroEl.addEventListener('pointerleave', () => { moved = false; });
    gsap.ticker.add(() => {
      const t = (performance.now() - t0) / 1000;
      // sem cursor, a luz passeia devagar sozinha
      const tx = moved ? m.x : 0.5 + Math.sin(t * 0.18) * 0.28, ty = moved ? m.y : 0.42 + Math.cos(t * 0.13) * 0.16;
      c.x += (tx - c.x) * 0.045; c.y += (ty - c.y) * 0.045;
      heroEl.style.setProperty('--lx', (c.x * 100).toFixed(2) + '%');
      heroEl.style.setProperty('--ly', (c.y * 100).toFixed(2) + '%');
      // brilho percorre a assinatura e ela inclina levemente para a luz
      const lr = logo.getBoundingClientRect(), hr = heroEl.getBoundingClientRect();
      const px = (c.x * hr.width - (lr.left - hr.left)) / lr.width, py = (c.y * hr.height - (lr.top - hr.top)) / lr.height;
      sheen.setAttribute('cx', (30 + px * 3441).toFixed(0)); sheen.setAttribute('cy', (36 + py * 558).toFixed(0));
      logo.style.transform = `perspective(1400px) rotateY(${((c.x - 0.5) * 6).toFixed(2)}deg) rotateX(${((0.5 - c.y) * 4).toFixed(2)}deg)`;
    });
    gsap.to('.site-hero__content', { y: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: heroEl, start: '25% top', end: '75% top', scrub: true } });
    return () => {
      gsap.timeline()
        .from('.site-hero__bg', { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0)
        .fromTo('#heroLogo', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.8, ease: 'power3.inOut' }, 0.2)
        .from('.site-hero__desc', { opacity: 0, letterSpacing: '0.3em', duration: 1.6, ease: 'power3.out' }, 1.2)
        .from('.site-hero__row', { opacity: 0, y: 16, duration: 1.2 }, 1.5);
    };
  }

  /* ---------- mapa de localização ---------- */
  function locmap() {
    const view = $('#locView'), stage = $('#locStage'), route = $('#locRoute');
    const INFO = [
      ['Centro de Boa Vista', 'A capital, na margem oeste do Rio Branco. O ponto de partida do caminho até o Alta Vista.'],
      ['Rio Branco', 'O principal rio de Roraima. O Alta Vista fica na margem oposta à cidade.'],
      ['Ponte dos Macuxis', 'A travessia do Rio Branco pela BR-401, ligando Boa Vista ao município do Cantá.'],
      ['BR-401', 'Rodovia federal que segue para o leste. O acesso ao condomínio fica no km 5.'],
      ['Igarapé Santa Cecília', 'Curso d’água ao norte do terreno. A mata ciliar fica preservada como área comum.'],
      ['Residencial Alta Vista', '47 hectares na BR-401, km 5, Cantá – RR. Logo depois da ponte, do outro lado do Rio Branco.']
    ];
    const pins = $$('.lp', stage), name = $('#locName'), text = $('#locText');
    const z = { s: 1, x: 0, y: 0 };
    const apply = (anim) => gsap.to(stage, { scale: z.s, x: z.x, y: z.y, duration: anim ? 1.2 : 0, ease: 'power3.inOut', transformOrigin: '0 0' });
    const clamp = () => {
      const w = view.clientWidth, h = view.clientHeight;
      z.x = Math.min(0, Math.max(w - w * z.s, z.x)); z.y = Math.min(0, Math.max(h - h * z.s, z.y));
    };
    const focus = (px, py, s) => {         // px/py em %
      const w = view.clientWidth, h = view.clientHeight;
      z.s = s; z.x = w / 2 - (px / 100) * w * s; z.y = h / 2 - (py / 100) * h * s; clamp(); apply(true);
    };
    const select = (k, zoom) => {
      pins.forEach((p, i) => p.classList.toggle('is-on', i === k));
      name.textContent = INFO[k][0]; text.textContent = INFO[k][1];
      if (zoom) focus(parseFloat(pins[k].style.left), parseFloat(pins[k].style.top), 1.9);
    };
    pins.forEach((p, k) => { p.addEventListener('click', () => select(k, true)); p.addEventListener('pointerenter', () => select(k, false)); });
    select(5, false);
    $('#locIn').addEventListener('click', () => { const w = view.clientWidth, h = view.clientHeight; const cx = (w / 2 - z.x) / z.s / w * 100, cy = (h / 2 - z.y) / z.s / h * 100; focus(cx, cy, Math.min(3, z.s * 1.4)); });
    $('#locOut').addEventListener('click', () => { const w = view.clientWidth, h = view.clientHeight; const cx = (w / 2 - z.x) / z.s / w * 100, cy = (h / 2 - z.y) / z.s / h * 100; focus(cx, cy, Math.max(1, z.s / 1.4)); });
    $('#locReset').addEventListener('click', () => { z.s = 1; z.x = 0; z.y = 0; apply(true); });
    // arrastar para mover
    let d = null;
    view.addEventListener('pointerdown', (e) => { if (e.target.closest('.lp')) return; d = { x: e.clientX, y: e.clientY, ox: z.x, oy: z.y }; view.setPointerCapture(e.pointerId); });
    view.addEventListener('pointermove', (e) => { if (!d) return; z.x = d.ox + e.clientX - d.x; z.y = d.oy + e.clientY - d.y; clamp(); apply(false); });
    view.addEventListener('pointerup', () => { d = null; });
    // o caminho se desenha ao entrar na tela e pelo link do texto
    const L = route.getTotalLength();
    route.style.strokeDasharray = L; route.style.strokeDashoffset = L;
    const draw = () => gsap.fromTo(route, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 3, ease: 'power2.inOut' });
    ScrollTrigger.create({ trigger: view, start: 'top 70%', once: true, onEnter: () => { draw(); setTimeout(() => select(5, true), 2600); } });
    $('#locPlay').addEventListener('click', (e) => { e.preventDefault(); go(view); setTimeout(() => { z.s = 1; z.x = 0; z.y = 0; apply(true); draw(); setTimeout(() => select(5, true), 2600); }, 900); });
    window.addEventListener('resize', () => { clamp(); apply(false); });
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

    // empreendimento: segunda imagem cobre a primeira ao rolar



    // frase-assinatura
    gsap.fromTo('.statement__text', { letterSpacing: '0.06em' }, { letterSpacing: '0.01em', ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.facts > div', { y: 30, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.facts', start: 'top 90%' } });

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
    BR20.animate($('#statementPattern'), Object.assign({ color: '#F2EBDD', alpha: 0.38, seed: 12, speed: 0.3, width: 0.7, interactive: true, host: $('.statement'), force: 30, align: { ax: 0.5, ay: 0.5, scale: 1.1 }, fade: { x: 0.5, y: 0.5, r: 0.38, soft: 0.5 } }, fine));
    BR20.animate($('#footerPattern'), Object.assign({ color: '#B6A078', alpha: 0.32, seed: 20, speed: 0.25, width: 0.7, align: { ax: 1, ay: 0.5, scale: 1.1 } }, fine));
    masterplan();
    locmap();
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
    // maquete 3D em bloco próprio, carregada quando chega perto da tela
    const view3d = $('#plan3d');
    const io3 = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting || p3Loading) return;
      io3.disconnect();
      p3Loading = window.AVRAPlan3D.init({ canvas: $('#plan3dCanvas'), host: view3d, labels: $('#plan3dLabels'), image: $('#planImg').getAttribute('src'), spots: SPOTS, onSpot: (k) => set(k) })
        .then((api) => { p3 = api; $('#plan3dLoading').hidden = true; api.resize(); set(+num.textContent - 1); })
        .catch(() => { $('#plan3dLoading').textContent = 'Não foi possível carregar a maquete 3D neste navegador.'; });
    }, { rootMargin: '400px' });
    io3.observe(view3d);
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
  // cada parte roda isolada: se uma falhar num navegador, o resto do site continua
  const safe = (name, fn) => { try { return fn(); } catch (e) { console.error('[AVRA] ' + name, e); return null; } };
  let opened = false;
  function openPage(intro) {
    if (opened) return; opened = true;
    const loader = $('#loader');
    loader.classList.add('is-done'); document.body.classList.remove('is-loading');
    if (lenis) lenis.start();
    setTimeout(() => { loader.style.display = 'none'; }, 1300);
    if (intro) safe('intro', intro);
  }
  function start() {
    const intro = safe('hero', hero);
    safe('scroll', scrollFx); safe('patterns', patterns);
    safe('refresh', () => ScrollTrigger.refresh());
    safe('loader', () => gsap.timeline({ onComplete: () => openPage(intro) })
      .to('#loaderPath', { strokeDashoffset: 0, duration: reduce ? 0.1 : 1.6, ease: 'power2.inOut' })
      .to('#loaderBar', { scaleX: 1, duration: reduce ? 0.1 : 1.8, ease: 'power1.inOut' }, 0)
      .to('#loaderPath', { fill: '#F2EBDD', strokeOpacity: 0, duration: 0.5 }, '-=0.3')
      .to('.loader__desc', { opacity: 0.85, letterSpacing: '0.62em', duration: 0.7 }, '-=0.35'));
    setTimeout(() => openPage(intro), 3500);   // nunca fica preso no carregamento
  }
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fonts, new Promise((r) => setTimeout(r, 2500))]).then(start, start);
})();
