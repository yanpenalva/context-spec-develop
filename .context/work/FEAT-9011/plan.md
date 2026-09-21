# Plan: FEAT-9011

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | hiyan | none | AGENTS.md closure sentence mode-driven; validator exit 0; suite green | 1 | core |

## Risks and rollback

Wording-only; single revert. No schema, policy or authorization-model change.

## Test approach

`validate_context.py --strict --examples`; `unittest discover -s tests`.
