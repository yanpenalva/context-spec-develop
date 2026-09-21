# Outcome: FEAT-9010

Startup interaction is now demand-driven: the front door runs before any optional configuration, and profile/Git-mode/role decisions resolve just-in-time with explicit choices and recorded preferences reused first. Applied to itself: session decisions were reused instead of re-asked.

## Residual risk

- External harnesses may still prompt for profile/Git before reading AGENTS.md; the kit cannot suppress that (documented boundary in docs/agent-compatibility.md and README).
- `agent_profiles.selection_required: true` remains in config.json with resolution (asked-or-default) satisfying it; documented in orchestration/README.md.

## Follow-up work

- Optional: add a benchmark scenario class measuring interaction count across a full work item (context benchmark currently counts context only; `questions_expected` already exists per scenario).
