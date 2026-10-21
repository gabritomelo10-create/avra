/* =========================================================
   BR20 — Encontro de Correntes
   Gerador procedural do pattern: pequenos traços separados,
   organizados em correntes curvas e densas, com vazios
   sinuosos entre elas. Os traços correm ao longo das
   correntes (a brisa ganha ritmo) e desviam do cursor.
   ========================================================= */
(function () {
  'use strict';

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Catmull-Rom em pontos normalizados
  function spline(pts, n) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }

  function offsetCurve(sp, off, wobble, phase) {
    const out = [];
    for (let i = 0; i < sp.length; i++) {
      const a = sp[Math.max(0, i - 1)], b = sp[Math.min(sp.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const u = i / (sp.length - 1);
      // a faixa respira: largura varia ao longo da corrente
      const o = off * (1 + wobble * Math.sin(u * 6.28 * 1.3 + phase));
      out.push([sp[i][0] - ty * o, sp[i][1] + tx * o]);
    }
    return out;
  }

  // Reamostragem por comprimento de arco → índice direto
  function resample(poly, M) {
    const cum = [0];
    for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
    const L = cum[cum.length - 1];
    const xs = new Float32Array(M + 1), ys = new Float32Array(M + 1);
    let j = 0;
    for (let k = 0; k <= M; k++) {
      const s = (k / M) * L;
      while (j < cum.length - 2 && cum[j + 1] < s) j++;
      const t = (s - cum[j]) / ((cum[j + 1] - cum[j]) || 1);
      xs[k] = poly[j][0] + (poly[j + 1][0] - poly[j][0]) * t;
      ys[k] = poly[j][1] + (poly[j + 1][1] - poly[j][1]) * t;
    }
    return { xs, ys, L, M };
  }

  // Correntes (espinhas) no quadrado unitário — leitura da matriz do guia
  const FAMILIES = [
    { // corrente esquerda: desce, abre para a direita e retorna à base
      spine: [[0.17, -0.12], [0.26, 0.06], [0.37, 0.24], [0.40, 0.40], [0.31, 0.57], [0.15, 0.74], [0.02, 0.92], [-0.06, 1.12]],
      hw: 0.19, lines: 19, speed: 1, wob: 0.18
    },
    { // corrente superior direita: entra pelo topo e escorre pela borda
      spine: [[0.56, -0.12], [0.63, 0.06], [0.74, 0.22], [0.87, 0.36], [0.97, 0.50], [1.10, 0.60]],
      hw: 0.15, lines: 15, speed: 0.85, wob: 0.22
    },
    { // corrente inferior: sobe da base em diagonal até a borda direita
      spine: [[0.34, 1.12], [0.47, 0.98], [0.62, 0.88], [0.80, 0.80], [0.95, 0.72], [1.12, 0.66]],
      hw: 0.13, lines: 13, speed: 1.1, wob: 0.25
    },
    { // fio de ligação na borda direita (encontro das correntes)
      spine: [[1.04, 0.36], [0.96, 0.52], [0.93, 0.66], [0.97, 0.82], [1.06, 0.98]],
      hw: 0.05, lines: 5, speed: 0.7, wob: 0.3
    }
  ];

  function createField(opts) {
    opts = opts || {};
    const r = rng(opts.seed || 20);
    const density = opts.density || 1;
    const lines = [];
    const dashes = [];
    FAMILIES.forEach((f, fi) => {
      const sp = spline(f.spine, 24);
      const N = Math.max(3, Math.round(f.lines * density));
      for (let k = 0; k < N; k++) {
        const u = (k / (N - 1)) * 2 - 1;                // -1..1 através da faixa
        const jitter = (r() - 0.5) * (f.hw / N) * 0.8;
        const poly = offsetCurve(sp, u * f.hw + jitter, f.wob, fi * 1.7 + r());
        const line = resample(poly, 600);
        line.speed = f.speed * (0.85 + r() * 0.3);
        const li = lines.push(line) - 1;
        const edge = 1 - Math.pow(Math.abs(u), 2.2);      // concentração no centro da faixa
        let s = r() * 0.02;
        while (s < line.L) {
          const gap = (0.006 + r() * 0.012) / (0.55 + edge * 0.9) / Math.sqrt(density);
          const len = (0.006 + r() * 0.011) * (0.55 + edge * 0.6);
          if (r() < 0.25 + edge * 0.8) dashes.push({ li, s, len, w: 0.75 + r() * 0.5, a: 0.55 + r() * 0.45 });
          s += len + gap;
        }
      }
    });
    return { lines, dashes };
  }

  function pointAt(line, s, out) {
    s = s % line.L; if (s < 0) s += line.L;
    const f = (s / line.L) * line.M, i = f | 0, t = f - i;
    const j = Math.min(i + 1, line.M);
    out[0] = line.xs[i] + (line.xs[j] - line.xs[i]) * t;
    out[1] = line.ys[i] + (line.ys[j] - line.ys[i]) * t;
    return out;
  }

  const P = [0, 0], Q = [0, 0];

  /**
   * Desenha o campo.
   * o: { x, y, size, color, width, time, speed, alpha, pointer:{x,y,r,force}, mirror }
   * As coordenadas (x,y,size) definem o quadrado do campo em px; recortar
   * o canvas mantém a matriz sem deformar.
   */
  function draw(ctx, field, o) {
    const size = o.size, ox = o.x || 0, oy = o.y || 0;
    const t = (o.time || 0) * (o.speed == null ? 1 : o.speed) * 0.012;
    const lw = (o.width || 1.4);
    const pt = o.pointer;
    const pr = pt ? pt.r * pt.r : 0;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = o.color || '#C99073';
    ctx.lineWidth = lw;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.beginPath();
    const ds = field.dashes, ls = field.lines;
    const W = o.clipW || Infinity, H = o.clipH || Infinity;
    for (let i = 0; i < ds.length; i++) {
      const d = ds[i], line = ls[d.li];
      let s = (d.s + t * line.speed) % line.L;
      if (s + d.len > line.L) continue;            // traço atravessando o fim da corrente
      pointAt(line, s, P); pointAt(line, s + d.len, Q);
      let x1 = ox + P[0] * size, y1 = oy + P[1] * size, x2 = ox + Q[0] * size, y2 = oy + Q[1] * size;
      if (o.mirror) { x1 = ox + size - (x1 - ox); x2 = ox + size - (x2 - ox); }
      if ((x1 < -20 && x2 < -20) || (y1 < -20 && y2 < -20) || (x1 > W + 20 && x2 > W + 20) || (y1 > H + 20 && y2 > H + 20)) continue;
      if (pt) {
        const mx = (x1 + x2) * 0.5, my = (y1 + y2) * 0.5;
        const dx = mx - pt.x, dy = my - pt.y, dd = dx * dx + dy * dy;
        if (dd < pr * 4) {
          const k = Math.exp(-dd / pr) * pt.force;
          const inv = 1 / (Math.sqrt(dd) || 1);
          const px = dx * inv * k, py = dy * inv * k;
          // empurra e gira o traço como se a brisa o desviasse
          x1 += px; y1 += py; x2 += px * 1.6 - py * 0.4; y2 += py * 1.6 + px * 0.4;
        }
      }
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Cobre um retângulo w×h com o campo (recorte "cover", sem deformar). */
  function cover(w, h, align) {
    const size = Math.max(w, h) * (align && align.scale || 1);
    const ax = align && align.ax != null ? align.ax : 0.5, ay = align && align.ay != null ? align.ay : 0.5;
    return { x: (w - size) * ax, y: (h - size) * ay, size };
  }

  /** Animador de canvas com DPR, pointer e pausa fora da tela. */
  function animate(canvas, opts) {
    const ctx = canvas.getContext('2d');
    const field = createField({ seed: opts.seed || 20, density: opts.density || 1 });
    const state = { color: opts.color, bg: opts.bg || null, speed: opts.speed == null ? 1 : opts.speed, alpha: opts.alpha == null ? 1 : opts.alpha, visible: true, pointer: null, force: 0, time: (opts.seed || 0) * 37 };
    let w = 0, h = 0, dpr = 1;
    const target = { x: -9999, y: -9999, force: 0 };
    const cur = { x: -9999, y: -9999 };
    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 2);
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      if (!state.running) render();
    }
    function render() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (state.bg) { ctx.fillStyle = state.bg; ctx.fillRect(0, 0, w, h); } else ctx.clearRect(0, 0, w, h);
      const c = cover(w, h, opts.align);
      cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
      state.force += (target.force - state.force) * 0.035;
      draw(ctx, field, {
        x: c.x + (opts.offsetX ? opts.offsetX() : 0), y: c.y + (opts.offsetY ? opts.offsetY() : 0), size: c.size,
        color: state.color, width: (opts.width || 1.3) * (c.size / 900 + 0.6), time: state.time, speed: 1, alpha: state.alpha,
        mirror: opts.mirror, clipW: w, clipH: h,
        pointer: opts.interactive && state.force > 0.5 ? { x: cur.x, y: cur.y, r: opts.radius || 90, force: state.force } : null
      });
    }
    let last = performance.now();
    function loop(now) {
      const dt = Math.min(50, now - last); last = now;
      if (state.visible) { state.time += dt * 0.016 * state.speed; render(); }
      raf = requestAnimationFrame(loop);
    }
    let raf;
    if (opts.interactive) {
      const host = opts.host || canvas;
      host.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        target.x = e.clientX - r.left; target.y = e.clientY - r.top; target.force = opts.force || 46;
        if (cur.x < -9000) { cur.x = target.x; cur.y = target.y; }
      });
      host.addEventListener('pointerleave', () => { target.force = 0; });
    }
    const io = new IntersectionObserver((en) => { state.visible = en[0].isIntersecting; }, { rootMargin: '100px' });
    io.observe(canvas);
    window.addEventListener('resize', resize);
    resize();
    if (!opts.static) { state.running = true; raf = requestAnimationFrame(loop); }
    state.render = render; state.resize = resize;
    return state;
  }

  /** Desenho estático em um canvas qualquer (texturas 3D, cartões). */
  function paint(ctx, w, h, o) {
    const field = o.field || (paint._cache[o.seed || 20] = paint._cache[o.seed || 20] || createField({ seed: o.seed || 20, density: o.density || 1 }));
    const c = o.rect || cover(w, h, o.align);
    draw(ctx, field, { x: c.x, y: c.y, size: c.size, color: o.color, width: o.width || Math.max(1, c.size / 520), time: o.time || 0, alpha: o.alpha, mirror: o.mirror, clipW: w, clipH: h });
  }
  paint._cache = {};

  window.BR20 = { createField, draw, animate, paint, cover };
})();
