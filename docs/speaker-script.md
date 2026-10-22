# Complete speaker script: USB Insider Forensics

Word-for-word script for the whole presentation: 15 slides, the live demonstration, the dashboard tour, the closing and the viva questions. Text in *italics in brackets* is an action, not something to say. Total time is about 20 minutes plus questions.

If you present as a group, one way to split it: Person 1 takes slides 1–4, Person 2 slides 5–8, Person 3 slide 9 with the live demo and dashboard tour, and Person 4 slides 10–15 and leads the questions.

---

## Slide 1: USB Insider Forensics *(about 40 seconds)*

"Good morning sir. Our project is called **USB Insider Forensics: detecting data exfiltration via removable media on Windows**.

In simple words, the question is this: if an employee copies company files to a USB drive, can we prove it using only the traces Windows leaves behind on the computer?

We built the complete system ourselves: a tool that collects the evidence from Windows, an analysis engine that links the evidence together and reaches a conclusion, a dashboard to see the results, and reports. And we did not stop at made-up data: we tested it on real Windows evidence from our own laptop with a real USB disk.

What you see on the right is our dashboard. I will show it working live in a few minutes."

---

## Slide 2: Why this project *(about 1 minute)*

"First, why this problem matters.

Most people imagine data theft as a hacker breaking in from outside. But a lot of data loss comes from **insiders**: employees who already have permission to open the files. They don't need to hack anything.

The easiest way for an insider to take data out is a **USB drive**. And here is the real difficulty for an investigator: people also use USB drives for completely normal reasons, like backups. So if we only see that a USB was plugged in, that proves nothing. A normal backup and a theft can look exactly the same from a single trace.

So our research question is the one on the right: **can the traces Windows leaves behind tell an ordinary USB backup apart from an insider copying sensitive company files?** We answered it with a controlled experiment and real Windows evidence."

---

## Slide 3: The core idea *(about 1.5 minutes, the most important slide)*

"This is the key idea of the whole project.

Windows quietly records many small clues. On the left: a USB drive was connected; a sensitive file was opened; the same file appeared on the USB; which user was logged in; and whether a ZIP was made or a file was deleted.

**Each clue on its own is weak.** A USB connection happens every day. Opening a file is normal. Even deleting a file can be innocent.

But think of a detective. One footprint means nothing. A footprint, fingerprints and a CCTV recording all pointing to the same person at the same time make a strong case.

That is exactly what our system does. It takes these clues and checks whether they happened **inside the same USB time window**, which is 20 minutes by default and configurable. When several independent clues agree in that window, we have strong evidence.

And the conclusion is always **explainable**: it shows a confidence level, the exact records it used, and the limit of what it can claim."

---

## Slide 4: Experiment design *(about 1 minute)*

"To test this fairly, we needed a **control**: a normal case to compare against.

So we ran two experiments, and the top bar is important: same laptop, same Windows user, same USB drive, same fictional company files. **Only the behaviour changes.**

**Experiment A** is the normal backup, our control. The user plugs in the USB, opens an ordinary Readme file and copies it to the USB. Our system must **not** call this a leak.

**Experiment B** is the simulated insider. The user opens the salary, customer and project files, copies the sensitive ones to the USB, makes a ZIP archive, and deletes a temporary copy into the Recycle Bin. Our system **should** flag this.

All the company files are fictional. We created them ourselves; no real data was used anywhere."

---

## Slide 5: What Windows remembers *(about 1.5 minutes)*

"Where does the evidence come from? Windows saves these clues in five places, and our collector reads all five.

One, **USB device history**, stored in the Windows Registry under the device's entry. Windows keeps the first-install time, the last connection and the last removal. This shows the device was present, but not what was copied.

Two, **the files on the USB itself**. The USB's file system records when each file was created. This is the strongest clue, because it shows the file actually reached the drive.

Three, **Recent Items shortcuts**. When you open a document, Windows automatically creates a small shortcut file in the user's Recent folder. That shows the file was opened, but not copied.

Four, **Recycle Bin records**. Every deleted file leaves a small record with its original path and the exact deletion time. Deletion can be innocent, so it doesn't prove intent.

Five, **logon events** in the Windows event log, which tie the activity to a user session.

Each yellow line is the limit of that clue. Our collector is a PowerShell script that reads all of these as a **normal user**, **read-only**, so it never changes the computer, and it seals its output with a **SHA-256 fingerprint**."

---

## Slide 6: How the system works *(about 1.5 minutes)*

"This is the full pipeline, from raw Windows traces to a verdict, in seven stages.

**Collect**: the read-only PowerShell collector gathers the evidence.
**Seal**: the export gets a SHA-256 fingerprint and a custody record, so any later change would be detected.
**Ingest**: every record is loaded, and the original raw version is kept untouched.
**Normalize**: different kinds of records are converted into one common format. If a value is missing, it stays missing. Nothing is guessed.
**Correlate**: records are linked when they share the same user, device, file and time window.
**Assess**: the system answers four questions, each with a confidence and a stated limit.
**Present**: the results go to the dashboard and to PDF, HTML and CSV reports.

We built it with PowerShell for collection, Python for the analysis, SQLite as the database, a Flask API, and a React dashboard. There are 14 automated tests that check all of this works.

The most important design point is at the bottom: every stage keeps the IDs of the records it used, so any result can be traced back to the original evidence."

---

## Slide 7: Four questions, not one verdict *(about 1 minute)*

"Instead of giving a single 'guilty' or 'not guilty', the system answers four separate questions.

**H1: was a USB drive used?** This needs a USB connection record. The limit: normal users plug in USB drives too.
**H2: were the sensitive files opened?** This needs shortcut or recent-document records for the listed files. The limit: opening is not copying.
**H3: were they copied to the USB?** This is the strongest one. It needs a sensitive file on the USB inside the connection window, plus a user session. Even then, it shows timing and links, not intent.
**H4: was anything hidden?** This needs archive or deletion records. The limit: zipping and deleting files can be completely innocent.

The confidence levels, Low, Medium and High, are our own defined labels, not probabilities. And the score is only a ranking aid, not a forensic standard."

---

## Slide 8: Forensic soundness *(about 1 minute)*

"In forensics, how you handle evidence matters as much as the result. Four things make our process sound.

First, **read-only collection**: the collector never edits the system it examines.
Second, **a SHA-256 fingerprint**. A hash is a digital fingerprint of the file; change even one character and the fingerprint changes completely. This hash, starting CA60D5A4, sealed our real Experiment B evidence.
Third, **the raw record is preserved** next to the cleaned version, so nothing is lost or invented.
Fourth, **a custody and audit log**: who handled the evidence, when, and every time the analysis ran.

On the right you can see the dashboard's evidence panel: the normalized fields at the top and the original raw data underneath."

---

## Slide 9: Live demonstration *(about 6–7 minutes including the demo)*

"Now I'll show it working live. One command runs the whole investigation in eight steps. At every step it prints the exact command and the actual code it's running, so nothing is hidden. Before each experiment I'll unplug and replug the USB drive, so Windows records a genuine new connection."

*[Switch to PowerShell. Type `.\live_demo.ps1` and press Enter.]*

**Start screen:** "This is the question we're answering. I'll press Enter to start." *[Enter]*

**Step 1, find the USB drive:** "First it asks Windows which drives are USB storage. Here is the command it runs. It found our Seagate external USB disk, which plays the role of the device an employee uses to take data out." *[Enter]*

**Step 2, fictional company files:** "Now it creates a fake company folder. These are the actual lines of code that create each file: a salary spreadsheet, a customer database, a project PDF, a strategy document and an ordinary readme. The salary and customer files are classified as highly sensitive in our configuration." *[Enter]*

**Step 3, Experiment A:** "This is the control, a normal backup. I'm going to unplug the USB drive and plug it back in, so Windows records a fresh connection." *[Eject D: from the taskbar, unplug, wait 5 seconds, plug back in, wait for D: to appear, press Enter.]* "You can see Windows recorded the connection at this exact time. Here is every line of the experiment script: it opens the readme and copies it to the USB. And here it is on the USB now." *[Enter]*

**Step 4, collect evidence for A:** "Now the collector reads the traces Windows left, limited to just this experiment's minutes. These five lines are the five evidence sources it reads. And here are the real records it found: the logon, the USB connection, the readme on the USB, and the shortcut showing it was opened." *[Enter]*

**Step 5, Experiment B:** "Now the insider. Same laptop, same user, same USB. I'll replug the drive again." *[Eject, unplug, wait, plug back in, press Enter.]* "Here is every line of this script. It opens the three sensitive files, copies two of them to the USB, creates a ZIP archive, and deletes a temporary copy into the Recycle Bin. And here are the files now on the USB." *[Enter]*

**Step 6, collect evidence for B:** "The same read-only collector for Experiment B. Look at this: files opened, the same files on the USB, a ZIP, and a deletion, all within seconds. And here is the SHA-256 fingerprint that seals this evidence." *[Enter]*

**Step 7, analysis:** "Now the analysis. These are the stages the engine runs, in order. And here are the results: H1, a USB was used, supported. H2, sensitive files were opened, supported. H3, copied to the USB, supported. H4 is only partially supported, because zipping and deleting can be innocent. Most importantly: a possible transfer is flagged **only in Experiment B, not in Experiment A**. That is exactly the correct answer." *[Enter]*

**Step 8, clean up and dashboard:** "The fake files go to the Recycle Bin, but the evidence was preserved and fingerprinted before cleanup, which is how forensic work should be done. And now the dashboard opens on the evidence we just created."

### Dashboard tour *(about 3 minutes)*

*[In the browser.]*

**Overview:** "This is the overview, with the finding and the key numbers. This stepper shows every stage the evidence went through." *[Click two or three stages.]*

*[Click Timeline.]* "This is the timeline. On the left, Experiment A: one ordinary file. On the right, Experiment B: everything happens within seconds, all inside the USB window."

*[Click Sensitive files.]* "Here is the strongest clue. The salary file on the computer, and the same file on the USB drive."

*[Click Correlations.]* "These are the links the engine made. This one is the key link, the possible transfer session. It lists its reasons in plain English and the exact record IDs it used. So it is not a black box: every conclusion can be checked by hand."

*[Click Artifacts, then click any row.]* "And for any record, you can see the cleaned version at the top and the original raw evidence underneath. Nothing is lost, and nothing is invented."

*[Press Ctrl+C in PowerShell. Return to PowerPoint, slide 10.]*

---

## Slide 10: The real run *(about 1 minute)*

"Before today, we also ran both experiments for real on the 21st of October, on this laptop with our Seagate external USB disk. These are the actual timestamps Windows recorded.

In Experiment A, the disk connected at 21:02:07, and a minute later the readme was opened and written to the USB.

In Experiment B, the disk connected at 21:32:36. Then at 21:32:57 the sensitive files were opened and copied to the USB, at 21:32:58 the ZIP was created, and at 21:32:59 the copy was deleted to the Recycle Bin.

So: open, copy, zip and delete, all within three seconds, all inside the USB window."

---

## Slide 11: Results on real evidence *(about 1 minute)*

"Here is the result on that real evidence.

The chart shows the real Windows records collected for each experiment. Both have a logon and a USB connection; that's normal. But Experiment B has more files on the USB, more shortcuts, an archive and a deletion.

And the verdict: for **Experiment A, no transfer was flagged**, even though the USB was used. For **Experiment B, a possible transfer with HIGH confidence**, correlation CORR-005, built from nine real records inside the USB window.

That is exactly the behaviour we designed for: it catches the insider, and it does not accuse the normal user."

---

## Slide 12: Consistency check *(about 1 minute)*

"We checked the method three ways, with the same rules each time.

First, on our **designed dataset**, where we knew the right answer in advance: correct.

Second, on the **real run** on the laptop: the same verdict, with the transfer only in Experiment B.

Third, on **30 days of normal use** of the same laptop, without any experiment: it found real USB use, but correctly said **no sensitive files were opened or copied**. So there is **no false alarm**.

Real evidence reproduced the designed result, and normal USB use was not called a leak."

---

## Slide 13: The dashboard *(about 30 seconds, or skip if you showed it live)*

"These are two pages of the dashboard you saw. On the left, the correlations page: each link with its reasons and the exact record IDs. On the right, the sensitive files page: the same file on the computer and on the USB drive.

There are eleven pages in total, plus PDF, HTML, JSON and CSV reports, so the dashboard is not the only output."

---

## Slide 14: Honest limits *(about 1 minute)*

"We want to be clear about what this project does **not** claim.

It **does not prove guilt or intent**. It can support that a transfer happened, but why someone did it is outside forensics.

The **company data is fictional**. The Windows traces are completely real, but the salary and customer files are made up.

**Live collection touches the running system** slightly. For formal casework, investigators should first make a copy of the powered-off disk and analyse the copy.

It was tested on **one laptop and one Windows version**. A larger study would repeat it on more PCs and USB devices.

And **the score is not a standard**. It only ranks findings; it is not a probability.

For future work: analysing full disk images, testing more devices and Windows versions, and capturing USB removal events."

---

## Slide 15: Conclusion *(about 40 seconds)*

"To conclude.

**Several independent clues, agreeing in the same USB window, separate an insider from normal use far better than any single clue, and that held on real Windows evidence.**

The project reads five evidence sources, produces explainable correlations, answers four hypotheses, and is checked by fourteen automated tests.

Thank you, sir. We're happy to take your questions."

---

## Questions sir may ask, with answers

**What is a forensic artifact?**
A trace that Windows leaves behind automatically, like a registry entry, a shortcut file or an event log record.

**Why can't you just check if a USB was plugged in?**
Because normal users plug in USB drives every day. That's why Experiment A exists: USB use appears in both experiments, so on its own it proves nothing.

**What is the strongest single clue?**
The same sensitive file appearing on the USB drive, inside the connection window.

**Where does Windows store USB history?**
In the Registry, under `HKLM\SYSTEM\CurrentControlSet\Enum\USBSTOR` for pen drives, or `Enum\SCSI` for external disks like our Seagate, with first-install, last-connected and last-removed times.

**Where are the shortcuts and Recycle Bin records?**
Shortcuts are in `C:\Users\<user>\AppData\Roaming\Microsoft\Windows\Recent`. Deleted files are in the hidden `C:\$Recycle.Bin` folder, where each `$I` file holds the original path and the deletion time.

**What is a hash and why use it?**
A digital fingerprint of a file. If even one character changes, the hash changes completely, so matching hashes prove the evidence was not altered. It is not encryption.

**What is correlation in your project?**
Linking records that share the same user, USB device, file and time window, using fixed rules. It shows a relationship, not cause or intent.

**Why did you use a 20-minute window?**
It is long enough to cover a realistic copy session and short enough to avoid linking unrelated activity. It is configurable: 5, 10, 15, 20, 30 or 60 minutes.

**Is the data real?**
The Windows traces are completely real; we ran both experiments on a real laptop with a real USB disk. Only the company files themselves are fictional, so no real confidential data was used.

**Why didn't you use a virtual machine?**
We tried. VirtualBox could not install Windows 11 reliably because the laptop's Hyper-V security feature conflicts with it. Running the experiments on the real laptop with a real USB disk gave genuine Windows evidence, which is actually stronger, and the analysis does not depend on how the evidence was produced.

**Can this be used in a real court case?**
Not directly. Real cases need validated forensic tools, legal authority and usually a full disk image. Our project demonstrates the method under controlled conditions.

**What does the score of 13 mean?**
A simple checklist: each type of clue found adds points. It helps rank findings. It is not a probability and not an industry standard.

**What languages did you use?**
PowerShell for evidence collection and the experiments, Python for the analysis engine and the API, SQLite for the database, and TypeScript with React for the dashboard.

**Do tools like this already exist?**
Parts of it do. Tools like Autopsy, USB Detective and Eric Zimmerman's tools extract these artifacts. Our contribution is combining them into an explainable correlation system and testing it with a control experiment on real evidence.

**How do you know your system is correct?**
Three ways: it gives the right answer on a dataset where we knew the answer in advance, it gives the same answer on the real run, and it gives no false alarm on 30 days of normal laptop use. There are also 14 automated tests and a 12-point project validator.

**What would you improve?**
Analyse full disk images, add more artifact types like Prefetch and ShellBags, capture USB removal events, and test on more computers and Windows versions.
