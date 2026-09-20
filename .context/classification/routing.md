# Routing

Routing converts a classification into execution depth. It answers: **how deep must the workflow run?** Routing has two values: the **derived routing**, computed deterministically from `complexity`, root `risk`, `impact` and `security`; and the **effective routing**, the depth actually in effect after an optional authorized override. Routing selects depth inside the existing gates; it never removes a gate or weakens a policy MUST.

## Derivation

Evaluate in order and stop at the first match:

```text
1. complexity = high
   OR risk in {high, critical}
   OR impact in {cross-module, system}
   OR security = sensitive            → extended
2. complexity = low
   AND risk = low
   AND impact = local
   AND security = none                → minimal
3. otherwise                          → standard
```

The validator enforces this derivation on every work item that carries a `classification` object.

## Depth contracts

Routing names phases from `workflows/core.md` and its Product/Support overlays. All routes share the same gate sequence and evidence rules; they differ in decomposition depth, review independence effort and security-review activation.

### minimal

```text
Intake + classification
→ Specify
→ Plan (single subtask, single wave)
→ Preflight
→ Execute and Test
→ Verify and Review
→ Release (only if production-affecting) and Close
```

Suitable for low-risk, local, reversible work. The plan may be one subtask; artifacts stay concise. Review independence still follows `policies/core/review-release.md`; a production-affecting release keeps its human approver.

### standard

```text
Intake + classification
→ Specify
→ Plan
→ Subtasks and dependency-safe waves
→ Preflight
→ Execute and Test
→ Verify and Review
→ Release (only if production-affecting) and Close
```

Default depth. Decomposition into waves per `policies/core/decomposition.md`; reviewer independent of implementation when practical.

### extended

```text
Intake + classification
→ Specify
→ Deep plan (alternatives, migration, rollback, dependency analysis)
→ Subtasks and dependency-safe waves
→ Preflight (explicit depth-vs-routing check)
→ Execute and Test
→ Validate and integrate evidence per wave
→ Verify
→ Security review when security is relevant or sensitive
→ Independent review
→ Release gate with human authorization when production-affecting
→ Observe and Close
```

Required for architectural, cross-module, high-risk or sensitive work. Every critical human gate from `.context/interaction/decision-policy.md` applies in full.

## Interaction with orchestration

Orchestration maps routing to actors: wave size and reviewer independence scale with depth, and `security_reviewer` activates from the security signal. Orchestration never upgrades a route by assigning a stronger agent, and classification never assigns agents.

## Derived and effective routing

```text
classification → derived routing → optional authorized override → effective routing
```

- `derived` is always exactly the derivation above. Never adjust `complexity`, `risk`, `impact` or `security` to produce a desired depth.
- `effective` equals `derived` unless a human explicitly overrides upward.
- The work item records both:

```json
{
  "routing": {
    "derived": "standard",
    "effective": "extended",
    "override": {"authority": "human", "reason": "touches the billing path before quarter close"}
  }
}
```

## Overrides

Overrides may only increase depth:

```text
minimal → standard    minimal → extended    standard → extended
```

Never:

```text
extended → standard    extended → minimal    standard → minimal
```

An override records derived routing, effective routing, the authority (`human`) and the reason. The validator rejects downgrades, missing reasons, non-human authority and inconsistencies between the two values. Downgrading happens only through legitimate reclassification based on evidence: the dimensions change, the derivation changes, and `derived` moves with them.
