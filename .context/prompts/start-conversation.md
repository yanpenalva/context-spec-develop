# Prompt Contract: Start Conversation

## Read

Read root `AGENTS.md`, `.context/config.json`, `.context/orchestration/config.json` and `.context/INDEX.md`.

## Initialize first, if needed

If the project context is not initialized — `.context/project/` files are predominantly placeholders or `NOT FOUND`, or the user asks to initialize the project — follow `.context/prompts/initialize-project.md` instead of intake: discover repository facts, populate the canonical project context, record unknowns as `NOT FOUND`, ask only non-discoverable material questions, validate. Onboarding creates no work item. Once the project context is populated, every request follows the intake flow below.

## Front door first, then ask only what the work needs

Run the front door before optional configuration: classify the request per `.context/prompts/intake.md` and `.context/classification/README.md`, derive routing, and build the context manifest. Then resolve remaining decisions on demand per `.context/interaction/README.md` — reuse explicit choices and recorded preferences, apply safe configured defaults, defer what the current phase does not need, inspect what is discoverable, and ask only material unresolved decisions.

Specific resolution timing:

1. **Conversation profile** — reuse the user's explicit choice when stated; otherwise apply the configured default (`agent_profiles.default` in `config.json`) and state it briefly. Ask only when no default can satisfy the request or explicit profile selection materially changes the collaboration (for example a planning-only or orchestration-shaped request). Never derive the profile from routing depth.
2. **Git finalization mode** — not a startup question by default. Resolve `confirm_each` or `automatic` before the first Git finalization action, or earlier if the user states a preference (record it and reuse it). An unresolved mode is a deferred decision, not an authorization: it never permits automatic commit or push. When resolution is required, `confirm_each` is the safe fallback.
3. **Role overrides** — use the configured `assignments.*` defaults. Ask about orchestrator/planner/executor/reviewer overrides only when the user requests one or an assignment is invalid or materially unsuitable. Never invent agents.
4. **Title, owner, risk, material constraints** — ask only what the request does not already answer and the decision needs.

If scope, branch, remote, risk or authorization changes after a Git mode was resolved, stop and re-resolve per `.context/prompts/close.md`.

Apply the canonical interaction protocol in `.context/interaction/README.md` to every question, assumption, decision and escalation: investigate before asking, classify the decision point, respect critical human gates, and record outcomes in the work item.

Do not ask the user to create folders or copy templates. The orchestrator creates `.context/work/<id>/`, selects the overlay and writes the initial `work-item.json` automatically.

## Delegate

After intake and specification, split work into very small subtasks. Assign each subtask to the configured executor pool, group independent work into waves, and give every agent relevant context, acceptance evidence and a stop condition.

## Stop

Stop before file creation when classification, ownership, authorization or risk cannot be determined. Stop before implementation when preflight is not `READY`. Stop before any Git finalization action when the mode is unresolved, the selected mode does not authorize the action, the worktree/upstream is not verified, or a required gate has failed.
