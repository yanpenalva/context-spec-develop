# Plan: FEAT-9012

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | hiyan | none | Two doc edits applied; consistency grep clean; validator exit 0; suite green | 1 | core |

## Risks and rollback

Wording-only; single revert. No schema, policy-rule or authorization-model change.

## Test approach

`validate_context.py --strict --examples`; `unittest discover -s tests`; targeted greps.
