# Evidence acquisition

For formal casework, acquire the powered-off disk and USB with a validated imaging tool; this repository does not automate disk imaging. For quick read-only triage of a running PC, use `collector/collect_usb_artifacts.ps1`, which writes its own SHA-256 manifest. Record the original image with `hash_evidence.py`, append custody events with `manifest.py`, and verify every working copy with `verify_evidence.py`. Verification opens evidence read-only and never modifies it.

