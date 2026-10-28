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

  /* ---------- mapa de localização (vetorial, traçado a partir da planta de localização) ---------- */
  function locmap() {
    const svg = $('#locSvg'), view = $('#locView'), road = $('#lmRoad');
    const INFO = [
      ['Centro de Boa Vista', 'A capital, na margem oeste do Rio Branco. O ponto de partida do caminho até o Alta Vista.'],
      ['Ponte dos Macuxis', 'A travessia do Rio Branco pela BR-401, ligando Boa Vista ao município do Cantá.'],
      ['BR-401, km 5', 'Do km 5 da rodovia sai a via de acesso ao condomínio.'],
      ['Igarapé Santa Cecília', 'Curso d’água ao norte do terreno. A mata ciliar fica preservada como área comum.'],
      ['Residencial Alta Vista', '47 hectares na BR-401, km 5, Cantá – RR. Logo depois da ponte, do outro lado do Rio Branco.']
    ];
    const FULL = { x: 0, y: 0, w: 1503, h: 1107 };
    const vb = Object.assign({}, FULL);
    const setVB = () => { svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); svg.style.setProperty('--z', (FULL.w / vb.w).toFixed(3)); };
    const clamp = () => { vb.x = Math.max(0, Math.min(FULL.w - vb.w, vb.x)); vb.y = Math.max(0, Math.min(FULL.h - vb.h, vb.y)); };
    const zoomTo = (cx, cy, z, dur) => {
      const w = FULL.w / z, h = FULL.h / z;
      const t = { x: cx - w / 2, y: cy - h / 2, w, h };
      t.x = Math.max(0, Math.min(FULL.w - w, t.x)); t.y = Math.max(0, Math.min(FULL.h - h, t.y));
      gsap.to(vb, Object.assign(t, { duration: dur == null ? 1.2 : dur, ease: 'power3.inOut', onUpdate: setVB }));
    };
    const pins = $$('.lm-pin', svg), name = $('#locName'), text = $('#locText');
    const posOf = (g) => { const m = /translate\(([\d.]+) ([\d.]+)\)/.exec(g.getAttribute('transform')); return [+m[1], +m[2]]; };
    const select = (k, zoom) => {
      pins.forEach((p, i) => p.classList.toggle('is-on', i === k));
      name.textContent = INFO[k][0]; text.textContent = INFO[k][1];
      if (zoom) { const [x, y] = posOf(pins[k]); zoomTo(x, y, 2); }
    };
    pins.forEach((p, k) => { p.addEventListener('click', () => select(k, true)); p.addEventListener('pointerenter', () => select(k, false)); });
    select(4, false); setVB();
    const center = () => [vb.x + vb.w / 2, vb.y + vb.h / 2];
    $('#locIn').addEventListener('click', () => { const [x, y] = center(); zoomTo(x, y, Math.min(3.2, FULL.w / vb.w * 1.4)); });
    $('#locOut').addEventListener('click', () => { const [x, y] = center(); zoomTo(x, y, Math.max(1, FULL.w / vb.w / 1.4)); });
    $('#locReset').addEventListener('click', () => zoomTo(FULL.w / 2, FULL.h / 2, 1));
    let d = null;
    view.addEventListener('pointerdown', (e) => { if (e.target.closest('.lm-pin')) return; d = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y }; view.setPointerCapture(e.pointerId); });
    view.addEventListener('pointermove', (e) => {
      if (!d) return;
      const k = vb.w / view.clientWidth;
      vb.x = d.vx - (e.clientX - d.x) * k; vb.y = d.vy - (e.clientY - d.y) * k; clamp(); setVB();
    });
    view.addEventListener('pointerup', () => { d = null; });
    // o caminho de Boa Vista ao Alta Vista se desenha pela rodovia
    const L = road.getTotalLength();
    road.style.strokeDasharray = L; road.style.strokeDashoffset = L;
    const draw = () => gsap.fromTo(road, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 3, ease: 'power2.inOut' });
    ScrollTrigger.create({ trigger: view, start: 'top 75%', once: true, onEnter: draw });
    $('#locPlay').addEventListener('click', (e) => { e.preventDefault(); go(view); setTimeout(() => { zoomTo(FULL.w / 2, FULL.h / 2, 1, 0.6); draw(); setTimeout(() => select(4, true), 2700); }, 900); });
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
    const ST = { disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido' };
    let p3 = null, status = {}, current = null;
    const fmt = (n) => n.toLocaleString('pt-BR');
    const tip = $('#lotTip');

    // situação dos lotes: mantida pelo painel /admin em data/lotes.json
    const load = fetch('data/lotes.json?v=' + Date.now(), { cache: 'no-store' }).then((r) => r.ok ? r.json() : {}).catch(() => ({}));
    function counts() {
      const c = { disponivel: 0, reservado: 0, vendido: 0 };
      (window.AVRA_LOTES || []).forEach((l) => { c[status[l[0]] || 'disponivel']++; });
      $('#cntDisp').textContent = c.disponivel; $('#cntRes').textContent = c.reservado; $('#cntVen').textContent = c.vendido;
    }
    function show(u) {
      current = u;
      $('#lotEmpty').hidden = !!u; $('#lotInfo').hidden = !u;
      if (!u) return;
      const st = u.status || 'disponivel';
      $('#lotStatus').textContent = ST[st]; $('#lotStatus').className = 'lx__status is-' + st;
      $('#lotQ').textContent = String(u.q).padStart(2, '0'); $('#lotN').textContent = String(u.n).padStart(2, '0');
      $('#lotArea').textContent = '≈ ' + fmt(u.m2) + ' m²'; $('#lotId').textContent = u.id;
      const cta = $('#lotCta');
      cta.hidden = st === 'vendido';
      $('span', cta).textContent = st === 'reservado' ? 'Avise-me se for liberado' : 'Tenho interesse neste lote';
    }
    $('#lotCta').addEventListener('click', () => {
      if (!current) return;
      const sel = $('#fInterest'), label = `Lote ${current.id} (Quadra ${current.q}, Lote ${current.n}) – Residencial Alta Vista`;
      let opt = $$('option', sel).find((o) => o.dataset.lot);
      if (!opt) { opt = document.createElement('option'); opt.dataset.lot = '1'; sel.prepend(opt); }
      opt.textContent = label; sel.value = label;
      const msg = $('#fMsg'); if (msg && !msg.value) msg.value = `Gostaria de saber mais sobre o lote ${current.id}.`;
    });
    const view3d = $('#plan3d');
    const io3 = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting || p3) return;
      io3.disconnect();
      p3 = 'loading';
      window.AVRAPlan3D.init({
        canvas: $('#plan3dCanvas'), host: view3d, image: $('#planImg').getAttribute('src'),
        onSelect: (u) => { if (u) u.status = status[u.id] || 'disponivel'; show(u); },
        onHover: (u, e) => {
          if (!u || !e) { tip.hidden = true; return; }
          const r = view3d.getBoundingClientRect();
          tip.hidden = false; tip.innerHTML = `<b>${u.id}</b> · ${ST[status[u.id] || 'disponivel']}`;
          tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`;
        }
      }).then((api) => {
        p3 = api; $('#plan3dLoading').hidden = true; api.resize();
        load.then((d) => {
          status = (d && d.status) || {}; api.setStatus(status); counts();
          if (d && d.atualizado) $('#lotUpdated').textContent = 'Disponibilidade atualizada em ' + new Date(d.atualizado).toLocaleDateString('pt-BR');
        });
      }).catch(() => { $('#plan3dLoading').textContent = 'Não foi possível carregar a maquete 3D neste navegador.'; });
    }, { rootMargin: '400px' });
    io3.observe(view3d);
    load.then((d) => { status = (d && d.status) || {}; counts(); });
    const api = () => (p3 && p3 !== 'loading' ? p3 : null);
    $('#plan3dTop').addEventListener('click', () => api() && api().top());
    $('#p3In').addEventListener('click', () => api() && api().zoom(0.75));
    $('#p3Out').addEventListener('click', () => api() && api().zoom(1.33));
    $('#p3Reset').addEventListener('click', () => { if (api()) { api().reset(); api().select(null); } });
    $('#onlyAvail').addEventListener('change', (e) => api() && api().setOnlyAvailable(e.target.checked));
    $('.lx__stat[data-filter]').addEventListener('click', () => { const c = $('#onlyAvail'); c.checked = !c.checked; c.dispatchEvent(new Event('change')); });
    const find = () => {
      const v = $('#lotSearch').value.replace(/[^0-9]+/g, ' ').trim().split(' ');
      if (v.length < 2 || !api()) return;
      const id = String(+v[0]).padStart(2, '0') + '-' + String(+v[1]).padStart(2, '0');
      api().select(id, true);
    };
    $('#lotGo').addEventListener('click', find);
    $('#lotSearch').addEventListener('keydown', (e) => { if (e.key === 'Enter') find(); });

    // números contam ao aparecer
    $$('.av__numbers dt').forEach((dt) => {
      const end = parseFloat(dt.dataset.count), dec = +(dt.dataset.dec || 0), pre = dt.dataset.prefix || '';
      const small = $('small', dt) ? $('small', dt).outerHTML : '';
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: dt, start: 'top 88%' },
        onUpdate: () => { dt.innerHTML = pre + o.v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + small; } });
    });
    gsap.from('.life__card', { y: 40, opacity: 0, stagger: 0.12, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.life__grid', start: 'top 85%' } });
    $$('.life__bar i').forEach((b) => b.style.transform = 'scaleX(0)');
    ScrollTrigger.create({ trigger: '.life__bar', start: 'top 90%', once: true, onEnter: () => gsap.to('.life__bar i', { scaleX: 1, duration: 1.4, stagger: 0.12, ease: 'power3.out' }) });
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
