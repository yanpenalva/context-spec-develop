# Discovery: Provider-neutral classifier contract and classification benchmark

## Problem

The classification layer states it is implementation-independent, but no contract defines how an executor other than the main agent may produce the classification, when its result may be accepted, when it must fall back, or how classification quality would be measured. Teams running high volumes of small tasks cannot adopt a lightweight classifier without inventing their own unvalidated protocol.

## Evidence

- `.context/classification/README.md` notes only that "an external classifier may produce the same structured output".
- No acceptance policy, protected-signal vocabulary, fallback conditions or fail-safe rule exists.
- `benchmarks/` measures context size (B1–B5) but nothing about classification quality or safety (under-routing, missed protected signals).
- No operational documentation or diagrams explain the same-agent/dedicated/hybrid choices.

## Affected audience

Harness authors choosing execution strategies; teams with expensive main-agent context; future classifier experiments needing a golden baseline.

## Constraints

- Provider- and model-neutral: no model, provider, API, runtime or pricing in canonical contracts.
- No new architectural layer: the contract belongs to `.context/classification/`.
- Same-agent classification remains the zero-config canonical path.
- Routing stays deterministic; the classifier never emits routing or a context manifest.
- Under-classification (false minimal) is the critical error direction.

## Hypothesis

A small classifier contract (input, output, acceptance policy, protected signals, fallback, fail-safe), operational documentation with diagrams, and a golden-dataset quality benchmark let any harness choose an executor safely.

## Expected value

Pluggable classification without protocol divergence; measurable classification quality and safety; a baseline for future cheap-classifier experiments.

## Success signal

Contract and guidance documented with diagrams; golden dataset covers ten case classes; offline benchmark validates fixtures and derives routing; adapter results scored on quality/safety metrics; same-agent path untouched and all prior tests pass.
