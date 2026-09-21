# Concepts and Glossary

This document gives people and agents one vocabulary for the delivery system.

## Core concepts

**Context** is the authoritative information needed to make a decision. It is stored in small, linked files instead of repeated in every prompt.

**Canonical source** is the file that owns a rule or fact. Adapters and prompts reference it; they do not copy competing versions.

**Project context** describes one product's architecture, stack, security, testing, delivery and observability. It is factual and project-owned.

**Policy** is a normative rule expressed as MUST, SHOULD or MAY. **Convention** is a project choice such as naming or commit format. A **stack profile** is an optional set of rules for a language, framework or operating environment.

**Conversation profile** is a collaboration lens — interaction style and role emphasis, not a program that executes work. It changes questions and emphasis, never authority, policy, classification or routing: `PROFILE != CLASSIFICATION != ROUTING != AUTHORIZATION`, and routing is never derived from the profile. **Profile resolution** is lazy: reuse an explicit user choice or recorded preference; otherwise apply the configured default (`agent_profiles.default`) and state it briefly; ask only when no default satisfies the request or selection materially changes collaboration (per `.context/profiles/README.md`).

**Deferred decision != granted authorization.** A decision whose resolution is postponed (for example `git_finalization_mode` before any Git action) authorizes nothing while unresolved; the safe fallback when resolution becomes necessary is the canonical safe default (`confirm_each`), never the permissive value.

**Workflow** is the sequence of gates. **Track** is the kind of work being performed, currently Product or Support. **Artifact** is a durable file produced by a gate. **Evidence** is the observation, command result, link or approval that supports a claim.

**Work item** is the directory and metadata record for one change, defect or incident. It links intent, decisions, implementation evidence and production outcome.

**Gate** is a decision point that must be satisfied before the next phase. A gate may return work to an earlier phase.

## Lifecycle terms

**Project onboarding** is the agent-assisted initialization of the canonical project context in an adopting repository, per `.context/prompts/initialize-project.md`: bounded repository discovery populates `.context/project/` and `config.json`; unknowns become `NOT FOUND`; only non-discoverable material questions reach the human. Onboarding is distinct from daily work and creates no work item. **Daily work** is every operational request after initialization; it enters through the front door below. `PROJECT ONBOARDING != DAILY WORKFLOW`, and `ONBOARDING DISCOVERY != TASK DISCOVERY`: onboarding may inspect the repository more broadly because its output is the reusable canonical context, but stays fact-oriented and never dumps the repository into context.

**Front door** is the intrinsic entry sequence of every daily request — minimal bootstrap, initial classification, deterministic routing, context routing, minimum sufficient context, workflow. It is not a callable feature and involves no `use_classifier` decision: the user describes the work, the framework governs the process. **Structural context economy** is the resulting property — decide what context is needed before loading detailed context. It bounds canonical context loading (project context, policies, workflow, domains, discovery, handoffs); it does not control harness system prompts, tool schemas, IDE-injected context, provider memory or connector context, and it claims no token percentage without measurement (`benchmarks/`).

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

**Classification** is the declarative description of a request produced per `.context/classification/README.md`: `complexity` (intrinsic difficulty), `impact` (blast radius), `security` (none, relevant or sensitive exposure signal) and `confidence` (how well evidence supports the classification). Impact is not complexity, and neither is risk or severity.

**Routing** is the execution depth (minimal, standard, extended). **Derived routing** is computed deterministically from the classification per `.context/classification/routing.md`. **Effective routing** is the depth actually in effect after an optional upward override by a human; overrides never touch the classification dimensions, and downgrades happen only through reclassification.

**Reclassification** is the recorded change of classification when material new evidence appears: previous dimensions, trigger evidence and routing impact, stored on the work item. Reclassification recalculates derived routing and the context requirements.

**Decision category** is the authority classification of an unresolved point per `.context/interaction/decision-policy.md`: `DISCOVERABLE`, `REVERSIBLE_AGENT_DECISION`, `ASSUMPTION_ALLOWED`, `HUMAN_DECISION_REQUIRED`, `CRITICAL_HUMAN_GATE`. **Execution state** is the progress state of that point: `CONTINUE`, `WAITING_FOR_HUMAN` or `BLOCKED`. `BLOCKED` means no safe path exists now — it is not a decision category and not merely a pending question.

**Context domain** is a named bundle of canonical sources in `.context/context-routing/catalog.md`. The **context manifest** records which domains are `required`, `deferred` and what `triggers` fired, under the `budget` equal to the effective routing. A **context budget** (minimal, standard, extended) bounds required domains structurally; it is a ceiling, not a quota. **Progressive disclosure** means classification precedes detailed context loading and each phase receives only the context it needs; context inclusion requires purpose, and exclusion is the default.

**Bootstrap** is the minimal, domain-independent entry context — entrypoint, index essentials, the classification and interaction cores, the catalog and the pre-classification governance boundaries. It is distinct from context domains: `BOOTSTRAP != CONTEXT DOMAIN`, and detailed project, testing, architecture, security, release or incident context is never part of it by default. **Targeted discovery** is the minimal evidence-seeking (filenames, symbols, metadata) allowed at classification time; it is not domain loading. No domain is mandatory in every manifest: governance holds through the bootstrap and through promotion. A **mandatory policy** stays mandatory even where its full document is loaded lazily.

**Classifier role** is the executor that produces a classification satisfying `.context/classification/classifier-contract.md`. The kit defines the contract; the user or harness chooses the executor — same agent (canonical), dedicated classifier or hybrid. The role never chooses routing (deterministic), the context manifest, agents or models. **Protected signals** (security, privacy, authentication, authorization, production, deployment, migration, destructive or irreversible operations, public contracts, external integrations, cross-module or system impact, incident, hotfix) demand conservative handling under the acceptance policy. **Fallback** routes unsatisfactory classifier results to the canonical same-agent path; a classifier failure never fails the workflow.

**Compact handoff** is the structured artifact passed between phases or agents — task, acceptance criteria, decisions, constraints, relevant files, evidence — never the conversation history or private reasoning. The subtask row in `plan.md` is the planner→executor handoff; `verification.md` carries the executor→reviewer evidence.

**Phase** describes where work is in the workflow. **Status** describes its operating condition (`draft`, `ready`, `active`, `blocked`, `completed` or `cancelled`). A completed status is valid only in the close phase.

## Quality and governance terms

**Baseline** is the minimum quality state against which new work is compared. The core baseline is no regression.

**Exception** is a scoped, approved and expiring deviation from a policy with compensating controls. It is not a permanent waiver.

**Quality gate** is an automated or human check that can block progression. Coverage, duplication and complexity are signals configured per project, not universal substitutes for judgment.

**Adapter** is a thin tool-specific entry point such as `AGENTS.md` or `CLAUDE.md`. It routes an agent to `.context/` and must not duplicate policy.

**Agent** is a probabilistic assistant that can inspect, draft or implement within authorized boundaries. **Human approval** is the deterministic authorization required for scope, risk acceptance, production and destructive actions.

**Decision category** is the interaction classification of an unresolved point per `.context/interaction/decision-policy.md`: `DISCOVERABLE`, `REVERSIBLE_AGENT_DECISION`, `ASSUMPTION_ALLOWED`, `HUMAN_DECISION_REQUIRED`, `CRITICAL_HUMAN_GATE` or `BLOCKED`.

**Uncertainty state** records whether a claim is `known`, `inferred`, `unknown` or `NOT FOUND` per `.context/interaction/uncertainty.md`. Inference is never presented as fact.

**Escalation** is the report required when work exceeds authority or approved scope, per `.context/interaction/escalation.md`: what changed, the evidence, what is affected, whether work can continue safely and which human decision is required.
