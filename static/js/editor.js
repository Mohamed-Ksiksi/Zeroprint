/* Workspace: CodeMirror editor, upload, analyze flow. */
(() => {
  const $ = id => document.getElementById(id);
  const cm = CodeMirror.fromTextArea($('code'), { mode: 'python', lineNumbers: true, indentUnit: 4, smartIndent: true, theme: EcoUI.editorTheme(),
    extraKeys: { Tab: c => c.replaceSelection('    ', 'end') } });
  cm.setValue(EcoAPI.SAMPLE_CODE);
  const load = (text, name) => { cm.setValue(text); if (name) $('projName').value = name; };

  $('btnCopy').onclick = () => EcoUI.copy(cm.getValue());
  $('btnReset').onclick = () => { load(EcoAPI.SAMPLE_CODE, 'find_duplicates.py'); EcoUI.toast('Sample restored'); };
  $('btnClear').onclick = () => { cm.setValue(''); cm.focus(); EcoUI.toast('Editor cleared'); };
  $('btnTheme').onclick = () => { const dark = cm.getOption('theme') === 'material-darker'; localStorage.setItem('eco.theme', dark ? 'light' : 'dark'); cm.setOption('theme', EcoUI.editorTheme()); };
  $('btnUpload').onclick = () => $('file').click();
  const readFile = f => { if (!f) return; if (!/\.(py|txt)$/i.test(f.name)) return EcoUI.toast('Upload a .py or .txt file', 'err');
    f.text().then(t => { load(t, f.name); EcoUI.toast('Loaded ' + f.name); }); };
  $('file').onchange = e => readFile(e.target.files[0]);
  const dz = $('dropzone');
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('drag'); };
  dz.ondragleave = () => dz.classList.remove('drag');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('drag'); readFile(e.dataTransfer.files[0]); };
  $('chips').onclick = e => { if (e.target.dataset.n) $('n').value = e.target.dataset.n; };

  const steps = ['Parsing syntax tree', 'Estimating time complexity', 'Benchmarking (simulated)', 'Estimating energy and CO₂e'];
  $('btnAnalyze').onclick = async () => {
    const code = cm.getValue(), n = +$('n').value;
    if (!code.trim()) return EcoUI.toast('Add some code to analyze', 'err');
    if (!(n >= 10 && n <= 1e6)) return EcoUI.toast('Enter an N between 10 and 1,000,000', 'err');
    $('overlay').hidden = false; $('ovSteps').innerHTML = steps.map(s => `<li>${s}</li>`).join('');
    const items = $('ovSteps').children, req = EcoAPI.analyze({ code, language: $('lang').value, n, name: $('projName').value || 'untitled.py' });
    for (let i = 0; i < items.length; i++) { items[i].classList.add('run'); $('ovBar').style.width = ((i + 1) / items.length * 100) + '%';
      await new Promise(r => setTimeout(r, 650)); items[i].classList.replace('run', 'done'); }
    await req; location.href = document.querySelector('a[href$="/dashboard"]').href;
  };
})();
