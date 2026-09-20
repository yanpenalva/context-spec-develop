# Prompt Contract: Preflight Validate

## Inputs

Request, spec, plan, project context and repository state.

## Produce

`preflight.md` containing passed checks, missing evidence, risks, required approvals and a clear `READY` or `NOT READY` verdict.

Confirm that the plan's execution depth matches the classified `routing` in `work-item.json` per `.context/classification/routing.md`. A mismatch is a finding, resolved by adjusting the plan or by recording a justified reclassification.

## Constraints

Read-only validation. Do not fix code, rewrite the plan or approve a risk on behalf of an owner.
