# Artifacts and Gates

| Gate | Artifact | Question |
| --- | --- | --- |
| Intake | `work-item.json` | What is this, who owns it and how risky is it? |
| Specify | `spec.md` | What outcome and behavior are approved? |
| Plan | `plan.md` | How will it change the system and be tested/reverted? |
| Preflight | `preflight.md` | Is the work safe and ready to implement? |
| Execute | local `progress.md` | What changed and which commands ran? |
| Verify | `verification.md`, `review.md` | Does the result match the approved intent? |
| Release | `release.md` | Is production change authorized and reversible? |
| Close | `outcome.md`, `postmortem.md` | What happened after release and what was learned? |

Required artifacts vary by track and support type. `work-item.json` is the structured intake record; complex requests may add an `intake.md` narrative. The validator enforces structural rules; the team owns semantic quality.
