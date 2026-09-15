from __future__ import annotations
from forensic.models import Artifact

def build_timeline(artifacts: list[Artifact]) -> list[dict]:
    ordered = sorted(artifacts, key=lambda a: (a.timestamp is None, a.timestamp or 0, a.artifact_id))
    return [{
        "timestamp": a.timestamp.isoformat() if a.timestamp else None, "artifact": a.artifact_id,
        "source": a.source, "type": a.artifact_type, "user": a.user, "device": a.device,
        "file": a.filename, "action": a.action, "timestamp_type": a.timestamp_type,
        "interpretation": a.description, "confidence": a.confidence, "experiment": a.experiment,
    } for a in ordered]

