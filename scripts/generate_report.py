import argparse, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT))
from forensic.pipeline import run
def main():
 p=argparse.ArgumentParser(); p.add_argument("--case",default="INSIDER-USB-001"); p.add_argument("--input",type=Path,default=ROOT/"data/sample"); a=p.parse_args(); print(run(a.input)["reports"])
if __name__=="__main__": main()

