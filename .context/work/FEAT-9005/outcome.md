# Outcome: FEAT-9005

## Result

Classification is now a pluggable role under a canonical contract:

- `.context/classification/classifier-contract.md` defines the role, minimal input (bootstrap + task + targeted discovery), the canonical output (four dimensions, no routing, no manifest), confidence semantics, the acceptance policy, fifteen protected signals, seven fallback conditions and the fail-safe rule.
- `docs/classifier-strategies.md` documents same-agent (canonical, zero-config), dedicated and hybrid strategies with five provider-neutral diagrams, a guidance matrix and three user journeys.
- `benchmarks/classification/` ships a ten-case golden dataset and an offline-first benchmark: fixture validation is deterministic (also enforced by the validator), and adapter results score on independent classification-quality, safety, efficiency, operational and economic metrics — under-routing and false-minimal recorded as the critical error direction, no composite score.

Invariants hold: model selection ≠ classification contract; classifier role ≠ specific model; classification ≠ routing; routing ≠ context routing; classifier failure ≠ workflow failure.

## Verification evidence

- `python3 scripts/validate_context.py --strict --examples` → exit 0.
- `python3 -m unittest discover -s tests` → 68 tests, OK.
- `python3 benchmarks/run.py` → OK; `python3 benchmarks/classification/classification_benchmark.py` → 10 fixtures passed.
- Vendor-name scan over canonical classification contracts → none.

## Residual risk

- The acceptance policy's protected-signal default (main-agent confirmation) is documented guidance; harnesses configure stricter or looser policies at their own risk, outside kit validation.
- Adapter scoring trusts the harness to supply honest context/runtime fields; the scorer cannot verify omissions.

## Learning

Deriving under-routing from `applied_routing` instead of classifier output kept the deterministic-routing invariant intact while still making the critical error measurable — separation of concerns made the safety metric possible, not harder.

## Closure

Work item complete. Git finalization follows `confirm_each`.
