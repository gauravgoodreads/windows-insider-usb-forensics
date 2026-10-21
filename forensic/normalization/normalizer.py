from __future__ import annotations
from copy import deepcopy
from typing import Any
from forensic.models import Artifact, parse_time

def normalize_records(records: list[dict[str, Any]], config: dict[str, Any]) -> list[Artifact]:
    patterns = config["analysis"]["sensitive_patterns"]
    case_id = config["project"]["case_id"]
    seen: set[str] = set(); result: list[Artifact] = []
    for index, record in enumerate(records, 1):
        raw = deepcopy(record)
        artifact_id = str(record.get("artifact_id") or f"ART-{index:04d}")
        if artifact_id in seen: continue
        seen.add(artifact_id)
        path = str(record.get("path") or "")
        # A file name is only derived from filesystem paths; Registry keys (device records) have no file.
        filename = record.get("filename") or (None if path.upper().startswith(("HKLM", "HKEY")) else path.replace("\\", "/").rsplit("/", 1)[-1] or None)
        observed = [k for k, v in record.items() if v not in (None, "")]
        result.append(Artifact(
            artifact_id=artifact_id, case_id=str(record.get("case_id") or case_id),
            timestamp=parse_time(record.get("timestamp")), timestamp_type=str(record.get("timestamp_type") or "artifact_generated"),
            artifact_type=str(record.get("artifact_type") or record.get("type") or "filesystem").lower(),
            source=str(record.get("source") or "imported"), host=record.get("host") or record.get("computer"), user=record.get("user"),
            path=record.get("path"), filename=filename, action=record.get("action"), device=record.get("device") or record.get("volume_label"),
            confidence=str(record.get("confidence") or "MEDIUM").upper(), description=str(record.get("description") or record.get("message") or ""),
            experiment=record.get("experiment"), classification=patterns.get(filename, "NORMAL"), observed_fields=observed,
            inferred_fields=["classification"] if filename in patterns else [], raw=raw, derived_from=[artifact_id]))
    return result

