# Architecture

The host contains an isolated Windows evidence VM and a forensic workstation. Experiment scripts operate only in the VM against fictional data and a designated USB. A powered-off disk/USB image is acquired and hashed; external forensic tools may export records without being required by the correlation engine.

```text
Windows VM → forensic image + hash → read-only exports → ingestion
                                                    ↓
raw preserved → normalized artifacts → timeline + correlation
                                      → hypotheses + score
                                      → SQLite → CLI/report/dashboard
```

Simulation, acquisition, analysis, and reporting are separate trust domains. Derived correlations list every source artifact ID. The dashboard binds only to loopback and deliberately rejects arbitrary web uploads and command execution.

