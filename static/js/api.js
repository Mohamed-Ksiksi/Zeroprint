/* EcoAPI: ALL mock data and "requests" live here.
 * Each function returns a Promise, exactly like a fetch() to Flask would.
 * FLASK: replace the body of each function with the fetch call shown in its TODO. */
const EcoAPI = (() => {
  const KEY = 'eco.analysis';
  const GRID_G_PER_WH = 400;            // demo-only conversion factor
  const SAMPLE_CODE = `def find_duplicates(items):
    duplicates = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            if items[i] == items[j] and items[i] not in duplicates:
                duplicates.append(items[i])
    return duplicates

def total_cost(orders):
    total = 0
    for order in orders:
        total = total + order["price"] * order["qty"]
    return total
`;
  const OPTIMIZED_CODE = `def find_duplicates(items):
    ordered = sorted(items)
    duplicates = []
    for prev, cur in zip(ordered, ordered[1:]):
        if prev == cur and (not duplicates or duplicates[-1] != cur):
            duplicates.append(cur)
    return duplicates

def total_cost(orders):
    return sum(o["price"] * o["qty"] for o in orders)
`;
  // Demo cost model, calibrated so N=1000 gives the brief's example values.
  const model = {
    orig: n => ({ ms: 125 * (n / 1000) ** 2, wh: 125 * (n / 1000) ** 2 * 1.6e-5 }),
    opt:  n => { const ms = 42 * (n * Math.log2(n)) / (1000 * Math.log2(1000)); return { ms, wh: ms * 1.905e-5 }; },
  };
  const point = (f, n) => { const r = f(n); return { ms: r.ms, wh: r.wh, g: r.wh * GRID_G_PER_WH }; };
  const ops = { 'O(n²)': n => n * n, 'O(n log n)': n => n * Math.log2(n), 'O(n)': n => n };

  const fmt = {
    sig: v => Number(v.toPrecision(2)).toLocaleString('en-US', { maximumFractionDigits: 6 }),
    time: ms => ms < 1000 ? { v: fmt.sig(ms), u: 'ms' } : ms < 6e4 ? { v: fmt.sig(ms / 1e3), u: 's' } : { v: fmt.sig(ms / 6e4), u: 'min' },
    co2: g => g < 1000 ? { v: fmt.sig(g), u: 'g CO₂e' } : { v: fmt.sig(g / 1000), u: 'kg CO₂e' },
    pct: (o, p) => Math.round((1 - p / o) * 100),
  };

  const sizesFor = n => [0.1, 0.25, 0.5, 1, 2, 4].map(k => Math.max(10, Math.round(n * k)));

  async function analyze({ code, language = 'Python', n = 1000, name = 'find_duplicates.py' }) {
    // TODO FLASK: return (await fetch('/api/analyze', {method:'POST', headers:{'Content-Type':'application/json'},
    //   body: JSON.stringify({code, language, n})})).json();
    await new Promise(r => setTimeout(r, 250));
    const sizes = sizesFor(n), o = point(model.orig, n), p = point(model.opt, n);
    const res = {
      id: 'demo-' + Date.now(), demo: true,
      meta: { name, language, n, lines: code.split('\n').length, date: new Date().toISOString().slice(0, 10) },
      code,
      metrics: { complexity: 'O(n²)', timeMs: o.ms, energyWh: o.wh, co2g: o.g },
      best:    { complexity: 'O(n log n)', timeMs: p.ms, energyWh: p.wh, co2g: p.g },
      series: { sizes, orig: sizes.map(s => point(model.orig, s)), opt: sizes.map(s => point(model.opt, s)),
                ops: Object.fromEntries(Object.entries(ops).map(([k, f]) => [k, sizes.map(f)])) },
      findings: {
        loops: [{ line: 3, text: 'for i in range(len(items))', depth: 1, cost: 'O(n)' },
                { line: 4, text: 'for j in range(i + 1, len(items))', depth: 2, cost: 'O(n²) total' },
                { line: 11, text: 'for order in orders', depth: 1, cost: 'O(n)' }],
        inefficient: ['`items[i] not in duplicates` scans a list on every match (line 5).', 'Repeated `total = total + …` instead of `sum()` (line 12).'],
        explanation: 'Two nested loops compare every pair of items, so work grows with the square of N. Doubling N roughly quadruples runtime and energy.',
        bottlenecks: ['Nested pairwise comparison in find_duplicates accounts for about 94% of runtime (demo estimate).'],
        recommendations: ['Sort once, then compare neighbours to reach O(n log n).', 'Replace the manual accumulation with sum() and a generator.', 'Use a set if items are hashable to reach O(n).'],
      },
    };
    sessionStorage.setItem(KEY, JSON.stringify(res));
    return res;
  }

  async function getCurrent() {
    // TODO FLASK: GET /api/analyses/<id>
    const s = sessionStorage.getItem(KEY);
    return s ? JSON.parse(s) : analyze({ code: SAMPLE_CODE });
  }

  async function optimize(analysis) {
    // TODO FLASK: POST /api/optimize {analysis_id}
    return {
      code: OPTIMIZED_CODE, changedOriginal: [1, 2, 3, 4, 8, 9, 10, 11], changedOptimized: [1, 3, 4, 5, 9],
      original: analysis.metrics, optimized: analysis.best,
      notes: ['Replaced the O(n²) nested loops with sort + adjacent comparison (O(n log n)).',
              'Removed the O(n) `not in duplicates` scan by checking only the last result.',
              'Replaced manual accumulation with sum() over a generator.'],
    };
  }

  const HISTORY = [
    { id: 1, name: 'find_duplicates.py', lang: 'Python', cx: 'O(n²)', ms: 125, date: '2026-11-19', n: 1000 },
    { id: 2, name: 'matrix_multiply.py', lang: 'Python', cx: 'O(n³)', ms: 890, date: '2026-11-18', n: 200 },
    { id: 3, name: 'binary_search.py', lang: 'Python', cx: 'O(log n)', ms: 0.4, date: '2026-11-17', n: 100000 },
    { id: 4, name: 'merge_sort.py', lang: 'Python', cx: 'O(n log n)', ms: 42, date: '2026-11-15', n: 1000 },
    { id: 5, name: 'word_count.py', lang: 'Python', cx: 'O(n)', ms: 18, date: '2026-11-12', n: 5000 },
    { id: 6, name: 'fib_recursive.py', lang: 'Python', cx: 'O(2ⁿ)', ms: 5400, date: '2026-11-09', n: 30 },
    { id: 7, name: 'cache.js', lang: 'JavaScript', cx: 'O(n)', ms: 9, date: '2026-11-05', n: 2000 },
    { id: 8, name: 'graph_bfs.py', lang: 'Python', cx: 'O(n + m)', ms: 31, date: '2026-11-02', n: 3000 },
  ];
  async function history() { /* TODO FLASK: GET /api/history */ return HISTORY.map(h => ({ ...h, g: h.ms * 1.6e-5 * GRID_G_PER_WH })); }
  async function openHistory(h) { return analyze({ code: SAMPLE_CODE, n: h.n, name: h.name }); }

  return { SAMPLE_CODE, analyze, getCurrent, optimize, history, openHistory, fmt };
})();
