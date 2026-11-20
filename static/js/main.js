/* Shared UI: toasts, clipboard, download, sidebar, settings, chart defaults, history page. */
const EcoUI = {
  toast(msg, type = 'ok') {
    const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg;
    document.getElementById('toasts').appendChild(t); setTimeout(() => t.remove(), 2800);
  },
  async copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { const a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }
    EcoUI.toast('Copied to clipboard');
  },
  download(name, text) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name; a.click();
    URL.revokeObjectURL(a.href); EcoUI.toast('Downloaded ' + name);
  },
  editorTheme() { return (localStorage.getItem('eco.theme') || 'dark') === 'dark' ? 'material-darker' : 'eclipse'; },
  chartDefaults() {
    if (!window.Chart) return;
    Object.assign(Chart.defaults, { color: '#8fa0bf', borderColor: '#1f2d4a', maintainAspectRatio: false });
    Chart.defaults.font.family = "'Bricolage Grotesque', sans-serif";
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  // Active nav link: exact path+hash match first, otherwise path match.
  const links = [...document.querySelectorAll('.side nav a[href]')].filter(a => a.getAttribute('href') !== '#');
  const here = location.pathname + location.hash;
  const active = links.find(a => new URL(a.href).pathname + new URL(a.href).hash === here) || links.find(a => new URL(a.href).pathname === location.pathname && !a.hash);
  if (active) active.classList.add('active');

  // Sidebar: collapse on desktop, drawer on mobile.
  const app = document.getElementById('app');
  if (app) {
    if (localStorage.getItem('eco.collapsed') === '1') app.classList.add('collapsed');
    document.getElementById('sideToggle').onclick = () => {
      if (innerWidth < 900) app.classList.toggle('open');
      else localStorage.setItem('eco.collapsed', app.classList.toggle('collapsed') ? '1' : '0');
    };
    document.getElementById('side').addEventListener('click', e => { if (e.target.closest('a')) app.classList.remove('open'); });
  }

  // Settings dialog.
  const dlg = document.getElementById('settings'), sel = document.getElementById('setTheme');
  document.querySelectorAll('[data-open-settings]').forEach(a => a.onclick = e => { e.preventDefault(); sel.value = localStorage.getItem('eco.theme') || 'dark'; dlg.showModal(); });
  dlg.addEventListener('close', () => { if (dlg.returnValue === 'ok') { localStorage.setItem('eco.theme', sel.value); EcoUI.toast('Settings saved'); if (document.getElementById('code')) location.reload(); } });

  EcoUI.chartDefaults();
  if (document.getElementById('hist')) initHistory();
});

async function initHistory() {
  const rows = await EcoAPI.history(), $ = id => document.getElementById(id), body = $('hist').tBodies[0];
  const fill = (id, vals) => [...new Set(vals)].forEach(v => $(id).add(new Option(v, v)));
  fill('fLang', rows.map(r => r.lang)); fill('fCx', rows.map(r => r.cx));
  const f = EcoAPI.fmt;
  $('s-count').textContent = rows.length;
  $('s-time').textContent = (t => t.v + ' ' + t.u)(f.time(rows.reduce((s, r) => s + r.ms, 0) / rows.length));
  $('s-co2').textContent = (c => c.v + ' ' + c.u)(f.co2(rows.reduce((s, r) => s + r.g, 0)));
  function render() {
    const q = $('q').value.trim().toLowerCase();
    const list = rows.filter(r => r.name.toLowerCase().includes(q) && (!$('fLang').value || r.lang === $('fLang').value) && (!$('fCx').value || r.cx === $('fCx').value));
    body.innerHTML = '';
    list.forEach(r => {
      const t = f.time(r.ms), tr = body.insertRow();
      tr.innerHTML = `<td class="mono">${r.name}</td><td>${r.lang}</td><td><span class="pill">${r.cx}</span></td><td>${t.v} ${t.u}</td><td>${r.date}</td><td><button class="btn btn-ghost btn-sm">View results</button></td>`;
      tr.querySelector('button').onclick = async () => { await EcoAPI.openHistory(r); location.href = document.querySelector('a[href$="/dashboard"]').href; };
    });
    $('empty').hidden = list.length > 0; $('hist').hidden = !list.length;
  }
  ['q', 'fLang', 'fCx'].forEach(id => $(id).addEventListener('input', render)); render();
  $('btnCsv').onclick = () => EcoUI.download('ecocode-history.csv', 'name,language,complexity,ms,date\n' + rows.map(r => [r.name, r.lang, r.cx, r.ms, r.date].join(',')).join('\n'));
}
