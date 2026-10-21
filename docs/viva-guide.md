# Viva and demonstration guide

## The project in one sentence

This project is a controlled Windows cyber-forensics experiment that asks: **can traces left by Windows distinguish an ordinary USB backup from a simulated insider copying fictional sensitive files?**

It does not spy on a live person, claim that one trace proves guilt, or use real confidential data. It creates two repeatable laboratory scenarios, preserves their evidence, converts many artifact formats into one common model, correlates the traces, evaluates four hypotheses, and presents the reasoning in a dashboard and report.

## The simple story

When an employee connects a USB drive, Windows records many small clues, but no single clue tells the whole story. Registry data may identify a known device; device events may show connection times; recent-document records may show file access; filesystem records may show a corresponding file on the USB; Prefetch may show program execution; and session events may associate activity with a user.

The project joins those independent clues by time, device, path, file, user, and experiment. It then explains what is observed, what is only inferred, and what still cannot be proved.

## Why there are two experiments

Experiment A is the control: the same user connects the same laboratory USB and copies only an ordinary fictional `Readme.txt` backup file.

Experiment B is the simulated incident: the user accesses and copies fictional salary, customer, and project files, creates an archive, and creates/removes a temporary file. These are normal operating-system operations performed only on synthetic data; Windows generates the artifacts naturally.

Both experiments use the same computer, user, USB drive and fictional files, so the meaningful difference is the user's behaviour. They exist twice: as a controlled dataset where the right answer is known, and as a real run on the project laptop with a real external USB disk. USB presence appears in both experiments, so USB presence alone is intentionally not treated as proof of exfiltration.

## End-to-end flow

```text
Experiment A and Experiment B (controlled dataset, or a real run on a Windows PC)
  -> read-only collection (collector script) or forensic-tool exports
  -> recorded SHA-256 hashes and custody
  -> ingestion with the raw record preserved
  -> normalization into one artifact model
  -> correlation by time, user, device, file, and destination
  -> H1-H4 hypothesis assessment
  -> timeline, comparison, reports, SQLite database, and dashboard
```

The layers are kept separate on purpose: simulation creates controlled activity; acquisition preserves the source; analysis reads copies/exports and builds evidence-backed relationships; presentation shows the same stored results through reports and the dashboard.

## The four hypotheses

- **H1 — Was removable USB storage used?** Device identity, connection, mounted-volume, and related records can support this.
- **H2 — Were the defined fictional sensitive files accessed?** File, recent-document, shortcut, program, and related activity can support this.
- **H3 — Is there corroborated transfer-related activity during the USB window?** This needs more than device presence: sensitive activity near the device window plus destination-side and/or user-session support.
- **H4 — Is there evidence of concealment-like behavior?** Archive or deletion-related traces may support cautious wording, but do not establish intent by themselves.

The conclusions are deliberately conservative. `LOW`, `MEDIUM`, and `HIGH` are transparent project confidence labels, not mathematical probabilities and not an industry standard.

## What each dashboard page means

- **Overview:** case identity, counts, experiment comparison, and the main conclusion.
- **Timeline:** normalized events in time order; filters reveal clusters around a USB session.
- **Artifacts:** each imported record with source, normalized fields, raw payload, and provenance.
- **Files:** file activity, sensitivity classification, source/destination context, and hashes when supplied.
- **Devices:** USB/device records and association windows. This answers device questions, not the whole copying question.
- **Correlations:** explicit links made by the engine and their source artifact IDs.
- **Hypotheses:** H1-H4, confidence, evidence, limitations, and explanation.
- **Experiments:** side-by-side A/B comparison; the clearest place to show why USB presence has low discriminatory value.
- **Chain of custody:** evidence IDs, recorded hashes, verification state, handlers, and notes.
- **Reports:** generated Markdown, HTML, JSON, PDF, and CSV results.
- **Settings/method:** classification terms, time windows, configuration, and score limitations.

## A safe classroom demonstration

1. Start at **Overview** and read the research question aloud.
2. Open **Experiments**. Explain that A is a normal backup and B is the simulated incident, on the same PC, user and USB drive.
3. Open **Devices**. Say, “USB use occurs in both; this proves neither copying nor intent by itself.”
4. Open **Files** and filter for the fictional salary/customer/project names. Explain source-side access versus destination-side presence.
5. Open **Timeline** and show the device window followed by sensitive-file and user activity.
6. Open **Correlations** and select one relationship. Show its artifact IDs so the result is auditable rather than a black box.
7. Open **Hypotheses** and explain H1-H4, including a limitation for every conclusion.
8. Open **Chain of custody** and explain that a hash is a change-detecting digital fingerprint, not encryption.
9. Open **Reports** and show that the same reasoning can be submitted outside the dashboard.
10. Finish with: “The project demonstrates corroboration and reproducibility; it does not claim that one artifact proves guilt.”

## A short speech for the examiner

“My project studies simulated insider data exfiltration through removable USB storage on Windows. I designed two experiments on the same PC, user and USB drive. Experiment A is a normal backup; Experiment B copies only fictional sensitive files and creates a few additional controlled traces. I ran both for real on my laptop with an external USB disk and collected the traces with a read-only script. The application preserves raw exports, normalizes different Windows artifacts, correlates them by time, user, device and file, and evaluates four transparent hypotheses. The important result is that USB presence alone is weak because it appears in both experiments. Stronger support comes from multiple independent artifacts agreeing within the USB connection window, especially destination-side and user-session corroboration. Every conclusion retains provenance and limitations, and the score is clearly labelled as an experimental aid rather than a forensic standard.”

## Common viva questions

**Where does the evidence come from?** A controlled dataset where the answer is known, plus a real run of both experiments on the project laptop, collected read-only by `collector/collect_usb_artifacts.ps1`. Only fictional company files were used, and they were removed afterwards.

**Why no virtual machine?** The analysis reads exported artifacts from any source. Running the scenarios on a real PC with a real USB disk gives genuine Windows traces without extra setup; a VM would only be another way to create test evidence.

**Why acquire an image?** A powered-off image preserves the source state and separates acquisition from examination. Analysis should use verified copies.

**Why calculate hashes?** A cryptographic hash is a digital fingerprint. Matching recorded and later hashes supports that the bytes examined are unchanged.

**Does USBSTOR prove copying?** No. It supports device identity/history and needs temporal, file, destination, and user corroboration.

**Does a timestamp prove copying?** No. MAC timestamps have different meanings and can be affected by copying, opening, clock settings, metadata handling, and filesystem behavior.

**Why multiple artifacts?** Independent corroboration reduces reliance on any one ambiguous or missing source.

**Why compare A and B?** It exposes false positives. USB use is common to both; temporally associated sensitive destination activity should be more characteristic of B.

**What is normalization?** Mapping differently named source fields into one documented structure without inventing missing values; the raw payload remains preserved.

**What is correlation?** An explainable relationship based on configured time and identity rules. It is not automatically proof of causation.

**Is the score a standard or probability?** No. It is a visible experimental prioritization model.

**Can the result be used directly in court?** No. Real systems vary, tool validation and legal authority are required, and this project uses controlled synthetic data.

**What are the main limitations?** Synthetic data, one controlled Windows environment, export-dependent coverage, timestamp uncertainty, missing-artifact risk, no validated statistical model, and no inference of motive or guilt.

**What makes it reproducible?** Versioned code/configuration, fixed scenario scripts, a scripted read-only collector with time-bounded collection, evidence hashes, raw-record preservation, source IDs, deterministic rules, automated tests, and generated reports.

## Final examiner-safe conclusion

The correct conclusion is not “the USB user is guilty.” The correct conclusion is: **in this controlled dataset, a combination of independent Windows artifacts can distinguish the simulated sensitive-transfer scenario from ordinary USB use more convincingly than any single artifact, while important uncertainty and limitations remain.**

