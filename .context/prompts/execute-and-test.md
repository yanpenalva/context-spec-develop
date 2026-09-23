# Prompt Contract: Execute and Test

## Inputs

A READY preflight, approved spec and plan, and project context.

## Produce

The approved change, focused tests and a local progress.md with files changed, contracts, commands, results and pending issues.

Before changing production code, load .context/policies/core/code-quality.md and .context/project/quality.md. Apply the immutable-binding, explicit-type, domain-boundary, no-else/elseif, structural-threshold and documentation defaults to new and directly affected production code. Preserve existing behavior and avoid unrelated legacy refactors. Use a scoped approved exception when a core MUST cannot be met.

Execute one assigned subtask at a time within its wave. If subagents are used, record each handoff, changed boundary and evidence before the integration owner advances the wave.

## Constraints

Implement only the approved scope. Stop if a new assumption or material contract change is required. Never claim a test or quality command passed without running it. Use only tools and thresholds actually configured in project context; record unavailable commands as NOT FOUND. Do not let parallel work hide an unreviewed conflict.

## Completion evidence

Record changed files, documentation updates, quality/test commands, exit status, scope and limitations. If the change is policy/documentation-only, say so and run the repository's required context validator instead of claiming application test coverage.
