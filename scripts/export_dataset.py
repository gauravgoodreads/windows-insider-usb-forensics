import argparse, csv, json, sqlite3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser(); p.add_argument("--case",required=True); p.add_argument("--db",type=Path,default=ROOT/"data/cases/insider_usb.db"); a=p.parse_args(); out=ROOT/"outputs"/f"{a.case}_dataset.csv"; out.parent.mkdir(exist_ok=True)
 db=sqlite3.connect(a.db); values=[]
 for (payload,) in db.execute("SELECT payload FROM artifacts WHERE case_id=?",(a.case,)):
  x=json.loads(payload); values.append({k:x.get(k) for k in ("experiment","artifact_type","timestamp","user","device","classification","action")})
 with out.open("w",newline="",encoding="utf-8") as f: w=csv.DictWriter(f,fieldnames=list(values[0]) if values else ["empty"]); w.writeheader(); w.writerows(values)
 print(out)
if __name__=="__main__": main()

