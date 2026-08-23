# Subtasks, Waves and Subagents Policy

- Work MUST be decomposed into small, independently verifiable subtasks before execution.
- Every subtask MUST have one owner, a bounded scope, an acceptance signal and a declared dependency set.
- A wave MAY run subtasks in parallel only when dependencies, files and mutable boundaries do not conflict.
- A parent agent or engineer MUST integrate subagent output, resolve conflicts and verify evidence. Subagents are not release approvers.
- Subagents MUST receive least-privilege context: work item, relevant project files, assigned subtask and stop condition.
- A subtask MUST stop and return a finding when its scope, contract, authorization or dependency is unclear.
- Review and release subtasks SHOULD be independent from implementation when risk warrants it.
- The plan MUST record wave order, ownership, dependencies, handoff evidence and the rule for recombining results.
