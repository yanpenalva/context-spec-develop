# Prompt Contract: Specify

## Inputs

The request, relevant project context, selected workflow and current work item.

## Produce

Update `spec.md` with objective, scope, out of scope, evidence, rules, contracts, security impact, tests and acceptance criteria. Product work also needs `discovery.md`; Support work needs the applicable triage, reproduction or incident evidence.

## Constraints

Inspect the repository before naming files, endpoints, permissions or status values. Mark missing evidence `NOT FOUND`. Do not implement or silently resolve a scope decision.

## Stop when

The spec is complete or a decision would change scope, cost, behavior or risk. Report that decision explicitly.
