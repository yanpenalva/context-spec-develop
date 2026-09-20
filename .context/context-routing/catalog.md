# Context Catalog

The catalog is a cheap semantic index: each entry states a domain's purpose and its canonical sources so an agent can decide relevance without loading the sources. The validator derives the valid domain names from the table below — this file is the single source for the domain set.

| Domain | Purpose | Canonical sources | Typically triggered by |
| --- | --- | --- | --- |
| `core` | Mandatory governance and universal rules that always apply | `AGENTS.md`, `.context/INDEX.md`, `.context/config.json`, `.context/policies/README.md`, `policies/core/engineering-principles.md` | Always required |
| `project` | Project conventions, overview, stack and local architecture facts | `.context/project/overview.md`, `architecture.md`, `stack.md`, `conventions.md` | Always required |
| `testing` | Testing and validation requirements and evidence rules | `policies/core/testing.md`, `policies/core/code-quality.md`, `project/testing.md`, `project/quality.md` | Always required; deeper on validate phases |
| `architecture` | Architectural boundaries, cross-module design, persistence and dependency structure | `policies/core/engineering-principles.md`, `project/architecture.md` | Cross-module or system impact; persistence or migration discovered; extended planning |
| `security` | Authentication, authorization, secrets, privacy and sensitive-data handling | `policies/core/security-privacy.md`, `project/security.md`, `SECURITY.md`, `policies/core/ai-governance.md` | Security signal relevant or sensitive; auth or data boundary discovered |
| `release` | Deployment, production, release gates, rollback and observability | `policies/core/review-release.md`, `project/delivery.md`, `project/observability.md` | Production or release action required |
| `incident` | Incident, hotfix and containment procedures | `workflows/support.md`, `templates/support/incident.md`, `templates/support/postmortem.md` | Support incident or hotfix; active degradation |

## Rules

- An entry describes purpose; it does not inline the sources' content.
- Loading a domain means loading the canonical sources it names, further narrowed by the current phase (see `README.md`).
- Domains not required for the current decision stay deferred per `budgets.md`.
- `core` and `project` are mandatory in every manifest; `testing` is mandatory by default because evidence rules apply to every gate.
