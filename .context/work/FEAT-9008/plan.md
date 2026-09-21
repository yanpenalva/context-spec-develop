# Plan: FEAT-9008

Smallest viable change: additive contracts and documentation; one validator list entry; one new test module. No schema change, no engine, no provider.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | hiyan | none | initialize-project.md + start-conversation.md + INDEX.md + AGENTS.md updated; links resolve | 1 | core,project |
| S2 | hiyan | S1 | classification/README.md + classifier-contract.md + context-routing/README.md carry the invariants | 2 | core |
| S3 | hiyan | S1 | README.md, getting-started.md, quickstart.pt-BR.md, classifier-strategies.md, concepts-and-glossary.md, benchmarks/README.md updated | 2 | project |
| S4 | hiyan | S1 | REQUIRED_FILES entry; validator exits 0 --strict --examples | 2 | testing |
| S5 | hiyan | S2,S4 | tests/test_onboarding_front_door.py green; full suite green | 3 | testing |
| S6 | hiyan | S3,S5 | benchmarks run; CHANGELOG entry; work-item artifacts completed | 4 | testing |

## Risks and rollback

- Risk: docs drift between English canonical and pt-BR quickstart — mitigated by mirroring section structure.
- Risk: validator link check rejecting new cross-references — run validator after each doc wave.
- Rollback: single revert of the change set; no data or schema migration involved; new fields optional-by-absence (only a REQUIRED_FILES addition, itself part of the same commit).

## Test approach

- `python3 scripts/validate_context.py --strict --examples`
- `python3 -m unittest discover -s tests`
- `python3 benchmarks/run.py` and `python3 benchmarks/classification/classification_benchmark.py` (must remain green and provider-neutral; structural numbers may shift only because repo files changed — record actuals, no claims).
