import argparse, json
from pathlib import Path
from hash_evidence import hashes
def main():
 p=argparse.ArgumentParser(); p.add_argument("file",type=Path); p.add_argument("manifest",type=Path); a=p.parse_args(); expected=json.loads(a.manifest.read_text(encoding="utf-8")); actual=hashes(a.file)
 ok=actual["sha256"].lower()==expected["sha256"].lower(); print("VERIFIED" if ok else "MISMATCH"); raise SystemExit(0 if ok else 1)
if __name__=="__main__": main()

