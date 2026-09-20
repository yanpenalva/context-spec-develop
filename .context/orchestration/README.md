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

At startup, ask whether Git finalization should be `confirm_each` or `automatic`; record the answer in the work item. The default asks separately before commit and push. Automatic mode is limited to a validated work item and verified branch/remote. Deployment commands and infrastructure remain outside this repository.

## Pull requests

The optional `pull_request` block configures how pull requests are opened:

| Field | Meaning |
| --- | --- |
| `mode` | `never` (default) keeps the current push-only flow; `manual` means the agent drafts the PR title and body and a human opens it; `automatic` means the agent runs the configured project command after a successful push |
| `command` | The project-owned CLI command that opens a pull request on the team's forge; it MUST only open PRs — merging, force and administrative flags are rejected by the validator |
| `draft_default` | Open pull requests as drafts when supported |
| `merge_requires_human_approval` | Always `true`; review and merge stay human decisions |

The kit ships no forge CLI. `automatic` mode additionally requires `git.finalization_mode: automatic` and a configured `command`; the validator enforces both. Record the opened PR reference in `release.md`.
