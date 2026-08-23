# Upgrading the Central Kit

Projects consume a tagged snapshot of `context-spec-develop`; they do not load the central repository at runtime.

## Record the version

Keep `kit_version` in `.context/config.json`. A project must know which policy and schema it is using before reviewing an upgrade.

## Upgrade procedure

1. Read the central release notes and migration notes.
2. Compare policy, schema, prompt, template and validator changes.
3. Run the existing project's validator and tests before updating.
4. Apply the snapshot in a dedicated pull request.
5. Resolve schema, required-artifact or policy changes explicitly.
6. Re-run starter/managed/enterprise validation as configured.
7. Migrate conversation profiles, intake routing, subtask/wave guidance and adapter changes deliberately; do not overwrite local deployment configuration.
8. Update `kit_version`, record exceptions affected and obtain the normal project approvals.

For the `0.2.0` upgrade, add the required `git.ask_before_commit`, `git.ask_before_push`, `git.allow_force_push`, `git.require_clean_worktree`, `git.commit_message_style` and `git.tag_requires_explicit_approval` fields to the orchestration configuration. Existing work items must add the `Subtasks and waves` section before execution or closure.

## Compatibility rules

- Patch releases fix documentation, validator defects or examples without changing the work-item contract.
- Minor releases may add optional policies, fields or templates and must include migration guidance.
- Major releases may change required artifacts, schemas or gate semantics and require an explicit migration.

Never overwrite project context or active work items blindly. Preserve local policy strengthening and review every exception whose referenced policy changed.
