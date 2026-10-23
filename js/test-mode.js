/* Testpanel til brugertest. Aktiveres ved at åbne siden med ?test=1 (fx index.html?test=1).
   Panelet er diskret: en lille fane ved højre kant, der åbnes ved klik (eller Alt+T) og lukker sig selv,
   når en opgave startes. Under en opgave viser fanen kun tiden.
   Alt gemmes lokalt i browseren (localStorage) – ingen data sendes nogen steder, og der indsamles ingen
   personoplysninger (brug et anonymt deltager-id). */
(function () {
  'use strict';
  const TASKS = [
    { id: 'T1', group: 'Borger', text: 'Find ud af, hvor mange mandater Hørsholm Kommune fik ved Kommunalvalg 2025, og hvilket parti der fik flest.', answer: '19 mandater. Parti C (Det Konservative Folkeparti) fik flest (6).' },
    { id: 'T2', group: 'Journalist / analytiker', text: 'Sammenlign mandatfordelingen i Hørsholm og Ishøj ved Kommunalvalg 2025, og hent tallene, så du kan åbne dem i et regneark.', answer: 'Når sammenligningssiden for Hørsholm vs. Ishøj og henter filen.' },
    { id: 'T3', group: 'Borger / analytiker', text: 'Find ud af, hvilket parti der fik flest mandater i Ishøj, og om partiet fik flere eller færre mandater end ved valget i 2021.', answer: 'A (Socialdemokratiet) fik 9 mandater – ét færre end i 2021.' },
    { id: 'T4', group: 'Journalist / analytiker', text: 'Du skal bruge valgtal fra alle kommuner i Region Hovedstaden i et regneark. Hent dem.', answer: 'Hent data-siden: området "Vælg regioner" → Region Hovedstaden → henter filen (29 kommuner).' },
  ];
  const KEY = 'valgTestResults', PKEY = 'valgTestPid';
  const params = new URLSearchParams(location.search);
  if (params.get('test') === '1') { try { sessionStorage.setItem('valgTest', '1'); } catch (e) {} }
  let enabled = false;
  try { enabled = sessionStorage.getItem('valgTest') === '1'; } catch (e) { enabled = params.get('test') === '1'; }

  const VER = window.VVER === 'a' ? 'a' : window.VVER === 'c' ? 'c' : window.VVER === 'd' ? 'd' : 'b';
  const SUSQ = ['Jeg kunne godt tænke mig at bruge dette system ofte.', 'Jeg fandt systemet unødvendigt komplekst.', 'Jeg synes, systemet var let at bruge.', 'Jeg tror, jeg ville have brug for en teknisk persons hjælp for at kunne bruge systemet.', 'Jeg fandt de forskellige funktioner i systemet godt integreret.', 'Jeg synes, der var for meget inkonsistens i systemet.', 'Jeg forestiller mig, at de fleste hurtigt ville lære at bruge systemet.', 'Jeg fandt systemet meget besværligt at bruge.', 'Jeg følte mig meget sikker i at bruge systemet.', 'Jeg havde brug for at lære en masse, før jeg kunne komme i gang med systemet.'];
  const S = { phase: 'idle', first: '', sus: [], task: null, t0: 0, clicks: 0, routes: [], dead: 0, sorts: 0, exports: 0, searches: 0, secs: 0, outcome: '', seq: 0, note: '' };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} };
  const getPid = () => { try { return localStorage.getItem(PKEY) || 'P01'; } catch (e) { return 'P01'; } };
  const setPid = (v) => { try { localStorage.setItem(PKEY, v); } catch (e) {} };

  window.VLOG = function (type, detail) {
    if (!enabled || S.phase !== 'running') return;
    if (type === 'route') { if (S.routes[S.routes.length - 1] !== detail) S.routes.push(detail); }
    else if (type === 'dead') S.dead++;
    else if (type === 'sort') S.sorts++;
    else if (type === 'export') S.exports++;
    else if (type === 'search') S.searches++;
    updateMetrics();
  };
  window.VTEST_ENABLED = enabled;
  if (!enabled) return;

  let panel, tab, content, timer;
  const $ = (s, r) => (r || panel).querySelector(s);
  const el = (t, a, ...k) => { const e = document.createElement(t); Object.entries(a || {}).forEach(([n, v]) => { if (n === 'class') e.className = v; else if (n.startsWith('on')) e.addEventListener(n.slice(2), v); else if (v != null) e.setAttribute(n, v); }); k.flat().forEach(x => e.append(x && x.nodeType ? x : document.createTextNode(x == null ? '' : x))); return e; };
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  const elapsed = () => S.phase === 'running' ? Math.round((Date.now() - S.t0) / 1000) : S.secs;
  const isMin = () => panel.dataset.min !== 'false';
  const setMin = (v) => { panel.dataset.min = v ? 'true' : 'false'; tab.setAttribute('aria-expanded', String(!v)); try { sessionStorage.setItem('valgTestMin', v ? '1' : '0'); } catch (e) {} };

  function updateMetrics() {
    if (!panel) return;
    tab.textContent = S.phase === 'running' ? '● ' + fmt(elapsed()) : (S.phase === 'rating' ? '✓ ' + fmt(S.secs) : 'Test');
    const m = $('#tm'); if (!m) return;
    m.querySelector('[data-k=t]').textContent = fmt(elapsed());
    m.querySelector('[data-k=c]').textContent = S.clicks;
    m.querySelector('[data-k=p]').textContent = Math.max(S.routes.length, 0);
    m.querySelector('[data-k=d]').textContent = S.dead;
  }

  function build() {
    panel = el('aside', { id: 'testpanel', 'aria-label': 'Testpanel (facilitator)', 'data-min': 'true' });
    tab = el('button', { class: 'ttab', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'tpbody', title: 'Åbn testpanel (Alt+T)', onclick: () => setMin(false) }, 'Test');
    content = el('div', { class: 'tpcontent', id: 'tpbody' });
    panel.append(tab, content);
    document.body.append(panel);
    let start = true; try { start = sessionStorage.getItem('valgTestMin') !== '0'; } catch (e) {}
    setMin(start);
    document.addEventListener('keydown', (e) => { if (e.altKey && (e.key === 't' || e.key === 'T')) { e.preventDefault(); setMin(!isMin()); } });
    render();
  }

  function render() {
    const results = load();
    content.innerHTML = '';
    const head = el('header', {}, el('span', {}, 'Testpanel · version ' + VER.toUpperCase()), el('button', { 'aria-label': 'Luk panel', title: 'Luk (Alt+T)', onclick: () => setMin(true) }, '×'));
    const body = el('div', { class: 'body' });
    content.append(head, body);

    body.append(el('div', { class: 'row' }, el('label', { for: 'pid', style: 'font-weight:600' }, 'Deltager'), el('input', { id: 'pid', value: getPid(), style: 'width:70px', oninput: (e) => setPid(e.target.value.trim() || 'P01') }),
      el('button', { class: 'tb', onclick: () => { const m = /(\d+)$/.exec(getPid()); const n = m ? String(+m[1] + 1).padStart(m[1].length, '0') : '02'; setPid('P' + n); render(); } }, 'Næste')));

    if (S.phase === 'idle') {
      const tasks = el('div', { class: 'row' });
      TASKS.forEach(t => tasks.append(el('button', { class: 'tb' + (S.task === t.id ? ' sel' : ''), title: t.group, onclick: () => { S.task = t.id; render(); } }, t.id)));
      body.append(tasks);
      const t = TASKS.find(x => x.id === S.task);
      if (t) {
        body.append(el('div', { class: 'task' }, el('b', {}, t.id + ' · ' + t.group), t.text));
        body.append(el('details', {}, el('summary', {}, 'Forventet svar'), el('div', { class: 'fine' }, t.answer)));
        body.append(el('button', { class: 'tb pri', onclick: startTask }, '▶ Start (panelet lukkes)'));
      } else body.append(el('div', { class: 'fine' }, 'Vælg en opgave, læs den højt, og tryk Start.'));
      body.append(el('div', { class: 'row' }, el('span', { class: 'fine' }, 'Version:'), ['a', 'b'].map(v => el('button', { class: 'tb' + (VER === v ? ' sel' : ''), title: v === 'a' ? 'Nuværende struktur (valgtype først)' : 'Opgavebaseret struktur', onclick: () => { try { sessionStorage.setItem('valgVer', v); } catch (e) {} location.href = location.pathname + '?test=1&v=' + v + '#/'; } }, v.toUpperCase())),
        el('button', { class: 'tb', onclick: () => { S.phase = 'sus'; S.sus = []; render(); } }, 'SUS')));
    } else if (S.phase === 'running') {
      const t = TASKS.find(x => x.id === S.task);
      body.append(el('div', { class: 'task' }, el('b', {}, t.id + ' · kører'), t.text));
      body.append(metricsEl());
      body.append(el('button', { class: 'tb pri', onclick: stopTask }, '■ Stop opgave'));
    } else if (S.phase === 'rating') {
      const t = TASKS.find(x => x.id === S.task);
      body.append(el('div', { class: 'task' }, el('b', {}, `${t.id} stoppet – ${fmt(S.secs)}`)));
      body.append(metricsEl());
      const out = el('div', { class: 'row' });
      ['Lykkedes', 'Delvist', 'Mislykkedes'].forEach(o => out.append(el('button', { class: 'tb' + (S.outcome === o ? ' sel' : ''), onclick: () => { S.outcome = o; render(); } }, o)));
      body.append(out);
      body.append(el('div', { class: 'fine' }, 'SEQ: hvor let var opgaven? (1 = meget svær, 7 = meget let)'));
      const seq = el('div', { class: 'seq' });
      for (let i = 1; i <= 7; i++) seq.append(el('button', { class: 'tb' + (S.seq === i ? ' sel' : ''), onclick: () => { S.seq = i; render(); } }, String(i)));
      body.append(seq);
      body.append(el('textarea', { id: 'note', rows: '3', placeholder: 'Noter (think aloud)' }, S.note));
      body.append(el('button', { class: 'tb pri', onclick: saveTask }, 'Gem opgave'));
    }

    if (S.phase === 'sus') {
      body.append(el('div', { class: 'task' }, el('b', {}, 'SUS – version ' + VER.toUpperCase()), 'Læs hvert udsagn højt. 1 = helt uenig, 5 = helt enig.'));
      SUSQ.forEach((q, i) => { body.append(el('div', { class: 'fine' }, (i + 1) + '. ' + q)); const r = el('div', { class: 'seq' }); for (let n = 1; n <= 5; n++) r.append(el('button', { class: 'tb' + (S.sus[i] === n ? ' sel' : ''), onclick: () => { S.sus[i] = n; render(); } }, String(n))); body.append(r); });
      const done = S.sus.filter(Boolean).length === 10;
      body.append(el('button', { class: 'tb pri', disabled: done ? null : 'true', onclick: saveSus }, done ? 'Gem SUS' : 'Besvar alle 10'), el('button', { class: 'tb', onclick: () => { S.phase = 'idle'; render(); } }, 'Annullér'));
    }

    body.append(el('hr', { style: 'border:0;border-top:1px solid #D5DDE6;width:100%;margin:2px 0' }));
    body.append(el('div', { class: 'fine' }, `${results.length} opgave(r) gemt lokalt.`));
    body.append(el('div', { class: 'row' },
      el('button', { class: 'tb', onclick: () => download(results) }, '⬇ CSV'),
      el('a', { class: 'tb', href: '#/testresultater', onclick: () => setMin(true) }, 'Resultater'),
      el('button', { class: 'tb', onclick: () => { if (confirm('Slet alle gemte testresultater i denne browser?')) { save([]); render(); } } }, 'Nulstil')));
    updateMetrics();
  }

  function metricsEl() {
    return el('div', { class: 'metrics', id: 'tm' },
      el('div', {}, el('b', { 'data-k': 't' }, '00:00'), 'tid'), el('div', {}, el('b', { 'data-k': 'c' }, '0'), 'klik'),
      el('div', {}, el('b', { 'data-k': 'p' }, '0'), 'sider'), el('div', {}, el('b', { 'data-k': 'd' }, '0'), 'blindg.'));
  }

  function startTask() {
    Object.assign(S, { first: '', phase: 'running', t0: Date.now(), clicks: 0, routes: [], dead: 0, sorts: 0, exports: 0, searches: 0, secs: 0, outcome: '', seq: 0, note: '' });
    clearInterval(timer); timer = setInterval(updateMetrics, 500);
    setMin(true); render();
    if (location.hash === '#/' || location.hash === '' || location.hash === '#') { window.dispatchEvent(new HashChangeEvent('hashchange')); } else { location.hash = '#/'; }
    S.routes = ['#/'];
    updateMetrics();
  }
  function stopTask() { S.secs = elapsed(); S.phase = 'rating'; clearInterval(timer); render(); }
  function saveTask() {
    const t = TASKS.find(x => x.id === S.task);
    const note = $('#note') ? $('#note').value : S.note;
    const r = load();
    r.push({ deltager: getPid(), version: VER, opgave: t.id, gruppe: t.group, udfald: S.outcome || '', seq: S.seq || '', sekunder: S.secs, klik: S.clicks, sider: S.routes.length, blindgyder: S.dead, sorteringer: S.sorts, eksporter: S.exports, soegninger: S.searches, note, foerste_klik: S.first, rutesti: S.routes.join(' > '), tidspunkt: new Date().toISOString() });
    save(r);
    S.phase = 'idle'; S.task = null; render();
  }
  function saveSus() {
    const sc = S.sus.reduce((t, v, i) => t + (i % 2 === 0 ? v - 1 : 5 - v), 0) * 2.5;
    const r = load(); r.push({ deltager: getPid(), version: VER, opgave: 'SUS', sus_score: sc, tidspunkt: new Date().toISOString() }); save(r);
    S.phase = 'idle'; S.sus = []; render();
  }
  function download(rows) {
    if (!rows.length) { alert('Ingen resultater gemt endnu.'); return; }
    const cols = ['deltager', 'version', 'opgave', 'gruppe', 'udfald', 'seq', 'sekunder', 'klik', 'sider', 'blindgyder', 'sorteringer', 'eksporter', 'soegninger', 'foerste_klik', 'sus_score', 'note', 'rutesti', 'tidspunkt'];
    const esc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
    const csv = '﻿' + [cols.join(';')].concat(rows.map(r => cols.map(c => esc(r[c])).join(';'))).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'testresultater-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.append(a); a.click(); a.remove();
  }

  document.addEventListener('click', (e) => {
    if (S.phase !== 'running' || (panel && panel.contains(e.target))) return;
    const hit = e.target.closest('a,button,summary,label.pill,li[role=option],input,select,.bub,.reg');
    if (hit) { S.clicks++; if (!S.first) S.first = (((hit.querySelector('h3,strong') || hit).textContent || hit.getAttribute('aria-label') || hit.tagName).trim().replace(/\s+/g, ' ').slice(0, 40) || hit.tagName) + ' @' + (location.hash || '#/'); updateMetrics(); }
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
