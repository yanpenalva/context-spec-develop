# Engineering Principles

These principles guide decisions across languages and architectures.

## Design

- Code MUST have a clear responsibility and boundary.
- Dependencies SHOULD point toward stable contracts; volatile details should not define core policy.
- Prefer composition and explicit collaboration over inheritance when it reduces coupling.
- Public interfaces MUST communicate valid inputs, outputs, errors and compatibility expectations.
- SOLID, DRY, KISS and YAGNI are decision tools, not excuses for abstractions without a real problem.
- Repetition MAY remain when extraction would hide intent or create accidental coupling; duplicated business rules MUST be consolidated.

## Control flow and errors

- Guard clauses SHOULD handle invalid or exceptional cases early when they reduce nesting.
- `else` and `elseif` MAY be used when branches are genuinely symmetrical or clearer together. A blanket ban is not a quality policy.
- Error handling MUST preserve actionable context without leaking secrets or internal details to untrusted consumers.
- Empty catches, swallowed failures and silent fallback behavior MUST be justified and observable.

## Change safety

- Changes SHOULD be small, reversible and independently verifiable.
- Backward compatibility MUST be considered for public interfaces, data, events and configuration.
- Destructive operations require explicit authorization, a recovery strategy and evidence of the target environment.
- Architecture decisions that affect multiple teams SHOULD be recorded as ADRs.
