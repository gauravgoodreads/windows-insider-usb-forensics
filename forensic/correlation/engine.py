from __future__ import annotations
from datetime import timedelta
from forensic.models import Artifact, CorrelationEvent

def _event(kind: str, number: int, items: list[Artifact], reasons: list[str], confidence: str, experiment: str | None) -> CorrelationEvent:
    dated = [a.timestamp for a in items if a.timestamp]
    return CorrelationEvent(f"CORR-{number:03d}", kind, min(dated) if dated else None, max(dated) if dated else None,
        [a.artifact_id for a in items], next((a.user for a in items if a.user), None), next((a.device for a in items if a.device), None),
        sorted({a.filename for a in items if a.filename and a.classification != "NORMAL"}), confidence, reasons, experiment)

def correlate(artifacts: list[Artifact], window_minutes: int = 20) -> list[CorrelationEvent]:
    events: list[CorrelationEvent] = []; number = 1
    experiments = sorted({a.experiment for a in artifacts}, key=lambda x: str(x)) or [None]
    for experiment in experiments:
        group = [a for a in artifacts if a.experiment == experiment]
        connects = [a for a in group if a.artifact_type == "usb" and a.action == "connected"]
        disconnects = [a for a in group if a.artifact_type == "usb" and a.action == "disconnected"]
        sessions = [a for a in group if a.artifact_type == "user_session"]
        sensitive = [a for a in group if a.classification != "NORMAL" and a.action in {"accessed", "copied", "created", "modified", "deleted", "renamed"}]
        archives = [a for a in group if a.artifact_type == "archive" or a.action == "archived"]
        conceal = [a for a in group if a.action in {"deleted", "renamed"}]
        if sessions:
            events.append(_event("USER_SESSION", number, sessions, ["User-session artifact observed"], "MEDIUM", experiment)); number += 1
        for connect in connects:
            close = [connect] + [d for d in disconnects if not connect.timestamp or not d.timestamp or d.timestamp >= connect.timestamp]
            reasons = ["Removable-device connection artifact observed", "Disconnect artifact observed; session has a start and an end" if len(close)>1 else "No disconnect artifact; session end is unknown"]
            events.append(_event("USB_SESSION", number, close[:2], reasons, "HIGH" if len(close)>1 else "MEDIUM", experiment)); number += 1
            if connect.timestamp:
                nearby = [a for a in sensitive if a.timestamp and abs(a.timestamp-connect.timestamp) <= timedelta(minutes=window_minutes)]
            else: nearby = []
            destinations = [a for a in nearby if a.action in {"copied", "created"} and a.path and (a.path.upper().startswith("E:\\") or a.device)]
            if nearby:
                items = [connect] + nearby + archives + sessions[:1]
                reasons = ["USB device activity observed", "Sensitive-file activity occurred within the configured time window"]
                if sessions: reasons.append("Employee user-session artifact corroborates temporal association")
                if destinations: reasons.append("Destination-side file artifact was observed on removable media")
                if archives: reasons.append("Archive activity occurred in the same experiment")
                confidence = "HIGH" if destinations and sessions else "MEDIUM"
                events.append(_event("POSSIBLE_TRANSFER_SESSION", number, items, reasons, confidence, experiment)); number += 1
        if sensitive:
            events.append(_event("SENSITIVE_FILE_ACTIVITY", number, sensitive, ["Project-classified sensitive files have activity artifacts"], "MEDIUM", experiment)); number += 1
        if archives:
            events.append(_event("ARCHIVE_ACTIVITY", number, archives, ["Archive creation artifact observed; intent is not established"], "MEDIUM", experiment)); number += 1
        if conceal:
            events.append(_event("POSSIBLE_CONCEALMENT", number, conceal, ["Rename or deletion artifact observed", "Artifact presence alone does not establish malicious intent"], "LOW", experiment)); number += 1
    return events

