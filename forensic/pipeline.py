from __future__ import annotations
from pathlib import Path
from forensic.config import ROOT, load_yaml, project_config
from forensic.ingestion import ingest_path
from forensic.normalization import normalize_records
from forensic.correlation import correlate
from forensic.timeline import build_timeline
from forensic.hypotheses import evaluate_hypotheses
from forensic.scoring import calculate_score
from forensic.reporting import generate_reports
from forensic.database import connect, populate

def run(input_path: str | Path, output_dir: str | Path = ROOT/"outputs", db_path: str | Path = ROOT/"data"/"cases"/"insider_usb.db") -> dict:
    config=project_config(); raw=ingest_path(input_path); artifacts=normalize_records(raw,config)
    correlations=correlate(artifacts,int(config["analysis"]["correlation_window_minutes"])); timeline=build_timeline(artifacts)
    hypotheses=evaluate_hypotheses(artifacts,correlations,config["victim"]["username"])
    rules=load_yaml(ROOT/"config"/"scoring.yaml")["rules"]; score=calculate_score(artifacts,correlations,rules)
    with connect(db_path) as db: populate(db,config,artifacts,correlations,hypotheses)
    reports=generate_reports(output_dir,config,artifacts,timeline,correlations,hypotheses,score)
    return {"raw_count":len(raw),"artifact_count":len(artifacts),"correlations":correlations,"timeline":timeline,"hypotheses":hypotheses,"score":score,"reports":reports}

