/* Version C – nyt design: valgaften (live), kredse og kandidater, ny header og burgermenu.
   Indlæses før app.js; app.js kalder VX.init(), når fælles hjælpere (window.VH) er klar.
   ALLE tal og ALLE kandidatnavne er EKSEMPELDATA / fiktive (se tools/generate_data.py og tools/generate_kandidater.py). */
(function () {
  'use strict';
  window.VX = { init };

  function init() {
    const H = window.VH;
    const { h, s, fmtN, fmtP, sgn, crumb, href, resultHref, log, csv, download, shareBtn, printBtn, autocomplete, D, KOM, byId, ELS, REG, norm, ikkeMed, dDelta } = H;
    const K = window.KAND, FV = K.fv, KV = 'kv2025', PREV = ELS[KV].prev, PG = window.PAGES;
    const enc = encodeURIComponent;
    const $ = (sel, root) => (root || document).querySelector(sel);
    const lc = t => String(t).toLowerCase().replace(/aa/g, 'å');
    const pl = (p, cls) => h('span', { class: 'pletter ' + (cls || ''), style: `background:${D.parties[p].color}`, 'aria-hidden': 'true' }, p);
    const PN = p => D.parties[p].name;
    const POL = FV.polOrder;
    const vname = v => v === 'fv' ? FV.name : ELS[v].name;

    /* ---------- datastrukturer ---------- */
    const kredsById = Object.fromEntries(FV.kredse.map(k => [k.id, k]));
    const skById = Object.fromEntries(FV.storkredse.map(x => [x.id, x]));
    const komToKreds = {};
    FV.kredse.forEach(k => k.kom.forEach(id => (komToKreds[id] = komToKreds[id] || []).push(k.id)));
    const allKV = [];
    KOM.forEach(k => {
      const lists = K.kv2025[k.id] || {}, R = k.results[KV];
      Object.keys(lists).forEach(p => {
        const m = R.mandates[p] || 0;
        lists[p].forEach((c, i) => allKV.push({ t: 'kv', name: c[0], p, votes: c[1], i, kom: k.id, komName: k.name, region: k.region, elected: i < m, share: c[1] / R.valid * 100, href: `#/kandidat/kv/${k.id}/${enc(p)}/${i}` }));
      });
    });
    const allFV = [];
    FV.kredse.forEach(k => Object.keys(k.c).forEach(p => {
      const c = k.c[p];
      allFV.push({ t: 'fv', name: c[0], p, votes: c[1], st: c[2], elected: !!c[2], kreds: k.id, kredsName: k.name, sk: k.sk, skName: skById[k.sk].name, share: c[1] / k.valid * 100, href: `#/kandidat/fv/${k.id}/${enc(p)}` });
    }));
    const statusTxt = c => c.t === 'kv' ? (c.elected ? 'Valgt' : 'Ikke valgt') : c.st === 1 ? 'Valgt – kredsmandat' : c.st === 2 ? 'Valgt – tillægsmandat' : 'Ikke valgt';
    const chip = c => h('span', { class: 'st ' + (c.elected ? 'yes' : 'no') }, c.elected ? '✓ ' + statusTxt(c) : statusTxt(c));
    const TOTAL_SEATS = KOM.reduce((t, k) => t + k.seats, 0);
    const ALL_CAST = KOM.reduce((t, k) => t + k.results[KV].cast, 0);
    const turnoutOf = list => { const e = list.reduce((t, k) => t + k.electorate, 0); return e ? list.reduce((t, k) => t + k.cast, 0) / e * 100 : 0; };
    const bigOfVotes = v => Object.keys(v).reduce((a, b) => v[b] > v[a] ? b : a);

    /* ---------- live-optælling (simulation) ---------- */
    const LIVE = { on: false, paused: false, n: 0, set: new Set(), subs: new Set(), timer: null, order: null, said: 0 };
    function liveOrder() {
      if (!LIVE.order) {
        let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        LIVE.order = KOM.map(k => [k.id, k.results[KV].electorate * (0.55 + rnd() * 0.9)]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
      }
      return LIVE.order;
    }
    const isCounted = id => !LIVE.on || LIVE.set.has(id);
    const notify = () => LIVE.subs.forEach(f => f());
    function setN(n) { LIVE.n = Math.max(0, Math.min(KOM.length, n)); LIVE.set = new Set(liveOrder().slice(0, LIVE.n)); }
    function stopTimer() { clearInterval(LIVE.timer); LIVE.timer = null; }
    function runTimer() {
      stopTimer();
      if (!LIVE.on || LIVE.paused || LIVE.n >= KOM.length) return;
      LIVE.timer = setInterval(() => {
        setN(LIVE.n + 2 + Math.floor(Math.random() * 3));
        if (LIVE.n >= KOM.length) stopTimer();
        notify();
      }, 1200);
    }
    const live = {
      start() { LIVE.on = true; LIVE.paused = false; LIVE.said = 0; setN(0); log('live', 'start'); notify(); runTimer(); },
      pause() { LIVE.paused = !LIVE.paused; notify(); runTimer(); },
      skip() { setN(KOM.length); stopTimer(); notify(); },
      stop() { LIVE.on = false; LIVE.paused = false; stopTimer(); setN(KOM.length); notify(); },
    };
    const simClock = () => { const min = Math.round(LIVE.n / KOM.length * 330), hh = (20 + Math.floor(min / 60)) % 24, mm = min % 60; return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };

    function kvAgg() {
      const list = KOM.filter(k => isCounted(k.id)), o = { list, m: {}, m0: {}, v: {}, seats: 0, cast: 0, elec: 0, valid: 0 };
      list.forEach(k => {
        const R = k.results[KV], P = k.results[PREV];
        o.seats += k.seats; o.cast += R.cast; o.elec += R.electorate; o.valid += R.valid;
        Object.keys(R.mandates).forEach(p => { o.m[p] = (o.m[p] || 0) + R.mandates[p]; });
        Object.keys(P.mandates).forEach(p => { o.m0[p] = (o.m0[p] || 0) + P.mandates[p]; });
        Object.keys(R.votes).forEach(p => { o.v[p] = (o.v[p] || 0) + R.votes[p]; });
      });
      return o;
    }
    const fvAgg = () => {
      const m = {}, d = {};
      Object.keys(FV.nationalSeats).forEach(p => { const x = FV.nationalSeats[p]; if (x.kreds + x.tillaeg) { m[p] = x.kreds + x.tillaeg; d[p] = x; } });
      return { m, d };
    };

    /* ---------- hemicycle (halvcirkel med mandater) ---------- */
    function hemicycle(seats, { W = 600, label = '' } = {}) {
      const n = seats.length, rows = n > 120 ? 7 : n > 60 ? 5 : 3, r0 = 0.4, R = W / 2 - 12, cx = W / 2, cy = R + 14, Hh = cy + 18;
      const radii = Array.from({ length: rows }, (_, i) => r0 + (1 - r0) * (rows === 1 ? 1 : i / (rows - 1)));
      const sumR = radii.reduce((a, b) => a + b, 0);
      const counts = radii.map(r => Math.round(n * r / sumR));
      let diff = n - counts.reduce((a, b) => a + b, 0);
      for (let i = rows - 1; diff !== 0; i = (i - 1 + rows) % rows) { counts[i] += Math.sign(diff); diff -= Math.sign(diff); }
      const gap = (1 - r0) * R / Math.max(1, rows - 1), dotR = Math.min(gap * 0.43, Math.PI * radii[0] * R / Math.max(1, counts[0] - 1) * 0.43);
      const pos = [];
      radii.forEach((r, i) => { const c = counts[i]; for (let j = 0; j < c; j++) { const th = c === 1 ? Math.PI / 2 : Math.PI - Math.PI * j / (c - 1); pos.push({ th, r: r * R }); } });
      pos.sort((a, b) => b.th - a.th || a.r - b.r);
      const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'hemi', role: 'img', 'aria-label': label || `Mandatfordeling, ${n} mandater` });
      const dots = [];
      seats.forEach((st, i) => {
        const q = pos[i], c = s('circle', { cx: (cx + q.r * Math.cos(q.th)).toFixed(1), cy: (cy - q.r * Math.sin(q.th)).toFixed(1), r: dotR.toFixed(1), fill: D.parties[st.p].color, 'data-p': st.p, class: 'seat' + (st.href ? ' link' : '') });
        if (st.title) c.append(s('title', {}, st.title));
        if (st.href) c.addEventListener('click', () => { location.hash = st.href; });
        svg.append(c); dots.push(c);
      });
      svg.append(s('text', { x: cx, y: cy - 22, 'text-anchor': 'middle', class: 'hemi-n' }, String(n)));
      svg.append(s('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', class: 'hemi-l' }, 'mandater'));
      svg.focusParty = p => dots.forEach(c => { c.style.opacity = !p || c.dataset.p === p ? '' : '.16'; });
      return svg;
    }
    function mbar(rows, label) {
      return h('div', { class: 'mbar', role: 'img', 'aria-label': label || 'Mandatfordeling: ' + rows.map(r => `${r.p} ${r.m}`).join(', ') },
        rows.map(r => h('span', { style: `flex:${r.m} 1 0;background:${D.parties[r.p].color}`, title: `${r.p} – ${PN(r.p)}: ${r.m} mandater` }, r.m >= 3 ? r.p : '')));
    }
    function legendRows(m, m0, extra, focus) {
      const rows = Object.keys(m).filter(p => m[p] > 0).sort((a, b) => m[b] - m[a] || a.localeCompare(b, 'da'));
      const tot = rows.reduce((t, p) => t + m[p], 0) || 1;
      return h('ol', { class: 'mlist' }, rows.map(p => {
        const d = m0 ? m[p] - (m0[p] || 0) : null;
        const li = h('li', {}, h('a', { href: href('/parti/' + enc(p), { valg: KV }), class: 'ml-name' }, pl(p), h('span', {}, PN(p))),
          h('span', { class: 'ml-bar' }, h('i', { style: `width:${m[p] / tot * 100}%;background:${D.parties[p].color}` })),
          h('strong', { class: 'ml-n' }, fmtN(m[p])),
          extra ? h('small', { class: 'ml-x' }, extra(p)) : d != null ? h('small', { class: 'ml-x' }, dDelta(d, '', 0)) : null);
        if (focus) { li.addEventListener('mouseenter', () => focus(p)); li.addEventListener('mouseleave', () => focus(null)); }
        return li;
      }));
    }

    /* ---------- lag: modal og sidepanel ---------- */
    let layerOpen = null;
    function openLayer({ label, side, content, onClose }) {
      closeLayer();
      const opener = document.activeElement;
      const back = h('div', { class: 'backdrop' });
      const panel = h('div', { class: 'layer ' + (side ? 'side' : 'modal'), role: 'dialog', 'aria-modal': 'true', 'aria-label': label }, content);
      const wrap = h('div', { class: 'layer-wrap' }, back, panel);
      document.body.append(wrap); document.body.classList.add('noscroll');
      const focusables = () => [...panel.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(e => !e.hidden && e.offsetParent !== null);
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); closeLayer(); }
        else if (e.key === 'Tab') { const f = focusables(); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
      };
      document.addEventListener('keydown', onKey);
      back.addEventListener('click', () => closeLayer());
      requestAnimationFrame(() => { wrap.classList.add('in'); const f = panel.querySelector('[data-autofocus]') || focusables()[0]; if (f) f.focus(); });
      layerOpen = { wrap, onKey, opener, onClose };
      return layerOpen;
    }
    function closeLayer() {
      if (!layerOpen) return;
      const { wrap, onKey, opener, onClose } = layerOpen; layerOpen = null;
      document.removeEventListener('keydown', onKey); document.body.classList.remove('noscroll');
      wrap.remove(); if (onClose) onClose();
      if (opener && opener.focus && document.contains(opener)) opener.focus();
      const bb = $('#burgerBtn'); if (bb) bb.setAttribute('aria-expanded', 'false');
    }
    const closeBtn = () => h('button', { class: 'layer-x', type: 'button', 'aria-label': 'Luk', onclick: () => closeLayer() }, '×');

    /* ---------- søgning på tværs (kandidater, kredse, områder, partier) ---------- */
    function candSearch(q, valg, n) {
      const t = lc(q).trim(); if (t.length < 2) return [];
      const pool = valg === 'fv' ? allFV : valg === KV ? allKV : allKV.concat(allFV);
      const hit = [], rest = [];
      for (const c of pool) { const nm = lc(c.name); if (nm.startsWith(t) || nm.split(' ').some(w => w.startsWith(t))) hit.push(c); else if (nm.includes(t)) rest.push(c); if (hit.length >= 60) break; }
      return hit.concat(rest).sort((a, b) => b.elected - a.elected || b.votes - a.votes).slice(0, n || 6);
    }
    const candItem = c => ({ type: 'kandidat', id: c.href, href: c.href, label: `${c.name} (${c.p})`, meta: (c.elected ? 'Valgt · ' : 'Kandidat · ') + (c.t === 'kv' ? c.komName : c.kredsName) });
    function searchExtra(q) {
      const t = lc(q).trim(); if (t.length < 2) return [];
      const out = [];
      FV.storkredse.filter(x => lc(x.name).includes(t)).slice(0, 2).forEach(x => out.push({ type: 'storkreds', id: x.id, href: '#/storkreds/' + x.id, label: x.name, meta: 'Storkreds' }));
      FV.kredse.filter(x => lc(x.name).includes(t)).slice(0, 3).forEach(x => out.push({ type: 'kreds', id: x.id, href: '#/kreds/' + x.id, label: x.name + ' (opstillingskreds)', meta: skById[x.sk].name.replace(' Storkreds', '') }));
      return out.concat(candSearch(q, null, 4).map(candItem));
    }
    function pickItem(it) {
      log('search', it.label);
      if (it.href) location.hash = it.href;
      else if (it.type === 'valg') location.hash = href('/find', { valg: it.id });
      else if (it.type === 'parti') location.hash = href('/parti/' + enc(it.id), { valg: KV });
      else location.hash = resultHref(it.id, KV);
    }
    function searchBox({ placeholder, id, onlyCands, valg }) {
      const inp = h('input', { type: 'text', id, placeholder, 'aria-label': placeholder, 'data-enter': 'first' });
      const getItems = q => onlyCands ? candSearch(q, valg, 7).map(candItem) : H.searchAll(q);
      const form = h('form', { class: 'search', role: 'search', onsubmit: e => { e.preventDefault(); const f = getItems(inp.value)[0]; if (f) pickItem(f); else if (inp.value.trim()) location.hash = href('/ikke-med', { side: 'Søgning efter «' + inp.value.trim() + '»' }); } },
        h('div', { class: 'box' }, inp, h('button', { class: 'btn', type: 'submit' }, 'Søg')));
      autocomplete(inp, getItems, pickItem);
      return { form, inp };
    }

    /* ---------- header: søgning og burgermenu ---------- */
    function openSearch() {
      const { form, inp } = searchBox({ placeholder: 'Søg kommune, kandidat, kreds, parti eller valg …', id: 'gq' });
      inp.setAttribute('data-autofocus', '');
      openLayer({ label: 'Søg på valg.dk', content: [closeBtn(), h('h2', { class: 'layer-h' }, 'Søg på valg.dk'), form, h('p', { class: 'hint', style: 'margin-top:12px' }, 'Prøv fx Hørsholm, Aarhus Nord, et kandidatnavn eller Socialdemokratiet.')] });
    }
    function drawerLink(hr, t, d) { return h('a', { href: hr, class: 'dl' }, h('strong', {}, t), d ? h('small', {}, d) : null); }
    function openDrawer() {
      const grp = (t, sub, ...links) => h('section', { class: 'dgrp' }, h('h3', {}, t), sub ? h('p', { class: 'dsub2' }, sub) : null, h('div', { class: 'dlinks' }, links));
      const content = [closeBtn(), h('h2', { class: 'layer-h' }, 'Menu'),
        grp('Til dig som vælger', 'Hurtigt svar på, hvordan det gik',
          drawerLink(href('/find', { valg: KV }), 'Find resultatet for din kommune', 'Mandater og stemmer, hvor du bor'),
          drawerLink(href('/valgt', { valg: KV }), 'Hvem er valgt ind?', 'Byrådsmedlemmer og folketingskandidater'),
          drawerLink(href('/kredse', { valg: 'fv' }), 'Kandidater og kredse', 'Udfold kredse og se, hvem der stillede op'),
          drawerLink('#/metode', 'Hvordan fordeles mandaterne?', 'Forklaret uden fagsprog')),
        grp('Til dig der vil nørde', 'Tal, definitioner og udtræk',
          drawerLink('#/data', 'Hent data', 'Regneark for land, regioner, kommuner og afstemningsområder'),
          drawerLink('#/sammenlign', 'Sammenlign områder', 'To eller tre områder i diagram eller tabel'),
          drawerLink(href('/data', { scope: 'kommuner', niveau: 'omr', indhold: 'parti' }), 'Afstemningsområder som data', 'Stemmer pr. parti pr. område'),
          drawerLink('#/metode', 'Metode og definitioner', 'Sådan regnes mandater, spærregrænse og tillæg'),
          drawerLink(href('/ikke-med', { side: 'Åbne data og API' }), 'Åbne data og API', 'Ikke med i prototypen')),
        grp('Om valg.dk', null,
          drawerLink('#/om-valg', 'Om valg.dk'), drawerLink('#/driftstatus', 'Driftstatus'), drawerLink('#/tilgaengelighed', 'Tilgængelighedserklæring'), drawerLink('#/privatliv', 'Privatlivspolitik'), drawerLink('#/sitemap', 'Sitemap'))];
      $('#burgerBtn').setAttribute('aria-expanded', 'true');
      openLayer({ label: 'Menu', side: true, content });
    }
    function initChrome() {
      $('#searchBtn').addEventListener('click', openSearch);
      $('#burgerBtn').addEventListener('click', () => { if (layerOpen) closeLayer(); else openDrawer(); });
      document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !layerOpen) { e.preventDefault(); openSearch(); } });
    }

    /* ---------- hjælp til status på kommunesider ---------- */
    function statusBadge(k, valg) {
      if (valg === KV && LIVE.on && !isCounted(k.id)) return h('span', { class: 'badge warn' }, 'Optælling i gang (simulation)');
      return h('span', { class: 'badge' }, LIVE.on && valg === KV ? 'Optalt (simulation)' : 'Endeligt resultat');
    }

    /* ======================= FORSIDE (én skærm, ingen scroll) ======================= */
    let hv = KV, tab = 'mand', mapMetric = 'party';
    const fvBig = (() => { const o = {}; FV.kredse.forEach(k => k.kom.forEach(id => { o[id] = o[id] || {}; Object.keys(k.votes).forEach(p => { o[id][p] = (o[id][p] || 0) + k.votes[p]; }); })); const r = {}; Object.keys(o).forEach(id => { r[id] = bigOfVotes(o[id]); }); return r; })();
    function home() {
      document.title = 'valg.dk – prototype (nyt design)';
      const el = h('div', { class: 'fitpage' });
      const liveBox = h('div', { class: 'ft-live' }), body = h('div', { class: 'ft-body' }), say = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
      const title = h('h2', { id: 'ft-title' }), eyebrow = h('p', { class: 'eyebrow' });

      /* live-linje (kompakt) */
      function drawLive() {
        liveBox.innerHTML = ''; const total = KOM.length;
        if (!LIVE.on && hv === 'fv') return;
        if (!LIVE.on) {
          liveBox.append(h('div', { class: 'livebar idle' }, h('span', { class: 'lb-tag done' }, 'Endeligt'), h('span', { class: 'lb-text' }, hv === KV ? `${total} af ${total} kommuner optalt` : 'Eksempeldata'), h('span', { class: 'spacer' }),
            h('button', { class: 'btn small secondary', type: 'button', onclick: () => { hv = KV; live.start(); } }, '▶ Se valgaften live (simulation)')));
          return;
        }
        const done = LIVE.n >= total, a = kvAgg();
        const mk = (t, f, c) => h('button', { class: 'btn small secondary ' + (c || ''), type: 'button', onclick: f }, t);
        liveBox.append(h('div', { class: 'livebar ' + (done ? 'finished' : LIVE.paused ? 'paused' : 'running') },
          h('span', { class: 'lb-tag' }, done ? 'Slut' : LIVE.paused ? 'Pause' : h('span', {}, h('i', { class: 'pulse' }), 'LIVE')),
          h('span', { class: 'lb-text' }, h('strong', {}, `${LIVE.n}/${total} kommuner`), ` · ${fmtP(a.cast / ALL_CAST * 100, 0)} talt op · kl. ${simClock()}`),
          h('span', { class: 'lb-track', 'aria-hidden': 'true' }, h('i', { style: `width:${LIVE.n / total * 100}%` })), h('span', { class: 'spacer' }),
          !done ? mk(LIVE.paused ? '▶ Fortsæt' : '⏸ Pause', live.pause) : null, !done ? mk('⏭ Slut', live.skip, 'opt') : null, mk('↺', live.start, 'opt'), mk('Afslut', live.stop)));
        const q = Math.floor(LIVE.n / total * 4); if (q > LIVE.said) { LIVE.said = q; say.textContent = `${LIVE.n} af ${total} kommuner er optalt.`; }
        const rs = liveBox.querySelector('button[class*="opt"]:last-of-type'); if (rs) rs.setAttribute('aria-label', 'Start forfra');
      }

      /* fane 1: mandatfordeling */
      function paintMand(c) {
        if (hv === KV) {
          const a = kvAgg(), rows = Object.keys(a.m).filter(p => a.m[p] > 0).map(p => ({ p, m: a.m[p] })).sort((x, y) => y.m - x.m);
          c.append(h('div', { class: 'bignum' }, h('strong', {}, fmtN(a.seats)), h('span', {}, ` af ${fmtN(TOTAL_SEATS)} byrådsmandater ${LIVE.on && LIVE.n < KOM.length ? 'foreløbigt fordelt' : 'fordelt'}`)));
          c.append(rows.length ? mbar(rows) : h('div', { class: 'mbar empty' }, 'Venter på første optælling …'));
          if (rows.length) c.append(legendRows(a.m, null, p => ''));
        } else {
          const { m, d } = fvAgg(), seats = [];
          POL.forEach(p => { if (!m[p]) return; allFV.filter(x => x.p === p && x.elected).sort((x, y) => y.votes - x.votes).forEach(x => seats.push({ p, href: x.href, title: `${x.name} (${p}) – ${x.kredsName}` })); });
          const svg = hemicycle(seats, { label: 'Mandatfordeling i Folketinget: ' + Object.keys(m).sort((x, y) => m[y] - m[x]).map(p => `${p} ${m[p]}`).join(', ') });
          c.append(h('div', { class: 'hemi-wrap' }, svg), legendRows(m, null, p => '', p => svg.focusParty(p)));
        }
        c.append(h('div', { class: 'btnrow' }, h('a', { class: 'btn small', href: hv === KV ? resultHref('land', KV) : href('/kredse', { valg: 'fv' }) }, hv === KV ? 'Se landsresultatet' : 'Se alle kredse'), h('a', { class: 'btn small secondary', href: '#/metode' }, 'Hvad er mandatfordeling?')));
      }
      /* fane 2: kort */
      function paintMap(c) {
        const isFV = hv === 'fv', metric = isFV ? 'party' : mapMetric;
        const opts = { valg: KV, metric, counted: isFV ? null : isCounted, onSelect: id => { log('map', id); location.hash = isFV ? '#/kreds/' + komToKreds[id][0] : resultHref(id, KV); } };
        if (!isFV) opts.onRegion = rid => { log('map', rid); location.hash = resultHref(rid, KV); };
        if (isFV) { opts.fillOf = k => D.parties[fvBig[k.id]].color; opts.titleOf = k => `${k.name} – største parti (eksempel): ${fvBig[k.id]} ${PN(fvBig[k.id])}`; }
        else if (metric === 'party') opts.titleOf = k => isCounted(k.id) ? `${k.name} – største parti ${H.biggest(k, KV)} ${PN(H.biggest(k, KV))}` : `${k.name} – optælles stadig`;
        const cnt = {}; let pend = 0;
        KOM.forEach(k => { if (!isFV && !isCounted(k.id)) { pend++; return; } const p = isFV ? fvBig[k.id] : H.biggest(k, KV); cnt[p] = (cnt[p] || 0) + 1; });
        const tg = isFV ? null : h('div', { class: 'seg', role: 'group', 'aria-label': 'Vis på kortet' }, [['party', 'Største parti'], ['turnout', 'Valgdeltagelse']].map(([id, t]) => h('button', { type: 'button', 'aria-pressed': String(mapMetric === id), onclick: () => { mapMetric = id; drawAll(); } }, t)));
        c.append(h('div', { class: 'ft-map' }, GEO.renderMap(opts)),
          h('div', { class: 'ft-mapfoot' }, tg, metric === 'turnout' ? h('span', { class: 'mapnote' }, 'Mørkere = højere valgdeltagelse') : h('div', { class: 'chipleg' }, Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x]).slice(0, 7).map(p => h('span', {}, h('i', { style: `background:${D.parties[p].color}` }), `${p} ${cnt[p]}`)), pend ? h('span', {}, h('i', { class: 'pend' }), `Ikke optalt ${pend}`) : null), h('span', { class: 'mapnote' }, 'Klik på en cirkel.')));
      }
      /* fane 3: hvem er valgt ind */
      function paintValgt(c) {
        const pool = (hv === KV ? allKV.filter(x => x.elected && isCounted(x.kom)) : allFV.filter(x => x.elected)).sort((a, b) => b.votes - a.votes);
        const sb = searchBox({ placeholder: 'Søg efter en kandidat …', id: 'cq', onlyCands: true, valg: hv });
        c.append(sb.form);
        if (!pool.length) c.append(h('p', { class: 'empty-note' }, 'Ingen er valgt endnu – optællingen er lige begyndt.'));
        else c.append(h('ol', { class: 'vlist' }, pool.slice(0, 5).map(x => h('li', {}, pl(x.p), h('div', { class: 'vn' }, h('a', { href: x.href }, x.name), h('small', {}, x.t === 'kv' ? `${x.komName} Kommune` : `${x.kredsName} · ${x.skName.replace(' Storkreds', '')}`)), h('div', { class: 'vv' }, h('strong', {}, fmtN(x.votes)), h('small', {}, 'stemmer'))))));
        c.append(h('div', { class: 'btnrow' }, h('a', { class: 'btn small', href: href('/valgt', { valg: hv }) }, 'Se alle valgte'), h('a', { class: 'btn small secondary', href: href('/kredse', { valg: hv }) }, 'Kredse og kandidater')));
      }
      const TABS = [['mand', 'Mandatfordeling', paintMand], ['kort', 'Kort', paintMap], ['valgt', h('span', {}, h('span', { class: 'tl' }, 'Hvem er valgt ind?'), h('span', { class: 'ts' }, 'Valgte ind')), paintValgt]];
      const tabBar = h('div', { class: 'ft-tabs', role: 'tablist', 'aria-label': 'Vis' });
      const vseg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Vælg valg' });
      function drawAll() {
        eyebrow.textContent = hv === KV ? (LIVE.on ? (LIVE.n >= KOM.length ? 'Simulation slut' : 'Foreløbigt resultat') : ELS[KV].date) : 'Eksempeldata';
        title.textContent = vname(hv);
        vseg.innerHTML = ''; [[KV, 'Kommunalvalg'], ['fv', 'Folketingsvalg']].forEach(([id, t]) => vseg.append(h('button', { type: 'button', 'aria-pressed': String(hv === id), onclick: () => { hv = id; drawAll(); } }, t)));
        tabBar.innerHTML = ''; TABS.forEach(([id, t]) => tabBar.append(h('button', { type: 'button', role: 'tab', class: 'ft-tab', 'aria-selected': String(tab === id), onclick: () => { tab = id; drawAll(); } }, t)));
        drawLive(); body.innerHTML = ''; body.setAttribute('role', 'tabpanel'); TABS.find(x => x[0] === tab)[2](body);
      }
      const sub = () => { if (!liveBox.isConnected) { LIVE.subs.delete(sub); return; } drawAll(); };
      LIVE.subs.add(sub);

      /* venstre: hero */
      const hero = searchBox({ placeholder: 'Søg kommune eller kandidat …', id: 'q' });
      const sel = h('select', { class: 'select', id: 'pickK', 'aria-label': 'Vælg din kommune' }, h('option', { value: '' }, 'Vælg din kommune …'), KOM.map(k => h('option', { value: k.id }, k.name)));
      sel.addEventListener('change', () => { if (sel.value) location.hash = resultHref(sel.value, KV); });
      const ql = (hr, t, d) => h('a', { class: 'qlink', href: hr }, h('strong', {}, t), h('small', {}, d), h('span', { class: 'chev', 'aria-hidden': 'true' }, '›'));
      el.append(
        h('section', { class: 'ft-left', 'aria-labelledby': 'h-hero' }, h('p', { class: 'eyebrow' }, 'Officielle valgresultater i Danmark'), h('h1', { id: 'h-hero' }, 'Hvordan gik valget?'),
          h('p', { class: 'lead' }, 'Se mandatfordelingen, find din kommune eller kreds, og se hvem der er valgt ind.'),
          h('div', { class: 'ft-search' }, hero.form, h('div', { class: 'ft-pick' }, h('label', { for: 'pickK' }, 'Eller vælg kommune'), sel)),
          h('div', { class: 'ft-links' }, ql(href('/valgt', { valg: KV }), 'Hvem er valgt ind?', 'Valgte med flest stemmer'), ql(href('/kredse', { valg: 'fv' }), 'Kandidater og kredse', 'Fold områderne ud'))),
        h('section', { class: 'ft-card', 'aria-labelledby': 'ft-title' },
          h('div', { class: 'ft-head' }, h('div', {}, eyebrow, title), vseg), tabBar, liveBox, body, say),
        h('div', { class: 'ft-foot' }, h('span', { class: 'ft-msg' }, h('span', { class: 'tag' }, PG.drift.items[0].tag), ' ', PG.drift.items[0].title, ' ', h('a', { href: '#/driftstatus' }, 'Læs mere')),
          h('nav', { 'aria-label': 'Genveje i bunden' }, [['#/om-valg', 'Om valg.dk'], ['#/tilgaengelighed', 'Tilgængelighed'], ['#/privatliv', 'Privatliv'], ['#/driftstatus', 'Driftstatus'], ['#/sitemap', 'Sitemap']].map(([hr, t]) => h('a', { href: hr }, t)))));
      drawAll();
      return el;
    }

    /* ======================= KREDSE OG KANDIDATER (træ der kan foldes ud) ======================= */
    let treeFilter = '';
    function tnode({ level, title, meta, right, ids, build }) {
      const body = h('div', { class: 'tn-body', hidden: true }), btn = h('button', { type: 'button', class: 'tn-head', 'aria-expanded': 'false' }, h('span', { class: 'tn-chev', 'aria-hidden': 'true' }, '›'), h('span', { class: 'tn-title' }, title), h('span', { class: 'tn-meta' }, meta), right || null);
      const wrap = h('div', { class: 'tn l' + level, 'data-ids': ids.join(' ') }, btn, body);
      let built = false;
      wrap.setOpen = o => { btn.setAttribute('aria-expanded', String(o)); body.hidden = !o; wrap.classList.toggle('open', o); if (o && !built) { body.append(build()); built = true; } };
      wrap.rebuild = () => { body.innerHTML = ''; built = false; if (!body.hidden) { body.append(build()); built = true; } };
      btn.addEventListener('click', () => wrap.setOpen(btn.getAttribute('aria-expanded') !== 'true'));
      return wrap;
    }
    const hl = name => { const t = treeFilter; if (!t) return name; const i = lc(name).indexOf(t); return i < 0 ? name : [name.slice(0, i), h('mark', {}, name.slice(i, i + t.length)), name.slice(i + t.length)]; };
    function candTableFV(kr) {
      const rows = Object.keys(kr.c).map(p => ({ p, name: kr.c[p][0], v: kr.c[p][1], st: kr.c[p][2] })).sort((a, b) => b.st - a.st || b.v - a.v);
      return h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl compact' }, h('caption', { class: 'sr-only' }, 'Kandidater i ' + kr.name),
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Parti'), h('th', { scope: 'col' }, 'Kandidat'), h('th', { scope: 'col', class: 'num' }, 'Personlige stemmer'), h('th', { scope: 'col' }, 'Status'))),
        h('tbody', {}, rows.map(r => h('tr', { class: treeFilter && lc(r.name).includes(treeFilter) ? 'hit' : '' }, h('td', {}, pl(r.p), PN(r.p)), h('td', {}, h('a', { href: `#/kandidat/fv/${kr.id}/${enc(r.p)}` }, hl(r.name))), h('td', { class: 'num' }, fmtN(r.v)), h('td', {}, r.st ? h('span', { class: 'st yes' }, r.st === 1 ? '✓ Kredsmandat' : '✓ Tillægsmandat') : h('span', { class: 'st no' }, 'Ikke valgt')))))));
    }
    function skBody(sk) {
      const m = {}; Object.keys(sk.mandates).forEach(p => { m[p] = sk.mandates[p]; }); Object.keys(sk.tillaeg).forEach(p => { m[p] = (m[p] || 0) + sk.tillaeg[p]; });
      const rows = Object.keys(m).map(p => ({ p, m: m[p] })).sort((a, b) => b.m - a.m);
      const box = h('div', { class: 'tn-in' }, h('div', { class: 'tn-sum' }, h('div', {}, h('strong', {}, `${rows.reduce((t, r) => t + r.m, 0)} valgte i storkredsen`), h('small', {}, ` (${sk.seats} kredsmandater + ${Object.values(sk.tillaeg).reduce((a, b) => a + b, 0)} tillægsmandater)`)), mbar(rows)),
        h('p', {}, h('a', { href: '#/storkreds/' + sk.id, class: 'btn small secondary' }, 'Åbn ' + sk.name + '  →')));
      sk.kredse.forEach(id => {
        const kr = kredsById[id], top = bigOfVotes(kr.votes), valgte = Object.keys(kr.c).filter(p => kr.c[p][2]);
        box.append(tnode({ level: 2, title: kr.name, ids: [id], meta: h('span', {}, `Valgdeltagelse ${fmtP(kr.turnout)} · største parti `, pl(top, 'sm'), top),
          right: h('span', { class: 'tn-right' }, valgte.length ? `${valgte.length} valgt` : 'ingen valgt'),
          build: () => h('div', { class: 'tn-in' }, candTableFV(kr), h('p', {}, h('a', { href: '#/kreds/' + id }, 'Åbn ' + kr.name + ' (opstillingskreds)  →'))) }));
      });
      return box;
    }
    function komBody(k) {
      const R = k.results[KV], lists = K.kv2025[k.id] || {};
      const parties = Object.keys(R.mandates).filter(p => R.mandates[p] > 0).sort((a, b) => R.mandates[b] - R.mandates[a]);
      const valgte = h('div', { class: 'chips2' }, parties.map(p => (lists[p] || []).slice(0, R.mandates[p]).map((c, i) => h('a', { class: 'chip2' + (treeFilter && lc(c[0]).includes(treeFilter) ? ' hit' : ''), href: `#/kandidat/kv/${k.id}/${enc(p)}/${i}`, style: `border-left-color:${D.parties[p].color}` }, h('b', {}, p), hl(c[0])))));
      const ar = R.areas;
      return h('div', { class: 'tn-in' }, h('p', { class: 'tn-h' }, `${k.seats} valgte byrådsmedlemmer`), valgte,
        h('p', { class: 'tn-h' }, `Afstemningsområder (${ar.length})`),
        h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl compact' }, h('caption', { class: 'sr-only' }, 'Afstemningsområder i ' + k.name),
          h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Område'), h('th', { scope: 'col', class: 'num' }, 'Valgdeltagelse'), h('th', { scope: 'col' }, 'Største parti'))),
          h('tbody', {}, ar.map(a => { const t = bigOfVotes(a.votes); return h('tr', {}, h('td', {}, h('a', { href: href('/resultat/' + k.id + '/' + a.id, { valg: KV }) }, a.name.replace(k.name + ' ', ''))), h('td', { class: 'num' }, fmtP(a.cast / a.electorate * 100)), h('td', {}, pl(t, 'sm'), PN(t))); })))),
        h('p', {}, h('a', { href: resultHref(k.id, KV) }, `Åbn ${k.name} Kommune  →`)));
    }
    function kredse(parts, q) {
      const valg = q.valg === 'fv' ? 'fv' : KV;
      document.title = 'Kandidater og kredse – valg.dk (prototype)';
      treeFilter = '';
      const el = h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Kandidater og kredse' }));
      el.append(h('h1', {}, 'Kandidater og kredse'), h('p', { class: 'lead' }, valg === 'fv' ? 'Fold en storkreds ud, og se opstillingskredsene, tallene og hvem der stillede op og blev valgt.' : 'Fold en region og en kommune ud, og se afstemningsområderne og de valgte byrådsmedlemmer.'));
      el.append(h('div', { class: 'pills', style: 'margin-top:20px', role: 'group', 'aria-label': 'Vælg valg' }, [[KV, ELS[KV].name], ['fv', FV.name]].map(([id, t]) => h('a', { class: 'pill' + (id === valg ? ' active' : ''), href: href('/kredse', { valg: id }), 'aria-current': id === valg ? 'true' : null }, t))));
      const nodes = [];
      let tree;
      if (valg === 'fv') {
        FV.storkredse.forEach(sk => {
          const krs = sk.kredse.map(id => kredsById[id]), tl = Object.values(sk.tillaeg).reduce((a, b) => a + b, 0);
          nodes.push(tnode({ level: 1, title: sk.name, ids: sk.kredse, meta: `${sk.seats} kredsmandater${tl ? ' + ' + tl + ' tillæg' : ''} · ${krs.length} ${krs.length === 1 ? 'opstillingskreds' : 'opstillingskredse'} · valgdeltagelse ${fmtP(turnoutOf(krs))}`, build: () => skBody(sk) }));
        });
      } else {
        REG.forEach(r => {
          const ks = KOM.filter(k => H.regOf(k) === r.id), a = H.getArea(r.id);
          const wrap = tnode({ level: 1, title: r.name, ids: ks.map(k => k.id), meta: `${ks.length} kommuner · ${fmtN(a.seats)} byrådsmandater · valgdeltagelse ${fmtP(a.results[KV].turnout)}`,
            build: () => { const box = h('div', { class: 'tn-in' }, h('p', {}, h('a', { href: resultHref(r.id, KV), class: 'btn small secondary' }, 'Åbn ' + r.name + '  →')));
              ks.forEach(k => { const R = k.results[KV], top = H.biggest(k, KV); box.append(tnode({ level: 2, title: k.name, ids: [k.id], meta: h('span', {}, `${k.seats} mandater · valgdeltagelse ${fmtP(R.turnout)} · største parti `, pl(top, 'sm'), top), build: () => komBody(k) })); });
              return box; } });
          wrap.dataset.rid = r.id; nodes.push(wrap);
        });
      }
      const input = h('input', { type: 'search', class: 'select', id: 'tf', placeholder: 'Filtrér på kandidatnavn …', 'aria-label': 'Filtrér på kandidatnavn' });
      const info = h('p', { class: 'mapnote', role: 'status', 'aria-live': 'polite' });
      const pool = valg === 'fv' ? allFV : allKV;
      input.addEventListener('input', () => {
        const t = lc(input.value).trim(); treeFilter = t.length >= 2 ? t : '';
        const ids = new Set(); let n = 0;
        if (treeFilter) pool.forEach(c => { if (lc(c.name).includes(treeFilter)) { ids.add(c.t === 'fv' ? c.kreds : c.kom); n++; } });
        nodes.forEach(nd => {
          const own = nd.dataset.ids.split(' ');
          nd.hidden = !!treeFilter && !own.some(i => ids.has(i));
          nd.rebuild();
          if (treeFilter && !nd.hidden) {
            nd.setOpen(true);
            nd.querySelectorAll('.tn').forEach(c => { const cid = c.dataset.ids.split(' '); c.hidden = !cid.some(i => ids.has(i)); if (!c.hidden) c.setOpen(true); });
          }
        });
        info.textContent = treeFilter ? (n ? `${n} kandidater matcher «${input.value.trim()}».` : 'Ingen kandidater matcher.') : '';
      });
      el.append(h('div', { class: 'toolbar' }, h('label', { class: 'lab', for: 'tf' }, 'Find kandidat'), input, h('span', { class: 'spacer' }),
        h('button', { class: 'btn secondary small', type: 'button', onclick: () => nodes.forEach(n => n.setOpen(true)) }, 'Udfold alle'), h('button', { class: 'btn secondary small', type: 'button', onclick: () => { nodes.forEach(n => { n.setOpen(false); n.querySelectorAll('.tn').forEach(c => c.setOpen(false)); }); } }, 'Fold ind')), info);
      tree = h('div', { class: 'tree' }, nodes); el.append(tree);
      if (q['åbn']) { const nd = nodes.find(n => n.dataset.rid === q['åbn']); if (nd) nd.setOpen(true); }
      el.append(h('p', { class: 'source' }, 'Kilde: eksempeldata og fiktive navne i prototypen – ikke officielle valgresultater og ikke rigtige personer.' + (valg === 'fv' ? ' Inddelingen i opstillingskredse er forenklet.' : '')));
      return el;
    }

    /* ---------- storkreds ---------- */
    function kpi(items) { return h('section', { class: 'panel', style: 'margin-top:26px', 'aria-label': 'Nøgletal' }, h('div', { class: 'kpis', style: 'margin-top:0' }, items.map(([l, v, main]) => h('div', { class: 'stat' + (main ? ' main' : '') }, h('div', { class: 'lbl' }, l), h('div', { class: 'val' }, v))))); }
    function storkreds(parts) {
      const sk = skById[parts[1]]; if (!sk) return ikkeMed([], { side: 'Ukendt storkreds' });
      document.title = sk.name + ' – valg.dk (prototype)';
      const krs = sk.kredse.map(id => kredsById[id]), tl = Object.values(sk.tillaeg).reduce((a, b) => a + b, 0);
      const m = {}; Object.keys(sk.mandates).forEach(p => { m[p] = sk.mandates[p]; }); Object.keys(sk.tillaeg).forEach(p => { m[p] = (m[p] || 0) + sk.tillaeg[p]; });
      const mrows = Object.keys(m).map(p => ({ p, m: m[p] })).sort((a, b) => b.m - a.m);
      const el = h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Kandidater og kredse', href: href('/kredse', { valg: 'fv' }) }, { t: sk.name }));
      el.append(h('div', { class: 'titlerow' }, h('h1', {}, sk.name), h('span', { class: 'badge' }, 'Eksempeldata')), h('p', { class: 'lead' }, `${FV.name} · ${krs.length} ${krs.length === 1 ? 'opstillingskreds' : 'opstillingskredse'}`));
      el.append(kpi([['Valgte i alt', fmtN(mrows.reduce((t, r) => t + r.m, 0)), true], ['Kredsmandater', String(sk.seats)], ['Tillægsmandater i storkredsen', String(tl)], ['Valgdeltagelse', fmtP(turnoutOf(krs))]]));
      el.append(h('section', { class: 'section' }, h('h2', {}, 'Mandatfordeling'), h('div', { class: 'panel', style: 'margin-top:14px' }, mbar(mrows), legendRows(m, null, p => `${sk.mandates[p] || 0} kreds + ${sk.tillaeg[p] || 0} tillæg`))));
      const elected = allFV.filter(c => c.sk === sk.id && c.elected).sort((a, b) => POL.indexOf(a.p) - POL.indexOf(b.p) || b.votes - a.votes);
      el.append(h('section', { class: 'section' }, h('h2', { style: 'margin-bottom:14px' }, 'Hvem er valgt ind?'), h('div', { class: 'pcards' }, elected.map(c => h('a', { class: 'pcard', href: c.href, style: `border-top-color:${D.parties[c.p].color}` }, h('span', { class: 'pc-p' }, pl(c.p), PN(c.p)), h('strong', {}, c.name), h('small', {}, `${c.kredsName} · ${fmtN(c.votes)} personlige stemmer`), h('span', { class: 'st yes' }, c.st === 1 ? '✓ Kredsmandat' : '✓ Tillægsmandat'))))));
      el.append(h('section', { class: 'section' }, h('h2', { style: 'margin-bottom:14px' }, 'Opstillingskredse'), h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, 'Opstillingskredse i ' + sk.name),
        h('thead', {}, h('tr', {}, ['Opstillingskreds', 'Valgberettigede', 'Valgdeltagelse', 'Største parti', 'Valgte'].map((t, i) => h('th', { scope: 'col', class: i === 1 || i === 2 ? 'num' : '' }, t)))),
        h('tbody', {}, krs.map(k => { const t = bigOfVotes(k.votes); return h('tr', {}, h('td', {}, h('a', { href: '#/kreds/' + k.id }, k.name)), h('td', { class: 'num' }, fmtN(k.electorate)), h('td', { class: 'num' }, fmtP(k.turnout)), h('td', {}, pl(t, 'sm'), PN(t)), h('td', {}, String(Object.values(k.c).filter(c => c[2]).length))); }))))));
      el.append(h('p', { class: 'source' }, 'Kilde: eksempeldata og fiktive navne i prototypen. ', h('a', { href: '#/metode' }, 'Sådan er mandaterne beregnet')));
      return el;
    }
    /* ---------- opstillingskreds ---------- */
    function kreds(parts) {
      const kr = kredsById[parts[1]]; if (!kr) return ikkeMed([], { side: 'Ukendt opstillingskreds' });
      document.title = kr.name + ' – valg.dk (prototype)';
      const sk = skById[kr.sk]; let sort = 'v';
      const rows0 = Object.keys(kr.c).map(p => ({ p, name: kr.c[p][0], pv: kr.c[p][1], st: kr.c[p][2], pt: kr.votes[p], sh: kr.votes[p] / kr.valid * 100 }));
      const tbody = h('tbody');
      const draw = () => { tbody.innerHTML = ''; rows0.slice().sort(sort === 'a' ? (a, b) => a.p.localeCompare(b.p, 'da') : sort === 'n' ? (a, b) => a.name.localeCompare(b.name, 'da') : (a, b) => b.pt - a.pt).forEach(r => tbody.append(h('tr', { class: 'row' }, h('td', {}, pl(r.p), h('a', { href: href('/parti/' + enc(r.p), { valg: KV }), class: 'plink' }, PN(r.p))), h('td', {}, h('a', { href: `#/kandidat/fv/${kr.id}/${enc(r.p)}` }, r.name)), h('td', { class: 'num' }, fmtN(r.pv)), h('td', { class: 'num' }, fmtN(r.pt)), h('td', { class: 'num' }, fmtP(r.sh)), h('td', {}, r.st ? h('span', { class: 'st yes' }, r.st === 1 ? '✓ Kredsmandat' : '✓ Tillægsmandat') : h('span', { class: 'st no' }, 'Ikke valgt'))))); };
      const sel = h('select', { class: 'select', id: 'ks', 'aria-label': 'Sortér' }, [['v', 'Flest stemmer'], ['a', 'Partibogstav'], ['n', 'Kandidatnavn']].map(([v, t]) => h('option', { value: v }, t)));
      sel.addEventListener('change', () => { sort = sel.value; log('sort', sort); draw(); }); draw();
      const el = h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Kandidater og kredse', href: href('/kredse', { valg: 'fv' }) }, { t: sk.name, href: '#/storkreds/' + sk.id }, { t: kr.name }));
      el.append(h('div', { class: 'titlerow' }, h('h1', {}, kr.name), h('span', { class: 'badge' }, 'Eksempeldata')), h('p', { class: 'lead' }, `Opstillingskreds i ${sk.name} · ${FV.name}` + (kr.kom.length ? ' · ' + kr.kom.map(id => byId[id].name).join(', ') : '')));
      const top = bigOfVotes(kr.votes);
      el.append(kpi([['Valgdeltagelse', fmtP(kr.turnout), true], ['Valgberettigede', fmtN(kr.electorate)], ['Afgivne stemmer', fmtN(kr.cast)], ['Største parti', top + ' ' + PN(top)]]));
      el.append(h('div', { class: 'toolbar' }, h('h2', { style: 'font-size:22px' }, 'Kandidater og stemmer'), h('span', { class: 'spacer' }), h('label', { for: 'ks', style: 'color:var(--muted);font-size:14px' }, 'Sortér efter'), sel,
        h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(`kandidater-${kr.id}.csv`, csv(['Opstillingskreds', 'Storkreds', 'Parti', 'Kandidat', 'Personlige stemmer', 'Partiets stemmer', 'Andel (%)', 'Status'], rows0.map(r => [kr.name, sk.name, r.p, r.name, r.pv, r.pt, +r.sh.toFixed(2), r.st === 1 ? 'Kredsmandat' : r.st === 2 ? 'Tillægsmandat' : 'Ikke valgt']), { sep: ';', dec: ',' })) }, '⬇ Hent til Excel'), shareBtn(), printBtn()));
      el.append(h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, 'Kandidater og stemmer i ' + kr.name),
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Parti'), h('th', { scope: 'col' }, 'Kandidat'), h('th', { scope: 'col', class: 'num' }, 'Personlige stemmer'), h('th', { scope: 'col', class: 'num' }, 'Partiets stemmer'), h('th', { scope: 'col', class: 'num' }, 'Andel'), h('th', { scope: 'col' }, 'Status'))), tbody)));
      el.append(h('p', { class: 'source' }, 'Mandater fordeles på storkredsniveau, ikke i den enkelte opstillingskreds. Kilde: eksempeldata og fiktive navne i prototypen.'));
      return el;
    }
    /* ---------- kandidat ---------- */
    function kandidat(parts) {
      const kind = parts[1], p = parts[3] && decodeURIComponent(parts[3]);
      let c = null, others = [], area = null;
      if (kind === 'fv') { c = allFV.find(x => x.kreds === parts[2] && x.p === (parts[3] ? decodeURIComponent(parts[3]) : '')); if (c) others = allFV.filter(x => x.sk === c.sk && x.p === c.p && x !== c).sort((a, b) => b.votes - a.votes).slice(0, 6); }
      else if (kind === 'kv') { c = allKV.find(x => x.kom === parts[2] && x.p === p && x.i === +parts[4]); if (c) others = allKV.filter(x => x.kom === c.kom && x.p === c.p && x !== c).sort((a, b) => b.votes - a.votes).slice(0, 6); }
      if (!c) return ikkeMed([], { side: 'Ukendt kandidat' });
      document.title = c.name + ' – valg.dk (prototype)';
      const place = c.t === 'kv' ? [{ t: 'Kommunalvalg 2025' }, { t: c.komName + ' Kommune', href: resultHref(c.kom, KV) }] : [{ t: 'Kandidater og kredse', href: href('/kredse', { valg: 'fv' }) }, { t: c.skName, href: '#/storkreds/' + c.sk }, { t: c.kredsName, href: '#/kreds/' + c.kreds }];
      const el = h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, ...place, { t: c.name }));
      el.append(h('div', { class: 'cand-head' }, h('span', { class: 'avatar', style: `background:${D.parties[c.p].color}`, 'aria-hidden': 'true' }, c.name.split(' ').map(w => w[0]).slice(0, 2).join('')), h('div', {}, h('h1', {}, c.name), h('p', { class: 'lead', style: 'margin-top:6px' }, h('a', { href: href('/parti/' + enc(c.p), { valg: KV }) }, `${c.p} – ${PN(c.p)}`), c.t === 'kv' ? ` · ${c.komName} Kommune · Kommunalvalg 2025` : ` · ${c.kredsName} · ${c.skName}`), h('p', { style: 'margin-top:10px' }, chip(c)))));
      el.append(kpi([['Personlige stemmer', fmtN(c.votes), true], [c.t === 'kv' ? 'Andel af alle gyldige stemmer' : 'Andel af stemmerne i kredsen', fmtP(c.share, 2)], [c.t === 'kv' ? 'Placering på partiets liste' : 'Parti', c.t === 'kv' ? `${c.i + 1}. blandt partiets kandidater` : `${c.p} ${PN(c.p)}`], ['Status', statusTxt(c)]]));
      if (others.length) el.append(h('section', { class: 'section' }, h('h2', { style: 'margin-bottom:14px' }, c.t === 'kv' ? `Andre kandidater for ${c.p} i ${c.komName}` : `Andre kandidater for ${c.p} i ${c.skName}`),
        h('div', { class: 'list' }, others.map(o => h('a', { href: o.href }, h('span', {}, pl(o.p), o.name, ' ', o.elected ? h('span', { class: 'st yes' }, '✓') : null), h('small', {}, fmtN(o.votes) + ' stemmer'))))));
      el.append(h('p', { class: 'protonote', role: 'note' }, 'Navnet er fiktivt og genereret til prototypen. Der er ingen kobling til rigtige personer eller til officielle resultater. En rigtig kandidatside kan også rumme foto, kort præsentation og kontaktoplysninger – de er ikke med her.'));
      return el;
    }

    /* ---------- hvem er valgt ind ---------- */
    function valgt(parts, q) {
      const valg = q.valg === 'fv' ? 'fv' : KV;
      document.title = 'Hvem er valgt ind? – valg.dk (prototype)';
      const pool0 = (valg === 'fv' ? allFV : allKV).filter(c => c.elected);
      let f = { p: q.p || '', area: q.o || '', text: '', sort: 'v', n: 40 };
      const el = h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Hvem er valgt ind?' }));
      el.append(h('h1', {}, 'Hvem er valgt ind?'), h('p', { class: 'lead' }, 'Mandatfordelingen og de valgte – sorteret efter personlige stemmer. Filtrér på parti, område eller navn.'));
      el.append(h('div', { class: 'pills', style: 'margin-top:20px', role: 'group', 'aria-label': 'Vælg valg' }, [[KV, ELS[KV].name], ['fv', FV.name]].map(([id, t]) => h('a', { class: 'pill' + (id === valg ? ' active' : ''), href: href('/valgt', { valg: id }), 'aria-current': id === valg ? 'true' : null }, t))));
      const m = {}; pool0.forEach(c => { m[c.p] = (m[c.p] || 0) + 1; });
      const mrows = Object.keys(m).map(p => ({ p, m: m[p] })).sort((a, b) => b.m - a.m);
      el.append(h('section', { class: 'panel', style: 'margin-top:26px' }, h('h2', { style: 'font-size:22px;margin-bottom:12px' }, 'Mandatfordeling'), mbar(mrows), h('div', { class: 'legend' }, mrows.map(r => h('span', {}, h('i', { style: `background:${D.parties[r.p].color}` }), `${r.p} ${PN(r.p)} (${fmtN(r.m)})`)))));
      const parties = h('select', { class: 'select', id: 'fp', 'aria-label': 'Parti' }, h('option', { value: '' }, 'Alle partier'), mrows.map(r => h('option', { value: r.p }, `${r.p} – ${PN(r.p)}`)));
      const areas = valg === 'fv' ? FV.storkredse.map(x => [x.id, x.name]) : REG.map(r => [r.id, r.name]);
      const asel = h('select', { class: 'select', id: 'fa', 'aria-label': valg === 'fv' ? 'Storkreds' : 'Region' }, h('option', { value: '' }, valg === 'fv' ? 'Alle storkredse' : 'Alle regioner'), areas.map(([id, t]) => h('option', { value: id }, t)));
      const txt = h('input', { type: 'search', class: 'select', id: 'ft', placeholder: 'Søg navn eller ' + (valg === 'fv' ? 'kreds' : 'kommune') + ' …', 'aria-label': 'Søg i de valgte' });
      const ssel = h('select', { class: 'select', id: 'fs', 'aria-label': 'Sortér' }, [['v', 'Flest personlige stemmer'], ['n', 'Navn A–Å'], ['p', 'Parti']].map(([v, t]) => h('option', { value: v }, t)));
      parties.value = f.p; asel.value = f.area;
      const tbody = h('tbody'), count = h('p', { class: 'mapnote', role: 'status', 'aria-live': 'polite' }), more = h('button', { class: 'btn secondary small', type: 'button' }, 'Vis flere');
      const filtered = () => { const t = lc(f.text).trim(); return pool0.filter(c => (!f.p || c.p === f.p) && (!f.area || (c.t === 'fv' ? c.sk === f.area : H.regOf(byId[c.kom]) === f.area)) && (!t || lc(c.name).includes(t) || lc(c.t === 'fv' ? c.kredsName : c.komName).includes(t))).sort(f.sort === 'n' ? (a, b) => a.name.localeCompare(b.name, 'da') : f.sort === 'p' ? (a, b) => POL.indexOf(a.p) - POL.indexOf(b.p) || b.votes - a.votes : (a, b) => b.votes - a.votes); };
      function draw() {
        const list = filtered(); tbody.innerHTML = '';
        list.slice(0, f.n).forEach(c => tbody.append(h('tr', {}, h('td', {}, pl(c.p), PN(c.p)), h('td', {}, h('a', { href: c.href }, c.name)), h('td', {}, c.t === 'kv' ? c.komName : `${c.kredsName}`, h('small', { class: 'dsub' }, c.t === 'kv' ? c.region.replace('Region ', '') : c.skName.replace(' Storkreds', ''))), h('td', { class: 'num' }, fmtN(c.votes)), h('td', {}, chip(c)))));
        count.textContent = `Viser ${Math.min(f.n, list.length)} af ${fmtN(list.length)} valgte.`; more.hidden = list.length <= f.n;
        if (!list.length) tbody.append(h('tr', {}, h('td', { colspan: 5 }, 'Ingen valgte matcher dine filtre.')));
      }
      const upd = () => { f.p = parties.value; f.area = asel.value; f.text = txt.value; f.sort = ssel.value; f.n = 40; draw(); };
      [parties, asel, ssel].forEach(x => x.addEventListener('change', () => { log('filter', x.id); upd(); })); txt.addEventListener('input', upd);
      more.addEventListener('click', () => { f.n += 80; draw(); });
      el.append(h('div', { class: 'filters' }, parties, asel, txt, ssel,
        h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(`valgte-${valg}.csv`, csv(['Valg', 'Parti', 'Kandidat', valg === 'fv' ? 'Opstillingskreds' : 'Kommune', valg === 'fv' ? 'Storkreds' : 'Region', 'Personlige stemmer', 'Status'], filtered().map(c => [vname(valg), c.p, c.name, c.t === 'kv' ? c.komName : c.kredsName, c.t === 'kv' ? c.region : c.skName, c.votes, statusTxt(c)]), { sep: ';', dec: ',' })) }, '⬇ Hent til Excel'), shareBtn()));
      el.append(count, h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, 'Valgte kandidater'),
        h('thead', {}, h('tr', {}, ['Parti', 'Kandidat', valg === 'fv' ? 'Opstillingskreds' : 'Kommune', 'Personlige stemmer', 'Status'].map((t, i) => h('th', { scope: 'col', class: i === 3 ? 'num' : '' }, t)))), tbody)), h('div', { style: 'text-align:center;margin-top:10px' }, more));
      el.append(h('p', { class: 'source' }, 'Kilde: eksempeldata og fiktive navne i prototypen – ikke officielle valgresultater.'));
      draw();
      return el;
    }

    /* ---------- metode: hvad er mandatfordeling? ---------- */
    function metode() {
      document.title = 'Sådan fordeles mandaterne – valg.dk (prototype)';
      const el = h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Sådan fordeles mandaterne' }));
      el.append(h('h1', {}, 'Hvad er mandatfordeling, og hvem er valgt ind?'),
        h('p', { class: 'protonote', role: 'note' }, 'Forklaringen er skrevet til prototypen for at vise, hvor et enkelt svar kan stå. Den er ikke gengivet fra den officielle valg.dk og skal kontrolleres mod officielle kilder, før den bruges andre steder. Beregningerne i prototypen er forenklede og bruger eksempeldata.'),
        h('div', { class: 'prose' },
          h('h2', {}, 'Kort fortalt'), h('p', {}, 'Et mandat er en plads i byrådet eller i Folketinget. Mandatfordelingen viser, hvor mange pladser hvert parti har fået. Hvem der sidder på partiets pladser, afgøres af, hvem der fik flest personlige stemmer.'),
          h('h2', {}, 'Kommunalvalg'), h('p', {}, 'Hver kommune har sit eget byråd med et fast antal mandater. Partiernes stemmer omregnes til mandater (i prototypen med d’Hondt-metoden). De kandidater på partiets liste, der fik flest personlige stemmer, bliver valgt.'),
          h('h2', {}, 'Folketingsvalg'), h('p', {}, 'Folketinget har 175 mandater i Danmark. 135 er kredsmandater, som fordeles på de 10 storkredse. De sidste 40 er tillægsmandater, som udjævner forskellen mellem partiernes stemmeandel og deres mandater på landsplan. Et parti skal normalt nå 2 % af stemmerne for at få tillægsmandater. Valgte personer er dem med flest personlige stemmer på partiets liste.'),
          h('h2', {}, 'Det her er forenklet i prototypen'),
          h('ul', {}, h('li', {}, 'Tillægsmandater er fordelt med en enkel udjævning og ikke efter de officielle regler.'), h('li', {}, 'Opstillingskredse er en forenklet inddeling. Hver kreds har én kandidat pr. parti.'), h('li', {}, 'Alle navne er fiktive, og alle tal er eksempeldata.')),
          h('p', {}, h('a', { href: href('/valgt', { valg: KV }) }, 'Se hvem der er valgt ind  →'))));
      return el;
    }

    /* ---------- kommunesiden: valgte og kandidater ---------- */
    function kommuneExtras(k, valg) {
      const wrap = h('div');
      if (valg !== KV) { wrap.append(h('p', { class: 'protonote', role: 'note', style: 'margin-top:36px' }, 'Kandidater er kun med for ' + ELS[KV].name + ' i prototypen.')); return wrap; }
      if (LIVE.on && !isCounted(k.id)) wrap.append(h('p', { class: 'protonote', role: 'status', style: 'margin-top:30px' }, `Valgaftens-simulation: ${k.short} er ikke optalt endnu. Tallene på siden er de endelige eksempeldata.`));
      const R = k.results[KV], lists = K.kv2025[k.id] || {};
      const parties = Object.keys(lists).sort((a, b) => (R.mandates[b] || 0) - (R.mandates[a] || 0) || R.votes[b] - R.votes[a]);
      const withM = parties.filter(p => R.mandates[p] > 0);
      let ft = '';
      const groups = h('div', { class: 'cgroups' });
      const drawG = () => {
        groups.innerHTML = '';
        parties.forEach(p => {
          const m = R.mandates[p] || 0, rows = lists[p].map((c, i) => ({ c, i })).filter(({ c }) => !ft || lc(c[0]).includes(ft));
          if (!rows.length) return;
          groups.append(h('details', { class: 'cgroup', open: ft ? true : null },
            h('summary', {}, pl(p), h('strong', {}, PN(p)), h('span', { class: 'cg-n' }, m ? `${m} valgt` : 'ingen valgt'), h('small', {}, `${fmtN(R.votes[p])} stemmer`)),
            h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl compact' }, h('caption', { class: 'sr-only' }, 'Kandidater for ' + PN(p)), h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Kandidat'), h('th', { scope: 'col', class: 'num' }, 'Personlige stemmer'), h('th', { scope: 'col', class: 'num' }, 'Andel af partiets stemmer'), h('th', { scope: 'col' }, 'Status'))),
              h('tbody', {}, rows.map(({ c, i }) => h('tr', {}, h('td', {}, h('a', { href: `#/kandidat/kv/${k.id}/${enc(p)}/${i}` }, c[0])), h('td', { class: 'num' }, fmtN(c[1])), h('td', { class: 'num' }, fmtP(c[1] / R.votes[p] * 100)), h('td', {}, i < m ? h('span', { class: 'st yes' }, '✓ Valgt') : h('span', { class: 'st no' }, 'Ikke valgt')))))))));
        });
        if (!groups.children.length) groups.append(h('p', { class: 'panel' }, 'Ingen kandidater matcher.'));
      };
      const inp = h('input', { type: 'search', class: 'select', id: 'kf', placeholder: 'Søg i kandidaterne i ' + k.short + ' …', 'aria-label': 'Søg i kandidaterne' });
      inp.addEventListener('input', () => { const t = lc(inp.value).trim(); ft = t.length >= 2 ? t : ''; drawG(); });
      drawG();
      wrap.append(h('section', { class: 'section', 'aria-labelledby': 'h-valgte' },
        h('div', { class: 'toolbar', style: 'margin-top:0' }, h('h2', { id: 'h-valgte', style: 'font-size:22px' }, `Hvem er valgt ind? (${k.seats} byrådsmedlemmer)`), h('span', { class: 'spacer' }),
          h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(`kandidater-${k.id}-${KV}.csv`, csv(['Kommune', 'Parti', 'Kandidat', 'Personlige stemmer', 'Status'], parties.flatMap(p => lists[p].map((c, i) => [k.short, p, c[0], c[1], i < (R.mandates[p] || 0) ? 'Valgt' : 'Ikke valgt'])), { sep: ';', dec: ',' })) }, '⬇ Hent kandidater til Excel')),
        h('div', { class: 'valgte-grid' }, withM.map(p => h('div', { class: 'vg', style: `border-top-color:${D.parties[p].color}` }, h('p', { class: 'vg-h' }, pl(p), h('strong', {}, PN(p)), h('small', {}, `${R.mandates[p]} ${R.mandates[p] === 1 ? 'mandat' : 'mandater'}`)),
          h('ul', {}, lists[p].slice(0, R.mandates[p]).map((c, i) => h('li', {}, h('a', { href: `#/kandidat/kv/${k.id}/${enc(p)}/${i}` }, c[0]), h('small', {}, fmtN(c[1]))))))))),
      h('section', { class: 'section', 'aria-labelledby': 'h-allek' }, h('div', { class: 'toolbar', style: 'margin-top:0' }, h('h2', { id: 'h-allek', style: 'font-size:22px' }, 'Alle kandidater'), h('span', { class: 'spacer' }), inp), groups,
        h('p', { class: 'source' }, 'Kilde: eksempeldata og fiktive navne i prototypen – ikke officielle valgresultater og ikke rigtige personer.')));
      return wrap;
    }

    initChrome();
    Object.assign(window.VX, {
      home, kommuneExtras, statusBadge, searchExtra, afterRender: () => { if (layerOpen) { layerOpen.opener = null; closeLayer(); } const r = location.hash.replace(/^#/, '') || '/'; document.body.classList.toggle('fit', r === '/' || r.startsWith('/?')); },
      routes: { kredse, storkreds, kreds, kandidat, valgt, metode },
    });
  }
})();
