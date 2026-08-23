# Prompt Contract: Intake and Routing

## Inputs

User request, available project context and any existing work item.

## Ask and classify

1. Which conversation profile should guide the work?
2. Is the request new user or business value, a reproducible defect, active degradation/outage, or an urgent production change?
3. Who owns the outcome, what is the impact, and what risk is known?

Map the answers to exactly one pair:

| Answer | `track` | `type` |
| --- | --- | --- |
| New value or product improvement | `product` | `feature` |
| Reproducible defect without active degradation | `support` | `bug` |
| Active degradation, outage or material impact | `support` | `incident` |
| Urgent production change for active or critical impact | `support` | `hotfix` |

## Produce

Create or update `work-item.json` with profile, track, type, owner, risk, phase and status. Keep unknowns explicit. If answers conflict, stop at intake and ask the smallest clarifying question.

## Constraints

Do not choose a track from implementation technology. Do not start code changes, assign production authority to an agent, or treat an incident as a normal bug before containment.
