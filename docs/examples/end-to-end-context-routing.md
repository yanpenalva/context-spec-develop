# End-to-End: Context Routing in Practice

A worked example of immediate classification, progressive disclosure, decision states and compact handoffs. The contracts live in `.context/classification/`, `.context/interaction/` and `.context/context-routing/`; this page only demonstrates them.

## Scenario 0 — the trivial case: "Fix the typo in README."

The agent loads only the bootstrap (`AGENTS.md`, index essentials, the classification and interaction core, the context catalog) and classifies immediately:

```json
{
  "classification": {"complexity": "low", "impact": "local", "security": "none", "confidence": "high"},
  "routing": {"derived": "minimal", "effective": "minimal"}
}
```

```json
{
  "context": {
    "budget": "minimal",
    "required": [],
    "deferred": ["core", "project", "testing", "architecture", "security", "release", "incident"],
    "triggers": []
  }
}
```

No domain is promoted: the task needs no project conventions, no stack facts, no test strategy. The bootstrap already carries the governance rules. The agent makes the targeted edit and runs a lightweight verification (the corrected text is in the file; no tests claim to run). Bootstrap in, edit, evidence out — no project or testing domain ever loaded. Mandatory policy stayed mandatory: the evidence rule was in the bootstrap; its full testing document never needed to load.

Contrast this with the orders scenario below, where evidence promotes domain after domain. Same protocol, progressively deeper context.

## Scenario 1 — the orders filter: "Add an optional filter by status to the orders endpoint."

### 1. Minimal bootstrap, then immediate classification

The agent loads only the bootstrap and classifies before opening any detailed project file:

```json
{
  "classification": {"complexity": "low", "impact": "local", "security": "none", "confidence": "high"},
  "routing": {"derived": "minimal", "effective": "minimal"}
}
```

## 2. The context manifest

Classification produces the manifest. `project` is promoted immediately — the filter touches project-specific endpoint behavior — while `testing` waits for the phases that need it:

```json
{
  "context": {
    "budget": "standard",
    "required": ["project"],
    "deferred": ["core", "testing", "architecture", "security", "release", "incident"],
    "triggers": ["project-specific endpoint behavior"]
  }
}
```

The agent loads the project conventions and the orders endpoint. Security, incident, release, architecture and even testing stay deferred: a local, low-risk, no-security filter does not trigger them, and context exclusion is the default. Extended routing would not change this — broader discovery is a permission, never a blanket load, and unused budget capacity is not an instruction to load.

## 3. No unnecessary question

The agent wonders: *which query-filter pattern should I use?* The repository already answers that — the endpoint uses the shared query-builder helper. Category: `DISCOVERABLE`. Execution state: `CONTINUE`. No question is asked; asking would violate the questioning rule.

## 4. A material ambiguity appears

While specifying, two plausible readings of "filter by status" emerge: a single status (`?status=paid`) or a multi-status list (`?status=paid,pending`). Both are valid; they change the public contract.

```text
decision_category = HUMAN_DECISION_REQUIRED
execution_state = WAITING_FOR_HUMAN
```

Decision required: single-status or multi-status filter?

Evidence:
- The endpoint currently returns all statuses; no filter exists.
- The shared query-builder supports both single values and comma lists.

Unknown:
- Whether existing clients need to filter by more than one status at once.

Options:

A. Single status: `?status=paid`, repeatable parameter for combinations.
Impact: simplest contract; repeated params are less discoverable.

B. Comma list: `?status=paid,pending`.
Impact: one parameter covers combinations; slightly larger validation surface.

Recommendation: A, because no sampled client needs combinations today and A keeps the smallest contract; B remains a backward-compatible extension later.

Question: approve the single-status filter (A) or the comma-list filter (B)?

Work pauses (`WAITING_FOR_HUMAN`) until the product owner picks A. The decision is recorded in the spec. Execution resumes (`CONTINUE`).

## 5. Runtime evidence expands context

During specification, runtime evidence appears: visibility of some statuses depends on the requester's authorization — the filter must not leak statuses the caller cannot see.

This is a classification signal: `security: none → relevant`. Per the trigger table, the security domain is promoted:

```json
{
  "context": {
    "budget": "standard",
    "required": ["project", "security"],
    "deferred": ["core", "testing", "architecture", "release", "incident"],
    "triggers": ["project-specific endpoint behavior", "authorization-dependent status visibility discovered"]
  }
}
```

Only the security domain is added — architecture, release and incident stay deferred. When planning reaches validation strategy and the work enters verify, `testing` promotes the same way; nothing unrelated is ever reloaded.

## 6. Reclassification

The new evidence changes dimensions, so the work item records it:

```json
{
  "classification": {"complexity": "low", "impact": "local", "security": "relevant", "confidence": "high"},
  "routing": {"derived": "standard", "effective": "standard"},
  "reclassification": [
    {
      "previous": {"complexity": "low", "impact": "local", "security": "none", "confidence": "high", "routing": "minimal"},
      "trigger": "Filter visibility depends on requester authorization (runtime evidence)",
      "routing_impact": "Derived routing rose from minimal to standard; security review analysis added to spec and review"
    }
  ]
}
```

Derived routing moved because dimensions moved — not because anyone wanted a deeper route.

## 7. Routing override is a different thing

Separately, the product owner asks for an independent review although the derivation says `standard`. That is an override, not a reclassification:

```json
{
  "routing": {
    "derived": "standard",
    "effective": "extended",
    "override": {"authority": "human", "reason": "independent review requested before quarter close"}
  }
}
```

The dimensions stay untouched. Overrides may only increase depth; the validator rejects downgrades and unrecorded or non-human overrides.

## 8. Compact handoffs

Planner → executor: the subtask row from `plan.md`:

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | orders-team | none | Filter tests pass; authorization check covered | 1 | core,project,testing,security |

The executor receives this row, the accepted spec and the named domains — not the planner's entire investigation.

Executor → reviewer: the diff, the changed files and the verification evidence (commands, results, limitations). The reviewer never receives the conversation history; private reasoning is not an artifact.

## The guarantees this example exercised

1. Classification happened before detailed context loading, on a bootstrap that carries no project, testing or architecture detail.
2. Unrequired context started deferred; the trivial scenario never promoted anything.
3. Detailed context loaded only through a phase requirement, a trigger or a human request — `project` for endpoint behavior, `testing` at verify, `security` on evidence.
4. Security evidence expanded the manifest incrementally — it did not load everything.
5. The human decision paused work (`WAITING_FOR_HUMAN`) without faking a `BLOCKED`.
6. The override changed effective routing with recorded authority and reason, leaving the classification honest.
7. Handoffs stayed compact and artifact-based.
8. Mandatory policy (evidence rules) held even where the full testing document was never loaded.

The benchmark in `benchmarks/` measures this contrast structurally: a documented eager baseline against the routed behavior per scenario class.
