# Core Policies

Policies are the normative layer of the context. They define the minimum behavior expected from people, agents and delivery systems. Project context records how a project satisfies the policy; it does not silently weaken it.

## Normative language

- **MUST**: required. A violation blocks the relevant gate unless an approved exception is referenced.
- **SHOULD**: expected default. A deviation requires rationale in review or an exception when risk is material.
- **MAY**: permitted option; evidence is needed only when the project chooses it.

## Precedence

1. Law, regulation, contractual and security obligations.
2. Organization policy adopted by the project.
3. These core policies.
4. Project context and configured quality gates.
5. Stack profiles, when explicitly enabled.

More specific rules may strengthen a requirement, but may not weaken a MUST without an approved exception. Policies are reviewed by the engineering governance owner at least once per kit release.

## Core policy map

| Policy | Covers |
| --- | --- |
| `engineering-principles.md` | Design judgment, coupling, cohesion and change safety |
| `code-quality.md` | Readability, complexity, duplication and static analysis |
| `testing.md` | Risk-based tests and evidence |
| `security-privacy.md` | Security, privacy, dependencies and data |
| `ai-governance.md` | Safe use of coding agents and AI systems |
| `review-release.md` | Review, compatibility, release and rollback |
| `core/decomposition.md` | Small subtasks, dependency-safe waves and subagent boundaries |
| `exceptions.md` | Scoped, approved and expiring deviations |
