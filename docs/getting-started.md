# Getting Started

## 1. Install the context

Use this repository as a template or copy `.context/`, `AGENTS.md` and the adapter relevant to your coding agent. Codex reads the root `AGENTS.md`; Claude, Copilot and Gemini use their thin adapters. Keep the canonical files versioned with the project.

## 2. Fill project context

Complete `.context/config.json` and the files under `.context/project/`. Replace placeholders with facts, links or `NOT FOUND`. Do not copy secrets.

## 3. Choose the workflow

- At conversation start, select one profile in `.context/profiles/`.
- Product feature or improvement: `.context/workflows/product.md`.
- Reproducible defect: Support bug.
- Active degradation or outage: Support incident.
- Urgent production change: Support hotfix.

## 4. Create a work item

Tell the orchestrator the outcome and startup decisions. It creates `.context/work/<id>/`, selects and copies templates, and writes `work-item.json` with profile, track, type, phase and status. Create files manually only when operating without an orchestrator. Keep `progress.md` local; use `handoff.md` only for durable transfer context.

Before execution, make `plan.md` a small dependency graph: one owner and acceptance evidence per subtask, ordered into waves. Delegate only bounded subtasks; parent agent integrates and verifies results.

## 5. Validate

```bash
python3 scripts/validate_context.py --strict
python3 -m unittest discover -s tests
```

The validator checks the template structure and active work items. Project-specific tests remain defined by `.context/project/testing.md`. Deployment commands and CI belong to the adopting project; this kit does not install or run them.

## 6. Select a governance mode

`starter` keeps the workflow lightweight while the project is learning the model. `managed` requires the canonical policy and project quality documents to be present. `enterprise` additionally requires configured quality gates, AI governance, security, delivery, testing and observability context.

Set the mode in `.context/config.json`, or override it for a validation run:

```bash
python3 scripts/validate_context.py --strict --mode managed
python3 scripts/validate_context.py --strict --mode enterprise --examples
```

If a policy cannot be met temporarily, create an approved, expiring exception from `.context/templates/common/exception.json`, place it in `.context/exceptions/`, and reference its ID in the work item's `policy_exceptions` list. Exceptions do not bypass human approval or release evidence.

The distributed template is intentionally in `starter` mode with unknown project facts recorded as `NOT FOUND`; therefore an enterprise-mode run fails until the adopting project configures its own commands, thresholds, owners and operational controls. That failure is the control, not a broken installation.
