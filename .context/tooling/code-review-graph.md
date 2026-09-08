# Code Review Graph Guidance

This guidance distinguishes two complementary graph applications:

## 1. Structural Code Knowledge Graph (AST & Codebase Relations)

When AST or code knowledge graph tooling (such as graph MCP servers) is available in the session, use it as the first structural query layer before broad text search:

- **Structural queries**: Use graph queries to locate callers, callees, symbol definitions, type hierarchies and test relationships.
- **Refresh policy**: Build or refresh the graph from the repository root when it is available and stale before code navigation, impact analysis or review. Documentation-only work does not require a graph refresh.
- **Direct confirmation**: Use direct file reads to inspect specific implementation details and contracts that the graph does not represent.
- **Fallback**: If code graph tooling is unavailable, record the limitation in the task artifact and continue with targeted searches.

## 2. Delivery and Review Dependency Graph (Workflow & Waves)

Use a review dependency graph when work has multiple subtasks, waves, owners or risk boundaries:

- Record nodes for subtasks, tests, security checks and release decisions; record edges for dependencies and evidence.
- Expose cycles, missing reviewers and unsafe parallel execution before work begins.
- Implementation nodes should not approve their own high-risk change.
- Review nodes should consume the final diff and executed verification evidence.
- Release nodes should depend on verification, review, rollback and observation readiness.
- If no graph visualization tool is installed, represent the same information as a dependency table in `plan.md`.
