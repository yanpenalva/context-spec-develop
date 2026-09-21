# Release: FEAT-9009

## Validation evidence

See `verification.md`: grep clean outside CHANGELOG history; validator exit 0; 74 tests OK; both benchmarks green.

## Changed-file summary

Deleted: `.context/tooling/caveman.md`. Modified: `.context/tooling/README.md`, `AGENTS.md`, `README.md`, `scripts/validate_context.py`, `docs/quickstart.pt-BR.md`, `docs/customization.md`, `docs/executive-overview.pt-BR.md`, `CHANGELOG.md`. Work item: `.context/work/FEAT-9009/`.

## Proposed Conventional Commit

```text
chore(tooling): remove caveman from official optional tooling
```

## Rollback

Single revert of the change set. No data or schema migration.
