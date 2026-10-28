/* =========================================================
   Residencial Alta Vista — cenário 3D.
   Terreno pintado a partir da planta (asfalto, gramados, mata,
   lagos), árvores e palmeiras em volume, entorno de lavrado com
   o Rio Branco, o Igarapé Santa Cecília e serras no horizonte.
   Os 471 lotes ficam demarcados no chão, coloridos pela
   situação de venda e selecionáveis.
   ========================================================= */
(function () {
  'use strict';

  const W = 10;                          // largura do terreno do condomínio (≈ 900 m)
  let three = null;

  const STATUS = {
    disponivel: { color: 0xF2E3B8, op: 0.24, label: 'Disponível' },
    reservado:  { color: 0xD08A63, op: 0.62, label: 'Reservado' },
    vendido:    { color: 0x2F4A3D, op: 0.62, label: 'Vendido' }
  };
  const SELECTED = 0xA6533C;

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
  const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

  // ruído de valor 2D simples e determinístico
  function makeNoise(seed) {
    const p = new Uint8Array(512); let s = seed || 1;
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 256; i++) p[i + 256] = p[i];
    const h = (x, y) => p[(p[x & 255] + y) & 255] / 255;
    const sm = (t) => t * t * (3 - 2 * t);
    const n = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
      const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; };
    return (x, y, o) => { let v = 0, a = 1, t = 0, f = 1; for (let i = 0; i < (o || 4); i++) { v += n(x * f, y * f) * a; t += a; a *= 0.5; f *= 2; } return v / t; };
  }

  async function init(opts) {
    await loadThree(opts.base);
    const T = window.THREE;
    if (T.ColorManagement) T.ColorManagement.legacyMode = false;
    const canvas = opts.canvas, host = opts.host;
    const [img, catImg] = await Promise.all([loadImage(opts.image), loadImage(opts.cats)]);
    const D = W * img.height / img.width;
    const toWorld = (fx, fy) => [(fx - 0.5) * W, (fy - 0.5) * D];
    const noise = makeNoise(11);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    // mapa de categorias (para espalhar árvores na mata e gramados)
    const cc = document.createElement('canvas'); cc.width = catImg.width; cc.height = catImg.height;
    const cx2 = cc.getContext('2d', { willReadFrequently: true }); cx2.drawImage(catImg, 0, 0);
    const catData = cx2.getImageData(0, 0, cc.width, cc.height).data;
    const CAT = {}; (window.AV_SCENE.cats || []).forEach((n, i) => { CAT[n] = i; });
    const catAt = (fx, fy) => catData[((Math.min(cc.height - 1, fy * cc.height | 0)) * cc.width + Math.min(cc.width - 1, fx * cc.width | 0)) * 4];

    // ---------- renderer / cena ----------
    const renderer = new T.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    const HORIZON = new T.Color(0xd9d4c2), ZENITH = new T.Color(0x6f8fa6);
    scene.fog = new T.Fog(HORIZON, 26, 120);
    scene.background = HORIZON;
    const camera = new T.PerspectiveCamera(32, 1, 0.05, 400);

    // céu em degradê com o brilho do sol
    const sunDir = new T.Vector3(-0.55, 0.32, 0.35).normalize();
    const sky = new T.Mesh(new T.SphereGeometry(300, 32, 16), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: ZENITH }, bot: { value: HORIZON }, sun: { value: sunDir } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 bot; uniform vec3 sun; varying vec3 vP;
        void main(){ float h = clamp(vP.y*1.6, 0.0, 1.0); vec3 c = mix(bot, top, pow(h, .7));
          float s = max(dot(vP, sun), 0.0); c += vec3(1.0,.86,.62) * (pow(s, 40.0)*.55 + pow(s, 6.0)*.12);
          gl_FragColor = vec4(c, 1.0); }`
    }));
    scene.add(sky);
    // reflexos suaves do céu na água
    const pm = new T.PMREMGenerator(renderer);
    const envScene = new T.Scene(); envScene.add(sky.clone());
    scene.environment = pm.fromScene(envScene, 0.04).texture;

    // ---------- terreno do condomínio ----------
    const map = new T.Texture(img); map.encoding = T.sRGBEncoding; map.anisotropy = renderer.capabilities.getMaxAnisotropy(); map.needsUpdate = true;
    const site = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0, envMapIntensity: 0.25 }));
    site.rotation.x = -Math.PI / 2; site.receiveShadow = true; scene.add(site);

    // ---------- entorno: lavrado ondulado até o horizonte ----------
    const tile = document.createElement('canvas'); tile.width = tile.height = 512;
    const tg = tile.getContext('2d'), tid = tg.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const n = noise(x / 64, y / 64, 4), f = noise(x / 6, y / 6, 2), i = (y * 512 + x) * 4;
      const k = n * 0.7 + f * 0.3;
      tid.data[i] = 98 + k * 52; tid.data[i + 1] = 104 + k * 42; tid.data[i + 2] = 58 + k * 26; tid.data[i + 3] = 255;
    }
    tg.putImageData(tid, 0, 0);
    const tileTex = new T.CanvasTexture(tile); tileTex.encoding = T.sRGBEncoding; tileTex.wrapS = tileTex.wrapT = T.RepeatWrapping; tileTex.repeat.set(26, 26);
    const OUT = 260, og = new T.PlaneGeometry(OUT, OUT, 180, 180);
    const pos = og.attributes.position, colors = [];
    const heightAt = (x, z) => {
      const r = Math.max(Math.abs(x) / (W * 0.6), Math.abs(z) / (D * 0.6));
      const fall = Math.min(1, Math.max(0, (r - 1) / 1.4));
      return (noise(x / 18 + 50, z / 18 + 50, 4) - 0.45) * 2.2 * fall - 0.015;
    };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = -pos.getY(i);
      pos.setZ(i, heightAt(x, z));
      const g = 0.85 + noise(x / 9, z / 9, 3) * 0.3; colors.push(g, g, g * 0.95);
    }
    og.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    og.computeVertexNormals();
    const outer = new T.Mesh(og, new T.MeshStandardMaterial({ map: tileTex, vertexColors: true, roughness: 1 }));
    outer.rotation.x = -Math.PI / 2; outer.position.y = -0.006; outer.receiveShadow = true; scene.add(outer);

    // ---------- água: Rio Branco, igarapé e alagados ----------
    const waterM = new T.MeshStandardMaterial({ color: 0x41625f, roughness: 0.12, metalness: 0.35, envMapIntensity: 1.1 });
    function ribbon(pts, width, y) {
      const curve = new T.CatmullRomCurve3(pts.map(([x, z]) => new T.Vector3(x, y, z)));
      const n = 160, p = [], idx = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, c = curve.getPoint(t), tg2 = curve.getTangent(t), w = width * (0.85 + noise(t * 9, 3, 2) * 0.3);
        p.push(c.x - tg2.z * w / 2, y, c.z + tg2.x * w / 2, c.x + tg2.z * w / 2, y, c.z - tg2.x * w / 2);
        if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new T.Mesh(g, waterM); m.receiveShadow = true; scene.add(m); return curve;
    }
    const river = ribbon([[-34, -120], [-30, -60], [-36, -20], [-27, 10], [-31, 50], [-24, 120]], 9, 0.02);
    const creek = ribbon([[-26, -11], [-14, -9.5], [-7, -6.6], [-2, -6.2], [3, -6.6], [9, -7.6], [18, -8.5], [34, -12], [70, -16]], 0.55, 0.012);
    const creek2 = ribbon([[8, -7.4], [12, -2], [15, 4], [21, 9], [30, 14], [60, 22]], 0.4, 0.012);

    // ---------- serras no horizonte ----------
    const mg = [], mi = []; const SEG = 160, R = 150;
    for (let i = 0; i <= SEG; i++) {
      const a = i / SEG * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R;
      const h = 4 + noise(a * 3, 1, 4) * 14 + Math.max(0, Math.sin(a * 2 + 1)) * 8;
      mg.push(x, -1, z, x * 1.02, h, z * 1.02);
      if (i < SEG) { const k = i * 2; mi.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const mgeo = new T.BufferGeometry(); mgeo.setAttribute('position', new T.Float32BufferAttribute(mg, 3)); mgeo.setIndex(mi); mgeo.computeVertexNormals();
    scene.add(new T.Mesh(mgeo, new T.MeshBasicMaterial({ color: 0x8e9c9e, fog: true, side: T.DoubleSide })));

    // ---------- vegetação ----------
    const trees = [], palms = [];
    const addTree = (x, z, s, kind) => (kind === 'palm' ? palms : trees).push([x, z, s]);
    // árvores desenhadas na planta
    (window.AV_SCENE.trees || []).forEach(([fx, fy, r]) => { const [x, z] = toWorld(fx, fy); addTree(x, z, Math.min(1.6, Math.max(0.7, r * W / 0.07)), 'tree'); });
    // mata nativa, gramados e áreas comuns do condomínio
    for (let i = 0; i < 26000; i++) {
      const fx = rnd(), fy = rnd(), c = catAt(fx, fy); const [x, z] = toWorld(fx, fy);
      if (c === CAT.forest && rnd() < 0.55) addTree(x, z, 0.8 + rnd() * 0.7, rnd() < 0.08 ? 'palm' : 'tree');
      else if ((c === CAT.common || c === CAT.lawn) && rnd() < 0.02) addTree(x, z, 0.6 + rnd() * 0.5, rnd() < 0.3 ? 'palm' : 'tree');
    }
    // mata ciliar ao longo dos cursos d'água e buritis
    const along = (curve, n, spread, palmRate) => { for (let i = 0; i < n; i++) { const t = rnd(), p = curve.getPoint(t), d = (rnd() - 0.5) * 2 * spread;
      const tg2 = curve.getTangent(t), x = p.x - tg2.z * d, z = p.z + tg2.x * d;
      if (Math.abs(x) < W / 2 && Math.abs(z) < D / 2 && catAt(x / W + 0.5, z / D + 0.5) !== CAT.sav) continue;
      addTree(x, z, 0.8 + rnd() * 0.8, rnd() < palmRate ? 'palm' : 'tree'); } };
    along(creek, 1600, 1.6, 0.25); along(creek2, 900, 1.3, 0.3); along(river, 2600, 9, 0.1);
    // lavrado: árvores esparsas e grupos de buritis nas veredas
    for (let i = 0; i < 1400; i++) {
      const x = (rnd() - 0.5) * 200, z = (rnd() - 0.5) * 200;
      if (Math.abs(x) < W * 0.62 && Math.abs(z) < D * 0.62) continue;
      if (rnd() < 0.65) addTree(x, z, 0.6 + rnd() * 0.6, 'tree');
      else { for (let k = 0; k < 4; k++) addTree(x + (rnd() - 0.5) * 1.2, z + (rnd() - 0.5) * 1.2, 0.9 + rnd() * 0.5, 'palm'); }
    }
    const yAt = (x, z) => (Math.abs(x) < W / 2 && Math.abs(z) < D / 2) ? 0 : heightAt(x, z);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), s3 = new T.Vector3(), col = new T.Color(), up = new T.Vector3(0, 1, 0);
    // árvore: tronco + copa irregular
    const trunkG = new T.CylinderGeometry(0.006, 0.01, 0.07, 5); trunkG.translate(0, 0.035, 0);
    const crownG = new T.IcosahedronGeometry(0.045, 1);
    { const p = crownG.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.82 + noise(p.getX(i) * 40 + 3, p.getZ(i) * 40, 2) * 0.4; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.8, p.getZ(i) * k); } crownG.computeVertexNormals(); }
    crownG.translate(0, 0.1, 0);
    const trunkM = new T.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 1 });
    const crownM = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true, envMapIntensity: 0.15 });
    const tT = new T.InstancedMesh(trunkG, trunkM, trees.length), tC = new T.InstancedMesh(crownG, crownM, trees.length);
    trees.forEach(([x, z, s], i) => {
      v.set(x, yAt(x, z), z); q.setFromAxisAngle(up, rnd() * 6.28); s3.set(s, s * (0.8 + rnd() * 0.5), s);
      m4.compose(v, q, s3); tT.setMatrixAt(i, m4); tC.setMatrixAt(i, m4);
      tC.setColorAt(i, col.setHSL(0.23 + rnd() * 0.07, 0.32 + rnd() * 0.2, 0.08 + rnd() * 0.08));
    });
    // buriti: estipe alto + coroa em leque
    const pTrunkG = new T.CylinderGeometry(0.005, 0.007, 0.16, 5); pTrunkG.translate(0, 0.08, 0);
    const pCrownG = new T.ConeGeometry(0.075, 0.05, 9, 1, true); pCrownG.rotateX(Math.PI); pCrownG.translate(0, 0.175, 0);
    const pT = new T.InstancedMesh(pTrunkG, new T.MeshStandardMaterial({ color: 0x6b604f, roughness: 1 }), palms.length);
    const pC = new T.InstancedMesh(pCrownG, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: T.DoubleSide, flatShading: true, envMapIntensity: 0.15 }), palms.length);
    palms.forEach(([x, z, s], i) => {
      v.set(x, yAt(x, z), z); q.setFromAxisAngle(up, rnd() * 6.28); s3.set(s, s * (0.9 + rnd() * 0.4), s);
      m4.compose(v, q, s3); pT.setMatrixAt(i, m4); pC.setMatrixAt(i, m4);
      pC.setColorAt(i, col.setHSL(0.2 + rnd() * 0.05, 0.38, 0.09 + rnd() * 0.06));
    });
    [tT, tC, pT, pC].forEach((m) => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });

    // ---------- edificações de apoio (portaria, clubes, gourmet) ----------
    const bM = new T.MeshStandardMaterial({ color: 0xF2EBDD, roughness: 0.7 }), rM = new T.MeshStandardMaterial({ color: 0x5b4a3c, roughness: 0.8 });
    [[0.125, 0.86, 0.22, 0.12], [0.165, 0.875, 0.12, 0.08], [0.245, 0.89, 0.14, 0.1], [0.165, 0.55, 0.12, 0.1], [0.16, 0.66, 0.1, 0.09], [0.49, 0.11, 0.12, 0.1]].forEach(([fx, fy, w, d]) => {
      const [x, z] = toWorld(fx, fy);
      const b = new T.Mesh(new T.BoxGeometry(w, 0.05, d), bM); b.position.set(x, 0.025, z); b.castShadow = b.receiveShadow = true; scene.add(b);
      const r = new T.Mesh(new T.BoxGeometry(w * 1.12, 0.012, d * 1.12), rM); r.position.set(x, 0.056, z); r.castShadow = true; scene.add(r);
    });

    // ---------- lotes ----------
    const lots = [], byId = {};
    const edgeM = new T.LineBasicMaterial({ color: 0xF6EEDB, transparent: true, opacity: 0.55, depthWrite: false });
    (window.AVRA_LOTES || []).forEach(([id, m2, poly, c]) => {
      const [cx, cz] = toWorld(c[0], c[1]);
      const shape = new T.Shape();
      for (let i = 0; i < poly.length; i += 2) {
        const [wx, wz] = toWorld(poly[i], poly[i + 1]);
        const x = cx + (wx - cx) * 0.96, z = cz + (wz - cz) * 0.96;
        i ? shape.lineTo(x - cx, -(z - cz)) : shape.moveTo(x - cx, -(z - cz));
      }
      const geo = new T.ShapeGeometry(shape);
      const mat = new T.MeshBasicMaterial({ color: STATUS.disponivel.color, transparent: true, opacity: STATUS.disponivel.op, depthWrite: false });
      const mesh = new T.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2; mesh.position.set(cx, 0.004, cz); mesh.renderOrder = 2;
      mesh.add(new T.LineSegments(new T.EdgesGeometry(geo), edgeM));
      mesh.userData = { id, m2, q: +id.slice(0, 2), n: +id.slice(3), status: 'disponivel' };
      scene.add(mesh); lots.push(mesh); byId[id] = mesh;
    });
    // marcador do lote selecionado
    const pin = new T.Group();
    const beam = new T.Mesh(new T.CylinderGeometry(0.004, 0.004, 0.5, 6), new T.MeshBasicMaterial({ color: SELECTED, transparent: true, opacity: 0.8 })); beam.position.y = 0.25;
    const head = new T.Mesh(new T.SphereGeometry(0.03, 16, 12), new T.MeshStandardMaterial({ color: SELECTED, emissive: SELECTED, emissiveIntensity: 0.5 })); head.position.y = 0.52;
    const ring = new T.Mesh(new T.RingGeometry(0.05, 0.065, 32), new T.MeshBasicMaterial({ color: SELECTED, transparent: true, opacity: 0.9, side: T.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.008;
    pin.add(beam, head, ring); pin.visible = false; scene.add(pin);

    // ---------- luz: fim de tarde ----------
    scene.add(new T.HemisphereLight(0xdfe8ea, 0x4a4a32, 0.55));
    const sun = new T.DirectionalLight(0xffe2bd, 1.75);
    sun.position.copy(sunDir).multiplyScalar(20); sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 50 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.015;
    scene.add(sun, sun.target);

    // ---------- rótulos de contexto ----------
    const labelBox = opts.labels;
    const ctxLabels = [];
    const label = (text, pos, cls) => { if (!labelBox) return; const el = document.createElement('span'); el.className = 'p3-ctx ' + (cls || ''); el.textContent = text; labelBox.appendChild(el); ctxLabels.push({ el, pos: new T.Vector3(...pos) }); };
    label('Rio Branco', [-30, 0.4, 6], 'is-water');
    label('Igarapé Santa Cecília', [-6, 0.4, -6.9], 'is-water');
    label('Portaria', [...(([x, z]) => [x, 0.25, z])(toWorld(0.13, 0.86))]);
    label('Clube', [...(([x, z]) => [x, 0.25, z])(toWorld(0.49, 0.1))]);
    label('Lazer', [...(([x, z]) => [x, 0.25, z])(toWorld(0.16, 0.6))]);
    label('← Boa Vista', [-40, 0.6, 14], 'is-dir');

    // ---------- estado ----------
    let selected = null, hovered = null, onlyAvail = false;
    function paint(m) {
      const u = m.userData, st = STATUS[u.status] || STATUS.disponivel;
      const dim = onlyAvail && u.status !== 'disponivel';
      let c = st.color, op = st.op;
      if (m === selected) { c = SELECTED; op = 0.85; } else if (m === hovered) { op = Math.min(0.9, op + 0.3); }
      if (dim) op *= 0.25;
      if (onlyAvail && u.status === 'disponivel' && m !== selected) op = 0.7;
      m.material.color.setHex(c); m.material.opacity = op;
    }
    const setStatus = (map) => lots.forEach((m) => { m.userData.status = (map && map[m.userData.id]) || 'disponivel'; paint(m); });
    function select(id, focus) {
      const prev = selected; selected = id ? byId[id] || null : null;
      if (prev) paint(prev);
      if (selected) { paint(selected); pin.position.copy(selected.position); pin.visible = true; if (focus) focusOn(selected); } else pin.visible = false;
      opts.onSelect && opts.onSelect(selected ? Object.assign({}, selected.userData) : null);
    }
    const setOnlyAvailable = (b) => { onlyAvail = !!b; lots.forEach(paint); };

    // ---------- câmera ----------
    const HOME = { th: -0.62, ph: 1.13, d: 13 };
    const orb = { th: HOME.th, ph: HOME.ph, d: 20, tth: HOME.th, tph: HOME.ph, td: HOME.d, tx: 0, tz: 0, ttx: 0.3, ttz: 0.4 };
    const DMIN = 1.2, DMAX = 34;
    let drag = null, idle = 0, auto = true;
    function focusOn(m) { orb.ttx = m.position.x; orb.ttz = m.position.z; orb.td = Math.min(orb.td, 4); orb.tph = Math.min(orb.tph, 0.95); auto = false; }
    function reset() { orb.ttx = 0.3; orb.ttz = 0.4; orb.td = camera.aspect < 1 ? 21 : HOME.d; orb.tph = HOME.ph; orb.tth = HOME.th; }
    function zoom(f) { orb.td = Math.max(DMIN, Math.min(DMAX, orb.td * f)); auto = false; }
    function top() { const toTop = orb.tph > 0.3; orb.tph = toTop ? 0.06 : HOME.ph; if (toTop) orb.tth = 0; auto = false; }

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
      drag = { x: e.clientX, y: e.clientY, th: orb.tth, ph: orb.tph, moved: false, pan: e.button === 2 || e.shiftKey }; auto = false;
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
          const k = orb.d * 0.0011, s = Math.sin(orb.th), c = Math.cos(orb.th);
          orb.ttx -= (ddx * c + ddy * s) * k; orb.ttz -= (-ddx * s + ddy * c) * k;
          drag.x = e.clientX; drag.y = e.clientY;
        } else {
          orb.tth = drag.th - ddx * 0.005;
          orb.tph = Math.max(0.06, Math.min(1.35, drag.ph - ddy * 0.004));
        }
        idle = 0; return;
      }
      const m = pick(e);
      if (m !== hovered) { const p = hovered; hovered = m; if (p) paint(p); if (m) paint(m); canvas.style.cursor = m ? 'pointer' : 'grab'; }
      opts.onHover && opts.onHover(m ? m.userData : null, e);
    });
    const end = (e) => {
      pointers.delete(e.pointerId); pinch = 0;
      if (drag && !drag.moved && e.type === 'pointerup') { const m = pick(e); if (m) select(m.userData.id, false); }
      drag = null;
    };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', () => { if (hovered) { const p = hovered; hovered = null; paint(p); } opts.onHover && opts.onHover(null); });
    canvas.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoom(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
    canvas.addEventListener('dblclick', (e) => { const m = pick(e); if (m) select(m.userData.id, true); });

    function resize() {
      const r = host.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      const sh = opts.shift ? opts.shift(r.width) : 0;
      if (sh) camera.setViewOffset(r.width, r.height, -sh, 0, r.width, r.height); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      if (auto) orb.td = camera.aspect < 1 ? 21 : HOME.d;
    }
    window.addEventListener('resize', resize); resize();

    let visible = true;
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(host);
    const clock = new T.Clock(), pv = new T.Vector3();
    (function frame() {
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, clock.getDelta());
      if (!visible) return;
      const t = clock.elapsedTime;
      idle += dt;
      if (auto && !drag && idle > 3) orb.tth += dt * 0.025;
      const k = 0.07;
      orb.th += (orb.tth - orb.th) * k; orb.ph += (orb.tph - orb.ph) * k; orb.d += (orb.td - orb.d) * k;
      orb.tx += (orb.ttx - orb.tx) * k; orb.tz += (orb.ttz - orb.tz) * k;
      camera.position.set(orb.tx + Math.sin(orb.th) * Math.sin(orb.ph) * orb.d, Math.max(0.15, Math.cos(orb.ph) * orb.d), orb.tz + Math.cos(orb.th) * Math.sin(orb.ph) * orb.d);
      camera.lookAt(orb.tx, 0, orb.tz);
      // sombra acompanha a área vista
      sun.target.position.set(orb.tx, 0, orb.tz); sun.position.copy(sunDir).multiplyScalar(20).add(sun.target.position);
      if (pin.visible) { head.position.y = 0.52 + Math.sin(t * 2.4) * 0.02; ring.scale.setScalar(1 + (t * 0.8 % 1) * 0.8); ring.material.opacity = 0.9 * (1 - (t * 0.8 % 1)); }
      renderer.render(scene, camera);
      if (ctxLabels.length) {
        const r = canvas.getBoundingClientRect();
        ctxLabels.forEach((l) => {
          pv.copy(l.pos).project(camera);
          const off = pv.z > 1 || Math.abs(pv.x) > 1.1 || Math.abs(pv.y) > 1.1;
          l.el.style.opacity = off ? 0 : 1;
          if (!off) l.el.style.transform = `translate(${(pv.x * 0.5 + 0.5) * r.width}px, ${(-pv.y * 0.5 + 0.5) * r.height}px) translate(-50%, -50%)`;
        });
      }
    })();

    return { setStatus, select, setOnlyAvailable, zoom, reset, top, resize, focus: (id) => byId[id] && focusOn(byId[id]), STATUS };
  }

  window.AVRAPlan3D = { init, STATUS };
})();
