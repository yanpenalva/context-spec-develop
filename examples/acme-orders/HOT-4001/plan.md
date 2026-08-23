# Plan — HOT-4001

Add an idempotency check at the consumer boundary, test duplicate delivery, deploy a small reversible change and observe duplicate-event rate. Rollback restores the previous consumer.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave |
| --- | --- | --- | --- | --- |
| HOT-4001-S1 | senior-software-engineer | none | Duplicate delivery test passes | 1 |
| HOT-4001-S2 | devops-release-engineer | HOT-4001-S1 | Smoke and observation evidence | 2 |

Integration owner: team. Subagents return diff and exact test evidence to the parent.
