# Optional Context Tooling

These integrations improve context economy and coordination. They are optional, project-owned and never replace canonical files, tests or human approval.

| Tool | Guidance |
| --- | --- |
| RTK | Use the repository's `rtk` command wrapper for concise shell, search, diff and test output when available. |
| Caveman | Use explicit compression levels for planning or status when token budget is constrained; keep code, commands, errors and safety decisions precise. |
| AI-memory | Store durable decisions in versioned `.context/` files; keep transient progress local and never persist secrets. |
| Code review graph | Model subtask dependencies, review ownership and wave order; keep final review independent and evidence-based. |

If a tool is unavailable, continue with standard commands and record `NOT FOUND` for the integration. Do not add runtime dependency on any of these tools.
