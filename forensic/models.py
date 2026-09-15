from __future__ import annotations
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any

def parse_time(value: str | datetime | None) -> datetime | None:
    if value is None or value == "": return None
    if isinstance(value, datetime): return value
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))

@dataclass(slots=True)
class Artifact:
    artifact_id: str
    case_id: str
    timestamp: datetime | None
    timestamp_type: str
    artifact_type: str
    source: str
    host: str | None = None
    user: str | None = None
    path: str | None = None
    filename: str | None = None
    action: str | None = None
    device: str | None = None
    confidence: str = "MEDIUM"
    description: str = ""
    experiment: str | None = None
    classification: str = "NORMAL"
    observed_fields: list[str] = field(default_factory=list)
    inferred_fields: list[str] = field(default_factory=list)
    raw: dict[str, Any] = field(default_factory=dict)
    derived_from: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat() if self.timestamp else None
        return data

@dataclass(slots=True)
class CorrelationEvent:
    event_id: str
    type: str
    start_time: datetime | None
    end_time: datetime | None
    related_artifacts: list[str]
    user: str | None
    device: str | None
    files: list[str]
    confidence: str
    reasoning: list[str]
    experiment: str | None = None
    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["start_time"] = self.start_time.isoformat() if self.start_time else None
        data["end_time"] = self.end_time.isoformat() if self.end_time else None
        return data

@dataclass(slots=True)
class Hypothesis:
    id: str
    title: str
    description: str
    supporting_artifacts: list[str]
    contradicting_artifacts: list[str]
    assessment: str
    confidence: str
    reasoning: list[str]
    def to_dict(self) -> dict[str, Any]: return asdict(self)

