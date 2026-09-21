# Release: FEAT-9010

## Validation evidence

See `verification.md`: validator exit 0; 83 tests OK; both benchmarks green.

## Changed-file summary

Contracts/prompts: `AGENTS.md`, `.context/prompts/start-conversation.md`, `.context/prompts/intake.md`, `.context/prompts/close.md`, `.context/profiles/README.md`, `.context/profiles/delivery-orchestrator.md`, `.context/workflows/core.md`, `.context/INDEX.md`, `.context/orchestration/README.md`, `.context/classification/README.md`, `.context/interaction/README.md`.
Docs: `docs/concepts-and-glossary.md`, `README.md`, `docs/getting-started.md`, `docs/quickstart.pt-BR.md`, `docs/agent-orchestration.md`.
Tests/work item: `tests/test_lazy_startup_interaction.py` (new), `.context/work/FEAT-9010/`, `CHANGELOG.md`.

## Proposed Conventional Commit

```text
feat(interaction): make startup configuration lazy behind the front door
```

Body: classification/routing/context routing now precede optional configuration; profile resolves explicit > recorded > configured default (ask only material); git_finalization_mode resolves before the first Git action (unresolved never authorizes; confirm_each safe fallback); role overrides only on request/invalidity. Ordering invariant and interaction-cost principle documented; 9 focused tests. No schema or validator structural change, no migration.

## Rollback

Single revert of the change set. No data or schema migration.
