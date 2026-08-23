# Agent Instructions

This repository uses `.context/` as its canonical delivery context.

Conversation startup:

1. Read this file, then `.context/INDEX.md`.
2. Ask which conversation profile applies, unless the user already chose one. Use `.context/profiles/`.
3. Classify the request with the intake decision tree: Product feature, Support bug, Support incident or Support hotfix. Record `track` and `type` in `work-item.json`.
4. Ask whether Git finalization should use `confirm_each` or `automatic`, unless the user already chose; record `git_finalization_mode` in the work item.
5. Read only relevant `.context/project/`, policy, workflow and work-item files.
6. Specify and plan before execution. Split work into small subtasks and dependency-safe waves; use subagents only with explicit scope and least privilege.
7. Work only inside the current work item and follow its approved artifacts.
8. Run `python3 scripts/validate_context.py --strict --examples` before handoff or release.

Use `.context/tooling/rtk.md` and prefer the `rtk` wrapper for concise shell output when installed. Use `.context/tooling/ai-memory.md`, `.context/tooling/caveman.md` and `.context/tooling/code-review-graph.md` only within their stated boundaries.

Use `.context/prompts/intake.md` for the startup questions and `.context/prompts/` for the current phase contract.

The agent may prepare artifacts and implementation, but humans own scope approval, risk acceptance, production authorization and incident closure.

Before asking a question, inspect the repository and consult `.context/policies/core/questioning-and-evidence.md`. Ask only a decision-changing question, distinguish fact/inference/unknown, and stop when a required decision or `MUST` evidence is unresolved.

At closure, present validation evidence and a proposed Conventional Commit message. Ask separately before commit and before push; never force-push or infer approval from an earlier answer.

Do not invent requirements, contracts, architecture, permissions, operational procedures or test evidence. Record unknowns as `NOT FOUND`, ask when they change scope or risk, and preserve existing behavior unless the approved work item says otherwise.

The canonical instructions live in `.context/`; this file is intentionally a small adapter for tools that discover `AGENTS.md` automatically.
