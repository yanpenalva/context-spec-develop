# Release: FEAT-9003

## Readiness checklist

- Verification and review approved (`verification.md`, `review.md`).
- Full validation green: validator `--strict --examples` exit 0; 48 unit tests OK.
- No migration required: new work-item objects are optional; the legacy routing shape remains valid; note recorded in `docs/upgrading.md`.
- Security review: not activated (signal `none`; no security boundary touched).

## Migration and data impact

None forced. Consumers adopt the optional `routing` and `context` objects and the context-routing directory through their normal snapshot upgrade; carrying both routing shapes simultaneously fails validation with a precise error.

## Rollback

Single revert; optional contracts only.

## Approvals

- Release authorization for this repository: human owner via `confirm_each`.
- Production authorization: not applicable; this kit deploys nothing.

## Proposed Git finalization

- Changed-file summary: four context-routing contracts, interaction and classification contract updates, schema and validator extension, 18 new tests, template and example migration, the end-to-end example, docs and CHANGELOG, and this work item.
- Proposed Conventional Commit message:

```text
feat(context-routing): add progressive disclosure and split decision state from routing

Add the context-routing layer (catalog, budgets, triggers, manifest) with
validator-enforced invariants: context inclusion requires purpose, extended
routing never loads everything, and budgets bound required domains. Split
decision categories from execution states (BLOCKED is no longer a category)
with formal precedence, and split derived from effective routing with
upward-only human overrides. Migrate templates and examples, document the
flow end to end, and keep legacy work-item shapes valid.
```

## Target and smoke check

Target: this repository's main branch through the normal Git flow. Smoke check: re-run both validation commands after checkout.
