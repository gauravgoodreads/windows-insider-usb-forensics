# Viva and presentation guide

**Why a VM?** Isolation, repeatability, and independent baseline snapshots.  
**Why acquire an image?** To preserve the source and separate acquisition from examination.  
**Why hashes?** To detect change and verify the working copy.  
**Does USBSTOR prove copying?** No; it supports device identity/history and requires corroboration.  
**Does a filesystem timestamp prove copying?** No; MAC timestamps have different semantics and can be affected by operation/filesystem.  
**Why multiple artifacts?** Independent corroboration reduces reliance on an ambiguous source.  
**Why compare A/B?** USB connection occurs in both; temporally associated sensitive destination activity may distinguish B.  
**Is scoring a standard?** No, it is a transparent experimental model.  
**Can this apply directly to real investigations?** Only cautiously; real configurations and artifact availability differ.

Presentation flow: research question → architecture → VM → A → B → acquisition → hash → ingestion → USB → sensitive files → user activity → correlation → timeline → hypotheses → comparison → conclusion.

