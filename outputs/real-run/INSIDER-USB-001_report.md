# USB Insider Forensics: Detecting Data Exfiltration via Removable Media on Windows

**Case:** INSIDER-USB-001  
**Investigator:** Student Investigator

## Executive Summary

This controlled investigation evaluated device, filesystem, Registry/event, and user-activity observations. H3 is **SUPPORTED** (HIGH). The assessment relies on corroboration rather than a single artifact.

## Investigation and Research Questions

Did employee01 copy confidential company data to an external USB device, when, which files, and what independent evidence supports the conclusion? Can Windows artifacts distinguish legitimate USB use from simulated insider leakage?

## Scope and Evidence Sources

Offline analysis of Windows 10/11 artifact exports: a controlled two-scenario dataset using fictional Example Corporation data, optionally complemented by read-only live triage of a real PC.

## Evidence Inventory

- EVD-EXPORT-001 | real-run (artifact export bundle) | SHA-256 `20f66c1aac9a4455333462f63d0baa17875c2c1269673e7337695766c978ef23` | 9300 bytes
- Imported artifact export bundle; original source files preserved and hashed for analysis provenance.

Raw exports are preserved separately; normalized records retain their original payload and provenance identifiers.

## Acquisition Methodology and Hash Verification

The included demo hashes the synthetic export bundle for provenance. Real evidence is either collected read-only with the triage collector, which records a SHA-256 manifest, or acquired as a powered-off disk and USB image that is hashed, logged in custody and examined only as a verified copy.

## Artifact, USB, User, and Filesystem Analysis

- META-EXP-A: simulation_metadata / None / n/a (LOW)

- A-0001: user_session / logged_on / n/a (MEDIUM)

- A-0002: usb / connected / 7&2EBF1D03&2&000000 (MEDIUM)

- A-0003: filesystem / created / Readme.txt (MEDIUM)

- A-0004: lnk / accessed / Readme.txt (MEDIUM)

- META-EXP-B: simulation_metadata / None / n/a (LOW)

- B-0001: user_session / logged_on / n/a (MEDIUM)

- B-0002: usb / connected / 7&2EBF1D03&2&000000 (MEDIUM)

- B-0003: filesystem / created / Employee_Salaries.xlsx (MEDIUM)

- B-0004: filesystem / created / Customer_Database.csv (MEDIUM)

- B-0005: archive / archived / Project_Files.zip (MEDIUM)

- B-0006: lnk / accessed / Employee_Salaries.xlsx (MEDIUM)

- B-0007: lnk / accessed / Customer_Database.csv (MEDIUM)

- B-0008: lnk / accessed / Project_Apollo.pdf (MEDIUM)

- B-0009: recycle_bin / deleted / Project_Apollo.pdf (MEDIUM)

## Unified Timeline

- 2026-10-21T20:47:29+05:30 — A-0001 — Interactive user logon

- 2026-10-21T20:47:29+05:30 — B-0001 — Interactive user logon

- 2026-10-21T21:02:07+05:30 — A-0002 — Last connection of USB storage device

- 2026-10-21T21:03:08+05:30 — A-0003 — Destination-side file on removable media

- 2026-10-21T21:03:08+05:30 — A-0004 — Shortcut created when the file was opened

- 2026-10-21T21:32:36+05:30 — B-0002 — Last connection of USB storage device

- 2026-10-21T21:32:57+05:30 — B-0003 — Destination-side file on removable media

- 2026-10-21T21:32:57+05:30 — B-0004 — Destination-side file on removable media

- 2026-10-21T21:32:57+05:30 — B-0006 — Shortcut created when the file was opened

- 2026-10-21T21:32:57+05:30 — B-0007 — Shortcut created when the file was opened

- 2026-10-21T21:32:57+05:30 — B-0008 — Shortcut created when the file was opened

- 2026-10-21T21:32:58+05:30 — B-0005 — Archive present on removable media

- 2026-10-21T21:32:59+05:30 — B-0009 — File moved to the Recycle Bin

- unknown — META-EXP-A — 

- unknown — META-EXP-B — 

## Correlations

- CORR-001 USER_SESSION (MEDIUM): User-session artifact observed

- CORR-002 USB_SESSION (MEDIUM): Removable-device connection artifact observed; Disconnect artifact included when available

- CORR-003 USER_SESSION (MEDIUM): User-session artifact observed

- CORR-004 USB_SESSION (MEDIUM): Removable-device connection artifact observed; Disconnect artifact included when available

- CORR-005 POSSIBLE_TRANSFER_SESSION (HIGH): USB device activity observed; Sensitive-file activity occurred within the configured time window; Employee user-session artifact corroborates temporal association; Destination-side file artifact was observed on removable media; Archive activity occurred in the same experiment

- CORR-006 SENSITIVE_FILE_ACTIVITY (MEDIUM): Project-classified sensitive files have activity artifacts

- CORR-007 ARCHIVE_ACTIVITY (MEDIUM): Archive creation artifact observed; intent is not established

- CORR-008 POSSIBLE_CONCEALMENT (LOW): Rename or deletion artifact observed; Artifact presence alone does not establish malicious intent

## Hypothesis Evaluation

### H1 — SUPPORTED (HIGH)
- USB connection artifacts support device presence

### H2 — SUPPORTED (MEDIUM)
- User-associated sensitive-file artifacts were observed

### H3 — SUPPORTED (HIGH)
- USB device activity observed
- Sensitive-file activity occurred within the configured time window
- Employee user-session artifact corroborates temporal association
- Destination-side file artifact was observed on removable media
- Archive activity occurred in the same experiment

### H4 — PARTIALLY_SUPPORTED (MEDIUM)
- Rename or deletion activity is consistent with possible concealment
- Artifact presence alone does not establish malicious intent

## Observation, Inference, Conclusion

**Observation:** Normalized artifact records describe device and file activity.

**Inference:** Temporal relationships are consistent with the generated correlation events.

**Conclusion:** The combination of device, filesystem, user-session, and application artifacts strongly supports the simulated data-transfer hypothesis. No single artifact independently establishes the complete transfer sequence.

## Experimental Score

Score: **13**. This is an experimental project model and is NOT an established forensic standard.

## Limitations

- Simulated laboratory environment

- Artifact availability depends on Windows configuration

- Timestamp sources have different semantics and reliability

- USB presence alone does not establish transfer

- Correlation does not establish intent

- The experimental score is not a forensic standard

## Appendix — Disclaimer

This system is an educational digital-forensics research platform operating on a controlled laboratory dataset. Findings represent an analytical interpretation of the supplied artifacts and should not be treated as a substitute for a validated forensic methodology in a real investigation.
