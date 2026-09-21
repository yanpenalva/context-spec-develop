# Release: FEAT-9005

## Readiness checklist

- Verification and review approved (`verification.md`, `review.md`).
- Full validation green: validator `--strict --examples` exit 0; 68 unit tests OK; both benchmarks executed.
- No migration required: additive contract file and optional benchmark; same-agent path unchanged.
- Security review: not activated (signal `none`).

## Migration and data impact

None. Consuming projects gain a required contract file on upgrade (validator enforces presence); no work-item or config change is needed.

## Rollback

Single revert; same-agent classification never depended on the new artifacts.

## Approvals

- Release authorization for this repository: human owner via `confirm_each`.
- Production authorization: not applicable.

## Proposed Git finalization

- Changed-file summary: classifier contract, strategy guide with diagrams, golden dataset and scorer, validator vocabulary and fixture checks, 13 tests, documentation updates, and this work item.
- Proposed Conventional Commit message:

```text
feat(classification): add provider-neutral classifier contract and quality benchmark

Define the classifier role, minimal input, canonical output, confidence
semantics, acceptance policy, protected signals, fallback conditions and
fail-safe rule; routing stays deterministic and classifiers never emit
routing or context manifests. Document same-agent, dedicated and hybrid
strategies with diagrams and journeys, ship a ten-case golden dataset with
an offline-first benchmark scoring classification accuracy, routing
accuracy, under-routing, false-minimal, missed protected signals and
fallback behavior, and keep same-agent classification as the zero-config
canonical path.
```

## Target and smoke check

Target: this repository's main branch through the normal Git flow. Smoke check: re-run both validation commands and both benchmarks after checkout.
