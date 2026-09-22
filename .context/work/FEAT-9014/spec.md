# Specification — CSD MCP Adapter

## Objective

Add an official MCP server to `@owlcodium/context-spec-develop` so any MCP client (ChatGPT, Claude, Codex, OpenCode, Gemini, custom hosts) can drive the CSD workflow over a local repository through a stdio transport, while `.context/` remains the single canonical source and `.context/work/<id>/` remains the only durable state.

## In scope

- `csd mcp [--root <path>]` CLI command reusing the existing `csd` binary.
- `src/mcp/` module: `server.ts`, `tools.ts`, `repository.ts`, `errors.ts` — transport/access boundary only.
- Tools: `csd_inspect`, `csd_context`, `csd_work_item`, `csd_write_artifact`, `csd_validate`, `csd_bootstrap_preview`, `csd_bootstrap_apply`.
- Hardened filesystem helpers in `src/fs.ts` (realpath resolution, symlink-escape rejection, explicit path containment).
- `--json` output flag on `scripts/validate_context.py` (additive; text output unchanged).
- Node tests under `tests/node/` using temporary fixtures only.
- `docs/mcp.md` plus a README section.

## Out of scope

- No classification, routing, interaction, workflow or prompt logic in TypeScript — those remain Markdown contracts interpreted by the agent.
- No changes to `Adapter`/`ADAPTERS`, registry, catalog or existing install/update/remove/doctor/bootstrap CLI behavior.
- No new NPM package; no generic filesystem or terminal MCP tools.
- No `.context/` schema changes.

## Evidence

- Phase 1 analysis (session 2026-09-21): zero existing MCP references; no work-item API in code; validator exists only as Python; `fs.ts` lacks symlink protection; package has zero runtime dependencies.
- User-approved decisions D1–D8: official MCP SDK; two-tool bootstrap gate with stateless preview token; `csd_context` returns bootstrap + references only; minimal structural validation of `work-item.json` writes with a closed artifact allowlist; `--root` locks the server when provided; MCP documented as an integration, not an `Adapter`; `csd_validate` shells out to the Python validator with fixed argv; no work-item id returns all open items.

## Rules and contracts

- `.context/context-routing/README.md` — bootstrap is index/pointer-oriented; MCP must not compute routing.
- `.context/interaction/README.md` — conversation stays with the agent; MCP provides discovery, context, persistence, validation only.
- `.context/schemas/work-item.schema.json` — structural validation mirror for the write path.
- Security: absolute roots only, `../` traversal blocked, symlink escape blocked, writes limited to `.context/work/<id>/<allowlist>`, structured errors, no secret exposure, no reads outside the requested repository.

## Acceptance criteria

1. `csd mcp` starts a stdio MCP server; `--root` restricts it to one repository.
2. A client can list tools and call each tool successfully against an initialized fixture repository.
3. Writes land only inside `.context/work/<id>/` allowlisted artifacts; traversal and symlink escapes are rejected with structured errors.
4. Bootstrap via MCP requires preview then apply with the preview token; a silent single-call materialization is impossible.
5. `csd_validate` returns structured results and never reports success when validation did not run (missing python3 or script → error).
6. All existing tests pass; new tests cover every listed security and behavior case; validator passes on this repository.
7. Existing adapters (`$csd`, `/csd`, custom agent) keep working unchanged; a work item created over MCP is readable by the canonical front door.
