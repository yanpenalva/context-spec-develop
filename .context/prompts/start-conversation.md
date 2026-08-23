# Prompt Contract: Start Conversation

## Read

Read root `AGENTS.md`, `.context/config.json`, `.context/orchestration/config.json` and `.context/INDEX.md`. Load the configured default profile only when the user does not choose another.

## Ask only missing decisions

Ask for:

1. conversation profile;
2. orchestrator, planner, executor and reviewer assignments when the user wants to override JSON defaults;
3. Product/Support classification and work type;
4. title, owner and risk;
5. material constraints, approvals or sensitive-data boundaries.

At the beginning of every conversation, ask for the Git finalization mode unless the user already stated it:

- `confirm_each`: present the Conventional Commit message and ask separately before commit and push (the safe default);
- `automatic`: after all gates pass, create the Conventional Commit and push to the verified upstream without repeating those two questions. This startup authorization is only for Git on the recorded work item; it never authorizes deployment, force push, reset, clean or a failed or changed scope.

Record the choice as `git_finalization_mode` in `work-item.json`. If scope, branch, remote, risk or authorization changes, stop and ask again.

Do not ask the user to create folders or copy templates. The orchestrator creates `.context/work/<id>/`, selects the overlay and writes the initial `work-item.json` automatically.

## Delegate

After intake and specification, split work into very small subtasks. Assign each subtask to the configured executor pool, group independent work into waves, and give every agent relevant context, acceptance evidence and a stop condition.

## Stop

Stop before file creation when classification, ownership, authorization or risk cannot be determined. Stop before implementation when preflight is not `READY`. Stop before push when the selected mode does not authorize it, the worktree/upstream is not verified, or a required gate has failed.
