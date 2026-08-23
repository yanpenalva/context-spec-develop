# Context Index

`.context/` is the canonical, versioned source of truth for this delivery template.

## Read first

1. `config.json`
2. `profiles/README.md` and the selected conversation profile
3. `tooling/README.md` when token-saving or review-graph tools are available
4. `project/overview.md` and relevant project files
5. Applicable policies in `policies/`
6. `workflows/core.md`
7. `workflows/product.md` or `workflows/support.md`, selected by intake
8. The active work item under `work/`

For any uncertainty, read `policies/core/questioning-and-evidence.md` before asking the user or delegating a subtask.

## Map

| Path | Purpose |
| --- | --- |
| `project/` | Context that describes the adopting software project |
| `policies/` | Normative core rules and exception process |
| `workflows/` | Core process and Product/Support overlays |
| `prompts/` | Agent-facing phase contracts |
| `profiles/` | Conversation roles and startup questions |
| `orchestration/` | Configurable agent assignments and automatic work-item setup |
| `tooling/` | Optional token, memory and review-graph integrations |
| `templates/` | Human-readable work-item artifacts |
| `schemas/` | Machine-readable contracts |
| `work/` | Active and completed work items |
| `exceptions/` | Approved, scoped and expiring policy deviations |

The project fills the placeholders in `project/` once. Work items then reference that context instead of copying it into every prompt.

Use `NOT FOUND` when an expected fact does not exist. Never invent a route, permission, status, test, owner or operational signal.

## Conversation routing

At the beginning of a conversation, choose one profile, then classify the request:

- New user or business value: `product` / `feature`.
- Reproducible defect without active degradation: `support` / `bug`.
- Active degradation, outage or material impact: `support` / `incident`.
- Urgent production change for active or critical impact: `support` / `hotfix`.

If classification is unclear, ask the smallest question that distinguishes user value, defect, active impact and urgency. Do not start implementation before `track`, `type`, owner, risk and phase are recorded.

After classification, create or open the work item, decompose the plan into small subtasks, organize dependency-safe waves, and follow the phase gate. A subagent may work only on an assigned subtask and must return evidence to the parent work item.
