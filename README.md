# EcoCode frontend prototype

Frontend-only prototype for a code performance and carbon analysis platform. **All numbers are demonstration data** produced by `static/js/api.js`. No code is executed or measured.

## Structure
```
app.py                  tiny Flask launcher (serves templates only)
templates/              Jinja2: base, index (landing), workspace, dashboard, comparison, reports
static/css/             style.css (shell, landing, workspace), dashboard.css (dashboard, comparison, history)
static/js/api.js        ALL mock data and the async "API" functions
static/js/main.js       toasts, clipboard, download, sidebar, settings, history page
static/js/editor.js     workspace editor, upload, analyze flow
static/js/dashboard.js  dashboard rendering and charts
static/js/comparison.js original vs optimized view
```
Libraries load from cdnjs (Chart.js 4.4.1, CodeMirror 5.65.16) and Google Fonts, so an internet connection is needed.

## Run
```
pip install -r requirements.txt
python app.py        # open http://127.0.0.1:5000
```
Flow: Home → New analysis → Analyze Code → Dashboard → OPTIMIZE MY CODE → Comparison.
The latest analysis is kept in `sessionStorage` under `eco.analysis`.

## Connecting a Flask backend
Every mock interaction is one function in `api.js`, marked with a `TODO FLASK` comment:

| Function | Replace with | Returns |
|---|---|---|
| `analyze({code, language, n})` | `POST /api/analyze` | analysis object (see shape in `api.js`) |
| `getCurrent()` | `GET /api/analyses/<id>` | analysis object |
| `optimize(analysis)` | `POST /api/optimize` | `{code, original, optimized, notes, changedOriginal, changedOptimized}` |
| `history()` | `GET /api/history` | list of past analyses |

Keep the returned JSON shapes and no page code needs to change. Add the routes to `app.py`, and the backend should handle sandboxed execution, complexity estimation, benchmarking, energy and CO₂e calculation, and optimization.

## Known prototype limits
- The optimized code is a fixed sample, whatever code is submitted.
- Only Python is selectable. Other languages are disabled placeholders.
- Two history rows use JavaScript only to demonstrate the filter.
