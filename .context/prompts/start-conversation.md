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

Do not ask the user to create folders or copy templates. The orchestrator creates `.context/work/<id>/`, selects the overlay and writes the initial `work-item.json` automatically.

## Delegate

After intake and specification, split work into very small subtasks. Assign each subtask to the configured executor pool, group independent work into waves, and give every agent relevant context, acceptance evidence and a stop condition.

## Stop

Stop before file creation when classification, ownership, authorization or risk cannot be determined. Stop before implementation when preflight is not `READY`. Stop before push when human approval is absent.
