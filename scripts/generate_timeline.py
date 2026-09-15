import argparse, csv, json, sqlite3, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser(); p.add_argument("--case",required=True); p.add_argument("--db",type=Path,default=ROOT/"data/cases/insider_usb.db"); a=p.parse_args()
 db=sqlite3.connect(a.db); rows=[json.loads(r[0]) for r in db.execute("SELECT payload FROM artifacts WHERE case_id=? ORDER BY timestamp",(a.case,))]
 out=ROOT/"outputs/timeline_cli.csv"; out.parent.mkdir(exist_ok=True); fields=["timestamp","artifact_id","artifact_type","source","user","device","filename","action","confidence"]
 with out.open("w",newline="",encoding="utf-8") as f: w=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore"); w.writeheader(); w.writerows(rows)
 print(out)
if __name__=="__main__": main()

