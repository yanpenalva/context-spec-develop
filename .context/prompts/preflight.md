# Prompt Contract: Preflight Validate

## Inputs

Request, spec, plan, project context and repository state.

## Produce

`preflight.md` containing passed checks, missing evidence, risks, required approvals and a clear `READY` or `NOT READY` verdict.

## Constraints

Read-only validation. Do not fix code, rewrite the plan or approve a risk on behalf of an owner.
