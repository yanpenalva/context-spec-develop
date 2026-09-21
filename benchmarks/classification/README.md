# Classification-Quality Benchmark

Golden-dataset benchmark for classification quality and safety. Provider-neutral: the kit ships fixtures and a scorer; your harness supplies adapter results from whichever executor it chose (same agent, dedicated classifier, hybrid).

## Golden dataset

[`cases.json`](cases.json) defines ten case classes: documentation trivial, local implementation, local bug, cross-module feature, security-sensitive change, database migration, public API change, production/release operation, incident/hotfix, and an ambiguous task that must fall back. Each case stores the task, minimal evidence and the expected outcome — classification, derived routing, context signals, protected signals, fallback expectation. No private reasoning.

## Offline mode (no model required)

```bash
python3 benchmarks/classification/classification_benchmark.py
```

Validates fixtures deterministically: dimension vocabularies, expected routing against `derive_routing`, protected-signal vocabulary, context-signal domain membership.

## Adapter mode

Run your chosen classifier over the cases and supply results in the standalone shape from `.context/classification/classifier-contract.md`:

```json
{
  "case": "security-sensitive-change",
  "classification": {"complexity": "medium", "impact": "module", "security": "relevant", "confidence": "high"},
  "detected_protected_signals": ["security", "authorization"],
  "applied_routing": "extended",
  "fallback": null,
  "context": {"files": 19, "chars": 37248, "domains": ["security", "project", "testing", "architecture"]},
  "runtime": {"input_tokens": null, "output_tokens": null, "cached_input_tokens": null, "latency_ms": null, "cost": null}
}
```

```bash
python3 benchmarks/classification/classification_benchmark.py --results results.json --json
```

## Metrics (independent, no composite score)

- **Classification quality**: exact matches, per-dimension mismatches.
- **Routing**: matches, mismatches, `under_routing` (critical error direction), `false_minimal`.
- **Safety**: missed protected signals, fallback expected but not triggered, malformed results.
- **Efficiency**: context files, characters, domains loaded.
- **Operational**: unexpected fallback rate; latency and classifier failures when supplied.
- **Economics**: classifier/main-agent/total cost when supplied.

The same-agent strategy serves as the baseline: record its adapter results first, then compare dedicated or hybrid executors against it. Dedicated classification is an optimization, never a correctness dependency.

## Status

Observational only; not a release gate. Runtime token, latency and cost fields stay null unless a real run supplies them. The structural context-size benchmark lives in [`benchmarks/run.py`](../run.py).
