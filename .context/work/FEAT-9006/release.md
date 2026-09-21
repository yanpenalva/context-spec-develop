# Release: FEAT-9006

## Readiness checklist

- Verification and review approved; validator exit 0; 68 tests OK; classification benchmark 10/10 fixtures.
- Documentation-only refinement; no migration.

## Rollback

Single revert of wording and one test extension.

## Approvals

- Release authorization: human owner via `confirm_each`.

## Proposed Git finalization

```text
docs(classification): clarify initial inputs and applied_routing semantics

Rewrite the classification inputs to distinguish initial classification
(request, intake, minimal bootstrap, bounded targeted discovery) from later
evidence that feeds reclassification, demote repository inspection to a
targeted-discovery source, and define applied_routing as observational
benchmark metadata outside classifier authority.
```

## Target and smoke check

Target: this repository's main branch. Smoke check: re-run validation, tests and classification benchmark after checkout.
