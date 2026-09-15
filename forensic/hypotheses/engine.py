from __future__ import annotations
from forensic.models import Artifact, CorrelationEvent, Hypothesis

def evaluate_hypotheses(artifacts: list[Artifact], correlations: list[CorrelationEvent], username: str) -> list[Hypothesis]:
    usb = [a for a in artifacts if a.artifact_type == "usb" and a.action == "connected"]
    sensitive = [a for a in artifacts if a.classification != "NORMAL" and a.user == username]
    transfer = [c for c in correlations if c.type == "POSSIBLE_TRANSFER_SESSION"]
    conceal = [a for a in artifacts if a.action in {"deleted", "renamed"}]
    def assessment(items: list, strong: bool = False): return ("SUPPORTED", "HIGH" if strong else "MEDIUM") if items else ("NOT_SUPPORTED", "LOW")
    h1a,h1c=assessment(usb, True); h2a,h2c=assessment(sensitive)
    h3a,h3c=assessment([c for c in transfer if c.confidence=="HIGH"], True)
    if transfer and h3a == "NOT_SUPPORTED": h3a,h3c="PARTIALLY_SUPPORTED","MEDIUM"
    h4a,h4c=assessment(conceal); h4a = "PARTIALLY_SUPPORTED" if conceal else h4a
    return [
      Hypothesis("H1","Removable media was connected","Whether removable storage was present.",[a.artifact_id for a in usb],[],h1a,h1c,["USB connection artifacts support device presence"] if usb else ["No USB connection artifact was supplied"]),
      Hypothesis("H2",f"{username} accessed confidential company files","Whether the configured user interacted with classified files.",[a.artifact_id for a in sensitive],[],h2a,h2c,["User-associated sensitive-file artifacts were observed"] if sensitive else ["No matching user/file artifact was supplied"]),
      Hypothesis("H3","Confidential files were transferred to removable media","Requires corroborated temporal and destination evidence.",sorted({x for c in transfer for x in c.related_artifacts}),[],h3a,h3c,[r for c in transfer for r in c.reasoning] or ["USB presence alone is insufficient; no qualifying transfer correlation was found"]),
      Hypothesis("H4","The user attempted concealment","Rename/deletion/archive indicators are interpreted cautiously.",[a.artifact_id for a in conceal],[],h4a,h4c,(["Rename or deletion activity is consistent with possible concealment","Artifact presence alone does not establish malicious intent"] if conceal else ["No deletion or rename evidence was supplied"])),
    ]

