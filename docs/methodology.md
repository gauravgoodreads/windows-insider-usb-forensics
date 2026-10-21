# Methodology

The study uses a controlled comparative case design. Experiment A produces legitimate USB backup activity; Experiment B produces ordinary file operations involving fictional classified files. Both share the same workstation, user, USB device and fictional data, so the only difference is the user's behaviour. The independent variable is experiment type; observations include device, sensitive-file, archive, destination, deletion, and session artifacts. A third, real-world check runs the read-only collector on a genuine Windows PC: the method should detect USB use there without reporting a sensitive transfer that did not happen.

The pipeline preserves raw records, normalizes fields without inventing missing values, orders records according to explicit timestamp semantics, and applies configured temporal rules. H1–H4 are assessed using transparent criteria. Experiment comparison treats USB presence as low-discrimination when shared, while sensitive destination activity and temporal corroboration have higher qualitative discriminative value. No statistical significance is claimed.

Observation means a supplied artifact field; inference means an evidence-grounded interpretation; correlation means a temporal/relational association; a finding is a hypothesis assessment; a conclusion synthesizes findings. Confidence (LOW/MEDIUM/HIGH) describes project-assessed evidentiary support, not a validated probability.

