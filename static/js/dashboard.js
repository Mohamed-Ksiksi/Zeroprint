/* Dashboard: renders one analysis object. Chart data comes only from EcoAPI. */
(async () => {
  const $ = id => document.getElementById(id), f = EcoAPI.fmt, a = await EcoAPI.getCurrent();
  const m = a.metrics, b = a.best, s = a.series;
  $('meta').textContent = `${a.meta.name} · ${a.meta.language} · ${a.meta.lines} lines · N = ${a.meta.n.toLocaleString()} · demonstration data`;
  $('m-cx').textContent = m.complexity; $('m-cx-n').textContent = 'Quadratic growth: doubling N about quadruples the work.';
  const t = f.time(m.timeMs), c = f.co2(m.co2g);
  $('m-t').textContent = t.v; $('m-t-u').textContent = t.u; $('m-e').textContent = f.sig(m.energyWh); $('m-c').textContent = c.v; $('m-c-u').textContent = c.u;
  const eff = (o, p) => Math.max(4, Math.min(100, p / o * 100)) + '%';
  $('meter-cx').style.width = '25%'; $('meter-t').style.width = eff(m.timeMs, b.timeMs); $('meter-e').style.width = eff(m.energyWh, b.energyWh); $('meter-c').style.width = eff(m.co2g, b.co2g);

  const labels = s.sizes.map(n => n.toLocaleString());
  const line = (id, key, unit, color, type = 'line') => new Chart($(id), { type,
    data: { labels, datasets: [{ label: 'Your code', data: s.orig.map(p => p[key]), borderColor: color, backgroundColor: color + '99', tension: .3, pointRadius: 3 },
                               { label: 'Optimized (est.)', data: s.opt.map(p => p[key]), borderColor: '#3ddc97', backgroundColor: '#3ddc9799', borderDash: [5, 4], tension: .3, pointRadius: 3 }] },
    options: { interaction: { mode: 'index', intersect: false }, scales: { x: { title: { display: true, text: 'Input size N' } }, y: { title: { display: true, text: unit }, beginAtZero: true } },
      plugins: { tooltip: { callbacks: { label: x => `${x.dataset.label}: ${f.sig(x.parsed.y)} ${unit}` } } } } });
  line('chTime', 'ms', 'ms', '#f2b84b'); line('chEnergy', 'wh', 'Wh', '#58a6ff'); line('chCo2', 'g', 'g CO₂e', '#ff6b6b', 'bar');
  const col = { 'O(n²)': '#ff6b6b', 'O(n log n)': '#3ddc97', 'O(n)': '#58a6ff' };
  new Chart($('chScale'), { type: 'line', data: { labels, datasets: Object.entries(s.ops).map(([k, v]) => ({ label: k, data: v, borderColor: col[k], tension: .3, pointRadius: 2, borderWidth: k === 'O(n²)' ? 3 : 1.5 })) },
    options: { scales: { x: { title: { display: true, text: 'Input size N' } }, y: { type: 'logarithmic', title: { display: true, text: 'Operations' } } } } });

  const q = t => t.replace(/`([^`]+)`/g, '<code>$1</code>'), list = (id, arr) => $(id).innerHTML = arr.map(x => `<li>${q(x)}</li>`).join('');
  $('loops').tBodies[0].innerHTML = a.findings.loops.map(l => `<tr><td class="mono">${l.line}</td><td class="mono">${l.text}</td><td>${l.depth}</td><td><span class="pill ${l.depth > 1 ? 'bad' : ''}">${l.cost}</span></td></tr>`).join('');
  $('explain').textContent = a.findings.explanation; list('ineff', a.findings.inefficient); list('bottle', a.findings.bottlenecks); list('recs', a.findings.recommendations);
})();
