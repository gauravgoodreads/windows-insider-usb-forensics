# Presenter notes (keep these to yourself)

Run `.\live_demo.ps1` with the USB drive plugged in. Press Enter to move between steps. What to say at each step:

**Start:** "I'll run both experiments live on this laptop, collect the real Windows evidence, and let my software decide which one was the insider."

**Step 1, USB drive:** "This drive plays the part of the device an employee could use to take data out."

**Step 2, fictional files:** "These are fake company files. The salary and customer files are marked highly sensitive in my configuration."

**Step 3, Experiment A:** *(unplug, wait 5 seconds, plug back in, press Enter)* "This is my control: a normal backup. Normal people use USB drives too, so my method must not accuse this user."

**Step 4, collect A:** "A read-only script reads the traces Windows left: device history, files on the USB, opened-file shortcuts, Recycle Bin and logons. It changes nothing and fingerprints its output."

**Step 5, Experiment B:** *(unplug, wait 5 seconds, plug back in, press Enter)* "Now the insider. Same laptop, same user, same USB drive. Only the behaviour changes."

**Step 6, collect B:** "Files opened, the same files on the USB, a ZIP and a deletion, all within seconds. One clue alone proves nothing; together they tell a story."

**Step 7, analysis:** "The software links records by user, device, file and time, and answers four questions. It flags a possible transfer only in Experiment B, not in A."

**Step 8, dashboard:** "The evidence was preserved before cleanup. Now the same result in the dashboard."

Then click: **Timeline** (everything inside the USB window), **Sensitive files** (same file on the PC and on the USB), **Correlations** (the exact records and reasons), **Hypotheses** (read one Limit line).

**Closing line:** "Several independent clues together separate the insider from normal use far better than any single clue. It supports a conclusion; it doesn't prove guilt or intent."

**Avoid saying:** "this proves he's guilty", "the score is a probability", "the company data is real".
