# Evidence acquisition

After each experiment, stop activity, preserve VM state, and acquire the disk plus designated USB using a validated forensic imaging workflow. Assign evidence IDs, record examiner/source/time/format/size, compute SHA-256 (MD5 is supplied only for compatibility), and analyze a verified copy. Never alter the original.

Recommended exports are UTF-8 JSON arrays or CSVs: complete filesystem listings for system and USB volumes; USBSTOR, MountedDevices, and MountPoints2 extractions; relevant EVTX-derived tables; LNK/Jump List/Recent Documents; Prefetch; Office artifacts; Shellbags; Recycle Bin; and session records. Include source, timestamp, timestamp type, host, user, path/filename, action, device, description, and tool provenance when available. Unknown values remain null.

The tools do not parse raw E01/EVTX/Registry binary formats directly. Use Autopsy, The Sleuth Kit, or a validated artifact parser to export records, retain the tool/version in `source`, then use `python scripts/run_pipeline.py --input EXPORT_DIRECTORY`.

