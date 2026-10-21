/* =========================================================
   Hero 3D — a assinatura AVRA extrudada, com face marfim e
   laterais em dourado suave. Luzes quentes seguem o cursor,
   arrastar gira a marca com inércia, e um plano de recorte
   "constrói" a assinatura da esquerda para a direita.
   ========================================================= */
(function () {
  'use strict';
  // cores hexadecimais em sRGB (paleta da marca fiel na renderização)
  if (window.THREE && THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;

  /* ---------- SVG path (M/L/C/Z absolutos) → THREE.Shape[] ---------- */
  function logoShapes(scale) {
    const L = window.AVRA_LOGO;
    const [vx, vy, vw, vh] = L.viewBox;
    const cx = vx + vw / 2, cy = vy + vh / 2;
    const tok = L.d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
    const sp = new THREE.ShapePath();
    let i = 0, cmd = null;
    const X = (v) => (v - cx) * scale, Y = (v) => -(v - cy) * scale;
    const num = () => parseFloat(tok[i++]);
    while (i < tok.length) {
      const t = tok[i];
      if (/[MLCZ]/i.test(t)) { cmd = t.toUpperCase(); i++; if (cmd === 'Z') { sp.currentPath && sp.currentPath.closePath && sp.currentPath.closePath(); } continue; }
      if (cmd === 'M') { sp.moveTo(X(num()), Y(num())); cmd = 'L'; }
      else if (cmd === 'L') sp.lineTo(X(num()), Y(num()));
      else if (cmd === 'C') { const a = X(num()), b = Y(num()), c = X(num()), d = Y(num()), e = X(num()), f = Y(num()); sp.bezierCurveTo(a, b, c, d, e, f); }
      else i++;
    }
    const shapes = sp.toShapes(false);
    return { shapes, width: vw * scale, height: vh * scale };
  }

  /* ---------- ambiente de reflexo (estúdio simples) ---------- */
  function studioEnv(renderer, warm) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(warm ? 0x2a2018 : 0x14201b);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mk = (color, intensity, pos, scl) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) }));
      m.position.set(...pos); m.scale.set(...scl); scene.add(m);
    };
    mk(0xfff1dc, 9, [0, 9, 0], [14, 0.1, 6]);          // softbox superior
    mk(0xffd9b0, 6, [-9, 2, 3], [0.1, 6, 8]);          // janela quente
    mk(0xc99073, 3, [9, 1, -2], [0.1, 5, 7]);          // rebatedor argila
    mk(0xb6a078, 4, [0, 1, -9], [12, 4, 0.1]);         // fundo dourado
    mk(0x263b32, 2, [0, -6, 0], [20, 0.1, 20]);        // piso verde
    const pm = new THREE.PMREMGenerator(renderer);
    const rt = pm.fromScene(scene, 0.04);
    pm.dispose();
    return rt.texture;
  }

  function initHero() {
    const canvas = document.getElementById('heroGL');
    if (!canvas || !window.THREE) return null;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { canvas.style.display = 'none'; return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.localClippingEnabled = true;

    const scene = new THREE.Scene();
    scene.environment = studioEnv(renderer);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 20);

    /* ---------- geometria ---------- */
    const S = 11 / 3441;                        // assinatura com 11 unidades de largura
    const { shapes } = logoShapes(S);
    const depth = 0.42;
    const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.035, bevelSegments: 5, curveSegments: 10 });
    geo.translate(0, 0, -depth / 2);
    geo.computeVertexNormals();

    const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -6.5);
    const face = new THREE.MeshPhysicalMaterial({ color: 0xF2EBDD, roughness: 0.42, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color(0xffe8c8), clippingPlanes: [clip], envMapIntensity: 0.9 });
    const side = new THREE.MeshPhysicalMaterial({ color: 0xB6A078, roughness: 0.28, metalness: 0.95, clearcoat: 0.3, clippingPlanes: [clip], envMapIntensity: 1.25 });
    const mesh = new THREE.Mesh(geo, [face, side]);

    const group = new THREE.Group();
    const tilt = new THREE.Group();
    tilt.add(mesh);
    group.add(tilt);
    scene.add(group);

    // feixe de luz que "desenha" a marca
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe2b8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 3.2), beamMat);
    const beamGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.6), new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0xffcf9a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    tilt.add(beam, beamGlow);

    // poeira de luz (partículas suspensas — profundidade de campo)
    const dust = makeDust(260);
    scene.add(dust);

    /* ---------- luzes ---------- */
    scene.add(new THREE.AmbientLight(0x30453b, 0.6));
    const key = new THREE.DirectionalLight(0xfff0dc, 1.6); key.position.set(-4, 6, 8); scene.add(key);
    const warm = new THREE.PointLight(0xC99073, 18, 30, 2); warm.position.set(4, -2, 5); scene.add(warm);
    const gold = new THREE.PointLight(0xffd7a0, 14, 30, 2); gold.position.set(-5, 3, 4); scene.add(gold);
    const rim = new THREE.DirectionalLight(0xA6533C, 1.4); rim.position.set(6, 2, -6); scene.add(rim);

    /* ---------- interação ---------- */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const spin = { y: 0, v: 0, dragging: false, lastX: 0 };
    let hover = 0, hoverT = 0;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const host = document.getElementById('hero');

    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      ndc.set(pointer.tx, -pointer.ty);
      if (spin.dragging) {
        const dx = e.clientX - spin.lastX;
        spin.v = dx * 0.006; spin.y += spin.v; spin.lastX = e.clientX;
      }
    });
    host.addEventListener('pointerenter', () => { st.inside = true; });
    host.addEventListener('pointerleave', () => { st.inside = false; });
    canvas.addEventListener('pointerdown', (e) => { spin.dragging = true; spin.lastX = e.clientX; canvas.setPointerCapture(e.pointerId); document.body.classList.add('is-dragging'); });
    const up = () => { spin.dragging = false; document.body.classList.remove('is-dragging'); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

    /* ---------- resize ---------- */
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // enquadra a assinatura pela largura em telas estreitas
      const fitW = 13.2 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      camera.position.z = Math.max(20, fitW);
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    /* ---------- estado controlado por scroll/intro ---------- */
    const st = { reveal: 0, scroll: 0, visible: true, intro: 0 };
    const io = new IntersectionObserver((en) => { st.visible = en[0].isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    const clock = new THREE.Clock();
    function frame() {
      requestAnimationFrame(frame);
      if (!st.visible) return;
      const t = clock.getElapsedTime();
      pointer.x += (pointer.tx - pointer.x) * 0.035;
      pointer.y += (pointer.ty - pointer.y) * 0.035;

      if (!spin.dragging) { spin.v *= 0.95; spin.y += spin.v; spin.y *= 0.985; }

      // hover via raycast
      ray.setFromCamera(ndc, camera);
      hoverT = st.inside && ray.intersectObject(mesh).length ? 1 : 0;
      hover += (hoverT - hover) * 0.08;
      document.body.classList.toggle('hero-hover', hoverT === 1);

      // construção: plano de recorte varre da esquerda para a direita
      const rx = -6.2 + st.reveal * 12.6;
      clip.constant = rx;
      beam.position.set(rx, 0, 0.3); beamGlow.position.set(rx, 0, 0.2);
      const beamA = st.reveal > 0.001 && st.reveal < 0.999 ? 1 : 0;
      beamMat.opacity += (beamA * 0.9 - beamMat.opacity) * 0.2;
      beamGlow.material.opacity = beamMat.opacity * 0.8;

      const sc = st.scroll;
      group.rotation.y = pointer.x * 0.42 + spin.y + Math.sin(t * 0.25) * 0.06 + sc * 0.9;
      group.rotation.x = pointer.y * 0.28 + Math.sin(t * 0.3) * 0.04 - sc * 0.5;
      group.position.y = Math.sin(t * 0.45) * 0.08 + 0.55 + sc * 2.6;
      group.position.z = -sc * 6;
      const s = 1 + hover * 0.035;
      tilt.scale.set(s, s, s);

      warm.position.set(pointer.x * 7, -pointer.y * 4 - 1, 5);
      gold.position.set(-pointer.x * 6 - 2, 3 - pointer.y * 2, 4.5);
      warm.intensity = 18 + hover * 14;

      dust.rotation.y = t * 0.006 + pointer.x * 0.1;
      dust.rotation.x = pointer.y * 0.08;
      dust.material.uniforms.uTime.value = t;

      renderer.render(scene, camera);
    }
    frame();
    return st;
  }

  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    return t;
  }

  // partículas com desfoque por profundidade (bokeh) em shader
  function makeDust(n, size) {
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22 - 2;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uFocus: { value: 20 }, uSize: { value: size || 1 } },
      vertexShader: `
        attribute float seed; uniform float uTime; uniform float uFocus; uniform float uSize; varying float vA; varying float vB;
        void main(){
          vec3 p = position;
          p.x += sin(uTime*0.06 + seed*40.0)*0.8 + uTime*0.035*(0.5+seed);
          p.x = mod(p.x + 15.0, 30.0) - 15.0;
          p.y += cos(uTime*0.08 + seed*20.0)*0.5;
          vec4 mv = modelViewMatrix * vec4(p,1.0);
          float d = abs(-mv.z - uFocus);
          vB = clamp(d/10.0, 0.0, 1.0);
          gl_PointSize = (2.0 + vB*26.0) * (18.0 / -mv.z) * uSize;
          vA = (0.55 - vB*0.42) * (0.4 + seed*0.6);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vA; varying float vB;
        void main(){
          float r = length(gl_PointCoord-0.5);
          float edge = mix(0.48, 0.2, vB);
          float a = smoothstep(0.5, edge, r) * vA;
          gl_FragColor = vec4(1.0, 0.86, 0.68, a);
        }`
    });
    return new THREE.Points(g, m);
  }

  window.AVRA3D = { logoShapes, studioEnv, glowTexture, makeDust, initHero };
})();
