# Discovery: Routing authority diagram clarification

## Problem

The authority-chain diagram in `classifier-contract.md` is drawn as a single linear arrow chain, so it can be visually misread as the classifier sitting upstream of override and `applied_routing` — implying routing authority the contract explicitly denies.

## Evidence

- The diagram at `classifier-contract.md` renders override and `applied_routing` as inline chain steps without origins.
- Normative text on the same section is unambiguous; only the visual is at risk.

## Constraints

Documentation-only; no semantics, schema, validator or benchmark change; no new routing concepts.

## Hypothesis

A hierarchical diagram with explicit branch origins (no override / authorized override from the human mechanism per `routing.md`; observation by the benchmark) removes the misreading.

## Success signal

Diagram matches the contract's authority boundaries; suite and validator stay green; no other file touched.
