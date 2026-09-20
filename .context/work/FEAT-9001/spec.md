# Specification: Classification Layer and Human Interaction Protocol

## Objective

Give any compatible harness two canonical contracts inside `.context/`:

1. `.context/classification/` — a declarative description of the work (complexity, impact, security signal, confidence) and a deterministic routing rule that selects execution depth.
2. `.context/interaction/` — the canonical protocol for questioning, decision categories, uncertainty handling and escalation between human and agent.

## In scope

- New canonical directories and files listed above; no `classifier/` at the repository root.
- Optional `classification` object and bounded `reclassification` array on `work-item.json`, schema and validator support.
- Deterministic routing derivation (minimal, standard, extended) validated structurally.
- Intake, start-conversation and preflight prompt contracts reference the new layers without duplicating policy.
- `AGENTS.md` and `INDEX.md` gain pointers only.
- Acme Orders examples extended to six demonstrated cases.
- Documentation, glossary, migration note, CHANGELOG and validator tests.

## Out of scope

- Any implementation engine (LLM or external classifier); classification stays an implementation-independent contract.
- Changes to existing gates, MUST policies, Git safety or human approval boundaries.
- Removal or rewrite of `policies/core/questioning-and-evidence.md`; the interaction layer references it.
- Track, type or risk duplication inside `classification` (they remain canonical at the work-item root).
- Vendor- or harness-specific rules in adapters.

## Evidence

- Repository inspection recorded in `discovery.md`.
- Existing rules reused: questioning-and-evidence policy, NOT FOUND convention, review-release human approval, security-privacy policy, decomposition waves, orchestration `security_reviewer.required_when`, phase transitions and artifacts.

## Rules and contracts

- `classification` is optional; when present it must be complete and valid (all five dimensions, closed enums).
- Routing derives deterministically: minimal when complexity low, risk low, impact local and security none; extended when complexity high, risk high or critical, impact cross-module or system, or security sensitive; standard otherwise. The validator enforces the derivation.
- Security values align with existing vocabulary: none, relevant, sensitive (matches `security_or_sensitive_data_impact`).
- Reclassification entries require previous classification, trigger evidence and routing impact; only material changes qualify.
- Interaction decision categories: DISCOVERABLE, REVERSIBLE_AGENT_DECISION, ASSUMPTION_ALLOWED, HUMAN_DECISION_REQUIRED, CRITICAL_HUMAN_GATE, BLOCKED. Critical gates match the existing human-approval boundaries (production, destructive operations, risk acceptance, sensitive data, security exceptions, irreversible migrations, release authorization, policy exceptions, unauthorized external communication).
- Uncertainty vocabulary: known, inferred, unknown, NOT FOUND (canonical convention preserved).
- Low confidence routes through the interaction protocol (inspect more, evaluate materiality); it never automatically triggers a question.

## Security impact

None. No code, secrets, credentials or data handling change. The classification security signal activates the existing security reviewer contract; it does not weaken any security policy.

## Tests

- `tests/test_validate_context.py`: valid classification passes; invalid dimension enum fails; routing inconsistent with derivation fails; reclassification entry missing required keys fails; legacy work item without classification still passes; missing classification/interaction directories fail.

## Acceptance criteria

1. All ten new canonical files exist and are linked from `INDEX.md`.
2. Schema and validator accept legacy items and enforce the new optional fields.
3. Existing validator and unit tests pass unchanged in behavior; new cases pass.
4. Examples demonstrate all six cases without validator errors.
5. `AGENTS.md` grows only by pointers; no policy text copied.
6. No vendor or harness names appear in the new contracts.
