/* =========================================================
   Residencial Alta Vista — maquete 3D gerada a partir da
   planta de implantação. As cores da planta viram relevo:
   quadras de lotes sobem levemente, a mata ganha volume,
   cada árvore desenhada vira uma copa 3D e as edificações
   de apoio viram pequenos volumes. Visualização ilustrativa.
   ========================================================= */
(function () {
  'use strict';

  const W = 10;                       // largura da maquete (unidades)
  let three = null;

  function loadThree() {
    if (window.THREE) return Promise.resolve();
    if (three) return three;
    three = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'assets/vendor/three.min.js'; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return three;
  }

  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }

  // classificação de cor da planta → tipo de superfície
  function kind(r, g, b) {
    if (r < 95 && g < 95 && b < 95) return 'building';
    if (g > 125 && r < 135 && b < 90 && g - r > 40) return 'tree';
    if (r > 232 && g > 228 && b > 192 && b < 236 && g - b > 12) return 'lot';
    if (g > 150 && r > 115 && r < 170 && b < 125 && g - b > 50) return 'forest';
    if (b > g && b > r + 10 && r > 150) return 'water';
    if (g > b + 30 && b > 170 && r > 150 && r < 200) return 'water';
    return null;
  }

  async function init(opts) {
    await loadThree();
    const T = window.THREE;
    if (T.ColorManagement) T.ColorManagement.legacyMode = false;
    const canvas = opts.canvas, host = opts.host;
    const img = await loadImage(opts.image);
    const D = W * img.height / img.width;

    // ---------- leitura da planta ----------
    const SW = 520, SH = Math.round(SW * img.height / img.width);
    const sc = document.createElement('canvas'); sc.width = SW; sc.height = SH;
    const sx = sc.getContext('2d', { willReadFrequently: true });
    sx.drawImage(img, 0, 0, SW, SH);
    const px = sx.getImageData(0, 0, SW, SH).data;
    const disp = document.createElement('canvas'); disp.width = SW; disp.height = SH;
    const dx = disp.getContext('2d');
    const dimg = dx.createImageData(SW, SH);
    const trees = [], blocks = [];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < SH; y++) {
      for (let x = 0; x < SW; x++) {
        const i = (y * SW + x) * 4, k = kind(px[i], px[i + 1], px[i + 2]);
        let h = 0;
        if (k === 'lot') h = 70;
        else if (k === 'forest') h = 30 + rnd() * 35;
        else if (k === 'tree') { h = 40; if ((x + y * 3) % 3 === 0) trees.push([x, y]); }
        else if (k === 'building') { blocks.push([x, y]); h = 40; }
        dimg.data[i] = dimg.data[i + 1] = dimg.data[i + 2] = h; dimg.data[i + 3] = 255;
      }
    }
    dx.putImageData(dimg, 0, 0);
    // suaviza as bordas do relevo
    const soft = document.createElement('canvas'); soft.width = SW; soft.height = SH;
    const so = soft.getContext('2d'); so.filter = 'blur(1.2px)'; so.drawImage(disp, 0, 0);

    // ---------- cena ----------
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    scene.fog = new T.Fog(0x263B32, 16, 30);
    const camera = new T.PerspectiveCamera(30, 1, 0.1, 100);

    const map = new T.Texture(img); map.encoding = T.sRGBEncoding; map.anisotropy = renderer.capabilities.getMaxAnisotropy(); map.needsUpdate = true;
    const dmap = new T.CanvasTexture(soft);
    const ground = new T.Mesh(
      new T.PlaneGeometry(W, D, 360, Math.round(360 * D / W)),
      new T.MeshStandardMaterial({ map, color: 0xf3ead6, displacementMap: dmap, displacementScale: 0.42, roughness: 0.92, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);
    // base da maquete (espessura, como um modelo físico)
    const base = new T.Mesh(new T.BoxGeometry(W, 0.18, D), new T.MeshStandardMaterial({ color: 0x1c2d25, roughness: 0.8 }));
    base.position.y = -0.095; base.receiveShadow = true; scene.add(base);

    const toWorld = (x, y) => [(x / SW - 0.5) * W, (y / SH - 0.5) * D];
    const liftData = so.getImageData(0, 0, SW, SH).data;
    const liftAt = (x, y) => (liftData[((y | 0) * SW + (x | 0)) * 4] / 255) * 0.42;

    // copas das árvores
    const crown = new T.IcosahedronGeometry(0.055, 1);
    const crownM = new T.MeshStandardMaterial({ color: 0x5f7a45, roughness: 0.85, flatShading: true });
    const tm = new T.InstancedMesh(crown, crownM, trees.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), s3 = new T.Vector3();
    const col = new T.Color();
    trees.forEach(([x, y], i) => {
      const [wx, wz] = toWorld(x, y), sc2 = 0.75 + rnd() * 0.6;
      v.set(wx, liftAt(x, y) + 0.05 + sc2 * 0.04, wz); s3.set(sc2, sc2 * (0.85 + rnd() * 0.3), sc2);
      q.setFromAxisAngle(new T.Vector3(0, 1, 0), rnd() * 6.28);
      m4.compose(v, q, s3); tm.setMatrixAt(i, m4);
      tm.setColorAt(i, col.setHSL(0.24 + rnd() * 0.05, 0.32 + rnd() * 0.12, 0.3 + rnd() * 0.1));
    });
    tm.castShadow = true; tm.receiveShadow = true; scene.add(tm);

    // edificações de apoio (portaria, clube, gourmet)
    const bm = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xF2EBDD, roughness: 0.6 }), blocks.length);
    const cell = W / SW;
    blocks.forEach(([x, y], i) => {
      const [wx, wz] = toWorld(x, y);
      v.set(wx, 0.1, wz); s3.set(cell, 0.2, cell); q.identity(); m4.compose(v, q, s3); bm.setMatrixAt(i, m4);
    });
    bm.castShadow = true; scene.add(bm);

    // luz de fim de tarde
    scene.add(new T.HemisphereLight(0xfff4e2, 0x2b3b33, 0.75));
    const sun = new T.DirectionalLight(0xffe2bd, 1.9);
    sun.position.set(-6, 9, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // ---------- rótulos dos pontos ----------
    const labels = (opts.spots || []).map((sp, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'p3-label';
      b.innerHTML = `<span>${k + 1}</span><em>${sp[2]}</em>`;
      b.addEventListener('click', () => opts.onSpot && opts.onSpot(k));
      b.addEventListener('pointerenter', () => opts.onSpot && opts.onSpot(k));
      opts.labels.appendChild(b);
      const x = sp[0] / 100 * SW, y = sp[1] / 100 * SH, [wx, wz] = toWorld(x, y);
      return { el: b, pos: new T.Vector3(wx, liftAt(Math.min(SW - 1, x), Math.min(SH - 1, y)) + 0.25, wz) };
    });

    // ---------- órbita ----------
    const orb = { th: -0.5, ph: 0.9, d: 19, tth: -0.5, tph: 0.9, td: 19 };
    let drag = null, idle = 0;
    canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, th: orb.tth, ph: orb.tph }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      orb.tth = drag.th - (e.clientX - drag.x) * 0.006;
      orb.tph = Math.max(0.12, Math.min(1.25, drag.ph - (e.clientY - drag.y) * 0.005));
      idle = 0;
    });
    const up = () => { drag = null; };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    function top() { const toTop = orb.tph > 0.3; orb.tph = toTop ? 0.12 : 0.9; orb.tth = toTop ? 0 : -0.5; idle = -6; }

    function resize() {
      const r = host.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
      orb.td = camera.aspect < 1 ? 25 : 19;
    }
    window.addEventListener('resize', resize); resize();

    let visible = true;
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(host);
    const clock = new T.Clock(), pv = new T.Vector3();
    (function frame() {
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, clock.getDelta());
      if (!visible || host.hidden) return;
      idle += dt;
      if (!drag && idle > 4) orb.tth += dt * 0.05;
      orb.th += (orb.tth - orb.th) * 0.06; orb.ph += (orb.tph - orb.ph) * 0.06; orb.d += (orb.td - orb.d) * 0.06;
      camera.position.set(Math.sin(orb.th) * Math.sin(orb.ph) * orb.d, Math.cos(orb.ph) * orb.d, Math.cos(orb.th) * Math.sin(orb.ph) * orb.d);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      const r = canvas.getBoundingClientRect();
      labels.forEach((l) => {
        pv.copy(l.pos).project(camera);
        l.el.style.transform = `translate(${(pv.x * 0.5 + 0.5) * r.width}px, ${(-pv.y * 0.5 + 0.5) * r.height}px)`;
      });
    })();

    return {
      top,
      setActive(k) { labels.forEach((l, i) => l.el.classList.toggle('is-on', i === k)); },
      resize
    };
  }

  window.AVRAPlan3D = { init };
})();
