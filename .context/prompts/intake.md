# Prompt Contract: Intake and Routing

## Inputs

User request, available project context and any existing work item.

## Classify first

Determine from the request and the smallest necessary evidence:

1. Is the request new user or business value, a reproducible defect, active degradation/outage, or an urgent production change?
2. Who owns the outcome, what is the impact, and what risk is known?

Map the answers to exactly one pair:

| Answer | `track` | `type` |
| --- | --- | --- |
| New value or product improvement | `product` | `feature` |
| Reproducible defect without active degradation | `support` | `bug` |
| Active degradation, outage or material impact | `support` | `incident` |
| Urgent production change for active or critical impact | `support` | `hotfix` |

Apply `.context/interaction/README.md` before asking anything: inspect first, map the point to a decision category, and ask only questions whose answer changes the path. Critical human gates stop the intake. Conversation profile and Git finalization mode are not intake questions: resolve the profile from explicit choice, recorded preference or the configured default (`start-conversation.md`), and defer `git_finalization_mode` until Git finalization becomes relevant (`.context/prompts/close.md`) unless the user already stated it.

## Classify and route

With `track` and `type` recorded, classify the work per `.context/classification/README.md`: set `complexity`, `impact`, `security` and `confidence` from repository evidence, derive `routing` per `.context/classification/routing.md`, and write the `classification` object into `work-item.json`. Later, reclassify only on material new evidence and record a `reclassification` entry.

## Produce

Create or update `work-item.json` with track, type, owner, risk, the resolved conversation profile, classification, phase and status; record `git_finalization_mode` when resolved. Keep unknowns explicit. If answers conflict, stop at intake and ask the smallest clarifying question.

## Constraints

Do not choose a track from implementation technology. Do not start code changes, assign production authority to an agent, or treat an incident as a normal bug before containment.
