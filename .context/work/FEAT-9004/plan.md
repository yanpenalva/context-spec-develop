# Plan: Bootstrap separation, lazy domains and context benchmark

Routing is `extended` (cross-module contract changes). No new architectural layer: all changes refine existing contracts, the validator, tests and a new observational benchmark directory.

## Approach

Define the bootstrap inside the existing context-routing README; move entrypoint files out of `core`; demote project/testing to trigger/phase promotion; remove the mandatory-domain validator check in favor of bootstrap-carried governance; add `benchmarks/` with a documented eager baseline and five scenario classes; measure real results; document everything.

## Dependencies and analysis

- Catalog source paths become repo-root relative so the benchmark can resolve them; the catalog stays the single source for domain names and benchmark source mapping.
- Validator mandatory-core removal and helper change must land with their test updates.
- Benchmark scenarios must satisfy validator semantics (budget equals routing, disjointness, maxima) so examples and benchmark agree.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | technical-planner | none | Bootstrap contract, catalog, budgets and triggers refined; entrypoint duplication removed | 1 | core |
| S2 | technical-planner | S1 | Validator: mandatory check removed, lazy defaults, tests updated and green | 2 | core,project |
| S3 | technical-planner | S1 | benchmarks/ implemented; run executes five scenarios; results saved with repository state | 2 | core,project |
| S4 | technical-planner | S2 | End-to-end example shows trivial scenario; README, glossary, CHANGELOG, upgrading updated | 3 | core,project |
| S5 | technical-planner | S2, S3 | Full validation green; benchmark smoke tests pass; diff reviewed | 3 | core,project,testing |

## Rollback

Single revert. The context object remains optional; legacy manifests stay valid; benchmark is observational.

## Review and security

Independent review compares spec, diff and evidence. Security signal `none`.

## Operational risks

- Benchmark baseline file set is a documented constant; projects with different eager habits should adjust `BASELINE_FILES` and document the change.
- Removing mandatory core shifts governance weight onto the bootstrap; the bootstrap contract and its invariant are the mitigation, and `core` remains the default governance promotion.
