# Specification: CSD como skill instalável multi-harness

## Objective

Allow a user to install CSD through npm, activate it in a compatible harness and initialize a project's canonical context with one confirmation, while keeping `.context/` as the source of truth.

## In scope

- Open Agent Skills `csd` skill with packaged canonical assets.
- TypeScript/Node CLI for install, update, remove, list and doctor.
- Adapters for Open Agent Skills, Codex, Claude Code, Cursor, Copilot, Gemini and OpenCode.
- Versioned registry with content hashes and a static catalog.
- Unit, contract and temporary-project integration tests.

## Out of scope

- MCP server.
- Real npm/GitHub publication without maintainer credentials.
- Literal `/csd` support in hosts that do not expose custom commands.

## Safety and contracts

- Installation is scoped (`global` or `project`), atomic per file and recorded in `.agents/.csd-lock.json`.
- Existing non-identical files are never overwritten without `--force`.
- Removal verifies recorded hashes and refuses modified files unless `--force` is explicit.
- Bootstrap preserves existing `AGENTS.md` content and adds a marked, idempotent CSD entry.

## Acceptance criteria

1. `npx @owlcodium/context-spec-develop install` installs a verifiable package in the selected scope.
2. Every supported harness receives its documented activation form and shared CSD instructions.
3. First activation previews missing files, waits for confirmation and then materializes the canonical context.
4. Reinstallation is idempotent; update and remove respect lockfile ownership and hashes.
5. Registry/catalog generation is deterministic and all local validation suites pass.
