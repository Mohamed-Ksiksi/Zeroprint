"""Minimal Flask launcher that only serves the frontend templates.
Future API routes (see README) go here: /api/analyze, /api/optimize, /api/history."""
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index(): return render_template("index.html")
@app.route("/analyze")
def analyze(): return render_template("workspace.html")
@app.route("/dashboard")
def dashboard(): return render_template("dashboard.html")
@app.route("/comparison")
def comparison(): return render_template("comparison.html")
@app.route("/reports")
def reports(): return render_template("reports.html")

if __name__ == "__main__":
    app.run(debug=True)
