# Architecture

Evidence reaches the platform as exported records from one of three sources: the controlled scenario dataset, the read-only live triage collector run on a real Windows PC, or exports produced by forensic tools from a hashed disk image. No virtual machine is required. The correlation engine never depends on how the records were produced; it only needs the documented fields.

```text
scenario dataset | live triage collector | tool exports from a hashed image
  → evidence bundle hash + custody record → ingestion → normalization
  → correlation → H1–H4 evaluation → SQLite → dashboard / API / reports / CSV
```

Trust boundaries are deliberate. Scenario scripts and collection metadata describe how evidence was produced and are never treated as proof. Preservation (hashing and custody) is kept separate from analysis, and the presentation layer shows only stored, reproducible results with artifact IDs and raw payloads.

The `--demo` mode uses the scenario dataset. The full pipeline operates on any user-supplied export directory through `--input`; integrity manifests (`*manifest.json`) in that directory are recorded but not ingested as evidence.
