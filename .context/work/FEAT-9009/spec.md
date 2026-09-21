# Specification: FEAT-9009

## Objective

Caveman leaves the kit's official optional-tooling surface. Every pointer to it as a shipped tool is removed; the remaining optional tooling (RTK, AI-memory, code-review graph, subtasks-and-waves guidance) is untouched.

## Scope

- Delete `.context/tooling/caveman.md`.
- Remove the Caveman row/mention from: `.context/tooling/README.md`, `AGENTS.md`, `README.md` (2), `docs/quickstart.pt-BR.md`, `docs/customization.md`, `docs/executive-overview.pt-BR.md` (2), `scripts/validate_context.py` (`REQUIRED_FILES` entry).
- Add a 0.2.0 CHANGELOG entry for the removal.
- The historical 0.1.0 CHANGELOG line stays: it records what a past release shipped, and rewriting release history is worse than a stale mention.

## Out of scope

- No change to FEAT-9008's approved scope; the canonical contracts and front-door work are untouched.
- No new tool is added; no schema change.

## Acceptance criteria

1. No non-historical reference to Caveman remains (`grep` finds only the 0.1.0 CHANGELOG history line).
2. `validate_context.py --strict --examples` exit 0; full unit suite green.
3. Remaining tooling set is explicit: RTK, AI-memory, code-review graph, subtasks-and-waves guidance.
