# Discovery: Classification input ordering and applied_routing semantics clarification

## Problem

Two documentation ambiguities survive from FEAT-9005: the classification README lists repository inspection and project/policy context as classification inputs without the bootstrap-first ordering, inviting premature context expansion; and `applied_routing` in the classifier contract is not explicitly marked as observational benchmark metadata that never belongs to classifier authority.

## Evidence

- `.context/classification/README.md` inputs section (lines 17-18) versus the bootstrap-first contract in `classifier-contract.md` and `context-routing/README.md`.
- `classifier-contract.md` standalone-result paragraph describes `applied_routing` but does not state its observational-only authority boundary.

## Affected audience

Harness authors reading the classification contracts; benchmark consumers interpreting `applied_routing`.

## Constraints

- Documentation-only refinement; no runtime, schema or validator behavior change.
- Preserve classification-before-expansion, targeted-discovery semantics, deterministic routing, provider neutrality.

## Hypothesis

Rewording the inputs section into initial-classification versus later-evidence, and qualifying `applied_routing` as observational metadata, removes both ambiguities without touching behavior.

## Expected value

Readers cannot infer "load repository/project/policies before classifying"; benchmark consumers cannot attribute routing authority to the classifier.

## Success signal

Both files updated; existing tests extended (not duplicated); validator and full suite green; behavior unchanged.
