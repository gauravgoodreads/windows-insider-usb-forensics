from __future__ import annotations
import argparse, json, logging, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT))
from forensic.pipeline import run

def main() -> int:
    parser=argparse.ArgumentParser(description="Run the offline USB forensic analysis pipeline")
    parser.add_argument("--input",type=Path); parser.add_argument("--demo",action="store_true"); parser.add_argument("--sample",action="store_true")
    parser.add_argument("--output",type=Path,default=ROOT/"outputs")
    parser.add_argument("--db",type=Path,default=ROOT/"data"/"cases"/"insider_usb.db",help="case database to write (the dashboard reads FORENSICS_DB)")
    parser.add_argument("--user",help="Windows account under examination (defaults to victim.username in config/project.yaml)")
    args=parser.parse_args(); source=ROOT/"data"/"sample" if args.demo or args.sample else args.input
    if source is None: parser.error("provide --input PATH or --demo")
    logging.basicConfig(level=logging.INFO,format="%(levelname)s %(message)s"); logging.info("Loading case")
    result=run(source,args.output,args.db,args.user); logging.info("Ingested %d raw records",result["raw_count"]); logging.info("Normalized %d artifacts",result["artifact_count"])
    logging.info("Generated %d correlations",len(result["correlations"])); logging.info("Evaluated %d hypotheses",len(result["hypotheses"])); logging.info("Generated report")
    print(json.dumps({"artifacts":result["artifact_count"],"correlations":len(result["correlations"]),"hypotheses":{h.id:h.assessment for h in result["hypotheses"]},"score":result["score"]["score"],"reports":result["reports"]},indent=2)); return 0
if __name__=="__main__": raise SystemExit(main())

