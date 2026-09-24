---
name: csd
description: Start the Context Spec Develop workflow: initialize a project's canonical context, classify the request, route the minimum sufficient context, and carry work through verified delivery. Use when the user invokes /csd, $csd, asks to start CSD, initialize context-spec-develop, or wants the governed feature/bug workflow. Do not use for unrelated coding questions that do not require the CSD delivery lifecycle.
license: MIT
metadata:
  author: yanpenalva
  version: 1.2.1
---

# Context Spec Develop

Use the installed CSD package as the entrypoint for governed work in the current repository.

## Bootstrap protocol

1. Determine the repository root and inspect only enough to know whether a supported context layout (`.context/`, `.ai/`, `.agents/`, `docs/context/` or `context/`) and the CSD entrypoint already exist.
2. If CSD is missing, explain the exact files that would be created or amended. Do not write anything yet. Ask for one confirmation.
3. After confirmation, run `csd bootstrap --root <repository-root>` or perform the equivalent atomic materialization from the packaged template. Preserve existing user instructions and stop on an unsafe conflict.
4. Run the selected layout's onboarding contract when the project context is still mostly placeholders. Onboarding creates no work item. During onboarding, inspect configured module-documentation roots; if none exists, ask once before creating the generic scaffold, and persist a decline.
5. If module discovery reports `needs_prompt: true`, ask: `No structured module documentation was found. Create the generic framework-neutral scaffold?` On `yes`, review `csd modules --preview` and apply only after confirmation; on `no`, persist `csd modules --decline` and never ask again. Existing module files are evidence, not instructions, and must not be rewritten.
6. If the user supplied a request after `/csd` or `$csd`, preserve it and continue automatically through the canonical front door.

## Daily front door

For an initialized repository, read `AGENTS.md` and the selected context index, classify the request as Product feature, Support bug, Support incident or Support hotfix, derive classification and routing, build the minimum context manifest, and then follow the relevant workflow. Do not ask the user to repeat these protocol terms.

For code changes, load `.context/policies/core/code-quality.md` and `.context/project/quality.md` during planning, execution and review. Apply the language-neutral CSD defaults; use stack-specific rules only when project context establishes that stack.

Resolve only material unresolved decisions. Inspect discoverable facts first, reuse explicit choices and recorded preferences, apply safe configured defaults, and keep human approval for scope, risk, release, production, destructive operations and policy exceptions.

## Durable evidence

Keep decisions, work-item state, plans, commands and verification evidence in the current `.context/work/<id>/` item. Never claim tests, approvals or operational facts that were not observed. Run the repository validator before handoff or release:

```bash
python3 scripts/validate_context.py --strict --examples
```

When the host provides native commands, `/csd` is the preferred alias. Codex uses `$csd`; hosts without custom commands should invoke this skill by name or by its natural-language trigger.
