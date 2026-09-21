# Classifier Strategies

How to execute classification with any harness. The canonical contract is [`.context/classification/classifier-contract.md`](../.context/classification/classifier-contract.md); this page is operational guidance, not policy.

## Principle

```text
THE KIT DEFINES THE CONTRACT.
THE USER/HARNESS CHOOSES THE EXECUTOR.
```

The kit governs the protocol: classification contract, output schema, routing derivation, confidence semantics, fallback rules, validation, benchmark methodology. The harness governs execution: which agent, model, runtime or strategy produces the result. No model or provider is required by, or named in, the kit.

## Responsibility boundary

```text
┌──────────────────────────────────────────────┐
│          context-spec-develop                │
│                                              │
│  Defines:                                    │
│  • classifier contract                       │
│  • classification schema                     │
│  • routing rules (deterministic)             │
│  • fallback rules                            │
│  • validation                                │
│  • benchmark methodology                     │
└───────────────────────┬──────────────────────┘
                        │ contract
                        ▼
────────────────────────────────────────────────
             USER / HARNESS BOUNDARY
────────────────────────────────────────────────
                        │
            chooses execution strategy
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
     same agent      subagent    external/local
       (Mode A)       (Mode B)      (Mode B/C)
```

## Mode A — Same-agent classification (canonical, zero-config)

```text
USER
 │
 ▼
MAIN AGENT
 │
 ├─ minimal bootstrap
 ├─ classify
 ├─ validate
 ├─ derive routing
 └─ build context manifest
 │
 ▼
EXECUTION
```

Simplest setup: no additional executor, no configuration. Works with every compatible harness. Cost: classification consumes main-agent context. This path is always valid and is the fallback for every other mode.

## Mode B — Dedicated classifier

```text
USER
 │
 ▼
CLASSIFIER  (a role, not a specific model)
 │
 │ structured classification
 ▼
VALIDATOR  (structure + acceptance policy)
 │
 ▼
DETERMINISTIC ROUTER  (derive_routing)
 │
 ▼
CONTEXT ROUTER  (context manifest)
 │
 ▼
MAIN AGENT
 │
 ▼
EXECUTION
```

The classifier is a **role** the harness fills — a subagent, a cheap model, a small local model or a rule-based helper. The kit never chooses the model. Useful when main-agent context is expensive or task volume is high: the classifier works from the bootstrap plus the task plus targeted discovery, and the main agent receives the validated classification instead of performing the investigation.

## Mode C — Hybrid classification with fallback

```text
TASK
 │
 ▼
LIGHTWEIGHT CLASSIFIER
 │
 ▼
VALIDATE RESULT  (+ protected signals, confidence)
 │
 ▼
ACCEPTABLE?
 ├──────────── YES ──────────────┐
 │                               ▼
 NO                         CONTINUE
 │
 ▼
MAIN-AGENT CLASSIFICATION
 │
 ▼
CONTINUE
```

The lightweight executor handles easy cases; anything with low confidence, malformed output or a protected signal needing confirmation falls back to the main agent. Guidance, never obligation.

## Complete context-efficient flow

```text
                         USER TASK
                             │
                             ▼
                    MINIMAL BOOTSTRAP
                             │
                             ▼
                    CLASSIFIER ROLE
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
            CLASSIFICATION         UNCERTAINTY
                  │                     │
                  └──────────┬──────────┘
                             ▼
                    ACCEPTANCE POLICY
                             │
                 ┌───────────┴───────────┐
                 │                       │
              ACCEPT                  FALLBACK
                 │                       │
                 │                       ▼
                 │               MAIN-AGENT PATH
                 │                       │
                 └───────────┬───────────┘
                             ▼
                    DERIVED ROUTING
                             │
                             ▼
                    CONTEXT ROUTING
                             │
                             ▼
                    CONTEXT MANIFEST
                             │
                             ▼
                  LOAD REQUIRED ONLY
                             │
                             ▼
             SPECIFY → PLAN → EXECUTE
                             │
                             ▼
                          VERIFY
                             │
                    new evidence?
                       /          \
                     no            yes
                     │              │
                     ▼              ▼
                  continue      RECLASSIFY
                                    │
                                    ▼
                              EXPAND CONTEXT
```

## Fallback conditions and fail-safe

Fallback to the same-agent path when: output is invalid or malformed; confidence is low; material uncertainty is unresolved; evidence conflicts; a protected signal requires confirmation; targeted discovery was insufficient; or the classification cannot be derived safely. A classifier that fails, times out or is unavailable never blocks work — same-agent classification is always available. See the acceptance policy in the classifier contract.

## What the kit guarantees versus what you configure

| The kit guarantees | The harness/user configures |
| --- | --- |
| The classification schema and vocabularies | Which executor fills the classifier role |
| Deterministic routing from dimensions | Model, runtime, subscription, local/cloud execution |
| Acceptance policy, protected signals, fallback | When to prefer dedicated or hybrid strategies |
| Validation of structure | API/keys/credentials (never in the kit) |
| Golden-dataset benchmark methodology | Running the benchmark against chosen executors |

Desirable classifier characteristics — fast, low cost, structured-output capable, reliable on the classification schema, sufficient context window for bootstrap plus task, predictable — are properties to look for, not vendor names.

## Illustrative harness configuration (non-canonical)

Configuration happens in the harness, never in the kit's canonical files. Illustration only:

```yaml
classification:
  strategy: dedicated      # or: same-agent (default), hybrid
  fallback: main-agent     # always available
```

## User journeys

Simplest setup: install the kit, point the harness at `AGENTS.md`, describe the task — the same agent classifies and the workflow continues. Zero additional configuration.

Optimized setup: configure the harness so a lightweight executor fills the classifier role and the main agent executes. The classifier emits the canonical classification, the kit validates it, routing is derived deterministically, and the main agent continues.

Failure journey: classifier unavailable, malformed, low-confidence or protected-uncertain → fallback → main-agent classification → normal workflow. An optimization failure is never a workflow failure.

## Guidance matrix

| Situation | Suggested strategy |
| --- | --- |
| Low task volume | Same-agent |
| Simplicity preferred | Same-agent |
| High volume of small tasks | Dedicated classifier may help |
| Expensive main-agent context | Dedicated or hybrid may help |
| Sensitive or uncertain task | Main-agent confirmation or fallback |
| Classifier unavailable | Same-agent fallback |

Suggested, not prescriptive: measure with the benchmark before committing.

## Benchmarking strategies

`benchmarks/classification/` ships a golden dataset (ten case classes) and an offline benchmark. Run the same dataset through configuration A (same-agent) as the baseline and through configuration B (a dedicated executor) — the harness supplies adapter results — then compare quality, safety, context usage, tokens, latency and cost. Under-routing (false minimal) is recorded as the critical error direction; metrics stay separate, with no composite score. Dedicated classification is an optimization: adopt it only where it improves cost, context or latency without degrading classification, routing or safety.
