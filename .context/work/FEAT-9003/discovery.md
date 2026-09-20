# Discovery: Immediate classification, context routing and progressive disclosure

## Problem

The kit classifies work at intake, but nothing orders classification before detailed context loading, nothing bounds which context is loaded, and nothing defers unrelated contracts. Two known architectural defects also remain: `BLOCKED` sits inside the decision-category list (mixing authority with execution state), and routing has only one value (mixing the derivation from classification with the depth actually in effect after an authorized override).

## Evidence

- `.context/classification/` classifies after intake answers, but no contract says when context may be loaded.
- `interaction/decision-policy.md` lists `BLOCKED` among decision categories and resolves conflicts with the subjective phrase "take the more conservative one".
- `work-item.json` has a single derived routing value; an authorized human upgrade would have to fake a dimension change.
- `plan.md` subtask tables carry inputs and evidence but no context-domain reference; handoff expectations live only in prose.

## Affected audience

Every harness and agent following `AGENTS.md`, and teams adopting the kit that need bounded context behavior.

## Constraints

- Preserve classification, reclassification, routing depths, security and release gates, Git safety, human approval boundaries.
- Backward compatible: existing work items and configs stay valid.
- No tokenizer, telemetry, vendor or model coupling.
- Correctness, safety and evidence outrank context economy: minimum sufficient context, never minimum possible.

## Hypothesis

An immediate-classification ordering rule plus a context-routing layer (catalog, manifest, budgets, triggers), the decision-category/execution-state split and the derived/effective routing split give structural, validator-checkable guarantees without a new engine.

## Expected value

Uniform minimal bootstrap across harnesses; deterministic progressive disclosure; auditable routing overrides; compact handoffs that exclude conversation history.

## Success signal

Validator enforces the new invariants; 30 existing tests pass unchanged; new tests cover decision states, routing overrides, context manifests, handoff columns and compatibility; end-to-end example demonstrates the full flow.
