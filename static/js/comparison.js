/* Comparison: original vs optimized code and metrics. */
(async () => {
  const $ = id => document.getElementById(id), f = EcoAPI.fmt, a = await EcoAPI.getCurrent(), o = await EcoAPI.optimize(a);
  const mk = (id, code, theme) => CodeMirror.fromTextArea($(id), { mode: 'python', lineNumbers: true, readOnly: true, theme, viewportMargin: Infinity });
  const L = mk('origCode', a.code, 'material-darker'), R = mk('optCode', o.code, 'material-darker'); L.setValue(a.code); R.setValue(o.code);
  o.changedOriginal.forEach(i => L.addLineClass(i, 'background', 'ln-bad')); o.changedOptimized.forEach(i => R.addLineClass(i, 'background', 'ln-good'));
  const sum = x => `${x.complexity} · ${f.time(x.timeMs).v} ${f.time(x.timeMs).u}`;
  $('o-sum').textContent = sum(o.original); $('p-sum').textContent = sum(o.optimized);
  $('notes').innerHTML = o.notes.map(n => `<li>${n.replace(/`([^`]+)`/g, '<code>$1</code>')}</li>`).join('');

  const rows = [['Time complexity', 'complexity', null, 'c-blue'], ['Execution time', 'timeMs', x => { const t = f.time(x); return t.v + ' ' + t.u; }, 'c-amber'],
    ['Energy consumption', 'energyWh', x => f.sig(x) + ' Wh', 'c-blue'], ['Carbon emissions', 'co2g', x => { const c = f.co2(x); return c.v + ' ' + c.u; }, 'c-green']];
  $('deltas').innerHTML = rows.map(([l, k, fn, cls]) => {
    const A = o.original[k], B = o.optimized[k];
    return `<article class="metric ${cls}"><header>${l}</header><div class="cmp"><span class="was">${fn ? fn(A) : A}</span><span class="to">→</span><span class="now">${fn ? fn(B) : B}</span></div>
      <span class="pill good">${fn ? '−' + f.pct(A, B) + '%' : 'Improved'}</span></article>`; }).join('');

  new Chart($('chCmp'), { type: 'bar', data: { labels: ['Execution time', 'Energy', 'Carbon'],
    datasets: [{ label: 'Original = 100%', data: [100, 100, 100], backgroundColor: '#ff6b6b99' },
               { label: 'Optimized', data: ['timeMs', 'energyWh', 'co2g'].map(k => +(o.optimized[k] / o.original[k] * 100).toFixed(1)), backgroundColor: '#3ddc97' }] },
    options: { indexAxis: 'y', scales: { x: { max: 110, ticks: { callback: v => v + '%' } } }, plugins: { tooltip: { callbacks: { label: x => `${x.dataset.label}: ${x.parsed.x}%` } } } } });

  $('btnCopyOpt').onclick = () => EcoUI.copy(o.code);
  $('btnDl').onclick = () => EcoUI.download('optimized_' + a.meta.name.replace(/\.\w+$/, '') + '.py', o.code);
})();
