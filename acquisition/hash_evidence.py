from __future__ import annotations
import argparse, hashlib, json
from datetime import datetime, timezone
from pathlib import Path
def hashes(path: Path) -> dict:
 sha=hashlib.sha256(); md5=hashlib.md5(usedforsecurity=False)
 with path.open("rb") as f:
  for block in iter(lambda:f.read(1024*1024),b""): sha.update(block); md5.update(block)
 return {"original_filename":path.name,"file_size":path.stat().st_size,"sha256":sha.hexdigest(),"md5":md5.hexdigest()}
def main():
 p=argparse.ArgumentParser(); p.add_argument("file",type=Path); p.add_argument("--evidence-id",required=True); p.add_argument("--examiner",default="Student Investigator"); p.add_argument("--source",default="CORP-PC01"); p.add_argument("--output",type=Path); a=p.parse_args()
 record={"evidence_id":a.evidence_id,"acquisition_timestamp":datetime.now(timezone.utc).isoformat(),"image_format":a.file.suffix.lstrip(".") or "raw","examiner":a.examiner,"source_system":a.source,"notes":"Student laboratory evidence record",**hashes(a.file)}
 target=a.output or a.file.with_suffix(a.file.suffix+".manifest.json"); target.write_text(json.dumps(record,indent=2),encoding="utf-8"); print(target)
if __name__=="__main__": main()

