from __future__ import annotations
import csv, json
from pathlib import Path
from typing import Any

class IngestionError(ValueError): pass

def load_json(path: Path) -> list[dict[str, Any]]:
    try:
        with path.open(encoding="utf-8-sig") as handle: data = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc: raise IngestionError(f"Invalid JSON {path}: {exc}") from exc
    if isinstance(data, dict): data = data.get("artifacts", [data])
    if not isinstance(data, list) or not all(isinstance(x, dict) for x in data): raise IngestionError(f"Expected JSON artifact list: {path}")
    return data

def load_csv(path: Path) -> list[dict[str, Any]]:
    try:
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames: raise IngestionError(f"CSV has no header: {path}")
            return [dict(row) for row in reader]
    except (OSError, csv.Error) as exc: raise IngestionError(f"Invalid CSV {path}: {exc}") from exc

def ingest_path(path: str | Path) -> list[dict[str, Any]]:
    target = Path(path).resolve()
    if not target.exists(): raise IngestionError(f"Input does not exist: {target}")
    files = sorted(target.glob("*.json")) + sorted(target.glob("*.csv")) if target.is_dir() else [target]
    records: list[dict[str, Any]] = []
    for file in files:
        if file.suffix.lower() == ".json": records.extend(load_json(file))
        elif file.suffix.lower() == ".csv": records.extend(load_csv(file))
        else: raise IngestionError(f"Unsupported input type: {file.suffix}")
    return records

