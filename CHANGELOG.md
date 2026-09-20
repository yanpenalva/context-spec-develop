# Changelog

## 0.2.0 — Unreleased

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
