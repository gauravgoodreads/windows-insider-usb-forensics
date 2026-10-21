from __future__ import annotations
import csv, json, re
from pathlib import Path
from html import escape
from forensic.models import Artifact, CorrelationEvent, Hypothesis

DISCLAIMER = "This system is an educational digital-forensics research platform operating on a controlled laboratory dataset. Findings represent an analytical interpretation of the supplied artifacts and should not be treated as a substitute for a validated forensic methodology in a real investigation."
LIMITATIONS = ["Simulated laboratory environment", "Artifact availability depends on Windows configuration", "Timestamp sources have different semantics and reliability", "USB presence alone does not establish transfer", "Correlation does not establish intent", "The experimental score is not a forensic standard"]

def _safe(value: str) -> str: return re.sub(r"[^A-Za-z0-9_.-]", "_", value)

def generate_reports(output_dir: str | Path, config: dict, artifacts: list[Artifact], timeline: list[dict], correlations: list[CorrelationEvent], hypotheses: list[Hypothesis], score: dict, evidence: dict | None = None) -> dict[str,str]:
    out=Path(output_dir); out.mkdir(parents=True,exist_ok=True); cid=_safe(config["project"]["case_id"])
    h3=next(h for h in hypotheses if h.id=="H3")
    conclusion=("The combination of device, filesystem, user-session, and application artifacts strongly supports the simulated data-transfer hypothesis." if h3.assessment=="SUPPORTED" else "The supplied artifacts do not fully support the simulated data-transfer hypothesis.") + " No single artifact independently establishes the complete transfer sequence."
    payload={"case":config["project"],"evidence_inventory":[evidence] if evidence else [],"artifacts":[a.to_dict() for a in artifacts],"timeline":timeline,"correlations":[c.to_dict() for c in correlations],"hypotheses":[h.to_dict() for h in hypotheses],"experimental_score":score,"conclusion":conclusion,"limitations":LIMITATIONS,"disclaimer":DISCLAIMER}
    json_path=out/f"{cid}_report.json"; json_path.write_text(json.dumps(payload,indent=2),encoding="utf-8")
    inventory=(f"- {evidence['evidence_id']} | {evidence['filename']} | SHA-256 `{evidence['sha256']}` | {evidence['size']} bytes\n- {evidence['notes']}" if evidence else "No evidence inventory record was supplied.")
    sections=[f"# {config['project']['name']}",f"**Case:** {cid}  \n**Investigator:** {config['project']['investigator']}","## Executive Summary",f"This controlled investigation evaluated device, filesystem, Registry/event, and user-activity observations. H3 is **{h3.assessment}** ({h3.confidence}). The assessment relies on corroboration rather than a single artifact.","## Investigation and Research Questions","Did employee01 copy confidential company data to an external USB device, when, which files, and what independent evidence supports the conclusion? Can Windows artifacts distinguish legitimate USB use from simulated insider leakage?","## Scope and Evidence Sources","Offline analysis of Windows 10/11 artifact exports: a controlled two-scenario dataset using fictional Example Corporation data, optionally complemented by read-only live triage of a real PC.","## Evidence Inventory",inventory+"\n\nRaw exports are preserved separately; normalized records retain their original payload and provenance identifiers.","## Acquisition Methodology and Hash Verification","The included demo hashes the synthetic export bundle for provenance. Real evidence is either collected read-only with the triage collector, which records a SHA-256 manifest, or acquired as a powered-off disk and USB image that is hashed, logged in custody and examined only as a verified copy.","## Artifact, USB, User, and Filesystem Analysis"]
    sections += [f"- {a.artifact_id}: {a.artifact_type} / {a.action} / {a.filename or a.device or 'n/a'} ({a.confidence})" for a in artifacts]
    sections += ["## Unified Timeline"]+[f"- {row['timestamp'] or 'unknown'} — {row['artifact']} — {row['interpretation']}" for row in timeline]
    sections += ["## Correlations"]+[f"- {c.event_id} {c.type} ({c.confidence}): {'; '.join(c.reasoning)}" for c in correlations]
    sections += ["## Hypothesis Evaluation"]+[f"### {h.id} — {h.assessment} ({h.confidence})\n"+"\n".join(f"- {r}" for r in h.reasoning) for h in hypotheses]
    sections += ["## Observation, Inference, Conclusion","**Observation:** Normalized artifact records describe device and file activity.\n\n**Inference:** Temporal relationships are consistent with the generated correlation events.\n\n**Conclusion:** "+conclusion,"## Experimental Score",f"Score: **{score['score']}**. This is an experimental project model and is NOT an established forensic standard.","## Limitations"]+[f"- {x}" for x in LIMITATIONS]+["## Appendix — Disclaimer",DISCLAIMER]
    md="\n\n".join(sections)+"\n"; md_path=out/f"{cid}_report.md"; md_path.write_text(md,encoding="utf-8")
    html_path=out/f"{cid}_report.html"; html_path.write_text("<!doctype html><meta charset='utf-8'><title>Forensic Report</title><style>body{font:16px system-ui;max-width:1100px;margin:auto;padding:40px;color:#172033}h1,h2{color:#164e63}pre{white-space:pre-wrap}</style><pre>"+escape(md)+"</pre>",encoding="utf-8")
    for name,rows in {"timeline":timeline,"artifacts":[a.to_dict() for a in artifacts],"findings":[h.to_dict() for h in hypotheses]}.items():
        path=out/f"{name}.csv"
        flat=[]
        for row in rows: flat.append({k:(json.dumps(v) if isinstance(v,(dict,list)) else v) for k,v in row.items()})
        with path.open("w",encoding="utf-8",newline="") as f:
            fields=sorted({k for row in flat for k in row}) if flat else ["empty"]; w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(flat)
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        pdf_path=out/f"{cid}_report.pdf"; c=canvas.Canvas(str(pdf_path),pagesize=A4,invariant=1); y=800
        for line in md.splitlines():
            for chunk in [line[i:i+95] for i in range(0,max(len(line),1),95)]:
                if y<45: c.showPage(); y=800
                c.drawString(40,y,chunk); y-=13
        c.save()
    except ImportError: pdf_path=None
    return {"json":str(json_path),"markdown":str(md_path),"html":str(html_path),"pdf":str(pdf_path) if pdf_path else "unavailable"}

