# Discovery: Project Onboarding and Intrinsic Classification Front Door

## Problem

Two adoption gaps, evidenced by repository inspection on 2026-09-20:

1. **Manual onboarding.** Installation instructions (`docs/getting-started.md` §2, `README.md` quick-start step 4, `docs/quickstart.pt-BR.md` §1) direct the human to fill `.context/config.json` and all ten `.context/project/*` files by hand. Every fact the repository itself could answer (framework, test command, CI) becomes a human task.

2. **Front door implicit.** The protocol already mandates classification before detailed context (`.context/context-routing/README.md` order of operations; `workflows/core.md` intake gate), but no canonical document names classification + deterministic routing + context routing as intrinsic stages of every request. Schema docs describe the work-item `classification` field as "optional" (backward-compat language) without distinguishing the optional field from the mandatory stage. A reader can infer classification is a feature the agent may invoke.

## Evidence

- `.context/project/*`: ten files, all placeholders `NOT FOUND`.
- `scripts/validate_context.py` `REQUIRED_FILES`: no onboarding contract exists anywhere in the kit.
- `docs/getting-started.md`, `docs/quickstart.pt-BR.md`, `README.md`: install, manual fill and daily workflow are interleaved with no lifecycle distinction.
- `docs/classifier-strategies.md`: states executor choice well, never states classification itself is non-optional.
- Benchmarks and tests pass on `main` (68 tests, both benchmarks exit 0): clean baseline.

## Constraints

- Provider-neutral and model-neutral; no Jev/Qwen/Ollama/any-model integration.
- Backward compatible: existing adopters, work items, schemas stay valid; no schema bump.
- Human authority (scope, risk, production, release, policy exceptions) untouched.
- Existing interaction protocol (`.context/interaction/`) is reused, not duplicated.
