# Plan — CSD MCP Adapter

Smallest viable approach: one new `src/mcp/` module behind the existing CLI entry, reuse `installer.bootstrap()` and `fs.ts` primitives, additive `--json` on the validator. No changes to adapters, registry, catalog or existing command behavior.

## Files

| Wave | File | Change |
| --- | --- | --- |
| W1 | `package.json` | Add `@modelcontextprotocol/sdk` runtime dependency |
| W1 | `src/fs.ts` | Add `realpath`, containment check (extract `ownedPath` semantics), symlink-safe read/write helpers |
| W2 | `scripts/validate_context.py` | Additive `--json` flag emitting structured result; text path untouched |
| W3 | `src/mcp/errors.ts` | Structured error type + MCP error codes |
| W3 | `src/mcp/repository.ts` | Repo inspection, bootstrap/context file resolution, work-item read/write/allowlist, validation subprocess — no domain logic |
| W3 | `src/mcp/tools.ts` | Tool schemas + handlers for the seven tools |
| W3 | `src/mcp/server.ts` | Server wiring, stdio transport, root pinning (`--root`) |
| W4 | `src/cli.ts` | `csd mcp [--root <path>]` command |
| W5 | `tests/node/mcp-server.test.mjs` | Tool discovery, reads, writes, validation, bootstrap gate (SDK client against in-process server) |
| W5 | `tests/node/mcp-security.test.mjs` | Traversal, symlink escape, out-of-work writes, read-only tools, pinned-root rejection, nonexistent/unordered repos |
| W6 | `docs/mcp.md` | Purpose, architecture, install, `csd mcp`, stdio config, tools, security model, handoff |
| W6 | `README.md` | MCP section |

## Tests

- `npm test` (existing suites keep passing) + new suites above; `python3 scripts/validate_context.py --strict --examples` and `--json` both exercised.

## Subtasks and waves

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| S1 | hiyan | none | `package.json` dependencies installed; `npm install` clean | 1 | project |
| S2 | hiyan | none | `realInside`/`PathEscapeError` exported; strict build clean | 1 | security, testing |
| S3 | hiyan | none | `--json` emits structured report; text output unchanged | 1 | testing |
| S4 | hiyan | S1, S2, S3 | `src/mcp/repository.ts` passes build; no domain logic imported | 2 | core, security |
| S5 | hiyan | S4 | Seven tools listed over MCP; stdio server starts | 3 | security |
| S6 | hiyan | S4 | `csd mcp [--root]` dispatch works; usage text updated | 3 | project |
| S7 | hiyan | S5 | 17+ tests green on temp fixtures incl. traversal/symlink/gate cases | 4 | testing |
| S8 | hiyan | S5 | `docs/mcp.md` + README section cover config and handoff | 4 | project |
| S9 | hiyan | S5, S7, S8 | build, tests, validator all green (evidence in verification.md) | 5 | testing |

Parent owner (this agent) integrates evidence into `verification.md`.

## Risks

- SDK/TS strict flags mismatch (`exactOptionalPropertyTypes`) — verify at build; pin compatible SDK version.
- python3 absent on host — `csd_validate` must return a structured error, never success.
- Rollback: revert the new files + two additive edits (`cli.ts`, `validator --json`); no data migration involved.
