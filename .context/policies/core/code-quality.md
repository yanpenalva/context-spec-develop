# Code Quality Policy

This policy is the default for new production code and production code changed by a work item. It applies across languages and frameworks. Project conventions may define idioms and tools, but MUST NOT silently weaken a core MUST. Framework-specific layers, APIs, query patterns and language features belong in project conventions and apply only when the project stack supports them.

Do not use this policy to trigger unrelated cleanup of untouched legacy files. When a changed production file contains a directly relevant violation, correct the touched behavior while preserving inputs, outputs, side effects and evaluation order. A deviation from a MUST requires an approved, scoped exception under .context/policies/exceptions.md.

## Required baseline

- New or changed code MUST introduce no new critical reliability, security or privacy issue.
- Inputs, outputs, errors, dependencies and side effects MUST be explicit enough for the language and toolchain to verify.
- Dead code, unused imports, parameters, properties and configuration MUST be removed or justified.
- Duplicated business rules MUST be consolidated when they have one owner. Do not create an abstraction for one occurrence or split code only to satisfy a metric.
- Reusable magic values and repeated messages MUST use named constants or domain concepts.
- Configured static analysis, formatting, linting and tests MUST run for the changed scope. Actual project commands and analyzer thresholds belong in .context/project/quality.md; unavailable tools and values remain NOT FOUND.
- Analyzer and linter findings MUST NOT be suppressed without a scoped technical rationale and a work-item reference. Remove obsolete suppressions; blanket suppression is not a substitute for fixing a finding.

## Design and strict domain boundaries

- Every module, class and function MUST have a clear, cohesive responsibility and an identifiable reason to change.
- Domain rules and state MUST be owned by the domain that defines them. Other domains use explicit, stable contracts; they do not reach into or mutate another domain's internals.
- Dependencies SHOULD point toward stable contracts. Avoid circular dependencies and high coupling. Prefer composition over inheritance when it keeps ownership and behavior clear. Classes SHOULD be final or sealed by default where the language supports it; extensibility needs a documented contract and reason.
- Public interfaces MUST communicate valid inputs, outputs, errors, side effects and compatibility expectations.
- Apply SOLID, DRY, KISS and YAGNI as review tools. They MUST NOT justify speculative interfaces, needless layers, generic frameworks or abstractions that hide the rule.
- Dependencies SHOULD be explicit. Avoid static methods that hide dependencies or external state; use constructor injection or the language’s equivalent when it clarifies ownership and substitution.
- Names MUST communicate intent. Avoid generic names that force readers to infer a value’s domain meaning.
- Keep code concise by removing incidental complexity, not by compressing names, merging unrelated responsibilities or sacrificing explicit types.

## Control flow

- Production logic and templates MUST NOT introduce else, elseif, else if, elif, v-else, v-else-if or equivalent fallback branches.
- Use guard clauses, early return or continue, exhaustive pattern matching (match or the language equivalent), lookup tables, named predicates, or a focused strategy/collaborator. Choose the form that keeps the domain decision visible.
- Preserve branch priority, lazy evaluation, exceptions and side-effect order when replacing a branch.
- Do not replace a forbidden branch with nested ternaries or deeply nested conditionals. Prefer named decisions and no more than three meaningful nesting levels. Target at most one level of control-flow indentation; extract a cohesive decision when nesting obscures the normal path.
- Avoid boolean flags that switch a function between substantially different behaviors; use separate operations or a closed, typed variant when that makes the domain intent clearer.
- Handle invalid or exceptional states early when it makes the normal path easier to follow.

## Immutability, types and domain values

- Bindings MUST be immutable by default: use const, final, readonly properties or the language equivalent when reassignment is not required. Use mutable bindings only for state that changes; avoid legacy mutable forms such as var when a safer form exists.
- Public and domain boundaries MUST use explicit parameter, return and property types wherever supported. Preserve strict/null-safety settings. In TypeScript, prefer precise types or unknown over any, and avoid non-null assertions.
- Finite, closed domain sets SHOULD use enums, tagged unions or equivalent typed constructs. Do not use enums for open-ended or externally governed sets.
- Reusable values, limits, status codes and messages MUST use named constants or domain types. Avoid magic numbers, duplicated strings and ambiguous booleans that change a function's whole behavior.
- Handle optional values explicitly with the language's null-safe access and defaulting features where they preserve domain meaning. Do not turn missing required data into a silent valid-looking fallback or build long chains of existence checks.
- Use language-specific features only when the project's supported version provides them; record the actual language and version in project context.

## Default structural thresholds

These are intentionally opinionated CSD code-review defaults for production code. The per-file, function-size, return, parameter and complexity limits reflect the referenced source project’s local policy where applicable; the 15-method class ceiling is a separate CSD default. None are SonarQube defaults or proof that an analyzer is configured. Projects may adapt this baseline through a reviewed change to their canonical copy of this policy; actual analyzer settings belong in .context/project/quality.md. A one-work-item deviation from an unchanged MUST requires an approved, scoped exception under .context/policies/exceptions.md.

| Measure | CSD default |
| --- | --- |
| Declared methods per production class, including private methods and constructor | At most 15 |
| Declared functions/methods per production file | At most 15 |
| Function or method length | At most 150 lines; aim for fewer than 30; review extraction candidates above 50 |
| Production file length | At most 500 lines |
| Return statements per function or method | At most 3 |
| Parameters per function or method | At most 7; use a cohesive immutable parameter object when needed |
| Cognitive complexity | At most 15 where an analyzer provides a comparable measure |
| Cyclomatic complexity | At most 10 where an analyzer provides a comparable measure |
| Meaningful nesting levels | Prefer at most 1; maximum 3 |

Count all declared production methods, including private methods. Inline callbacks still count toward function complexity and size. Keep each function or method to at most three return statements; when more are needed, extract a cohesive validation or decision helper. Do not add `else`, deep nesting or complex ternaries merely to lower the return count. Do not evade a limit with trivial wrappers or fragmented files. When a class or file is at a ceiling, split responsibilities before adding declarations. A touched production file already above a ceiling is decomposed in the same task unless an approved exception records why that would create greater risk.

Metrics guide design review; they do not replace judgment. If no suitable analyzer is configured, record that fact in project quality context and do not claim a measured result.

## Errors, security and data handling

- Failures MUST remain actionable and observable. Empty catches, swallowed failures and silent fallback behavior require explicit justification.
- Catch specific errors; broad catches MUST rethrow or wrap while preserving useful context and the original cause.
- When an invariant or state-consistency failure has a stable domain meaning, use a typed domain error instead of a generic runtime error; preserve the cause and test the contract.
- Security, privacy, authorization, validation, secrets, output encoding and data-retention rules follow .context/policies/core/security-privacy.md and evidenced project contracts.
- Never place secrets or sensitive personal data in logs or error responses. Do not suppress errors or security findings without a documented, approved reason.

## Documentation

For a behavior or contract change, update the owning module/domain and public API documentation. Documentation MUST let a maintainer determine:

- domain responsibility, ownership and boundaries;
- public inputs, outputs, errors and compatibility expectations;
- business invariants, validation and state transitions;
- persistence or external side effects;
- authorization, privacy and security constraints;
- relevant configuration, examples and operational implications.

Keep documentation near the owning module or in the repository's canonical location. Code comments SHOULD explain why a non-obvious choice exists, including compatibility constraints; they SHOULD NOT narrate clear code. Prefer native types over duplicative type comments; use documentation to express contracts, invariants and constraints the signature cannot carry. Do not duplicate facts across documents without a canonical owner.

## Code review checklist

Before closing a code change, review the changed scope for:

- forbidden else/elseif and equivalent template branches; use of the approved alternatives;
- clear responsibilities, strict domain ownership, cohesive boundaries and no accidental abstraction;
- immutable bindings, explicit types, named constants and typed closed domain sets;
- structural/complexity defaults, or an approved exception with evidence and expiry;
- dead code, unused values, duplicated rules, unsafe error handling and security/privacy issues;
- updated public/domain documentation and compatibility notes;
- actual changed-file analyzer and test commands, exit status and limitations, without inventing unavailable gates.
