# Plan: FEAT-9013

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | senior-software-engineer | none | Skill, assets and package contracts are present | 1 | core, project |
| S2 | senior-software-engineer | S1 | CLI install/update/remove/doctor pass temporary-project tests | 2 | core, testing, security |
| S3 | senior-software-engineer | S2 | All activation adapters pass path/content contracts | 3 | core, testing |
| S4 | senior-software-engineer | S1 | Registry and catalog generation are deterministic | 3 | core |
| S5 | senior-software-engineer | S2, S3, S4 | CI, docs and full validation pass | 4 | core, testing, security |

## Rollback

Remove the package/skill/CI additions and revert only the validator exclusions required for generated package assets. Existing canonical `.context/` contracts remain unchanged.

## Review and security

Review installer path confinement, lockfile ownership, overwrite/force behavior, packaged asset completeness and release permissions. No external publication or deployment is authorized by this work item.
