# Prompt Contract: Intake and Routing

## Inputs

User request, available project context and any existing work item.

## Ask and classify

1. Which conversation profile should guide the work?
2. Is the request new user or business value, a reproducible defect, active degradation/outage, or an urgent production change?
3. Who owns the outcome, what is the impact, and what risk is known?
4. For Git finalization, should this work item use `confirm_each` or `automatic` mode?

Map the answers to exactly one pair:

| Answer | `track` | `type` |
| --- | --- | --- |
| New value or product improvement | `product` | `feature` |
| Reproducible defect without active degradation | `support` | `bug` |
| Active degradation, outage or material impact | `support` | `incident` |
| Urgent production change for active or critical impact | `support` | `hotfix` |

## Classify and route

With `track` and `type` recorded, classify the work per `.context/classification/README.md`: set `complexity`, `impact`, `security` and `confidence` from repository evidence, derive `routing` per `.context/classification/routing.md`, and write the `classification` object into `work-item.json`. Later, reclassify only on material new evidence and record a `reclassification` entry.

Apply `.context/interaction/README.md` before asking anything: inspect first, map the point to a decision category, and ask only questions whose answer changes the path. Critical human gates stop the intake.

## Produce

Create or update `work-item.json` with profile, track, type, owner, risk, `git_finalization_mode`, classification, phase and status. Keep unknowns explicit. If answers conflict, stop at intake and ask the smallest clarifying question.

## Constraints

Do not choose a track from implementation technology. Do not start code changes, assign production authority to an agent, or treat an incident as a normal bug before containment.
