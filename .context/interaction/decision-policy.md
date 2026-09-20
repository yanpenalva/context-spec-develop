# Decision Policy

Every unresolved point maps to exactly one **decision category** (authority) and one **execution state** (progress). The two dimensions are independent: a category says who may decide; a state says whether work may proceed right now.

Normative boundaries come from `policies/core/review-release.md`, `policies/core/security-privacy.md` and `policies/core/ai-governance.md`. This file adds no new authority to agents.

## Decision categories (authority)

| Category | Meaning | Behavior |
| --- | --- | --- |
| `DISCOVERABLE` | The information exists or probably exists in the repository, project context, work item or runtime evidence. | Investigate. Never ask. Record the finding and its source. |
| `REVERSIBLE_AGENT_DECISION` | Local, reversible technical choice inside the approved scope and authority. | The agent decides, records the decision when it shapes the plan or contract, and continues. |
| `ASSUMPTION_ALLOWED` | Evidence is incomplete but the choice is low-risk, reversible, does not change a contract and does not materially change expected behavior. | Assume explicitly, record the assumption with its basis, continue. Review may reject it. |
| `HUMAN_DECISION_REQUIRED` | Valid alternatives differ materially in behavior, requirements, architecture, cost, contract, UX, compatibility or scope. | Present evidence, options, trade-offs and a specific question per `questioning.md`. Wait for the decision; record it in the work item. |
| `CRITICAL_HUMAN_GATE` | Production authorization, destructive operations, risk acceptance, sensitive-data boundaries, security exceptions, irreversible migrations, release authorization, policy exceptions or external communication not previously authorized. | Stop. Require explicit human decision or authorization. A recommendation never replaces the authorization. |

`BLOCKED` is **not** a decision category. It is an execution state (below) meaning no safe path exists at this moment — not merely "a question is pending".

## Execution states (progress)

| State | Meaning | Typical trigger |
| --- | --- | --- |
| `CONTINUE` | Work may proceed. | Category is `DISCOVERABLE`, `REVERSIBLE_AGENT_DECISION` or `ASSUMPTION_ALLOWED`. |
| `WAITING_FOR_HUMAN` | Work pauses on a pending human input that unblocks the path. | Category is `HUMAN_DECISION_REQUIRED` or `CRITICAL_HUMAN_GATE`. |
| `BLOCKED` | No safe path to progress exists at this moment, even with a decision inside current authority — for example required validation cannot run, or evidence conflicts with no safe resolution. | Path-safety evaluation, not a category. |

Mapping: `decision_category = HUMAN_DECISION_REQUIRED` → `execution_state = WAITING_FOR_HUMAN`; `CRITICAL_HUMAN_GATE` → `WAITING_FOR_HUMAN`; the autonomous categories → `CONTINUE`. A `BLOCKED` state is recorded with the exact blocker (and, where relevant, `status: blocked` on the work item); it is never inferred from a pending question alone.

## Precedence

When aspects of one point span several categories, decide by explicit precedence, not by feeling:

1. **Protected boundary rule**: if any aspect touches a critical human gate, the category is `CRITICAL_HUMAN_GATE`. Protected boundaries always outrank autonomous decisions.
2. **Highest applicable authority**: otherwise take the highest-authority category that applies to any material aspect, in the order `CRITICAL_HUMAN_GATE` > `HUMAN_DECISION_REQUIRED` > `ASSUMPTION_ALLOWED` > `REVERSIBLE_AGENT_DECISION` > `DISCOVERABLE`.
3. **Evidence rule**: a category requires evidence for its preconditions; absence of evidence never upgrades a `DISCOVERABLE` point beyond what inspection has actually ruled out.
4. **State rule**: execution state follows deterministically from the chosen category, then a path-safety check; `BLOCKED` is chosen only when `WAITING_FOR_HUMAN` would still leave no safe path (the human input alone would not unblock the work).

## Mapping to existing gates

- `CRITICAL_HUMAN_GATE` instances are the same boundaries the kit already enforces: `release_approver.actor = human` in `.context/orchestration/config.json`, `config.ai.human_approval_required`, Git finalization rules in `policies/core/review-release.md`, and exception approvals in `policies/exceptions.md`.
- A `HUMAN_DECISION_REQUIRED` answer that changes classification triggers reclassification (`.context/classification/README.md`), which recalculates derived routing and context requirements.

## Recording

Every non-`DISCOVERABLE` outcome that shapes the work MUST be visible in the work item or its artifacts: the decision, the evidence, the category and, where the path pauses, the execution state; for assumptions, what would falsify them. Chat text alone is not a record.
