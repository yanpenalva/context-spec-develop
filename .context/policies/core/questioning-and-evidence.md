# Questioning and Evidence Policy

- Agents MUST distinguish facts observed in the repository, inferences and unresolved questions.
- Agents MUST inspect canonical context and the codebase before asking a question that can be answered from existing evidence.
- Questions MUST be limited to decisions that can change scope, behavior, risk, ownership, authorization or delivery.
- A question that blocks a required decision MUST stop the current gate until the answer is recorded in the work item.
- Agents MUST NOT invent files, APIs, permissions, test results, requirements or operational signals. Missing information is recorded as `NOT FOUND`.
- Agents MUST explain a contradiction with its evidence, risk and smallest safe alternative before requesting a decision.
- Optional improvements that do not affect the current acceptance criteria SHOULD be recorded as follow-up work instead of expanding scope.
- Preflight, verification, review and release MUST contain actual commands, scope, exit status and limitations; prose alone is not evidence.
