# Complexity

Complexity measures how hard the change is to carry out correctly. It is independent of impact (blast radius) and of risk (consequence). Classify from objective criteria, never from line counts or file counts alone.

## Values

| Value | Meaning |
| --- | --- |
| `low` | Single mechanism, one local behavior change, few interacting parts, trivially validatable and reversible. |
| `medium` | Several interacting parts or one non-trivial mechanism; coordination across a few subtasks; validation needs designed tests. |
| `high` | Cross-cutting behavior, architectural change, concurrency or persistence semantics, external integrations, or validation that requires coordinated evidence across many subtasks. |

## Criteria

Weigh these signals; a single `high` signal is sufficient for `high`. Multiple `medium` signals indicate at least `medium`.

- **Change surface**: number of distinct behaviors and contracts touched (not file count).
- **Dependencies**: coupling between the change and other components or teams.
- **Cross-module behavior**: state or invariants spanning module boundaries.
- **Architecture**: pattern, boundary or protocol changes versus local edits inside an existing pattern.
- **Concurrency**: parallelism, locking, idempotency or ordering concerns.
- **Persistence**: schema, migration or data-integrity semantics.
- **External integrations**: third-party or network contracts that cannot be fully controlled in tests.
- **Subtask coordination**: how many dependency-ordered waves the decomposition needs.
- **Reversibility**: difficulty of undoing the change once applied.
- **Validation difficulty**: effort to prove correctness with real evidence.

## Non-signals

- Lines of code or number of files by themselves.
- Urgency (that belongs to support `type` and `severity`).
- Who performs the work.

## Examples

- Copy edit inside one function with existing tests: `low`.
- New endpoint with validation, tests and docs inside one module: `medium`.
- Splitting a module into two services with shared persistence and contract migration: `high`.
