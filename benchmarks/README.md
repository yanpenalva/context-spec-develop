# Context-Routing Benchmark

Reproducible, vendor-neutral benchmark comparing a documented **eager-context baseline** against the **routed** behavior (bootstrap → classification → context manifest → progressive disclosure) of this repository. It measures structural context size — files and characters — not tokens.

## Methodology

- **Baseline**: an eager strategy where every generally applicable policy, workflow, project, prompt, orchestration and index file loads before any work. The exact set is `BASELINE_FILES` in [`run.py`](run.py) (36 files). It represents a reasonable front-loading agent, not a strawman.
- **Routed**: the bootstrap file set (`BOOTSTRAP_FILES` in [`run.py`](run.py)) plus the canonical sources of only the domains each scenario's context manifest requires. Domain sources are parsed from [`.context/context-routing/catalog.md`](../.context/context-routing/catalog.md).
- **Scenarios**: [`scenarios.json`](scenarios.json) defines five task classes — B1 documentation trivial, B2 local implementation, B3 local bug, B4 cross-module feature, B5 security-sensitive — each with its classification, routing and manifest.
- **Metrics**: files loaded, characters loaded, domains loaded, `context_size_reduction_percent`, `file_reduction_percent`. These are deterministic and reproducible.
- **Tokens**: `runtime_tokens` and `input_token_reduction_percent` stay `null` unless a real model run supplies actual token counts. Character reductions are never reported as token reductions.

## Run

```bash
python3 benchmarks/run.py                 # human-readable summary
python3 benchmarks/run.py --json          # machine-readable JSON
python3 benchmarks/run.py --json --output benchmarks/results/latest.json
```

## Reproducing

1. Check out the repository state under test.
2. Run the command above; the report records the baseline and routed sets, the measurement method (file/character counts of the actual files) and the results.
3. Compare runs against `benchmarks/results/latest.json` or your own output. Scenario and manifest definitions live in `scenarios.json`; change them deliberately.

## Status

Observational only. Benchmark results are **not** a release gate; correctness, safety and evidence always outrank context economy. The repository makes no token-percentage claims. A future experiment may compare main-agent classification (A) against a cheap/local classifier (B) feeding the same classification and context-manifest contracts, measuring accuracy, context loaded, input tokens, latency, cost, reclassification rate and incorrect routing rate — no such integration exists yet.

## Relationship to the intrinsic front door

Classification, routing and context routing are mandatory front-door stages (`.context/classification/README.md`); these benchmarks measure them without coupling to any executor:

```text
CONTEXT BENCHMARK        → are we loading less unnecessary context?
CLASSIFICATION BENCHMARK → are we making safe/correct front-door decisions?
RUNTIME EXPERIMENT       → does another classifier executor improve tokens/latency/cost
                           without degrading safety?
```

## Classification quality

[`classification/`](classification/) ships the golden classification dataset (ten case classes) and an offline benchmark that validates fixtures and scores optional adapter results on classification accuracy, routing accuracy, under-routing, false-minimal, missed protected signals and fallback behavior. See its README and the classifier contract in `.context/classification/classifier-contract.md`.
