# Getting Started

## 1. Install the kit

Use this repository as a template or copy `.context/`, `AGENTS.md` and the adapter relevant to your coding agent. Codex reads the root `AGENTS.md`; Claude, Copilot and Gemini use their thin adapters. Keep the canonical files versioned with the project.

## 2. Initialize the project context

Point your agent at `AGENTS.md` and ask, in plain language:

```text
Initialize context-spec-develop for this repository.
```

There is no required magic phrase; the intent is "initialize the project context". The agent follows `.context/prompts/initialize-project.md`: bounded repository discovery, populating `.context/config.json` and `.context/project/` with discovered facts, recording everything else as `NOT FOUND`, and asking you only the non-discoverable questions that are material to configuration, governance or workflow (for example production owner or release authority — facts a repository cannot prove).

Manual fallback: complete `.context/config.json` and `.context/project/` yourself, replacing placeholders with facts, links or `NOT FOUND`. Do not copy secrets.

The step is idempotent: re-running onboarding preserves confirmed facts, proposes evidence-backed updates, and never overwrites human-owned organizational facts automatically. If the project context is already populated, onboarding recognizes it and becomes a refresh.

## 3. Review unresolved decisions

The agent reports what it discovered, with evidence, and what remains `NOT FOUND`. Decide only the material questions it could not discover — usually a handful, sometimes none.

## 4. Validate

```bash
python3 scripts/validate_context.py --strict
python3 -m unittest discover -s tests
```

The validator checks the template structure and active work items. Project-specific tests remain defined by `.context/project/testing.md`. Deployment commands and CI belong to the adopting project; this kit does not install or run them.

## 5. Work normally

Describe the outcome — "Add an optional status filter to the orders endpoint." — and the harness that follows `AGENTS.md` runs the front door automatically: minimal bootstrap, classification, deterministic routing, context routing, then the workflow. You never write workflow incantations.

The agent creates `.context/work/<id>/`, selects and copies templates, and writes `work-item.json` with profile, track, type, phase and status. Keep `progress.md` local; use `handoff.md` only for durable transfer context. Before execution, make `plan.md` a small dependency graph: one owner and acceptance evidence per subtask, ordered into waves.

## 6. Select a governance mode

`starter` keeps the workflow lightweight while the project is learning the model. `managed` requires the canonical policy and project quality documents to be present. `enterprise` additionally requires configured quality gates, AI governance, security, delivery, testing and observability context.

Set the mode in `.context/config.json`, or override it for a validation run:

```bash
python3 scripts/validate_context.py --strict --mode managed
python3 scripts/validate_context.py --strict --mode enterprise --examples
```

If a policy cannot be met temporarily, create an approved, expiring exception from `.context/templates/common/exception.json`, place it in `.context/exceptions/`, and reference its ID in the work item's `policy_exceptions` list. Exceptions do not bypass human approval or release evidence.

The distributed template is intentionally in `starter` mode with unknown project facts recorded as `NOT FOUND`; therefore an enterprise-mode run fails until the adopting project configures its own commands, thresholds, owners and operational controls. That failure is the control, not a broken installation.
