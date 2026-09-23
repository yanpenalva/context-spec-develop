# Customization

Start with the core and change project context before changing workflow policy. Add a project-specific rule only when it is evidenced, owned and testable.

## Code quality defaults

CSD's framework-neutral code-quality policy applies to new production code and production code changed by a work item. It is intentionally opinionated: it sets defaults for control flow, immutability, types, domain boundaries, naming, documentation, error handling, suppressions, size and complexity. Examples include no `else`/`elseif`, at most three returns per function, 15 methods per class and per file, seven parameters, and analyzer-independent review ceilings for function/file size and complexity. See `.context/policies/core/code-quality.md` for the complete baseline.

These values are CSD review defaults, not SonarQube defaults or proof that an analyzer is configured. Teams adopting CSD may permanently tailor their local baseline by editing `.context/policies/core/code-quality.md` in a reviewed change, with the reason and owner recorded in project context. Keep analyzer commands and thresholds actually configured by the project in `.context/project/quality.md`; leave unknown settings as `NOT FOUND`. Use `.context/policies/exceptions.md` for a scoped, one-work-item deviation when the project baseline itself remains unchanged. Stack-specific idioms belong in project conventions and must not be presented as framework-neutral CSD rules.

## Safe customization

Set discovery preferences in repository-root `csd.config.json` when the default adapters or precedence order do not fit. Marker, protected and module search paths are validated as repository-relative paths. Existing valid layouts are selected without migration; see [context discovery](context-discovery.md).

- Replace placeholders in `.context/project/`.
- Add domain context under `.context/project/` or a documented subdirectory.
- Configure optional module documentation with `contextDiscovery.moduleContext`: set `enabled: false` to disable it, `prompt_policy: "never"` to suppress questions, or provide bounded `search_roots` to narrow discovery. Do not use it to mirror `.context/` and `.ai/`.
- Add templates under an explicit overlay and document when they apply.
- Add or remove conversation profiles in `.context/profiles/`, then update `agent_profiles.available` and its default in `config.json`.
- Add project-owned tool notes under `.context/tooling/` when an RTK, memory or review-graph integration has a defined owner and boundary.
- Extend schemas only with a versioned migration note.
- Keep adapters as pointers to canonical files.

## Assigning agents

The JSON separates the collaboration profile from the runtime agent. Change `assignments.orchestrator`, `planner`, `executor` and `reviewer` to select who performs each responsibility. Keep the release approver human, keep the reviewer independent when risk warrants it, and require the security reviewer for sensitive changes. An assignment may use `selection: "user_or_default"` so the opening conversation can override the project default without editing policy files.

## Classification and interaction

Classification criteria live in `.context/classification/` and the interaction protocol in `.context/interaction/`. Projects may tighten criteria (for example, treat every payment change as `sensitive`) by editing those files; they must not weaken the routing derivation's determinism, remove a critical human gate, or change what a decision category authorizes. The validator enforces the derivation and the closed enums; record extensions to the dimensions themselves as a versioned schema change with a migration note.

## Context routing

The context catalog, budgets and triggers live in `.context/context-routing/`. Projects may rename or add domains in `catalog.md` (the validator reads the table to learn the valid names) and may tighten budgets. They must not remove the mandatory `core` domain, break the manifest structure, or turn a budget into a reason to skip safety- or governance-required context: minimum sufficient context never outranks correctness, safety or evidence.

## Git finalization preference

Set `git.finalization_mode` to `confirm_each` for separate commit and push questions, or `automatic` when the team explicitly permits validated Git finalization without those repeated questions. The orchestrator still asks for the per-conversation `git_finalization_mode`, records it in the work item, verifies the branch and remote, and never permits force push, reset, clean or deployment through this setting.

## Pull requests

Configure `pull_request.mode` in `.context/orchestration/config.json` when the team delivers through pull requests: `manual` makes the agent draft the title and body for a human to open; `automatic` lets the agent run your project's own PR command after a validated push (it requires `git.finalization_mode: automatic` and a configured `command`). The command belongs to the project — the core kit ships no forge CLI — and the validator rejects commands that merge, force or administratively override. Opening a PR never approves it; review and merge stay human.

## Optional tools

RTK, AI-memory and the code-review graph are optional accelerators. If unavailable, use native commands and record the real evidence. Never compress contracts, test output, security findings or approval decisions. AI-memory must store only approved summaries and decisions; the review graph can identify impact but cannot approve a gate.

## Avoid

- Copying the entire project context into prompts.
- Adding platform commands to the vendor-neutral core.
- Making a human approval implicit.
- Using `progress.md` as the only handoff record.
- Treating a conversation profile as a permission, approval role or stack profile.
- Adding deployment or CI configuration to the central kit.
