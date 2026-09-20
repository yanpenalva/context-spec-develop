# Plan: FEAT-9002

Standard routing. Smallest viable change: one config block, one schema definition, one validator method, one policy sentence, focused docs, four validator tests.

## Approach

Add the `pull_request` block to the orchestration contract with hard guardrails; surface the existing `automatic` finalization mode in the same docs; keep the forge command project-owned so the core kit stays platform-neutral.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave |
| --- | --- | --- | --- | --- |
| S1 | technical-planner | none | Config gains pull_request block; schema defines it; validator enforces guardrails | 1 |
| S2 | technical-planner | S1 | Four validator tests pass; existing 26 tests unaffected | 2 |
| S3 | technical-planner | S1 | Policy sentence, orchestration README, agent-orchestration, customization, README, upgrading, CHANGELOG, close.md updated | 2 |
| S4 | technical-planner | S2, S3 | Full validation green; implementation report written | 3 |

## Rollback

Single revert; the block is optional and absent from existing consumer configs.

## Review and security

Independent review compares spec and diff; security relevance covered by the guardrail checks in verification.

## Operational risks

- A project misconfiguring `automatic` without a command fails validation with a precise error rather than failing at push time.
