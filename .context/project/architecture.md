# Architecture Context

The package ships a CLI/installer and an MCP server. Canonical workflow contracts are stored as Markdown and JSON in `.context/`; agent-specific entrypoints are thin adapters.

## Component map

| Component | Responsibility | Owner | Failure impact |
| --- | --- | --- | --- |
| `src/cli.ts` and `src/installer.ts` | CLI install, update, remove, inspect and `.context/` bootstrap operations | `NOT FOUND` | Filesystem writes are guarded by ownership hashes and overwrite checks |
| `src/adapters.ts` and `adapters/` | Agent-specific activation metadata and entrypoints | `NOT FOUND` | Host support depends on each adapter's documented capabilities |
| `src/mcp/` | MCP server, repository discovery, context access, artifact writes and validation | `NOT FOUND` | Repository path boundaries and artifact allowlists are enforced |
| `src/fs.ts` | Shared path checks and atomic filesystem operations | `NOT FOUND` | Path escape prevention and safe writes |
| `scripts/`, `tests/`, `.context/` | Context validator, generated package assets, tests and canonical workflow contracts | `NOT FOUND` | Generated registry/catalog consistency is checked in CI |

## Change boundaries

- Stable interfaces: `csd` CLI commands, package installation behavior, seven MCP tools and the on-disk `.context/` workflow artifacts.
- Data ownership: the consuming repository owns its instructions and work-item files; this package owns its distributed template and installed files recorded in its lockfile.
- High-risk areas: bootstrap and install/remove filesystem operations, MCP repository path handling, and changes to public CLI/MCP contracts or canonical work-item schemas.
- Architecture decisions: `NOT FOUND`.
