from forensic.pipeline import run
from forensic.config import ROOT
def test_pipeline_and_dashboard(tmp_path,monkeypatch):
 db=tmp_path/"case.db"; r=run(ROOT/"data/sample",tmp_path,db); assert r["artifact_count"]>=13
 import dashboard.app as module
 monkeypatch.setattr(module,"DB",db); client=module.app.test_client(); assert client.get("/").status_code==200; assert client.get("/api/artifacts").status_code==200; assert client.post("/api/ingest").status_code==403

