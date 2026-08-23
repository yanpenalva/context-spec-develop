# Customization

Start with the core and change project context before changing workflow policy. Add a project-specific rule only when it is evidenced, owned and testable.

## Safe customization

- Replace placeholders in `.context/project/`.
- Add domain context under `.context/project/` or a documented subdirectory.
- Add templates under an explicit overlay and document when they apply.
- Add or remove conversation profiles in `.context/profiles/`, then update `agent_profiles.available` and its default in `config.json`.
- Add project-owned tool notes under `.context/tooling/` when an RTK, memory or review-graph integration has a defined owner and boundary.
- Extend schemas only with a versioned migration note.
- Keep adapters as pointers to canonical files.

## Assigning agents

The JSON separates the collaboration profile from the runtime agent. Change `assignments.orchestrator`, `planner`, `executor` and `reviewer` to select who performs each responsibility. Keep the release approver human, keep the reviewer independent when risk warrants it, and require the security reviewer for sensitive changes. An assignment may use `selection: "user_or_default"` so the opening conversation can override the project default without editing policy files.

## Git finalization preference

Set `git.finalization_mode` to `confirm_each` for separate commit and push questions, or `automatic` when the team explicitly permits validated Git finalization without those repeated questions. The orchestrator still asks for the per-conversation `git_finalization_mode`, records it in the work item, verifies the branch and remote, and never permits force push, reset, clean or deployment through this setting.

## Optional tools

RTK, Caveman, AI-memory and code-review graph are optional accelerators. If unavailable, use native commands and record the real evidence. Never compress contracts, test output, security findings or approval decisions. AI-memory must store only approved summaries and decisions; the review graph can identify impact but cannot approve a gate.

## Avoid

- Copying the entire project context into prompts.
- Adding platform commands to the vendor-neutral core.
- Making a human approval implicit.
- Using `progress.md` as the only handoff record.
- Treating a conversation profile as a permission, approval role or stack profile.
- Adding deployment or CI configuration to the central kit.
