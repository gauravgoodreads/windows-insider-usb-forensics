# Evidence acquisition

There are two supported ways to obtain evidence. Neither needs a virtual machine.

**Live triage (quick, read-only).** Run `collector/collect_usb_artifacts.ps1 -OutputDir <folder>` on the Windows PC under examination. It runs as a normal user, changes nothing, and exports USB device history (USBSTOR instances with first-install, last-arrival and last-removal times), files on mounted removable volumes, recent-item shortcuts, Recycle Bin `$I` records and Winlogon logon events. It writes `collected_<label>.json` and `collected_<label>-manifest.json` with the SHA-256 of the export. Use `-Since <start time>` to limit collection to one experiment and `-Label EXP-A` or `EXP-B` to tag it. Any live collection touches the running system, so state this limitation and prefer an image for formal casework.

**Image-based (formal).** Power off the system, acquire the disk and USB with a validated imaging tool, assign evidence IDs, record examiner, source, time, format and size, compute SHA-256 with `acquisition/hash_evidence.py` (MD5 only for compatibility), and analyse a verified copy. Never alter the original. Export records with Autopsy, The Sleuth Kit or a validated artifact parser.

Recommended exports are UTF-8 JSON arrays or CSVs covering filesystem listings for system and USB volumes, USBSTOR/MountedDevices/MountPoints2, EVTX-derived tables, LNK/Jump Lists/Recent Documents, Prefetch, Office artifacts, Shellbags, Recycle Bin and session records. Include source, timestamp, timestamp type, host, user, path/filename, action, device, description and tool provenance where available. Unknown values remain null.

Then run `python scripts/run_pipeline.py --input EXPORT_DIRECTORY`.
