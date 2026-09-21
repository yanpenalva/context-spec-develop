# Context Triggers

Triggers are explicit signals that promote a deferred domain to required. They are the only runtime path into `context.required` besides phase requirements and an explicit human request. Every promotion is recordable in the manifest's `triggers` array. After the bootstrap split no domain is mandatory by default; governance holds through the bootstrap and through these promotions.

| Trigger signal | Promotes | Source of the signal |
| --- | --- | --- |
| `security != none` (classification or reclassification) | `security` | classification dimensions |
| Authentication, authorization, secret or personal-data boundary discovered | `security` | runtime evidence |
| Persistence, migration or data-integrity work discovered | `architecture` | runtime evidence |
| `impact ∈ {cross-module, system}` | `architecture` | classification dimensions |
| External integration or public contract change discovered | `architecture` | runtime evidence |
| Production action or release gate approaching | `release` | workflow phase |
| `type ∈ {incident, hotfix}` or active degradation | `incident` | intake track/type |
| Enter `verify` with security-relevant diff | `security` | workflow phase |
| Enter `plan` or `execute` under `extended` routing | `architecture` | routing depth |
| Project-specific behavior, conventions, stack or implementation work | `project` | task nature |
| Planning validation strategy, implementing code that needs tests, entering `verify`, reviewing test evidence, or the task itself concerns tests | `testing` | task/phase |
| Governance, precedence or policy-interpretation question during a gate | `core` | workflow gate |
| Explicit human request for a domain | requested domain | human decision |

## Rules

- A trigger promotes exactly the named domain; it never pulls unrelated domains with it.
- Promotion is one-directional: deferred → required. Domains return to deferred only when a reclassification legitimately removes the signal.
- Record the trigger text in `context.triggers` when the promotion happens during execution, so the manifest stays auditable.
- No trigger exists for "might be useful": that is not a purpose under the inclusion principle in `README.md`.
- Targeted discovery at classification time is not a trigger: gathering a fact to classify does not promote the domain that fact came from.
