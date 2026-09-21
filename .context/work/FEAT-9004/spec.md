# Specification: Bootstrap separation, lazy domains and context benchmark

## Objective

Separate bootstrap from context domains, make `project` and `testing` lazy (trigger/phase promoted), keep every mandatory policy mandatory without mandatory full-document loading, define targeted discovery, and add a reproducible benchmark that measures real context-size behavior against a defined eager baseline.

## In scope

- Bootstrap contract section inside `.context/context-routing/README.md` (no new layer, no new contract file).
- `catalog.md`: `core` refined to post-bootstrap governance sources (entrypoint files move to bootstrap); `project` and `testing` become trigger/phase promoted.
- `budgets.md`: bootstrap/domain separation invariant; core no longer universally required; maxima 3/5/7 kept (limits, not quotas).
- `triggers.md`: promotion triggers for `project` and `testing`.
- Validator: mandatory-domain check removed; `default_required_domains` returns the empty set by default, promotes `testing` at execute/verify phases, `security`/`architecture`/`incident` by signal.
- `benchmarks/`: methodology README, `scenarios.json` (B1–B5), `run.py` computing baseline versus routed structural metrics; executed during this work item with results recorded.
- End-to-end example gains the trivial-task scenario; README, glossary, CHANGELOG, upgrading notes.

## Out of scope

- Any classifier engine, vendor, model, tokenizer dependency or telemetry.
- Making benchmark results a release gate.
- Rewriting closed work items or reclassifying past decisions.

## Evidence

- Discovery record above; repository state at commit `46be360`.

## Rules and contracts

- `BOOTSTRAP != CONTEXT DOMAIN`. Bootstrap is the minimum needed to understand the protocol, classify, route, build the initial manifest and apply pre-classification safety boundaries; it is index/pointer-oriented, never full detailed contracts.
- Bootstrap invariant: detailed project, testing, architecture, security, release and incident context MUST NOT be part of the default bootstrap unless required for safe classification itself.
- Bootstrap answers: what is this task? how deep is it? what context comes next? is human input needed? It need not enable implementation.
- Mandatory policy versus mandatory loading: a policy obligation (for example verification evidence is mandatory) may live in the bootstrap as a pointer/summary while its full document loads only when a phase needs it.
- Targeted discovery: minimal evidence-seeking (filenames, symbols, metadata, target inspection) to classify correctly is allowed and is distinct from domain loading.
- Promotion model: `project` promotes on project-specific behavior, conventions, stack or implementation work; `testing` promotes when planning validation, implementing tested code, entering verify, or when the task concerns tests; `security`/`architecture`/`incident`/`release` keep their existing signals.
- Routing depth is independent of context count; budgets are ceilings, not quotas; unused capacity never instructs loading.
- Benchmark: baseline is a documented eager strategy (all generally applicable policy/workflow/project/prompt context before work); routed is bootstrap plus required-domain sources; metrics are files, chars, domains and computed context-size reduction; runtime token fields are optional and null unless actually supplied; no percentage is ever labeled token reduction without real token counts.

## Security impact

None. No security boundary changes; the security trigger behavior is unchanged.

## Tests

Bootstrap set excludes project/testing detail files; trivial manifest (`required: []`) and `core`-only manifest are valid; legacy three-domain manifests remain valid; project and testing promotions validate; security promotion unchanged; routing derivation independent of context count; `default_required_domains` per new model; benchmark smoke test (five scenarios, computed reductions, valid JSON).

## Acceptance criteria

1. Bootstrap contract and invariant documented; entrypoint duplication with `core` removed.
2. Trivial task can run on an empty or `core`-only manifest; validator accepts it.
3. Project/testing lazy triggers documented; prior guarantees intact.
4. Benchmark implemented, executed, results recorded with repository state; no fabricated numbers.
5. All prior tests pass; new tests pass; no token-percentage claims.
