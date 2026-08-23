# Code Review Graph Guidance

Use a review graph when work has multiple subtasks, waves, owners or risk boundaries.

Record nodes for subtasks, tests, security checks and release decisions; record edges for dependencies and evidence. A graph helps expose cycles, missing reviewers and unsafe parallel work. It does not replace `plan.md`, `verification.md`, `review.md` or human approval.

- Implementation nodes should not approve their own high-risk change.
- Review nodes should consume the final diff and executed evidence.
- Release nodes should depend on verification, review, rollback and observation readiness.
- If no graph tool is installed, represent the same information as a dependency table in `plan.md`.
