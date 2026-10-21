# USB Insider Forensics: Detecting Data Exfiltration via Removable Media on Windows

An offline, evidence-driven university research platform for asking whether Windows disk, Registry, event-log, filesystem, and user-activity artifacts can distinguish normal removable-storage use from a controlled simulated insider transfer. It never assumes the answer: raw exports are normalized, correlated, traced through provenance, and evaluated against four explicit hypotheses.

> This system is an educational digital-forensics research platform operating on a controlled laboratory dataset. Findings represent an analytical interpretation of the supplied artifacts and should not be treated as a substitute for a validated forensic methodology in a real investigation.

## Architecture and features

`raw evidence → parsed representation → normalized artifact → correlation → hypotheses → timeline/report/dashboard`

- JSON/CSV/Autopsy-style export ingestion with raw-payload preservation
- common timestamp-aware artifact model, sensitive-file classification, USB null handling
- Experiment A/B-aware correlation with configurable 5–60 minute windows and false-positive controls
- explainable H1–H4 assessments, provenance, and clearly labelled experimental score
- SQLite case store and investigator-tool audit log
- React dashboard (shadcn/ui + ReUI on Base UI) with an artifact data grid, raw/normalized evidence drawer, timelines, file/device views, light and dark themes, and REST read APIs; the server-rendered pages remain as a fallback when no build is present
- Markdown, HTML, JSON, PDF, CSV, and research-dataset exports
- SHA-256/MD5 manifest verification and chain-of-custody utility
- read-only live triage collector for real Windows PCs, scenario scripts, and safe synthetic demo data (no virtual machine required)

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

After the first installation, the easiest classroom launch is `./start_demo.ps1`. It validates the project, regenerates the demo analysis, and starts the local-only dashboard. Keep that PowerShell window open and press `Ctrl+C` once after the presentation.

The dashboard frontend lives in `frontend/` and is prebuilt into `dashboard/static/app`, so presenting needs only Python. Flask serves it on every page URL and reads all data from `/api/dashboard`. To change the frontend, install Node.js 20+ and run:

```powershell
cd frontend
npm install
npm run dev     # http://localhost:5173, proxies /api to the Flask server on port 5000
npm run build   # rewrites dashboard/static/app
```

## Evidence sources

The project needs no virtual machine. It analyses evidence from three interchangeable sources, all in the same JSON/CSV export format:

1. **Controlled scenario dataset** (`data/sample/`). Two scenarios on fictional workstation `CORP-PC01`: Experiment A, a normal USB backup, and Experiment B, a simulated insider copying fictional sensitive files. Records are modelled on real Windows artifact exports and are clearly labelled synthetic. This is the default demo (`--demo`).
2. **Live triage of a real Windows PC** (`collector/collect_usb_artifacts.ps1`). A read-only PowerShell collector that runs as a normal user and exports real USB device history, removable-volume file listings, recent-item shortcuts (LNK), Recycle Bin `$I` records and logon events, plus a SHA-256 manifest:

   ```powershell
   .\collector\collect_usb_artifacts.ps1 -OutputDir C:\Evidence\triage-001 -SinceDays 14
   python scripts\run_pipeline.py --input C:\Evidence\triage-001
   python scripts\run_pipeline.py --demo      # switch the dashboard back to the scenario dataset
   ```

3. **Exports from forensic tools** such as Autopsy or Eric Zimmerman's tools, taken from a hashed, powered-off disk image: file listings, USBSTOR/MountedDevices, EVTX events, LNK/Jump Lists, Office recent documents, Prefetch, Recycle Bin, Shellbags and user sessions. Map the fields to the documented normalized names and pass the folder to `--input`. Hash images with `python acquisition/hash_evidence.py IMAGE --evidence-id EVD-001` and always analyse a verified copy.

`simulator/` holds the scenario scripts that define Experiments A and B. They were run for real on the project laptop with an external USB disk and only fictional data; that evidence is in `evidence/real-run/` and reproduces the designed result (a HIGH-confidence transfer for B, none for A). Show it with `.\start_demo.ps1 -Dataset real`. The steps to repeat the run are in [the handoff](docs/PROJECT_HANDOFF.md#repeating-the-real-run).

## Methodology, conclusions, and limitations

The engine distinguishes observations from inferences and conclusions. USB presence can support H1 but cannot alone support H3. H3 needs sensitive activity within the device window and becomes high-confidence only with user-session and destination-side corroboration. H4 remains cautious because deletion, rename, or archive presence does not establish intent. Confidence is an ordinal project assessment—not probability—and scoring is not a forensic standard.

See [architecture](docs/architecture.md), [methodology](docs/methodology.md), [acquisition](docs/evidence-acquisition.md), [artifacts](docs/artifact-reference.md), [protocol](docs/experiment-protocol.md), [custody](docs/chain-of-custody.md), [limitations](docs/limitations.md), and the [viva guide](docs/viva-guide.md).

## Tests and commands

```powershell
python -m pytest -q
python scripts/generate_timeline.py --case INSIDER-USB-001
python scripts/generate_report.py --case INSIDER-USB-001
python scripts/export_dataset.py --case INSIDER-USB-001
```

Generated outputs go to `outputs/`; the populated demo database is `data/cases/insider_usb.db`.

