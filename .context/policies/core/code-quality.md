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

## Readability

Early returns, `match`, lookup tables, polymorphism or extraction MAY be used when they make intent clearer. They are not mandatory transformations. Reviewers should prefer the simplest representation that keeps the rule visible.
