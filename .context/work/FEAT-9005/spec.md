# Specification: Provider-neutral classifier contract and classification benchmark

## Objective

Let any harness execute classification with the executor of the user's choice — same agent, dedicated classifier or hybrid — as long as the result satisfies a small canonical contract, with deterministic routing, acceptance policy, protected signals, fallback and fail-safe behavior, plus a golden-dataset benchmark measuring classification quality and safety.

## In scope

- `.context/classification/classifier-contract.md`: classifier role, minimal input, canonical output, confidence semantics, acceptance policy, protected-signal vocabulary, fallback conditions, fail-safe rule, standalone result shape for benchmarks.
- `docs/classifier-strategies.md`: modes A/B/C with diagrams, responsibility-boundary diagram, complete context-efficient flow diagram, guidance matrix, user journeys, illustrative (non-canonical) harness configuration, future A/B experiment.
- `benchmarks/classification/`: golden dataset (`cases.json`, ten case classes), offline benchmark (`classification_benchmark.py`) validating fixtures and scoring optional adapter results on quality/safety/efficiency/operational/economic dimensions, README.
- Validator: required contract file; `PROTECTED_SIGNALS` constant; deterministic `check_classification_fixtures` over the golden dataset.
- README, CHANGELOG, upgrading, glossary updates.

## Out of scope

- Any model, provider, API client, runtime, pricing or download integration.
- Classifier emitting routing or a context manifest.
- Making dedicated classification mandatory, or benchmark results a gate.
- A single composite classifier score.

## Evidence

- Discovery record above; repository state at commit `f017e30`.

## Rules and contracts

- Principle: the kit defines the contract; the user/harness chooses the executor.
- Classifier input is the minimal bootstrap plus the task plus targeted-discovery findings — never the full repository, conversation, all policies or previous reasoning.
- Classifier output reuses the canonical `classification` object (complexity, impact, security, confidence; `risk`, `track`, `type` come from intake, not the classifier). It MUST NOT contain routing or a context manifest.
- Routing remains deterministic: dimensions → `derive_routing`. Same classification yields the same derived routing regardless of executor.
- Confidence semantics: `high` = direct evidence covers all four dimensions with no material unknowns; `medium` = some dimensions are reasoned inferences from named evidence; `low` = a key dimension is uncertain. Confidence is about the classification, never about implementation success or model quality. Low confidence alone triggers fallback under the acceptance policy — never a guess.
- Acceptance policy: a dedicated result is accepted only when structurally valid, confidence is medium or high, no protected signal requires main-agent confirmation, and no fallback condition holds. Protected signals (security, privacy, authentication, authorization, production, deployment, migration, destructive operation, irreversible operation, public contract, external integration, cross-module impact, system impact, incident, hotfix) demand conservative handling: additional evidence, main-agent confirmation or an existing human gate.
- Fallback conditions: invalid or malformed output; low confidence; material unresolved uncertainty; contradictory evidence; protected signal requiring confirmation; insufficient targeted discovery; classification cannot be derived safely. Fallback target is always the canonical same-agent path; never vendor-specific.
- Fail-safe: failure, timeout, unavailability or malformed output of an optional classifier must not prevent the canonical workflow; same-agent classification is always available.
- Under-classification asymmetry: false escalation costs context; false minimal risks correctness and safety. Benchmarks record them separately and treat under-routing as the critical error; no composite score.
- Standalone result shape (for adapters): `{case, classification?, detected_protected_signals?, applied_routing?, fallback?{reason}, context?{files,chars,domains}, runtime?{input_tokens,output_tokens,cached_input_tokens,latency_ms,cost}}` — all runtime fields optional and nullable.

## Security impact

None. No security boundary changes; the protected-signal vocabulary strengthens conservative handling.

## Tests

Same-agent path remains valid with no configuration; canonical contracts contain no vendor names; valid classifier result scores; malformed result rejected; low-confidence and protected-signal fallback recognized; routing derived deterministically after classification; classifier-supplied routing rejected; golden fixtures valid offline; under-routing, false-minimal and missed-protected-signal detected; runtime token and cost fields nullable; legacy work items valid.

## Acceptance criteria

1. Contract and strategy guide documented with provider-neutral diagrams.
2. Golden dataset covers the ten required case classes and passes offline validation.
3. Benchmark scores adapter results on independent quality/safety metrics without a composite score.
4. Same-agent path unchanged and zero-config; no vendor strings in canonical contracts.
5. All prior tests pass; new tests pass; validator green.
