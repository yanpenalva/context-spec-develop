# Subtasks and Waves

Before execution, split work into the smallest useful units. Each row is the compact handoff to its executor: bounded task, dependencies, acceptance evidence and only the context domains that subtask needs (names from `.context/context-routing/catalog.md`):

| Subtask | Owner | Inputs | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- | --- |
| subtask | owner | inputs | dependencies | acceptance evidence | `1` | `core,project` |

Run wave 1 only after preflight. Start a later wave only after its dependencies are verified. Do not assign overlapping mutable files to parallel subagents unless the plan defines an integration owner and conflict strategy. The executor receives its row, the accepted specification and the named context domains — not the planner's entire investigation.
