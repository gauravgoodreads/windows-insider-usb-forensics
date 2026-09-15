"""Chain-of-custody JSON helper for student laboratory evidence."""
import argparse, json
from datetime import datetime, timezone
from pathlib import Path
def main():
 p=argparse.ArgumentParser(); p.add_argument("manifest",type=Path); p.add_argument("--action",required=True); p.add_argument("--person",required=True); p.add_argument("--source",default="laboratory VM"); p.add_argument("--destination",default="forensic workstation"); p.add_argument("--notes",default="Student laboratory chain-of-custody record"); a=p.parse_args()
 data=json.loads(a.manifest.read_text(encoding="utf-8")); data.setdefault("chain_of_custody",[]).append({"timestamp":datetime.now(timezone.utc).isoformat(),"action":a.action,"person":a.person,"evidence_id":data["evidence_id"],"source":a.source,"destination":a.destination,"hash":data["sha256"],"notes":a.notes}); a.manifest.write_text(json.dumps(data,indent=2),encoding="utf-8")
if __name__=="__main__": main()

