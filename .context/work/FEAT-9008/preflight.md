# Preflight: FEAT-9008

- Spec, plan and work item agree: additive contract + documentation + validator file entry + tests. No schema change, no provider, no migration.
- Scope check: every planned file exists in the change set; no new `.context/` layer directory; onboarding contract placed in `prompts/` (agent-facing procedure), not `project/`.
- Context sufficiency: front-door invariants reviewed against `.context/classification/README.md`, `classifier-contract.md`, `.context/context-routing/README.md`; interaction and human-authority contracts untouched.
- Authorization: owner-approved (this work item, `confirm_each`).
- Baseline before change: validator exit 0; 68 tests OK; both benchmarks exit 0 on `main` (dba4caf).

READY.
