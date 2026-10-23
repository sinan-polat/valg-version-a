/* Skematisk kort over Danmark (regioner + én cirkel pr. kommune).
   Omridset er forenklet og tegnet i hånden – det er IKKE et officielt kort.
   Cirklens AREAL er proportionalt med antal valgberettigede, så store byer (fx København) ikke
   ser små ud, og tyndt befolkede områder ikke dominerer. Farven viser valgdeltagelse eller største parti. */
(function () {
  'use strict';
  const D = window.DATA;
  const X = 62, Y = 110, LON0 = 7.9, LAT0 = 57.85, W = 470, H = 372;
  const P = (lat, lon) => [(lon - LON0) * X, (LAT0 - lat) * Y];
  const d = pts => 'M' + pts.map(p => P(p[0], p[1]).map(v => v.toFixed(1)).join(',')).join('L') + 'Z';
  const svgNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, ...kids) => { const e = document.createElementNS(svgNS, tag); for (const k in (attrs || {})) if (attrs[k] != null) e.setAttribute(k, attrs[k]); kids.flat().forEach(c => c != null && e.append(c.nodeType ? c : document.createTextNode(c))); return e; };

  const JUT = [[57.74, 10.62], [57.62, 10.58], [57.45, 10.55], [57.32, 10.54], [57.15, 10.45], [57.02, 10.3], [56.95, 10.3], [56.8, 10.32], [56.68, 10.3], [56.52, 10.35], [56.5, 10.6], [56.46, 10.85], [56.42, 10.95], [56.3, 10.9], [56.2, 10.75], [56.17, 10.45], [56.12, 10.28], [55.95, 10.22], [55.86, 10.05], [55.72, 10.03], [55.7, 9.85], [55.7, 9.6], [55.58, 9.78], [55.5, 9.7], [55.4, 9.72], [55.3, 9.7], [55.15, 9.65], [55.05, 9.55], [54.95, 9.78], [54.82, 9.88], [54.85, 9.4], [54.88, 8.9], [54.9, 8.65], [55.0, 8.55], [55.1, 8.6], [55.3, 8.65], [55.47, 8.43], [55.56, 8.08], [55.75, 8.15], [55.95, 8.12], [56.1, 8.13], [56.4, 8.12], [56.55, 8.15], [56.7, 8.2], [56.8, 8.27], [57.0, 8.4], [57.12, 8.58], [57.25, 9.0], [57.33, 9.35], [57.4, 9.65], [57.5, 9.78], [57.6, 9.97], [57.7, 10.35]];
  const FUNEN = [[55.6, 9.8], [55.62, 10.1], [55.58, 10.5], [55.48, 10.65], [55.35, 10.85], [55.25, 10.8], [55.08, 10.7], [55.05, 10.45], [55.1, 10.2], [55.2, 9.95], [55.3, 9.85], [55.45, 9.72]];
  const ZEA = [[56.13, 12.3], [56.03, 12.62], [55.7, 12.6], [55.58, 12.7], [55.5, 12.33], [55.32, 12.47], [55.22, 12.3], [55.08, 12.1], [54.98, 11.95], [55.05, 11.8], [55.12, 11.65], [55.25, 11.28], [55.33, 11.12], [55.58, 11.05], [55.68, 11.08], [55.75, 10.87], [55.9, 11.1], [55.97, 11.35], [55.93, 11.68], [55.97, 11.85], [56.05, 11.95]];
  const LOLFAL = [[54.75, 10.95], [54.9, 11.2], [54.85, 11.65], [54.98, 11.85], [54.93, 12.08], [54.57, 11.98], [54.65, 11.45], [54.65, 11.1]];
  const MON = [[55.05, 12.3], [55.02, 12.55], [54.93, 12.55], [54.95, 12.35]];
  const BORN = [[55.3, 14.8], [55.25, 15.1], [55.05, 15.15], [55.0, 14.8], [55.1, 14.68]];
  const ISLANDS = {
    'region-syddanmark': [[[55.07, 9.88], [55.05, 10.1], [54.9, 10.12], [54.83, 9.95], [54.88, 9.8]], [[54.92, 10.3], [54.9, 10.5], [54.84, 10.5], [54.85, 10.3]], [[54.98, 10.8], [54.9, 10.9], [54.75, 10.85], [54.82, 10.72]], [[55.47, 8.38], [55.45, 8.43], [55.35, 8.4], [55.37, 8.36]], FUNEN],
    'region-midtjylland': [[[55.95, 10.55], [55.9, 10.7], [55.78, 10.65], [55.82, 10.55]]],
    'region-nordjylland': [[[57.31, 10.9], [57.3, 11.1], [57.21, 11.1], [57.22, 10.95]]],
    'region-sjaelland': [LOLFAL, MON],
    'region-hovedstaden': [BORN],
  };
  const HOVED_CLIP = [[56.3, 11.74], [55.95, 11.74], [55.82, 11.92], [55.7, 12.14], [55.5, 12.3], [55.3, 12.42], [55.3, 13.0], [56.3, 13.0]];
  const REGIONS = [
    { id: 'region-nordjylland', name: 'Region Nordjylland', short: 'Nordjylland', tint: '#D6E4F0', label: [57.02, 9.5] },
    { id: 'region-midtjylland', name: 'Region Midtjylland', short: 'Midtjylland', tint: '#E4E6D3', label: [56.2, 9.2] },
    { id: 'region-syddanmark', name: 'Region Syddanmark', short: 'Syddanmark', tint: '#EFE3D3', label: [55.3, 9.05] },
    { id: 'region-sjaelland', name: 'Region Sjælland', short: 'Sjælland', tint: '#E1DAEC', label: [55.38, 11.3] },
    { id: 'region-hovedstaden', name: 'Region Hovedstaden', short: 'Hovedstaden', tint: '#D2E8E4', label: [55.82, 13.22] },
  ];
  const regionId = k => 'region-' + k.region.replace('Region ', '').toLowerCase().replace('æ', 'ae');
  const RAMP = ['#DCEFE0', '#A6D8B2', '#68BE80', '#2E9C58', '#14683A'];
  let seq = 0;

  function bins(valg) {
    const v = D.kommuner.map(k => k.results[valg].turnout).sort((a, b) => a - b);
    const q = i => v[Math.min(v.length - 1, Math.floor(v.length * i / 5))];
    return [q(1), q(2), q(3), q(4)].map(x => Math.round(x * 10) / 10);
  }
  const binOf = (t, e) => e.findIndex(x => t < x) < 0 ? 4 : e.findIndex(x => t < x);
  const biggest = (k, valg) => { const R = k.results[valg]; return Object.keys(R.votes).reduce((a, b) => R.votes[b] > R.votes[a] ? b : a); };
  const fmtN = n => Math.round(n).toLocaleString('da-DK');

  /* opts: { valg, metric:'turnout'|'party', region?:id, onSelect?(kommuneId, regionId), onRegion?(regionId) } */
  function renderMap(opts) {
    const id = 'm' + (++seq), valg = opts.valg, metric = opts.metric || 'turnout', zoom = opts.region || null;
    const edges = bins(valg);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', class: 'dkmap', 'aria-label': 'Skematisk kort over Danmark med regioner og kommuner. Cirklernes areal viser antal valgberettigede.' });
    const defs = el('defs');
    const y1 = P(56.63, 8)[1], y2 = P(55.77, 8)[1];
    defs.append(el('clipPath', { id: id + 'n' }, el('rect', { x: 0, y: 0, width: W, height: y1 })));
    defs.append(el('clipPath', { id: id + 'm' }, el('rect', { x: 0, y: y1, width: W, height: y2 - y1 })));
    defs.append(el('clipPath', { id: id + 's' }, el('rect', { x: 0, y: y2, width: W, height: H - y2 })));
    defs.append(el('clipPath', { id: id + 'h' }, el('path', { d: d(HOVED_CLIP) })));
    svg.append(defs);
    const regG = {};
    REGIONS.forEach(r => {
      const g = el('g', { class: 'reg' + (zoom && zoom !== r.id ? ' dim' : ''), 'data-region': r.id, fill: opts.plain ? '#E4EEE7' : r.tint, stroke: '#fff', 'stroke-width': '1.2', 'stroke-linejoin': 'round' });
      g.append(el('title', {}, r.name));
      regG[r.id] = g; svg.append(g);
    });
    regG['region-nordjylland'].append(el('path', { d: d(JUT), 'clip-path': `url(#${id}n)` }));
    regG['region-midtjylland'].append(el('path', { d: d(JUT), 'clip-path': `url(#${id}m)` }));
    regG['region-syddanmark'].append(el('path', { d: d(JUT), 'clip-path': `url(#${id}s)` }));
    regG['region-sjaelland'].append(el('path', { d: d(ZEA) }));
    regG['region-hovedstaden'].append(el('path', { d: d(ZEA), 'clip-path': `url(#${id}h)`, fill: opts.plain ? '#E4EEE7' : REGIONS[4].tint }));
    for (const rid in ISLANDS) ISLANDS[rid].forEach(poly => regG[rid].append(el('path', { d: d(poly) })));
    if (opts.onRegion) Object.entries(regG).forEach(([rid, g]) => { g.style.cursor = 'pointer'; g.addEventListener('click', () => opts.onRegion(rid)); });
    const items = D.kommuner.slice().sort((a, b) => b.results[valg].electorate - a.results[valg].electorate);
    const rs = zoom ? 0.62 : 1, kcirc = rs * 20 / Math.sqrt(460000);
    const gC = el('g', { class: 'bubbles' });
    items.forEach(k => {
      const R = k.results[valg], [cx, cy] = P(k.lat, k.lon), r = Math.max(2.3 * rs, Math.sqrt(R.electorate) * kcirc);
      const pending = opts.counted && !opts.counted(k.id);
      let fill = metric === 'status' ? '#2E9C58' : metric === 'party' ? D.parties[biggest(k, valg)].color : RAMP[binOf(R.turnout, edges)];
      if (opts.fillOf) fill = opts.fillOf(k) || fill;
      if (pending) fill = '#C9D3DE';
      const dim = zoom && regionId(k) !== zoom;
      const c = el('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: r.toFixed(1), fill, 'fill-opacity': dim ? '.25' : pending ? '.55' : '.9', stroke: pending ? '#8795A5' : '#fff', 'stroke-width': pending ? '1' : '0.8', 'stroke-dasharray': pending ? '2 2' : null, class: 'bub' + (pending ? ' pending' : ''), 'data-id': k.id });
      const big = biggest(k, valg);
      if (opts.titleOf) c.append(el('title', {}, opts.titleOf(k))); else c.append(el('title', {}, `${k.name} – valgdeltagelse ${R.turnout.toLocaleString('da-DK', { minimumFractionDigits: 1 })} % · ${fmtN(R.electorate)} valgberettigede · største parti ${big} ${D.parties[big].name}`));
      if (opts.onSelect) { c.style.cursor = 'pointer'; c.addEventListener('click', e => { e.stopPropagation(); opts.onSelect(k.id, regionId(k)); }); }
      gC.append(c);
    });
    svg.append(gC);
    if (!zoom && !opts.plain) REGIONS.forEach(r => { const [x, y] = P(r.label[0], r.label[1]); svg.append(el('text', { x, y, 'text-anchor': 'middle', class: 'rlabel' }, r.short)); });
    if (zoom) {
      const ks = D.kommuner.filter(k => regionId(k) === zoom && !(zoom === 'region-hovedstaden' && k.name === 'Bornholm')).map(k => P(k.lat, k.lon));
      const xs = ks.map(p => p[0]), ys = ks.map(p => p[1]), pad = 34;
      let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1b = Math.max(...ys) + pad;
      const ar = 470 / 372, w = x1 - x0, h = y1b - y0;
      if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; x1 = x0 + nw; } else { const nh = w / ar; y0 -= (nh - h) / 2; y1b = y0 + nh; }
      svg.setAttribute('viewBox', `${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1 - x0).toFixed(0)} ${(y1b - y0).toFixed(0)}`);
    }
    return svg;
  }

  function legend(valg, metric, scale) {
    scale = scale || 1;
    const wrap = document.createElement('div'); wrap.className = 'maplegend';
    const edges = bins(valg), f = x => x.toLocaleString('da-DK', { minimumFractionDigits: 1 });
    if (metric === 'status') {
      const l = document.createElement('div'); l.className = 'lg-col';
      l.innerHTML = '<strong>Status på optælling</strong><span><i style="background:#2E9C58"></i>Optælling afsluttet</span>';
      wrap.append(l);
    } else if (metric === 'turnout') {
      const rows = [`under ${f(edges[0])} %`, `${f(edges[0])}–${f(edges[1])} %`, `${f(edges[1])}–${f(edges[2])} %`, `${f(edges[2])}–${f(edges[3])} %`, `${f(edges[3])} % og over`];
      const l = document.createElement('div'); l.className = 'lg-col';
      l.innerHTML = '<strong>Valgdeltagelse</strong>' + rows.map((t, i) => `<span><i style="background:${RAMP[i]}"></i>${t}</span>`).join('');
      wrap.append(l);
    } else {
      const counts = {}; D.kommuner.forEach(k => { const p = biggest(k, valg); counts[p] = (counts[p] || 0) + 1; });
      const l = document.createElement('div'); l.className = 'lg-col';
      l.innerHTML = '<strong>Største parti</strong>' + Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([p, n]) => `<span><i style="background:${D.parties[p].color}"></i>${p} ${D.parties[p].name} (${n})</span>`).join('');
      wrap.append(l);
    }
    const s = document.createElement('div'); s.className = 'lg-col';
    const circ = v => { const r = Math.max(2.3 * scale, Math.sqrt(v) * scale * 20 / Math.sqrt(460000)); return `<span><svg width="${Math.ceil(r * 2 + 2)}" height="${Math.ceil(r * 2 + 2)}" aria-hidden="true"><circle cx="${r + 1}" cy="${r + 1}" r="${r}" fill="none" stroke="#5B6877"/></svg>${fmtN(v)}</span>`; };
    s.innerHTML = '<strong>Cirklens areal = valgberettigede</strong>' + circ(5000) + circ(50000) + circ(400000);
    wrap.append(s);
    return wrap;
  }

  window.GEO = { renderMap, legend, REGIONS, regionId, ZOOM_SCALE: 0.62 };
})();
