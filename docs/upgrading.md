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

For the `0.2.0` upgrade, add the required `git.finalization_mode`, `git.ask_before_commit`, `git.ask_before_push`, `git.allow_force_push`, `git.require_clean_worktree`, `git.commit_message_style` and `git.tag_requires_explicit_approval` fields to the orchestration configuration. Add `git_finalization_mode` to new work items and ask for it at startup. Existing work items must add the `Subtasks and waves` section before execution or closure.

The same release adds the optional `classification` and `reclassification` fields on work items plus the `.context/classification/` and `.context/interaction/` contract directories. Existing work items without `classification` remain valid; add the fields when you next touch an item, and classify new items at intake. If a project removed or renamed contract files, restore or map them before upgrading so the validator's required-file checks pass.

It also adds the optional `pull_request` block to the orchestration configuration (`mode`, `command`, `draft_default`, `merge_requires_human_approval`). Existing configs without the block remain valid with the default `never` behavior; configure it only when the team wants agent-drafted or agent-opened pull requests, and set `command` to your project's own forge command.

For context routing, the release adds the `.context/context-routing/` contract directory and two optional work-item objects: `routing` (`derived`, `effective`, optional `override`) and `context` (the manifest). Work items using the earlier `classification.routing` shape remain valid as `derived = effective`; migrate them to the root `routing` object when you next touch them, and remove `classification.routing` then — carrying both shapes fails validation. Update `classification/routing.md`, `interaction/decision-policy.md` and `context-routing/catalog.md` deliberately: the validator reads the catalog table and enforces the routing, override and manifest invariants.

The bootstrap split refines this further: no context domain is mandatory in every manifest (older manifests requiring `core`, `project` and `testing` remain valid), `core` now covers post-bootstrap governance only, and `project`/`testing` promote through triggers and phases. Existing smaller-or-larger manifests keep validating; adopt the lazy model by updating your catalog, triggers and manifests deliberately.

The classifier contract adds `.context/classification/classifier-contract.md` as a required file and the optional `benchmarks/classification/` golden dataset (validated when present). No configuration is required: same-agent classification remains the default executor, and no model, provider or credentials belong in canonical files — those stay in your harness.

## Compatibility rules

- Patch releases fix documentation, validator defects or examples without changing the work-item contract.
- Minor releases may add optional policies, fields or templates and must include migration guidance.
- Major releases may change required artifacts, schemas or gate semantics and require an explicit migration.

Never overwrite project context or active work items blindly. Preserve local policy strengthening and review every exception whose referenced policy changed.
