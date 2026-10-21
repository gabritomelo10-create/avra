/* =========================================================
   Brand canvas — desenha assinatura, descritivo e textos
   da marca em canvas 2D (usado nas texturas dos mockups 3D).
   ========================================================= */
(function () {
  'use strict';
  const L = window.AVRA_LOGO;
  const path = new Path2D(L.d);
  const [vx, vy, vw, vh] = L.viewBox;

  const C = {
    verde: '#263B32', oliva: '#74785A', terracota: '#A6533C',
    argila: '#C99073', marfim: '#F2EBDD', dourado: '#B6A078'
  };

  /** Desenha a assinatura centrada em cx, com largura w. Retorna a altura usada. */
  function logo(ctx, cx, y, w, color, opts) {
    opts = opts || {};
    const s = w / vw;
    ctx.save();
    ctx.translate(cx - w / 2 - vx * s, y - vy * s);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    if (opts.shadow) { ctx.shadowColor = opts.shadow; ctx.shadowBlur = 30 / s * (opts.shadowBlur || 1); ctx.shadowOffsetY = 8 / s; }
    ctx.fill(path, 'evenodd');
    ctx.restore();
    let h = vh * s;
    if (opts.descriptor !== false) {
      const fs = w * 0.034;
      spaced(ctx, 'INCORPORADORA', cx, y + h + fs * 1.9, fs, color, 0.82, 'Tenor Sans');
      h += fs * 2.6;
    }
    return h;
  }

  /** Texto com espaçamento entre letras, centrado. */
  function spaced(ctx, text, cx, y, size, color, tracking, family, align) {
    ctx.save();
    ctx.font = `400 ${size}px "${family || 'Tenor Sans'}", Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    const gap = size * tracking;
    const widths = [...text].map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
    let x = align === 'left' ? cx : cx - total / 2;
    [...text].forEach((ch, i) => { ctx.fillText(ch, x, y); x += widths[i] + gap; });
    ctx.restore();
    return total;
  }

  function text(ctx, str, x, y, size, color, o) {
    o = o || {};
    ctx.save();
    ctx.font = `${o.weight || 400} ${size}px "${o.family || 'Manrope'}", Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = o.align || 'left';
    if (o.tracking) ctx.letterSpacing = (size * o.tracking) + 'px';
    String(str).split('\n').forEach((ln, i) => ctx.fillText(ln, x, y + i * size * (o.lh || 1.2)));
    ctx.restore();
  }

  /** Ruído sutil para dar matéria às superfícies (papel, couro, pedra). */
  function grain(ctx, w, h, amount, seed) {
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    let s = seed || 7;
    for (let i = 0; i < d.length; i += 4) {
      s = (s * 16807) % 2147483647;
      const n = ((s / 2147483647) - 0.5) * amount;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  /** Travertino/granito claro procedural. */
  function stone(ctx, w, h, base) {
    ctx.fillStyle = base || '#d9c6a8';
    ctx.fillRect(0, 0, w, h);
    let s = 11;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < w * h / 70; i++) {
      const x = rnd() * w, y = rnd() * h, r = rnd() * 2.4 + 0.3;
      const t = rnd();
      ctx.fillStyle = t < 0.33 ? 'rgba(120,90,60,.22)' : t < 0.66 ? 'rgba(255,248,235,.35)' : 'rgba(166,120,80,.18)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    for (let i = 0; i < 26; i++) {
      ctx.strokeStyle = `rgba(150,115,80,${0.04 + rnd() * 0.06})`;
      ctx.lineWidth = 2 + rnd() * 8;
      ctx.beginPath();
      const y0 = rnd() * h;
      ctx.moveTo(0, y0);
      ctx.bezierCurveTo(w * 0.3, y0 + (rnd() - 0.5) * 120, w * 0.6, y0 + (rnd() - 0.5) * 120, w, y0 + (rnd() - 0.5) * 80);
      ctx.stroke();
    }
    grain(ctx, w, h, 18, 3);
  }

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  window.Brand = { C, logo, spaced, text, grain, stone, canvas, roundRect, path, viewBox: L.viewBox };
})();
