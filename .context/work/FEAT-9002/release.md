# Release: FEAT-9002

## Readiness checklist

- Verification and review approved (`verification.md`, `review.md`).
- Full validation green: validator `--strict --examples` exit 0; 30 unit tests OK.
- No migration required: `pull_request` block optional; absent block keeps current behavior.
- Security review: the security signal is `relevant`; guardrails (schema const, forbidden command fragments, mode coupling) are the recorded mitigation and are validator-enforced. Independent security reviewer not activated: no sensitive-data or production boundary is touched by a documentation-and-tooling change in the kit itself.

## Migration and data impact

None. Consumers adopt the block only when they want PR automation.

## Rollback

Single revert; optional block.

## Approvals

- Release authorization for this repository: human owner via `confirm_each` (separate commit and push approvals).
- Merging any resulting pull request: human decision, by policy and by validator guardrail.

## Proposed Git finalization

- Changed-file summary: orchestration config and schema, validator, tests, policy, seven documentation files, and this work item.
- Proposed Conventional Commit message:

```text
feat(orchestration): add pull-request option with validator guardrails

Add the optional pull_request block (never, manual, automatic) to the
orchestration contract. The validator enforces that merging always stays a
human decision, rejects merge/force/admin/rebase fragments in the project PR
command, and requires automatic Git finalization plus a configured command
for automatic mode. Document the block alongside the existing automatic
commit-and-push finalization mode.
```

## Target and smoke check

Target: this repository's main branch through the normal Git flow. Smoke check: re-run both validation commands after checkout.
