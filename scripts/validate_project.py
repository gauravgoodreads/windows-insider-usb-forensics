from __future__ import annotations
import json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT))
from jsonschema import validate
from forensic.config import project_config
from forensic.pipeline import run

def main() -> int:
 checks=[]
 def check(name,fn):
  try: fn(); checks.append((name,True,"")); print(f"[PASS] {name}")
  except Exception as e: checks.append((name,False,str(e))); print(f"[FAIL] {name}: {e}")
 check("Python version",lambda: (_ for _ in ()).throw(RuntimeError("Python 3.11+ required")) if sys.version_info<(3,11) else None)
 check("Configuration",lambda: project_config()["project"]["case_id"])
 holder={}
 def demo():
  temp=Path(tempfile.mkdtemp(prefix="usb-forensics-validation-")); holder["r"]=run(ROOT/"data/sample",temp,temp/"case.db")
 check("Database and sample artifacts",demo)
 check("Evidence inventory and custody",lambda: (_ for _ in ()).throw(RuntimeError("evidence bundle missing")) if not holder["r"].get("evidence",{}).get("sha256") else None)
 check("Normalization",lambda: (_ for _ in ()).throw(RuntimeError("no artifacts")) if holder["r"]["artifact_count"]<10 else None)
 check("Correlation",lambda: (_ for _ in ()).throw(RuntimeError("no transfer correlation")) if not any(c.type=="POSSIBLE_TRANSFER_SESSION" for c in holder["r"]["correlations"]) else None)
 check("Hypotheses",lambda: (_ for _ in ()).throw(RuntimeError("H3 not supported")) if next(h for h in holder["r"]["hypotheses"] if h.id=="H3").assessment!="SUPPORTED" else None)
 check("Timeline",lambda: (_ for _ in ()).throw(RuntimeError("timeline empty")) if not holder["r"]["timeline"] else None)
 def schema():
  s=json.loads((ROOT/"schemas/artifact.schema.json").read_text()); validate(holder["r"]["timeline"] and json.loads((Path(holder["r"]["reports"]["json"])).read_text())["artifacts"][0],s)
 check("Schema validity",schema)
 check("Report generation",lambda: [(_ for _ in ()).throw(RuntimeError(f"missing {p}")) for p in holder["r"]["reports"].values() if p!="unavailable" and not Path(p).exists()])
 def tests():
  result=subprocess.run([sys.executable,"-m","pytest","-q"],cwd=ROOT,capture_output=True,text=True); assert result.returncode==0,result.stdout+result.stderr
 check("Tests",tests); return 0 if all(ok for _,ok,_ in checks) else 1
if __name__=="__main__": raise SystemExit(main())

