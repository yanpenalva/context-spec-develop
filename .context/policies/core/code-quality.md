# Code Quality Policy

## Required baseline

- New code MUST introduce no new critical reliability or security issue.
- Unused code, imports, parameters and configuration MUST be removed or justified.
- Inputs, outputs, errors and dependencies MUST be explicit enough for the language and toolchain to verify them.
- Business rules MUST not be copy-pasted across independent paths.
- Magic values and duplicated messages SHOULD be replaced with named domain concepts when that improves clarity.
- Static analysis, formatting and linting MUST run according to `.context/project/quality.md` when configured.

## Complexity

Projects MUST measure complexity with a suitable tool or document why measurement is unavailable. The default policy is no regression in changed code.

Reference starting points, configurable per project:

- Cognitive complexity: 15 per function or method.
- Cyclomatic complexity: project-defined threshold because calculations differ by language and analyzer.
- Nesting: prefer no more than three meaningful levels.
- Function and class size: use responsibility and complexity signals; line-count limits are advisory, not universal laws.

Exceeding a configured threshold requires refactoring, a documented risk decision or an approved exception. A metric is a signal for design review, not a substitute for human judgment.

## Readability and language patterns

- **String assembly**: Prefer string interpolation, template literals, or parameterized formatting over manual string concatenation operators. For database queries, always use parameter bindings instead of manual string assembly.
- **Function syntax**: Prefer arrow functions and concise expressions for local functions, callbacks, event handlers and collection mappings when supported by the language. When altering an existing file, refactor legacy non-arrow callbacks or local functions in that file to maintain consistency.
- **Global / native function resolution**: Where the language or compiler optimizes native/built-in function lookups via explicit namespace imports or root qualifiers, use them consistently according to project conventions.
- **Control flow**: Early returns, `match`, lookup tables, polymorphism or extraction MAY be used when they make intent clearer. Reviewers should prefer the simplest representation that keeps the rule visible.

## Changed-file quality gates

Projects SHOULD enforce policies primarily on the set of altered files (`changed_files`):

- When an altered production file exceeds configured size limits (e.g. 500 lines per file, 15 functions/methods, or 150 lines per function), it MUST be decomposed and refactored within the same task before completion.
- Scoped verification scripts should run linters, formatters and structural checks against changed files before push or pull request, preventing regression without forcing refactors on unrelated files.
