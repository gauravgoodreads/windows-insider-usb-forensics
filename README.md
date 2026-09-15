# Forensic Investigation of Simulated Insider Data Exfiltration via Removable USB Storage on Windows

An offline, evidence-driven university research platform for asking whether Windows disk, Registry, event-log, filesystem, and user-activity artifacts can distinguish normal removable-storage use from a controlled simulated insider transfer. It never assumes the answer: raw exports are normalized, correlated, traced through provenance, and evaluated against four explicit hypotheses.

> This system is an educational digital-forensics research platform operating on a controlled laboratory dataset. Findings represent an analytical interpretation of the supplied artifacts and should not be treated as a substitute for a validated forensic methodology in a real investigation.

## Architecture and features

`raw evidence → parsed representation → normalized artifact → correlation → hypotheses → timeline/report/dashboard`

- JSON/CSV/Autopsy-style export ingestion with raw-payload preservation
- common timestamp-aware artifact model, sensitive-file classification, USB null handling
- Experiment A/B-aware correlation with configurable 5–60 minute windows and false-positive controls
- explainable H1–H4 assessments, provenance, and clearly labelled experimental score
- SQLite case store and investigator-tool audit log
- searchable dark dashboard, artifact raw/normalized detail, file/device views, REST read APIs
- Markdown, HTML, JSON, PDF, CSV, and research-dataset exports
- SHA-256/MD5 manifest verification and chain-of-custody utility
- controlled PowerShell laboratory scripts and safe synthetic demo data

## Install and demonstrate

```powershell
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python scripts/validate_project.py
python scripts/run_pipeline.py --demo
python dashboard/app.py
```

Open `http://127.0.0.1:5000`. Core analysis has no cloud, telemetry, secrets, or external-service dependency. Use `python scripts/run_pipeline.py --input C:\path\to\read-only-exports` for JSON/CSV exports.

## Windows laboratory and acquisition

Use an isolated disposable VM, create `employee01`, attach only a designated virtual/lab USB, run `simulator/create_company_data.ps1`, snapshot `BASELINE`, and branch snapshots for Experiment A and B. Do not use production systems or real confidential data. The scripts perform ordinary local operations and produce OS artifacts naturally; their human logs are simulation metadata, not proof.

Acquire the stopped VM disk with a validated tool, hash the image using `python acquisition/hash_evidence.py IMAGE --evidence-id EVD-001`, and analyze a verified copy. From Autopsy/other tools export tabular or JSON records covering file listings (source and USB volume), USBSTOR/MountedDevices/MountPoints2, EVTX-derived events, LNK/Jump Lists, Office recent documents, Prefetch, Recycle Bin, Shellbags, and user sessions. Map fields to the documented normalized names and feed their directory to `--input`.

## Methodology, conclusions, and limitations

The engine distinguishes observations from inferences and conclusions. USB presence can support H1 but cannot alone support H3. H3 needs sensitive activity within the device window and becomes high-confidence only with user-session and destination-side corroboration. H4 remains cautious because deletion, rename, or archive presence does not establish intent. Confidence is an ordinal project assessment—not probability—and scoring is not a forensic standard.

See [architecture](docs/architecture.md), [methodology](docs/methodology.md), [lab setup](docs/lab-setup.md), [acquisition](docs/evidence-acquisition.md), [artifacts](docs/artifact-reference.md), [protocol](docs/experiment-protocol.md), [custody](docs/chain-of-custody.md), [limitations](docs/limitations.md), and the [viva guide](docs/viva-guide.md).

## Tests and commands

```powershell
python -m pytest -q
python scripts/generate_timeline.py --case INSIDER-USB-001
python scripts/generate_report.py --case INSIDER-USB-001
python scripts/export_dataset.py --case INSIDER-USB-001
```

Generated outputs go to `outputs/`; the populated demo database is `data/cases/insider_usb.db`.

