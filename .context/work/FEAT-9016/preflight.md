# Preflight Validation — FEAT-9016

## Checks

- [x] Request and objective are clear: the user asks for language-neutral CSD code-quality defaults derived from SIICV2 guidance.
- [x] Scope and out of scope agree: this updates policy, prompts, routing, profile, entrypoints and the shipped starter template; no runtime/tooling setup or unrelated code cleanup.
- [x] Evidence supports proposed behavior: inspected the referenced SIICV2 SonarQube, best-practices, conventions and review-checklist documents; inspected CSD quality policy, principles, prompts, context routing and asset generator.
- [x] Plan touchpoints exist or are explicitly approved as new: canonical files, root `AGENTS.md`, `skill/csd/SKILL.md` and `scripts/build-assets.mjs` exist; packaged assets are generated from canonical `.context/` and root `AGENTS.md`.
- [x] Security and privacy impact is addressed: classification is `relevant`; retain existing security/privacy policy and avoid duplicating framework-specific security rules.
- [x] Tests and acceptance criteria are executable: verify document/template consistency and run the strict context validator; no application behavior or tests change.
- [x] Rollback and operational ownership are defined: revert FEAT-9016 documentation/default changes; owner is the work-item owner `hiyan`.
- [x] Required human approvals are recorded: user explicitly requested and scoped the policy update; no production, release or destructive action is planned.
- [x] Applicable core policies were checked: engineering principles, code quality, security/privacy, exception handling, interaction and review/release.
- [x] Quality commands, thresholds or approved exceptions are identified: CSD quality thresholds will be documented as policy defaults; this repository's analyzer/linter and active Sonar profile remain `NOT FOUND`.
- [x] AI/data/tool permissions are addressed: no external service, model data flow or runtime permission is changed; referenced SIICV2 files were inspected read-only.
- [x] Subtasks, owners, dependencies and waves are explicit; work is sequential with no subagents because shared canonical/template boundaries must stay synchronized.

## Findings

- `sonarqube.md` explicitly says its method/file/function/return/parameter limits are SIICV2 local policy, not SonarQube defaults; it recommends cyclomatic complexity 10 and cognitive complexity 15 whenever possible.
- The source best-practices guide targets functions under 30 lines, reviews extraction above 50 and keeps 150 as the hard ceiling. It allows at most three returns and seven parameters.
- It has no maximum methods per class. The CSD default is 15 per class per the user’s direction, separately from the source’s 15 declarations per production file.
- CSD's existing context catalog already associates `code-quality.md` with code planning and verification. The triggers and phase contracts will make that relationship explicit for implementation/review as well.
- The package build regenerates `assets/template/` from `.context/` and root `AGENTS.md`; canonical files remain the editing source.

## Evidence record

- Commands: `rtk cat /home/hiyan/Development/projects/work/siicv2/.ai/sonarqube.md`, source practice/checklist reads, `rtk cat` on the named CSD policy/prompt/context files, `rtk rg --files assets/template`, `rtk cat scripts/build-assets.mjs`, and `rtk cat AGENTS.md`.
- Scope: read-only discovery of source rules, CSD policy, workflow routing and distribution paths.
- Result: all reads succeeded; no runtime or package configuration changes were made.
- Quality metric: structural values will be labeled policy defaults, not analyzer output. No active Sonar profile is claimed.
- Limitation: preflight validates the proposed documentation workflow; it does not measure these rules with a language-specific checker.
- Date: 2026-09-23.

## Verdict

`READY`

Reviewer: Codex
Date: 2026-09-23
