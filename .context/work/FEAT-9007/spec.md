# Specification: Routing authority diagram clarification

## Objective

Replace the linear authority-chain diagram in `classifier-contract.md` with a hierarchical one that visually ends classifier authority at CLASSIFICATION, shows override originating from the authorized human mechanism (per `routing.md`), and shows `applied_routing` as post-workflow benchmark observation with no authority.

## In scope

- The single diagram block and, at most, one summary line ("classifier decides / system derives / authorized mechanism may affect / benchmark observes").

## Out of scope

- Any semantic, schema, validator, benchmark or behavior change; any other diagram (checked: `docs/classifier-strategies.md` and `routing.md` carry no such ambiguity).

## Rules and contracts

- Classifier authority ends at CLASSIFICATION.
- `derive_routing()` computes DERIVED ROUTING deterministically.
- EFFECTIVE ROUTING results from no-override or an authorized override (human, per `routing.md`) — never classifier-originated.
- `applied_routing` observes the workflow afterwards; benchmark metadata only.

## Security impact

None.

## Tests

Existing suite only; no new tests for ASCII formatting.

## Acceptance criteria

1. New diagram matches the §13 target representation and the contract text.
2. No other file changed; suite and validator green.
