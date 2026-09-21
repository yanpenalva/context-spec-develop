# Changelog

## 0.2.0 — Unreleased

- Added the provider-neutral classifier contract (`.context/classification/classifier-contract.md`): minimal input, canonical output, confidence semantics, acceptance policy, protected signals, fallback conditions and fail-safe — the kit defines the contract, the harness chooses the executor.
- Added classifier strategy guidance (`docs/classifier-strategies.md`) with same-agent, dedicated and hybrid modes, responsibility-boundary and flow diagrams, guidance matrix and user journeys; same-agent remains the zero-config canonical path.
- Added the golden-dataset classification benchmark (`benchmarks/classification/`): ten case classes validated offline and scored against optional adapter results on classification accuracy, routing accuracy, under-routing, false-minimal, missed protected signals and fallback behavior — independent metrics, no composite score.
- Separated the minimal bootstrap from context domains: entrypoint and index files belong to the bootstrap, the `core` domain narrowed to post-bootstrap governance, and no domain is mandatory in every manifest (trivial tasks may run on an empty manifest).
- Made `project` lazy and `testing` phase/task driven through explicit promotion triggers, with targeted discovery distinguished from domain loading and mandatory policy separated from mandatory full-document loading.
- Added the reproducible, vendor-neutral context benchmark (`benchmarks/`): five scenario classes, documented eager baseline versus routed behavior, deterministic context-size metrics, optional runtime-token slots, no fabricated numbers and not a release gate.
- Added the context-routing layer (`.context/context-routing/`): catalog of context domains, structural budgets, explicit triggers and the context manifest, with validator enforcement of manifest structure, domain names and budget consistency.
- Added immediate-classification ordering and progressive disclosure: classification precedes detailed context loading, context inclusion requires purpose, extended routing never means loading everything, and handoffs are compact artifacts instead of conversation history.
- Split decision authority from progress: decision categories (`DISCOVERABLE`, `REVERSIBLE_AGENT_DECISION`, `ASSUMPTION_ALLOWED`, `HUMAN_DECISION_REQUIRED`, `CRITICAL_HUMAN_GATE`) now carry an explicit execution state (`CONTINUE`, `WAITING_FOR_HUMAN`, `BLOCKED`) with formal precedence.
- Split routing into derived and effective: the validator enforces the deterministic derivation, upward-only human overrides with recorded authority and reason, and legacy `classification.routing` compatibility.
- Added the declarative classification layer (`.context/classification/`): complexity, impact, security signal and confidence dimensions with deterministic routing depth (minimal, standard, extended) validated on work items.
- Added the canonical human↔agent interaction protocol (`.context/interaction/`): decision categories, questioning format, uncertainty model and escalation contract.
- Added optional `classification` and `reclassification` fields to the work-item schema and templates, with backward-compatible validator enforcement.
- Added the optional orchestration `pull_request` block (`never`, `manual`, `automatic`) with validator guardrails: the PR command must only open pull requests and merging always stays a human decision; `automatic` requires automatic Git finalization and a project-configured command.
- Added separate human approvals for commit and push, with force-push protection and Git finalization evidence.
- Added the Portuguese quickstart and conversation-first onboarding guidance.
- Added questioning-and-evidence policy and validation of subtask/wave tables.
- Hardened orchestration assignments, optional tooling boundaries and closure documentation.
- Added OpenCode and Cursor adapters to the agent compatibility suite.
- Clarified code review graph guidance distinguishing AST/symbol knowledge graphs from delivery dependency graphs.
- Enriched code quality policy with string interpolation, arrow function preferences and changed-file scoping gates.

## 0.1.0 — 2026-08-23

- First public release of the agent-neutral Product and Support delivery template.
- Added core engineering, quality, testing, security/privacy, AI governance and release policies.
- Added governance modes, versioned policy exceptions, complete examples and enterprise adoption guidance.
- Added conversation profiles, intake routing, subtask/wave guidance and optional RTK, Caveman, AI-memory and review-graph guidance.
- Added Codex adapter and kept deployment/CI configuration outside the kit.
- Removed project-specific context and legacy material from the public package.
