# Prompt Contract: Execute and Test

## Inputs

A `READY` preflight, approved spec and plan, and project context.

## Produce

The approved change, focused tests and a local `progress.md` with files changed, contracts, commands, results and pending issues.

Execute one assigned subtask at a time within its wave. If subagents are used, record each handoff, changed boundary and evidence before the integration owner advances the wave.

## Constraints

Implement only the approved scope. Stop if a new assumption or material contract change is required. Never claim a test passed without running it. Do not let parallel work hide an unreviewed conflict.
