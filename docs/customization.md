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

## Avoid

- Copying the entire project context into prompts.
- Adding platform commands to the vendor-neutral core.
- Making a human approval implicit.
- Using `progress.md` as the only handoff record.
- Treating a conversation profile as a permission, approval role or stack profile.
- Adding deployment or CI configuration to the central kit.
