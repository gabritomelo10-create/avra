/* =========================================================
   AVRA — orquestração: loader, scroll suave, revelações,
   parallax, cursor, construção da assinatura e interações.
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const LOGO = window.AVRA_LOGO;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- assinatura em todos os SVGs ---------- */
  $$('.js-logo path').forEach((p) => p.setAttribute('d', LOGO.d));
  $('#loaderPath').setAttribute('d', LOGO.d);
  $('#bOutline').setAttribute('d', LOGO.d);
  $('#bFill').setAttribute('d', LOGO.d);
  $$('#bFill, .js-logo path').forEach((p) => p.setAttribute('fill-rule', 'evenodd'));

  /* ---------- scroll suave ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); const el = id.length > 1 && $(id);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.6 }); else el.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- divisão de texto ---------- */
  function splitLines(el) {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p) => `<span class="line"><span>${p.trim()}</span></span>`).join('');
  }
  function splitChars(el) {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p) => p.trim().split(' ').map((w) => `<span class="wd">${[...w].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`).join(' ')).join('<br>');
  }
  $$('.split-lines').forEach(splitLines);
  $$('.split-chars').forEach(splitChars);
  $$('.hero__title .split').forEach((el) => { el.innerHTML = `<span class="w">${el.textContent}</span>`; });

  /* ---------- revelações ---------- */
  function setupReveals() {
    $$('.split-lines').forEach((el) => {
      gsap.from($$('.line > span', el), { yPercent: 110, rotate: 2, duration: 1.3, ease: 'power4.out', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    $$('.split-chars').forEach((el) => {
      gsap.from($$('.ch', el), { yPercent: 60, opacity: 0, filter: 'blur(12px)', duration: 1.4, ease: 'power3.out', stagger: 0.035, scrollTrigger: { trigger: el, start: 'top 80%' } });
    });
    $$('.reveal-up').forEach((el) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('.pillar, .combo, .wrong, .rule, .fact').forEach((el, i) => {
      gsap.from(el, { y: 70, opacity: 0, rotateX: 12, duration: 1.3, ease: 'power3.out', delay: (i % 3) * 0.08, scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
    gsap.from('.swatch', { yPercent: 30, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '#swatches', start: 'top 80%' } });
    gsap.from('.index__list li', { x: -60, opacity: 0, duration: 1, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: '#indexList', start: 'top 80%' } });
  }

  /* ---------- parallax e zoom ---------- */
  function setupParallax() {
    $$('.parallax').forEach((el) => {
      const sp = parseFloat(el.dataset.speed || 0.2);
      gsap.fromTo(el, { yPercent: -sp * 40 }, { yPercent: sp * 40, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.zoom-on-scroll').forEach((el) => {
      gsap.fromTo(el, { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.chapter-cover__inner').forEach((el) => {
      gsap.to(el, { yPercent: -30, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'center center', end: 'bottom top', scrub: true } });
    });
    gsap.to('.photo__stack .ps--1', { y: -80, ease: 'none', scrollTrigger: { trigger: '#photoStack', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.photo__stack .ps--3', { y: 60, ease: 'none', scrollTrigger: { trigger: '#photoStack', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- UI: progresso, capítulo, topbar ---------- */
  function setupChrome() {
    const bar = $('#progressBar'), topbar = $('#topbar'), label = $('#chapterLabel');
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      topbar.classList.toggle('is-hidden', y > lastY && y > 300);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    $$('[data-chapter]').forEach((sec) => {
      ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => { if (s.isActive) label.textContent = sec.dataset.chapter; } });
    });
  }

  /* ---------- cursor ---------- */
  function setupCursor() {
    if (touch) return;
    const cur = $('#cursor'), dot = $('.cursor__dot', cur), ring = $('.cursor__ring', cur), lab = $('#cursorLabel');
    const p = { x: innerWidth / 2, y: innerHeight / 2 }, r = { x: p.x, y: p.y };
    window.addEventListener('pointermove', (e) => { p.x = e.clientX; p.y = e.clientY; });
    gsap.ticker.add(() => {
      r.x += (p.x - r.x) * 0.18; r.y += (p.y - r.y) * 0.18;
      dot.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${r.x}px, ${r.y}px) translate(-50%,-50%)`;
      let l = '';
      const b = document.body.classList;
      if (b.contains('hero-hover')) l = 'arraste';
      else if (b.contains('studio-hover')) l = 'clique';
      cur.classList.toggle('is-label', !!(l || cur.dataset.l));
      lab.textContent = l || cur.dataset.l || '';
    });
    const bind = (sel, label) => $$(sel).forEach((el) => {
      el.addEventListener('pointerenter', () => { label ? (cur.dataset.l = label) : cur.classList.add('is-hover'); });
      el.addEventListener('pointerleave', () => { delete cur.dataset.l; cur.classList.remove('is-hover'); });
    });
    bind('a, button, .chip, summary, input, .swatch, [contenteditable]');
    bind('.mock, .ring__item', 'ampliar');
    bind('#ring', 'arraste');
    bind('#patternStage', 'soprar');
  }

  /* ---------- tilt 3D com brilho ---------- */
  function setupTilt() {
    if (touch) return;
    $$('[data-tilt], #versionStage').forEach((el) => {
      const target = el.id === 'versionStage' ? $('#versionCard') : el;
      const light = $('.versions__light, .pillar__shine, .mock__glare, .sign__light', el);
      const max = el.classList.contains('mock') ? 6 : el.id === 'versionStage' ? 7 : 10;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        gsap.to(target, { rotateY: (x - 0.5) * max * 2, rotateX: (0.5 - y) * max * 2, duration: 0.6, ease: 'power3.out', transformPerspective: 1100 });
        if (light) { light.style.setProperty('--mx', x * 100 + '%'); light.style.setProperty('--my', y * 100 + '%'); light.style.opacity = 1; }
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(target, { rotateY: 0, rotateX: 0, duration: 1, ease: 'elastic.out(1, .6)' });
        if (light) light.style.opacity = '';
      });
    });
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.6, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.5)' }));
    });
  }

  /* ---------- HERO ---------- */
  function setupHero() {
    const st = window.AVRA3D && window.AVRA3D.initHero();
    const mouse = { x: 0, y: 0 };
    const hero = $('#hero');
    hero.addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
    const sm2 = { x: 0, y: 0 };
    gsap.ticker.add(() => { sm2.x += (mouse.x - sm2.x) * 0.03; sm2.y += (mouse.y - sm2.y) * 0.03; });
    BR20.animate($('#heroPatternFar'), { color: '#B6A078', alpha: 0.24, seed: 31, speed: 0.6, width: 1.1, align: { ax: 0.2, ay: 0.5, scale: 1.25 }, mirror: true, offsetX: () => sm2.x * -24, offsetY: () => sm2.y * -16 });
    BR20.animate($('#heroPatternNear'), { color: '#C99073', alpha: 0.42, seed: 20, speed: 1, width: 1.1, interactive: true, host: hero, radius: 110, force: 60, align: { ax: 0.85, ay: 0.4, scale: 1.05 }, offsetX: () => sm2.x * 30, offsetY: () => sm2.y * 22 });
    // luzes acompanham o cursor com atraso suave
    const sm = { x: 0, y: 0 };
    gsap.ticker.add(() => {
      sm.x += (mouse.x - sm.x) * 0.025; sm.y += (mouse.y - sm.y) * 0.025;
      gsap.set('.glow--a', { x: sm.x * 90, y: sm.y * 60 });
      gsap.set('.glow--b', { x: sm.x * -70, y: sm.y * -45 });
      gsap.set('.glow--c', { x: sm.x * 45, y: sm.y * -70 });
    });
    if (st) {
      ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => { st.scroll = s.progress; } });
    }
    gsap.to('.hero__descriptor', { opacity: 0, y: -60, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '40% top', scrub: true } });
    gsap.to('.hero__content, .credit-box', { y: -120, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '60% top', scrub: true } });
    return function intro() {
      const tl = gsap.timeline();
      if (st) tl.to(st, { reveal: 1, duration: 2.4, ease: 'power2.inOut' }, 0.1);
      else tl.to({}, { duration: 0.1 });
      tl.fromTo('.hero__descriptor', { opacity: 0, letterSpacing: '0.2em' }, { opacity: 0.9, letterSpacing: touch ? '0.5em' : '0.9em', duration: 2, ease: 'power3.out' }, 1.6)
        .from('.hero__title .w', { yPercent: 110, duration: 1.4, ease: 'power4.out', stagger: 0.12 }, 1.8)
        .from('.hero .eyebrow, .hero__foot', { opacity: 0, y: 20, duration: 1, stagger: 0.1 }, 2.1)
        .from('.credit-box', { opacity: 0, y: 30, duration: 1.4, ease: 'power3.out' }, 2.4);
    };
  }

  /* ---------- LOADER ---------- */
  function runLoader(onDone) {
    const loader = $('#loader');
    const tl = gsap.timeline({ onComplete: () => {
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      if (lenis) lenis.start();
      setTimeout(() => { loader.style.display = 'none'; }, 1300);
      onDone();
    } });
    tl.to('#loaderPath', { strokeDashoffset: 0, duration: reduce ? 0.1 : 2, ease: 'power2.inOut' })
      .to('#loaderBar', { scaleX: 1, duration: reduce ? 0.1 : 2.2, ease: 'power1.inOut' }, 0)
      .to('#loaderPath', { fill: '#F2EBDD', strokeOpacity: 0, duration: 0.6 }, '-=0.3')
      .to('.loader__desc', { opacity: 0.85, letterSpacing: '0.62em', duration: 0.8 }, '-=0.4')
      .to({}, { duration: 0.3 });
  }

  /* ---------- índice com prévia ---------- */
  function setupIndex() {
    const prev = $('#indexPreview'), img = $('img', prev);
    if (touch) return;
    const p = { x: 0, y: 0 };
    window.addEventListener('pointermove', (e) => { p.x = e.clientX; p.y = e.clientY; });
    gsap.ticker.add(() => gsap.set(prev, { x: p.x + 160, y: p.y }));
    $$('#indexList a').forEach((a) => {
      a.addEventListener('pointerenter', () => { img.src = a.dataset.img; gsap.to(prev, { opacity: 1, scale: 1, rotate: -3, duration: 0.6, ease: 'power3.out' }); gsap.fromTo(img, { scale: 1.3 }, { scale: 1.05, duration: 1.2, ease: 'power3.out' }); });
      a.addEventListener('pointerleave', () => gsap.to(prev, { opacity: 0, scale: 0.6, rotate: 0, duration: 0.4 }));
    });
  }

  /* ---------- nome: αύρα ↔ AVRA ---------- */
  function setupName() {
    const el = $('#greek');
    const from = 'αύρα', to = 'AVRA';
    const pool = 'αύραΑΒΓΔΕΖΗΘΛΞΠΣΦΨΩAVRA';
    let showingLatin = false, busy = false;
    function scramble(target) {
      if (busy) return; busy = true;
      const len = target.length; let frame = 0;
      const id = setInterval(() => {
        frame++;
        el.textContent = [...target].map((c, i) => (frame > 6 + i * 4 ? c : pool[(Math.random() * pool.length) | 0])).join('');
        if (frame > 6 + len * 4) { clearInterval(id); busy = false; }
      }, 45);
    }
    el.addEventListener('pointerenter', () => { showingLatin = !showingLatin; scramble(showingLatin ? to : from); });
    ScrollTrigger.create({ trigger: el, start: 'top 70%', onEnter: () => { setTimeout(() => { showingLatin = true; scramble(to); }, 900); } });
    BR20.animate($('#nameBreeze'), { color: '#C99073', alpha: 0.35, seed: 44, speed: 0.8, width: 1, interactive: true, host: el.closest('section'), force: 50, radius: 120, align: { ax: 1, ay: 0.5, scale: 0.9 } });
  }

  /* ---------- construção da assinatura ---------- */
  function setupBuild() {
    const NS = 'http://www.w3.org/2000/svg';
    const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
    const grid = $('#bGrid'), diag = $('#bDiag'), arcs = $('#bArcs'), gap = $('#bGap'), notes = $('#bNotes');
    const rows = [[45, 'ALTURA'], [312, 'EIXO DOS ARCOS'], [550, 'LINHA DE BASE']];
    rows.forEach(([y, t]) => { mk('line', { x1: -560, y1: y, x2: 3520, y2: y }, grid); mk('text', { x: -560, y: y - 18 }, grid).textContent = t; });
    [112, 1100, 1750, 2912, 3487].forEach((x) => mk('line', { x1: x, y1: -60, x2: x, y2: 620, class: 'v' }, grid));
    const D = [[112, 537, 587, 45], [587, 45, 1100, 550], [837, 87, 1325, 487], [1325, 487, 1750, 75], [1800, 300, 2175, 562], [2175, 562, 2912, 45], [2912, 45, 3487, 537]];
    D.forEach(([a, b, c, d]) => { mk('line', { x1: a, y1: b, x2: c, y2: d, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, diag); mk('circle', { cx: a, cy: b, r: 12 }, diag); mk('circle', { cx: c, cy: d, r: 12 }, diag); });
    mk('path', { d: 'M 287 462 Q 537 156 862 475', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, arcs);
    mk('path', { d: 'M 2625 462 Q 2925 178 3212 462', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, arcs);
    mk('path', { d: 'M 1750 72 L 2346 72 A 121 121 0 0 1 2346 315 L 2000 315', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, arcs);
    mk('circle', { cx: 575, cy: 470, r: 300, class: 'guide-circle' }, arcs);
    mk('circle', { cx: 2920, cy: 470, r: 300, class: 'guide-circle' }, arcs);
    mk('circle', { cx: 2346, cy: 193, r: 121, class: 'guide-circle' }, arcs);
    mk('circle', { cx: 850, cy: 130, r: 95 }, gap);
    mk('line', { x1: 920, y1: 66, x2: 1120, y2: -70 }, gap);
    mk('text', { x: 1140, y: -80 }, notes).textContent = 'ABERTURA ÓPTICA A / V';
    const nArc = mk('text', { x: 2560, y: 700 }, notes); nArc.textContent = 'ARCO · MOVIMENTO DA BRISA';
    const nDiag = mk('text', { x: 40, y: 700 }, notes); nDiag.textContent = 'DIAGONAL · FIRMEZA E DIREÇÃO';

    const steps = $$('.build__step');
    const sec = $('#construcao');
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.8,
      onUpdate: (s) => {
        const i = Math.min(steps.length - 1, Math.floor(s.progress * steps.length * 0.999));
        steps.forEach((el, k) => el.classList.toggle('is-active', k === i));
        $('#buildProgress').style.transform = `scaleX(${s.progress})`;
      } } });
    tl.from($$('line', grid), { scaleX: 0, transformOrigin: '0% 50%', stagger: 0.02, duration: 0.12 }, 0)
      .from($$('text', grid), { opacity: 0, duration: 0.06 }, 0.06)
      .to($$('line', diag), { strokeDashoffset: 0, stagger: 0.02, duration: 0.1 }, 0.2)
      .from($$('circle', diag), { scale: 0, transformOrigin: '50% 50%', stagger: 0.01, duration: 0.05 }, 0.22)
      .from(nDiag, { opacity: 0, duration: 0.05 }, 0.3)
      .to($$('path', arcs), { strokeDashoffset: 0, stagger: 0.03, duration: 0.12 }, 0.4)
      .from($$('.guide-circle', arcs), { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.1 }, 0.4)
      .from(nArc, { opacity: 0, duration: 0.05 }, 0.48)
      .to('#bOutline', { strokeDashoffset: 0, duration: 0.18 }, 0.46)
      .to('#bFill', { opacity: 1, duration: 0.08 }, 0.62)
      .to([diag, arcs], { opacity: 0.25, duration: 0.06 }, 0.64)
      .from(gap, { opacity: 0, duration: 0.05 }, 0.64)
      .from($$('text', notes)[0], { opacity: 0, duration: 0.05 }, 0.66)
      .to([grid, diag, arcs, gap, notes], { opacity: 0, duration: 0.08 }, 0.82)
      .to('#bOutline', { opacity: 0, duration: 0.05 }, 0.82)
      .fromTo('#buildDesc', { opacity: 0, letterSpacing: '0.1em' }, { opacity: 1, letterSpacing: '0.82em', duration: 0.12 }, 0.84)
      .to('#buildSvg', { scale: 0.92, duration: 0.16 }, 0.84)
      .to('.build__bg', { filter: 'brightness(1.25)', duration: 0.16 }, 0.84);
  }

  /* ---------- versões, proteção, redução ---------- */
  function setupVersions() {
    const card = $('#versionCard'), name = $('#versionName');
    $$('.versions__controls .chip').forEach((b) => b.addEventListener('click', () => {
      $$('.versions__controls .chip').forEach((x) => x.classList.toggle('is-active', x === b));
      card.style.setProperty('--bg', b.dataset.bg); card.style.setProperty('--fg', b.dataset.fg);
      name.textContent = b.dataset.name;
      gsap.fromTo('.versions__logo', { scale: 0.96, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out' });
    }));
    $('#clearToggle').addEventListener('change', (e) => $('.versions').classList.toggle('show-clear', e.target.checked));
    const range = $('#scaleRange'), logo = $('#scaleLogo'), note = $('#scaleNote');
    const upd = () => {
      const w = +range.value; logo.style.width = w + 'px'; logo.style.setProperty('--w', w);
      const ok = w * 0.042 >= 6;
      note.textContent = ok ? `${w}px · descritivo legível — usar assinatura completa` : `${w}px · descritivo ilegível — ampliar o espaço reservado à marca`;
      note.classList.toggle('is-warn', !ok);
    };
    range.addEventListener('input', upd); upd();
  }

  /* ---------- tipografia ---------- */
  function setupType() {
    const r = $('#weightRange'), out = $('#weightOut'), aa = $('#manropeAa');
    r.addEventListener('input', () => { out.textContent = r.value; aa.style.fontWeight = r.value; $('#typeLive').style.fontWeight = ''; });
    const tenor = $('#tenorAa'); const glyphs = ['Aa', 'Ãã', 'Çç', 'Ée', 'Rr', 'Vv', 'Ôô'];
    let gi = 0, timer;
    tenor.parentElement.addEventListener('pointerenter', () => { timer = setInterval(() => { gi = (gi + 1) % glyphs.length; tenor.textContent = glyphs[gi]; }, 380); });
    tenor.parentElement.addEventListener('pointerleave', () => { clearInterval(timer); tenor.textContent = 'Aa'; gi = 0; });
    // peso animado com o scroll
    gsap.fromTo(aa, { fontWeight: 200 }, { fontWeight: 800, ease: 'none', scrollTrigger: { trigger: aa, start: 'top bottom', end: 'bottom top', scrub: true, onUpdate: () => { out.textContent = Math.round(parseFloat(getComputedStyle(aa).fontWeight)); r.value = out.textContent; } } });
  }

  /* ---------- paleta ---------- */
  function setupPalette() {
    const toast = $('#toast'); let tid;
    $$('.swatch').forEach((s) => s.addEventListener('click', () => {
      const hex = s.dataset.hex;
      const done = () => { toast.textContent = `${hex} copiado`; toast.classList.add('is-on'); clearTimeout(tid); tid = setTimeout(() => toast.classList.remove('is-on'), 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(hex).then(done, done); else done();
    }));
  }

  /* ---------- BR20 ---------- */
  function setupPattern() {
    BR20.animate($('#br20Cover'), { color: '#C99073', alpha: 0.9, seed: 20, speed: 0.9, width: 1.3, interactive: true, host: $('#br20'), force: 70, radius: 140, align: { ax: 0.7, ay: 0.5, scale: 1 } });
    BR20.animate($('#posPattern'), { color: '#A6533C', alpha: 0.7, seed: 8, speed: 0.6, width: 1.2, interactive: true, host: $('#posPattern').parentElement, force: 40, align: { ax: 0.5, ay: 0.5 } });
    const stage = $('#patternStage');
    const anim = BR20.animate($('#patternCanvas'), { color: '#C99073', seed: 20, speed: 1, width: 1.4, interactive: true, force: 80, radius: 120 });
    $$('#patternTemps .chip').forEach((b) => b.addEventListener('click', () => {
      $$('#patternTemps .chip').forEach((x) => x.classList.toggle('is-active', x === b));
      stage.style.backgroundColor = b.dataset.bg; anim.color = b.dataset.fg;
    }));
    $('#patternSpeed').addEventListener('input', (e) => { anim.speed = +e.target.value; });
    BR20.animate($('#finalPattern'), { color: '#F2EBDD', alpha: 0.35, seed: 20, speed: 0.7, width: 1.2, interactive: true, host: $('#final'), force: 60, align: { ax: 1, ay: 0.5, scale: 1.1 } });
    // placa de sinalização e cartões de uso incorreto (estáticos/animados)
    BR20.animate($('#signPattern'), { color: '#C99073', alpha: 0.95, seed: 15, speed: 0.4, width: 1, align: { ax: 0.5, ay: 0.85, scale: 1.4 } });
    $$('.wrong__canvas').forEach((c, i) => BR20.animate(c, { color: '#C99073', alpha: 0.9, seed: 20 + i, speed: 0.6, width: 0.9 }));
  }

  /* ---------- galeria horizontal ---------- */
  function setupGallery() {
    const track = $('#hgTrack'), count = $('#hgCount');
    const items = $$('.mock', track);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 801px)', () => {
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '#hgallery', pin: '.hgallery__pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.8, invalidateOnRefresh: true,
        onUpdate: (s) => { count.textContent = String(Math.min(items.length, 1 + Math.floor(s.progress * items.length))).padStart(2, '0'); } } });
      items.forEach((m) => {
        gsap.fromTo($('img', m), { xPercent: -14 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: m, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        gsap.from(m, { rotateY: -18, opacity: 0.3, scale: 0.92, ease: 'none', scrollTrigger: { trigger: m, containerAnimation: tween, start: 'left right', end: 'left 60%', scrub: true } });
      });
    });
    mm.add('(max-width: 800px)', () => { track.style.overflowX = 'auto'; track.style.scrollSnapType = 'x mandatory'; });
  }

  /* ---------- carrossel 3D digital ---------- */
  function setupRing() {
    const ring = $('#ring'), inner = $('#ringInner'), items = $$('.ring__item', inner);
    const n = items.length, step = 360 / n;
    const st = { rot: 0, v: 0, drag: null, scroll: 0 };
    const layout = () => {
      const w = inner.offsetWidth, radius = (w / 2) / Math.tan(Math.PI / n) * 1.12;
      items.forEach((it, i) => { it.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`; });
      inner.style.setProperty('--r', radius + 'px');
      st.radius = radius;
    };
    layout(); window.addEventListener('resize', layout);
    ring.addEventListener('pointerdown', (e) => { st.drag = { x: e.clientX, r: st.rot, moved: false }; ring.setPointerCapture(e.pointerId); });
    ring.addEventListener('pointermove', (e) => { if (!st.drag) return; const dx = e.clientX - st.drag.x; if (Math.abs(dx) > 4) st.drag.moved = true; const nr = st.drag.r + dx * 0.25; st.v = nr - st.rot; st.rot = nr; });
    ring.addEventListener('pointerup', (e) => {
      if (st.drag && !st.drag.moved) { const el = document.elementFromPoint(e.clientX, e.clientY); const it = el && el.closest('.ring__item'); if (it) openLightbox(it.dataset.full); }
      st.drag = null;
    });
    ScrollTrigger.create({ trigger: ring, start: 'top bottom', end: 'bottom top', scrub: true, onUpdate: (s) => { st.scroll = s.progress * -140; } });
    gsap.ticker.add(() => {
      if (!st.drag) { st.rot += st.v; st.v *= 0.94; }
      const r = st.rot + st.scroll;
      inner.style.transform = `translateZ(-${st.radius}px) rotateX(-6deg) rotateY(${r}deg)`;
      items.forEach((it, i) => {
        let a = ((i * step + r) % 360 + 360) % 360; if (a > 180) a -= 360;
        const f = Math.abs(a) / 180;
        it.style.filter = `brightness(${1 - f * 0.55}) blur(${f * 3}px)`;
      });
    });
  }

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('img', lb);
  function openLightbox(src) { lbImg.src = src; lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); if (lenis) lenis.stop(); }
  function closeLightbox() { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); if (lenis) lenis.start(); }
  lb.addEventListener('click', closeLightbox);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
  $$('.mock').forEach((m) => m.addEventListener('click', () => openLightbox(m.dataset.full)));

  /* ---------- estúdio 3D (lazy) ---------- */
  function setupStudio() {
    const st = $('#studioStage');
    const io = new IntersectionObserver((en) => {
      if (en[0].isIntersecting) { io.disconnect(); requestAnimationFrame(() => window.AVRAStudio && window.AVRAStudio.init()); }
    }, { rootMargin: '600px' });
    io.observe(st);
  }

  /* ---------- início ---------- */
  function start() {
    const intro = setupHero();
    setupReveals(); setupParallax(); setupChrome(); setupCursor(); setupTilt(); setupIndex();
    setupName(); setupBuild(); setupVersions(); setupType(); setupPalette(); setupPattern();
    setupGallery(); setupRing(); setupStudio();
    ScrollTrigger.refresh();
    runLoader(intro);
  }
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => {
    // garante as faces usadas nas texturas em canvas
    return Promise.all([document.fonts.load('400 40px "Tenor Sans"'), document.fonts.load('600 40px "Manrope"'), document.fonts.load('400 40px "Manrope"')]).catch(() => {});
  }).then(start);
})();
