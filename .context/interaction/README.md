# Interaction Protocol

This is the canonical contract for human↔agent interaction: when to investigate, when to decide, when to ask, when to stop and when to escalate. It operationalizes `policies/core/questioning-and-evidence.md` (normative rules), `policies/core/review-release.md` (approval boundaries) and `policies/core/ai-governance.md`. Where a policy states a MUST, the policy wins; this layer defines the procedure.

Any harness that follows `AGENTS.md` into `.context/` applies this protocol identically. It contains no tool- or vendor-specific rules.

## The questions every harness must answer

Before acting on incomplete information, determine — in this order:

```text
Can I discover this myself?        → inspect (see questioning.md)
Can I infer this safely?           → evidence + inference rules (see uncertainty.md)
Can I decide this myself?          → decision categories (see decision-policy.md)
Should I record an assumption?     → ASSUMPTION_ALLOWED conditions
Should I ask the human?            → HUMAN_DECISION_REQUIRED only
Must I stop?                       → CRITICAL_HUMAN_GATE (authorization) or BLOCKED (no safe path)
Must I escalate?                   → escalation triggers (see escalation.md)
```

Every unresolved point carries two independent values: a **decision category** (who has authority: `DISCOVERABLE`, `REVERSIBLE_AGENT_DECISION`, `ASSUMPTION_ALLOWED`, `HUMAN_DECISION_REQUIRED`, `CRITICAL_HUMAN_GATE`) and an **execution state** (whether work proceeds: `CONTINUE`, `WAITING_FOR_HUMAN`, `BLOCKED`). Precedence and the mapping between the two are defined in `decision-policy.md`.

## Decision order

```text
1. Inspect the repository, project context, work item, specs, tests,
   implementation, policies, schemas and available runtime evidence.
2. Gather evidence; record what is known, inferred, unknown or NOT FOUND.
3. Determine uncertainty and confidence.
4. Determine materiality: could the unknown change scope, behavior,
   contract, risk, cost or authorization?
5. Decide whether agent authority is sufficient for the decision.
6. Ask the human only when human input changes the path.
7. Record the decision, evidence and any assumption in the work item.
8. Continue, or stop/escalate per decision-policy.md and escalation.md.
```

## Boundaries that never move

- Critical human gates (production, destructive operations, risk acceptance, sensitive-data boundaries, security exceptions, irreversible migrations, release authorization, policy exceptions, external communication) require explicit human authorization. See `decision-policy.md`.
- Agents never invent evidence; missing facts are `NOT FOUND`.
- Reclassification, not persuasion, handles material new evidence (`.context/classification/README.md`).

## File map

| File | Covers |
| --- | --- |
| [`questioning.md`](questioning.md) | The rule for asking, the investigation-first order, question formats |
| [`decision-policy.md`](decision-policy.md) | Decision categories and their required behavior |
| [`uncertainty.md`](uncertainty.md) | known / inferred / unknown / NOT FOUND and confidence handling |
| [`escalation.md`](escalation.md) | Escalation triggers and the required escalation report |
