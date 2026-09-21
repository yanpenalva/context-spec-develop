# Specification: Classification input ordering and applied_routing semantics clarification

## Objective

Make the initial-classification input set unambiguous (task, intake, minimal bootstrap, bounded targeted discovery — nothing more by default) and make `applied_routing` explicitly observational benchmark metadata outside classifier authority.

## In scope

- `.context/classification/README.md` inputs section rewritten: initial classification versus later evidence (reclassification); repository inspection demoted to a targeted-discovery source; project/policy context subject to context routing.
- `.context/classification/classifier-contract.md`: `applied_routing` defined as observational downstream benchmark metadata; authority ordering clarified (classifier → dimensions → derive_routing → derived routing → override → effective → workflow → observation).
- `tests/test_classifier_contract.py`: existing under-routing test extended to assert that upward `applied_routing` observations are not errors.

## Out of scope

- Behavior, schema, validator or scoring changes; new files; strategy-guide rewrites; any vendor/model reference.

## Evidence

- Discovery record; grep of all `applied_routing` and classification-input occurrences.

## Rules and contracts

- Initial classification consumes: user request, intake answers, minimal bootstrap, bounded targeted discovery when necessary.
- Later evidence (loaded domains, runtime, implementation, verification) feeds reclassification, which recalculates routing and the context manifest.
- `applied_routing` records what downstream actually used during an experiment; it MUST NOT be read as routing requested, selected or authorized by the classifier; upward observations are not errors.

## Security impact

None.

## Tests

Extend `test_under_routing_false_minimal_and_mismatch_are_detected` (or a sibling) with an upward-applied observation assertion; all existing tests unchanged otherwise.

## Acceptance criteria

1. README inputs distinguish initial classification from later evidence without contradicting context routing.
2. Contract marks `applied_routing` observational with the authority chain.
3. Tests extended; validator and full suite green; no behavior change.
