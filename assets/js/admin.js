/* =========================================================
   Admin de lotes — lê e grava data/lotes.json no repositório
   do site via API do GitHub (token guardado só no navegador).
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const LOTES = window.AVRA_LOTES || [];
  const PATH = 'data/lotes.json';
  const KEY = 'avra-admin';
  const IMG_W = 2600, IMG_H = 2298;

  $$('.js-logo path').forEach((p) => { p.setAttribute('d', AVRA_LOGO.d); p.setAttribute('fill-rule', 'evenodd'); });

  let status = {}, sha = null, brush = 'disponivel', cfg = null, dirty = false;
  const store = { get() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } },
    set(v) { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch (e) {} } };

  // ---------- base64 UTF-8 ----------
  const b64enc = (str) => { const b = new TextEncoder().encode(str); let s = ''; b.forEach((c) => { s += String.fromCharCode(c); }); return btoa(s); };
  const b64dec = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

  // ---------- GitHub ----------
  async function gh(method, body) {
    const r = await fetch(`https://api.github.com/repos/${cfg.repo}/contents/${PATH}` + (method === 'GET' ? `?ref=${encodeURIComponent(cfg.branch)}` : ''), {
      method, headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (r.status === 404 && method === 'GET') return null;
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(r.status === 401 ? 'Token inválido ou expirado.' : r.status === 403 ? 'O token não tem permissão de escrita neste repositório.' : r.status === 409 ? 'O arquivo mudou no GitHub desde que você abriu. Recarregue a página.' : (j.message || 'Erro ' + r.status));
    return j;
  }
  async function loadRemote() {
    const j = await gh('GET');
    if (!j) { sha = null; return {}; }
    sha = j.sha;
    return JSON.parse(b64dec(j.content));
  }
  async function loadPublic() {
    const r = await fetch('../' + PATH + '?v=' + Date.now(), { cache: 'no-store' });
    return r.ok ? r.json() : {};
  }

  // ---------- estado ----------
  const msg = (el, t, kind) => { el.textContent = t; el.className = 'a-msg' + (kind ? ' is-' + kind : ''); };
  function setDirty(v) { dirty = v; document.body.classList.toggle('is-dirty', v); $('#publish').disabled = !v || !cfg; }
  function apply(data) { status = Object.assign({}, (data && data.status) || {}); renderAll(); setDirty(false); }
  function set(id, s) {
    if ((status[id] || 'disponivel') === s) return;
    if (s === 'disponivel') delete status[id]; else status[id] = s;
    paintLot(id); counts(); quadraCounts(+id.slice(0, 2)); setDirty(true);
  }

  // ---------- mapa ----------
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${IMG_W} ${IMG_H}`);
  const bg = document.createElementNS(NS, 'image');
  bg.setAttribute('href', '../assets/photos/alta-vista-implantacao.jpg'); bg.setAttribute('width', IMG_W); bg.setAttribute('height', IMG_H);
  svg.appendChild(bg);
  const gLots = document.createElementNS(NS, 'g'), gLbl = document.createElementNS(NS, 'g');
  svg.append(gLots, gLbl);
  $('#map').appendChild(svg);
  const els = {}, lbls = {};
  LOTES.forEach(([id, m2, poly, c]) => {
    const p = document.createElementNS(NS, 'polygon');
    const pts = []; for (let i = 0; i < poly.length; i += 2) pts.push((poly[i] * IMG_W).toFixed(1) + ',' + (poly[i + 1] * IMG_H).toFixed(1));
    p.setAttribute('points', pts.join(' ')); p.setAttribute('class', 'lot'); p.dataset.id = id;
    const t = document.createElementNS(NS, 'title'); t.textContent = `Quadra ${+id.slice(0, 2)} · Lote ${+id.slice(3)} · ≈${m2} m²`; p.appendChild(t);
    gLots.appendChild(p); els[id] = p;
    const tx = document.createElementNS(NS, 'text');
    tx.setAttribute('x', (c[0] * IMG_W).toFixed(1)); tx.setAttribute('y', (c[1] * IMG_H + 3).toFixed(1));
    tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('class', 'lbl'); tx.textContent = +id.slice(3);
    gLbl.appendChild(tx); lbls[id] = tx;
  });
  function paintLot(id) {
    const s = status[id] || 'disponivel';
    els[id].setAttribute('class', 'lot s-' + s);
    lbls[id].setAttribute('class', 'lbl' + (s === 'vendido' ? ' lbl--v' : ''));
    const b = $(`.q-lots button[data-id="${id}"]`); if (b) b.className = 's-' + s;
  }
  let painting = false;
  svg.addEventListener('pointerdown', (e) => { const id = e.target.dataset && e.target.dataset.id; if (!id) return; painting = true; svg.setPointerCapture(e.pointerId); set(id, brush); e.preventDefault(); });
  svg.addEventListener('pointermove', (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY), id = el && el.dataset && el.dataset.id;
    $('#hoverInfo').textContent = id ? `Quadra ${+id.slice(0, 2)} · Lote ${+id.slice(3)} · ${({ disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido' })[status[id] || 'disponivel']}` : '';
    if (painting && id) set(id, brush);
  });
  const stop = () => { painting = false; };
  svg.addEventListener('pointerup', stop); svg.addEventListener('pointercancel', stop);
  $('#showNums').addEventListener('change', (e) => { gLbl.style.display = e.target.checked ? '' : 'none'; });
  $('#showPlan').addEventListener('change', (e) => { bg.style.display = e.target.checked ? '' : 'none'; });
  $$('#brush button').forEach((b) => b.addEventListener('click', () => { brush = b.dataset.s; $$('#brush button').forEach((x) => x.classList.toggle('is-on', x === b)); }));

  // ---------- lista por quadra ----------
  const byQ = {};
  LOTES.forEach((l) => { const q = +l[0].slice(0, 2); (byQ[q] = byQ[q] || []).push(l[0]); });
  const qList = $('#qList');
  Object.keys(byQ).map(Number).sort((a, b) => a - b).forEach((q) => {
    const d = document.createElement('details'); d.className = 'q-item';
    d.innerHTML = `<summary><span>Quadra ${String(q).padStart(2, '0')}</span><small data-q="${q}"></small></summary>
      <div class="q-bulk"><button data-s="disponivel">Todos disponíveis</button><button data-s="reservado">Todos reservados</button><button data-s="vendido">Todos vendidos</button></div>
      <div class="q-lots">${byQ[q].map((id) => `<button data-id="${id}" title="Lote ${id}">${+id.slice(3)}</button>`).join('')}</div>`;
    qList.appendChild(d);
    $$('.q-bulk button', d).forEach((b) => b.addEventListener('click', () => byQ[q].forEach((id) => set(id, b.dataset.s))));
    $$('.q-lots button', d).forEach((b) => b.addEventListener('click', () => {
      const order = ['disponivel', 'reservado', 'vendido'];
      set(b.dataset.id, order[(order.indexOf(status[b.dataset.id] || 'disponivel') + 1) % 3]);
    }));
  });
  function quadraCounts(q) {
    const ids = byQ[q]; const v = ids.filter((id) => status[id] === 'vendido').length, r = ids.filter((id) => status[id] === 'reservado').length;
    $(`small[data-q="${q}"]`).textContent = `${ids.length - v - r} disp. · ${r} res. · ${v} vend.`;
  }
  function counts() {
    const c = { disponivel: 0, reservado: 0, vendido: 0 };
    LOTES.forEach((l) => c[status[l[0]] || 'disponivel']++);
    $('#sDisp').textContent = c.disponivel; $('#sRes').textContent = c.reservado; $('#sVen').textContent = c.vendido; $('#sTot').textContent = LOTES.length;
  }
  function renderAll() { LOTES.forEach((l) => paintLot(l[0])); counts(); Object.keys(byQ).forEach((q) => quadraCounts(+q)); }

  // ---------- publicar ----------
  $('#publish').addEventListener('click', async () => {
    if (!cfg) return;
    const btn = $('#publish'); btn.disabled = true; msg($('#pubMsg'), 'Publicando…');
    const clean = {}; Object.keys(status).sort().forEach((k) => { if (status[k] !== 'disponivel') clean[k] = status[k]; });
    const data = { atualizado: new Date().toISOString(), status: clean };
    try {
      const j = await gh('PUT', { message: 'Atualiza disponibilidade dos lotes do Residencial Alta Vista', content: b64enc(JSON.stringify(data, null, 2) + '\n'), branch: cfg.branch, sha: sha || undefined });
      sha = j.content.sha; setDirty(false);
      msg($('#pubMsg'), 'Publicado. O site mostra a nova disponibilidade em cerca de 1 minuto.', 'ok');
    } catch (e) { btn.disabled = false; msg($('#pubMsg'), e.message, 'err'); }
  });
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- backup ----------
  $('#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ atualizado: new Date().toISOString(), status }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'lotes-alta-vista.json'; a.click();
  });
  $('#import').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); status = Object.assign({}, d.status || {}); renderAll(); setDirty(true); msg($('#pubMsg'), 'Arquivo importado. Revise e publique.', 'ok'); }
    catch (err) { msg($('#pubMsg'), 'Arquivo inválido.', 'err'); }
  });

  // ---------- conexão ----------
  async function connect(c, silent) {
    cfg = c; msg($('#loginMsg'), 'Conectando…');
    try {
      apply(await loadRemote());
      $('#login').hidden = true; setDirty(false);
      msg($('#pubMsg'), `Conectado a ${c.repo}.`, 'ok');
      return true;
    } catch (e) { cfg = null; if (!silent) msg($('#loginMsg'), e.message, 'err'); return false; }
  }
  $('#connect').addEventListener('click', async () => {
    const c = { token: $('#token').value.trim(), repo: $('#repo').value.trim(), branch: $('#branch').value.trim() || 'main' };
    if (!c.token) { msg($('#loginMsg'), 'Cole o token do GitHub.', 'err'); return; }
    if (await connect(c)) store.set($('#remember').checked ? c : null);
  });
  $('#viewOnly').addEventListener('click', async () => { apply(await loadPublic().catch(() => ({}))); msg($('#loginMsg'), 'Modo visualização: as alterações não podem ser publicadas.'); });

  (async () => {
    const saved = store.get();
    if (saved) { $('#repo').value = saved.repo; $('#branch').value = saved.branch; if (await connect(saved, true)) return; }
    apply(await loadPublic().catch(() => ({})));
  })();
})();
