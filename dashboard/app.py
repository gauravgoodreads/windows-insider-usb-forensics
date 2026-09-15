from __future__ import annotations
import json, os, sqlite3, sys
from pathlib import Path
from flask import Flask, abort, jsonify, render_template, request
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT))
from forensic.pipeline import run
DB=Path(os.getenv("FORENSICS_DB",ROOT/"data/cases/insider_usb.db")).resolve()
app=Flask(__name__); app.config["MAX_CONTENT_LENGTH"]=10*1024*1024
def rows(sql,args=()):
 if not DB.exists(): run(ROOT/"data/sample")
 db=sqlite3.connect(DB); db.row_factory=sqlite3.Row
 try:return [dict(r) for r in db.execute(sql,args)]
 finally:db.close()
def payloads(table,order="rowid"):
 return [json.loads(r["payload"]) for r in rows(f"SELECT payload FROM {table} ORDER BY {order}")]
@app.get("/")
def index():
 arts=payloads("artifacts","timestamp"); cors=payloads("correlations"); hyps=payloads("hypotheses","id"); devices=sorted({a.get("device") for a in arts if a.get("device")}); files=sorted({a.get("filename") for a in arts if a.get("classification") not in (None,"NORMAL")});
 return render_template("index.html",artifacts=arts,correlations=cors,hypotheses=hyps,devices=devices,files=files)
@app.get("/artifact/<artifact_id>")
def artifact(artifact_id):
 found=rows("SELECT payload FROM artifacts WHERE artifact_id=?",(artifact_id,));
 if not found: abort(404)
 return render_template("artifact.html",artifact=json.loads(found[0]["payload"]))
@app.get("/api/cases")
def api_cases(): return jsonify(rows("SELECT * FROM cases"))
@app.get("/api/cases/<case_id>")
def api_case(case_id):
 found=rows("SELECT * FROM cases WHERE case_id=?",(case_id,)); return jsonify(found[0]) if found else abort(404)
@app.get("/api/artifacts")
def api_artifacts():
 values=payloads("artifacts","timestamp"); q=request.args.get("q","").lower(); typ=request.args.get("type")
 if q: values=[x for x in values if q in json.dumps(x).lower()]
 if typ: values=[x for x in values if x.get("artifact_type")==typ]
 return jsonify(values)
@app.get("/api/artifacts/<artifact_id>")
def api_artifact(artifact_id):
 found=rows("SELECT payload FROM artifacts WHERE artifact_id=?",(artifact_id,)); return jsonify(json.loads(found[0]["payload"])) if found else abort(404)
@app.get("/api/timeline")
def api_timeline(): return jsonify(payloads("artifacts","timestamp"))
@app.get("/api/devices")
def api_devices(): return jsonify(sorted({x.get("device") for x in payloads("artifacts") if x.get("device")}))
@app.get("/api/files")
def api_files(): return jsonify(sorted({x.get("filename") for x in payloads("artifacts") if x.get("filename")}))
@app.get("/api/hypotheses")
def api_hypotheses(): return jsonify(payloads("hypotheses","id"))
@app.get("/api/correlations")
def api_correlations(): return jsonify(payloads("correlations"))
@app.post("/api/analyze")
def api_analyze():
 result=run(ROOT/"data/sample"); return jsonify({"artifacts":result["artifact_count"],"reports":result["reports"]})
@app.post("/api/ingest")
def api_ingest(): return jsonify({"error":"Use the offline CLI with a configured evidence directory; arbitrary web uploads are disabled."}),403
@app.get("/api/findings")
def api_findings(): return api_hypotheses()
@app.post("/api/reports")
def api_reports(): return api_analyze()
if __name__=="__main__": app.run(host="127.0.0.1",port=int(os.getenv("FORENSICS_PORT","5000")),debug=False)

