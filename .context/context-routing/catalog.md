# Context Catalog

The catalog is a cheap semantic index: each entry states a domain's purpose and its canonical sources so an agent can decide relevance without loading the sources. The validator derives the valid domain names from the table below — this file is the single source for the domain set. Domains are loaded **after** classification; the bootstrap (see `README.md`) is not a domain and is not listed here.

| Domain | Purpose | Canonical sources | Typically promoted by |
| --- | --- | --- | --- |
| `core` | Post-bootstrap governance: normative language and precedence, engineering judgment, questioning and evidence rules | `.context/policies/README.md`, `.context/policies/core/engineering-principles.md`, `.context/policies/core/questioning-and-evidence.md` | Governance-heavy work; policy or precedence questions; any workflow gate needing interpretation |
| `project` | Project conventions, overview, stack and local architecture facts | `.context/project/overview.md`, `.context/project/architecture.md`, `.context/project/stack.md`, `.context/project/conventions.md` | Project-specific behavior, conventions, stack or implementation work; repository-specific decisions |
| `testing` | Testing and validation requirements and evidence rules | `.context/policies/core/testing.md`, `.context/policies/core/code-quality.md`, `.context/project/testing.md`, `.context/project/quality.md` | Planning validation strategy; implementing code that needs tests; entering verify; reviewing test evidence; task concerns tests |
| `architecture` | Architectural boundaries, cross-module design, persistence and dependency structure | `.context/policies/core/engineering-principles.md`, `.context/project/architecture.md` | Cross-module or system impact; persistence or migration discovered; extended planning |
| `security` | Authentication, authorization, secrets, privacy and sensitive-data handling | `.context/policies/core/security-privacy.md`, `.context/project/security.md`, `SECURITY.md`, `.context/policies/core/ai-governance.md` | Security signal relevant or sensitive; auth or data boundary discovered |
| `release` | Deployment, production, release gates, rollback and observability | `.context/policies/core/review-release.md`, `.context/project/delivery.md`, `.context/project/observability.md` | Production or release action required |
| `incident` | Incident, hotfix and containment procedures | `.context/workflows/support.md`, `.context/templates/support/incident.md`, `.context/templates/support/postmortem.md` | Support incident or hotfix; active degradation |

## Rules

- An entry describes purpose; it does not inline the sources' content.
- Loading a domain means loading the canonical sources it names, further narrowed by the current phase (see `README.md`).
- The bootstrap is not a domain: `AGENTS.md`, `INDEX.md` and `config.json` belong to the bootstrap, not to `core`. They are governed by the bootstrap invariant in `README.md`.
- Domains not promoted for the current decision stay deferred per `budgets.md`.
- A policy that is mandatory in behavior (for example evidence rules) can be represented in the bootstrap by its rule; loading its full document follows the phase and trigger model above.
