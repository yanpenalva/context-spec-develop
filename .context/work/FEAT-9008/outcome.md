# Outcome: FEAT-9008

## What was learned

- The protocol already enforced classification-before-context; the gap was naming it. Making the front door explicit cost only contract prose — no engine, no schema.
- The public-package marker scan doubles as a project-neutrality guard: framework-name examples in canonical contracts are rejected by design.
- Structural benchmark totals moved (26.4% → 19.0%) purely from added canonical files entering the eager baseline; useful reminder that the metric tracks the repository, not adoption behavior.

## Residual risk

- Kits whose harness never reads `AGENTS.md` gain nothing; documented as a boundary, not solvable inside the kit.
- Onboarding quality depends on the executing agent's discipline in bounded discovery; the contract bounds it, validation confirms structure, only humans can confirm fact quality.

## Follow-up work

- Optional runtime experiment: dedicated lightweight classifier executor vs same-agent, measured by `benchmarks/classification/` (safety must not degrade).
- Optional: extend context benchmark scenarios with an onboarding-discovery scenario class.
