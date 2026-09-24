# Changelog

## 1.2.1 — 2026-09-24

- Fixed global Gemini CLI / Antigravity skill discovery path by routing global adapter installs to `.gemini/config/skills/csd/SKILL.md` (while preserving local project installs at `.agents/skills/csd/SKILL.md`).
- Regenerated distribution registry and catalog artifacts.

## 1.2.0 — 2026-09-23

- Added the official stdio MCP adapter with seven tools for repository inspection, context loading, work-item access, artifact persistence, validation and gated bootstrap.
- Added normalized discovery for `.context/`, `.ai/`, `.agents/`, `docs/context/` and `context/`, including marker validation, adapter precedence, compatibility routing, path safety and symlink protection.
- Added read-only bootstrap previews, explicit confirmation, ownership hashes, retry support, collision detection and protected-path handling.
- Added optional framework-neutral module documentation discovery with existing `.context`/`.ai` preservation, generic scaffold preview, persistent decline and bounded configurable search roots.
- Added safe package and context update flows: `csd update`, `csd update --dry-run`, `csd update --context`, and protected project-owned context handling with controlled `kit_version` merge.
- Added an opinionated language- and framework-neutral code-quality baseline covering immutability, explicit types, domain boundaries, no-`else` control flow, structural thresholds, error handling and documentation.
- Added CLI, MCP, filesystem-safety, compatibility-layout, module-context, update and validator coverage; regenerated distribution registry and catalog artifacts.

## 1.0.0 — 2026-09-21

- First stable release of the installable, agent-neutral Context Spec Develop workflow for Codex, Claude Code, Cursor, Copilot, Gemini, OpenCode and Open Agent Skills.
- Added the `@owlcodium/context-spec-develop` npm package, global/project installation, native harness activation, safe bootstrap, lockfile integrity checks, versioned registry, static catalog and provenance-enabled release workflow.

## 0.2.0 — Unreleased

- Added the `@owlcodium/context-spec-develop` TypeScript/Node package: `csd` skill, multi-harness installer, lockfile integrity checks, safe bootstrap, registry, static catalog and release workflows. Native aliases are `/csd` where supported, `$csd` in Codex and the `csd` custom agent in Copilot.

- Made startup interaction demand-driven: the front door (classification → deterministic routing → context routing) now precedes optional configuration. Conversation profile resolves lazily (explicit choice > recorded preference > configured default, stated briefly; asked only when material and never derived from routing); `git_finalization_mode` resolves before the first Git finalization action — an unresolved mode authorizes nothing and `confirm_each` remains the safe fallback; agent-role overrides are asked only on request or invalid assignment. Added the SHOULD-level front-door ordering invariant, the interaction-cost principle (with the standing priority order), nine focused tests, and documentation updates across prompts, profiles, orchestration, workflows, README and the glossary. No schema or validator structural change; no migration.
- Removed Caveman from the official optional tooling set (guidance file, references in README, AGENTS.md, quickstart, customization, executive overview and the validator's required-file list). Remaining optional tooling: RTK, AI-memory, code-review graph and the subtasks-and-waves guidance.
- Added agent-assisted project onboarding (`.context/prompts/initialize-project.md`): one plain-language request initializes the canonical project context from bounded repository discovery; unknowns stay `NOT FOUND`, only non-discoverable material questions reach the human, re-runs preserve confirmed facts, and onboarding creates no work item. Getting-started and the Portuguese quickstart now show install → initialize → work-normally without a mega-prompt or a required magic phrase.
- Made the front door explicit: classification, deterministic routing and context routing are mandatory protocol stages of every daily request; only the classifier executor is configurable (same-agent remains the zero-config default). Documented in the classification and context-routing contracts, `AGENTS.md`, README and the glossary, with a SHOULD-level strong ordering invariant (no detailed canonical context before initial classification unless needed to classify safely; targeted discovery preserved) and the structural-context-economy boundary (canonical context loading only — no token-percentage claims).
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
