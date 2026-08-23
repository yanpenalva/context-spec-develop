# Conversation Profiles

Conversation profiles define how an agent collaborates. They do not replace project policies, workflows or human approvals. Select one at conversation start, then select the Product or Support track during intake.

## Startup protocol

1. Ask: “Which profile should guide this conversation?” Present the configured profiles from `config.json`.
2. If the user does not choose, use the configured default and state it briefly.
3. Ask the smallest intake questions needed to classify Product feature, Support bug, Support incident or Support hotfix.
4. Open or create `.context/work/<id>/work-item.json`; record `track`, `type`, owner, risk and current phase.
5. Read only context relevant to the selected profile, track and phase.
6. Split the approved plan into small subtasks and dependency-safe waves before implementation.

Profiles are role lenses, not personas. They must not invent authority, bypass gates or make production decisions.

## Available profiles

| Profile | Best fit |
| --- | --- |
| `senior-software-engineer` | Critical technical delivery across the full lifecycle |
| `delivery-orchestrator` | Conversation routing, delegation, waves and integration |
| `technical-planner` | Scope, contracts, dependencies, risks and execution planning |
| `product-engineer` | Product discovery, specification and measurable outcomes |
| `support-incident-engineer` | Triage, containment, diagnosis and incident closure |
| `devops-release-engineer` | Delivery readiness, rollback and observation |
| `quality-engineer` | Test strategy, regression evidence and quality gates |
| `security-privacy-reviewer` | Security, privacy, AI-use and supply-chain review |

If a task spans roles, keep one primary profile and add named reviewers rather than blending responsibilities invisibly.
