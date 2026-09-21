# Agent Instructions

This repository uses `.context/` as its canonical delivery context.

Conversation startup:

1. Read this file, then `.context/INDEX.md`.
2. If the project context is not yet initialized (`.context/project/` predominantly placeholders or `NOT FOUND`) or the user asks to initialize it, follow `.context/prompts/initialize-project.md`: discover repository facts, populate the canonical project context, record unknowns as `NOT FOUND`, ask only non-discoverable material questions, validate. Onboarding creates no work item. Skip the remaining startup steps until initialization is done.
3. Ask which conversation profile applies, unless the user already chose one. Use `.context/profiles/`.
4. Every operational request enters through the front door — it is intrinsic, never an optional feature: classify the request with the intake decision tree (Product feature, Support bug, Support incident, Support hotfix) and record `track` and `type` in `work-item.json`; classify complexity, impact, security and confidence per `.context/classification/README.md`; derive routing depth deterministically per `.context/classification/routing.md`; then load only the required context per `.context/context-routing/README.md`. The main agent performs classification with zero configuration; a dedicated classifier executor is an optional harness optimization (`.context/classification/classifier-contract.md`).
5. Apply `.context/interaction/README.md` before any question, assumption, decision or escalation.
6. Ask whether Git finalization should use `confirm_each` or `automatic`, unless the user already chose; record `git_finalization_mode` in the work item.
7. Read only relevant `.context/project/`, policy, workflow and work-item files.
8. Specify and plan before execution. Split work into small subtasks and dependency-safe waves; use subagents only with explicit scope and least privilege.
9. Work only inside the current work item and follow its approved artifacts.
10. Run `python3 scripts/validate_context.py --strict --examples` before handoff or release.

Use `.context/tooling/rtk.md` and prefer the `rtk` wrapper for concise shell output when installed. Use `.context/tooling/ai-memory.md` and `.context/tooling/code-review-graph.md` only within their stated boundaries.

Use `.context/prompts/intake.md` for the startup questions and `.context/prompts/` for the current phase contract.

The agent may prepare artifacts and implementation, but humans own scope approval, risk acceptance, production authorization and incident closure.

Before asking a question, inspect the repository and consult `.context/policies/core/questioning-and-evidence.md`. Ask only a decision-changing question, distinguish fact/inference/unknown, and stop when a required decision or `MUST` evidence is unresolved.

At closure, present validation evidence and a proposed Conventional Commit message. Ask separately before commit and before push; never force-push or infer approval from an earlier answer.

Do not invent requirements, contracts, architecture, permissions, operational procedures or test evidence. Record unknowns as `NOT FOUND`, ask when they change scope or risk, and preserve existing behavior unless the approved work item says otherwise.

The canonical instructions live in `.context/`; this file is intentionally a small adapter for tools that discover `AGENTS.md` automatically.
