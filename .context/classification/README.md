# Classification Layer

Classification describes the work before it is planned or executed. It answers one question: **what kind of work is this?** It does not decide who executes it, how it is coordinated, or whether a gate passes.

## Responsibility

- Produce a declarative, evidence-based description of a request: `complexity`, `impact`, a `security` signal and classification `confidence`.
- Derive `routing` (execution depth) deterministically from those dimensions plus the work-item `risk` (see [`routing.md`](routing.md)).
- Reclassify only when material new evidence changes a dimension.

Classification is an implementation-independent contract: the kit defines the contract, and the user or harness chooses the executor — the main agent (canonical, zero-config), a dedicated classifier or a hybrid strategy. See [`classifier-contract.md`](classifier-contract.md) for the executor contract, acceptance policy, protected signals and fallback, and `docs/classifier-strategies.md` for strategy guidance. Nothing downstream may depend on which implementation produced the classification.

## Inputs

Initial classification consumes the smallest evidence set that classifies safely — never a full context expansion:

- The user request and any existing work item.
- Intake answers: `track`, `type`, owner, `risk` (canonical at the work-item root; never duplicated here).
- The minimal bootstrap (see `.context/context-routing/README.md`).
- Bounded targeted discovery when a specific classification question needs one fact — inspecting a filename, symbol, route or dependency flag. Discovery is evidence-seeking, not domain loading.

Repository inspection, project context under `.context/project/` and detailed policies are **not** default inputs: they are promoted through context routing after classification, and the evidence they surface later feeds **reclassification**:

```text
initial classification → routing → context manifest → detailed context
        ↑                                                      │
        └──────────── new material evidence ←──────────────────┘
```

Later evidence — loaded project or domain context, runtime evidence, implementation and verification evidence — may trigger reclassification, which recalculates routing and the context manifest and loads only newly required context.

## Outputs

- A `classification` object in `work-item.json` (without routing):

```json
{
  "classification": {
    "complexity": "low|medium|high",
    "impact": "local|module|cross-module|system",
    "security": "none|relevant|sensitive",
    "confidence": "low|medium|high"
  }
}
```

- A root `routing` object with the derived and effective depths (see [`routing.md`](routing.md)) and the optional override record.
- Optionally, a `context` manifest (see `.context/context-routing/README.md`) and `reclassification` entries when a dimension changes materially.

Legacy note: items written before the routing split may carry `classification.routing` instead of the root `routing` object; the validator accepts that shape as `derived = effective`.

## When classification happens

1. Immediately after intake determines `track` and `type` (see `.context/prompts/intake.md`).
2. Again, as reclassification, whenever material new evidence emerges in any phase.

Flow: `intake → work type → classification → interaction check → routing → workflow gates`.

## Relation to other layers

| Layer | Relationship |
| --- | --- |
| Intake | Intake owns `track`/`type` and human-directed answers. Classification consumes them and adds the dimensions intake does not cover. |
| Work item | The work item stores the classification as data. It is the only durable record; chat text is not. |
| Interaction | Before asking a human because of uncertainty or a proposed classification, the agent applies `.context/interaction/`. Low confidence never bypasses that protocol. |
| Orchestration | Classification never assigns agents. Orchestration (`.context/orchestration/`) maps roles and depth to actors; it may read routing to size waves and reviewer independence. |
| Workflow | Routing selects how deep the existing gates run. It never removes a gate or weakens a policy MUST. |

## Dimension contracts

- [`complexity.md`](complexity.md) — intrinsic difficulty of the change.
- [`impact.md`](impact.md) — blast radius if the change is wrong.
- [`risk.md`](risk.md) — references the existing risk concept and the security signal.
- [`routing.md`](routing.md) — deterministic mapping from classification to execution depth.

## Reclassification

The initial classification is not immutable. Reclassify when evidence materially changes scope, dependencies, architecture, external integrations, persistence, security or privacy exposure, public contracts, production reach, blast radius or rollback difficulty.

Do not reclassify per subtask or on speculation. A reclassification that changes routing or gate expectations MUST record in `work-item.json`:

```json
{
  "reclassification": [
    {
      "previous": {"complexity": "medium", "impact": "module", "security": "none", "confidence": "high", "routing": "standard"},
      "trigger": "the material evidence observed, with its source",
      "routing_impact": "how routing or gates changed, or why they did not"
    }
  ]
}
```

`previous` carries the full prior dimension set; the live `classification` object carries the new one.

The current `classification` object always states the present dimensions; each entry explains what changed and why.

## Limits of responsibility

The classifier describes the work. It MUST NOT:

- choose or assign agents;
- implement anything;
- authorize production, release or any critical human gate;
- replace planning, specification or any workflow gate;
- invent requirements, files, contracts or test results;
- weaken or reinterpret policy.

Security classification (`none`, `relevant`, `sensitive`) only activates existing contracts such as `security_reviewer.required_when` in `.context/orchestration/config.json` and `policies/core/security-privacy.md`. It adds no security rules of its own.
