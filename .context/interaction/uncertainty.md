# Uncertainty Model

Every claim an agent makes has one of four epistemic states. States are recorded in artifacts and evidence sections, never blurred.

| State | Meaning | Notation |
| --- | --- | --- |
| `known` | Observed directly: file read, command run, output captured. | State the fact and its source. |
| `inferred` | Derived from evidence by reasoning. | Mark as inference and name the evidence it derives from. |
| `unknown` | Not currently determinable from available evidence; may become discoverable later. | State what is unknown and why it matters. |
| `not found` | Sought and absent: the repository, context or runtime does not contain it. | Record `NOT FOUND` — the kit's canonical convention (`.context/INDEX.md`). |

Per `policies/core/questioning-and-evidence.md`, an agent MUST NOT transform inference into fact. Assertions without a state are treated as claims, not evidence.

## Confidence

Classification records `confidence` (`low`, `medium`, `high`): how well the evidence supports the assigned dimensions. Confidence is about the classification, not about the work's importance.

## Low confidence is not a question trigger

Low confidence starts a loop, never an automatic question:

```text
confidence low
→ inspect more (sources above)
→ evaluate materiality of what remains uncertain
→ apply decision-policy.md
→ ask only if HUMAN_DECISION_REQUIRED
```

Asking directly from low confidence violates the questioning rule in `policies/core/questioning-and-evidence.md` when the uncertainty is discoverable or immaterial.

## Materiality test

An uncertainty is material when the answer could change:

- scope or acceptance criteria;
- behavior or contract visible to consumers;
- architecture or dependency boundaries;
- cost, effort or delivery path;
- risk, security or authorization needs.

Material + `HUMAN_DECISION_REQUIRED` → ask per `questioning.md`. Material + protected boundary → `CRITICAL_HUMAN_GATE`. Not material → `ASSUMPTION_ALLOWED` or continue and record.
