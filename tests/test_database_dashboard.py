from forensic.pipeline import run
from forensic.config import ROOT
def test_pipeline_and_dashboard(tmp_path,monkeypatch):
 db=tmp_path/"case.db"; r=run(ROOT/"data/sample",tmp_path,db); assert r["artifact_count"]>=13
 import dashboard.app as module
 monkeypatch.setattr(module,"DB",db); client=module.app.test_client(); assert client.get("/").status_code==200; assert client.get("/api/artifacts").status_code==200; assert client.post("/api/ingest").status_code==403
 for route in ("/artifacts","/devices","/files","/timeline","/hypotheses","/correlations","/experiments","/reports","/custody","/settings"):
  assert client.get(route).status_code==200
 import sqlite3
 with sqlite3.connect(db) as conn:
  assert conn.execute("SELECT COUNT(*) FROM evidence_items").fetchone()[0]==1
  assert conn.execute("SELECT COUNT(*) FROM chain_of_custody").fetchone()[0]==1

def test_dashboard_api_bundle(tmp_path,monkeypatch):
 db=tmp_path/"case.db"; run(ROOT/"data/sample",tmp_path,db)
 import dashboard.app as module
 monkeypatch.setattr(module,"DB",db); data=module.app.test_client().get("/api/dashboard").get_json()
 assert len(data["artifacts"])>=13 and len(data["correlations"])==8 and [h["id"] for h in data["hypotheses"]]==["H1","H2","H3","H4"]
 assert data["score"]["score"]==13 and "NOT an established forensic standard" in data["score"]["disclaimer"]
 assert {r["feature"]:r["a"] for r in data["experiments"]}["USB connection"] is True and data["devices"][0]["name"]=="BACKUP_DRIVE"

def test_report_download_security(tmp_path,monkeypatch):
 db=tmp_path/"case.db"; run(ROOT/"data/sample",ROOT/"outputs",db)
 import dashboard.app as module
 monkeypatch.setattr(module,"DB",db); client=module.app.test_client()
 assert client.get("/reports/download/timeline.csv").status_code==200
 assert client.get("/reports/download/../../README.md").status_code==404

