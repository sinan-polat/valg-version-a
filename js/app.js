/* Valg.dk – prototype til bachelorprojekt. Ren HTML/CSS/JS, ingen afhængigheder.
   Alle tal er EKSEMPELDATA (se tools/generate_data.py). Routing sker via #-adresser. */
(function () {
  'use strict';
  const D = window.DATA;
  const KOM = D.kommuner;
  const byId = Object.fromEntries(KOM.map(k => [k.id, k]));
  const ELS = D.elections;
  const main = document.getElementById('main');
  const log = (t, d) => { if (window.VLOG) window.VLOG(t, d); };
  const COL = ['#0B4FBF', '#E6732F', '#12998F'];
  const DEFAULT_VALG = 'kv2025';
  const isA = window.VVER === 'a'; // version A = nuværende struktur (valgtype først)
  const isC = window.VVER === 'c'; // version C = nyt design: valgaften, kredse og kandidater
  document.body.dataset.ver = window.VVER;

  /* ---------- hjælpere ---------- */
  const fmtN = n => Math.round(n).toLocaleString('da-DK');
  const fmtP = (n, d = 1) => n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' %';
  const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toLocaleString('da-DK', { maximumFractionDigits: 1 });
  const norm = s => s.toLowerCase().replace(/aa/g, 'å').replace(/\s+kommune$/, '').trim();

  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      e.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return e;
  }
  const svgNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, ...kids) {
    const e = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    kids.flat().forEach(k => k != null && e.append(k.nodeType ? k : document.createTextNode(k)));
    return e;
  }
  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = raw.split('?');
    return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  function href(path, q) {
    const qs = q ? new URLSearchParams(Object.entries(q).filter(([, v]) => v != null && v !== '')).toString() : '';
    return '#' + path + (qs ? '?' + qs : '');
  }
  const icons = {
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    compare: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
    download: '<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>',
  };
  const icon = n => h('span', { class: 'ic', 'aria-hidden': 'true', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[n]}</svg>` });
  const crumb = (...items) => h('nav', { class: 'crumb', 'aria-label': 'Brødkrumme' }, items.map((it, i) => [i ? '  ›  ' : '', it.href ? h('a', { href: it.href }, it.t) : it.t]));

  function mapSvg() {
    return h('div', { class: 'map', 'aria-hidden': 'true', html: '<svg viewBox="0 0 300 330" fill="#C6D8EA"><path d="M70 10c30-8 55 10 58 40 3 25-12 40-8 62 4 22 22 34 14 62-8 28-34 46-52 40-24-8-34-40-30-70 3-24-18-34-20-62C30 52 44 18 70 10z"/><ellipse cx="170" cy="195" rx="30" ry="26"/><path d="M215 120c28-14 66 4 70 36 4 30-26 52-54 46-26-6-40-30-16-82z"/><circle cx="285" cy="215" r="9"/></svg>' });
  }

  /* ---------- søgeforslag (combobox) ---------- */
  let acSeq = 0;
  function autocomplete(input, getItems, onPick) {
    const id = 'ac' + (++acSeq);
    const ul = h('ul', { class: 'suggest', role: 'listbox', id, hidden: true });
    input.after(ul);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', id);
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('autocomplete', 'off');
    let items = [], idx = -1;
    function close() { ul.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); idx = -1; }
    function paint() {
      ul.innerHTML = '';
      items.forEach((it, i) => {
        const li = h('li', { role: 'option', id: id + '-' + i, 'aria-selected': String(i === idx) }, h('span', {}, h('strong', {}, it.label)), h('span', { class: 'meta' }, it.meta || ''));
        li.addEventListener('mousedown', e => { e.preventDefault(); pick(i); });
        ul.append(li);
      });
      if (!items.length && input.value.trim()) ul.append(h('li', { class: 'empty', role: 'option', 'aria-selected': 'false' }, 'Ingen forslag – tryk Enter for at søge alligevel'));
      ul.hidden = !ul.children.length;
      input.setAttribute('aria-expanded', String(!ul.hidden));
      if (idx >= 0) input.setAttribute('aria-activedescendant', id + '-' + idx);
    }
    function pick(i) { const it = items[i]; if (!it) return; close(); onPick(it); }
    input.addEventListener('input', () => { items = input.value.trim() ? getItems(input.value) : []; idx = -1; paint(); });
    input.addEventListener('focus', () => { if (input.value.trim()) { items = getItems(input.value); paint(); } });
    input.addEventListener('blur', () => setTimeout(close, 120));
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!items.length) { items = getItems(input.value); } idx = Math.min(idx + 1, items.length - 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); paint(); }
      else if (e.key === 'Escape') close();
      else if (e.key === 'Enter') { if (idx >= 0) { e.preventDefault(); pick(idx); } else if (input.dataset.enter === 'first' && getItems(input.value)[0]) { e.preventDefault(); items = getItems(input.value); pick(0); } }
    });
  }
  function searchKommuner(q) {
    const n = norm(q); if (!n) return [];
    const starts = KOM.filter(k => norm(k.name).startsWith(n));
    const incl = KOM.filter(k => !norm(k.name).startsWith(n) && norm(k.name).includes(n));
    return starts.concat(incl).slice(0, 7).map(k => ({ type: 'kommune', id: k.id, label: k.name + ' Kommune', meta: k.region.replace('Region ', '') }));
  }
  function searchAll(q) {
    const n = q.toLowerCase().trim();
    const els = Object.entries(ELS).filter(([, e]) => e.name.toLowerCase().includes(n) || (n.length > 3 && 'kommunalvalg'.startsWith(n))).map(([id, e]) => ({ type: 'valg', id, label: e.name, meta: 'Valg' }));
    const extra = isC && window.VX ? window.VX.searchExtra(q) : [];
    return searchAreas(q).slice(0, 5).concat(searchParties(q).slice(0, 3), extra, els).slice(0, isC ? 11 : 9);
  }

  /* ---------- data-hjælpere ---------- */
  function partyRows(k, valg) {
    const R = k.results[valg];
    const prev = ELS[valg].prev ? k.results[ELS[valg].prev] : null;
    return Object.keys(R.votes).filter(p => R.votes[p] > 0).map(p => ({
      p, name: D.parties[p].name, color: D.parties[p].color, votes: R.votes[p], share: R.votes[p] / R.valid * 100,
      m: (R.mandates || {})[p] || 0, d: prev && prev.mandates && R.mandates ? (R.mandates[p] || 0) - (prev.mandates[p] || 0) : null,
      dv: prev ? R.votes[p] - (prev.votes[p] || 0) : null, ds: prev ? R.votes[p] / R.valid * 100 - (prev.votes[p] || 0) / prev.valid * 100 : null,
    }));
  }
  const sortRows = (rows, mode) => rows.slice().sort(mode === 'alpha'
    ? (a, b) => a.p.localeCompare(b.p, 'da')
    : (a, b) => b.m - a.m || b.votes - a.votes || a.p.localeCompare(b.p, 'da'));
  function csv(head, rows, { sep = ';', dec = ',' } = {}) {
    const q = v => { if (typeof v === 'number') return String(v).replace('.', dec); return '"' + String(v).replace(/"/g, '""') + '"'; };
    return '﻿' + [head.map(q).join(sep)].concat(rows.map(r => r.map(q).join(sep))).join('\r\n');
  }
  function download(name, text) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })), download: name });
    document.body.append(a); a.click(); a.remove();
    log('export', name);
  }
  const searchOnlyKommuner = searchKommuner;


  /* ---------- del, udskriv og gem som billede ---------- */
  function shareUrl() { return location.origin + location.pathname + location.hash; } // uden ?test= og ?v=
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise((res, rej) => { const ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = t; document.body.append(ta); ta.select(); try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } ta.remove(); });
  }
  function shareBtn(cls) {
    const b = h('button', { class: cls || 'btn secondary small', type: 'button', 'aria-live': 'polite' }, '🔗 Kopiér link');
    b.addEventListener('click', () => {
      log('share', shareUrl());
      copyText(shareUrl()).then(() => { b.textContent = '✓ Link kopieret'; }, () => { b.textContent = 'Kopiér fra adresselinjen'; });
      setTimeout(() => { b.textContent = '🔗 Kopiér link'; }, 2200);
    });
    return b;
  }
  const printBtn = cls => h('button', { class: cls || 'btn secondary small', type: 'button', onclick: () => { log('print', location.hash); window.print(); } }, '🖨 Udskriv');
  /* Gem et SVG-diagram som PNG, med titel, signaturforklaring og kildelinje */
  function exportPng({ svg, title, legend, fname, note }) {
    const vb = svg.viewBox.baseVal, W = vb.width, H = vb.height, k = 2;
    const clone = svg.cloneNode(true), src = [svg, ...svg.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
    const props = ['fill', 'stroke', 'stroke-width', 'font-size', 'font-weight', 'font-family', 'paint-order', 'stroke-linejoin', 'opacity', 'letter-spacing', 'fill-opacity'];
    src.forEach((n, i) => { const cs = getComputedStyle(n); props.forEach(p => dst[i].style.setProperty(p, cs.getPropertyValue(p))); dst[i].style.animation = 'none'; dst[i].style.transform = 'none'; });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', W * k); clone.setAttribute('height', H * k);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const font = 'Inter, Segoe UI, Arial, sans-serif', pad = 40 * k, cw = Math.max(W, 780) * k + pad * 2, lh = 30 * k;
      const m = document.createElement('canvas').getContext('2d'); m.font = `${15 * k}px ${font}`;
      const pos = []; let x = pad, row = 0;
      (legend || []).forEach(l => { const w = m.measureText(l.name).width + 20 * k; if (x + w > cw - pad && x > pad) { x = pad; row++; } pos.push([x, row]); x += w + 28 * k; });
      const rows = legend && legend.length ? row + 1 : 0, top = (84 + 8) * k + rows * lh + 12 * k, foot = (note ? 80 : 56) * k;
      const cv = document.createElement('canvas'); cv.width = cw; cv.height = H * k + top + foot;
      const c = cv.getContext('2d');
      c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height);
      c.fillStyle = '#0F1C2E'; c.font = `700 ${28 * k}px ${font}`; c.fillText(title, pad, 52 * k, cw - pad * 2);
      c.font = `${15 * k}px ${font}`;
      (legend || []).forEach((l, i) => { const [lx, r] = pos[i], ly = 92 * k + r * lh; c.fillStyle = l.color; c.fillRect(lx, ly - 13 * k, 14 * k, 14 * k); c.fillStyle = '#33424F'; c.fillText(l.name, lx + 20 * k, ly); });
      c.drawImage(img, (cw - W * k) / 2, top);
      c.fillStyle = '#5B6877'; c.font = `${13 * k}px ${font}`;
      if (note) c.fillText(note, pad, cv.height - 46 * k);
      c.fillText('Kilde: eksempeldata i prototypen til bachelorprojekt – ikke officielle valgresultater.', pad, cv.height - 20 * k);
      cv.toBlob(b => { const a = h('a', { href: URL.createObjectURL(b), download: fname }); document.body.append(a); a.click(); a.remove(); log('export', fname); URL.revokeObjectURL(url); }, 'image/png');
    };
    img.src = url;
  }
  const pngBtn = (getArgs, cls) => h('button', { class: cls || 'btn secondary small', type: 'button', onclick: () => exportPng(getArgs()) }, '🖼 Gem som billede');

  /* ---------- partier ---------- */
  function searchParties(q) {
    const n = q.toLowerCase().trim(); if (!n) return [];
    return Object.entries(D.parties).filter(([p, v]) => v.name.toLowerCase().includes(n) || (n.length === 1 && p.toLowerCase() === n)).sort((x, y) => (y[1].name.toLowerCase().startsWith(n) - x[1].name.toLowerCase().startsWith(n))).map(([p, v]) => ({ type: 'parti', id: p, label: v.name + ' (' + p + ')', meta: 'Parti' }));
  }
  function parti(parts, q) {
    const p = parts[1], P = D.parties[p];
    if (!P) return ikkeMed([], { side: 'Ukendt parti' });
    const valg = ELS[q.valg] ? q.valg : DEFAULT_VALG, prevId = ELS[valg].prev;
    document.title = `${P.name} – ${ELS[valg].name} – valg.dk (prototype)`;
    const land = getArea('land'), R = land.results[valg], R0 = prevId ? land.results[prevId] : null;
    const votes = R.votes[p] || 0, m = R.mandates[p] || 0, m0 = R0 ? (R0.mandates[p] || 0) : null;
    let mode = 'share';
    const rowsAll = KOM.map(k => { const r = k.results[valg], v = r.votes[p] || 0; return { k, v, share: v / r.valid * 100, m: r.mandates[p] || 0 }; }).filter(r => r.v > 0);
    const tbody = h('tbody');
    const sel = h('select', { class: 'select', id: 'psort', 'aria-label': 'Sortér kommuner' }, h('option', { value: 'share' }, 'Højeste stemmeandel'), h('option', { value: 'm' }, 'Flest mandater'), h('option', { value: 'alpha' }, 'A–Å'));
    function draw() {
      const rows = rowsAll.slice().sort(mode === 'm' ? (a, b) => b.m - a.m || b.share - a.share : mode === 'alpha' ? (a, b) => a.k.name.localeCompare(b.k.name, 'da') : (a, b) => b.share - a.share);
      tbody.innerHTML = '';
      rows.forEach(r => tbody.append(h('tr', {}, h('td', {}, h('a', { href: resultHref(r.k.id, valg) }, r.k.name)), h('td', { class: 'num' }, fmtN(r.v)), h('td', { class: 'num' }, fmtP(r.share)), h('td', { class: 'num' }, String(r.m)))));
    }
    sel.addEventListener('change', () => { mode = sel.value; log('sort', mode); draw(); });
    draw();
    const exRows = () => rowsAll.slice().sort((a, b) => b.share - a.share).map(r => [r.k.region, r.k.name, r.v, +r.share.toFixed(2), r.m]);
    const exHead = ['Region', 'Kommune', 'Stemmer', 'Andel (%)', 'Mandater'];
    const fname = ext => `parti-${p}-${valg}${ext}`;
    const el = h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Valgresultater', href: '#/find' }, { t: P.name }));
    el.append(h('div', { class: 'titlerow' }, h('span', { class: 'pletter', style: `background:${P.color};width:40px;height:40px;font-size:20px`, 'aria-hidden': 'true' }, p), h('h1', {}, P.name), h('span', { class: 'badge' }, 'Endeligt resultat')));
    el.append(h('p', { class: 'lead' }, `${ELS[valg].name} · hele landet`));
    el.append(h('div', { class: 'pills', style: 'margin-top:20px', role: 'group', 'aria-label': 'Skift valg' }, Object.entries(ELS).map(([id, e]) => h('a', { class: 'pill' + (id === valg ? ' active' : ''), href: href('/parti/' + p, { valg: id }), 'aria-current': id === valg ? 'true' : null }, e.name))));
    if (!votes) { el.append(h('p', { class: 'panel', style: 'margin-top:24px' }, `${P.name} fik ingen stemmer ved ${ELS[valg].name}.`)); return el; }
    el.append(h('section', { class: 'panel', style: 'margin-top:26px', 'aria-label': 'Nøgletal' }, h('div', { class: 'kpis', style: 'margin-top:0' },
      h('div', { class: 'stat main' }, h('div', { class: 'lbl' }, 'Mandater i alt'), h('div', { class: 'val' }, fmtN(m))),
      h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Stemmeandel'), h('div', { class: 'val' }, fmtP(votes / R.valid * 100))),
      h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Ændring i mandater'), h('div', { class: 'val' }, m0 == null ? '–' : sgn(m - m0))),
      h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Stemmer'), h('div', { class: 'val' }, fmtN(votes))))));
    el.append(h('div', { class: 'toolbar' }, h('h2', { style: 'font-size:22px' }, `Kommuner (${rowsAll.length})`), h('span', { class: 'spacer' }),
      h('label', { for: 'psort', style: 'color:var(--muted);font-size:14px' }, 'Sortér efter'), sel, shareBtn(), printBtn(),
      h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(fname('.csv'), csv(exHead, exRows(), { sep: ';', dec: ',' })) }, '⬇ Hent til Excel')));
    el.append(h('div', { class: 'tbl-wrap', style: 'max-height:600px;overflow:auto' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, `${P.name} i kommunerne`),
      h('thead', {}, h('tr', {}, ['Kommune', 'Stemmer', 'Andel', 'Mandater'].map((t, i) => h('th', { scope: 'col', class: i ? 'num' : '' }, t)))), tbody)));
    el.append(h('p', { class: 'source' }, 'Kilde: eksempeldata i prototypen – ikke officielle valgresultater. Søgning på kandidater er ikke med i prototypen.'));
    return el;
  }

  /* ---------- områder: kommune, region, hele landet ---------- */
  const REG = window.GEO.REGIONS;
  const regOf = k => window.GEO.regionId(k);
  function aggregate(list, valg) {
    const o = { electorate: 0, cast: 0, valid: 0, votes: {}, mandates: {} };
    list.forEach(k => {
      const R = k.results[valg];
      o.electorate += R.electorate; o.cast += R.cast; o.valid += R.valid;
      Object.keys(R.votes).forEach(p => { o.votes[p] = (o.votes[p] || 0) + R.votes[p]; });
      Object.keys(R.mandates).forEach(p => { o.mandates[p] = (o.mandates[p] || 0) + R.mandates[p]; });
    });
    o.turnout = o.electorate ? o.cast / o.electorate * 100 : 0;
    return o;
  }
  const areaCache = {};
  function getArea(id) {
    if (!id) return null;
    if (areaCache[id]) return areaCache[id];
    let a = null;
    if (byId[id]) {
      const k = byId[id];
      a = { id, type: 'kommune', label: k.name + ' Kommune', short: k.name, seats: k.seats, kommuner: [k], results: k.results, region: k.region, regionId: regOf(k) };
    } else if (id === 'land' || REG.some(r => r.id === id)) {
      const list = id === 'land' ? KOM : KOM.filter(k => regOf(k) === id);
      const rg = REG.find(r => r.id === id);
      a = { id, type: id === 'land' ? 'land' : 'region', label: id === 'land' ? 'Hele landet' : rg.name, short: id === 'land' ? 'Hele landet' : rg.short, kommuner: list, seats: list.reduce((t, k) => t + k.seats, 0), results: {} };
      Object.keys(ELS).forEach(v => { a.results[v] = aggregate(list, v); });
    }
    if (a) areaCache[id] = a;
    return a;
  }
  const biggest = (a, valg) => { const R = a.results[valg]; return Object.keys(R.mandates).reduce((x, y) => (R.mandates[y] > R.mandates[x] || (R.mandates[y] === R.mandates[x] && R.votes[y] > R.votes[x])) ? y : x); };
  const AREA_LIST = [{ id: 'land', label: 'Hele landet', meta: 'Land', keys: ['hele landet', 'danmark', 'landsresultat'] }]
    .concat(REG.map(r => ({ id: r.id, label: r.name, meta: 'Region', keys: [r.name.toLowerCase(), r.short.toLowerCase()] })));
  function searchRegions(q) {
    const n = q.toLowerCase().trim(); if (!n) return [];
    return AREA_LIST.filter(a => a.keys.some(k => k.startsWith(n) || (n.length > 2 && k.includes(n)))).map(a => ({ type: a.id === 'land' ? 'land' : 'region', id: a.id, label: a.label, meta: a.meta }));
  }
  const searchAreas = q => searchKommuner(q).slice(0, 6).concat(searchRegions(q)).slice(0, 8);
  function resolveArea(text) {
    const n = text.toLowerCase().trim(); if (!n) return null;
    const k = KOM.find(k => norm(k.name) === norm(n));
    if (k) return k.id;
    const r = AREA_LIST.find(a => a.label.toLowerCase() === n || a.keys.includes(n));
    return r ? r.id : null;
  }
  const areaName = id => { const a = getArea(id); return !a ? '' : a.type === 'kommune' ? a.short : a.label; };
  const resultHref = (id, valg, extra) => href('/resultat/' + id, Object.assign({ valg }, extra || {}));


  /* ---------- kort ---------- */
  function mapCard({ valg, region, title }) {
    let metric = 'turnout';
    const holder = h('div'), lg = h('div');
    const bT = h('button', { type: 'button', 'aria-pressed': 'true' }, 'Valgdeltagelse');
    const bP = h('button', { type: 'button', 'aria-pressed': 'false' }, 'Største parti');
    function draw() {
      holder.innerHTML = ''; lg.innerHTML = '';
      holder.append(GEO.renderMap({ valg, metric, region, onSelect: id => { log('map', id); location.hash = resultHref(id, valg); }, onRegion: rid => { log('map', rid); location.hash = resultHref(rid, valg); } }));
      lg.append(GEO.legend(valg, metric, region ? GEO.ZOOM_SCALE : 1));
      bT.setAttribute('aria-pressed', String(metric === 'turnout')); bP.setAttribute('aria-pressed', String(metric === 'party'));
    }
    bT.addEventListener('click', () => { metric = 'turnout'; draw(); });
    bP.addEventListener('click', () => { metric = 'party'; draw(); });
    draw();
    return h('div', { class: 'mapcard' },
      h('div', { class: 'head' }, h('h3', {}, title), h('div', { class: 'seg', role: 'group', 'aria-label': 'Vis på kortet' }, bT, bP)),
      holder, lg, h('div', { class: 'noprint', style: 'margin-top:12px' }, pngBtn(() => ({ svg: holder.querySelector('svg'), title: (title || 'Kort') + ' – ' + (metric === 'turnout' ? 'valgdeltagelse' : 'største parti') + ' (' + ELS[valg].name + ')', legend: [...lg.querySelectorAll('.lg-col')[0].querySelectorAll('span')].map(sp => ({ name: sp.textContent.trim(), color: sp.querySelector('i').style.backgroundColor })), fname: 'kort-' + (region || 'danmark') + '-' + valg + '.png', note: 'Hver cirkel er en kommune. Cirklens areal viser antal valgberettigede. Skematisk kort.' }))),
      h('p', { class: 'mapnote' }, 'Skematisk kort med eksempeldata. Hver cirkel er en kommune – cirklens areal viser antal valgberettigede, så store kommuner som København fylder mere. Klik på en cirkel eller region for at se resultatet.'));
  }

  function accordion(linkFor) {
    const accData = [
      ['Kommunalvalg', 'Find resultater fra kommunalvalg i hele Danmark', [h('a', { href: linkFor('kv2025') }, 'Kommunalvalg 2025'), h('a', { href: linkFor('kv2021') }, 'Kommunalvalg 2021')]],
      ['Regionsrådsvalg', 'Find resultater fra regionsrådsvalg i hele Danmark', null],
      ['Europa-Parlamentsvalg', 'Find resultater fra Europa-Parlamentsvalg i Danmark', null],
      ['Folkeafstemning', 'Find resultater fra folkeafstemninger i Danmark', null],
    ];
    const acc = h('div', { class: 'acc' });
    accData.forEach(([t, d, links], i) => {
      const bid = 'acc-b' + i, pid = 'acc-p' + i;
      const item = h('div', { class: 'acc-item', 'data-open': 'false' });
      const btn = h('button', { type: 'button', id: bid, 'aria-expanded': 'false', 'aria-controls': pid }, h('span', { class: 't' }, t), h('span', { class: 'd' }, d), h('span', { class: 'pm', 'aria-hidden': 'true' }, '+'));
      const body = h('div', { class: 'acc-body', id: pid, role: 'region', 'aria-labelledby': bid }, h('div', {}, h('div', { class: 'in' },
        links || [h('p', {}, 'Resultater fra dette valg er ikke med i prototypen.'), h('a', { href: href('/ikke-med', { side: t }) }, 'Læs mere')])));
      btn.addEventListener('click', () => { const o = item.dataset.open !== 'true'; item.dataset.open = String(o); btn.setAttribute('aria-expanded', String(o)); });
      item.append(btn, body); acc.append(item);
    });
    return acc;
  }

  /* ---------- forside ---------- */
  function home() {
    if (isA) return homeA();
    if (isC && window.VX) return window.VX.home();
    document.title = 'valg.dk – prototype';
    const el = h('div', { class: 'page wrap' });
    const inp = h('input', { type: 'text', id: 'q', placeholder: 'Søg kommune, region, kandidat, parti eller valg …', 'aria-label': 'Søg på valg.dk', 'data-enter': 'first' });
    function pickSearch(it) { log('search', it.label); location.hash = it.type === 'valg' ? href('/find', { valg: it.id }) : it.type === 'parti' ? href('/parti/' + it.id, { valg: DEFAULT_VALG }) : resultHref(it.id, DEFAULT_VALG); }
    const go = () => {
      const v = inp.value.trim(); if (!v) return;
      const f = searchAll(v)[0]; log('search', v);
      if (f) pickSearch(f); else location.hash = href('/ikke-med', { side: 'Søgning efter «' + v + '»' });
    };
    const form = h('form', { class: 'search', role: 'search', onsubmit: e => { e.preventDefault(); go(); } },
      h('div', { class: 'box' }, inp, h('button', { class: 'btn', type: 'submit' }, 'Søg')),
      h('p', { class: 'hint' }, 'Fx København, Region Hovedstaden eller Kommunalvalg 2025'));
    el.append(h('div', { class: 'hero' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Officielle valgresultater i Danmark'), h('h1', {}, 'Velkommen til valg.dk'),
      h('p', { class: 'lead' }, 'Find resultater, sammenlign tal og hent data – uanset hvilket valg det handler om.'), h('div', { style: 'margin-top:28px;max-width:640px' }, form))));
    autocomplete(inp, searchAll, pickSearch);

    const card = (hr, ic, t, p) => h('a', { class: 'card', href: hr }, icon(ic), h('h3', {}, t), h('p', {}, p), h('span', { class: 'chev', 'aria-hidden': 'true' }, '›'));
    el.append(h('section', { class: 'section', 'aria-labelledby': 'h-task' }, h('h2', { id: 'h-task' }, 'Hvad vil du gerne?'),
      h('div', { class: 'cards' },
        card('#/find', 'pin', 'Find resultatet for din kommune', 'Se hvordan der blev stemt hos dig'),
        card('#/sammenlign', 'compare', 'Sammenlign områder', 'Sæt 2–3 kommuner eller regioner side om side i et diagram'),
        card('#/data', 'download', 'Hent data', 'Træk tal for hele landet, regioner eller udvalgte kommuner'))));

    const land = getArea('land'), L = land.results[DEFAULT_VALG], L0 = land.results[ELS[DEFAULT_VALG].prev];
    const sel = h('select', { class: 'select', id: 'pickK', 'aria-label': 'Vælg kommune' }, h('option', { value: '' }, 'Vælg kommune …'), KOM.map(k => h('option', { value: k.id }, k.name)));
    sel.addEventListener('change', () => { if (sel.value) location.hash = resultHref(sel.value, DEFAULT_VALG); });
    const bar = (lbl, v, ok) => h('div', { class: 'prog' }, h('div', { class: 'row' }, h('span', {}, lbl), h('strong', {}, fmtP(v, v === 100 ? 0 : 1))), h('div', { class: 'track' }, h('i', { class: ok ? 'ok' : '', style: `width:${v}%` })));
    const status = h('div', { class: 'statuscard' },
      h('h3', {}, 'Landsresultat', h('small', {}, ELS[DEFAULT_VALG].date + ' · Endeligt resultat')),
      h('p', { style: 'margin-top:8px;color:var(--muted)' }, `${fmtN(land.seats)} byrådsmandater i ${KOM.length} kommuner`),
      bar('Valgdeltagelse', L.turnout, false), bar('Foreløbig optælling', 100, true), bar('Fintælling', 100, true),
      h('p', { class: 'mapnote' }, `${sgn(L.turnout - L0.turnout)} %-point valgdeltagelse ift. ${ELS[ELS[DEFAULT_VALG].prev].name}`),
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:10px;margin-top:16px' },
        h('a', { class: 'btn small', href: resultHref('land', DEFAULT_VALG) }, 'Se landsresultatet'),
        h('a', { class: 'btn secondary small', href: '#/data' }, 'Hent data')),
      h('div', { class: 'pick', style: 'margin-top:18px' }, h('label', { for: 'pickK' }, 'Se resultater i din kommune'), sel),
      h('div', { class: 'reglist' }, REG.map(r => {
        const a = getArea(r.id), R = a.results[DEFAULT_VALG];
        return h('a', { class: 'reg-row', href: resultHref(r.id, DEFAULT_VALG) }, h('span', {}, h('i', { class: 'sw', style: `background:${r.tint};border:1px solid #9AA7B5` }), h('strong', {}, r.name)), h('small', {}, fmtP(R.turnout)), h('small', {}, a.seats + ' mand.'));
      })));
    el.append(h('section', { class: 'section', 'aria-labelledby': 'h-map' }, h('h2', { id: 'h-map', style: 'margin-bottom:18px' }, ELS[DEFAULT_VALG].name + ' – resultater på kortet'),
      h('div', { class: 'mapsec' }, mapCard({ valg: DEFAULT_VALG, title: 'Danmark og regionerne' }), status)));

    const acc = accordion(id => href('/find', { valg: id }));
    el.append(h('section', { class: 'section', 'aria-labelledby': 'h-oth' },
      h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:18px' }, h('h2', { id: 'h-oth' }, 'Andre valgtyper'), h('a', { href: '#/find', style: 'font-weight:600' }, 'Se alle valgresultater  →')), acc));
    return el;
  }

  /* ---------- version A: nuværende struktur (valgtype først) ---------- */
  function heroSearch() {
    const inp = h('input', { type: 'text', id: 'q', placeholder: 'Søg kommune, region, kandidat, parti eller valg …', 'aria-label': 'Søg på valg.dk', 'data-enter': 'first' });
    function pickSearch(it) { log('search', it.label); location.hash = it.type === 'valg' ? href('/valg/' + it.id) : it.type === 'parti' ? href('/parti/' + it.id, { valg: DEFAULT_VALG }) : resultHref(it.id, DEFAULT_VALG); }
    const go = () => { const v = inp.value.trim(); if (!v) return; const f = searchAll(v)[0]; log('search', v); if (f) pickSearch(f); else location.hash = href('/ikke-med', { side: 'Søgning efter «' + v + '»' }); };
    const form = h('form', { class: 'search', role: 'search', onsubmit: e => { e.preventDefault(); go(); } },
      h('div', { class: 'box' }, inp, h('button', { class: 'btn', type: 'submit' }, 'Søg')),
      h('p', { class: 'hint' }, 'Fx København eller Kommunalvalg 2025'));
    autocomplete(inp, searchAll, pickSearch);
    return form;
  }
  function homeA() {
    document.title = 'valg.dk – prototype';
    let valg = DEFAULT_VALG;
    const mapHold = h('div'), lgHold = h('div'), title = h('h3', {});
    const statusHold = h('div');
    const sel = h('select', { class: 'select', id: 'pickK', 'aria-label': 'Vælg kommune' }, h('option', { value: '' }, 'Vælg kommune …'), KOM.map(k => h('option', { value: k.id }, k.name)));
    sel.addEventListener('change', () => { if (sel.value) location.hash = resultHref(sel.value, valg); });
    const vsel = h('select', { class: 'select', id: 'pickV', 'aria-label': 'Vælg valg' }, Object.entries(ELS).map(([id, e]) => h('option', { value: id }, e.name)));
    function draw() {
      title.textContent = 'Status på optælling for kommuner';
      mapHold.innerHTML = ''; lgHold.innerHTML = ''; statusHold.innerHTML = '';
      mapHold.append(GEO.renderMap({ valg, metric: 'status', plain: true, onSelect: id => { log('map', id); location.hash = resultHref(id, valg); } }));
      lgHold.append(GEO.legend(valg, 'status', 1));
      const bar = (lbl, txt, v) => h('div', { class: 'prog' }, h('div', { class: 'row' }, h('span', {}, lbl), h('strong', {}, txt)), h('div', { class: 'track' }, h('i', { class: 'ok', style: `width:${v}%` })));
      statusHold.append(h('h3', {}, ELS[valg].name, h('small', {}, ELS[valg].date)), bar('Optalte kommuner', `${KOM.length} af ${KOM.length}`, 100), bar('Foreløbig optælling', '100 %', 100), bar('Fintælling', '100 %', 100),
        h('div', { style: 'margin-top:16px' }, h('a', { class: 'btn small', href: resultHref('land', valg) }, 'Se landsresultat')),
        h('div', { class: 'pick', style: 'margin-top:18px' }, h('label', { for: 'pickK' }, 'Find din kommune'), sel));
    }
    vsel.addEventListener('change', () => { valg = vsel.value; draw(); });
    draw();
    return h('div', { class: 'page wrap' },
      h('div', { class: 'hero' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Officielle valgresultater i Danmark'), h('h1', {}, 'Velkommen til valg.dk'),
        h('p', { class: 'lead' }, 'Her kan du finde valgresultater for igangværende og tidligere valg.'), h('div', { style: 'margin-top:28px;max-width:640px' }, heroSearch()))),
      h('section', { class: 'section', 'aria-labelledby': 'h-stat' }, h('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px' }, h('h2', { id: 'h-stat' }, 'Valgresultater'), h('div', {}, h('label', { for: 'pickV', class: 'sr-only' }, 'Vælg valg'), vsel)),
        h('div', { class: 'mapsec' }, h('div', { class: 'mapcard' }, h('div', { class: 'head' }, title), mapHold, lgHold, h('p', { class: 'mapnote' }, 'Klik på din kommune for at se resultatet og derefter afstemningsområderne. Skematisk kort med eksempeldata.')), h('div', { class: 'statuscard' }, statusHold))),
      h('section', { class: 'section', 'aria-labelledby': 'h-vt' }, h('h2', { id: 'h-vt', style: 'margin-bottom:18px' }, 'Vælg valg'), accordion(id => href('/valg/' + id))));
  }
  function valgList() {
    document.title = 'Valgresultater – valg.dk (prototype)';
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Valgresultater' }),
      h('h1', {}, 'Valgresultater'), h('p', { class: 'lead' }, 'Vælg først, hvilken type valg du leder efter.'),
      h('div', { style: 'margin-top:26px' }, accordion(id => href('/valg/' + id))));
  }
  function valgPage(parts) {
    const id = parts[1];
    if (!ELS[id]) return ikkeMed([], { side: 'Ukendt valg' });
    document.title = ELS[id].name + ' – valg.dk (prototype)';
    const inp = h('input', { type: 'text', id: 'area', placeholder: 'Skriv kommunens navn …', 'aria-label': 'Søg efter kommune', 'data-enter': 'first' });
    const pick = it => { log('search', it.label); location.hash = resultHref(it.id, id); };
    autocomplete(inp, searchKommuner, pick);
    const form = h('form', { class: 'search', role: 'search', onsubmit: e => { e.preventDefault(); const f = searchKommuner(inp.value)[0]; if (f) pick(f); } }, h('div', { class: 'box' }, inp, h('button', { class: 'btn', type: 'submit' }, 'Søg')));
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Valgresultater', href: '#/find' }, { t: ELS[id].name }),
      h('h1', {}, ELS[id].name), h('p', { class: 'lead' }, ELS[id].date + ' · Endeligt resultat'),
      h('div', { class: 'panel', style: 'margin-top:24px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap' },
        h('div', {}, h('h2', { style: 'font-size:20px' }, 'Landsresultat'), h('p', { style: 'color:var(--muted)' }, 'Samlet resultat for alle kommuner')),
        h('a', { class: 'btn', href: resultHref('land', id) }, 'Se landsresultat')),
      h('section', { class: 'section', 'aria-labelledby': 'h-kom' }, h('h2', { id: 'h-kom', style: 'margin-bottom:14px' }, 'Find din kommune'), form,
        h('div', { style: 'margin-top:18px' }, REG.map(r => h('details', { class: 'panel', style: 'padding:14px 20px;margin-bottom:10px' },
          h('summary', { style: 'cursor:pointer;font-weight:700' }, r.name),
          h('p', { style: 'margin-top:12px;display:flex;flex-wrap:wrap;gap:6px 22px' }, h('a', { href: resultHref(r.id, id), style: 'font-weight:700' }, 'Hele regionen'), KOM.filter(k => regOf(k) === r.id).map(k => h('a', { href: resultHref(k.id, id) }, k.name))))))),
      h('section', { class: 'section', 'aria-labelledby': 'h-tool' }, h('h2', { id: 'h-tool', style: 'margin-bottom:14px' }, 'Tal og værktøjer til dette valg'),
        h('div', { class: 'list' }, h('a', { href: href('/sammenlign', { valg: id }) }, h('strong', {}, 'Sammenlign områder'), h('small', {}, 'Kommuner og regioner side om side')), h('a', { href: href('/data', { valg: id }) }, h('strong', {}, 'Eksport af data'), h('small', {}, 'Hent tal som regneark')))));
  }

  /* ---------- find resultat ---------- */
  function find(parts, q) {
    if (isA) return valgList();
    document.title = 'Find resultat – valg.dk (prototype)';
    let valg = ELS[q.valg] ? q.valg : DEFAULT_VALG;
    const inp = h('input', { type: 'text', id: 'area', placeholder: 'Skriv kommune eller region …', 'aria-label': 'Søg efter område', 'data-enter': 'first' });
    const err = h('p', { class: 'error', role: 'alert', hidden: true });
    function pick(it) { log('search', it.label); location.hash = resultHref(it.id, valg); }
    autocomplete(inp, searchAreas, pick);
    const form = h('form', { class: 'search', role: 'search', onsubmit: e => { e.preventDefault(); const f = searchAreas(inp.value)[0]; if (f) pick(f); else { err.hidden = false; err.textContent = 'Vi kan ikke finde «' + inp.value + '». Prøv fx Hørsholm, Aarhus eller Region Hovedstaden.'; log('search', inp.value + ' (ingen)'); } } },
      h('div', { class: 'box' }, inp, h('button', { class: 'btn', type: 'submit' }, 'Søg')));
    const chips = h('div', { class: 'pills', role: 'radiogroup', 'aria-label': 'Vælg valg' }, Object.entries(ELS).map(([id, e]) =>
      h('label', { class: 'pill' }, h('input', { type: 'radio', name: 'valg', value: id, checked: id === valg, onchange: () => { valg = id; history.replaceState(null, '', href('/find', { valg })); } }), h('span', {}, e.name))));
    const often = ['kobenhavn', 'aarhus', 'odense', 'aalborg', 'horsholm'].map(id => byId[id]);
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Find resultat' }),
      h('h1', {}, 'Find dit valgresultat'), h('p', { class: 'lead' }, 'Vælg først valg, og søg derefter på din kommune eller region.'),
      h('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:40px;margin-top:30px;align-items:start', class: 'findgrid' },
        h('div', { class: 'steps', style: 'margin-top:0' },
          h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '1'), 'Vælg valg'), chips),
          h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '2'), 'Søg efter område'), form, err,
            h('div', { class: 'pills', style: 'margin-top:14px' }, h('span', { class: 'lab', style: 'align-self:center;color:var(--muted)' }, 'Eller se:'),
              h('a', { class: 'pill', href: resultHref('land', valg) }, 'Hele landet'),
              REG.map(r => h('a', { class: 'pill', href: resultHref(r.id, valg) }, r.short)))),
          h('div', { class: 'step' }, h('div', { class: 'lab' }, 'Eller find din kommune via region'),
            REG.map(r => h('details', { class: 'panel', style: 'padding:14px 20px;margin-bottom:10px' }, h('summary', { style: 'cursor:pointer;font-weight:700' }, r.name),
              h('p', { style: 'margin-top:12px;display:flex;flex-wrap:wrap;gap:6px 22px' }, KOM.filter(k => regOf(k) === r.id).map(k => h('a', { href: resultHref(k.id, valg) }, k.name))))))),
        h('aside', { class: 'panel' }, h('h3', { style: 'margin-bottom:14px' }, 'Ofte søgte områder'),
          h('div', { class: 'list' }, often.map(k => h('a', { href: resultHref(k.id, valg), style: 'padding:12px 16px' }, k.name + '  ›'))))));
  }

  /* ---------- resultat: kommune, region eller hele landet ---------- */
  function subTable(a, valg) {
    let mode = 'alpha';
    const tbody = h('tbody');
    const sel = h('select', { class: 'select', id: 'subsort', 'aria-label': 'Sortér kommuner' },
      h('option', { value: 'alpha' }, 'A–Å'), h('option', { value: 'el' }, 'Flest valgberettigede'), h('option', { value: 'turn' }, 'Højeste valgdeltagelse'));
    function draw() {
      const rows = a.kommuner.slice().sort(mode === 'el' ? (x, y) => y.results[valg].electorate - x.results[valg].electorate : mode === 'turn' ? (x, y) => y.results[valg].turnout - x.results[valg].turnout : (x, y) => x.name.localeCompare(y.name, 'da'));
      tbody.innerHTML = '';
      rows.forEach(k => {
        const R = k.results[valg], b = biggest(k, valg);
        tbody.append(h('tr', {}, h('td', {}, h('a', { href: resultHref(k.id, valg) }, k.name)), h('td', { class: 'num' }, fmtN(R.electorate)), h('td', { class: 'num' }, fmtP(R.turnout)), h('td', {}, h('span', { class: 'pletter', style: `background:${D.parties[b].color}`, 'aria-hidden': 'true' }, b), D.parties[b].name), h('td', { class: 'num' }, String(k.seats))));
      });
    }
    sel.addEventListener('change', () => { mode = sel.value; log('sort', mode); draw(); });
    draw();
    return h('section', { class: 'section', 'aria-labelledby': 'h-sub' },
      h('div', { class: 'toolbar' }, h('h2', { id: 'h-sub', style: 'font-size:22px' }, `Kommuner (${a.kommuner.length})`), h('span', { class: 'spacer' }), h('label', { for: 'subsort', style: 'color:var(--muted);font-size:14px' }, 'Sortér efter'), sel),
      h('div', { class: 'tbl-wrap', style: 'max-height:560px;overflow:auto' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, 'Kommuner i ' + a.label),
        h('thead', {}, h('tr', {}, ['Kommune', 'Valgberettigede', 'Valgdeltagelse', 'Største parti', 'Mandater'].map((t, i) => h('th', { scope: 'col', class: i === 1 || i === 2 || i === 4 ? 'num' : '' }, t)))), tbody)));
  }


  /* ---------- afstemningsområder (eksempeldata) ---------- */
  const dDelta = (v, unit, dec) => { const a = Math.abs(v).toLocaleString('da-DK', { minimumFractionDigits: dec, maximumFractionDigits: dec }); const z = Math.abs(v) < Math.pow(10, -dec) / 2; return h('span', { class: 'delta ' + (z ? 'zero' : v > 0 ? 'up' : 'down'), 'aria-label': z ? 'uændret' : (v > 0 ? 'op ' : 'ned ') + a + unit }, z ? '0' + unit : (v > 0 ? '▲ +' : '▼ −') + a + unit); };
  function areaStats(a, prevA) {
    const votes = Object.keys(a.votes), top = votes.reduce((x, y) => a.votes[y] > a.votes[x] ? y : x);
    return { top, topShare: a.votes[top] / a.valid * 100, turnout: a.cast / a.electorate * 100, prevTurn: prevA ? prevA.cast / prevA.electorate * 100 : null };
  }
  function areaTable(k, valg) {
    const prevId = ELS[valg].prev, list = k.results[valg].areas;
    let mode = 'alpha';
    const tbody = h('tbody');
    const sel = h('select', { class: 'select', id: 'areasort', 'aria-label': 'Sortér afstemningsområder' }, h('option', { value: 'alpha' }, 'A–Å'), h('option', { value: 'turn' }, 'Højeste valgdeltagelse'), h('option', { value: 'el' }, 'Flest valgberettigede'));
    function draw() {
      const rows = list.map(a => Object.assign({ a }, areaStats(a, prevId ? k.results[prevId].areas.find(x => x.id === a.id) : null)));
      rows.sort(mode === 'turn' ? (x, y) => y.turnout - x.turnout : mode === 'el' ? (x, y) => y.a.electorate - x.a.electorate : (x, y) => x.a.name.localeCompare(y.a.name, 'da'));
      tbody.innerHTML = '';
      rows.forEach(r => tbody.append(h('tr', {}, h('td', {}, h('a', { href: href('/resultat/' + k.id + '/' + r.a.id, { valg }) }, r.a.name.replace(k.name + ' ', ''))), h('td', { class: 'num' }, fmtN(r.a.electorate)), h('td', { class: 'num' }, fmtN(r.a.cast)), h('td', { class: 'num' }, fmtP(r.turnout)),
        h('td', {}, h('span', { class: 'pletter', style: `background:${D.parties[r.top].color}`, 'aria-hidden': 'true' }, r.top), D.parties[r.top].name + ' ', h('small', { style: 'color:var(--muted)' }, fmtP(r.topShare))))));
    }
    sel.addEventListener('change', () => { mode = sel.value; log('sort', mode); draw(); });
    draw();
    const head = ['Region', 'Kommune', 'Afstemningsområde', 'Valgberettigede', 'Afgivne stemmer', 'Valgdeltagelse (%)'];
    return h('section', { class: 'section', 'aria-labelledby': 'h-areas' },
      h('div', { class: 'toolbar' }, h('h2', { id: 'h-areas', style: 'font-size:22px' }, `Afstemningsområder (${list.length})`), h('span', { class: 'spacer' }), h('label', { for: 'areasort', style: 'color:var(--muted);font-size:14px' }, 'Sortér efter'), sel,
        h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(`afstemningsomraader-${k.id}-${valg}.csv`, csv(head, list.map(a => [k.region, k.name, a.name, a.electorate, a.cast, +(a.cast / a.electorate * 100).toFixed(1)]), { sep: ';', dec: ',' })) }, '⬇ Hent til Excel')),
      h('p', { style: 'color:var(--muted);margin:-4px 0 14px' }, 'Se, hvordan der blev stemt på de enkelte afstemningsområder i kommunen. Stemmetallene kan genfindes ved optællingen på afstemningsstedet.'),
      h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, 'Afstemningsområder i ' + k.label),
        h('thead', {}, h('tr', {}, ['Afstemningsområde', 'Valgberettigede', 'Afgivne stemmer', 'Valgdeltagelse', 'Største parti'].map((t, i) => h('th', { scope: 'col', class: i > 0 && i < 4 ? 'num' : '' }, t)))), tbody)));
  }
  function omraadePage(k, areaId, valg) {
    const prevId = ELS[valg].prev, R = k.results[valg], a = R.areas.find(x => x.id === areaId);
    if (!a) return ikkeMed([], { side: 'Ukendt afstemningsområde' });
    const pa = prevId ? k.results[prevId].areas.find(x => x.id === areaId) : null, st = areaStats(a, pa);
    document.title = `${a.name} – ${ELS[valg].name} – valg.dk (prototype)`;
    const rows = Object.keys(a.votes).map(p => {
      const v = a.votes[p], sh = v / a.valid * 100, pv = pa ? (pa.votes[p] || 0) : null;
      return { p, name: D.parties[p].name, color: D.parties[p].color, v, sh, dv: pa ? v - pv : null, ds: pa ? sh - pv / pa.valid * 100 : null };
    }).sort((x, y) => y.v - x.v);
    const crumbs = isA ? [{ t: 'Forside', href: '#/' }, { t: 'Valgresultater', href: '#/find' }, { t: ELS[valg].name, href: href('/valg/' + valg) }] : [{ t: 'Forside', href: '#/' }, { t: 'Find resultat', href: href('/find', { valg }) }];
    crumbs.push({ t: k.label, href: resultHref(k.id, valg) }, { t: a.name });
    const idx = R.areas.findIndex(x => x.id === areaId), nb = [R.areas[idx - 1], R.areas[idx + 1]].filter(Boolean);
    const exHead = ['Parti', 'Partinavn', 'Stemmer', 'Andel (%)'].concat(pa ? ['Ændring i stemmer ift. ' + ELS[prevId].name, 'Ændring i andel (%-point)'] : []);
    const exRows = () => rows.map(r => [r.p, r.name, r.v, +r.sh.toFixed(2)].concat(pa ? [r.dv, +r.ds.toFixed(2)] : []));
    const fname = ext => `afstemningsomraade-${k.id}-${a.id}-${valg}${ext}`;
    return h('div', { class: 'page wrap' }, crumb(...crumbs),
      h('div', { class: 'titlerow' }, h('h1', {}, a.name), h('span', { class: 'badge' }, 'Endeligt resultat')),
      h('p', { class: 'lead' }, `${ELS[valg].name} · ${ELS[valg].date} · afstemningsområde i ${k.label}`),
      h('section', { class: 'panel', style: 'margin-top:26px', 'aria-label': 'Nøgletal' }, h('div', { class: 'kpis', style: 'margin-top:0' },
        h('div', { class: 'stat main' }, h('div', { class: 'lbl' }, 'Valgdeltagelse'), h('div', { class: 'val' }, fmtP(st.turnout))),
        h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Ændring ift. forrige valg'), h('div', { class: 'val' }, st.prevTurn == null ? '–' : sgn(st.turnout - st.prevTurn) + ' %-point')),
        h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Valgberettigede'), h('div', { class: 'val' }, fmtN(a.electorate))),
        h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Afgivne stemmer'), h('div', { class: 'val' }, fmtN(a.cast))))),
      h('div', { class: 'toolbar' }, h('h2', { style: 'font-size:22px' }, 'Stemmer pr. parti'), h('span', { class: 'spacer' }),
        h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(fname('.csv'), csv(exHead, exRows(), { sep: ';', dec: ',' })) }, '⬇ Hent til Excel'), shareBtn(), printBtn()),
      h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, `Stemmer pr. parti i ${a.name}`),
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Parti'), h('th', { scope: 'col', class: 'num' }, 'Stemmer'), h('th', { scope: 'col', class: 'num' }, 'Andel'), pa ? h('th', { scope: 'col', class: 'num' }, 'Ændring andel') : null)),
        h('tbody', {}, rows.map(r => h('tr', { class: 'row' }, h('td', {}, h('span', { class: 'pletter', style: `background:${r.color}`, 'aria-hidden': 'true' }, r.p), r.name),
          h('td', { class: 'num' }, fmtN(r.v), pa ? h('small', { class: 'dsub' }, sgn(r.dv) + ' stemmer') : null), h('td', { class: 'num' }, fmtP(r.sh)), pa ? h('td', { class: 'num' }, dDelta(r.ds, ' %-p', 1)) : null))))),
      h('p', { class: 'source' }, 'Mandater fordeles på kommuneniveau og vises derfor ikke for det enkelte afstemningsområde. Kilde: eksempeldata i prototypen – ikke officielle valgresultater.'),
      h('div', { class: 'pills', style: 'margin-top:22px' }, h('a', { class: 'pill', href: resultHref(k.id, valg) }, '← Hele ' + k.label), nb.map(x => h('a', { class: 'pill', href: href('/resultat/' + k.id + '/' + x.id, { valg }) }, x.name.replace(k.name + ' ', '')))));
  }

  function resultat(parts, q) {
    const k = getArea(parts[1]);
    if (!k) return ikkeMed([], { side: 'Ukendt område' });
    const valg = ELS[q.valg] ? q.valg : DEFAULT_VALG;
    if (parts[2] && k.type === 'kommune') return omraadePage(k, parts[2], valg);
    let sort = q.sort === 'alpha' ? 'alpha' : 'size';
    const R = k.results[valg], prevId = ELS[valg].prev, P = prevId ? k.results[prevId] : null;
    document.title = `${k.label} – ${ELS[valg].name} – valg.dk (prototype)`;
    const rows0 = partyRows(k, valg);
    const maxM = Math.max(...rows0.map(r => r.m), 1);
    const el = h('div', { class: 'page wrap' });
    const crumbs = isA ? [{ t: 'Forside', href: '#/' }, { t: 'Valgresultater', href: '#/find' }, { t: ELS[valg].name, href: href('/valg/' + valg) }] : [{ t: 'Forside', href: '#/' }, { t: 'Find resultat', href: href('/find', { valg }) }];
    if (k.type === 'kommune') crumbs.push({ t: k.region, href: resultHref(k.regionId, valg) });
    crumbs.push({ t: k.label });
    el.append(crumb(...crumbs));
    el.append(h('div', { class: 'titlerow' }, h('h1', {}, k.label), isC && window.VX ? window.VX.statusBadge(k, valg) : h('span', { class: 'badge' }, 'Endeligt resultat')));
    el.append(h('p', { class: 'lead' }, `${ELS[valg].name} · ${ELS[valg].date} · ` + (k.type === 'kommune' ? k.region : `${k.kommuner.length} kommuner`)));
    el.append(h('div', { class: 'pills', style: 'margin-top:20px', role: 'group', 'aria-label': 'Skift valg' }, Object.entries(ELS).map(([id, e]) =>
      h('a', { class: 'pill' + (id === valg ? ' active' : ''), href: resultHref(k.id, id, { sort }), 'aria-current': id === valg ? 'true' : null }, e.name))));
    const dT = P ? R.turnout - P.turnout : null;
    el.append(h('section', { class: 'panel', style: 'margin-top:26px', 'aria-label': 'Nøgletal' },
      h('div', { class: 'kpis', style: 'margin-top:0' },
        h('div', { class: 'stat main' }, h('div', { class: 'lbl' }, 'Mandater i alt'), h('div', { class: 'val' }, fmtN(k.seats))),
        h('div', { class: 'stat' }, h('div', { class: 'lbl' }, k.type === 'kommune' ? 'Stemmeprocent' : 'Valgdeltagelse'), h('div', { class: 'val' }, fmtP(R.turnout))),
        h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Ændring ift. forrige valg'), h('div', { class: 'val' }, dT == null ? '–' : sgn(dT) + ' %-point')),
        h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Afgivne stemmer'), h('div', { class: 'val' }, fmtN(R.cast)))),
      (() => {
        const seg = sortRows(rows0, 'size').filter(r => r.m > 0);
        const bar = h('div', { class: 'mbar', role: 'img', 'aria-label': 'Mandatfordeling: ' + seg.map(r => `${r.p} ${r.m}`).join(', ') },
          seg.map(r => h('span', { style: `flex:${r.m} 1 0;background:${r.color}`, title: `${r.p} – ${r.name}: ${r.m} mandater` }, r.m >= 2 ? r.p : '')));
        const leg = h('div', { class: 'legend' }, seg.map(r => h('span', {}, h('i', { style: `background:${r.color}` }), `${r.p} ${r.name} (${r.m})`)));
        return h('div', {}, bar, leg);
      })()));

    const tbody = h('tbody');
    function rowEl(r) {
      return h('tr', { class: 'row', 'data-key': r.p },
        h('td', {}, h('span', { class: 'pletter', style: `background:${r.color}`, 'aria-hidden': 'true' }, r.p), h('a', { href: href('/parti/' + r.p, { valg }), class: 'plink' }, r.name)),
        h('td', { class: 'num' }, fmtN(r.votes), P ? h('small', { class: 'dsub' }, sgn(r.dv) + ' stemmer') : null), h('td', { class: 'num' }, fmtP(r.share)),
        P ? h('td', { class: 'num' }, dDelta(r.ds, ' %-p', 1)) : null,
        h('td', {}, h('div', { class: 'bar' }, h('i', { style: `width:${Math.max(r.m / maxM * 180, r.m ? 6 : 0)}px;background:${r.color}` }), h('strong', {}, String(r.m)))),
        P ? h('td', { class: 'num' }, h('span', { class: 'delta ' + (r.d > 0 ? 'up' : r.d < 0 ? 'down' : 'zero'), 'aria-label': r.d === 0 ? 'uændret' : (r.d > 0 ? r.d + ' flere' : -r.d + ' færre') }, r.d === 0 ? '0' : (r.d > 0 ? '▲ +' + r.d : '▼ −' + (-r.d)))) : null);
    }
    sortRows(rows0, sort).forEach(r => tbody.append(rowEl(r)));
    const bSize = h('button', { class: 'pill', type: 'button', 'aria-pressed': String(sort === 'size') }, 'Størst først');
    const bAlpha = h('button', { class: 'pill', type: 'button', 'aria-pressed': String(sort === 'alpha') }, 'A–Å');
    const live = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    function setSort(m) {
      if (m === sort) return; sort = m; log('sort', m);
      bSize.setAttribute('aria-pressed', String(m === 'size')); bAlpha.setAttribute('aria-pressed', String(m === 'alpha'));
      history.replaceState(null, '', resultHref(k.id, valg, { sort }));
      const rows = [...tbody.children], first = new Map(rows.map(r => [r.dataset.key, r.getBoundingClientRect().top]));
      sortRows(rows0, m).forEach(r => tbody.append(rows.find(x => x.dataset.key === r.p)));
      rows.forEach(r => { const dy = first.get(r.dataset.key) - r.getBoundingClientRect().top; if (dy) { r.style.transition = 'none'; r.style.transform = `translateY(${dy}px)`; requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transition = ''; r.style.transform = ''; })); } });
      live.textContent = m === 'size' ? 'Sorteret efter størst først' : 'Sorteret alfabetisk efter partibogstav';
    }
    bSize.addEventListener('click', () => setSort('size')); bAlpha.addEventListener('click', () => setSort('alpha'));
    const exportRows = () => sortRows(rows0, sort).map(r => [r.p, r.name, r.votes, +r.share.toFixed(2), r.m].concat(P ? [r.d, r.dv, +r.ds.toFixed(2)] : []));
    const exHead = ['Parti', 'Partinavn', 'Stemmer', 'Andel (%)', 'Mandater'].concat(P ? ['Ændring i mandater ift. ' + ELS[prevId].name, 'Ændring i stemmer ift. ' + ELS[prevId].name, 'Ændring i andel (%-point)'] : []);
    const fname = ext => `valgresultat-${k.id}-${valg}${ext}`;
    el.append(h('div', { class: 'toolbar' }, h('span', { class: 'lab', id: 'sortlab' }, 'Sortér partier'), h('div', { class: 'pills', role: 'group', 'aria-labelledby': 'sortlab' }, bSize, bAlpha), h('span', { class: 'spacer' }),
      h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(fname('.csv'), csv(exHead, exportRows(), { sep: ';', dec: ',' })) }, '⬇ Hent til Excel'),
      h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(fname('-data.csv'), csv(exHead, exportRows(), { sep: ',', dec: '.' })) }, '⬇ CSV (UTF-8)'), shareBtn(), printBtn()));
    el.append(live);
    el.append(h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, `Resultat for ${k.label}, ${ELS[valg].name}`),
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Parti'), h('th', { scope: 'col', class: 'num' }, 'Stemmer'), h('th', { scope: 'col', class: 'num' }, 'Andel'), P ? h('th', { scope: 'col', class: 'num' }, 'Ændring andel') : null, h('th', { scope: 'col' }, 'Mandater'), P ? h('th', { scope: 'col', class: 'num' }, 'Ændring mandater') : null)), tbody)));

    if (k.type !== 'kommune' && isA) {
      el.append(subTable(k, valg));
    } else if (k.type !== 'kommune') {
      el.append(h('section', { class: 'regtop', 'aria-label': 'Kort og kommuner' },
        mapCard({ valg, region: k.type === 'region' ? k.id : null, title: k.type === 'region' ? 'Kommunerne i ' + k.short : 'Alle kommuner' }),
        h('div', { class: 'panel' }, h('h3', { style: 'margin-bottom:8px' }, 'Hent tallene for ' + (k.type === 'region' ? 'regionen' : 'hele landet')),
          h('p', { style: 'color:var(--muted);margin-bottom:16px' }, `Få nøgletal eller resultat pr. parti for alle ${k.kommuner.length} kommuner som regneark.`),
          h('a', { class: 'btn', href: href('/data', k.type === 'region' ? { scope: 'regioner', r: k.id, valg } : { scope: 'land', valg }) }, k.type === 'region' ? 'Hent data for regionen' : 'Hent data for hele landet'),
          h('p', { style: 'margin-top:16px' }, h('a', { href: href('/sammenlign', { a: k.id, valg }) }, 'Sammenlign med andre områder  →')))));
      el.append(subTable(k, valg));
    } else {
      el.append(areaTable(k, valg));
    }
    if (k.type === 'kommune' && isC && window.VX) el.append(window.VX.kommuneExtras(k, valg));
    if (k.type === 'kommune' && !isA) {
      el.append(h('div', { class: 'panel tint section cta' }, h('div', {}, h('h2', { style: 'font-size:22px' }, 'Vil du sammenligne med en anden kommune?'), h('p', { style: 'color:var(--muted);margin-top:6px' }, 'Sæt områder side om side i et diagram.')),
        h('a', { class: 'btn', href: href('/sammenlign', { a: k.id, valg }) }, 'Sammenlign områder  →')));
    }
    el.append(h('p', { class: 'source' }, 'Kilde: eksempeldata i prototypen – ikke officielle valgresultater.'));
    return el;
  }

  /* ---------- sammenlign: opsætning ---------- */
  const MAAL = { mandater: 'Mandater', stemmeandel: 'Stemmeprocent pr. parti', valgdeltagelse: 'Valgdeltagelse', aendring: 'Ændring ift. forrige valg' };
  function sammenlign(parts, q) {
    if (parts[1] === 'resultat') return sammenlignRes(q);
    document.title = 'Sammenlign områder – valg.dk (prototype)';
    let valg = ELS[q.valg] ? q.valg : DEFAULT_VALG, maal = MAAL[q.maal] ? q.maal : 'mandater';
    const startNames = [q.a, q.b, q.c].filter(x => x !== undefined).map(areaName);
    const names = startNames.length >= 2 ? startNames : startNames.concat(['', '']).slice(0, 2);
    const areaBox = h('div', { class: 'areas' });
    const err = h('p', { class: 'error', role: 'alert', hidden: true });
    function drawAreas() {
      const vals = [...areaBox.querySelectorAll('input')].map(i => i.value); vals.forEach((v, i) => names[i] = v);
      areaBox.innerHTML = '';
      names.forEach((n, i) => {
        const inp = h('input', { type: 'text', id: 'area' + i, value: n, placeholder: 'Kommune, region eller Hele landet …', 'data-enter': 'first', 'aria-label': 'Område ' + (i + 1) });
        const f = h('div', { class: 'field' }, h('label', { for: 'area' + i }, 'Område ' + (i + 1)), inp);
        if (names.length > 2 && i === 2) f.append(h('button', { type: 'button', class: 'rm', 'aria-label': 'Fjern område 3', onclick: () => { names.pop(); drawAreas(); add.hidden = false; } }, '×'));
        areaBox.append(f);
        autocomplete(inp, searchAreas, it => { inp.value = it.label.replace(/ Kommune$/, ''); names[i] = inp.value; });
      });
    }
    const add = h('button', { type: 'button', class: 'linkbtn', onclick: () => { if (names.length < 3) { names.push(''); drawAreas(); } add.hidden = names.length >= 3; } }, '+ Tilføj område');
    drawAreas(); add.hidden = names.length >= 3;
    const valgBox = h('div', { class: 'pills', role: 'radiogroup', 'aria-label': 'Vælg valg' });
    const maalBox = h('div', { class: 'pills', role: 'radiogroup', 'aria-label': 'Hvad vil du sammenligne?' });
    function drawMaal() {
      maalBox.innerHTML = '';
      Object.entries(MAAL).forEach(([id, t]) => {
        const dis = id === 'aendring' && !ELS[valg].prev;
        maalBox.append(h('label', { class: 'pill', title: dis ? 'Kræver et tidligere valg – vælg ' + ELS.kv2025.name : null }, h('input', { type: 'radio', name: 'maal', value: id, checked: id === maal && !dis, disabled: dis, onchange: () => { maal = id; } }), h('span', {}, t)));
      });
    }
    Object.entries(ELS).forEach(([id, e]) => valgBox.append(h('label', { class: 'pill' }, h('input', { type: 'radio', name: 'valg', value: id, checked: id === valg, onchange: () => { valg = id; if (!ELS[valg].prev && maal === 'aendring') maal = 'mandater'; drawMaal(); } }), h('span', {}, e.name))));
    drawMaal();
    function submit(e) {
      e.preventDefault();
      const vals = [...areaBox.querySelectorAll('input')].map(i => i.value.trim());
      const ids = vals.map(resolveArea);
      const bad = vals.findIndex((v, i) => !ids[i]);
      err.hidden = false;
      if (bad >= 0) { err.textContent = vals[bad] ? `Vi kan ikke finde «${vals[bad]}». Vælg et område fra forslagene.` : `Vælg et område i felt ${bad + 1}.`; return; }
      if (new Set(ids).size !== ids.length) { err.textContent = 'Vælg to forskellige områder.'; return; }
      err.hidden = true;
      location.hash = href('/sammenlign/resultat', { a: ids[0], b: ids[1], c: ids[2], valg, maal });
    }
    const form = h('form', { class: 'steps', onsubmit: submit, novalidate: true },
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '1'), 'Vælg 2–3 områder'), areaBox, h('div', { style: 'margin-top:12px' }, add)),
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '2'), 'Vælg valg'), valgBox),
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '3'), 'Hvad vil du sammenligne?'), maalBox),
      h('div', {}, h('button', { class: 'btn', type: 'submit' }, 'Vis sammenligning  →'), err));
    const recents = [['kobenhavn', 'aarhus', 'København vs. Aarhus', 'Kommunalvalg 2025 · i går'], ['region-hovedstaden', 'region-midtjylland', 'Region Hovedstaden vs. Region Midtjylland', 'Kommunalvalg 2025 · for 3 dage siden']];
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Sammenlign' }),
      h('h1', {}, 'Sammenlign områder'), h('p', { class: 'lead' }, 'Sæt 2–3 kommuner eller regioner side om side i et diagram. Har du brug for tal for mange områder på én gang, så brug i stedet ', h('a', { href: '#/data' }, 'Hent data'), '.'),
      form,
      h('section', { class: 'panel', style: 'margin-top:44px;max-width:1000px', 'aria-labelledby': 'h-rec' }, h('h2', { id: 'h-rec', style: 'font-size:22px' }, 'Seneste sammenligninger'),
        h('div', { class: 'recent' }, recents.map(r => h('a', { href: href('/sammenlign/resultat', { a: r[0], b: r[1], valg: 'kv2025', maal: 'mandater' }) }, h('span', {}, r[2]), h('small', {}, r[3]))))));
  }


  /* ---------- hent data ---------- */
  function dataPage(parts, q) {
    document.title = 'Hent data – valg.dk (prototype)';
    let indhold = q.indhold === 'parti' ? 'parti' : 'noegletal';
    let scope = ['land', 'regioner', 'kommuner'].includes(q.scope) ? q.scope : 'land';
    const regs = new Set((q.r || '').split(',').filter(x => REG.some(r => r.id === x)));
    const koms = new Set((q.k || '').split(',').filter(x => byId[x]));
    const valgs = new Set((q.valg || DEFAULT_VALG).split(',').filter(x => ELS[x]));
    if (!valgs.size) valgs.add(DEFAULT_VALG);
    let format = 'excel', niveau = q.niveau === 'omr' ? 'omr' : 'kom';
    if (scope === 'regioner' && !regs.size && !q.r) regs.add('region-hovedstaden');

    const pickedKom = () => scope === 'land' ? KOM : scope === 'regioner' ? KOM.filter(k => regs.has(regOf(k))) : KOM.filter(k => koms.has(k.id));
    const regionName = k => k.region;
    function build() {
      const ks = pickedKom(), vs = Object.keys(ELS).filter(v => valgs.has(v));
      let head, rows = [];
      if (niveau === 'omr') {
        const ar = (k, v) => k.results[v].areas;
        if (indhold === 'noegletal') {
          head = ['Region', 'Kommune', 'Afstemningsområde', 'Valg', 'Valgberettigede', 'Afgivne stemmer', 'Gyldige stemmer', 'Valgdeltagelse (%)', 'Største parti'];
          vs.forEach(v => ks.forEach(k => ar(k, v).forEach(a => { const st = areaStats(a, null); rows.push([regionName(k), k.name, a.name, ELS[v].name, a.electorate, a.cast, a.valid, +st.turnout.toFixed(1), st.top + ' ' + D.parties[st.top].name]); })));
        } else {
          head = ['Region', 'Kommune', 'Afstemningsområde', 'Valg', 'Parti', 'Partinavn', 'Stemmer', 'Andel (%)'];
          vs.forEach(v => ks.forEach(k => ar(k, v).forEach(a => Object.keys(a.votes).sort((x, y) => a.votes[y] - a.votes[x]).forEach(p => rows.push([regionName(k), k.name, a.name, ELS[v].name, p, D.parties[p].name, a.votes[p], +(a.votes[p] / a.valid * 100).toFixed(2)])))));
        }
      } else if (indhold === 'noegletal') {
        head = ['Region', 'Kommune', 'Valg', 'Valgberettigede', 'Afgivne stemmer', 'Gyldige stemmer', 'Valgdeltagelse (%)', 'Mandater i alt', 'Største parti'];
        vs.forEach(v => ks.forEach(k => { const R = k.results[v]; rows.push([regionName(k), k.name, ELS[v].name, R.electorate, R.cast, R.valid, R.turnout, k.seats, biggest(k, v) + ' ' + D.parties[biggest(k, v)].name]); }));
      } else {
        head = ['Region', 'Kommune', 'Valg', 'Parti', 'Partinavn', 'Stemmer', 'Andel (%)', 'Mandater'];
        vs.forEach(v => ks.forEach(k => { const R = k.results[v]; Object.keys(R.votes).filter(p => R.votes[p] > 0).sort((a, b) => R.votes[b] - R.votes[a]).forEach(p => rows.push([regionName(k), k.name, ELS[v].name, p, D.parties[p].name, R.votes[p], +(R.votes[p] / R.valid * 100).toFixed(2), R.mandates[p] || 0])); }));
      }
      return { head, rows, ks };
    }

    const el = h('div', { class: 'page wrap' });
    el.append(crumb({ t: 'Forside', href: '#/' }, { t: 'Hent data' }));
    el.append(h('h1', {}, 'Hent data'), h('p', { class: 'lead' }, 'Træk valgtal ud som regneark – for hele landet, for en eller flere regioner eller for de kommuner, du selv vælger. Vil du hellere se to eller tre områder ved siden af hinanden i et diagram, så brug ', h('a', { href: '#/sammenlign' }, 'Sammenlign'), '.'));

    const opt = (name, val, cur, t, d, on) => h('label', { class: 'optcard' }, h('input', { type: 'radio', name, value: val, checked: cur === val, onchange: on }), h('strong', {}, t), h('span', {}, d));
    const scopeBody = h('div', { style: 'margin-top:16px' });
    const komChips = h('div', { class: 'chips', 'aria-live': 'polite' });
    function drawScope() {
      scopeBody.innerHTML = '';
      if (scope === 'land') scopeBody.append(h('p', { style: 'color:var(--muted)' }, `Alle ${KOM.length} kommuner i hele landet er med.`));
      else if (scope === 'regioner') {
        const boxes = REG.map(r => h('label', { class: 'check' }, h('input', { type: 'checkbox', value: r.id, checked: regs.has(r.id), onchange: e => { e.target.checked ? regs.add(r.id) : regs.delete(r.id); refresh(); } }), `${r.name} (${KOM.filter(k => regOf(k) === r.id).length})`));
        scopeBody.append(h('div', { style: 'display:flex;gap:16px;margin-bottom:6px' },
          h('button', { type: 'button', class: 'linkbtn', onclick: () => { REG.forEach(r => regs.add(r.id)); drawScope(); refresh(); } }, 'Vælg alle regioner'),
          h('button', { type: 'button', class: 'linkbtn', onclick: () => { regs.clear(); drawScope(); refresh(); } }, 'Ryd')),
          h('div', { class: 'checks', role: 'group', 'aria-label': 'Vælg regioner' }, boxes));
      } else {
        const inp = h('input', { type: 'text', id: 'komadd', placeholder: 'Søg og tilføj kommune …', 'aria-label': 'Tilføj kommune', 'data-enter': 'first' });
        const fld = h('div', { class: 'search' }, h('div', { class: 'box' }, inp));
        const rsel = h('select', { class: 'select', 'aria-label': 'Tilføj alle kommuner fra en region' }, h('option', { value: '' }, 'Tilføj alle fra en region …'), REG.map(r => h('option', { value: r.id }, r.name)));
        rsel.addEventListener('change', () => { if (rsel.value) { KOM.filter(k => regOf(k) === rsel.value).forEach(k => koms.add(k.id)); rsel.value = ''; drawChips(); refresh(); } });
        scopeBody.append(fld, h('div', { style: 'display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin-top:12px' }, rsel,
          h('button', { type: 'button', class: 'linkbtn', onclick: () => { KOM.forEach(k => koms.add(k.id)); drawChips(); refresh(); } }, 'Vælg alle kommuner'),
          h('button', { type: 'button', class: 'linkbtn', onclick: () => { koms.clear(); drawChips(); refresh(); } }, 'Ryd')), komChips);
        autocomplete(inp, searchOnlyKommuner, it => { koms.add(it.id); inp.value = ''; drawChips(); refresh(); inp.focus(); });
        drawChips();
      }
    }
    function drawChips() {
      komChips.innerHTML = '';
      if (!koms.size) komChips.append(h('span', { style: 'color:var(--muted);font-size:14px' }, 'Ingen kommuner valgt endnu.'));
      else if (koms.size > 12) komChips.append(h('span', { class: 'chip' }, `${koms.size} kommuner valgt`));
      else [...koms].forEach(id => komChips.append(h('span', { class: 'chip' }, byId[id].name, h('button', { type: 'button', 'aria-label': 'Fjern ' + byId[id].name, onclick: () => { koms.delete(id); drawChips(); refresh(); } }, '×'))));
    }
    const valgBoxes = h('div', { class: 'checks', role: 'group', 'aria-label': 'Vælg valg' }, Object.entries(ELS).map(([id, e]) =>
      h('label', { class: 'check' }, h('input', { type: 'checkbox', value: id, checked: valgs.has(id), onchange: ev => { ev.target.checked ? valgs.add(id) : valgs.delete(id); refresh(); } }), e.name)));

    const steps = h('div', { class: 'steps' },
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '1'), 'Hvad vil du hente?'), h('div', { class: 'optcards' },
        opt('indhold', 'noegletal', indhold, 'Nøgletal pr. kommune', 'Valgberettigede, afgivne stemmer, valgdeltagelse og mandater – én række pr. kommune', () => { indhold = 'noegletal'; refresh(); }),
        opt('indhold', 'parti', indhold, 'Resultat pr. parti og kommune', 'Stemmer, andel og mandater for hvert parti i hver kommune', () => { indhold = 'parti'; refresh(); }))),
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '2'), 'Hvor detaljeret?'), h('div', { class: 'optcards' },
        opt('niveau', 'kom', niveau, 'Kommune', 'Én række pr. kommune', () => { niveau = 'kom'; refresh(); }),
        opt('niveau', 'omr', niveau, 'Afstemningsområde', 'Én række pr. afstemningsområde i kommunen (uden mandater)', () => { niveau = 'omr'; refresh(); }))),
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '3'), 'Hvilket område?'), h('div', { class: 'optcards' },
        opt('scope', 'land', scope, 'Hele landet', 'Alle 98 kommuner', () => { scope = 'land'; drawScope(); refresh(); }),
        opt('scope', 'regioner', scope, 'Udvalgte regioner', 'Fx alle kommuner i Region Hovedstaden', () => { scope = 'regioner'; if (!regs.size) regs.add('region-hovedstaden'); drawScope(); refresh(); }),
        opt('scope', 'kommuner', scope, 'Udvalgte kommuner', 'Vælg selv enkelte kommuner', () => { scope = 'kommuner'; drawScope(); refresh(); })), scopeBody),
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '4'), 'Hvilket valg?'), valgBoxes),
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '5'), 'Filformat'), h('div', { class: 'optcards' },
        opt('format', 'excel', format, 'Excel', 'Semikolon og decimalkomma – åbner direkte i dansk Excel', () => { format = 'excel'; refresh(); }),
        opt('format', 'csv', format, 'CSV (UTF-8)', 'Komma og decimalpunktum – til analyse og import', () => { format = 'csv'; refresh(); }))));

    const sum = h('aside', { class: 'sumcard', 'aria-label': 'Dit udtræk' });
    const prev = h('section', { class: 'preview', 'aria-labelledby': 'h-prev' });
    function refresh() {
      const { head, rows, ks } = build();
      const scopeTxt = scope === 'land' ? 'Hele landet' : scope === 'regioner' ? (regs.size ? `${regs.size} ${regs.size === 1 ? 'region' : 'regioner'}` : 'Ingen valgt') : (koms.size ? `${koms.size} kommuner` : 'Ingen valgt');
      const ok = rows.length > 0;
      const dl = h('button', { class: 'btn', type: 'button', disabled: !ok, onclick: () => {
        const b = build();
        const name = `valgdata-${scope === 'land' ? 'hele-landet' : scope === 'regioner' ? [...regs].map(r => r.replace('region-', '')).join('-') : b.ks.length + '-kommuner'}-${indhold}${niveau === 'omr' ? '-afstemningsomraader' : ''}`;
        download(name + (format === 'excel' ? '.csv' : '-data.csv'), csv(b.head, b.rows, format === 'excel' ? { sep: ';', dec: ',' } : { sep: ',', dec: '.' }));
      } }, '⬇ Hent ' + (format === 'excel' ? 'til Excel' : 'som CSV'));
      sum.innerHTML = '';
      sum.append(h('h2', {}, 'Dit udtræk'),
        h('dl', {}, h('dt', {}, 'Indhold'), h('dd', {}, indhold === 'noegletal' ? 'Nøgletal' : 'Pr. parti'), h('dt', {}, 'Detaljering'), h('dd', {}, niveau === 'omr' ? 'Afstemningsområde' : 'Kommune'), h('dt', {}, 'Område'), h('dd', {}, scopeTxt), h('dt', {}, 'Valg'), h('dd', {}, valgs.size ? [...valgs].map(v => ELS[v].name).join(', ') : 'Ingen valgt'), h('dt', {}, 'Format'), h('dd', {}, format === 'excel' ? 'Excel' : 'CSV')),
        h('div', { class: 'bigno', 'aria-live': 'polite' }, fmtN(rows.length) + ' rækker'),
        h('p', { style: 'color:var(--muted);margin-bottom:16px' }, ok ? `fra ${ks.length} ${ks.length === 1 ? 'kommune' : 'kommuner'}` : 'Vælg mindst ét område og ét valg for at hente data.'),
        dl, h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:12px' }, shareBtn(), printBtn()), h('p', { style: 'margin-top:16px;font-size:14px' }, 'Vil du hellere se forskellen mellem få områder? ', h('a', { href: '#/sammenlign' }, 'Sammenlign områder')));
      prev.innerHTML = '';
      prev.append(h('h2', { id: 'h-prev', style: 'font-size:22px;margin-bottom:12px' }, 'Forhåndsvisning'),
        ok ? h('div', { class: 'tbl-wrap', style: 'overflow:auto' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, 'De første rækker af dit udtræk'),
          h('thead', {}, h('tr', {}, head.map(t => h('th', { scope: 'col' }, t)))),
          h('tbody', {}, rows.slice(0, 8).map(r => h('tr', {}, r.map((v, i) => h('td', { class: typeof v === 'number' ? 'num' : '' }, typeof v === 'number' ? v.toLocaleString('da-DK', { maximumFractionDigits: 2 }) : v)))))))
        : h('p', { class: 'panel' }, 'Intet at vise endnu.'),
        ok && rows.length > 8 ? h('p', { class: 'source' }, `Viser 8 af ${fmtN(rows.length)} rækker. Hele udtrækket hentes med knappen.`) : null);
      history.replaceState(null, '', href('/data', { scope, indhold, niveau: niveau === 'omr' ? 'omr' : null, r: [...regs].join(','), k: koms.size && koms.size <= 40 ? [...koms].join(',') : null, valg: [...valgs].join(',') }));
    }
    drawScope(); refresh();
    el.append(h('div', { class: 'datagrid' }, steps, sum), prev);
    return el;
  }


  /* ---------- sammenlign: resultat ---------- */
  function niceStep(r) { const p = Math.pow(10, Math.floor(Math.log10(r))); const n = r / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function barChart({ cats, series, decimals = 0, unit = '' }) {
    const W = 1100, H = 440, ml = 56, mr = 16, mt = 24, mb = 66;
    const all = series.flatMap(x => x.values);
    let vmin = Math.min(0, ...all), vmax = Math.max(0, ...all); if (vmax === vmin) vmax = vmin + 1;
    const step = niceStep((vmax - vmin) / 5);
    vmax = Math.ceil(vmax / step) * step; vmin = Math.floor(vmin / step) * step;
    const y = v => mt + (H - mt - mb) * (1 - (v - vmin) / (vmax - vmin));
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Søjlediagram: ' + cats.join(', ') });
    for (let t = vmin; t <= vmax + 1e-9; t += step) {
      svg.append(s('line', { x1: ml, x2: W - mr, y1: y(t), y2: y(t), stroke: t === 0 ? '#9AA7B5' : '#E3E9EF', 'stroke-width': t === 0 ? 1.5 : 1 }));
      svg.append(s('text', { x: ml - 10, y: y(t) + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#5B6877' }, t.toLocaleString('da-DK', { maximumFractionDigits: 1 })));
    }
    const gw = (W - ml - mr) / cats.length, bw = Math.min(46, gw * 0.8 / series.length);
    cats.forEach((c, i) => {
      const gx = ml + gw * i + (gw - bw * series.length - 4 * (series.length - 1)) / 2;
      series.forEach((se, j) => {
        const v = se.values[i], x = gx + j * (bw + 4), y0 = y(0), y1 = y(v);
        const rect = s('rect', { class: 'bar-rect', x, y: Math.min(y0, y1), width: bw, height: Math.max(Math.abs(y1 - y0), v === 0 ? 2 : 0), rx: 4, fill: se.color, style: `animation-delay:${(i * series.length + j) * 25}ms` });
        rect.append(s('title', {}, `${se.name} – ${c}: ${v.toLocaleString('da-DK', { maximumFractionDigits: decimals })}${unit}`));
        svg.append(rect);
        svg.append(s('text', { x: x + bw / 2, y: (v >= 0 ? Math.min(y0, y1) - 6 : Math.max(y0, y1) + 15), 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: '#0F1C2E' }, v.toLocaleString('da-DK', { maximumFractionDigits: decimals })));
      });
      svg.append(s('text', { x: ml + gw * i + gw / 2, y: H - 20, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#0F1C2E' }, c.length > 14 ? c.slice(0, 13) + '…' : c));
    });
    return svg;
  }
  function sammenlignRes(q) {
    const ids = [q.a, q.b, q.c].filter(id => id && getArea(id));
    if (ids.length < 2) { setTimeout(() => { location.replace(href('/sammenlign', {})); }, 0); return h('div', { class: 'page wrap' }, 'Vælg mindst to områder …'); }
    const valg = ELS[q.valg] ? q.valg : DEFAULT_VALG;
    let maal = MAAL[q.maal] ? q.maal : 'mandater'; if (maal === 'aendring' && !ELS[valg].prev) maal = 'mandater';
    const areas = ids.map((id, i) => ({ k: getArea(id), R: getArea(id).results[valg], P: ELS[valg].prev ? getArea(id).results[ELS[valg].prev] : null, color: COL[i] }));
    const title = areas.map(a => a.k.type === 'kommune' ? a.k.short : a.k.label).join(' vs. ');
    document.title = `${title} – valg.dk (prototype)`;
    const pOrder = Object.keys(D.parties).filter(p => areas.some(a => a.R.votes[p] > 0 || (a.R.mandates[p] || 0) > 0));
    const mand = (a, p) => a.R.mandates[p] || 0, vot = (a, p) => (a.R.votes[p] || 0) / a.R.valid * 100;
    let cats, series, decimals = 0, unit = '', head, rows, fmt;
    if (maal === 'valgdeltagelse') {
      cats = ['Valgdeltagelse']; decimals = 1; unit = ' %';
      series = areas.map(a => ({ name: a.k.short, color: a.color, values: [a.R.turnout] }));
      head = ['Område', 'Valgberettigede', 'Afgivne stemmer', 'Valgdeltagelse (%)'].concat(areas[0].P ? ['Forrige valg (%)', 'Ændring (%-point)'] : []);
      rows = areas.map(a => [a.k.short, a.R.electorate, a.R.cast, a.R.turnout].concat(a.P ? [a.P.turnout, +(a.R.turnout - a.P.turnout).toFixed(1)] : []));
      fmt = (v, c) => c === 0 ? v : c === 1 || c === 2 ? fmtN(v) : c === 5 ? sgn(v) : fmtP(v);
    } else {
      const val = maal === 'mandater' ? (a, p) => mand(a, p) : maal === 'stemmeandel' ? (a, p) => +vot(a, p).toFixed(1) : (a, p) => mand(a, p) - (a.P ? (a.P.mandates[p] || 0) : 0);
      const order = pOrder.slice().sort((x, y) => areas.reduce((t, a) => t + Math.abs(val(a, y)), 0) - areas.reduce((t, a) => t + Math.abs(val(a, x)), 0) || x.localeCompare(y, 'da'));
      if (maal !== 'stemmeandel') { const keep = order.filter(p => areas.some(a => val(a, p) !== 0)); order.length = 0; order.push(...keep); }
      cats = order; decimals = maal === 'stemmeandel' ? 1 : 0; unit = maal === 'stemmeandel' ? ' %' : '';
      series = areas.map(a => ({ name: a.k.short, color: a.color, values: order.map(p => val(a, p)) }));
      head = ['Parti', 'Partinavn'].concat(areas.map(a => a.k.short + (maal === 'stemmeandel' ? ' (%)' : maal === 'aendring' ? ' (ændring)' : ' (mandater)'))).concat(areas.length === 2 ? ['Forskel'] : []);
      rows = order.map((p, i) => [p, D.parties[p].name].concat(areas.map((a, j) => series[j].values[i])).concat(areas.length === 2 ? [+(series[0].values[i] - series[1].values[i]).toFixed(1)] : []));
      fmt = (v, c) => (typeof v === 'string') ? v : (c === rows[0].length - 1 && areas.length === 2) ? sgn(v) : maal === 'stemmeandel' ? fmtP(v) : maal === 'aendring' ? sgn(v) : String(v);
    }
    const key = { mandater: 'mandater', stemmeandel: 'stemmeandel', valgdeltagelse: 'valgdeltagelse', aendring: 'aendring' }[maal];
    const el = h('div', { class: 'page wrap' });
    el.append(crumb({ t: 'Forside', href: '#/' }, { t: 'Sammenlign', href: href('/sammenlign', { a: ids[0], b: ids[1], c: ids[2], valg, maal }) }, { t: 'Resultat' }));
    el.append(h('h1', {}, title));
    el.append(h('p', { class: 'lead' }, `${ELS[valg].name} · ${MAAL[maal]} · Eksempeldata`));
    const links = (mk, cur, entries, paramName) => h('div', { class: 'pills', style: 'margin-top:18px' }, entries.map(([id, t, dis]) => dis ? h('span', { class: 'pill', 'aria-disabled': 'true', title: 'Kræver et tidligere valg' }, t) : h('a', { class: 'pill' + (id === cur ? ' active' : ''), 'aria-current': id === cur ? 'true' : null, href: href('/sammenlign/resultat', Object.assign({ a: ids[0], b: ids[1], c: ids[2], valg, maal }, { [paramName]: id })) }, t)));
    el.append(links(null, valg, Object.entries(ELS).map(([id, e]) => [id, e.name]), 'valg'));
    el.append(links(null, maal, Object.entries(MAAL).map(([id, t]) => [id, t, id === 'aendring' && !ELS[valg].prev]), 'maal'));
    el.append(h('div', { class: 'areacards' }, areas.map(a => h('div', { class: 'areacard' }, h('i', { style: `background:${a.color}`, 'aria-hidden': 'true' }), h('div', {}, h('div', { class: 'n' }, a.k.label), h('div', { class: 'v' }, a.k.seats + ' mandater'), h('div', { class: 'n' }, 'Valgdeltagelse ' + fmtP(a.R.turnout)))))));
    const chartPanel = h('div', { class: 'chart' }, h('div', { class: 'chart-legend' }, areas.map(a => h('span', {}, h('i', { style: `background:${a.color}` }), a.k.short))), barChart({ cats, series, decimals, unit }));
    const tablePanel = h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, `${MAAL[maal]} – ${title}`),
      h('thead', {}, h('tr', {}, head.map((t, i) => h('th', { scope: 'col', class: (maal === 'valgdeltagelse' ? i > 0 : i > 1) ? 'num' : '' }, t)))),
      h('tbody', {}, rows.map(r => h('tr', {}, r.map((v, c) => h('td', { class: (maal === 'valgdeltagelse' ? c > 0 : c > 1) ? 'num' : '' }, (maal !== 'valgdeltagelse' && c === 0) ? [h('span', { class: 'pletter', style: `background:${D.parties[v].color}`, 'aria-hidden': 'true' }, v)] : fmt(v, c))))))));
    const bBars = h('button', { class: 'pill', type: 'button', 'aria-pressed': 'true' }, 'Søjler');
    const bTab = h('button', { class: 'pill', type: 'button', 'aria-pressed': 'false' }, 'Tabel');
    tablePanel.hidden = true;
    const show = v => { bBars.setAttribute('aria-pressed', String(v === 'bars')); bTab.setAttribute('aria-pressed', String(v === 'table')); chartPanel.hidden = v !== 'bars'; tablePanel.hidden = v !== 'table'; log('view', v); };
    bBars.addEventListener('click', () => show('bars')); bTab.addEventListener('click', () => show('table'));
    const fname = ext => `sammenligning-${ids.join('-')}-${valg}-${key}${ext}`;
    el.append(h('div', { class: 'toolbar' }, h('div', { class: 'pills', role: 'group', 'aria-label': 'Visning' }, bBars, bTab), h('span', { class: 'spacer' }),
      h('button', { class: 'btn small', type: 'button', onclick: () => download(fname('.csv'), csv(head, rows, { sep: ';', dec: ',' })) }, '⬇ Hent som Excel'),
      h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(fname('-data.csv'), csv(head, rows, { sep: ',', dec: '.' })) }, '⬇ CSV (UTF-8)'), pngBtn(() => ({ svg: chartPanel.querySelector('svg'), title: title + ' – ' + MAAL[maal] + ' (' + ELS[valg].name + ')', legend: series.map(se => ({ name: se.name, color: se.color })), fname: fname('.png') })), shareBtn(), printBtn()));
    el.append(chartPanel, tablePanel);
    el.append(h('p', { class: 'source' }, 'Kilde: eksempeldata i prototypen – ikke officielle valgresultater. ', h('a', { href: href('/sammenlign', { a: ids[0], b: ids[1], c: ids[2], valg, maal }) }, 'Skift områder eller valg'), ' · ', h('a', { href: '#/data' }, 'Skal du hente tal for flere områder? Gå til Hent data')));
    return el;
  }


  /* ---------- blindgyde ---------- */
  function ikkeMed(parts, q) {
    const side = q.side || 'Denne side';
    document.title = 'Ikke med i prototypen – valg.dk';
    log('dead', side);
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Ikke med i prototypen' }),
      h('h1', {}, 'Denne side er ikke med i prototypen'),
      h('p', { class: 'lead' }, `Du klikkede på «${side}». Den del af valg.dk er ikke bygget i denne prototype. Prøv at gå tilbage, eller start forfra fra forsiden.`),
      h('div', { class: 'pills', style: 'margin-top:28px' }, h('button', { class: 'btn secondary', type: 'button', onclick: () => history.back() }, '← Gå tilbage'), h('a', { class: 'btn', href: '#/' }, 'Til forsiden')));
  }

  /* ---------- faste sider (tekst gengivet fra officielle valg.dk) ---------- */
  const PG = window.PAGES;
  const blocks = list => list.map(b => typeof b === 'string' ? h('p', {}, b) : h('ul', {}, b.list.map(x => h('li', {}, x))));
  function docPage(title, ...body) {
    document.title = title + ' – valg.dk (prototype)';
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: title }), h('h1', {}, title),
      h('p', { class: 'protonote', role: 'note' }, PG.notice), h('div', { class: 'prose' }, body));
  }
  const omValg = () => docPage(PG.om.title, blocks(PG.om.paras),
    h('h2', {}, 'Genveje'), h('ul', {}, [['#/driftstatus', 'Driftstatus for valg.dk'], ['#/tilgaengelighed', 'Tilgængelighedserklæring'], ['#/privatliv', 'Privatlivspolitik og brug af data'], ['#/data', 'Eksport af data']].map(([hr, t]) => h('li', {}, h('a', { href: hr }, t)))));
  const secs = sections => sections.map(([hd, body]) => [hd ? h('h2', {}, hd) : null, blocks(body)]);
  const tilgPage = () => docPage(PG.tilg.title, secs(PG.tilg.sections));
  const privPage = () => docPage(PG.priv.title, secs(PG.priv.sections));
  function driftPage() {
    document.title = PG.drift.title + ' – valg.dk (prototype)';
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: PG.drift.title }), h('h1', {}, PG.drift.title), h('p', { class: 'lead' }, PG.drift.lead),
      h('p', { class: 'protonote', role: 'note' }, PG.notice),
      h('div', { class: 'drift' }, PG.drift.items.map(i => h('article', {}, h('div', { class: 'meta' }, h('span', { class: 'tag' + (i.tag === 'SERVICEVINDUE' ? ' service' : '') }, i.tag), h('span', {}, i.date)), h('h3', {}, i.title), i.body.map(p => h('p', {}, p))))));
  }
  function sitemapPage() {
    const sec = (t, links) => [h('h2', {}, t), h('ul', {}, links.map(([hr, l]) => h('li', {}, h('a', { href: hr }, l))))];
    return docPage('Sitemap',
      sec('Valgresultater', [['#/find', 'Find resultat'], [resultHref('land', 'kv2025'), 'Hele landet – Kommunalvalg 2025'], [resultHref('land', 'kv2021'), 'Hele landet – Kommunalvalg 2021']].concat(REG.map(r => [resultHref(r.id, 'kv2025'), r.name]))),
      sec('Tal og data', [['#/sammenlign', 'Sammenlign områder'], ['#/data', 'Hent data']]),
      sec('Om valg.dk', [['#/om-valg', 'Om valg.dk'], ['#/driftstatus', 'Driftstatus for valg.dk'], ['#/tilgaengelighed', 'Tilgængelighedserklæring'], ['#/privatliv', 'Privatlivspolitik og brug af data']]));
  }


  /* ---------- testresultater (kun facilitator, ?test=1) ---------- */
  function parseCsv(text) {
    const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
    const split = l => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === ';') { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; };
    const head = split(lines[0]);
    return lines.slice(1).map(l => Object.fromEntries(split(l).map((v, i) => [head[i], v])));
  }
  function testresultater() {
    document.title = 'Testresultater – valg.dk (prototype)';
    if (!window.VTEST_ENABLED) return h('div', { class: 'page wrap' }, h('h1', {}, 'Testresultater'), h('p', { class: 'lead' }, 'Siden er kun til facilitatoren. Åbn prototypen med ?test=1.'));
    let stored = []; try { stored = JSON.parse(localStorage.getItem('valgTestResults') || '[]'); } catch (e) {}
    let extra = [], metric = 'tid';
    const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
    const med = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
    const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    const VN = { a: 'Version A – nuværende struktur', b: 'Version B – opgavebaseret' };
    const METRICS = {
      tid: ['Median tid (sek.)', l => med(l.map(r => num(r.sekunder)).filter(x => x != null)), 0],
      klik: ['Gennemsnit klik', l => avg(l.map(r => num(r.klik)).filter(x => x != null)), 1],
      succes: ['Lykkedes (%)', l => l.length ? l.filter(r => r.udfald === 'Lykkedes').length / l.length * 100 : null, 0],
      seq: ['SEQ (1–7, højere er bedre)', l => avg(l.map(r => num(r.seq)).filter(x => x != null)), 1],
      blind: ['Gennemsnit blindgyder', l => avg(l.map(r => num(r.blindgyder)).filter(x => x != null)), 1],
    };
    const root = h('div', { class: 'page wrap' });
    const body = h('div');
    function draw() {
      const all = stored.concat(extra).map(r => Object.assign({ version: 'b' }, r));
      const tasks = [...new Set(all.filter(r => r.opgave && r.opgave !== 'SUS').map(r => r.opgave))].sort();
      const sus = all.filter(r => r.opgave === 'SUS');
      body.innerHTML = '';
      if (!all.length) { body.append(h('p', { class: 'panel', style: 'margin-top:24px' }, 'Ingen testdata endnu. Kør opgaver med testpanelet, eller indlæs en CSV-fil nedenfor.')); return; }
      const cell = (t, v) => { const l = all.filter(r => r.opgave === t && (r.version || 'b') === v); return l; };
      const pcount = v => new Set(all.filter(r => (r.version || 'b') === v).map(r => r.deltager)).size;
      body.append(h('div', { class: 'areacards' }, ['a', 'b'].map((v, i) => {
        const s = sus.filter(r => (r.version || 'b') === v).map(r => num(r.sus_score)).filter(x => x != null), m = avg(s);
        return h('div', { class: 'areacard' }, h('i', { style: `background:${COL[i]}`, 'aria-hidden': 'true' }), h('div', {}, h('div', { class: 'n' }, VN[v]), h('div', { class: 'v' }, pcount(v) + ' deltagere'), h('div', { class: 'n' }, m == null ? 'SUS: ingen svar' : 'SUS gennemsnit: ' + fmtP(m, 1).replace(' %', '') + ' (68 = gennemsnitligt)')));
      })));
      body.append(h('div', { class: 'pills', role: 'group', 'aria-label': 'Vælg mål' }, Object.entries(METRICS).map(([id, m]) => h('button', { class: 'pill', type: 'button', 'aria-pressed': String(id === metric), onclick: () => { metric = id; draw(); } }, m[0]))));
      const M = METRICS[metric];
      const series = ['a', 'b'].map((v, i) => ({ name: VN[v], color: COL[i], values: tasks.map(t => { const x = M[1](cell(t, v)); return x == null ? 0 : +x.toFixed(M[2]); }) }));
      body.append(h('div', { class: 'chart', style: 'margin-top:18px' }, h('div', { class: 'chart-legend' }, series.map(se => h('span', {}, h('i', { style: `background:${se.color}` }), se.name))), barChart({ cats: tasks, series, decimals: M[2] })));
      const head = ['Opgave', 'Version', 'N', 'Lykkedes (%)', 'Median tid (sek.)', 'Gns. klik', 'Gns. blindgyder', 'Gns. SEQ'];
      const f1 = x => x == null ? '–' : x.toLocaleString('da-DK', { maximumFractionDigits: 1 });
      const trows = [];
      tasks.forEach(t => ['a', 'b'].forEach(v => { const l = cell(t, v); if (l.length) trows.push([t, v.toUpperCase(), l.length, METRICS.succes[1](l), METRICS.tid[1](l), METRICS.klik[1](l), METRICS.blind[1](l), METRICS.seq[1](l)]); }));
      body.append(h('div', { class: 'tbl-wrap', style: 'margin-top:20px' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, 'Opsummering pr. opgave og version'),
        h('thead', {}, h('tr', {}, head.map((t, i) => h('th', { scope: 'col', class: i > 1 ? 'num' : '' }, t)))),
        h('tbody', {}, trows.map(r => h('tr', {}, r.map((v, i) => h('td', { class: i > 1 ? 'num' : '' }, i < 3 ? String(v) : f1(v)))))))));
      body.append(h('div', { class: 'toolbar' }, h('span', { class: 'spacer' }), h('button', { class: 'btn secondary small', type: 'button', onclick: () => download('testopsummering.csv', csv(head, trows.map(r => r.map((v, i) => i < 3 ? v : (v == null ? '' : +v.toFixed(2)))), { sep: ';', dec: ',' })) }, '⬇ Hent opsummering (Excel)')));
      body.append(h('p', { class: 'source' }, 'Små stikprøver (3–5 pr. gruppe): brug tallene til at pege på mønstre, ikke som statistisk bevis.'));
    }
    const file = h('input', { type: 'file', accept: '.csv', id: 'imp', onchange: e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { extra = extra.concat(parseCsv(t)); draw(); }); } });
    root.append(crumb({ t: 'Forside', href: '#/' }, { t: 'Testresultater' }), h('h1', {}, 'Testresultater'),
      h('p', { class: 'lead' }, 'Sammenligning af version A (nuværende struktur) og version B (opgavebaseret) – læst fra testpanelets data i denne browser.'),
      h('div', { class: 'panel', style: 'margin-top:20px;max-width:760px' }, h('label', { for: 'imp', style: 'font-weight:600;display:block;margin-bottom:8px' }, 'Indlæs flere CSV-filer fra testpanelet (fra andre enheder)'), file), body);
    draw();
    return root;
  }

  /* ---------- router ---------- */
  window.VH = { searchAll, searchAreas, h, s, fmtN, fmtP, sgn, crumb, href, resultHref, getArea, partyRows, sortRows, csv, download, shareBtn, printBtn, log, autocomplete, icon, mapCard, D, KOM, byId, ELS, REG, biggest, norm, ikkeMed, dDelta, areaName, searchKommuner, searchParties, DEFAULT_VALG, aggregate, areaStats, regOf, exportPng, pngBtn, barChart, COL };
  if (isC && window.VX) window.VX.init();
  const routes = { '': home, find, parti, valg: valgPage, testresultater, resultat, sammenlign, data: dataPage, 'om-valg': omValg, driftstatus: driftPage, tilgaengelighed: tilgPage, privatliv: privPage, sitemap: sitemapPage, 'ikke-med': ikkeMed };
  if (isC && window.VX) Object.assign(routes, window.VX.routes);
  const NAVKEY = { resultat: 'find', valg: 'find', parti: 'find', storkreds: 'kredse', kreds: 'kredse', kandidat: 'kredse', metode: 'metode' };
  function render() {
    const { parts, q } = parse();
    const view = routes[parts[0] || ''] || ((p, qq) => ikkeMed(p, { side: location.hash }));
    main.innerHTML = '';
    let node;
    try { node = view(parts, q); } catch (e) { console.error(e); node = h('div', { class: 'page wrap' }, h('h1', {}, 'Noget gik galt'), h('p', {}, String(e))); }
    main.append(node);
    document.querySelectorAll('[data-nav]').forEach(a => { if (isA && !a.closest('.nav-c')) a.hidden = a.dataset.nav === 'sammenlign' || a.dataset.nav === 'data'; const on = a.dataset.nav === (NAVKEY[parts[0]] || parts[0] || ''); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
    log('route', location.hash || '#/');
    document.getElementById('nav').classList.remove('open'); document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
    if (isC && window.VX) window.VX.afterRender();
  }
  window.addEventListener('hashchange', render);
  document.getElementById('menuBtn').addEventListener('click', e => { const n = document.getElementById('nav'); const o = n.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(o)); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#/ikke-med"]'); if (a && location.hash.startsWith('#/ikke-med')) log('dead', a.getAttribute('href'));
  });
  render();
})();