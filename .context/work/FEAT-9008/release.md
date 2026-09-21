# Release: FEAT-9008

## Validation evidence

See `verification.md`: validator `--strict --examples` exit 0; 74 unit tests OK; context benchmark exit 0 (structural, 19.0% char reduction, tokens null); classification benchmark exit 0 (10 fixtures).

## Changed-file summary

Contracts: `.context/prompts/initialize-project.md` (new), `.context/prompts/start-conversation.md`, `.context/INDEX.md`, `.context/classification/README.md`, `.context/classification/classifier-contract.md`, `.context/context-routing/README.md`.
Entry points: `AGENTS.md`.
Docs: `README.md`, `docs/getting-started.md`, `docs/quickstart.pt-BR.md`, `docs/classifier-strategies.md`, `docs/concepts-and-glossary.md`, `docs/agent-compatibility.md`, `benchmarks/README.md`.
Validator/tests: `scripts/validate_context.py` (one REQUIRED_FILES entry), `tests/test_onboarding_front_door.py` (new).
Work item: `.context/work/FEAT-9008/`. `CHANGELOG.md` entry.

## Proposed Conventional Commit

```text
feat(onboarding): add agent-assisted project initialization and intrinsic front-door invariants
```

Body: canonical onboarding contract (`prompts/initialize-project.md`) with bounded repository discovery, NOT FOUND semantics and idempotent re-runs; front-door invariants (classification/routing/context routing mandatory, executor optional, same-agent zero-config default); strong SHOULD-level pre-classification loading invariant with targeted discovery preserved; structural context economy boundary; zero schema changes, no migration.

## Rollback

Single revert of the change set. No data, no schema migration; existing work items and project contexts unaffected.

## Migration

None required. Adopters with populated context keep it; re-running onboarding is a documented, evidence-preserving refresh.
