# Classifier Contract

The kit defines the classification contract. The user and harness choose the executor. Any executor — the main agent, a subagent, a dedicated classifier, a rule-based helper — may produce the classification, provided the result satisfies this contract. Execution strategy lives in the harness; it never appears in canonical configuration.

```text
MODEL SELECTION  != CLASSIFICATION CONTRACT
CLASSIFIER ROLE  != SPECIFIC MODEL
CLASSIFICATION   != ROUTING
ROUTING          != CONTEXT ROUTING
CLASSIFIER FAILURE != WORKFLOW FAILURE
DEDICATED CLASSIFIER = OPTIONAL OPTIMIZATION
```

## Role and responsibilities

The classifier describes the work. It produces the four classification dimensions from minimal evidence. It MUST NOT:

- choose routing (routing is derived deterministically from the dimensions);
- produce the context manifest (context routing owns that; the classifier may supply evidence that feeds it);
- assign agents, models or providers;
- authorize gates or replace planning;
- invent requirements, files or test results.

## Input

Minimal sufficient input only:

```json
{
  "task": "the user request",
  "bootstrap": "the minimal bootstrap summary (see .context/context-routing/README.md)",
  "targeted_discovery": ["minimal facts gathered to classify safely"]
}
```

The classifier MUST NOT automatically receive the full repository, the full conversation, all policies, all project context, all workflows or previous agents' reasoning. Targeted discovery — filenames, symbols, metadata, a single route inspection — is allowed and is distinct from domain loading. Classification happens before context expansion.

## Output

The canonical classification object, reusing the work-item contract — no second representation:

```json
{
  "classification": {
    "complexity": "low|medium|high",
    "impact": "local|module|cross-module|system",
    "security": "none|relevant|sensitive",
    "confidence": "low|medium|high"
  }
}
```

`risk`, `track` and `type` are intake answers and remain outside the classifier output unless the harness supplies them as evidence. The output MUST NOT contain routing, effective routing or a context manifest: routing is derived by `derive_routing` from the dimensions, so the same classification always yields the same derived routing regardless of which executor produced it.

## Confidence semantics

Confidence expresses trust in the classification given the available evidence — never confidence that implementation will succeed, and never trust in a model in general.

| Value | Operational meaning |
| --- | --- |
| `high` | Direct evidence observed for every dimension; no material unknowns remain. |
| `medium` | At least one dimension is a reasoned inference from named evidence; no protected ambiguity remains. |
| `low` | A key dimension is uncertain or unsupported; the result is not acceptable without fallback. |

Low confidence is not a guess: under the acceptance policy it routes the point to the canonical same-agent path.

## Acceptance policy

A dedicated-classifier result is accepted only when all hold:

1. **Structural validity** — dimensions present, values inside the closed vocabularies.
2. **Confidence** — `medium` or `high`. `low` never passes alone.
3. **Protected signals** — none of the protected signals below requires main-agent confirmation under the harness's policy.
4. **No fallback condition** — see the list below.

Protected signals — signals that demand conservative handling (additional evidence, main-agent confirmation, or an existing human gate) but do not by themselves mean the classification is wrong:

```text
security, privacy, authentication, authorization,
production, deployment, migration,
destructive operation, irreversible operation,
public contract, external integration,
cross-module impact, system impact,
incident, hotfix
```

Fallback conditions — any one routes the point to the canonical same-agent path:

```text
invalid or malformed output
low confidence
material unresolved uncertainty (uncertainty.md)
contradictory evidence
protected signal requiring confirmation
insufficient targeted discovery to classify safely
classification cannot be derived safely
```

Fallback is never vendor-specific: the target is always the same-agent canonical classification, which is always available.

## Fail-safe

Failure of an optional classifier optimization must not prevent the canonical workflow from operating. If the dedicated classifier fails, times out, returns malformed output or is unavailable, the harness falls back to same-agent classification and work continues. The dedicated classifier is an optimization layer, not a correctness dependency.

## Standalone result shape (benchmarks and adapters)

When a harness runs a classifier outside a work item and feeds the result to the classification benchmark, the result uses this shape — separate from the work item, mirroring the same dimension vocabularies:

```json
{
  "case": "golden-case-id",
  "classification": {"complexity": "low", "impact": "local", "security": "none", "confidence": "high"},
  "detected_protected_signals": [],
  "applied_routing": null,
  "fallback": null,
  "context": {"files": 6, "chars": 24925, "domains": []},
  "runtime": {"input_tokens": null, "output_tokens": null, "cached_input_tokens": null, "latency_ms": null, "cost": null}
}
```

`classification` is present only for accepted results; `fallback` (with a reason) is present when the classifier path deferred to the main agent; `applied_routing` records the routing actually used downstream, for under-routing measurement; every `runtime` field is optional and nullable, supplied only by real runs.
