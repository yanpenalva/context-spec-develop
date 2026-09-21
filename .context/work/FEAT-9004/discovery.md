# Discovery: Bootstrap separation, lazy domains and context benchmark

## Problem

The context-routing layer made `core`, `project` and `testing` effectively mandatory in every manifest, so a minimal task can start with three of three budget slots filled before anyone knows whether project or testing context is needed. The bootstrap was never formalized, so entrypoint files (`AGENTS.md`, `.context/INDEX.md`) sit conceptually inside both bootstrap and the `core` domain. There is also no measured baseline for the context behavior the contracts promise.

## Evidence

- `catalog.md` marks core/project "Always required" and testing "mandatory by default"; `budgets.md` invariant 2 requires core everywhere.
- `scripts/validate_context.py` enforces `MANDATORY_CONTEXT_DOMAINS = {core}` and `default_required_domains` returns `{core, project, testing}` unconditionally.
- `AGENTS.md` and `INDEX.md` appear in the `core` domain sources and are also the bootstrap entrypoint.
- No benchmark exists for baseline versus routed context behavior.

## Affected audience

Every harness following `AGENTS.md`; teams that want measurable context behavior; future classifier experiments needing a baseline.

## Constraints

- No new architectural layer; refine existing contracts.
- Preserve classification-before-context, gates, evidence rules, human approval, NOT FOUND, deterministic validation, reclassification, compact handoffs.
- Mandatory policy stays mandatory even where full-document loading becomes lazy.
- Benchmark must be reproducible, vendor-neutral, without fabricated numbers, and not a gate.

## Hypothesis

Formalizing the bootstrap contract, demoting `core`'s entrypoint files into the bootstrap, making `project` and `testing` trigger/phase-promoted, and measuring the result yields smaller manifests with identical guarantees.

## Expected value

Trivial tasks run on bootstrap alone; implementation tasks promote exactly what they need; the promised context economy becomes measurable.

## Success signal

Validator accepts empty and single-domain manifests for trivial work; all prior tests pass; the benchmark executes over five scenario classes with computed (not fabricated) structural reductions.
