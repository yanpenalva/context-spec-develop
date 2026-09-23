# Getting Started

## 1. Install the kit

Install the published package for the harnesses you use:

```bash
npx @owlcodium/context-spec-develop install
```

The default is global installation. Use `--scope project` to version the skill with the repository, and `--agents codex,claude-code,cursor,copilot,gemini,opencode` to avoid the interactive selection. The installer writes a lockfile, refuses conflicting files unless `--force` is explicit, and supports `update`, `remove` and `doctor`.

## 2. Initialize the project context

Activate `/csd` (or `$csd` in Codex) and ask, in plain language:

```text
Initialize context-spec-develop for this repository.
```

The skill inspects supported context layouts first. A valid existing layout is used in place. When no layout is valid, it previews the configured canonical layout; after confirmation it materializes that layout and an idempotent CSD entry in AGENTS.md. Native .context/ onboarding follows .context/prompts/initialize-project.md; compatibility layouts use their available onboarding sources. Discovery and configuration are described in context-discovery.md.

Manual fallback: complete the selected layout's config and project context yourself, replacing placeholders with facts, links or NOT FOUND. Do not copy secrets.

The step is idempotent: re-running onboarding preserves confirmed facts, proposes evidence-backed updates, and never overwrites human-owned organizational facts automatically. If the project context is already populated, onboarding recognizes it and becomes a refresh. During first onboarding, CSD also checks configured module-documentation roots. Existing `.context/project/modules/` or compatible `.ai/modules/` documentation is preserved. If none exists, CSD asks once whether to create a generic framework-neutral scaffold; approval creates only an index and template, while decline records a persistent opt-out.

## 3. Review unresolved decisions

The agent reports what it discovered, with evidence, and what remains `NOT FOUND`. Decide only the material questions it could not discover — usually a handful, sometimes none.

## 4. Validate

```bash
python3 scripts/validate_context.py --strict
python3 -m unittest discover -s tests
```

The validator checks the template structure and active work items. Project-specific tests remain defined by `.context/project/testing.md`. Deployment commands and CI belong to the adopting project; this kit does not install or run them.

## 5. Work normally

Describe the outcome — "Add an optional status filter to the orders endpoint." — and the harness that follows `AGENTS.md` runs the front door automatically: minimal bootstrap, classification, deterministic routing, context routing, then the workflow. You never write workflow incantations, and a normal task asks nothing about profile or Git mode: an explicit profile choice or recorded preference is reused, otherwise the configured default applies; `git_finalization_mode` is resolved only when Git finalization becomes relevant, and an unresolved mode authorizes nothing.

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
