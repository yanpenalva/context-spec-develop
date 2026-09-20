# Artifacts and Gates

| Gate | Artifact | Question |
| --- | --- | --- |
| Intake | `work-item.json` | What is this, who owns it, how risky is it, and how deep must the workflow run? |
| Specify | `spec.md` | What outcome and behavior are approved? |
| Plan | `plan.md` | How will it change the system and be tested/reverted? |
| Preflight | `preflight.md` | Is the work safe, ready and routed consistently to implement? |
| Execute | local `progress.md` | What changed and which commands ran? |
| Verify | `verification.md`, `review.md` | Does the result match the approved intent? |
| Release | `release.md` | Is production change authorized and reversible? |
| Close | `outcome.md`, `postmortem.md` | What happened after release and what was learned? |

Required artifacts vary by track and support type. `work-item.json` is the structured intake record; its optional `classification` object records complexity, impact, security signal, confidence and the derived routing depth per `.context/classification/`, and optional `reclassification` entries record material changes. Complex requests may add an `intake.md` narrative. The validator enforces structural rules; the team owns semantic quality.
