# Agent Instructions

This repository uses `.context/` as its canonical delivery context.

Conversation startup:

1. Read this file, then `.context/INDEX.md`.
2. If the project context is not yet initialized (`.context/project/` predominantly placeholders or `NOT FOUND`) or the user asks to initialize it, follow `.context/prompts/initialize-project.md`: discover repository facts, populate the canonical project context, record unknowns as `NOT FOUND`, ask only non-discoverable material questions, validate. Onboarding creates no work item. Skip the remaining startup steps until initialization is done.
3. For every operational request, run the front door before any optional configuration: classify with the intake decision tree (Product feature, Support bug, Support incident, Support hotfix) and record `track` and `type` in `work-item.json`; classify complexity, impact, security and confidence per `.context/classification/README.md`; derive routing depth deterministically per `.context/classification/routing.md`; then load only the required context per `.context/context-routing/README.md`. The main agent performs classification with zero configuration; a dedicated classifier executor is an optional harness optimization (`.context/classification/classifier-contract.md`).
4. After the front door, resolve remaining decisions on demand per `.context/interaction/README.md`: reuse explicit user choices and recorded preferences; apply safe configured defaults (conversation profile: `agent_profiles.default` in `config.json`, stated briefly); defer decisions irrelevant to the current phase; inspect discoverable facts; ask only material unresolved decisions. Resolve `git_finalization_mode` before the first Git finalization action — never at startup by default — and treat an unresolved mode as no authorization: the safe fallback when resolution is required is `confirm_each`. Use orchestration role assignments as configured; ask about overrides only when the user requests one or an assignment is invalid or materially unsuitable.
5. Apply `.context/interaction/README.md` before any question, assumption, decision or escalation.
6. Read only relevant `.context/project/`, policy, workflow and work-item files.
7. Specify and plan before execution. Split work into small subtasks and dependency-safe waves; use subagents only with explicit scope and least privilege.
8. Work only inside the current work item and follow its approved artifacts.
9. Run `python3 scripts/validate_context.py --strict --examples` before handoff or release.

Use `.context/tooling/rtk.md` and prefer the `rtk` wrapper for concise shell output when installed. Use `.context/tooling/ai-memory.md` and `.context/tooling/code-review-graph.md` only within their stated boundaries.

Use `.context/prompts/intake.md` for the startup questions and `.context/prompts/` for the current phase contract.

The agent may prepare artifacts and implementation, but humans own scope approval, risk acceptance, production authorization and incident closure.

Before asking a question, inspect the repository and consult `.context/policies/core/questioning-and-evidence.md`. Ask only a decision-changing question, distinguish fact/inference/unknown, and stop when a required decision or `MUST` evidence is unresolved.

At closure, present validation evidence and a proposed Conventional Commit message, then follow the resolved `git_finalization_mode`: `confirm_each` asks separately before commit and push; `automatic` performs only the Git actions already authorized by the resolved mode, within the existing guardrails; unresolved authorizes nothing. Never force-push or infer approval from an earlier answer.

Do not invent requirements, contracts, architecture, permissions, operational procedures or test evidence. Record unknowns as `NOT FOUND`, ask when they change scope or risk, and preserve existing behavior unless the approved work item says otherwise.

The canonical instructions live in `.context/`; this file is intentionally a small adapter for tools that discover `AGENTS.md` automatically.
