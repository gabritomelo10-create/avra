/* =========================================================
   Residencial Alta Vista — maquete 3D interativa.
   O terreno usa a planta de implantação como base; por cima,
   cada um dos 471 lotes é um volume próprio (geometria extraída
   da planta), colorido pela situação de venda e selecionável.
   ========================================================= */
(function () {
  'use strict';

  const W = 10;                       // largura da maquete (unidades)
  let three = null;

  const STATUS = {
    disponivel: { color: 0xF2EBDD, h: 0.04, label: 'Disponível' },
    reservado:  { color: 0xC99073, h: 0.028,  label: 'Reservado' },
    vendido:    { color: 0x4E6B5B, h: 0.014,  label: 'Vendido' }
  };
  const SELECTED = 0xA6533C, HOVER = 0xE2B48F;

  function loadThree(base) {
    if (window.THREE) return Promise.resolve();
    if (three) return three;
    three = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = (base || '') + 'assets/vendor/three.min.js'; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return three;
  }
  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }

  // cores da planta → árvores, mata e edificações (para dar volume ao entorno)
  function kind(r, g, b) {
    if (r < 95 && g < 95 && b < 95) return 'building';
    if (g > 125 && r < 135 && b < 90 && g - r > 40) return 'tree';
    if (g > 150 && r > 115 && r < 170 && b < 125 && g - b > 50) return 'forest';
    return null;
  }

  async function init(opts) {
    await loadThree(opts.base);
    const T = window.THREE;
    if (T.ColorManagement) T.ColorManagement.legacyMode = false;
    const canvas = opts.canvas, host = opts.host;
    const img = await loadImage(opts.image);
    const D = W * img.height / img.width;
    const toWorld = (fx, fy) => [(fx - 0.5) * W, (fy - 0.5) * D];

    // ---------- leitura da planta (entorno) ----------
    const SW = 520, SH = Math.round(SW * img.height / img.width);
    const sc = document.createElement('canvas'); sc.width = SW; sc.height = SH;
    const sx = sc.getContext('2d', { willReadFrequently: true });
    sx.drawImage(img, 0, 0, SW, SH);
    const px = sx.getImageData(0, 0, SW, SH).data;
    const disp = document.createElement('canvas'); disp.width = SW; disp.height = SH;
    const dx = disp.getContext('2d'), dimg = dx.createImageData(SW, SH);
    const trees = [], blocks = [];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const i = (y * SW + x) * 4, k = kind(px[i], px[i + 1], px[i + 2]);
      let h = 0;
      if (k === 'forest') h = 30 + rnd() * 35;
      else if (k === 'tree') { h = 30; if ((x + y * 3) % 3 === 0) trees.push([x / SW, y / SH]); }
      else if (k === 'building') { blocks.push([x / SW, y / SH]); h = 30; }
      dimg.data[i] = dimg.data[i + 1] = dimg.data[i + 2] = h; dimg.data[i + 3] = 255;
    }
    dx.putImageData(dimg, 0, 0);
    const soft = document.createElement('canvas'); soft.width = SW; soft.height = SH;
    const so = soft.getContext('2d'); so.filter = 'blur(1.2px)'; so.drawImage(disp, 0, 0);
    const liftData = so.getImageData(0, 0, SW, SH).data;
    const liftAt = (fx, fy) => (liftData[((Math.min(SH - 1, fy * SH) | 0) * SW + (Math.min(SW - 1, fx * SW) | 0)) * 4] / 255) * 0.3;

    // ---------- cena ----------
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    scene.fog = new T.Fog(0x263B32, 18, 34);
    const camera = new T.PerspectiveCamera(30, 1, 0.05, 100);

    const map = new T.Texture(img); map.encoding = T.sRGBEncoding; map.anisotropy = renderer.capabilities.getMaxAnisotropy(); map.needsUpdate = true;
    const ground = new T.Mesh(
      new T.PlaneGeometry(W, D, 300, Math.round(300 * D / W)),
      new T.MeshStandardMaterial({ map, color: 0xe9e0cc, displacementMap: new T.CanvasTexture(soft), displacementScale: 0.3, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);
    const base = new T.Mesh(new T.BoxGeometry(W, 0.2, D), new T.MeshStandardMaterial({ color: 0x1c2d25, roughness: 0.8 }));
    base.position.y = -0.101; base.receiveShadow = true; scene.add(base);

    // copas
    const tm = new T.InstancedMesh(new T.IcosahedronGeometry(0.05, 1), new T.MeshStandardMaterial({ color: 0x5f7a45, roughness: 0.85, flatShading: true }), trees.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), s3 = new T.Vector3(), col = new T.Color();
    trees.forEach(([fx, fy], i) => {
      const [wx, wz] = toWorld(fx, fy), k = 0.75 + rnd() * 0.6;
      v.set(wx, liftAt(fx, fy) + 0.05 + k * 0.04, wz); s3.set(k, k * (0.85 + rnd() * 0.3), k);
      q.setFromAxisAngle(new T.Vector3(0, 1, 0), rnd() * 6.28); m4.compose(v, q, s3); tm.setMatrixAt(i, m4);
      tm.setColorAt(i, col.setHSL(0.24 + rnd() * 0.05, 0.32 + rnd() * 0.12, 0.3 + rnd() * 0.1));
    });
    tm.castShadow = true; scene.add(tm);
    // edificações de apoio
    const bm = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xF2EBDD, roughness: 0.6 }), blocks.length);
    const cell = W / SW;
    blocks.forEach(([fx, fy], i) => { const [wx, wz] = toWorld(fx, fy); v.set(wx, 0.1, wz); s3.set(cell, 0.2, cell); q.identity(); m4.compose(v, q, s3); bm.setMatrixAt(i, m4); });
    bm.castShadow = true; scene.add(bm);

    // ---------- lotes ----------
    const lots = [], byId = {};
    const lotGroup = new T.Group(); scene.add(lotGroup);
    const edgeM = new T.LineBasicMaterial({ color: 0x263B32, transparent: true, opacity: 0.35 });
    (window.AVRA_LOTES || []).forEach(([id, m2, poly, c]) => {
      const [cx, cz] = toWorld(c[0], c[1]);
      const shape = new T.Shape();
      for (let i = 0; i < poly.length; i += 2) {
        const [wx, wz] = toWorld(poly[i], poly[i + 1]);
        // recuo leve em direção ao centro: deixa visível a divisa entre lotes
        const x = cx + (wx - cx) * 0.92, z = cz + (wz - cz) * 0.92;
        i ? shape.lineTo(x - cx, -(z - cz)) : shape.moveTo(x - cx, -(z - cz));
      }
      const geo = new T.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
      const mat = new T.MeshStandardMaterial({ color: STATUS.disponivel.color, roughness: 0.7 });
      const mesh = new T.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(cx, 0.004, cz);
      mesh.castShadow = true; mesh.receiveShadow = true;
      const edges = new T.LineSegments(new T.EdgesGeometry(geo), edgeM); mesh.add(edges);
      mesh.userData = { id, m2, q: +id.slice(0, 2), n: +id.slice(3), status: 'disponivel', h: STATUS.disponivel.h, th: STATUS.disponivel.h };
      mesh.scale.z = 0.0001;
      lotGroup.add(mesh); lots.push(mesh); byId[id] = mesh;
    });

    // luz
    scene.add(new T.HemisphereLight(0xfff4e2, 0x2b3b33, 0.8));
    const sun = new T.DirectionalLight(0xffe2bd, 1.8);
    sun.position.set(-6, 9, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // ---------- estado ----------
    let selected = null, hovered = null, onlyAvail = false;
    function paint(m) {
      const u = m.userData, st = STATUS[u.status] || STATUS.disponivel;
      const dim = onlyAvail && u.status !== 'disponivel';
      let c = st.color;
      if (m === selected) c = SELECTED; else if (m === hovered) c = HOVER;
      m.material.color.setHex(c);
      m.material.transparent = dim; m.material.opacity = dim ? 0.25 : 1;
      u.th = (m === selected ? 0.1 : m === hovered ? st.h + 0.025 : st.h) * (dim ? 0.4 : 1);
    }
    function setStatus(map) {
      lots.forEach((m) => { m.userData.status = (map && map[m.userData.id]) || 'disponivel'; paint(m); });
    }
    function select(id, focus) {
      const prev = selected; selected = id ? byId[id] || null : null;
      if (prev) paint(prev);
      if (selected) { paint(selected); if (focus) focusOn(selected); }
      opts.onSelect && opts.onSelect(selected ? Object.assign({}, selected.userData) : null);
    }
    function setOnlyAvailable(v) { onlyAvail = !!v; lots.forEach(paint); }

    // ---------- câmera ----------
    const orb = { th: -0.5, ph: 0.85, d: 23, tth: -0.5, tph: 0.85, td: 23, tx: 0, tz: 0, ttx: 0, ttz: 0 };
    const DMIN = 3, DMAX = 30;
    let drag = null, idle = 0, auto = true;
    function focusOn(m) { orb.ttx = m.position.x; orb.ttz = m.position.z; orb.td = Math.min(orb.td, 7); orb.tph = Math.min(orb.tph, 0.85); auto = false; }
    function reset() { orb.ttx = 0; orb.ttz = 0; orb.td = camera.aspect < 1 ? 25 : 23; orb.tph = 0.85; orb.tth = -0.5; }
    function zoom(f) { orb.td = Math.max(DMIN, Math.min(DMAX, orb.td * f)); auto = false; }
    function top() { const toTop = orb.tph > 0.3; orb.tph = toTop ? 0.08 : 0.85; if (toTop) orb.tth = 0; auto = false; }

    const ray = new T.Raycaster(), ndc = new T.Vector2();
    function pick(e) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(lots, false)[0];
      return hit ? hit.object : null;
    }
    const pointers = new Map(); let pinch = 0;
    canvas.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, e); canvas.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, th: orb.tth, ph: orb.tph, moved: false, pan: e.button === 2 || e.shiftKey };
      auto = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('pointermove', (e) => {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (pinch) orb.td = Math.max(DMIN, Math.min(DMAX, orb.td * pinch / d));
        pinch = d; if (drag) drag.moved = true; return;
      }
      if (drag) {
        const ddx = e.clientX - drag.x, ddy = e.clientY - drag.y;
        if (Math.abs(ddx) + Math.abs(ddy) > 5) drag.moved = true;
        if (drag.pan) {
          const k = orb.d * 0.0012, s = Math.sin(orb.th), c = Math.cos(orb.th);
          orb.ttx -= (ddx * c + ddy * s) * k; orb.ttz -= (-ddx * s + ddy * c) * k;
          drag.x = e.clientX; drag.y = e.clientY;
        } else {
          orb.tth = drag.th - ddx * 0.006;
          orb.tph = Math.max(0.08, Math.min(1.25, drag.ph - ddy * 0.005));
        }
        idle = 0; return;
      }
      const m = pick(e);
      if (m !== hovered) { const p = hovered; hovered = m; if (p) paint(p); if (m) paint(m); canvas.style.cursor = m ? 'pointer' : 'grab'; opts.onHover && opts.onHover(m ? m.userData : null, e); }
      else if (m && opts.onHover) opts.onHover(m.userData, e);
    });
    const up = (e) => {
      pointers.delete(e.pointerId); pinch = 0;
      if (drag && !drag.moved && e.type === 'pointerup') { const m = pick(e); select(m ? m.userData.id : null, false); }
      drag = null;
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', () => { if (hovered) { const p = hovered; hovered = null; paint(p); } opts.onHover && opts.onHover(null); });
    canvas.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey && !opts.wheel) return; e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 0.89); }, { passive: false });
    canvas.addEventListener('dblclick', (e) => { const m = pick(e); if (m) { select(m.userData.id, true); } });

    function resize() {
      const r = host.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      // desloca o centro da imagem para a área livre entre os painéis
      const sh = opts.shift ? opts.shift(r.width) : 0;
      if (sh) camera.setViewOffset(r.width, r.height, -sh, 0, r.width, r.height); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      if (auto) orb.td = camera.aspect < 1 ? 25 : 23;
    }
    window.addEventListener('resize', resize); resize();

    let visible = true;
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(host);
    const clock = new T.Clock();
    let grow = 0;
    (function frame() {
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, clock.getDelta());
      if (!visible) return;
      idle += dt;
      if (auto && !drag && idle > 4) orb.tth += dt * 0.04;
      const k = 0.08;
      orb.th += (orb.tth - orb.th) * k; orb.ph += (orb.tph - orb.ph) * k; orb.d += (orb.td - orb.d) * k;
      orb.tx += (orb.ttx - orb.tx) * k; orb.tz += (orb.ttz - orb.tz) * k;
      camera.position.set(orb.tx + Math.sin(orb.th) * Math.sin(orb.ph) * orb.d, Math.cos(orb.ph) * orb.d, orb.tz + Math.cos(orb.th) * Math.sin(orb.ph) * orb.d);
      camera.lookAt(orb.tx, 0, orb.tz);
      grow = Math.min(1, grow + dt * 0.8);
      for (const m of lots) { const u = m.userData; u.h += (u.th - u.h) * 0.15; m.scale.z = Math.max(0.0001, u.h * grow); }
      renderer.render(scene, camera);
    })();

    return { setStatus, select, setOnlyAvailable, zoom, reset, top, resize, focus: (id) => byId[id] && focusOn(byId[id]), STATUS };
  }

  window.AVRAPlan3D = { init, STATUS };
})();
