# Prompt Contract: Plan

## Inputs

Approved or draft spec, project context, current codebase and applicable workflow.

## Produce

Update plan.md with the smallest viable implementation approach, confirmed touchpoints, contracts, data changes, tests, rollback and operational risks.

For code changes, load .context/policies/core/code-quality.md and .context/project/quality.md. Record applicable domain boundaries, structural ceilings, documentation changes, changed-file quality commands and any NOT FOUND tooling. Decompose work by cohesive responsibility rather than arbitrary line count.

Include a subtask table with owners, dependencies, acceptance evidence and wave order. Identify which work can run in parallel and which subagent or reviewer must remain independent.

## Constraints

Reject invented files, APIs, migrations, permissions and architecture. Do not edit implementation files. A subagent receives only its assigned subtask and relevant context.

## Stop when

The plan is decision-complete or a material product, security, ownership or deployment decision remains.
