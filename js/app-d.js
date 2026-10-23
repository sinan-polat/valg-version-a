/* Version D – helt nyt design: «Sætningen».
   Forsiden er én sætning, man udfylder («Jeg vil se mandaterne i Hørsholm ved Kommunalvalg 2025»), og svaret opdateres under den uden sideskift.
   Visuelt sprog: stemmeseddel (bogstav i boks, søjle), blanket (udfyldte felter), Storskærm til valgcaféen.
   Bygger på version C's datalag og live-simulation (app-c.js). ALLE tal og kandidatnavne er EKSEMPELDATA. */
(function () {
  'use strict';
  window.VXD = { init };

  function init(S) {
    const H = window.VH;
    const { h, fmtN, fmtP, sgn, href, log, csv, download, D, KOM, byId, ELS, REG } = H;
    const { LIVE, live, isCounted, simClock, hemicycle, allKV, allFV, FV, KV, PREV, PN } = S;
    const $ = (sel, root) => (root || document).querySelector(sel);
    const FOCKEY = 'valg.minKommune';
    const loadFoc = () => { try { const v = localStorage.getItem(FOCKEY); return v && byId[v] ? v : null; } catch (e) { return null; } };
    const saveFoc = v => { try { if (v) localStorage.setItem(FOCKEY, v); else localStorage.removeItem(FOCKEY); } catch (e) { /* ingen lagring */ } };
    const lowerFirst = t => t.charAt(0).toLowerCase() + t.slice(1);
    const sk = Object.fromEntries(FV.storkredse.map(x => [x.id, x]));
    const komSorted = KOM.slice().sort((a, b) => a.name.localeCompare(b.name, 'da'));
    const DOTS = Object.keys(D.parties);
    const ELNAME = { kv2025: ELS.kv2025.name, kv2021: ELS.kv2021.name, fv: FV.name };

    /* ---------- områder og resultater ---------- */
    const isKV = v => v === 'kv2025' || v === 'kv2021';
    const areaSet = (valg, doing) => {
      if (valg === 'fv') return ['land'].concat(FV.storkredse.map(x => x.id));
      const base = ['land'].concat(REG.map(r => r.id), komSorted.map(k => k.id));
      return doing === 'hente' ? base.concat(['alle-reg', 'alle-kom']) : base;
    };
    function areaLabel(id) {
      if (id === 'land') return 'hele landet';
      if (id === 'alle-reg') return 'alle regioner';
      if (id === 'alle-kom') return 'alle 98 kommuner';
      if (sk[id]) return sk[id].name;
      const a = H.getArea(id); return a ? (a.type === 'kommune' ? a.short : a.label) : id;
    }
    const areaName = id => { const t = areaLabel(id); return id === 'land' ? 'Hele landet' : t; };
    const areaIn = id => { if (id === 'land') return 'hele landet'; const a = !sk[id] && H.getArea(id); return a && a.type === 'kommune' ? a.short + ' Kommune' : areaLabel(id); };

    /* ét resultat for et område: { rows, seats, turnout, pending, nCounted, nTotal, type } */
    function resultOf(id, valg) {
      if (valg === 'fv') {
        const m = {}, v = {};
        if (id === 'land') Object.keys(FV.nationalSeats).forEach(p => { const x = FV.nationalSeats[p]; if (x.kreds + x.tillaeg) m[p] = x.kreds + x.tillaeg; });
        else { const x = sk[id]; Object.keys(x.mandates).forEach(p => { m[p] = (m[p] || 0) + x.mandates[p]; }); Object.keys(x.tillaeg || {}).forEach(p => { m[p] = (m[p] || 0) + x.tillaeg[p]; }); }
        if (id === 'land') Object.assign(v, FV.nationalVotes);
        const tv = Object.values(v).reduce((t, n) => t + n, 0);
        const rows = Object.keys(D.parties).filter(p => m[p] || v[p]).map(p => ({ p, name: PN(p), color: D.parties[p].color, votes: id === 'land' ? v[p] || 0 : null, share: id === 'land' && tv ? (v[p] || 0) / tv * 100 : null, m: m[p] || 0, d: null, ds: null }));
        return { rows, seats: rows.reduce((t, r) => t + r.m, 0), turnout: null, pending: false, type: id === 'land' ? 'land' : 'storkreds', nCounted: 0, nTotal: 0 };
      }
      const a = H.getArea(id); let list = a.kommuner;
      const liveOn = valg === 'kv2025' && LIVE.on;
      if (liveOn) list = list.filter(k => isCounted(k.id));
      if (!list.length) return { rows: [], seats: 0, turnout: 0, pending: true, type: a.type, nCounted: 0, nTotal: a.kommuner.length };
      const view = { results: {}, kommuner: list };
      const get = vv => list.length === 1 && a.type === 'kommune' ? list[0].results[vv] : H.aggregate(list, vv);
      view.results[valg] = get(valg); if (ELS[valg].prev) view.results[ELS[valg].prev] = get(ELS[valg].prev);
      const rows = H.partyRows(view, valg).map(r => Object.assign(r, { m: r.m || 0 }));
      const R = view.results[valg];
      return { rows, seats: rows.reduce((t, r) => t + r.m, 0), turnout: R.turnout != null ? R.turnout : (R.electorate ? R.cast / R.electorate * 100 : 0), pending: false, type: a.type, nCounted: list.length, nTotal: a.kommuner.length, R };
    }
    const fvBig = (() => { const o = {}; FV.kredse.forEach(k => k.kom.forEach(id => { o[id] = o[id] || {}; Object.keys(k.votes).forEach(p => { o[id][p] = (o[id][p] || 0) + k.votes[p]; }); })); const r = {}; Object.keys(o).forEach(id => { r[id] = Object.keys(o[id]).reduce((a, b) => o[id][a] > o[id][b] ? a : b); }); return r; })();
    const sortRows = (rows, mode, key) => rows.slice().sort(mode === 'alpha' ? (a, b) => a.p.localeCompare(b.p, 'da') : (a, b) => (b[key] || 0) - (a[key] || 0) || b.m - a.m || a.p.localeCompare(b.p, 'da'));

    /* ---------- tilstand ---------- */
    const DEF = { do: 'se', hv: 'mand', omr: 'land', omr2: null, valg: 'kv2025', fmt: 'excel', side: null, sort: 'size', cmp: 'stem' };
    const sideOf = st => st.side || (st.valg === 'fv' ? 'prikker' : 'kort');
    let ST = Object.assign({}, DEF);
    let current = null; // { pick }
    function normalize(st) {
      if (!['se', 'sammenlign', 'hente'].includes(st.do)) st.do = 'se';
      if (!ELNAME[st.valg]) st.valg = 'kv2025';
      if (st.do !== 'se' && st.valg === 'fv') st.valg = 'kv2025';
      if (!areaSet(st.valg, st.do).includes(st.omr)) st.omr = 'land';
      if (st.valg === 'fv' && st.hv === 'stem' && st.omr !== 'land') st.hv = 'mand';
      if (!['mand', 'stem', 'valgte'].includes(st.hv)) st.hv = 'mand';
      if (st.do === 'sammenlign') {
        const set = areaSet(st.valg, 'sammenlign');
        if (!st.omr2 || !set.includes(st.omr2) || st.omr2 === st.omr) st.omr2 = st.omr === 'land' ? 'region-hovedstaden' : 'land';
      }
      if (!['excel', 'csv'].includes(st.fmt)) st.fmt = 'excel';
      if (st.side && !['kort', 'prikker'].includes(st.side)) st.side = null;
      return st;
    }
    function fromQuery(q) {
      const st = Object.assign({}, DEF);
      ['do', 'hv', 'omr', 'omr2', 'valg', 'fmt', 'side', 'sort', 'cmp'].forEach(k => { if (q && q[k]) st[k] = q[k]; });
      if (!(q && q.omr)) { const f = loadFoc(); if (f) st.omr = f; }
      return normalize(st);
    }
    function toHash(st) {
      const p = new URLSearchParams();
      p.set('do', st.do); p.set('omr', st.omr); p.set('valg', st.valg);
      if (st.do === 'se' && st.hv !== 'mand') p.set('hv', st.hv);
      if (st.do === 'sammenlign') p.set('omr2', st.omr2);
      if (st.do === 'hente' && st.fmt !== 'excel') p.set('fmt', st.fmt);
      return '#/?' + p.toString();
    }

    /* ---------- små byggeklodser ---------- */
    function slot(label, groups, val, on, key) {
      const sel = h('select', { class: 'slotsel', 'aria-label': label, 'data-k': key });
      let txt = '';
      groups.forEach(g => {
        const parent = g.label ? h('optgroup', { label: g.label }) : sel;
        g.items.forEach(([v, t]) => { const o = h('option', { value: v }, t); if (v === val) { o.selected = true; txt = t; } parent.append(o); });
        if (g.label) sel.append(parent);
      });
      const sz = h('span', { class: 'slotsz', 'aria-hidden': 'true' }, txt);
      sel.addEventListener('change', () => { sz.textContent = sel.options[sel.selectedIndex].text; on(sel.value); });
      return h('span', { class: 'slot' }, sz, sel, h('i', { class: 'caret', 'aria-hidden': 'true' }));
    }
    const areaGroups = (valg, doing) => valg === 'fv'
      ? [{ items: [['land', 'hele landet']] }, { label: 'Storkredse', items: FV.storkredse.map(x => [x.id, x.name]) }]
      : [{ items: [['land', 'hele landet']].concat(doing === 'hente' ? [['alle-reg', 'alle regioner'], ['alle-kom', 'alle 98 kommuner']] : []) },
        { label: doing === 'hente' ? 'Kommunerne i en region' : 'Regioner', items: REG.map(r => [r.id, doing === 'hente' ? `${r.name} (${H.getArea(r.id).kommuner.length} kommuner)` : r.name]) },
        { label: 'Kommuner', items: komSorted.map(k => [k.id, k.name]) }];
    const lumOf = hex => { const n = parseInt(String(hex).replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0); };
    const inkOn = c => { const L = lumOf(c), cw = 1.05 / (L + 0.05), ci = (L + 0.05) / (lumOf('#0F1E3A') + 0.05); return ci > cw ? '#0F1E3A' : '#fff'; };
    const letter = (p, cls) => { const c = (D.parties[p] && D.parties[p].color) || '#0F1E3A'; return h('span', { class: 'box ' + (cls || ''), style: `--pc:${c};--pt:${inkOn(c)}`, 'aria-hidden': 'true' }, p); };
    const dlt = (v, unit) => v == null ? '' : v === 0 ? '±0' : sgn(unit === 'pp' ? Math.round(v * 10) / 10 : v) + (unit === 'pp' ? ' pp' : '');

    /* stemmesedlen: rækker med bogstav i boks, navn, søjle og tal */
    function ballot(rows, metric, sortMode, opts) {
      opts = opts || {};
      const key = metric === 'stem' ? 'share' : 'm';
      const list = sortRows(rows.filter(r => metric === 'stem' ? r.share != null : true), sortMode, key);
      const max = Math.max(1, ...list.map(r => r[key] || 0));
      return h('ol', { class: 'ballot' + (opts.big ? ' big' : ''), 'aria-label': metric === 'stem' ? 'Stemmeandel pr. parti' : 'Mandater pr. parti' }, list.map(r => {
        const val = metric === 'stem' ? fmtP(r.share) : String(r.m);
        const delta = metric === 'stem' ? dlt(r.ds, 'pp') : dlt(r.d);
        const unit = metric === 'stem' ? '' : r.m === 1 ? ' mandat' : ' mandater';
        return h('li', { class: 'row', title: `${r.p} – ${r.name}` },
          letter(r.p),
          h('span', { class: 'mid' }, h('span', { class: 'pn' }, r.name), h('span', { class: 'bar' }, h('i', { style: `width:${Math.max(1.5, (r[key] || 0) / max * 100)}%;background-color:${r.color}` }))),
          h('strong', { class: 'val' }, val, h('span', { class: 'unit' }, unit)),
          h('span', { class: 'dl' + (delta && r.d != null && metric !== 'stem' ? (r.d > 0 ? ' up' : r.d < 0 ? ' dn' : '') : ''), 'aria-label': delta ? 'Ændring ' + delta : null }, delta));
      }));
    }
    /* to områder ved siden af hinanden */
    function compareRows(A, B, metric, sortMode, la, lb) {
      const key = metric === 'stem' ? 'share' : 'm';
      const ps = {}; A.rows.forEach(r => { ps[r.p] = r; }); B.rows.forEach(r => { if (!ps[r.p]) ps[r.p] = r; });
      const val = (R, p) => { const r = R.rows.find(x => x.p === p); if (!r) return 0; return metric === 'stem' ? r.share || 0 : (R.seats ? r.m / R.seats * 100 : 0); };
      const all = Object.keys(ps).map(p => ({ p, name: PN(p), color: D.parties[p].color, a: val(A, p), b: val(B, p), m: Math.max(val(A, p), val(B, p)) }));
      const list = sortMode === 'alpha' ? all.sort((x, y) => x.p.localeCompare(y.p, 'da')) : all.sort((x, y) => y.m - x.m);
      const max = Math.max(1, ...list.map(r => r.m));
      return { list, el: h('ol', { class: 'ballot cmp', 'aria-label': 'Sammenligning pr. parti' }, list.map(r => h('li', { class: 'row' }, letter(r.p),
        h('span', { class: 'mid' }, h('span', { class: 'pn' }, r.name),
          h('span', { class: 'bar a' }, h('i', { style: `width:${Math.max(1, r.a / max * 100)}%;background-color:${r.color}` })),
          h('span', { class: 'bar b' }, h('i', { style: `width:${Math.max(1, r.b / max * 100)}%;background-color:${r.color}` }))),
        h('span', { class: 'val2' }, h('strong', {}, fmtP(r.a)), h('small', {}, fmtP(r.b))),
        h('span', { class: 'dl', 'aria-label': 'Forskel ' + dlt(r.a - r.b, 'pp') }, dlt(r.a - r.b, 'pp'))))) };
    }

    /* ---------- svar-tekst («lede») ---------- */
    function ledeSe(id, valg, R) {
      const where = areaIn(id), top = R.rows.slice().sort((a, b) => b.m - a.m || (b.votes || 0) - (a.votes || 0))[0];
      if (R.pending) return `${areaIn(id)} er ikke optalt endnu. Resultatet vises, så snart kommunen er talt op.`;
      const running = valg === 'kv2025' && LIVE.on && LIVE.n < KOM.length;
      let t = running && R.type !== 'kommune' ? `Optællingen er i gang: ${R.nCounted} af ${R.nTotal} kommuner er optalt. Foreløbigt er ${PN(top.p)} største parti i ${where} med ${top.m} af ${R.seats} mandater.` : `${PN(top.p)} er største parti i ${where} med ${top.m} af ${R.seats} mandater${top.share != null ? ` (${fmtP(top.share)} af stemmerne)` : ''}${!running && top.d != null && ELS[valg].prev ? (top.d === 0 ? ', det samme som ved ' : `, ${Math.abs(top.d)} ${Math.abs(top.d) === 1 ? 'mandat' : 'mandater'} ${top.d > 0 ? 'flere' : 'færre'} end ved `) + lowerFirst(ELS[ELS[valg].prev].name) : ''}.`;
      const gain = R.rows.filter(r => r.d != null).sort((a, b) => b.d - a.d)[0];
      if (gain && gain.d > 0 && gain.p !== top.p) t += ` Størst fremgang: ${PN(gain.p)} (${sgn(gain.d)} ${gain.d === 1 ? 'mandat' : 'mandater'} siden ${lowerFirst(ELS[ELS[valg].prev].name)}).`;
      if (R.turnout) t += ` Valgdeltagelsen var ${fmtP(R.turnout)}.`;
      return t;
    }
    function ledeCmp(A, B, la, lb, list) {
      const big = list.slice().sort((x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b))[0];
      let t = big ? `Største forskel: ${PN(big.p)} (${fmtP(big.a)} i ${la} mod ${fmtP(big.b)} i ${lb}).` : '';
      if (A.turnout && B.turnout) t += ` Valgdeltagelsen var ${fmtP(A.turnout)} i ${la} og ${fmtP(B.turnout)} i ${lb}.`;
      return t;
    }

    /* ---------- hent data ---------- */
    function exportRows(id, valg, agg) {
      const out = [];
      const add = (nm, reg, k) => H.partyRows(k, valg).sort((a, b) => b.m - a.m || b.votes - a.votes).forEach(r => out.push([nm, reg, r.p, r.name, r.votes, +r.share.toFixed(2), r.m, r.d == null ? '' : r.d, r.ds == null ? '' : +r.ds.toFixed(2)]));
      if (id === 'alle-kom') KOM.slice().sort((a, b) => a.name.localeCompare(b.name, 'da')).forEach(k => add(k.name, k.region, k));
      else if (id === 'alle-reg') REG.forEach(r => add(r.name, r.name, H.getArea(r.id)));
      else if (!agg && id.startsWith('region-')) H.getArea(id).kommuner.slice().sort((a, b) => a.name.localeCompare(b.name, 'da')).forEach(k => add(k.name, k.region, k));
      else { const a = H.getArea(id); add(areaLabel(id) === 'hele landet' ? 'Hele landet' : a.type === 'kommune' ? a.short : a.label, a.type === 'kommune' ? a.region : '', a); }
      return out;
    }
    const HEAD = ['Område', 'Region', 'Parti', 'Partinavn', 'Stemmer', 'Andel (%)', 'Mandater', 'Ændring i mandater', 'Ændring i andel (procentpoint)'];

    /* ============================ FORSIDEN ============================ */
    function home(q) {
      document.title = 'valg.dk – prototype (version D)';
      ST = fromQuery(q);
      const el = h('div', { class: 'dpage' });
      const sentenceBox = h('div', { class: 'sent-wrap' });
      const answer = h('section', { class: 'dans', 'aria-labelledby': 'dh-lede' });
      const say = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
      let liveSay = 0;

      function setHash() { try { history.replaceState(null, '', toHash(ST)); } catch (e) { /* ignorer */ } markNav(); }
      function update(changed, patch) {
        Object.assign(ST, patch); const prev = ST.valg;
        normalize(ST);
        if (ST.omr && byId[ST.omr] && changed === 'omr') saveFoc(ST.omr);
        setHash(); log('sentence', JSON.stringify(ST));
        drawSentence(changed); drawAnswer();
        say.textContent = `Viser ${ST.do === 'se' ? 'resultat' : ST.do === 'sammenlign' ? 'sammenligning' : 'dataudtræk'} for ${areaIn(ST.omr)}.`;
        if (prev !== ST.valg) log('valgskift', ST.valg);
      }
      current = { pick: id => { if (ST.do === 'sammenlign') update('omr2', { omr2: id }); else update('omr', { omr: id }); } };

      /* ---- sætningen ---- */
      function drawSentence(focusKey) {
        sentenceBox.innerHTML = '';
        const doOpts = [{ items: [['se', 'se'], ['sammenlign', 'sammenligne'], ['hente', 'hente']] }];
        const valgOpts = [{ items: (ST.do === 'se' ? ['kv2025', 'kv2021', 'fv'] : ['kv2025', 'kv2021']).map(v => [v, ELNAME[v]]) }];
        const hvItems = [['mand', 'mandaterne']].concat(ST.valg === 'fv' && ST.omr !== 'land' ? [] : [['stem', 'stemmerne']], [['valgte', 'de valgte']]);
        const parts = [];
        parts.push('Jeg vil ', slot('Hvad vil du?', doOpts, ST.do, v => update('do', { do: v }), 'do'), ' ');
        if (ST.do === 'se') parts.push(slot('Hvad vil du se?', [{ items: hvItems }], ST.hv, v => update('hv', { hv: v }), 'hv'), ' i ', slot('Område', areaGroups(ST.valg, 'se'), ST.omr, v => update('omr', { omr: v }), 'omr'));
        else if (ST.do === 'sammenlign') parts.push(slot('Første område', areaGroups(ST.valg, 'sammenlign'), ST.omr, v => update('omr', { omr: v }), 'omr'), ' med ', slot('Andet område', areaGroups(ST.valg, 'sammenlign'), ST.omr2, v => update('omr2', { omr2: v }), 'omr2'));
        else parts.push('tallene for ', slot('Område', areaGroups(ST.valg, 'hente'), ST.omr, v => update('omr', { omr: v }), 'omr'));
        parts.push(' ved ', slot('Valg', valgOpts, ST.valg, v => update('valg', { valg: v }), 'valg'));
        if (ST.do === 'hente') parts.push(' som ', slot('Filformat', [{ items: [['excel', 'Excel-fil'], ['csv', 'CSV-fil']] }], ST.fmt, v => update('fmt', { fmt: v }), 'fmt'));
        parts.push('.');
        sentenceBox.append(h('p', { class: 'sent' }, parts));
        if (focusKey) { const f = $(`[data-k="${focusKey}"]`, sentenceBox); if (f) f.focus(); }
      }

      /* ---- svaret ---- */
      const mapHolder = h('div', { class: 'dmap' });
      function paintMap(root) {
        const fv = ST.valg === 'fv', cmp = ST.do === 'sammenlign';
        const onKom = id => { log('map', id); if (cmp) update('omr2', { omr2: id }); else update('omr', { omr: id }); };
        const opts = { valg: fv ? KV : ST.valg, metric: 'party', counted: ST.valg === 'kv2025' ? isCounted : null, onSelect: onKom, onRegion: rid => { log('map', rid); if (cmp) update('omr2', { omr2: rid }); else update('omr', { omr: rid }); } };
        if (fv) { opts.fillOf = k => D.parties[fvBig[k.id]].color; opts.titleOf = k => `${k.name} – største parti (eksempel): ${fvBig[k.id]} ${PN(fvBig[k.id])}`; }
        const svg = GEO.renderMap(opts);
        const mark = (id, color, role) => {
          if (!id || id.startsWith('alle') || id === 'land' || sk[id]) return;
          const b = id.startsWith('region-') ? svg.querySelector(`[data-region="${id}"]`) : svg.querySelector(`[data-id="${id}"]`);
          if (!b) return;
          if (id.startsWith('region-')) { b.setAttribute('stroke', color); b.setAttribute('stroke-width', '3.5'); } else { b.setAttribute('stroke', color); b.setAttribute('stroke-width', '3.5'); b.parentNode.append(b); }
        };
        mark(ST.omr, '#0F1E3A'); if (cmp) mark(ST.omr2, '#C8102E');
        root.append(svg, h('p', { class: 'mapnote' }, cmp ? 'Klik på en kommune for at skifte det andet område.' : 'Klik på en kommune eller region for at se dens resultat.'));
      }
      function seatsOf(R) { const seats = []; R.rows.slice().sort((a, b) => b.m - a.m).forEach(r => { for (let i = 0; i < r.m; i++) seats.push({ p: r.p, title: `${r.p} – ${r.name}` }); }); return seats; }

      function drawAnswer() {
        answer.innerHTML = '';
        const A = ST.do === 'hente' ? { rows: [], pending: false, type: 'hente' } : resultOf(ST.omr, ST.valg), fv = ST.valg === 'fv';
        const lede = h('p', { class: 'lede', id: 'dh-lede' });
        const setLede = t => { const m = String(t).match(/^(.+?[.!?])(\s+[\s\S]*)?$/); lede.innerHTML = ''; if (m && m[2]) lede.append(h('span', {}, m[1]), h('span', { class: 'more' }, m[2])); else lede.textContent = t; };
        const left = h('div', { class: 'dleft' }), right = h('div', { class: 'dright' });
        const grid = h('div', { class: 'dgrid' }, left, right);
        const sortSeg = (extra) => h('div', { class: 'seg2', role: 'group', 'aria-label': 'Sortér partierne' }, [['size', 'Størst først'], ['alpha', 'A–Å']].map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(ST.sort === v), onclick: () => { ST.sort = v; drawAnswer(); } }, t)), extra || null);

        if (ST.do === 'se') {
          setLede(ST.hv === 'valgte' && !A.pending ? `Her er de valgte i ${areaIn(ST.omr)}, med flest personlige stemmer først.` : ledeSe(ST.omr, ST.valg, A));
          if (A.pending) left.append(h('div', { class: 'empty' }, h('strong', {}, 'Optælles stadig'), h('span', {}, 'Resultatet kommer, så snart kommunen er talt op.')));
          else if (ST.hv === 'valgte') left.append(electedList(ST.omr, ST.valg));
          else left.append(h('div', { class: 'ctl' }, sortSeg()), ballot(A.rows, ST.hv, ST.sort));
          {
            const tabs = h('div', { class: 'seg2', role: 'group', 'aria-label': 'Vis til højre' }, [['kort', 'Kort'], ['prikker', 'Mandater']].map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(sideOf(ST) === v), onclick: () => { ST.side = v; drawAnswer(); } }, t)));
            const host = h('div', { class: 'dview' });
            if (sideOf(ST) === 'prikker' && !A.pending) host.append(h('div', { class: 'dots' }, hemicycle(seatsOf(A), { label: 'Mandatfordeling: ' + A.rows.filter(r => r.m).sort((a, b) => b.m - a.m).map(r => `${r.p} ${r.m}`).join(', ') })));
            else paintMap(host);
            right.append(h('div', { class: 'ctl right' }, tabs), host);
          }
        } else if (ST.do === 'sammenlign') {
          const B = resultOf(ST.omr2, ST.valg), la = areaIn(ST.omr), lb = areaIn(ST.omr2);
          if (A.pending || B.pending) { setLede('Et af områderne er ikke optalt endnu. Sammenligningen vises, når begge er talt op.'); left.append(h('div', { class: 'empty' }, h('strong', {}, 'Optælles stadig'), h('span', {}, 'Vælg et område, der er optalt, eller afslut simulationen.'))); }
          else {
            const metric = ST.cmp, c = compareRows(A, B, metric, ST.sort, la, lb);
            setLede(ledeCmp(A, B, la, lb, c.list));
            const mseg = h('div', { class: 'seg2', role: 'group', 'aria-label': 'Sammenlign på' }, [['stem', 'Stemmer'], ['mand', 'Mandater']].map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(ST.cmp === v), onclick: () => { ST.cmp = v; drawAnswer(); } }, t)));
            left.append(h('div', { class: 'ctl' }, mseg, sortSeg()), h('div', { class: 'cmp-key' }, h('span', { class: 'k a' }, la + ' (øverst)'), h('span', { class: 'k b' }, lb), h('span', { class: 'kn' }, 'Andele, så områder af forskellig størrelse kan sammenlignes')), c.el);
          }
          const host = h('div', { class: 'dview' }); paintMap(host); right.append(host);
        } else {
          const ids = ST.omr, rows = exportRows(ids, ST.valg), running = ST.valg === 'kv2025' && LIVE.on && LIVE.n < KOM.length;
          const desc = ids === 'alle-kom' ? 'en række for hvert parti i hver af de 98 kommuner' : ids === 'alle-reg' ? 'en række for hvert parti i hver af de fem regioner' : ids.startsWith('region-') ? `en række for hvert parti i hver af de ${H.getArea(ids).kommuner.length} kommuner i ${areaIn(ids)}` : 'en række for hvert parti i ' + areaIn(ids);
          setLede(`Filen indeholder ${fmtN(rows.length)} rækker: ${desc}. ${ST.fmt === 'excel' ? 'Den åbner direkte i dansk Excel (semikolon og decimalkomma).' : 'Kolonnerne er adskilt af komma og bruger punktum som decimaltegn.'}`);
          const btn = h('button', { class: 'dbtn', type: 'button', disabled: running ? '' : null, onclick: () => {
            const text = ST.fmt === 'excel' ? csv(HEAD, rows) : csv(HEAD, rows, { sep: ',', dec: '.' });
            download(`valg-${ids}-${ST.valg}.csv`, text); say.textContent = 'Filen er hentet.'; log('hent', ids + ' ' + ST.valg);
          } }, ST.fmt === 'excel' ? 'Hent Excel-filen' : 'Hent CSV-filen');
          left.append(h('div', { class: 'hent' }, h('dl', { class: 'facts' },
            h('div', {}, h('dt', {}, 'Område'), h('dd', {}, ids.startsWith('region-') ? `${H.getArea(ids).kommuner.length} kommuner i ${areaName(ids)}` : areaName(ids))), h('div', {}, h('dt', {}, 'Valg'), h('dd', {}, ELNAME[ST.valg])),
            h('div', {}, h('dt', {}, 'Rækker'), h('dd', {}, fmtN(rows.length))), h('div', {}, h('dt', {}, 'Kolonner'), h('dd', {}, String(HEAD.length)))), btn,
            running ? h('p', { class: 'warn-note' }, 'Optællingen kører (simulation). Hent først filen, når den er afsluttet, så den ikke indeholder halve tal.') : h('p', { class: 'mapnote' }, 'Ændring i andel er målt i procentpoint. Eksempeldata, ikke officielle tal.')));
          const prev = rows.slice(0, 9);
          right.append(h('div', { class: 'preview' }, h('p', { class: 'pv-h' }, 'Forhåndsvisning (', prev.length + ' af ' + fmtN(rows.length), ' rækker)'),
            h('div', { class: 'pv-scroll', tabindex: '0', role: 'region', 'aria-label': 'Forhåndsvisning af filen' }, h('table', { class: 'pv' }, h('thead', {}, h('tr', {}, HEAD.map(t => h('th', { scope: 'col' }, t)))),
              h('tbody', {}, prev.map(r => h('tr', {}, r.map((v, i) => h('td', { class: typeof v === 'number' ? 'num' : '' }, typeof v === 'number' ? (i === 5 || i === 8 ? fmtP(v, 1).replace(' %', '') : fmtN(v)) : String(v))))))))));
        }
        answer.append(lede, grid, strip(A));
      }

      /* ---- status og handlinger under svaret ---- */
      function strip(A) {
        const total = KOM.length, running = ST.valg === 'kv2025' && LIVE.on, done = running && LIVE.n >= total;
        const status = h('div', { class: 'status' });
        if (running && !done) {
          status.append(h('span', { class: 'tag live' }, h('i', { class: 'pulse' }), LIVE.paused ? 'Pause' : 'Live (simulation)'), h('span', { class: 'st-t' }, h('strong', {}, `${LIVE.n} af ${total} kommuner`), ` optalt · kl. ${simClock()}`), h('span', { class: 'track', 'aria-hidden': 'true' }, h('i', { style: `width:${LIVE.n / total * 100}%` })));
          const q = Math.floor(LIVE.n / total * 4); if (q > liveSay) { liveSay = q; say.textContent = `${LIVE.n} af ${total} kommuner er optalt.`; }
        } else {
          status.append(h('span', { class: 'tag final' }, done ? 'Simulation slut' : ST.valg === 'fv' ? 'Eksempeldata' : 'Endeligt resultat'),
            h('span', { class: 'st-t' }, ST.valg === 'fv' ? 'Opdigtet folketingsvalg til prototypen' : `Valgdag ${ELS[ST.valg].date} · Afsender: Valg.dk (prototype)`));
        }
        const acts = h('div', { class: 'acts' });
        const mk = (t, f, cls) => h('button', { class: 'dbtn small ' + (cls || ''), type: 'button', onclick: f }, t);
        if (ST.valg === 'kv2025' && ST.do !== 'hente') {
          if (!running) acts.append(mk(h('span', {}, h('span', { class: 'lg' }, 'Se valgaftens optælling (simulation)'), h('span', { class: 'sh' }, 'Valgaften (simulation)')), () => { liveSay = 0; live.start(); }, 'ghost'));
          else { if (!done) acts.append(mk(LIVE.paused ? 'Fortsæt' : 'Pause', live.pause, 'ghost'), mk('Spring til slut', live.skip, 'ghost opt')); acts.append(mk('Afslut', live.stop, 'ghost')); }
        }
        if (ST.do === 'sammenlign' && !A.pending) {
          const B = resultOf(ST.omr2, ST.valg);
          if (!B.pending) acts.append(h('button', { class: 'dbtn small', type: 'button', onclick: () => {
            const rows = exportRows(ST.omr, ST.valg, true).concat(exportRows(ST.omr2, ST.valg, true));
            download(`sammenligning-${ST.omr}-${ST.omr2}-${ST.valg}.csv`, csv(HEAD, rows)); say.textContent = 'Filen med sammenligningen er hentet.'; log('hent', 'sammenligning ' + ST.omr + ' ' + ST.omr2);
          } }, h('span', {}, h('span', { class: 'lg' }, 'Hent sammenligningen (Excel)'), h('span', { class: 'sh' }, 'Hent (Excel)'))));
        }
        if (ST.do === 'se' && !A.pending) {
          const to = sk[ST.omr] ? '#/storkreds/' + ST.omr : ST.valg === 'fv' ? href('/kredse', { valg: 'fv' }) : H.resultHref(ST.omr, ST.valg);
          acts.append(h('a', { class: 'dbtn small', href: to }, 'Se alle tal'));
        }
        return h('div', { class: 'dstrip' }, status, acts);
      }

      /* ---- valgte ---- */
      function electedList(id, valg) {
        let pool;
        if (valg === 'fv') pool = allFV.filter(x => x.elected && (id === 'land' || x.sk === id));
        else { const a = H.getArea(id), ids = new Set(a.kommuner.map(k => k.id)); pool = allKV.filter(x => x.elected && ids.has(x.kom) && (valg !== 'kv2025' || isCounted(x.kom))); }
        pool = pool.sort((a, b) => b.votes - a.votes);
        if (valg === 'kv2021') return h('div', { class: 'empty' }, h('strong', {}, 'Ingen kandidatdata for 2021'), h('span', {}, 'Kandidaterne i prototypen hører til Kommunalvalg 2025.'));
        if (!pool.length) return h('div', { class: 'empty' }, h('strong', {}, 'Ingen valgt endnu'), h('span', {}, 'Optællingen er lige begyndt.'));
        const shown = pool.slice(0, 40);
        return h('div', { class: 'elected' }, h('ol', { class: 'ballot ev' }, shown.map(x => h('li', { class: 'row' }, letter(x.p),
          h('span', { class: 'mid' }, h('a', { class: 'pn', href: x.href }, x.name), h('span', { class: 'sub' }, x.t === 'kv' ? `${x.komName} Kommune · ${PN(x.p)}` : `${x.kredsName} · ${PN(x.p)}`)),
          h('strong', { class: 'val' }, fmtN(x.votes), h('span', { class: 'unit' }, ' stemmer'))))), pool.length > shown.length ? h('p', { class: 'mapnote' }, `Viser de ${shown.length} med flest stemmer af ${fmtN(pool.length)}. Se alle under «Kandidater og kredse».`) : null);
      }

      /* ---- sammensætning ---- */
      const finder = S.searchBox({ placeholder: 'Søg kommune eller kandidat', id: 'dq', onKommune: id => { finder.inp.value = ''; current.pick(id); } });
      finder.form.classList.add('dfind');
      el.append(h('div', { class: 'dtop' }, h('div', { class: 'dtitle' }, h('h1', { id: 'dh1' }, 'Hvordan gik valget?'), finder.form), sentenceBox), answer, say);
      drawSentence(); drawAnswer(); setHash();
      const sub = () => { if (!el.isConnected) { LIVE.subs.delete(sub); return; } drawAnswer(); };
      LIVE.subs.add(sub);
      return el;
    }

    /* ============================ STORSKÆRM ============================ */
    function tvPage(q) {
      document.title = 'Storskærm – valg.dk prototype';
      const wantFoc = (q && q.omr && byId[q.omr]) ? q.omr : (loadFoc() || 'horsholm');
      let kom = byId[wantFoc] ? wantFoc : KOM[0].id;
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const SCENES = [
        { id: 'mand', t: 'Mandater i hele landet', draw: root => { const R = resultOf('land', 'kv2025'); root.append(sceneHead(R, 'byrådsmandater'), h('div', { class: 'tv-ballot' }, ballot(R.rows.filter(r => r.m).sort((a, b) => b.m - a.m).slice(0, 8), 'mand', 'size', { big: true }))); } },
        { id: 'kort', t: 'Største parti i hver kommune', draw: root => { const svg = GEO.renderMap({ valg: 'kv2025', metric: 'party', counted: isCounted, onSelect: () => {}, onRegion: () => {} }); root.append(h('div', { class: 'tv-map' }, svg), h('div', { class: 'tv-legend' }, legendKey())); } },
        { id: 'kom', t: () => areaIn(kom), draw: root => { const R = resultOf(kom, 'kv2025'); if (R.pending) root.append(h('p', { class: 'tv-wait' }, areaIn(kom) + ' er ikke optalt endnu …')); else root.append(h('p', { class: 'tv-lede' }, ledeSe(kom, 'kv2025', R)), h('div', { class: 'tv-ballot' }, ballot(R.rows.filter(r => r.m).sort((a, b) => b.m - a.m).slice(0, 8), 'mand', 'size', { big: true }))); } },
        { id: 'valgte', t: () => 'Valgt i ' + areaIn(kom), draw: root => {
          if (!isCounted(kom)) { root.append(h('p', { class: 'tv-wait' }, areaIn(kom) + ' er ikke optalt endnu …')); return; }
          const R = resultOf(kom, 'kv2025'), rank = {}; R.rows.slice().sort((a, b) => b.m - a.m).forEach((r, i) => { rank[r.p] = i; });
          const pool = allKV.filter(x => x.elected && x.kom === kom).sort((a, b) => rank[a.p] - rank[b.p] || b.votes - a.votes);
          root.append(h('p', { class: 'tv-lede' }, h('strong', {}, String(pool.length)), ' byrådsmedlemmer, sorteret efter parti og personlige stemmer'),
            h('ol', { class: 'tv-names' + (pool.length > 31 ? ' many' : '') }, pool.map(x => h('li', {}, letter(x.p, 'sm'), h('span', { class: 'nm' }, x.name), h('small', {}, fmtN(x.votes))))));
        } },
      ];
      function legendKey() { const cnt = {}; KOM.forEach(k => { if (isCounted(k.id)) { const p = H.biggest(k, 'kv2025'); cnt[p] = (cnt[p] || 0) + 1; } }); return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 6).map(p => h('span', { class: 'lg-i' }, letter(p, 'sm'), h('b', {}, String(cnt[p])), h('small', {}, cnt[p] === 1 ? 'kommune' : 'kommuner'))); }
      function sceneHead(R, unit) { return h('p', { class: 'tv-lede' }, h('strong', {}, fmtN(R.seats)), ' ' + unit + (LIVE.on && LIVE.n < KOM.length ? ' fordelt indtil nu' : ' fordelt')); }
      let idx = 0, paused = reduce, t0 = Date.now(); const DUR = 12000;
      const stage = h('div', { class: 'tv-stage', 'aria-live': 'off' }), title = h('h1', { class: 'tv-title' }), dots = h('div', { class: 'tv-dots', role: 'group', 'aria-label': 'Vælg billede' });
      const stat = h('span', { class: 'tv-stat' }), clock = h('span', { class: 'tv-clock' }), bar = h('i', {});
      function draw() {
        const sc = SCENES[idx]; title.textContent = typeof sc.t === 'function' ? sc.t() : sc.t; stage.innerHTML = ''; stage.className = 'tv-stage sc-' + sc.id; sc.draw(stage);
        dots.innerHTML = ''; SCENES.forEach((s, i) => dots.append(h('button', { type: 'button', 'aria-pressed': String(i === idx), 'aria-label': typeof s.t === 'function' ? s.t() : s.t, onclick: () => go(i) })));
        stat.textContent = LIVE.on ? (LIVE.n >= KOM.length ? 'Simulation slut' : `LIVE (simulation) · ${LIVE.n}/${KOM.length} kommuner`) : 'Endeligt resultat · eksempeldata';
        clock.textContent = LIVE.on ? 'kl. ' + simClock() : '';
      }
      const go = i => { idx = (i + SCENES.length) % SCENES.length; t0 = Date.now(); draw(); };
      const ppBtn = h('button', { class: 'dbtn small ghost', type: 'button', onclick: () => { paused = !paused; t0 = Date.now(); ppBtn.textContent = paused ? 'Fortsæt visning' : 'Sæt visningen på pause'; } }, paused ? 'Fortsæt visning' : 'Sæt visningen på pause');
      const liveBtn = h('button', { class: 'dbtn small ghost', type: 'button', onclick: () => { if (!LIVE.on) live.start(); else live.stop(); } }, 'Start/stop optælling (simulation)');
      const fsBtn = h('button', { class: 'dbtn small ghost', type: 'button', onclick: () => { const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen(); } }, 'Fuld skærm');
      const komSel = h('select', { id: 'tvkom', class: 'tv-sel' }, komSorted.map(k => { const o = h('option', { value: k.id }, k.name); if (k.id === kom) o.selected = true; return o; }));
      komSel.addEventListener('change', () => { kom = komSel.value; saveFoc(kom); log('tv-kommune', kom); draw(); });
      const root = h('div', { class: 'tvpage' },
        h('div', { class: 'tv-top' }, h('span', { class: 'tv-brand' }, 'valg.dk ', h('small', {}, 'prototype · eksempeldata')), stat, clock, h('span', { class: 'tv-pick' }, h('label', { for: 'tvkom' }, 'Kommune'), komSel), h('a', { class: 'dbtn small ghost', href: '#/' }, 'Luk storskærm')),
        h('div', { class: 'tv-main' }, title, stage), h('div', { class: 'tv-bot' }, dots, h('span', { class: 'tv-prog', 'aria-hidden': 'true' }, bar), ppBtn, liveBtn, fsBtn,
          h('span', { class: 'tv-keys' }, 'Piletaster skifter billede · mellemrum pauser · Esc lukker')));
      const sub = () => { if (!root.isConnected) { LIVE.subs.delete(sub); return; } draw(); };
      LIVE.subs.add(sub);
      const timer = setInterval(() => { if (!root.isConnected) { clearInterval(timer); document.removeEventListener('keydown', key); return; } if (paused) { bar.style.width = '0'; return; } const p = (Date.now() - t0) / DUR; bar.style.width = Math.min(100, p * 100) + '%'; if (p >= 1) go(idx + 1); }, 200);
      function key(e) { if (!root.isConnected || /SELECT|INPUT/.test(document.activeElement.tagName)) return; if (e.key === 'ArrowRight') go(idx + 1); else if (e.key === 'ArrowLeft') go(idx - 1); else if (e.key === ' ' && !/BUTTON|A/.test(document.activeElement.tagName)) { e.preventDefault(); ppBtn.click(); } else if (e.key === 'Escape' && !document.fullscreenElement) location.hash = '#/'; }
      document.addEventListener('keydown', key);
      draw();
      return root;
    }

    /* ============================ HEADER OG NAVIGATION ============================ */
    const bn = $('.proto-banner'); if (bn) bn.innerHTML = '<span class="lg">Prototype til bachelorprojekt – ikke den officielle Valg.dk. Alle tal er eksempeldata.</span><span class="sh">Prototype – ikke officiel · eksempeldata</span>';
    const hdrIn = $('.site-header .in');
    const navD = h('nav', { class: 'nav-d', 'aria-label': 'Hovedmenu' },
      [['#/?do=se', 'Resultater', 'se'], ['#/?do=sammenlign', 'Sammenlign', 'sammenlign'], ['#/?do=hente', 'Hent data', 'hente'], ['#/kredse', 'Kandidater og kredse', 'kredse']].map(([hr, t, k]) => h('a', { href: hr, 'data-d': k }, t)));
    hdrIn.insertBefore(navD, $('.hdr-tools', hdrIn));
    $('.hdr-tools', hdrIn).prepend(h('a', { class: 'hdr-btn tvlink', href: '#/storskaerm' }, 'Storskærm'));
    function markNav() {
      const raw = location.hash.replace(/^#/, '') || '/', path = raw.split('?')[0], seg = path.split('/').filter(Boolean)[0] || '';
      let on = '';
      if (seg === '') on = ST.do; else if (['resultat', 'valg', 'parti', 'find'].includes(seg)) on = 'se'; else if (seg === 'sammenlign') on = 'sammenlign'; else if (seg === 'data') on = 'hente'; else if (['kredse', 'storkreds', 'kreds', 'kandidat'].includes(seg)) on = 'kredse';
      navD.querySelectorAll('a').forEach(a => { if (a.dataset.d === on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    }

    Object.assign(window.VX, {
      home,
      afterRender: () => {
        S.baseAfterRender();
        const raw = location.hash.replace(/^#/, '') || '/', isHome = raw === '/' || raw.startsWith('/?');
        document.body.classList.toggle('tv', raw.startsWith('/storskaerm'));
        if (raw.startsWith('/storskaerm')) document.body.classList.remove('fit');
        S.setKommuneHook(isHome && current ? current.pick : null);
        markNav();
        document.querySelectorAll('.kpis .stat .val').forEach(v => v.classList.toggle('long', v.textContent.trim().length > 12));
      },
    });
    window.VX.routes = Object.assign({}, window.VX.routes, { storskaerm: (parts, q) => tvPage(q) });
  }
})();
