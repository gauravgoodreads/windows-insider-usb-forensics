# Evidence acquisition

Acquire the powered-off lab VM using a validated imaging tool; this repository does not automate disk acquisition. Record the original image with `hash_evidence.py`, append custody events with `manifest.py`, and verify every working copy with `verify_evidence.py`. Verification opens evidence read-only and never modifies it.

