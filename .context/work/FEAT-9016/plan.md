# Plan — FEAT-9016 Make code quality standards CSD defaults

## Approved approach

Strengthen the existing language-neutral CSD code-quality policy and engineering principles, rather than importing SIICV2's stack-specific SonarQube document. Carry over its portable return, parameter, complexity, control-flow, typing, naming, suppression and error-handling practices. Label numeric values as review defaults, include a 15-method class ceiling as a separate CSD default, and keep analyzer configuration separate. Explain in the README that CSD is intentionally opinionated and that adopters can customize their local baseline. Synchronize all changed canonical policy and starter-template copies. Make plan, execution and verification phases load and apply the policy for code tasks.

## Confirmed touchpoints

- Normative sources: `.context/policies/core/code-quality.md` and `.context/policies/core/engineering-principles.md`.
- Distributed copies: matching files under `assets/template/.context/policies/core/`.
- Project quality context: `.context/project/quality.md` and `assets/template/.context/project/quality.md`.
- Phase contracts: `.context/prompts/{plan,execute-and-test,verify}.md` and corresponding starter-template files.
- Routing: `.context/context-routing/{catalog,triggers}.md` and corresponding starter-template files.
- Quality review profile: `.context/profiles/quality-engineer.md` and starter-template copy.
- CSD entrypoints: root `AGENTS.md` (distributed to adopters by `scripts/build-assets.mjs`) and `skill/csd/SKILL.md`.
- User-facing explanation: root `README.md` and `docs/customization.md`.
- Durable evidence: `.context/work/FEAT-9016/*`.
- Dependencies: none. No runtime code, installed linter, Sonar configuration or schema changes.

## Execution order

1. Amend core policy and principles with actionable, framework-neutral MUST/SHOULD rules; preserve project-level authority over language-specific idioms and tools.
2. Amend plan/execute/verify contracts, context routing and quality-engineer profile so code work loads the policy and closes against it.
3. Update root CSD instructions, skill, starter quality context, customization guide and README; regenerate `assets/template/` from canonical `.context/` and `AGENTS.md` with `node scripts/build-assets.mjs`.
4. Compare each changed canonical/template pair, inspect README customization guidance and run strict context validation; record exact results and limitations.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| FEAT-9016-A | Codex | none | Normative defaults cover control flow, immutability, types, constants/enums, SOLID/domains, thresholds and documentation (criteria 1-2) | 1 | core,architecture,security |
| FEAT-9016-B | Codex | FEAT-9016-A | Plan/execute/verify/profile/routing apply policy at code phases (criteria 3-4) | 2 | core,testing |
| FEAT-9016-C | Codex | FEAT-9016-A | Project quality starter and all distributed copies agree; stack-specific rules and unconfigured tools are accurately scoped (criteria 5-6) | 3 | project,testing |
| FEAT-9016-D | Codex | FEAT-9016-A,FEAT-9016-B,FEAT-9016-C | Pairwise template comparison and strict validator results recorded (criterion 7) | 4 | core,project,testing |

Subtasks run sequentially because shared canonical documents and packaged mirrors must remain consistent. Integration owner: Codex. No subagents are planned.

## Test plan

- This task changes policy and workflow documentation only; no application test suite is in scope.
- Run `python3 scripts/validate_context.py --strict --examples` as required by repository policy.
- Compare changed canonical files with their `assets/template/.context/` mirrors, where applicable; inspect the resulting diff for contradictory `else` or structural-limit language.
- Do not report a Sonar, linter or static-analysis gate as active; the project quality context records such tooling as `NOT FOUND`.

## Risks and rollback

- Risk: Numeric thresholds may be mistaken for universal SonarQube configuration or force unhelpful extraction in a language/project.
- Mitigation: Label all numeric defaults as CSD review thresholds, separate configured analyzer values, explain permanent local policy customization, and reserve the exception process for one-off deviations; document the preferred function size separately from hard ceilings.
- Risk: A stale packaged mirror could leave new adopters with old standards.
- Mitigation: Compare every canonical/template pair and validate the starter tree.
- Rollback: Revert only FEAT-9016 policy, prompt, profile, skill and template edits. No runtime state or adopting repository is changed.

## Required approvals

- The user supplied the scope and authorized this policy update.
- No production, release or destructive action is included.
- The 15-method class ceiling is a CSD default selected per the user’s direction; the source policy separately sets 15 declared methods/functions per production file. Neither value is described as a SonarQube default.
