# Release: FEAT-9004

## Readiness checklist

- Verification and review approved (`verification.md`, `review.md`).
- Full validation green: validator `--strict --examples` exit 0; 55 unit tests OK; benchmark executed with results recorded.
- No migration required: manifests remain optional; legacy shapes valid; semantic change documented in `docs/upgrading.md`.
- Security review: not activated (signal `none`).

## Migration and data impact

None forced. The mandatory-domain removal is a contract semantic change; existing larger manifests stay valid.

## Rollback

Single revert; benchmark is observational and self-contained.

## Approvals

- Release authorization for this repository: human owner via `confirm_each`.
- Production authorization: not applicable.

## Proposed Git finalization

- Changed-file summary: context-routing contract refinements, validator and tests, benchmark suite with measured results, example and documentation updates, and this work item.
- Proposed Conventional Commit message:

```text
feat(context-routing): separate bootstrap from domains and add context benchmark

Define the minimal bootstrap contract (entrypoint, index, classification and
interaction cores, catalog, pre-classification governance) as distinct from
context domains, narrow core to post-bootstrap governance, and make project
and testing lazy through explicit trigger and phase promotions. Remove the
mandatory-domain validator check in favor of bootstrap-carried governance,
distinguish targeted discovery from domain loading, and add a reproducible
vendor-neutral benchmark measuring eager-baseline versus routed context size
across five scenario classes with measured, non-fabricated results.
```

## Target and smoke check

Target: this repository's main branch through the normal Git flow. Smoke check: re-run both validation commands and `python3 benchmarks/run.py` after checkout.
