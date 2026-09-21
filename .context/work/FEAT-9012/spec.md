# Specification: FEAT-9012

Documentation-only fix in two files:

- `review-release.md`: early explicit `automatic` preference allowed at any point; otherwise the mode resolves before Git finalization; resolved `automatic` authorizes only validated commit+push for the recorded work item, branch and remote. No authorization rule changed.
- `README.md` Git delivery: "startup authorization" → "resolved Git finalization authorization"; "At conversation start, choose Git finalization" → stated preference reused, otherwise deferred until relevant, `confirm_each` safe fallback.

Out of scope: everything else (schemas, validator, tests, benchmarks, policies' rules, other docs). Acceptance: validator + suite pass; residual-reference grep clean.
