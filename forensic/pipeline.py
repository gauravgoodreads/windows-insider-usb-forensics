from __future__ import annotations
from pathlib import Path
from datetime import datetime, timezone
import hashlib
from forensic.config import ROOT, load_yaml, project_config
from forensic.ingestion import ingest_path
from forensic.normalization import normalize_records
from forensic.correlation import correlate
from forensic.timeline import build_timeline
from forensic.hypotheses import evaluate_hypotheses
from forensic.scoring import calculate_score
from forensic.reporting import generate_reports
from forensic.database import connect, populate

def describe_evidence_bundle(input_path: str | Path) -> dict:
    """Hash the imported export bundle without modifying its source files."""
    target=Path(input_path).resolve()
    files=sorted([p for p in (target.iterdir() if target.is_dir() else [target]) if p.suffix.lower() in {".json",".csv"}],key=lambda p:p.name)
    digest=hashlib.sha256(); size=0
    for path in files:
        content=path.read_bytes(); digest.update(path.name.encode("utf-8")); digest.update(b"\0"); digest.update(content); size+=len(content)
    is_demo=target == (ROOT/"data"/"sample").resolve()
    recorded_at="2026-09-15T08:55:00+05:30" if is_demo else datetime.now(timezone.utc).isoformat()
    return {"evidence_id":"EVD-DEMO-001" if is_demo else "EVD-EXPORT-001","filename":target.name+" (artifact export bundle)","sha256":digest.hexdigest(),"size":size,"recorded_at":recorded_at,"notes":("Synthetic demonstration export bundle; not an acquired disk image and not real case evidence." if is_demo else "Imported artifact export bundle; original source files preserved and hashed for analysis provenance.")}

def run(input_path: str | Path, output_dir: str | Path = ROOT/"outputs", db_path: str | Path = ROOT/"data"/"cases"/"insider_usb.db", username: str | None = None) -> dict:
    config=project_config(); evidence=describe_evidence_bundle(input_path); raw=ingest_path(input_path); artifacts=normalize_records(raw,config)
    correlations=correlate(artifacts,int(config["analysis"]["correlation_window_minutes"])); timeline=build_timeline(artifacts)
    hypotheses=evaluate_hypotheses(artifacts,correlations,username or config["victim"]["username"])
    rules=load_yaml(ROOT/"config"/"scoring.yaml")["rules"]; score=calculate_score(artifacts,correlations,rules)
    with connect(db_path) as db: populate(db,config,artifacts,correlations,hypotheses,evidence)
    reports=generate_reports(output_dir,config,artifacts,timeline,correlations,hypotheses,score,evidence)
    return {"raw_count":len(raw),"artifact_count":len(artifacts),"evidence":evidence,"correlations":correlations,"timeline":timeline,"hypotheses":hypotheses,"score":score,"reports":reports}

