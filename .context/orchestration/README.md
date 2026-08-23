# Orchestration Configuration

[`config.json`](config.json) is the customization point for multi-agent work. It answers “who does what?” without duplicating workflow policy.

| Assignment | Meaning |
| --- | --- |
| `orchestrator` | Starts the conversation, asks missing questions, creates the work item and coordinates waves |
| `planner` | Produces the specification/plan and dependency graph |
| `executor` | Selects bounded agents for implementation and tests |
| `reviewer` | Independently checks scope, quality, security and evidence |
| `security_reviewer` | Reviews sensitive, security or AI-impacting work |
| `release_approver` | Human authorization for production and irreversible actions |

Change `agent`, `profile`, `actor`, `pool`, `selection` or `max_parallel` to fit the team. The orchestrator must preserve least privilege, wave dependencies and human approval boundaries.

## Automatic startup

The orchestrator reads `AGENTS.md`, this file and the selected profile. It asks only missing startup questions, creates `.context/work/<id>/`, copies the appropriate templates, writes `work-item.json`, and starts the intake gate. The user should provide decisions, not shell commands for scaffolding.

Agents may prepare Git changes. Push remains subject to the configured human approval. Deployment commands and infrastructure remain outside this repository.
