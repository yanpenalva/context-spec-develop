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

### Strong ordering invariant

> Detailed canonical context SHOULD NOT be loaded before initial classification unless that context is required to classify safely.

The invariant is deliberately SHOULD-strength: it must never be read as forbidding the bounded targeted discovery classification itself may need (one route, one symbol, a filename, a dependency flag). The intent is `EXCLUSION = DEFAULT`, `INCLUSION = JUSTIFIED` — already the normative principle above. Context inclusion requires purpose; context exclusion is the default.

## Structural context economy

The economy model is decide-then-load, not load-then-save:

```text
TASK → cheap/minimal decision stage → what context is needed?
     → load only that context → main work
```

never:

```text
load everything → classify → try to save tokens
```

Boundary of what the kit actually controls. The kit reduces unnecessary loading of: canonical project context, policies, workflow context, domain context, repository discovery and handoffs. The kit does **not** control: harness system prompts, tool schemas, IDE-injected context, provider-managed memory or external connector context. Structural context economy is therefore a property of context selection, not a provider token guarantee; no token-reduction percentage is claimed anywhere in this kit (measurement belongs to `benchmarks/`).

## Order of operations

```text
1. Minimal bootstrap: AGENTS.md, INDEX essentials, the classification
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

## Bootstrap

```text
BOOTSTRAP != CONTEXT DOMAIN
```

The bootstrap is the smallest set of information needed to understand the protocol, classify the task, determine routing, build the initial context manifest and apply the safety/governance boundaries that must hold *before* classification. It is index- and pointer-oriented: prefer small summaries and references over full contracts whenever possible.

Bootstrap contents (as pointers or summaries, not necessarily full documents):

- `AGENTS.md` and the minimal index information from `.context/INDEX.md`;
- the classification contract core (`.context/classification/README.md`);
- the interaction core (`.context/interaction/README.md`);
- this catalog (`.context/context-routing/catalog.md`) and its README;
- the mandatory pre-classification governance boundaries (normative-language and precedence rules from `policies/README.md`, and the questioning rule that inspection precedes questions).

Bootstrap invariant: detailed project, testing, architecture, security, release and incident context MUST NOT be part of the default bootstrap unless that information is required for safe classification itself. The bootstrap answers four questions — what is this task, how deep is it, what context comes next, is human input needed — and need not enable implementing the task.

### Targeted discovery

Classification sometimes needs one specific fact (does this touch authentication? which module owns the endpoint?). **Targeted discovery** — searching filenames or symbols, inspecting the target route or relevant metadata — is allowed at classification time and is distinct from domain loading: discovery seeks the minimum evidence to decide; domain loading provides detailed context to execute. Targeted discovery never becomes an excuse to pull a full domain into the bootstrap.

```text
TARGETED DISCOVERY != DOMAIN LOADING
TARGETED DISCOVERY != FULL REPOSITORY EXPANSION
```

### Onboarding discovery is a different budget

`PROJECT ONBOARDING != DAILY WORKFLOW`. Initializing an adopting repository (`prompts/initialize-project.md`) legitimately inspects more than one task would, because its output is the reusable canonical project context itself:

```text
TASK DISCOVERY               = minimal evidence needed for one request
ONBOARDING DISCOVERY          = bounded repository-wide discovery needed to
                                initialize reusable canonical project context
```

Broader is not unbounded: onboarding stays fact-oriented (stack, commands, structure, CI), never reads every file, and never dumps the repository into context. Task budgets do not apply to onboarding; the fact-orientation rule does.

### Mandatory policy versus mandatory loading

A policy can remain mandatory without its complete document being loaded at every phase. The obligation (for example, verification evidence is mandatory) lives in the bootstrap as a rule; the full document (for example `policies/core/testing.md`) loads when a phase actually needs it.

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

`budget` equals the effective routing. Domain names come from [`catalog.md`](catalog.md). The manifest may be empty (`required: []`) when the task needs no domain context yet — the bootstrap already carries governance. Domains are promoted incrementally per [`triggers.md`](triggers.md); the validator enforces structure, names, disjointness and budget consistency, and never judges whether a domain "should" have been triggered. A manifest from before the bootstrap split that requires `core`, `project` and `testing` remains valid; it is simply less lazy than needed.

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
