# Reproducible experiment protocol

## Before

- Restore `BASELINE`; verify hostname/user, fictional files, isolated networking, blank USB, system clock/timezone, and evidence destination.
- Record tool versions and experiment ID. Do not treat this record as evidence.

## During

- Run only the predefined A or B script as `employee01`; attach the designated USB manually when required.
- Do not manually change timestamps, Registry values, or event logs. Record intended actions separately.

## After

- End the session, safely detach the USB, preserve VM state, acquire disk/USB images, hash them, allocate evidence IDs, record custody, and analyze verified copies.

Snapshot topology: `BASELINE → EXPERIMENT-A` and independently `BASELINE → EXPERIMENT-B`.

