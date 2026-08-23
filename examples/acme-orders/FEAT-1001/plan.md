# Plan — FEAT-1001

Add the delivery-window field to the existing status contract, render it with an explicit fallback, add unit and acceptance tests, and release behind the existing feature mechanism. Rollback is disabling the flag.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave |
| --- | --- | --- | --- | --- |
| FEAT-1001-S1 | product-engineer | none | Contract tests pass | 1 |
| FEAT-1001-S2 | senior-software-engineer | FEAT-1001-S1 | Unit and acceptance tests pass | 2 |

Integration owner: team. Subagents return diff and exact test evidence to the parent.
