# Concepts and Glossary

This document gives people and agents one vocabulary for the delivery system.

## Core concepts

**Context** is the authoritative information needed to make a decision. It is stored in small, linked files instead of repeated in every prompt.

**Canonical source** is the file that owns a rule or fact. Adapters and prompts reference it; they do not copy competing versions.

**Project context** describes one product's architecture, stack, security, testing, delivery and observability. It is factual and project-owned.

**Policy** is a normative rule expressed as MUST, SHOULD or MAY. **Convention** is a project choice such as naming or commit format. A **stack profile** is an optional set of rules for a language, framework or operating environment. A **conversation profile** is a role lens such as senior engineer, incident engineer or quality engineer; it changes questions and emphasis, never authority or policy.

**Workflow** is the sequence of gates. **Track** is the kind of work being performed, currently Product or Support. **Artifact** is a durable file produced by a gate. **Evidence** is the observation, command result, link or approval that supports a claim.

**Work item** is the directory and metadata record for one change, defect or incident. It links intent, decisions, implementation evidence and production outcome.

**Gate** is a decision point that must be satisfied before the next phase. A gate may return work to an earlier phase.

## Lifecycle terms

**Intake** classifies the request, owner, impact and risk.

**Subtask** is a small independently verifiable unit of work. **Wave** is a dependency-safe group of subtasks that may run in parallel. **Subagent** is a delegated agent with bounded context, scope and stop condition; its parent integrates evidence.

**Discovery** explains a product problem, audience, evidence, hypothesis and measurable success before committing to a solution.

**Specification** states the desired behavior, scope, rules, contracts, security impact and acceptance criteria.

**Plan** defines the smallest viable implementation, test approach, risks and rollback.

**Preflight validation** is a read-only readiness check before code changes. It asks whether the request and plan are sufficiently evidenced and authorized.

**Execution and testing** changes the approved scope and records actual commands and results.

**Verification** checks the result against acceptance criteria, contracts, tests and operational expectations.

**Review** is an independent judgment about scope, architecture, security, regressions and evidence. Verification proves behavior; review decides whether the result is acceptable.

**Release** records readiness and authorization. **Deployment** changes a target environment. **Observation** checks production signals after that change.

**Outcome** records what happened and what was learned. **Postmortem** explains an incident systemically and assigns prevention work without blame.

**Handoff** is the versioned context required to continue work in another session, environment or ownership boundary. **Progress** is local working memory and is not sufficient for durable continuity.

## Work classification

**Feature** is a Product change that creates or improves user value.

**Bug** is a reproducible defect without active service degradation.

**Incident** is active degradation, outage or material user impact. Containment and communication precede permanent correction.

**Hotfix** is an urgent production change associated with active or critical impact. It may use a smaller planning cycle, but never skips rollback, targeted tests, approval or observation.

**Risk** is the potential consequence and uncertainty of the proposed change. **Severity** is the observed impact of a Support incident. A low-risk change can be related to a high-severity incident, and they must not be conflated.

**Phase** describes where work is in the workflow. **Status** describes its operating condition (`draft`, `ready`, `active`, `blocked`, `completed` or `cancelled`). A completed status is valid only in the close phase.

## Quality and governance terms

**Baseline** is the minimum quality state against which new work is compared. The core baseline is no regression.

**Exception** is a scoped, approved and expiring deviation from a policy with compensating controls. It is not a permanent waiver.

**Quality gate** is an automated or human check that can block progression. Coverage, duplication and complexity are signals configured per project, not universal substitutes for judgment.

**Adapter** is a thin tool-specific entry point such as `AGENTS.md` or `CLAUDE.md`. It routes an agent to `.context/` and must not duplicate policy.

**Agent** is a probabilistic assistant that can inspect, draft or implement within authorized boundaries. **Human approval** is the deterministic authorization required for scope, risk acceptance, production and destructive actions.
