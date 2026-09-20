# Escalation

Escalation moves a decision above the current conversation or phase because the situation exceeds the agent's authority or the approved scope. It is distinct from a normal question: a question fits inside the current scope; an escalation changes or threatens it.

## Triggers

Escalate when any of these occurs:

- scope materially changed versus the approved spec;
- classification changed (reclassification with routing or gate impact);
- risk increased (root `risk` or the security signal rose);
- security or privacy exposure discovered that classification did not anticipate;
- a destructive or irreversible action becomes required;
- an architecture boundary would change;
- a public contract is affected;
- production impact is discovered or now possible;
- present authorization is insufficient for the next step;
- evidence conflicts and cannot be resolved by inspection;
- a required validation cannot be performed.

Related standing rules: `subagents.stop_on_scope_change` in `.context/orchestration/config.json`, the stop conditions in each `.context/prompts/*.md`, and scope-change handling in `policies/core/decomposition.md`.

## Escalation report

Every escalation MUST state:

```text
What changed?            <the material difference>
Evidence:                <what was observed, with sources>
What is affected?        <scope, contracts, systems, phases, gates>
Can work continue safely? <yes with bounds / no, and why>
Human decision required: <the exact decision or authorization needed>
```

Route the report through the current gate: record it in the work item artifact for the phase and stop the affected line of work until the human decision is recorded. When progress depends on the answer, the execution state is `WAITING_FOR_HUMAN` (`decision-policy.md`); mark the work item `status: blocked` only when no safe path exists even after the decision — for example a required validation cannot be performed.

## After escalation

- A granted decision updates the work item (and classification when dimensions moved) before work resumes.
- A denied or absent decision stops the work; record the outcome honestly.
- Escalation never authorizes itself: agents cannot grant their own escalation or treat silence as approval.
