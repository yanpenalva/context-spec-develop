# Specification — FEAT-9016 Make code quality standards CSD defaults

## Request

- Source: User request in Portuguese on 2026-09-23.
- Requester: hiyan (workspace owner).
- Date: 2026-09-23.

## Objective

Make CSD's default engineering policy consistently apply the transferable quality practices from the referenced source project's `.ai/sonarqube.md`, `best-practices.md`, `conventions.md` and `code-review-checklist.md`, plus language-neutral SOLID and domain-design guidance.

## Scope

- Make the core code-quality and engineering-principles policies normative for code changes, including a default prohibition on `else`/`elseif` and equivalent template branches in new or touched production code; specify guard clauses, pattern matching, lookup tables, named predicates or cohesive collaborators as alternatives.
- Prefer immutable bindings (`const`/`final`/language equivalent), explicit types, constants for reusable values, and enums or equivalent closed types for finite domain sets.
- Set language-neutral defaults for cohesion, SOLID, domain ownership, concise functions, class/file/function size, nesting, return and parameter counts. Treat the source-project thresholds as local project policy, not SonarQube defaults. Use a 15-method class ceiling as an explicit CSD default because the source defines only a per-file ceiling. Include the additional portable return, control-flow, typing, suppression and error-handling guidance found in the source references.
- Require detailed, maintained documentation for public contracts, domain invariants, side effects, errors, security boundaries, configuration and operational behavior; keep inline comments focused on non-obvious reasons.
- Explain in the README that CSD is intentionally opinionated about code quality, distinguish review defaults from configured analyzer gates, and explain how adopting projects can customize their local baseline.
- Route the policy to code implementation and review via CSD's context triggers, phase prompts, quality-engineer profile and skill instructions.
- Update the installed starter template alongside canonical `.context/` files and keep each pair synchronized.
- Keep analyzer, linter, coverage and duplication tool settings project-specific; record absent tools/thresholds as `NOT FOUND`. Do not claim a SonarQube quality profile is configured without evidence.

## Out of scope

- Installing or configuring SonarQube, a language-specific linter, a structural checker or a new runtime dependency.
- Refactoring unrelated existing CSD production code to satisfy the new policy.
- Copying source-project language/framework conventions into the framework-agnostic core policy.
- Setting an adopting project's analyzer commands or claiming coverage/duplication gates without repository evidence.

## Evidence and context

- Repository evidence: `.context/policies/core/code-quality.md` has advisory structural limits; `.context/policies/core/engineering-principles.md` allows `else`/`elseif`; `.context/context-routing/catalog.md` already places code-quality in the testing domain; `assets/template/.context/` is the distributed context tree.
- Product or incident evidence: The user's request explicitly asks for these practices to become CSD defaults.
- Relevant project context: `.context/project/{architecture,quality,security,testing}.md`; core policies; CSD prompts/profile/skill; the referenced source files listed in discovery.
- Unknowns (`NOT FOUND`): A CSD-installed language-specific enforcement tool and active SonarQube profile are not configured or evidenced.

## Rules and contracts

- Business or operational rules:
  - CSD MUST prohibit `else`, `elseif`/`elif`, `else if` and equivalent `v-else`/`v-else-if` constructs in new or touched production logic by default. Reviews MUST prefer guard clauses, early return/continue, exhaustive `match`/pattern matching, lookup tables, named predicates, or focused collaborators while preserving evaluation order and side effects.
  - Bindings MUST be immutable by default: use `const`, `final`, readonly properties or the language equivalent; mutable bindings are for actual state changes only. Do not use legacy untyped/mutable declaration forms when an immutable typed form is available.
  - Types MUST be explicit at public/domain boundaries. Closed finite domain sets SHOULD use enums, tagged unions or equivalent typed constructs. Reusable literal values MUST have named constants; do not replace every one-off readable literal mechanically.
  - SOLID, DRY, KISS and YAGNI MUST guide review; they MUST NOT justify speculative abstractions. Modules and domains MUST have cohesive responsibilities, explicit contracts and controlled dependencies; circular dependencies and cross-domain rule duplication are defects.
  - CSD default structural thresholds: at most 15 declared methods per production class; 15 declared methods/functions per production file; 150 lines per function (aim for fewer than 30 lines and review extraction above 50); 500 lines per production file; three return statements per function; seven parameters per function; cognitive complexity 15; cyclomatic complexity 10 where an analyzer supports comparable measurement; at most one control-flow indentation level preferred and three meaningful nesting levels maximum. Exceeding a ceiling requires decomposition or a scoped, approved exception. These are CSD policy defaults/review thresholds, not SonarQube defaults.
  - Documentation MUST explain changed public APIs/contracts, domain invariants, input/output/error behavior, side effects, security/privacy constraints, configuration and operational implications in the appropriate project docs. Code comments SHOULD explain why or record a non-obvious compatibility constraint, not narrate clear code.
  - Tool commands and configured quality-gate values remain discoverable project facts; unavailable values remain `NOT FOUND`.
- Interfaces, data and permissions: No runtime interfaces, schemas or permissions change. Existing CSD policy and exception artifacts remain authoritative.
- Security and privacy impact: Quality policy affects secure coding expectations; refer to the existing security/privacy policy rather than duplicating stack-specific rules.

## Tests and acceptance criteria

1. The canonical code-quality policy and its distributed template contain consistent language-neutral defaults for flow, immutability, types, constants/enums, SOLID/domain boundaries, structural thresholds, suppression discipline, typed domain errors and documentation.
2. The engineering-principles policy no longer permits `else`/`elseif` as an ordinary option and explains the approved replacements.
3. Execution and verification contracts and quality-engineer guidance require the code-quality policy on code tasks and record its checklist/evidence.
4. CSD skill and context routing lead implementers/reviewers to the policy at the right phases.
5. Starter project quality docs distinguish policy defaults from tools/thresholds actually configured in that project; no unsupported SonarQube claim is made.
6. source-project language- and framework-specific rules remain scoped to stack-specific project conventions.
7. `python3 scripts/validate_context.py --strict --examples` passes; any unavailable check or limitation is recorded honestly.
8. The README explains CSD’s opinionated quality baseline, separates it from analyzer configuration and links to the supported customization path.

## Open decisions

- None. The 15-method class ceiling is an explicit CSD default and is not attributed to the source SonarQube file.
