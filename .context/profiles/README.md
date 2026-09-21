# Conversation Profiles

Conversation profiles define how an agent collaborates. They do not replace project policies, workflows or human approvals, and they never determine classification, routing depth or authority: `PROFILE != CLASSIFICATION != ROUTING != AUTHORIZATION`. Select the Product or Support track during intake; the profile resolves lazily (below).

## Resolution protocol

1. Reuse the user's explicit profile choice when stated, or a recorded project/harness preference.
2. Otherwise apply the configured default (`agent_profiles.default` in `config.json`) and state it briefly.
3. Ask which profile should guide the conversation only when no default can satisfy the request or when explicit selection materially changes the collaboration (for example a planning-only or orchestration-shaped request). A trivial or ordinary implementation task never needs the question.
4. Never derive the profile mechanically from routing depth; an extended task may still use the default profile.

## Startup protocol

1. Run the front door first: classify the request, derive routing, build the context manifest (`AGENTS.md`).
2. Resolve the profile per the resolution protocol above; record the resolved profile in `work-item.json`.
3. Ask the smallest intake questions needed to classify Product feature, Support bug, Support incident or Support hotfix.
4. Open or create `.context/work/<id>/work-item.json`; record `track`, `type`, owner, risk and current phase.
5. Read only context relevant to the resolved profile, track and phase.
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
