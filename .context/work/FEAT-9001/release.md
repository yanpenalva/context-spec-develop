# Release: FEAT-9001

## Readiness checklist

- Verification and review approved: see `verification.md`, `review.md`.
- Full validation green: `python3 scripts/validate_context.py --strict --examples` exit 0; `python3 -m unittest discover -s tests` 26 OK.
- No migration required: new work-item fields are optional; existing items stay valid.
- Security review: not activated (security signal `none`; no security boundary touched).
- Feature flags, communication and observation window: not applicable — this repository is a template kit; there is no production deployment or runtime to observe.

## Migration and data impact

None. Template consumers adopt the optional fields and contract directories through their normal snapshot upgrade (`docs/upgrading.md` records the note). No data changes.

## Rollback

Single revert of the change set. No generated data, no schema-enforced migration: work items created meanwhile remain valid because `classification` and `reclassification` are optional.

## Approvals

- Release authorization for this repository's content: human owner, per `git_finalization_mode=confirm_each` (separate approval before commit and before push).
- Production authorization: not applicable; this kit deploys nothing. Consumers authorize their own production changes.

## Proposed Git finalization

- Changed-file summary: two new contract directories (10 files), schema and validator extension, template updates, prompt/INDEX/AGENTS pointers, docs and CHANGELOG updates, three new examples, four updated examples, six new validator tests, and this work item.
- Proposed Conventional Commit message:

```text
feat(classification): add declarative classification layer and interaction protocol

Add .context/classification/ (complexity, impact, security, confidence and
deterministic routing depth) and .context/interaction/ (decision categories,
questioning format, uncertainty model and escalation contract) as canonical
agent-neutral contracts. Extend the work-item schema and validator with the
optional classification object, bounded reclassification entries and routing
derivation checks; update templates, prompts, examples, docs and tests.
```

## Target and smoke check

Target: this repository's main branch through the normal Git flow. Smoke check: re-run the two validation commands after checkout; both must pass.
