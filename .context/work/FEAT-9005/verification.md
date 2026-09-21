# Verification: FEAT-9005

## Evidence

Commands at closure, repository root:

- `python3 scripts/validate_context.py --strict --examples` → exit 0.
- `python3 -m unittest discover -s tests` → `Ran 68 tests ... OK`.
- `python3 benchmarks/run.py` → executed, OK.
- `python3 benchmarks/classification/classification_benchmark.py` → `fixtures: 10 cases, passed`, exit 0.

## Acceptance criteria check

1. Contract and strategy guide documented with provider-neutral diagrams (boundary, Mode A, Mode B, Mode C, complete flow). Pass.
2. Golden dataset covers the ten required case classes; offline validation passes. Pass.
3. Adapter scoring reports independent metrics (classification exact/mismatched, routing match/mismatch, under-routing, false-minimal, missed protected signals, fallback counts, malformed) with no composite score. Pass.
4. Same-agent path unchanged and zero-config; vendor-name scan over canonical classification contracts finds none. Pass.
5. All prior tests pass unchanged; 13 new tests pass; validator green. Pass.
6. No token-percentage claims anywhere. Pass.

## Regressions

None. No schema changes; work items untouched; all 55 prior tests pass.

## Correctness notes

- Under-routing via classifier output is structurally impossible (output has no routing field); the measured direction is `applied_routing` from the adapter, which the scorer flags below the golden derived routing.
- The scorer imports `derive_routing`, `CLASSIFICATION_ENUMS` and `PROTECTED_SIGNALS` from the validator — one source for vocabularies and derivation.

## Limitations

- Adapter scoring only sees what the harness supplies; a harness can omit unflattering context fields (noted in benchmark README).
- Same-session review; see `review.md`.
