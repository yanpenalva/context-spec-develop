# Plan: FEAT-9010

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | hiyan | none | prompts + profiles + workflows + INDEX + AGENTS.md carry lazy resolution | 1 | core |
| S2 | hiyan | S1 | classification ordering invariant + interaction cost principle + glossary terms | 2 | core |
| S3 | hiyan | S1 | README, getting-started, quickstart.pt-BR, agent-orchestration.md consistent | 2 | project |
| S4 | hiyan | S2 | tests/test_lazy_startup_interaction.py green | 3 | testing |
| S5 | hiyan | S3,S4 | validator + suite + benchmarks green; CHANGELOG; closure artifacts | 4 | testing |

## Risks and rollback

- Risk: validator `check_orchestration` still requires git_finalization_mode in startup.questions — kept in the list; semantics redefined in orchestration/README.md.
- Risk: docs drift between English canonical and pt-BR — mirrored edits.
- Rollback: single revert; no schema, data or migration impact.

## Test approach

Validator `--strict --examples`; full unit suite; both benchmarks; targeted grep for eager-ask statements remaining.
