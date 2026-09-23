# Engineering Principles

These principles guide decisions across languages and architectures. Normative code-quality details and review thresholds live in .context/policies/core/code-quality.md.

## Design

- Code MUST have a clear responsibility, cohesive boundary and identifiable owner.
- Domain rules and state MUST remain inside their owning domain. Cross-domain interaction uses explicit contracts; circular dependencies and hidden access to another domain's internals are not acceptable.
- Dependencies SHOULD point toward stable contracts; volatile details should not define core policy.
- Prefer composition and explicit collaboration over inheritance when it reduces coupling.
- Public interfaces MUST communicate valid inputs, outputs, errors, side effects and compatibility expectations.
- SOLID, DRY, KISS and YAGNI are decision tools, not excuses for abstractions without a real problem.
- Repetition MAY remain when extraction would hide intent or create accidental coupling; duplicated business rules MUST be consolidated.

## Control flow and errors

- Code MUST follow the no-else/elseif default and use the alternatives defined in the code-quality policy.
- Guard clauses SHOULD handle invalid or exceptional cases early when they reduce nesting.
- Error handling MUST preserve actionable context without leaking secrets or internal details to untrusted consumers.
- Empty catches, swallowed failures and silent fallback behavior MUST be justified and observable.

## Change safety

- Changes SHOULD be small, reversible and independently verifiable.
- Backward compatibility MUST be considered for public interfaces, data, events and configuration.
- Destructive operations require explicit authorization, a recovery strategy and evidence of the target environment.
- Architecture decisions that affect multiple teams SHOULD be recorded as ADRs.
