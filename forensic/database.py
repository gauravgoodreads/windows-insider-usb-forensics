from __future__ import annotations
import json, sqlite3
from pathlib import Path
from typing import Iterable
from forensic.models import Artifact, CorrelationEvent, Hypothesis

SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS cases(case_id TEXT PRIMARY KEY,title TEXT NOT NULL,investigator TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS artifacts(artifact_id TEXT PRIMARY KEY,case_id TEXT NOT NULL,timestamp TEXT,artifact_type TEXT,source TEXT,user TEXT,device TEXT,filename TEXT,action TEXT,confidence TEXT,experiment TEXT,payload TEXT NOT NULL,FOREIGN KEY(case_id) REFERENCES cases(case_id));
CREATE TABLE IF NOT EXISTS correlations(event_id TEXT PRIMARY KEY,case_id TEXT NOT NULL,type TEXT,confidence TEXT,payload TEXT NOT NULL,FOREIGN KEY(case_id) REFERENCES cases(case_id));
CREATE TABLE IF NOT EXISTS hypotheses(id TEXT,case_id TEXT,assessment TEXT,confidence TEXT,payload TEXT NOT NULL,PRIMARY KEY(id,case_id),FOREIGN KEY(case_id) REFERENCES cases(case_id));
CREATE TABLE IF NOT EXISTS evidence_items(evidence_id TEXT PRIMARY KEY,case_id TEXT,filename TEXT,sha256 TEXT,size INTEGER,examiner TEXT,acquired_at TEXT,notes TEXT,FOREIGN KEY(case_id) REFERENCES cases(case_id));
CREATE TABLE IF NOT EXISTS chain_of_custody(id INTEGER PRIMARY KEY,timestamp TEXT,action TEXT,person TEXT,evidence_id TEXT,source TEXT,destination TEXT,hash TEXT,notes TEXT,FOREIGN KEY(evidence_id) REFERENCES evidence_items(evidence_id));
CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY,timestamp TEXT DEFAULT CURRENT_TIMESTAMP,case_id TEXT,action TEXT,details TEXT);
"""

def connect(path: str | Path) -> sqlite3.Connection:
    target=Path(path); target.parent.mkdir(parents=True,exist_ok=True); db=sqlite3.connect(target); db.row_factory=sqlite3.Row; db.executescript(SCHEMA); return db

def populate(db: sqlite3.Connection, config: dict, artifacts: Iterable[Artifact], correlations: Iterable[CorrelationEvent], hypotheses: Iterable[Hypothesis]) -> None:
    cid=config["project"]["case_id"]
    db.execute("INSERT OR REPLACE INTO cases(case_id,title,investigator) VALUES(?,?,?)",(cid,config["project"]["name"],config["project"]["investigator"]))
    db.execute("DELETE FROM artifacts WHERE case_id=?",(cid,)); db.execute("DELETE FROM correlations WHERE case_id=?",(cid,)); db.execute("DELETE FROM hypotheses WHERE case_id=?",(cid,))
    for a in artifacts: db.execute("INSERT INTO artifacts VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(a.artifact_id,cid,a.to_dict()["timestamp"],a.artifact_type,a.source,a.user,a.device,a.filename,a.action,a.confidence,a.experiment,json.dumps(a.to_dict())))
    for c in correlations: db.execute("INSERT INTO correlations VALUES(?,?,?,?,?)",(c.event_id,cid,c.type,c.confidence,json.dumps(c.to_dict())))
    for h in hypotheses: db.execute("INSERT INTO hypotheses VALUES(?,?,?,?,?)",(h.id,cid,h.assessment,h.confidence,json.dumps(h.to_dict())))
    db.execute("INSERT INTO audit_log(case_id,action,details) VALUES(?,?,?)",(cid,"analysis executed",f"Stored normalized artifacts and derived results")); db.commit()

