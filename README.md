# context-spec-develop

An agent-neutral, conversation-first development kit—from context to verified production change.

`context-spec-develop` is a copyable repository for teams using AI-assisted development. An orchestrator starts the conversation, asks for profile and work classification, creates the required directories and artifacts, delegates small waves to selected agents, and keeps decisions and evidence versioned instead of leaving them in chat history. Deployment infrastructure remains project-owned; this kit records readiness, approval, rollback and observation, then teams use their normal `git add`, `git commit` and `git push` flow.

> Choose the collaborator. Describe the outcome. The orchestrator builds the path. Agents execute bounded work. Humans approve risk and production.

## What it covers

- Product work: discovery, specification, planning, implementation, verification, release and learning.
- Support work: triage, diagnosis, bugs, incidents, hotfixes, deployment, observation and postmortems.
- A common set of gates, prompts and artifacts for humans and coding agents.
- A dependency-free Python validator for structure, metadata, workflow state and required evidence.

## Quick start

1. Use this repository as a GitHub template or copy it into a project.
2. Read [`docs/getting-started.md`](docs/getting-started.md).
3. Fill the project context in [`.context/project/`](.context/project/).
4. Select a workflow in [`.context/workflows/`](.context/workflows/).
5. Copy the relevant templates into `.context/work/<id>/` and complete `work-item.json`.
6. Run `python3 scripts/validate_context.py --strict`.

## Start a conversation

You do not need to know the folder structure. Point your agent at `AGENTS.md` and describe the outcome in plain language. The orchestrator reads the JSON assignments, asks only missing decisions, creates the work-item directory, copies templates and reports the path.

| You provide | The orchestrator creates and coordinates |
| --- | --- |
| Profile and role choices | `conversation_profile` and orchestration assignments |
| Problem or operational signal | Product/Support classification and `work-item.json` |
| Owner, risk and constraints | Intake, specification and plan artifacts |
| Approval decisions | Subtasks, waves, agent handoffs and evidence collection |

Customize roles in [`.context/orchestration/config.json`](.context/orchestration/config.json). Read [`docs/agent-orchestration.md`](docs/agent-orchestration.md) for the complete sequence.

## Choose a path

Selection happens during Intake, after the agent reads `AGENTS.md` and the chosen conversation profile:

| Situation | Path | Start with |
| --- | --- | --- |
| New capability or product improvement | Product feature | `discovery.md` |
| Reproducible defect without active outage | Support bug | `triage.md` + `reproduction.md` |
| Active degradation or outage | Support incident | `triage.md` + `incident.md` |
| Urgent production change | Support hotfix | `triage.md` + `incident.md` |

The common sequence is `Specify → Plan → Preflight → Execute/Test → Verify/Review → Release/Deploy → Observe/Close`.

Do not choose Product or Support from programming language, repository folder or implementation preference. Choose from the request's outcome and operational impact. If unclear, ask whether it is new value, a reproducible defect, active degradation or an urgent correction.

## Create a work item

```bash
mkdir -p .context/work/FEAT-0001
cp .context/templates/product/work-item-feature.json .context/work/FEAT-0001/work-item.json
cp .context/templates/product/discovery.md .context/work/FEAT-0001/discovery.md
cp .context/templates/common/spec.md .context/work/FEAT-0001/spec.md
cp .context/templates/common/plan.md .context/work/FEAT-0001/plan.md
```

Edit `work-item.json`, including the selected `conversation_profile`, then advance its `phase` only when the corresponding gate is complete. Copy the remaining common artifacts as the work progresses. Split `plan.md` into small subtasks and dependency-safe waves before execution. Use `python3 scripts/validate_context.py --strict` before handoff and release.

For a support item, use one of the templates in `.context/templates/support/`. Incidents without code can close with `triage.md`, `incident.md`, `outcome.md` and `postmortem.md`; hotfixes require the full implementation and release evidence.

## Work with an agent

Point the agent to `AGENTS.md` or the adapter for its tool, then provide the current work-item path and phase. At conversation start, choose one profile from [`.context/profiles/`](.context/profiles/), classify the track, and confirm owner/risk. The phase contracts in `.context/prompts/` define what the agent may read, produce and change. Agents prepare evidence; people approve scope, risk, production and closure.

Use optional guidance in [`.context/tooling/`](.context/tooling/) for RTK, Caveman, AI-memory, code-review graphs and subagent waves. These tools reduce noise or improve coordination; they never replace canonical artifacts or validation.

## Validate and update

```bash
python3 scripts/validate_context.py --strict --examples
python3 -m unittest discover -s tests
```

Projects using the central kit record `kit_version` in `.context/config.json` and update it through a reviewed pull request. See [`docs/upgrading.md`](docs/upgrading.md).

The repository is published at [github.com/yanpenalva/context-spec-develop](https://github.com/yanpenalva/context-spec-develop).

## Documentation map

- [`docs/getting-started.md`](docs/getting-started.md) — first installation.
- [`docs/concepts-and-glossary.md`](docs/concepts-and-glossary.md) — vocabulary and boundaries.
- [`docs/methodology.md`](docs/methodology.md) — delivery model.
- [`docs/enterprise-adoption.md`](docs/enterprise-adoption.md) — governance, rollout and metrics.
- [`docs/executive-overview.pt-BR.md`](docs/executive-overview.pt-BR.md) — internal presentation one-pager.
- [`docs/standards-and-references.md`](docs/standards-and-references.md) — external reference mapping.
- [`docs/operating-model.md`](docs/operating-model.md) — roles, gates and decision ownership.
- [`docs/artifacts-and-gates.md`](docs/artifacts-and-gates.md) — artifact contract by phase.
- [`docs/agent-compatibility.md`](docs/agent-compatibility.md) — adapter behavior and boundaries.
- [`.context/profiles/`](.context/profiles/) — conversation roles and startup questions.
- [`.context/orchestration/config.json`](.context/orchestration/config.json) — who orchestrates, plans, executes, reviews and approves.
- [`docs/agent-orchestration.md`](docs/agent-orchestration.md) — automatic startup, directory creation and delegation sequence.
- [`.context/tooling/`](.context/tooling/) — optional RTK, Caveman, AI-memory and review-graph guidance.
- [`docs/customization.md`](docs/customization.md) — project-specific extensions.
- [`docs/context-maintenance.md`](docs/context-maintenance.md) — keeping context current.
- [`docs/upgrading.md`](docs/upgrading.md) — central kit snapshot upgrades.
- [`docs/migration-from-project-context.md`](docs/migration-from-project-context.md) — migration from an existing context.
- [`.context/policies/`](.context/policies/) — normative core policies.
- [`adapters/`](adapters/) — thin entry points for compatible agents.
- [`examples/acme-orders/`](examples/acme-orders/) — complete Product and Support examples.

The canonical instructions are in `.context/`. `AGENTS.md` and files under `adapters/` only point compatible agents to that source.

There is no deployment workflow or CI configuration in this kit. Configure deployment separately in the consuming project; use this repository to prepare, validate, review and record the change before normal Git operations.

## Git delivery

After the required gates and local validation pass, commit the versioned artifacts with the implementation using the consuming project's normal review process:

```bash
git add .context/work/<id> path/to/changed/files
git commit -m "type(scope): describe the approved change"
git push
```

The kit does not decide branch names, hosting rules or deployment commands. The release artifact records who authorized the change, what was observed and which project-owned deployment process applies.

## Principles

- Evidence over assumptions.
- Human approval at scope, risk and production gates.
- Small, reversible changes.
- Validation and review report findings; they do not silently fix them.
- Context is maintained as a product of the repository, not as a giant prompt.

See [`docs/methodology.md`](docs/methodology.md) for the model, [`docs/customization.md`](docs/customization.md) for adaptation and [`docs/context-maintenance.md`](docs/context-maintenance.md) for ownership.

## License

MIT. See [`LICENSE`](LICENSE).
