# Release: FEAT-9007

## Readiness checklist

- Verification and review approved; validator exit 0; 68 tests OK; classification benchmark 10/10.
- Documentation-only; no migration.

## Rollback

Single revert of one diagram block.

## Approvals

- Release authorization: human owner via `confirm_each`.

## Proposed Git finalization

```text
docs(classification): clarify routing authority diagram

Replace the linear authority chain with a hierarchical diagram: classifier
authority ends at classification, derived routing comes from the
deterministic derivation, effective routing branches through no-override or
the authorized human override, and applied_routing is post-workflow
benchmark observation with no authority.
```

## Target and smoke check

Target: this repository's main branch. Smoke check: re-run validation and tests after checkout.
