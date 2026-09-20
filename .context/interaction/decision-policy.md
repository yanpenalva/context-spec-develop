# Decision Policy

Every unresolved point maps to exactly one category. The category dictates behavior. Categories align with existing approval boundaries in `policies/core/review-release.md`, `policies/core/security-privacy.md` and `policies/core/ai-governance.md`; they add no new authority to agents.

## Categories

| Category | Meaning | Behavior |
| --- | --- | --- |
| `DISCOVERABLE` | The information exists or probably exists in the repository, project context, work item or runtime evidence. | Investigate. Never ask. Record the finding and its source. |
| `REVERSIBLE_AGENT_DECISION` | Local, reversible technical choice inside the approved scope and authority. | The agent decides, records the decision when it shapes the plan or contract, and continues. |
| `ASSUMPTION_ALLOWED` | Evidence is incomplete but the choice is low-risk, reversible, does not change a contract and does not materially change expected behavior. | Assume explicitly, record the assumption with its basis, continue. Review may reject it. |
| `HUMAN_DECISION_REQUIRED` | Valid alternatives differ materially in behavior, requirements, architecture, cost, contract, UX, compatibility or scope. | Present evidence, options, trade-offs and a specific question per `questioning.md`. Wait for the decision; record it in the work item. |
| `CRITICAL_HUMAN_GATE` | Production authorization, destructive operations, risk acceptance, sensitive-data boundaries, security exceptions, irreversible migrations, release authorization, policy exceptions or external communication not previously authorized. | Stop. Require explicit human decision or authorization. A recommendation never replaces the authorization. |
| `BLOCKED` | Evidence is insufficient to continue safely in any direction. | Explain the exact blocker and request only the information needed to unblock. No workarounds, no invented evidence. |

## Mapping to existing gates

- `CRITICAL_HUMAN_GATE` instances are the same boundaries the kit already enforces: `release_approver.actor = human` in `.context/orchestration/config.json`, `config.ai.human_approval_required`, Git finalization rules in `policies/core/review-release.md`, and exception approvals in `policies/exceptions.md`.
- `BLOCKED` corresponds to the stop conditions in the phase contracts (`.context/prompts/*.md`) and `subagents.stop_on_scope_change`.
- A `HUMAN_DECISION_REQUIRED` answer that changes classification triggers reclassification (`.context/classification/README.md`).

## Choosing between categories

1. If inspection can answer it → `DISCOVERABLE`.
2. If the agent may safely choose within approved scope → `REVERSIBLE_AGENT_DECISION`.
3. If only an explicit, recorded assumption is needed → `ASSUMPTION_ALLOWED`.
4. If human input changes the path → `HUMAN_DECISION_REQUIRED`.
5. If a protected boundary is crossed → `CRITICAL_HUMAN_GATE`.
6. If safe progress is impossible → `BLOCKED`.

When two categories seem to apply, take the more conservative one (higher in this list from `HUMAN_DECISION_REQUIRED` downward) and record why.

## Recording

Every non-`DISCOVERABLE` outcome that shapes the work MUST be visible in the work item or its artifacts: the decision, the evidence, the category and, for assumptions, what would falsify them. Chat text alone is not a record.
