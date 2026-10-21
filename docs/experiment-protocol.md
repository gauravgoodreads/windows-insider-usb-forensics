# Reproducible experiment protocol

The demo uses the scenario dataset in `data/sample/`, which needs no setup. This protocol describes how to reproduce Experiments A and B with real Windows artifacts on a spare test PC, and how to collect them without a virtual machine.

## Before

- Use a spare Windows test PC or a dedicated local test account, never a work machine, and a spare USB stick labelled `BACKUP_DRIVE`.
- Run `simulator/create_company_data.ps1` to create the fictional company files. Never use real confidential data.
- Record the PC name, user, clock and time zone, tool versions and experiment ID. This record is metadata, not evidence.

## During

- Run only the predefined script, `simulator/experiment_a.ps1` or `simulator/experiment_b.ps1`, as the test user, with the USB stick attached. Pass `-UsbRoot` if the stick is not `E:\`.
- Do not manually change timestamps, Registry values or event logs.

## After

- Leave the USB stick attached and run `collector/collect_usb_artifacts.ps1 -OutputDir <evidence folder> -Label EXP-A` (or `EXP-B`). The collector is read-only and writes a SHA-256 manifest.
- Record custody with `acquisition/manifest.py`, then analyse with `python scripts/run_pipeline.py --input <evidence folder>`.
- Run `simulator/cleanup.ps1` before the next experiment so that A and B do not contaminate each other. For full independence, run B on a freshly reset test account.
