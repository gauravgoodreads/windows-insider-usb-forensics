import json
from pathlib import Path
import pytest
from forensic.config import project_config, ROOT
from forensic.ingestion import load_json, load_csv
from forensic.ingestion.loaders import IngestionError
from forensic.normalization import normalize_records
from forensic.correlation import correlate
from forensic.hypotheses import evaluate_hypotheses
from forensic.timeline import build_timeline
from forensic.scoring import calculate_score
from forensic.parsers import normalize_usb_fields
from forensic.reporting import generate_reports

def records():
 data=[]
 for p in (ROOT/"data/sample").glob("*_artifacts.json"): data.extend(load_json(p))
 return data
def artifacts(): return normalize_records(records(),project_config())
def test_json_and_csv_ingestion(tmp_path):
 p=tmp_path/"a.csv"; p.write_text("artifact_id,artifact_type\nX,usb\n",encoding="utf-8"); assert load_csv(p)[0]["artifact_id"]=="X"; assert len(records())==13
def test_invalid_json(tmp_path):
 p=tmp_path/"bad.json"; p.write_text("{",encoding="utf-8");
 with pytest.raises(IngestionError): load_json(p)
def test_normalization_deduplicates_and_preserves_raw():
 r=records(); result=normalize_records(r+[r[0]],project_config()); assert len(result)==13; assert result[0].raw; assert result[0].derived_from
def test_missing_values_and_usb_nulls():
 a=normalize_records([{"artifact_id":"X","artifact_type":"usb","source":"USBSTOR"}],project_config())[0]; assert a.timestamp is None and a.user is None
 u=normalize_usb_fields({"volume_label":"LAB"}); assert u["serial_number"] is None and "serial_number" in u["unavailable"]
def test_timeline_orders_unknown_last():
 a=artifacts(); a.append(normalize_records([{"artifact_id":"Z","source":"x"}],project_config())[0]); assert build_timeline(a)[-1]["timestamp"] is None
def test_correlation_false_positive_and_transfer():
 a=artifacts(); c=correlate(a,20); assert any(x.type=="POSSIBLE_TRANSFER_SESSION" and x.experiment=="EXP-B" for x in c); assert not any(x.type=="POSSIBLE_TRANSFER_SESSION" and x.experiment=="EXP-A" for x in c)
def test_hypotheses_and_score():
 a=artifacts(); c=correlate(a); h=evaluate_hypotheses(a,c,"employee01"); assert next(x for x in h if x.id=="H3").assessment=="SUPPORTED"; assert calculate_score(a,c,{"usb_connection":2,"sensitive_file_access":2,"archive_creation":2,"deleted_sensitive_file":2,"matching_destination_file":3,"user_session_correlation":2})["score"]==13
def test_empty_case():
 c=correlate([]); h=evaluate_hypotheses([],c,"employee01"); assert all(x.assessment=="NOT_SUPPORTED" for x in h)
def test_reporting(tmp_path):
 a=artifacts(); c=correlate(a); h=evaluate_hypotheses(a,c,"employee01"); paths=generate_reports(tmp_path,project_config(),a,build_timeline(a),c,h,{"score":1}); text=Path(paths["markdown"]).read_text(); assert "Executive Summary" in text and "Limitations" in text and "No single artifact" in text

def test_collector_and_launcher_exist():
 assert (ROOT/"collector/collect_usb_artifacts.ps1").exists() and (ROOT/"start_demo.ps1").exists()

def test_collector_output_ingests_and_skips_manifest(tmp_path):
 from forensic.ingestion import ingest_path
 live=[{"artifact_id":"META-LIVE","artifact_type":"simulation_metadata","experiment":"LIVE"},
  {"artifact_id":"L-0001","timestamp":"2026-10-21T19:20:00+05:30","artifact_type":"usb","action":"connected","device":"SanDisk Ultra USB Device","path":"HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR\\Disk","experiment":"LIVE"},
  {"artifact_id":"L-0002","timestamp":"2026-10-21T19:25:00+05:30","artifact_type":"filesystem","action":"created","device":"KINGSTON","path":"F:\\Reports\\Customer_Database.csv","experiment":"LIVE"}]
 (tmp_path/"collected_LIVE.json").write_text(json.dumps(live),encoding="utf-8")
 (tmp_path/"collected_LIVE-manifest.json").write_text(json.dumps({"sha256":"x","records":2}),encoding="utf-8")
 a=normalize_records(ingest_path(tmp_path),project_config()); assert [x.artifact_id for x in a]==["META-LIVE","L-0001","L-0002"]
 assert a[2].classification=="HIGHLY_SENSITIVE" and calculate_score(a,correlate(a),{"matching_destination_file":3})["observed"]["matching_destination_file"]

