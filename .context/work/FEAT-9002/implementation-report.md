# Implementation Report: Classification Layer, Interaction Protocol and Delivery Automation

Internal document for external architectural review. It describes what was implemented in this repository, why, and how it is validated. It is self-contained: excerpts of the key contracts are included so the document can be evaluated without repository access.

## 1. Context

The repository is `context-spec-develop`: an agent-neutral, harness-neutral delivery kit. `.context/` is the canonical source of truth (policies, workflows, prompts, orchestration, schemas, templates); `AGENTS.md` and the adapter files are thin entry points that only route compatible agents to `.context/`. A dependency-free Python validator (`scripts/validate_context.py`) enforces structural contracts; a unit suite (`tests/`) guards its behavior. Humans retain approval for scope, risk acceptance, production authorization and closure.

Two capabilities were requested and delivered:

1. **FEAT-9001** — a declarative classification layer and a canonical human↔agent interaction protocol.
2. **FEAT-9002** — explicit options for automatic commit/push finalization and pull-request opening, with validator guardrails.

## 2. Architecture after the change

```text
USER REQUEST
     ↓
AGENTS.md (thin adapter, pointers only)
     ↓
CONTEXT DISCOVERY (.context/INDEX.md)
     ↓
INTAKE (prompts/intake.md) → track, type, owner, risk, git_finalization_mode
     ↓
CLASSIFICATION (.context/classification/)
     complexity, impact, security, confidence → routing (deterministic)
     ↓
INTERACTION CHECK (.context/interaction/)
     decision categories, questioning, uncertainty, escalation
     ↓
WORK ITEM (work-item.json: optional classification + reclassification)
     ↓
ROUTING DEPTH: minimal | standard | extended (existing gates, scaled)
     ↓
EXISTING GATES: Specify → Plan → Preflight → Execute → Verify → Release → Close
     ↓                                        ↑
     └── new material evidence → RECLASSIFY ──┘ (continue / adjust / ask / escalate)
```

Responsibility separation (SRP):

| Layer | Question it answers |
| --- | --- |
| `.context/classification/` | What kind of work is this, and how deep must the workflow run? |
| `.context/interaction/` | When and how must the human participate? |
| `.context/orchestration/` | Who or what coordinates and executes? |
| `.context/workflows/` | Which phases and gates govern delivery? |

## 3. Classification layer (FEAT-9001)

### 3.1 Dimensions

Recorded on the work item as an optional `classification` object:

```json
{
  "classification": {
    "complexity": "low|medium|high",
    "impact": "local|module|cross-module|system",
    "security": "none|relevant|sensitive",
    "confidence": "low|medium|high",
    "routing": "minimal|standard|extended"
  }
}
```

Semantic independence is explicit in the contracts: complexity is intrinsic difficulty, impact is blast radius, risk stays canonical at the work-item root, severity stays an incident metric, and the security signal only *activates* existing contracts (`security_reviewer.required_when`, `policies/core/security-privacy.md`) — it adds no rules.

### 3.2 Deterministic routing

`routing` is derived, not free-form, and the validator enforces the derivation:

```text
1. complexity = high OR risk ∈ {high, critical}
   OR impact ∈ {cross-module, system} OR security = sensitive   → extended
2. complexity = low AND risk = low AND impact = local
   AND security = none                                          → minimal
3. otherwise                                                    → standard
```

All three depths run the same gate sequence with the same evidence rules; depth scales decomposition, review independence and security review — it never removes a gate or weakens a MUST. Agents cannot downgrade a route; humans may upgrade it.

### 3.3 Reclassification

Material new evidence (scope, dependencies, architecture, integrations, persistence, security, public contracts, production, blast radius, rollback) triggers reclassification. Recorded as bounded entries; the live `classification` object always states present dimensions:

```json
{
  "reclassification": [
    {
      "previous": {"complexity": "medium", "impact": "module", "security": "none", "confidence": "medium", "routing": "standard"},
      "trigger": "observed evidence with source",
      "routing_impact": "routing raised from standard to extended; dependency analysis added"
    }
  ]
}
```

## 4. Interaction protocol (FEAT-9001)

### 4.1 Decision order

```text
1. Inspect (repository, context, work item, specs, tests, implementation, policies, schemas, runtime evidence)
2. Gather evidence (known / inferred / unknown / NOT FOUND)
3. Determine uncertainty and confidence
4. Determine materiality
5. Decide whether agent authority suffices
6. Ask only if human input changes the path
7. Record decision, evidence, assumptions
8. Continue, or stop/escalate
```

### 4.2 Decision categories

| Category | Behavior |
| --- | --- |
| `DISCOVERABLE` | Investigate; never ask |
| `REVERSIBLE_AGENT_DECISION` | Agent decides, records, continues |
| `ASSUMPTION_ALLOWED` | Explicit recorded assumption; low-risk, reversible, no contract change |
| `HUMAN_DECISION_REQUIRED` | Evidence + options + trade-offs + one decision-changing question |
| `CRITICAL_HUMAN_GATE` | Stop; explicit human authorization (production, destructive ops, risk acceptance, sensitive data, security exceptions, irreversible migrations, release, policy exceptions, unauthorized external communication) |
| `BLOCKED` | Explain the exact blocker; request only the needed information |

### 4.3 Key rules

- **Questioning rule**: do not ask because information is missing; ask when the missing information can materially change the correct path and cannot reasonably be discovered. The normative MUSTs remain in `policies/core/questioning-and-evidence.md`; `.context/interaction/` adds procedure (formats, categories, recommendation policy) and references the policy — no second normative source.
- **Uncertainty**: four states (known, inferred, unknown, NOT FOUND). Low confidence triggers *inspect more → evaluate materiality → apply decision policy*, never an automatic question.
- **Escalation report**: what changed, evidence, what is affected, can work continue safely, which human decision is required. Silence is never approval.

## 5. Delivery automation (FEAT-9002)

The orchestration contract gained an optional `pull_request` block:

```json
{
  "pull_request": {
    "mode": "never|manual|automatic",
    "command": null,
    "draft_default": true,
    "merge_requires_human_approval": true
  }
}
```

- `git.finalization_mode: automatic` (existing): validated commit and push without repeated questions, scoped to the recorded work item, branch and remote.
- `pull_request.mode`: `never` (default, unchanged behavior), `manual` (agent drafts PR title/body, human opens), `automatic` (agent runs the project-configured PR command after push).
- Guardrails, enforced by the validator:
  - `merge_requires_human_approval` must be `true` (also `const: true` in the JSON Schema);
  - `automatic` requires `git.finalization_mode: automatic` and a configured, non-placeholder command;
  - the command must not contain `merge`, `--admin`, `--force` or `rebase` fragments;
  - the kit ships no forge CLI — the command is project-owned, keeping the core platform-neutral.
- Opening a PR never approves or merges it.

## 6. Schema and validator changes

- `work-item.schema.json`: optional `classification` object (all five dimensions required inside, closed enums, `additionalProperties: false`) and optional bounded `reclassification` array. Not in top-level `required` → backward compatible.
- `orchestration.schema.json`: optional `pull_request` object with `merge_requires_human_approval` as a constant.
- `scripts/validate_context.py`: required-file and required-directory entries for the ten new contract files; `derive_routing()` implementing §3.2; `check_item_classification()` (enums, completeness, routing consistency, reclassification shape); `check_pull_request()` (guardrails). The validator remains deterministic and structural — it never judges whether a task "should" be high complexity.

## 7. Dogfooding and examples

- The kit's own work items (`FEAT-9001`, `FEAT-9002`) carry classification and followed the protocol; FEAT-9001 routed `extended`, FEAT-9002 `standard`.
- `examples/acme-orders/` demonstrates the six required cases: minimal (FEAT-1001), standard (BUG-2001), extended (HOT-4001), human decision with recorded answer (FEAT-1002), critical-gate stop (FEAT-1003), reclassification with trigger and routing impact (FEAT-1004).
- During development the routing-derivation check caught a wave-DAG error in FEAT-9001's plan and two template/narrative mismatches — the derivation check proved its value immediately.

## 8. Validation evidence

```text
python3 scripts/validate_context.py --strict --examples  → Context validation passed. (exit 0)
python3 -m unittest discover -s tests                    → Ran 30 tests ... OK
```

Test coverage added: classification enums, routing-derivation mismatch, reclassification required fields, legacy work items without classification (backward compatibility), missing contract files, PR merge-flag guardrail, PR automatic-mode coupling, PR missing command, PR command merge-fragment rejection, PR never-mode default.

## 9. Design decisions (with alternatives)

1. **Routing derived and validator-enforced** (vs advisory docs or LLM-judged): determinism across harnesses; catches contradictions mechanically.
2. **`classification` optional** (vs required with migration): backward compatibility; CONTRIBUTING requires migration notes for schema fields.
3. **Security signal `none/relevant/sensitive`** (vs boolean or new scale): matches existing vocabulary and activates existing contracts instead of duplicating them.
4. **Interaction layer references policy** (vs moving or restating `questioning-and-evidence.md`): single normative source; new files are operational procedure only.
5. **Reclassification as bounded entries** (vs full history array or prose): satisfies recordability without turning `work-item.json` into a log.
6. **PR command project-owned** (vs bundling a forge CLI): keeps the core platform-neutral per CONTRIBUTING; validator guards the boundary.

## 10. Boundaries preserved

- Human approval for scope, risk, production, release, exceptions and merges — automation can prepare and open, never approve or merge.
- Git safety unchanged: no force push, no hard reset/clean, tags need approval, `automatic` scoped to the recorded item/branch/remote.
- Agent and harness neutrality: no vendor or tool names in the new contracts (scan verified); adapters untouched; `AGENTS.md` grew by pointers only.
- Evidence over assumption; `NOT FOUND` convention preserved.

## 11. Known limitations

- The validator checks structure and derivation, not semantic correctness of a classification — intentional.
- The PR-command guardrail is fragment-based; it cannot understand arbitrary command semantics. Projects choose the command; review applies.
- Reviews ran in the same session as implementation (recorded in both review artifacts); adopters should apply their own review before upgrading.
- Schema validation is structural via the dependency-free validator; the repository has no third-party JSON Schema runner.

## 12. Suggested review questions for the evaluator

1. Is the routing derivation (§3.2) the right cut point between classification (description) and workflow (gates), or should depth influence gates more directly?
2. Are the six decision categories (§4.2) exhaustive and mutually exclusive enough for reliable agent behavior across harnesses?
3. Is the fragment-based PR command guardrail acceptable, or should the contract move to a structured command declaration?
4. Any normative duplication between `.context/interaction/` and `policies/core/questioning-and-evidence.md` that survived the review?
5. Is the backward-compatibility posture (optional fields, default `never`) sufficient for consuming projects?

## 13. File inventory

Created: `.context/classification/{README,complexity,risk,impact,routing}.md`; `.context/interaction/{README,questioning,decision-policy,uncertainty,escalation}.md`; `examples/acme-orders/{FEAT-1002,FEAT-1003,FEAT-1004}/`; work items `FEAT-9001`, `FEAT-9002`.

Modified: `work-item.schema.json`, `orchestration.schema.json`, `orchestration/config.json`, `scripts/validate_context.py`, `tests/test_validate_context.py`, five work-item templates, `prompts/{intake,start-conversation,preflight,close}.md`, `.context/INDEX.md`, `AGENTS.md`, `policies/core/review-release.md`, `orchestration/README.md`, `README.md`, `CHANGELOG.md`, seven `docs/` files, four existing examples.
