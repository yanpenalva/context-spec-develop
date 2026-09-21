# Plan: Provider-neutral classifier contract and classification benchmark

Routing is `extended` (cross-module contract surface). No new architectural layer: the classifier contract lives inside `.context/classification/`; the benchmark extends `benchmarks/`.

## Approach

Write the classifier contract (role, minimal input, canonical output, confidence semantics, acceptance policy, protected signals, fallback, fail-safe, standalone result shape); document strategies with diagrams; ship the golden dataset and offline-first scorer; wire deterministic fixture validation into the validator; keep same-agent zero-config.

## Dependencies and analysis

- The contract, the validator vocabulary (`PROTECTED_SIGNALS`) and the benchmark scorer must share one source: constants live in the validator; the benchmark imports them; the contract documents them.
- Classifier output must not contain routing or a manifest; under-routing is measured via the adapter's `applied_routing`, not by letting the classifier choose routing.
- Golden cases must satisfy `derive_routing` so the validator and benchmark agree on every expectation.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | technical-planner | none | Classifier contract exists; classification README links it; no vendor names | 1 | core |
| S2 | technical-planner | S1 | Strategy guide with all five diagrams, matrix and journeys | 2 | core,project |
| S3 | technical-planner | S1 | Golden dataset (10 cases) + offline benchmark pass; adapter scoring with independent metrics | 2 | core,project |
| S4 | technical-planner | S3 | Validator: required contract file, protected-signal vocabulary, deterministic fixture checks | 3 | core,project |
| S5 | technical-planner | S3 | 13 new tests pass; all 55 prior tests unchanged | 3 | core,project,testing |
| S6 | technical-planner | S4 | README, benchmarks README, glossary, CHANGELOG, upgrading updated; full validation green | 4 | core,project |

## Rollback

Single revert. Same-agent path never depended on any of it; no schema change.

## Review and security

Independent review compares spec, diff and evidence. Security signal `none`; protected-signal vocabulary is documentation-plus-validation only.

## Operational risks

- Adapter result shape could drift from the contract; the scorer rejects malformed results and the contract documents the shape.
