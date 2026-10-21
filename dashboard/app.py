from __future__ import annotations
import json, os, sqlite3, sys
from pathlib import Path
from types import SimpleNamespace
from flask import Flask, abort, jsonify, render_template, request, send_from_directory
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT))
from forensic.pipeline import run
from forensic.config import project_config, load_yaml
from forensic.scoring import calculate_score
from forensic.scoring.engine import on_removable_media
DB=Path(os.getenv("FORENSICS_DB",ROOT/"data/cases/insider_usb.db")).resolve()
OUTPUTS=Path(os.getenv("FORENSICS_OUTPUTS",ROOT/"outputs")).resolve()
SPA=Path(__file__).resolve().parent/"static"/"app"
app=Flask(__name__); app.config["MAX_CONTENT_LENGTH"]=10*1024*1024
SENSITIVE_ACTIONS={"accessed","copied","created","modified","deleted","renamed"}
EXPERIMENT_FEATURES=[("USB connection",lambda a:a.get("artifact_type")=="usb" and a.get("action")=="connected"),("Sensitive file activity",lambda a:a.get("classification") not in (None,"NORMAL") and a.get("action") in SENSITIVE_ACTIONS),("Archive creation",lambda a:a.get("artifact_type")=="archive"),("Sensitive USB destination",lambda a:a.get("classification") not in (None,"NORMAL") and on_removable_media(SimpleNamespace(**a))),("Deletion or rename",lambda a:a.get("action") in {"deleted","renamed"})]
def spa_or(template,**context):
 """Serve the built React dashboard when present; otherwise fall back to the server-rendered page."""
 return send_from_directory(SPA,"index.html") if (SPA/"index.html").exists() else render_template(template,**context)
def rows(sql,args=()):
 if not DB.exists(): run(ROOT/"data/sample")
 db=sqlite3.connect(DB); db.row_factory=sqlite3.Row
 try:return [dict(r) for r in db.execute(sql,args)]
 finally:db.close()
def payloads(table,order="rowid"):
 return [json.loads(r["payload"]) for r in rows(f"SELECT payload FROM {table} ORDER BY {order}")]
def device_summary(arts):
 out=[]
 for name in sorted({a.get("device") for a in arts if a.get("device")}):
  related=[a for a in arts if a.get("device")==name]; out.append({"name":name,"related":related,"users":sorted({a.get("user") for a in related if a.get("user")}),"files":sorted({a.get("filename") for a in related if a.get("classification") not in (None,"NORMAL")}),"first":next((a.get("timestamp") for a in related if a.get("timestamp")),None),"last":next((a.get("timestamp") for a in reversed(related) if a.get("timestamp")),None)})
 return out
def file_summary(arts):
 names=sorted({a.get("filename") for a in arts if a.get("classification") not in (None,"NORMAL")}); return [{"name":name,"evidence":[a for a in arts if a.get("filename")==name]} for name in names]
def experiment_rows(arts):
 return [{"feature":label,"a":any(fn(x) for x in arts if x.get("experiment")=="EXP-A"),"b":any(fn(x) for x in arts if x.get("experiment")=="EXP-B")} for label,fn in EXPERIMENT_FEATURES]
def report_files(): return sorted((OUTPUTS).glob("*")) if (OUTPUTS).exists() else []
@app.get("/")
def index():
 arts=payloads("artifacts","timestamp"); cors=payloads("correlations"); hyps=payloads("hypotheses","id"); devices=sorted({a.get("device") for a in arts if a.get("device")}); files=sorted({a.get("filename") for a in arts if a.get("classification") not in (None,"NORMAL")}); case=rows("SELECT * FROM cases LIMIT 1")[0]; evidence_count=rows("SELECT COUNT(*) AS total FROM evidence_items")[0]["total"]; sessions=sum(1 for a in arts if a.get("artifact_type")=="user_session")
 return spa_or("index.html",case=case,evidence_count=evidence_count,sessions=sessions,artifacts=arts,correlations=cors,hypotheses=hyps,devices=devices,files=files)
@app.get("/artifact/<artifact_id>")
def artifact(artifact_id):
 found=rows("SELECT payload FROM artifacts WHERE artifact_id=?",(artifact_id,));
 if not found: abort(404)
 return spa_or("artifact.html",artifact=json.loads(found[0]["payload"]))
@app.get("/artifacts")
def artifacts_page(): return spa_or("collection.html",title="Evidence Artifacts",description="Searchable normalized evidence inventory. Open any record to compare raw and normalized data.",items=payloads("artifacts","timestamp"),kind="artifact")
@app.get("/devices")
def devices_page(): return spa_or("devices.html",devices=device_summary(payloads("artifacts","timestamp")))
@app.get("/files")
def files_page(): return spa_or("files.html",files=file_summary(payloads("artifacts","timestamp")))
@app.get("/timeline")
def timeline_page(): return spa_or("timeline.html",items=payloads("artifacts","timestamp"))
@app.get("/hypotheses")
def hypotheses_page(): return spa_or("hypotheses.html",hypotheses=payloads("hypotheses","id"))
@app.get("/correlations")
def correlations_page(): return spa_or("correlations.html",correlations=payloads("correlations"))
@app.get("/experiments")
def experiments_page(): return spa_or("experiments.html",rows=experiment_rows(payloads("artifacts","timestamp")))
@app.get("/reports")
def reports_page(): return spa_or("reports.html",reports=report_files())
@app.get("/reports/download/<path:filename>")
def report_download(filename):
 if Path(filename).name != filename or Path(filename).suffix.lower() not in {".pdf",".html",".md",".json",".csv"}: abort(404)
 return send_from_directory(OUTPUTS,filename,as_attachment=True)
@app.get("/custody")
def custody_page(): return spa_or("custody.html",entries=rows("SELECT * FROM chain_of_custody ORDER BY timestamp"),audit=rows("SELECT * FROM audit_log ORDER BY timestamp DESC"))
@app.get("/settings")
def settings_page(): return spa_or("settings.html",project=project_config(),scoring=load_yaml(ROOT/"config"/"scoring.yaml"))
@app.get("/api/dashboard")
def api_dashboard():
 """Everything the React dashboard renders, read from the same case database and outputs as the reports."""
 arts=payloads("artifacts","timestamp"); cors=payloads("correlations"); scoring=load_yaml(ROOT/"config"/"scoring.yaml")
 score=calculate_score([SimpleNamespace(**a) for a in arts],[SimpleNamespace(**c) for c in cors],scoring["rules"])
 report=OUTPUTS/f"{project_config()['project']['case_id']}_report.json"; summary=json.loads(report.read_text(encoding="utf-8")) if report.exists() else {}
 return jsonify({"case":rows("SELECT * FROM cases LIMIT 1")[0],"evidence":rows("SELECT * FROM evidence_items ORDER BY evidence_id"),"custody":rows("SELECT * FROM chain_of_custody ORDER BY timestamp"),"audit":rows("SELECT * FROM audit_log ORDER BY timestamp DESC"),
  "artifacts":arts,"correlations":cors,"hypotheses":payloads("hypotheses","id"),"experiments":experiment_rows(arts),
  "devices":[{**d,"related":[a["artifact_id"] for a in d["related"]]} for d in device_summary(arts)],"files":[{"name":f["name"],"classification":next((a.get("classification") for a in f["evidence"]),None),"evidence":[a["artifact_id"] for a in f["evidence"]]} for f in file_summary(arts)],
  "score":{**score,"rules":scoring["rules"],"disclaimer":scoring["disclaimer"]},"reports":[{"name":p.name,"size":p.stat().st_size,"suffix":p.suffix.lower().lstrip(".")} for p in report_files() if p.is_file()],
  "settings":project_config(),"conclusion":summary.get("conclusion"),"limitations":summary.get("limitations",[]),"disclaimer":summary.get("disclaimer")})
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
