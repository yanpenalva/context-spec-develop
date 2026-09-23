# context-spec-develop

An agent-neutral, conversation-first development kit—from context to verified production change.

`context-spec-develop` is a copyable repository for teams using AI-assisted development. An orchestrator starts the conversation, asks for profile and work classification, creates the required directories and artifacts, delegates small waves to selected agents, and keeps decisions and evidence versioned instead of leaving them in chat history. Deployment infrastructure remains project-owned; this kit records readiness, approval, rollback and observation, then teams use their normal `git add`, `git commit` and `git push` flow.

> Choose the collaborator. Describe the outcome. The orchestrator builds the path. Agents execute bounded work. Humans approve risk and production.

## Install as a reusable skill

The package can install the CSD skill and the native activation entrypoint for the current agent setup:

```bash
npx @owlcodium/context-spec-develop install
```

Choose `global` to use CSD across repositories or `project` to version the skill with one repository. You can select explicit targets with `--agents codex,claude-code,cursor,copilot,gemini,opencode`.

After installation, use `/csd` in hosts with custom commands, `$csd` in Codex, or select the `csd` custom agent in Copilot. The first invocation previews the project bootstrap and asks for one confirmation before creating `.context/`.

## What it covers

- Product work: discovery, specification, planning, implementation, verification, release and learning.
- Support work: triage, diagnosis, bugs, incidents, hotfixes, deployment, observation and postmortems.
- A common set of gates, prompts and artifacts for humans and coding agents.
- Declarative work classification (complexity, impact, security, confidence) with deterministic routing depth and a canonical human↔agent interaction protocol.
- Context routing with progressive disclosure: a minimal bootstrap, immediate classification, then only the minimum sufficient canonical context per phase — project and testing domains load lazily, when triggered. Classification, routing and context routing are intrinsic front-door stages of every request. See [`docs/examples/end-to-end-context-routing.md`](docs/examples/end-to-end-context-routing.md).
- Agent-assisted project onboarding: one prompt initializes the canonical project context from repository evidence; humans answer only what cannot be discovered.
- A reproducible, vendor-neutral benchmark measuring structural context size (eager baseline versus routed) across five scenario classes: [`benchmarks/`](benchmarks/), plus a golden-dataset benchmark for classification quality and safety: [`benchmarks/classification/`](benchmarks/classification/).
- A dependency-free Python validator for structure, metadata, workflow state and required evidence.
- An intentionally opinionated, framework-neutral code-quality baseline that teams can adapt to their own language, tooling and risk profile.

## Quick start

```text
INSTALL ONCE  →  INITIALIZE PROJECT  →  WORK NORMALLY
```

1. Install the package with `npx @owlcodium/context-spec-develop install`, or use this repository as a GitHub template when you want to inspect or customize the canonical source.
2. Activate CSD in the installed harness. The skill inspects existing context first, then previews the configured layout before bootstrapping it after confirmation.
3. Point your agent at `AGENTS.md` and say: **"Initialize context-spec-develop for this repository."** The agent discovers repository facts, populates the selected project context, checks optional module-documentation roots, records unknowns as `NOT FOUND` and asks only non-discoverable material questions. If no module documentation exists, it asks once before creating the generic scaffold. Filling the files by hand remains a valid manual fallback.
4. Review only the unresolved material decisions the agent reports.
5. Run `python3 scripts/validate_context.py --strict`.

Context discovery, optional module documentation and supported layouts are described in [docs/context-discovery.md](docs/context-discovery.md).

6. Describe the work in plain language. Read [`docs/getting-started.md`](docs/getting-started.md); Portuguese-speaking teams can start with [`docs/quickstart.pt-BR.md`](docs/quickstart.pt-BR.md).

## Start a conversation

After initialization you do not need workflow instructions. Point your agent at `AGENTS.md` and describe the outcome:

```text
Add an optional status filter to the orders endpoint.
```

When the harness follows `AGENTS.md`, every request automatically enters the front door — minimal bootstrap, classification, deterministic routing, context routing, then the workflow. You never need to say "classify this", "use context routing" or "optimize tokens": the user describes the work; the framework governs the process.

| You provide | The orchestrator creates and coordinates |
| --- | --- |
| Problem or operational signal | Product/Support classification and `work-item.json` |
| Owner, risk and constraints | Intake, specification and plan artifacts |
| Approval decisions | Subtasks, waves, agent handoffs and evidence collection |

This protocol binds agents that follow `AGENTS.md` (or a thin adapter); the kit cannot force tools that never read it to obey — see [`docs/agent-compatibility.md`](docs/agent-compatibility.md).

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

After intake, `.context/classification/` sets complexity, impact, the security signal and confidence, and derives the routing depth; `.context/interaction/` governs every question, assumption, decision and escalation with any harness.

## Create a work item manually (fallback)

```bash
mkdir -p .context/work/FEAT-0001
cp .context/templates/product/work-item-feature.json .context/work/FEAT-0001/work-item.json
cp .context/templates/product/discovery.md .context/work/FEAT-0001/discovery.md
cp .context/templates/common/spec.md .context/work/FEAT-0001/spec.md
cp .context/templates/common/plan.md .context/work/FEAT-0001/plan.md
```

Edit `work-item.json`, including the selected `conversation_profile`, then advance its `phase` only when the corresponding gate is complete. Copy the remaining common artifacts as the work progresses. Split `plan.md` into small subtasks and dependency-safe waves before execution. Use `python3 scripts/validate_context.py --strict` before handoff and release.

For a support item, use one of the templates in `.context/templates/support/`. Incidents without code can close with `triage.md`, `incident.md`, `outcome.md` and `postmortem.md`; hotfixes require the full implementation and release evidence.

## Classify with any executor

Classification, deterministic routing and context routing are **mandatory protocol stages** of every daily request — the kit contains no `use_classifier` decision. What is configurable is only the **executor**: the main agent classifies out of the box (zero configuration); a dedicated classifier or a hybrid strategy is an optional optimization — with protected signals, acceptance policy and fallback to the same-agent path defined by [`.context/classification/classifier-contract.md`](.context/classification/classifier-contract.md) and explained in [`docs/classifier-strategies.md`](docs/classifier-strategies.md). No model or provider is required or named by the kit, and choosing an executor never requires editing the framework or adding classifier credentials to it.

```text
              MANDATORY CLASSIFICATION
                        │  executed by (harness choice)
            ┌───────────┼────────────┐
            ▼           ▼            ▼
       SAME AGENT    SUBAGENT    LIGHTWEIGHT
       zero-config                EXECUTOR
            └───────────┼────────────┘
                        ▼
              CANONICAL CLASSIFICATION
                        ▼
              derive_routing()  (deterministic)
                        ▼
              CONTEXT ROUTING (mandatory)
                        ▼
          minimum sufficient context → workflow
```

The full lifecycle — installation/onboarding versus daily work, with reclassification on new evidence — is documented in [`docs/concepts-and-glossary.md`](docs/concepts-and-glossary.md) and the canonical contracts under [`.context/`](.context/INDEX.md).

## Work with an agent

Point the agent to `AGENTS.md` or the adapter for its tool, then provide the current work-item path and phase. After the front door (classification, routing, context routing), the agent resolves remaining decisions on demand: explicit choices and recorded preferences are reused, safe configured defaults apply, and only material unresolved decisions are asked — a normal task needs no profile or Git-mode questionnaire. The phase contracts in `.context/prompts/` define what the agent may read, produce and change. Agents prepare evidence; people approve scope, risk, production and closure.

Use optional guidance in [`.context/tooling/`](.context/tooling/) for RTK, AI-memory, code-review graphs and subtask waves. These tools reduce noise or improve coordination; they never replace canonical artifacts or validation.

## MCP clients (ChatGPT and any MCP host)

`csd mcp` starts an official MCP server (stdio) over a local repository, so MCP clients can drive CSD without installing a per-host skill:

```bash
csd mcp --root /absolute/path/to/repository
```

The server exposes seven tools — `csd_inspect`, `csd_context`, `csd_work_item`, `csd_write_artifact`, `csd_validate`, `csd_bootstrap_preview`, `csd_bootstrap_apply` — as a transport and access boundary only: the selected context layout stays canonical, durable state stays under its normalized work root, and a task started by ChatGPT over MCP is continued by Codex, Claude or any other adapter from the same files. See [`docs/mcp.md`](docs/mcp.md).

## Validate and update

```bash
python3 scripts/validate_context.py --strict --examples
python3 -m unittest discover -s tests
```

Projects using the central kit record `kit_version` in `.context/config.json` and update it through a reviewed pull request. Installed harness files update with `csd update`; the context snapshot updates separately with `csd update --context` after a preview. See [`docs/upgrading.md`](docs/upgrading.md).

The repository is published at [github.com/yanpenalva/context-spec-develop](https://github.com/yanpenalva/context-spec-develop).

## Documentation map

- [`docs/getting-started.md`](docs/getting-started.md) — first installation.
- [`docs/quickstart.pt-BR.md`](docs/quickstart.pt-BR.md) — português, primeira conversa e troubleshooting.
- [`docs/concepts-and-glossary.md`](docs/concepts-and-glossary.md) — vocabulary and boundaries.
- [`docs/methodology.md`](docs/methodology.md) — delivery model.
- [`docs/enterprise-adoption.md`](docs/enterprise-adoption.md) — governance, rollout and metrics.
- [`docs/executive-overview.pt-BR.md`](docs/executive-overview.pt-BR.md) — internal presentation one-pager.
- [`docs/standards-and-references.md`](docs/standards-and-references.md) — external reference mapping.
- [`docs/operating-model.md`](docs/operating-model.md) — roles, gates and decision ownership.
- [`docs/artifacts-and-gates.md`](docs/artifacts-and-gates.md) — artifact contract by phase.
- [`docs/mcp.md`](docs/mcp.md) — MCP server: tools, security model and cross-agent handoff.
- [`docs/agent-compatibility.md`](docs/agent-compatibility.md) — adapter behavior and boundaries.
- [`.context/profiles/`](.context/profiles/) — conversation roles and startup questions.
- [`.context/orchestration/config.json`](.context/orchestration/config.json) — who orchestrates, plans, executes, reviews and approves.
- [`docs/agent-orchestration.md`](docs/agent-orchestration.md) — automatic startup, directory creation and delegation sequence.
- [`.context/tooling/`](.context/tooling/) — optional RTK, AI-memory and review-graph guidance.
- [`docs/customization.md`](docs/customization.md) — project-specific extensions.
- [`docs/context-maintenance.md`](docs/context-maintenance.md) — keeping context current.
- [`docs/upgrading.md`](docs/upgrading.md) — central kit snapshot upgrades.
- [`docs/migration-from-project-context.md`](docs/migration-from-project-context.md) — migration from an existing context.
- [`.context/policies/`](.context/policies/) — normative core policies.
- [`.context/classification/`](.context/classification/) — classification dimensions, routing depth and the provider-neutral classifier contract.
- [`.context/interaction/`](.context/interaction/) — questioning, decision categories, uncertainty and escalation protocol.
- [`docs/classifier-strategies.md`](docs/classifier-strategies.md) — same-agent, dedicated and hybrid classification strategies with diagrams.
- [`.context/context-routing/`](.context/context-routing/) — bootstrap, context domains, budgets, triggers and the manifest.
- [`benchmarks/`](benchmarks/) — reproducible context-size benchmark (eager baseline versus routed).
- [`benchmarks/classification/`](benchmarks/classification/) — golden-dataset benchmark for classification quality and safety.
- [`docs/examples/end-to-end-context-routing.md`](docs/examples/end-to-end-context-routing.md) — worked example of the full flow.
- [`adapters/`](adapters/) — thin entry points for compatible agents.
- [`examples/acme-orders/`](examples/acme-orders/) — complete Product and Support examples.

The canonical instructions are in `.context/`. `AGENTS.md` and files under `adapters/` only point compatible agents to that source.

There is no deployment workflow or CI configuration in this kit. Configure deployment separately in the consuming project; use this repository to prepare, validate, review and record the change before normal Git operations.

## Git delivery

After the required gates and local validation pass, the agent presents evidence and a proposed Conventional Commit message. In `confirm_each`, it asks separately for commit and push approval; in `automatic`, it performs them only within the resolved Git finalization authorization. Teams that deliver through pull requests can set `pull_request.mode` to `manual` (agent drafts, human opens) or `automatic` (the agent runs the project-configured PR command after push; merging always stays human). It must verify the worktree and upstream branch and must never force-push. If you perform the operations manually, use the consuming project's normal review process:

A stated Git finalization preference is reused whenever given; otherwise the decision is deferred until Git finalization becomes relevant. `confirm_each` asks before commit and push; `automatic` performs both after successful gates for the recorded work item and verified upstream. When resolution is required and no preference is known, `confirm_each` is the safe fallback. The resolved mode is recorded in `work-item.json` and does not authorize deployment or destructive Git commands.

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

## Opinionated code-quality defaults

CSD takes a clear position on maintainable code instead of leaving every quality choice unspecified. Its framework-neutral baseline applies to new production code and production code changed by a work item: it prefers immutable values and explicit types, strict domain boundaries, named constants and closed domain types, focused responsibilities, documented contracts, and guard clauses or exhaustive decisions instead of `else`/`elseif`.

The structural review defaults include at most 15 declared methods per class and per production file, 150 lines per function (aim for fewer than 30 and review extraction above 50), 500 lines per file, three returns and seven parameters per function, cognitive complexity 15, cyclomatic complexity 10, and at most three meaningful nesting levels (one is the preferred target). These are CSD review standards, not claims about SonarQube defaults or analyzer settings configured in a consuming project.

The baseline is meant to be customized. In an adopting repository, change its canonical `.context/policies/core/code-quality.md` in a reviewed change and record the rationale and owner in project context; keep actual analyzer commands and configured thresholds in `.context/project/quality.md`. Use a scoped exception for a one-off deviation while leaving the baseline in place. See [`docs/customization.md`](docs/customization.md) for the customization boundary and [`code-quality.md`](.context/policies/core/code-quality.md) for the full standard.

## License

MIT. See [`LICENSE`](LICENSE).
