# Outcome: FEAT-9004

## Result

The bootstrap is now a first-class, domain-independent contract: entrypoint and index files belong to it, `core` covers only post-bootstrap governance, and no domain is mandatory in every manifest. `project` promotes on project-specific work, `testing` promotes by phase or task, governance rides in the bootstrap and promotes `core` when needed. Targeted discovery is formally distinct from domain loading, and mandatory policy is formally distinct from mandatory full-document loading.

The benchmark makes the promised context economy measurable: five scenario classes, a documented eager baseline (37 files) versus routed behavior (bootstrap plus required-domain sources), deterministic context-size metrics. Measured on this repository state: totals 226030 → 160630 chars (28.9% context-size reduction); per scenario B1 44.9%, B2 28.5%, B3 28.5%, B4 25.1%, B5 17.6%. These are character/file measurements — no token claims; runtime token slots remain null.

## Verification evidence

- `python3 scripts/validate_context.py --strict --examples` → exit 0.
- `python3 -m unittest discover -s tests` → 55 tests, OK.
- `python3 benchmarks/run.py` → executed; results in `benchmarks/results/latest.json`.

## Residual risk

- Governance now depends on the bootstrap being honored; the bootstrap contract is explicit, but a harness that skips it loses the pre-classification boundaries — same trust model as before, now concentrated.
- Structural metrics are proxy measurements; real token behavior requires the future runtime-metrics integration (documented, not built).

## Learning

Making the catalog the single machine-readable source (names for the validator, source paths for the benchmark) caught the shorthand-path defect immediately. Keep measurement machinery reading the same contracts the validator enforces.

## Closure

Work item complete. Git finalization follows `confirm_each`.
