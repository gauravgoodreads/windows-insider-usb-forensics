# Lab setup

> Do not perform the experiment on a production machine or a computer containing real confidential information.

1. Create a Windows 10/11 VM named `CORP-PC01`; disable shared folders, clipboard, drag/drop, and networking or use an isolated host-only segment.
2. Create local user `employee01`; use no real credentials or personal information.
3. Attach a blank virtual/removable disk labelled `BACKUP_DRIVE`, normally `E:`. Confirm it contains no real data.
4. Run `create_company_data.ps1` as appropriate for the lab and verify all content is fictional.
5. Shut down and snapshot `BASELINE`; clone independent `EXPERIMENT-A` and `EXPERIMENT-B` states.
6. Run the matching script interactively. Never manually modify timestamps. Preserve intended-action logs separately as non-evidence metadata.

The repository does not automate hypervisor construction or physical USB access. Device attachment/removal and image acquisition remain deliberate examiner actions.

