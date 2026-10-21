/* =========================================================
   Estúdio 3D — mockups da marca refeitos em 3D:
   crachá, kit de relacionamento, portfólio + envelope,
   smartphone com story animado e placa de obra.
   Sol quente com sombra de folhas balançando, piso de
   travertino, partículas fora de foco (profundidade).
   ========================================================= */
(function () {
  'use strict';
  const B = window.Brand, C = B.C;
  const TAU = Math.PI * 2;

  /* ---------------- utilidades ---------------- */
  function tex(canvas, renderer, opts) {
    const t = new THREE.CanvasTexture(canvas);
    t.encoding = (opts && opts.linear) ? THREE.LinearEncoding : THREE.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  function roundedShape(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function holePath(cx, cy, w, h) {
    const r = h / 2, p = new THREE.Path();
    p.moveTo(cx - w / 2 + r, cy - r); p.lineTo(cx + w / 2 - r, cy - r);
    p.absarc(cx + w / 2 - r, cy, r, -Math.PI / 2, Math.PI / 2, false);
    p.lineTo(cx - w / 2 + r, cy + r);
    p.absarc(cx - w / 2 + r, cy, r, Math.PI / 2, Math.PI * 1.5, false);
    return p;
  }
  function remapUV(geo, w, h) {
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
    uv.needsUpdate = true;
  }
  function shadowAll(obj) { obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
  const mat = {
    paper: (map, extra) => new THREE.MeshStandardMaterial(Object.assign({ map, roughness: 0.86, metalness: 0 }, extra || {})),
    gold: () => new THREE.MeshStandardMaterial({ color: 0xC9AE7C, metalness: 1, roughness: 0.26, envMapIntensity: 1.3 }),
    color: (c, r, m) => new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? 0.7 : r, metalness: m || 0 })
  };

  /* ---------------- texturas da marca ---------------- */
  function cardFrontCanvas() {
    const w = 640, h = 960, c = B.canvas(w, h), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ad5a42'); gr.addColorStop(1, '#9a4c36');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    B.logo(g, w / 2, 250, 470, C.marfim);
    B.spaced(g, 'EQUIPE', w / 2, 520, 30, C.marfim, 0.42, 'Tenor Sans');
    g.save(); g.beginPath(); g.rect(0, 640, w, h - 640); g.clip();
    BR20.paint(g, w, h, { rect: { x: -60, y: 520, size: 760 }, color: C.marfim, width: 2.2, alpha: 0.9, seed: 7 });
    g.restore();
    B.grain(g, w, h, 14, 5);
    return c;
  }
  function cardBackCanvas() {
    const w = 640, h = 960, c = B.canvas(w, h), g = c.getContext('2d');
    g.fillStyle = '#9d4d37'; g.fillRect(0, 0, w, h);
    BR20.paint(g, w, h, { rect: { x: -200, y: -40, size: 1100 }, color: '#b8664c', width: 2.4, alpha: 0.8, seed: 3 });
    B.logo(g, w / 2, 700, 300, C.marfim);
    B.grain(g, w, h, 14, 9);
    return c;
  }
  function storyCanvas() { const c = B.canvas(600, 1300); return c; }
  function drawStory(c, t, page) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    g.fillStyle = page === 1 ? C.marfim : C.terracota; g.fillRect(0, 0, w, h);
    const ink = page === 1 ? C.verde : C.marfim;
    // barra de progresso
    g.fillStyle = page === 1 ? 'rgba(38,59,50,.2)' : 'rgba(242,235,221,.35)'; g.fillRect(30, 70, w - 60, 4);
    g.fillStyle = ink; g.fillRect(30, 70, (w - 60) * ((t * 0.08) % 1), 4);
    // cabeçalho
    g.fillStyle = C.verde; g.beginPath(); g.arc(62, 128, 26, 0, TAU); g.fill();
    B.logo(g, 62, 120, 38, C.marfim, { descriptor: false });
    B.text(g, 'avra.incorporadora  2h', 104, 136, 22, ink, { weight: 600 });
    B.text(g, '×', w - 56, 140, 40, ink, { weight: 300 });
    if (page === 1) {
      B.logo(g, w / 2, 250, 380, C.verde);
      B.text(g, 'ANTES DE\nESCOLHER\nUM LOTE', 64, 520, 64, C.verde, { family: 'Tenor Sans', lh: 1.12 });
      B.text(g, '5 pontos para observar', 64, 760, 32, C.verde, { family: 'Tenor Sans' });
      g.save(); g.beginPath(); g.rect(0, 830, w, h - 830); g.clip();
      g.fillStyle = C.terracota; g.fillRect(0, 830, w, h - 830);
      BR20.paint(g, w, h, { rect: { x: -100, y: 760, size: 820 }, color: C.marfim, width: 2.2, alpha: 0.9, seed: 11, time: t * 40 });
      g.restore();
    } else {
      B.logo(g, w / 2, 260, 330, C.marfim);
      B.spaced(g, 'COMUNICADO', w / 2, 520, 46, C.marfim, 0.12, 'Tenor Sans');
      g.fillStyle = C.marfim; g.fillRect(64, 562, 70, 3);
      B.text(g, 'Atendimento com\nhorário especial', 64, 650, 44, C.marfim, { family: 'Tenor Sans', lh: 1.15 });
      B.text(g, 'Nesta sexta-feira,\natendimento das 9h às 13h.', 64, 800, 32, C.marfim, { lh: 1.3 });
      B.text(g, 'Fale com nossa equipe\npelo WhatsApp.', 64, 970, 24, C.marfim, { lh: 1.35 });
      g.save(); g.beginPath(); g.rect(0, 860, w, 300); g.clip();
      BR20.paint(g, w, h, { rect: { x: 120, y: 700, size: 640 }, color: '#e2a58a', width: 2, alpha: 0.85, seed: 5, time: t * 40 });
      g.restore();
    }
    // barra de mensagem
    g.fillStyle = '#111'; g.fillRect(0, h - 130, w, 130);
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; B.roundRect(g, 30, h - 104, 380, 64, 32); g.stroke();
    B.text(g, 'Enviar mensagem...', 58, h - 62, 24, '#eee');
    B.text(g, '♡', 450, h - 56, 40, '#eee'); B.text(g, '➤', 520, h - 56, 34, '#eee');
  }
  function boxSideCanvas() {
    const w = 1400, h = 340, c = B.canvas(w, h), g = c.getContext('2d');
    g.fillStyle = '#efe6d6'; g.fillRect(0, 0, w, h);
    BR20.paint(g, w, h, { rect: { x: -100, y: -500, size: 1600 }, color: C.terracota, width: 3.2, alpha: 0.95, seed: 4 });
    B.grain(g, w, h, 10, 2);
    return c;
  }
  function boxTopCanvas() {
    const w = 1400, h = 960, c = B.canvas(w, h), g = c.getContext('2d');
    const gr = g.createRadialGradient(w * 0.4, h * 0.3, 50, w / 2, h / 2, w * 0.8);
    gr.addColorStop(0, '#d39c80'); gr.addColorStop(1, '#bd8467');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    B.logo(g, w / 2, h / 2 - 90, 640, C.verde, { descriptor: false });
    B.grain(g, w, h, 16, 8);
    return c;
  }
  function insideCanvas() {
    const w = 1400, h = 960, c = B.canvas(w, h), g = c.getContext('2d');
    g.fillStyle = '#a65e45'; g.fillRect(0, 0, w, h);
    const gr = g.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w * 0.7);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(40,10,0,.45)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // cartão de boas-vindas
    g.save(); g.translate(w / 2, h / 2); g.rotate(-0.04);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 40; g.shadowOffsetY = 14;
    g.fillStyle = C.marfim; g.fillRect(-470, -300, 940, 600);
    g.shadowColor = 'transparent';
    B.logo(g, 0, -210, 420, C.verde);
    B.text(g, 'Bem-vindo à AVRA.', 0, 80, 56, C.verde, { family: 'Tenor Sans', align: 'center' });
    B.text(g, 'Planejar com precisão. Criar espaço para a vida.', 0, 150, 28, C.terracota, { align: 'center' });
    g.restore();
    return c;
  }
  function walletCanvas() {
    const w = 900, h = 640, c = B.canvas(w, h), g = c.getContext('2d');
    g.fillStyle = '#22362d'; g.fillRect(0, 0, w, h);
    B.grain(g, w, h, 26, 4);
    g.setLineDash([14, 10]); g.strokeStyle = 'rgba(242,235,221,.45)'; g.lineWidth = 3;
    B.roundRect(g, 28, 28, w - 56, h - 56, 30); g.stroke(); g.setLineDash([]);
    B.logo(g, w / 2, h / 2 - 60, 420, '#e9dcc0', { descriptor: false });
    return c;
  }
  function coverCanvas(bump) {
    const w = 900, h = 1260, c = B.canvas(w, h), g = c.getContext('2d');
    if (bump) {
      g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
      g.save(); g.beginPath(); g.rect(0, h * 0.5, w, h * 0.5); g.clip();
      BR20.paint(g, w, h, { rect: { x: -300, y: 400, size: 1400 }, color: '#202020', width: 7, seed: 2 });
      g.restore();
      g.fillStyle = '#5a5a5a'; g.fillRect(0, h * 0.5 - 3, w, 6);
      B.logo(g, w / 2, 250, 600, '#b4b4b4', { descriptor: false });
      return c;
    }
    g.fillStyle = '#9d4b34'; g.fillRect(0, 0, w, h);
    // linho
    for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.04})`; g.fillRect(0, y, w, 1); }
    for (let x = 0; x < w; x += 3) { g.fillStyle = `rgba(255,220,200,${0.02 + Math.random() * 0.03})`; g.fillRect(x, 0, 1, h); }
    g.save(); g.beginPath(); g.rect(0, h * 0.5, w, h * 0.5); g.clip();
    BR20.paint(g, w, h, { rect: { x: -300, y: 400, size: 1400 }, color: '#7f3a27', width: 7, seed: 2 });
    g.restore();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, h * 0.5 - 2, w, 4);
    B.logo(g, w / 2, 250, 600, C.marfim, { descriptor: false });
    B.grain(g, w, h, 16, 6);
    return c;
  }
  function pageCanvas() {
    const w = 900, h = 1260, c = B.canvas(w, h), g = c.getContext('2d');
    g.fillStyle = '#f4eee2'; g.fillRect(0, 0, w, h);
    B.logo(g, w / 2, 180, 380, C.verde);
    B.text(g, 'Planejar com\nprecisão.', 90, 640, 76, C.verde, { family: 'Tenor Sans', lh: 1.1 });
    g.fillStyle = C.terracota; g.fillRect(90, 800, 90, 4);
    B.text(g, 'Projetos que valorizam o tempo,\nas pessoas e o lugar.', 90, 880, 30, C.verde, { lh: 1.45 });
    g.save(); g.beginPath(); g.rect(0, 1000, w, 260); g.clip();
    BR20.paint(g, w, h, { rect: { x: 200, y: 700, size: 900 }, color: C.argila, width: 3, seed: 9 });
    g.restore();
    B.grain(g, w, h, 8, 1);
    return c;
  }
  function envelopeCanvas(flap) {
    const w = 1200, h = flap ? 520 : 660, c = B.canvas(w, h), g = c.getContext('2d');
    g.fillStyle = '#f0e9da'; g.fillRect(0, 0, w, h);
    B.grain(g, w, h, 12, flap ? 3 : 4);
    if (flap) B.logo(g, w / 2, 160, 420, C.verde, { descriptor: false });
    return c;
  }
  function signCanvas() {
    const w = 2000, h = 1180, c = B.canvas(w, h), g = c.getContext('2d');
    g.fillStyle = '#efe8da'; g.fillRect(0, 0, w, h);
    g.fillStyle = C.terracota; g.fillRect(0, 0, 360, h);
    g.save(); g.beginPath(); g.rect(0, 0, 360, h); g.clip();
    BR20.paint(g, w, h, { rect: { x: -500, y: -200, size: 1500 }, color: C.marfim, width: 4, seed: 13 });
    g.restore();
    // espaço do logo 3D (em relevo) — só o descritivo vem na arte
    B.spaced(g, 'INCORPORADORA', 1180, 470, 44, C.verde, 0.82, 'Tenor Sans');
    g.fillStyle = C.verde; g.fillRect(520, 560, 1320, 3);
    B.text(g, 'Residências que\nse integram ao futuro.', 520, 680, 76, C.verde, { family: 'Tenor Sans', lh: 1.12 });
    g.fillRect(520, 870, 1320, 3);
    B.text(g, 'Projetos com propósito, design contemporâneo\ne respeito ao seu entorno.', 520, 960, 40, C.verde, { lh: 1.4 });
    B.grain(g, w, h, 8, 12);
    return c;
  }
  function leafCanvas() {
    const s = 1024, c = B.canvas(s, s), g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#fff';
    let seed = 5; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let b = 0; b < 7; b++) {
      let x = r() * s, y = r() * s, a = r() * TAU;
      g.strokeStyle = '#fff'; g.lineWidth = 6;
      for (let k = 0; k < 14; k++) {
        const nx = x + Math.cos(a) * 34, ny = y + Math.sin(a) * 34;
        g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
        for (const side of [-1, 1]) {
          const la = a + side * (0.7 + r() * 0.4), L = 50 + r() * 40;
          g.save(); g.translate(nx, ny); g.rotate(la);
          g.beginPath(); g.ellipse(L / 2, 0, L / 2, L * 0.16, 0, 0, TAU); g.fill();
          g.restore();
        }
        x = nx; y = ny; a += (r() - 0.5) * 0.4;
      }
    }
    return c;
  }
  function floorCanvas() {
    const s = 1024, c = B.canvas(s, s), g = c.getContext('2d');
    B.stone(g, s, s, '#bfa47f');
    return c;
  }
  /* ---------------- objetos ---------------- */
  function buildBadge(renderer) {
    const root = new THREE.Group();
    const pivot = new THREE.Group(); pivot.position.y = 2.55; root.add(pivot);
    const W = 1.1, H = 1.65;
    const shape = roundedShape(W, H, 0.08);
    shape.holes.push(holePath(0, H / 2 - 0.13, 0.26, 0.07));
    const card = new THREE.Group(); card.position.y = -0.28 - H / 2; pivot.add(card);
    const front = new THREE.ShapeGeometry(shape, 16); remapUV(front, W, H);
    const back = front.clone();
    const fm = mat.paper(tex(cardFrontCanvas(), renderer), { roughness: 0.55 });
    const bm = mat.paper(tex(cardBackCanvas(), renderer), { roughness: 0.55 });
    const thick = 0.022;
    const f = new THREE.Mesh(front, fm); f.position.z = thick / 2 + 0.0005;
    const b = new THREE.Mesh(back, bm); b.rotation.y = Math.PI; b.position.z = -thick / 2 - 0.0005;
    const edge = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 16 }), [new THREE.MeshBasicMaterial({ visible: false }), mat.color(0x8e432f, 0.6)]);
    edge.position.z = -thick / 2;
    card.add(f, b, edge);
    // mosquetão dourado
    const gold = mat.gold();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 16, 40), gold); ring.position.y = -0.17; ring.rotation.y = Math.PI / 2;
    const clip = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 8, 16), gold); clip.position.y = -0.03;
    const swivel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 20), gold); swivel.position.y = 0.08;
    pivot.add(ring, clip, swivel);
    // cordão oliva (fita)
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0.05, 0.8, 0.02), new THREE.Vector3(0.18, 1.8, -0.05), new THREE.Vector3(0.32, 3.4, -0.1)]);
    const ribbon = ribbonGeometry(curve, 0.12, 80);
    const strap = new THREE.Mesh(ribbon, new THREE.MeshStandardMaterial({ color: 0x5a6142, roughness: 0.95, side: THREE.DoubleSide, map: tex(strapCanvas(), renderer) }));
    pivot.add(strap);
    shadowAll(root);
    root.userData = {
      cam: { dist: 6.2, target: new THREE.Vector3(0, 1.3, 0), phi: 1.38 },
      caption: ['Crachá de equipe', 'Clique para balançar · arraste para girar'],
      swing: { a: 0, v: 0, b: 0, bv: 0 },
      update(t, dt) {
        const s = this.swing;
        s.v += (-s.a * 9 - s.v * 1.6) * dt; s.a += s.v * dt;
        s.bv += (-s.b * 7 - s.bv * 1.4) * dt; s.b += s.bv * dt;
        pivot.rotation.z = s.a + Math.sin(t * 0.9) * 0.025;
        pivot.rotation.y = s.b + Math.sin(t * 0.6) * 0.12;
      },
      click() { this.swing.v += 3.2 * (Math.random() > 0.5 ? 1 : -1); this.swing.bv += 4; }
    };
    return root;
  }
  function strapCanvas() {
    const c = B.canvas(64, 512), g = c.getContext('2d');
    g.fillStyle = '#5e6646'; g.fillRect(0, 0, 64, 512);
    for (let y = 0; y < 512; y += 4) { g.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.08})`; g.fillRect(0, y, 64, 2); }
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 0, 4, 512); g.fillRect(60, 0, 4, 512);
    return c;
  }
  function ribbonGeometry(curve, width, n) {
    const pos = [], uv = [], idx = [];
    const up = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = curve.getPoint(t), tg = curve.getTangent(t);
      const side = new THREE.Vector3().crossVectors(tg, up).normalize().multiplyScalar(width / 2);
      pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z);
      uv.push(0, t * 6, 1, t * 6);
      if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  function buildKit(renderer) {
    const root = new THREE.Group();
    const W = 2.4, H = 0.62, D = 1.62;
    const sideT = tex(boxSideCanvas(), renderer);
    const sideM = mat.paper(sideT, { roughness: 0.8 });
    const innerM = mat.paper(tex(insideCanvas(), renderer), { roughness: 0.9 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [sideM, sideM, innerM, mat.color(0xd8cdb8), sideM, sideM]);
    base.position.y = H / 2;
    root.add(base);
    // tampa (abre na aresta traseira)
    const lidPivot = new THREE.Group(); lidPivot.position.set(0, H, -D / 2 - 0.02); root.add(lidPivot);
    const LH = 0.16;
    const argilaEdge = mat.color(0xc28a6d, 0.85);
    const topM = mat.paper(tex(boxTopCanvas(), renderer), { roughness: 0.82 });
    const lid = new THREE.Mesh(new THREE.BoxGeometry(W + 0.05, LH, D + 0.05), [argilaEdge, argilaEdge, topM, argilaEdge, argilaEdge, argilaEdge]);
    lid.position.set(0, LH / 2 - 0.1, D / 2 + 0.02);
    lidPivot.add(lid);
    // porta-cartão de couro verde
    const wShape = roundedShape(1.0, 0.7, 0.07);
    const wallet = new THREE.Group();
    const wTop = new THREE.Mesh(new THREE.ShapeGeometry(wShape, 12), mat.paper(tex(walletCanvas(), renderer), { roughness: 0.62 }));
    remapUV(wTop.geometry, 1.0, 0.7);
    wTop.position.z = 0.051;
    const wBody = new THREE.Mesh(new THREE.ExtrudeGeometry(wShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 3, curveSegments: 12 }), mat.color(0x1f3229, 0.6));
    wallet.add(wBody, wTop);
    wallet.rotation.x = -Math.PI / 2; wallet.rotation.z = 0.18;
    wallet.position.set(-1.55, 0.02, 1.25);
    root.add(wallet);
    // chave dourada
    const key = new THREE.Group(); const gold = mat.gold();
    const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 40), gold);
    const holeRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 12, 40), gold); holeRing.rotation.x = Math.PI / 2; holeRing.position.set(-0.22, 0, 0);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.06), gold); shaft.position.x = 0.38;
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.08), gold); teeth.position.set(0.5, 0, 0.05);
    key.add(bow, holeRing, shaft, teeth);
    key.position.set(-0.75, 0.03, 1.45); key.rotation.y = 0.5;
    root.add(key);
    shadowAll(root);
    let open = 0, target = 0;
    root.userData = {
      cam: { dist: 6.4, target: new THREE.Vector3(-0.2, 0.4, 0.3), phi: 1.02 },
      caption: ['Kit de relacionamento', 'Clique para abrir a caixa'],
      update(t, dt) { open += (target - open) * Math.min(1, dt * 4); lidPivot.rotation.x = -open * 1.85; },
      click() { target = target ? 0 : 1; }
    };
    return root;
  }

  function buildPortfolio(renderer) {
    const root = new THREE.Group();
    const W = 1.5, H = 2.1, T = 0.035;
    const coverT = tex(coverCanvas(false), renderer), bumpT = tex(coverCanvas(true), renderer, { linear: true });
    const coverM = new THREE.MeshStandardMaterial({ map: coverT, bumpMap: bumpT, bumpScale: 0.012, roughness: 0.88 });
    const edgeM = mat.color(0x8d4430, 0.85);
    const book = new THREE.Group();
    // miolo de páginas
    const pages = new THREE.Mesh(new THREE.BoxGeometry(W - 0.04, 0.14, H - 0.06), [mat.color(0xeee6d4, 0.9), mat.color(0xeee6d4, 0.9), mat.paper(tex(pageCanvas(), renderer)), mat.color(0xeee6d4), mat.color(0xeee6d4, 0.9), mat.color(0xeee6d4, 0.9)]);
    pages.position.set(0.0, T + 0.07, 0);
    const backC = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, T, H), edgeM); backC.position.y = T / 2;
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, H), edgeM); spine.position.set(-W / 2 - 0.0, 0.11, 0);
    book.add(pages, backC, spine);
    const coverPivot = new THREE.Group(); coverPivot.position.set(-W / 2 - 0.02, 0.22, 0); book.add(coverPivot);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, T, H), [edgeM, edgeM, coverM, edgeM, edgeM, edgeM]);
    cover.position.set((W + 0.04) / 2, T / 2, 0);
    coverPivot.add(cover);
    book.position.set(-0.75, 0, 0.05); book.rotation.y = 0.12;
    root.add(book);
    // envelope marfim
    const env = new THREE.Group();
    const EW = 2.0, EH = 1.1;
    const envBody = new THREE.Mesh(new THREE.BoxGeometry(EW, 0.03, EH), [mat.color(0xe8e0cf), mat.color(0xe8e0cf), mat.paper(tex(envelopeCanvas(false), renderer)), mat.color(0xe8e0cf), mat.color(0xe8e0cf), mat.color(0xe8e0cf)]);
    envBody.position.y = 0.015;
    const flapShape = new THREE.Shape(); flapShape.moveTo(-EW / 2, 0); flapShape.lineTo(EW / 2, 0); flapShape.lineTo(0.12, -EH * 0.62); flapShape.quadraticCurveTo(0, -EH * 0.68, -0.12, -EH * 0.62); flapShape.lineTo(-EW / 2, 0);
    const flapG = new THREE.ShapeGeometry(flapShape, 8);
    const p = flapG.attributes.position, uv = flapG.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / EW + 0.5, 1 + p.getY(i) / (EH * 0.95));
    const flap = new THREE.Mesh(flapG, mat.paper(tex(envelopeCanvas(true), renderer), { side: THREE.DoubleSide }));
    flap.rotation.x = -Math.PI / 2; flap.position.set(0, 0.033, -EH / 2);
    env.add(envBody, flap);
    env.position.set(1.25, 0, -0.35); env.rotation.y = -0.38;
    root.add(env);
    shadowAll(root);
    let open = 0, target = 0;
    root.userData = {
      cam: { dist: 6.0, target: new THREE.Vector3(0.1, 0.1, 0), phi: 0.72 },
      caption: ['Portfólio e papelaria', 'Clique para abrir o portfólio'],
      update(t, dt) { open += (target - open) * Math.min(1, dt * 3.5); coverPivot.rotation.z = open * 2.6; },
      click() { target = target ? 0 : 1; }
    };
    return root;
  }

  function buildPhone(renderer) {
    const root = new THREE.Group();
    const W = 0.86, H = 1.78, R = 0.13, D = 0.08;
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedShape(W, H, R), { depth: D, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 6, curveSegments: 20 }), new THREE.MeshStandardMaterial({ color: 0x2b2b2a, metalness: 0.9, roughness: 0.32 }));
    body.position.z = -D / 2;
    const sc = storyCanvas(); drawStory(sc, 0, 0);
    const scT = tex(sc, renderer);
    const screenG = new THREE.ShapeGeometry(roundedShape(W - 0.06, H - 0.06, R - 0.03), 20); remapUV(screenG, W - 0.06, H - 0.06);
    const screen = new THREE.Mesh(screenG, new THREE.MeshBasicMaterial({ map: scT, toneMapped: false }));
    screen.position.z = D / 2 + 0.021;
    const glass = new THREE.Mesh(screenG, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0, clearcoat: 1, envMapIntensity: 1.6 }));
    glass.position.z = D / 2 + 0.023;
    const island = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.16, 6, 16), new THREE.MeshBasicMaterial({ color: 0x050505 }));
    island.rotation.z = Math.PI / 2; island.position.set(0, H / 2 - 0.1, D / 2 + 0.024);
    const phone = new THREE.Group(); phone.add(body, screen, glass, island);
    phone.position.y = 1.1; phone.rotation.set(-0.08, -0.3, 0);
    root.add(phone);
    // cilindro de argila (apoio de cena)
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 48), mat.color(0xb06a4c, 0.8)); pot.position.set(-1.25, 0.45, -0.6);
    const book = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.9), mat.color(0x263b32, 0.7)); book.position.set(1.15, 0.06, 0.1); book.rotation.y = 0.4;
    root.add(pot, book);
    shadowAll(root);
    screen.castShadow = false; glass.castShadow = false;
    let page = 0, acc = 0;
    root.userData = {
      cam: { dist: 5.2, target: new THREE.Vector3(0, 1.05, 0), phi: 1.42 },
      caption: ['Story de comunicado', 'Clique para trocar de tela'],
      update(t, dt) {
        phone.position.y = 1.1 + Math.sin(t * 1.2) * 0.04;
        acc += dt; if (acc > 1 / 30) { acc = 0; drawStory(sc, t, page); scT.needsUpdate = true; }
      },
      click() { page = 1 - page; }
    };
    return root;
  }

  function buildSign(renderer) {
    const root = new THREE.Group();
    const W = 3.4, H = 2.0;
    const boardM = mat.paper(tex(signCanvas(), renderer), { roughness: 0.6 });
    const frameM = mat.color(0x263b32, 0.45, 0.6);
    const board = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.05), [frameM, frameM, frameM, frameM, boardM, frameM]);
    board.position.y = 2.0;
    root.add(board);
    for (const x of [-W / 2 - 0.05, W / 2 + 0.05]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 20), frameM); post.position.set(x, 1.6, -0.02); root.add(post);
    }
    // assinatura em relevo (3D) sobre a placa
    const { shapes } = window.AVRA3D.logoShapes(1.9 / 3441);
    const lg = new THREE.ExtrudeGeometry(shapes, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.006, bevelSegments: 2, curveSegments: 6 });
    const logo = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ color: 0x263B32, roughness: 0.45, metalness: 0.2 }));
    logo.position.set(0.3, 2.0 + H * 0.22, 0.03);
    root.add(logo);
    // luzes de destaque noturno
    const spots = [];
    for (const x of [-0.9, 1.1]) {
      const s = new THREE.SpotLight(0xffd6a0, 0, 4, 0.7, 0.6, 1.5);
      s.position.set(x, 0.2, 1.0); s.target.position.set(x, 2.2, 0); root.add(s, s.target); spots.push(s);
      const fix = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.14, 16), mat.color(0x1a1a1a, 0.4, 0.6)); fix.position.set(x, 0.07, 1.0); root.add(fix);
    }
    shadowAll(root);
    let night = 0, target = 0;
    root.userData = {
      cam: { dist: 8.2, target: new THREE.Vector3(0, 1.75, 0), phi: 1.44 },
      caption: ['Placa de obra', 'Clique para ver ao anoitecer'],
      night: () => night,
      update(t, dt) { night += (target - night) * Math.min(1, dt * 2.5); spots.forEach((s) => (s.intensity = night * 9)); },
      click() { target = target ? 0 : 1; }
    };
    return root;
  }

  /* ---------------- estúdio ---------------- */
  function init() {
    const canvas = document.getElementById('studioGL');
    const stage = document.getElementById('studioStage');
    if (!canvas || !window.THREE) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch (e) { document.getElementById('studioLoading').textContent = 'WebGL indisponível neste navegador.'; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.environment = window.AVRA3D.studioEnv(renderer, true);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);

    // piso de travertino que se dissolve no fundo
    const floorT = tex(floorCanvas(), renderer); floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(3, 3);
    const floorM = new THREE.MeshStandardMaterial({ map: floorT, transparent: true, roughness: 0.72, metalness: 0, envMapIntensity: 0.25 });
    // o piso se dissolve radialmente no fundo da seção
    floorM.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vFloor;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFloor = position.xy;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vFloor;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.a *= 1.0 - smoothstep(2.2, 8.5, length(vFloor));');
    };
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), floorM);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    scene.add(floor);

    // luz do sol + folhas que projetam sombra (invisíveis à câmera)
    const hemi = new THREE.HemisphereLight(0xfff1de, 0x3a4a3f, 0.32); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe2bd, 1.35);
    sun.position.set(4.5, 9, 3.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 25;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
    scene.add(sun);
    const fill = new THREE.PointLight(0xC99073, 6, 14, 2); fill.position.set(-4, 2.5, 3); scene.add(fill);
    const rim = new THREE.PointLight(0xB6A078, 8, 14, 2); rim.position.set(2, 3, -4); scene.add(rim);

    const leafT = tex(leafCanvas(), renderer, { linear: true });
    const leaves = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ alphaMap: leafT, alphaTest: 0.5, side: THREE.DoubleSide, colorWrite: false, depthWrite: false }));
    leaves.position.copy(sun.position).multiplyScalar(0.62); leaves.lookAt(0, 0, 0);
    leaves.castShadow = true;
    scene.add(leaves);

    // partículas fora de foco
    const dust = window.AVRA3D.makeDust(90, 0.45); dust.material.uniforms.uFocus.value = 6; dust.scale.set(0.45, 0.45, 0.45); dust.position.y = 2;
    scene.add(dust);

    const objects = {
      cracha: buildBadge(renderer),
      kit: buildKit(renderer),
      portfolio: buildPortfolio(renderer),
      phone: buildPhone(renderer),
      placa: buildSign(renderer)
    };
    Object.values(objects).forEach((o) => {
      o.visible = false; scene.add(o);
      // reflexo de ambiente contido: papéis e tecidos não devem "estourar"
      o.traverse((m) => { if (m.isMesh) [].concat(m.material).forEach((mt) => { if (mt.envMapIntensity != null && mt.metalness < 0.5) mt.envMapIntensity = 0.3; }); });
    });

    let activeKey = 'cracha', active = objects.cracha; active.visible = true;
    const orbit = { theta: 0.35, phi: active.userData.cam.phi, dist: active.userData.cam.dist, tt: 0.35, tp: active.userData.cam.phi, td: active.userData.cam.dist, target: active.userData.cam.target.clone(), tTarget: active.userData.cam.target.clone() };
    const caption = document.getElementById('studioCaption');
    function setCaption(o) { caption.innerHTML = `<b>${o.userData.caption[0]}</b><span>${o.userData.caption[1]}</span>`; }
    setCaption(active);

    function show(key) {
      if (key === activeKey) return;
      const prev = active, next = objects[key];
      activeKey = key; active = next;
      gsap.to(prev.position, { y: -0.6, duration: 0.6, ease: 'power3.in' });
      gsap.to(prev.scale, { x: 0.85, y: 0.85, z: 0.85, duration: 0.6, ease: 'power3.in', onComplete: () => { prev.visible = false; prev.position.y = 0; prev.scale.set(1, 1, 1); } });
      next.visible = true; next.position.y = 1.2; next.scale.set(0.9, 0.9, 0.9);
      gsap.to(next.position, { y: 0, duration: 1.1, delay: 0.45, ease: 'power3.out' });
      gsap.to(next.scale, { x: 1, y: 1, z: 1, duration: 1.1, delay: 0.45, ease: 'power3.out' });
      const cam = next.userData.cam;
      orbit.tp = cam.phi; orbit.td = cam.dist; orbit.tTarget.copy(cam.target); orbit.tt = 0.35;
      setCaption(next);
    }
    document.querySelectorAll('#studioTabs button').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('#studioTabs button').forEach((x) => x.classList.toggle('is-active', x === b));
      show(b.dataset.obj);
    }));

    // arrastar para orbitar, clicar para interagir
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let down = null, idle = 0;
    canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: orbit.tt, p: orbit.tp, moved: false }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) down.moved = true;
      orbit.tt = down.t - dx * 0.008;
      orbit.tp = THREE.MathUtils.clamp(down.p - dy * 0.006, 0.45, 1.52);
      idle = 0;
    });
    canvas.addEventListener('pointerup', (e) => {
      if (down && !down.moved) {
        ray.setFromCamera(ndc, camera);
        if (ray.intersectObject(active, true).length && active.userData.click) active.userData.click();
      }
      down = null;
    });
    let inside = false;
    canvas.addEventListener('pointerenter', () => { inside = true; });
    canvas.addEventListener('pointerleave', () => { inside = false; document.body.classList.remove('studio-hover'); });

    function resize() {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize); resize();

    let visible = false;
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { rootMargin: '200px' }).observe(stage);
    document.getElementById('studioLoading').classList.add('is-done');

    const clock = new THREE.Clock();
    const skyDay = new THREE.Color(0xffe2bd), skyNight = new THREE.Color(0x6f7fa8);
    function frame() {
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, clock.getDelta());
      if (!visible) return;
      const t = clock.elapsedTime;
      idle += dt;
      if (!down && idle > 3) orbit.tt += dt * 0.12;
      orbit.theta += (orbit.tt - orbit.theta) * 0.07;
      orbit.phi += (orbit.tp - orbit.phi) * 0.07;
      orbit.dist += (orbit.td - orbit.dist) * 0.06;
      orbit.target.lerp(orbit.tTarget, 0.06);
      const narrow = camera.aspect < 0.9 ? 1.45 : 1;
      const d = orbit.dist * narrow;
      camera.position.set(orbit.target.x + d * Math.sin(orbit.phi) * Math.sin(orbit.theta), orbit.target.y + d * Math.cos(orbit.phi), orbit.target.z + d * Math.sin(orbit.phi) * Math.cos(orbit.theta));
      camera.lookAt(orbit.target);

      // folhas balançam: luz manchada viva
      leaves.rotation.z = Math.sin(t * 0.5) * 0.04;
      leaves.position.x = sun.position.x * 0.62 + Math.sin(t * 0.7) * 0.12;

      // anoitecer (placa)
      const n = objects.placa.userData.night();
      sun.intensity = 1.35 * (1 - n * 0.85); hemi.intensity = 0.32 * (1 - n * 0.6);
      sun.color.copy(skyDay).lerp(skyNight, n);
      renderer.toneMappingExposure = 0.88 - n * 0.2;

      if (inside) {
        ray.setFromCamera(ndc, camera);
        document.body.classList.toggle('studio-hover', !down && ray.intersectObject(active, true).length > 0);
      }

      Object.values(objects).forEach((o) => o.visible && o.userData.update && o.userData.update(t, dt));
      dust.material.uniforms.uTime.value = t;
      renderer.render(scene, camera);
    }
    frame();
  }

  window.AVRAStudio = { init };
})();
