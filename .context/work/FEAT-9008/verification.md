# Verification: FEAT-9008

## Commands and results (2026-09-20, working tree)

| Command | Exit | Result |
| --- | --- | --- |
| `python3 scripts/validate_context.py --strict --examples` | 0 | Context validation passed (includes new required file `.context/prompts/initialize-project.md`) |
| `python3 -m unittest discover -s tests` | 0 | Ran 74 tests, OK (68 pre-existing + 6 new in `tests/test_onboarding_front_door.py`) |
| `python3 benchmarks/run.py` | 0 | totals 235370 → 190625 chars (19.0% context-size reduction); `input_token_reduction_percent: null` |
| `python3 benchmarks/classification/classification_benchmark.py` | 0 | 10 fixtures passed, offline-fixture-validation |

## Acceptance criteria check

1. initialize-project.md exists; referenced from AGENTS.md, INDEX.md, start-conversation.md; `check_links` passes. ✔
2. Front-door invariants in classification/README.md ("The front door"), classifier-contract.md (mandatory/optional executor block), context-routing/README.md (strong ordering invariant, structural economy, onboarding budget). No `use_classifier` anywhere in canonical contracts (verified by reading; grep over `.context/**` returns no match). ✔
3. getting-started.md and quickstart.pt-BR.md show initialize-once → work-normally; no mandatory mega-prompt; "no required magic phrase" documented. ✔
4. Validator/tests/benchmarks green (table above). ✔
5. No vendor/model name in touched canonical contracts (enforced by new `test_lifecycle_contracts_name_no_vendor`); work-item.schema.json unchanged (`git diff` shows no schema edit). ✔
6. Existing work items and examples validate (`--examples` green); idempotency rules documented in initialize-project.md §1. ✔

## Limitations

- Structural benchmark numbers shifted (26.4% → 19.0% totals) because the change set added canonical files that enter the eager baseline set; the benchmark measures structure, not tokens, and remains observational. No token claim is made.
- Marker scan required neutralizing a framework name in the onboarding example (public package stays project-neutral); the discovered-facts example is now generic.
