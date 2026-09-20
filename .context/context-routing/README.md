# Context Routing

Context routing answers one question: **what is the minimum sufficient canonical context for the next decision or phase?** It does not classify risk, decide requirements, replace workflow or orchestration, choose vendors or models, authorize human gates, or load everything preventively.

## Normative principle

> Context inclusion requires purpose. Context exclusion is the default.

Detailed context is loaded only when at least one holds:

```text
classification signal
OR workflow phase requirement
OR runtime evidence
OR explicit human request
OR mandatory governance/safety requirement
```

Otherwise: `DO NOT LOAD`. The mandatory bootstrap required for governance and safety is always exempt from this rule. The invariant: a context domain that is not mandatory, required by the current phase, triggered by evidence or classification, or explicitly requested MUST remain deferred. Correctness, safety and evidence always outrank context economy — the target is minimum **sufficient** context, never minimum possible.

## Order of operations

```text
1. Minimal bootstrap: AGENTS.md, INDEX.md essentials, the classification
   and interaction core, and this catalog — nothing more.
2. Classify immediately (before detailed project context).
3. Derive routing; resolve effective routing (overrides live in
   .context/classification/routing.md).
4. Emit a context manifest: required, deferred, triggered domains and
   budget for the effective routing.
5. Load required domains for the current phase only.
6. On new material evidence: reclassify if needed, recalculate derived
   routing, recalculate context requirements, load additions only.
```

Loading everything first and classifying afterwards violates this contract.

## Layer responsibilities

| Layer | Question |
| --- | --- |
| `.context/classification/` | What kind of work is this? |
| `.context/interaction/` | Who has decision authority, and what is the execution state? |
| `.context/classification/routing.md` | How deep must execution be? |
| `.context/context-routing/` | What context is necessary now? |
| `.context/orchestration/` | Who coordinates and executes? |
| `.context/workflows/` | What phases and gates govern delivery? |

## Files

| File | Covers |
| --- | --- |
| [`catalog.md`](catalog.md) | The context domains: purpose and canonical sources for each |
| [`budgets.md`](budgets.md) | Structural budgets (minimal, standard, extended) and their invariants |
| [`triggers.md`](triggers.md) | Explicit signals that promote a deferred domain to required |

## Context manifest

The manifest records the routing decision over context. It is small and auditability-oriented, persisted optionally on the work item:

```json
{
  "context": {
    "budget": "standard",
    "required": ["core", "project", "testing"],
    "deferred": ["architecture", "security", "release", "incident"],
    "triggers": []
  }
}
```

`budget` equals the effective routing. Domain names come from [`catalog.md`](catalog.md). `core` is always required. The validator enforces structure, names, disjointness and budget consistency; it does not judge whether a domain "should" have been triggered.

## Progressive disclosure between phases

Each phase receives only what it needs; no phase rereads the full history:

| Phase | Loads |
| --- | --- |
| Classify | Bootstrap only |
| Specify | Task, existing behavior, relevant contracts |
| Plan | Accepted specification, relevant architecture, dependencies, constraints |
| Execute | Subtask, target files, implementation constraints, acceptance criteria, the subtask's context domains |
| Verify | Original requirement, acceptance criteria, diff, test results, relevant validation or security contracts |

## Compact handoffs

Handoffs between phases and agents pass a compact structured artifact, not the conversation:

```json
{
  "task": "the bounded assignment",
  "acceptance_criteria": ["verifiable criteria"],
  "decisions": ["recorded decisions with evidence"],
  "constraints": ["boundaries that hold"],
  "relevant_files": ["paths the work touches"],
  "evidence": ["command results, links, approvals"],
  "open_questions": ["unresolved, with owner"]
}
```

This kit already ships the artifacts that carry these roles; do not duplicate them:

- Planner → executor: the subtask row in `plan.md` (with its optional context-domains column) plus the accepted specification.
- Executor → reviewer: the diff, changed files, and `verification.md` evidence.
- Agent → agent across sessions: `handoff.md` and `progress.md` within their existing boundaries.

The previous agent's full reasoning is NOT a handoff artifact. Persist decisions, evidence, constraints, outputs and acceptance criteria — never chain-of-thought or private deliberation.

## Metrics readiness

The contracts above make future measurement possible without implementing telemetry now. Candidate metrics, documented for later work: bootstrap context size, context domains loaded, detailed contracts loaded, input and output tokens, handoff size, questions asked, subagents spawned, reclassifications, rework. If a project later adds an optional `metrics` object to its work items, it must remain advisory metadata — never a gate.
