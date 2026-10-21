from forensic.models import Artifact, CorrelationEvent

def on_removable_media(a) -> bool:
    """Destination-side record: a file path on the lab USB (E:) or on any volume tagged with a removable device."""
    path = (a.path or "").upper()
    return bool(path) and (path.startswith("E:\\") or (bool(a.device) and not path.startswith(("C:\\", "HKLM", "HKEY"))))

def calculate_score(artifacts: list[Artifact], correlations: list[CorrelationEvent], rules: dict[str, int]) -> dict:
    observed = {
      "usb_connection": any(a.artifact_type=="usb" and a.action=="connected" for a in artifacts),
      "sensitive_file_access": any(a.classification!="NORMAL" and a.action=="accessed" for a in artifacts),
      "archive_creation": any(a.artifact_type=="archive" or a.action=="archived" for a in artifacts),
      "deleted_sensitive_file": any(a.classification!="NORMAL" and a.action=="deleted" for a in artifacts),
      "matching_destination_file": any(a.classification!="NORMAL" and a.action in {"copied","created"} and on_removable_media(a) for a in artifacts),
      "user_session_correlation": any(c.type=="POSSIBLE_TRANSFER_SESSION" and c.user for c in correlations),
    }
    applied = {name: rules.get(name,0) for name, yes in observed.items() if yes}
    return {"score": sum(applied.values()), "observed": observed, "applied_rules": applied}

