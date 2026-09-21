---
name: csd
description: Start the Context Spec Develop workflow: initialize a project's canonical context, classify the request, route the minimum sufficient context, and carry work through verified delivery. Use when the user invokes /csd, $csd, asks to start CSD, initialize context-spec-develop, or wants the governed feature/bug workflow. Do not use for unrelated coding questions that do not require the CSD delivery lifecycle.
license: MIT
metadata:
  author: yanpenalva
  version: 1.0.0
---

# Context Spec Develop

Use the installed CSD package as the entrypoint for governed work in the current repository.

## Bootstrap protocol

1. Determine the repository root and inspect only enough to know whether `.context/` and the CSD entrypoint already exist.
2. If CSD is missing, explain the exact files that would be created or amended. Do not write anything yet. Ask for one confirmation.
3. After confirmation, run `csd bootstrap --root <repository-root>` or perform the equivalent atomic materialization from the packaged template. Preserve existing user instructions and stop on an unsafe conflict.
4. Run the onboarding contract in `.context/prompts/initialize-project.md` when the project context is still mostly placeholders. Onboarding creates no work item.
5. If the user supplied a request after `/csd` or `$csd`, preserve it and continue automatically through the canonical front door.

## Daily front door

For an initialized repository, read `AGENTS.md` and `.context/INDEX.md`, classify the request as Product feature, Support bug, Support incident or Support hotfix, derive classification and routing, build the minimum context manifest, and then follow the relevant workflow. Do not ask the user to repeat these protocol terms.

Resolve only material unresolved decisions. Inspect discoverable facts first, reuse explicit choices and recorded preferences, apply safe configured defaults, and keep human approval for scope, risk, release, production, destructive operations and policy exceptions.

## Durable evidence

Keep decisions, work-item state, plans, commands and verification evidence in the current `.context/work/<id>/` item. Never claim tests, approvals or operational facts that were not observed. Run the repository validator before handoff or release:

```bash
python3 scripts/validate_context.py --strict --examples
```

When the host provides native commands, `/csd` is the preferred alias. Codex uses `$csd`; hosts without custom commands should invoke this skill by name or by its natural-language trigger.
