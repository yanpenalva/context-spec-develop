# Verification — FEAT-9015

## Environment

- Node.js v22.22.3; npm 10.9.8; Python 3.14.4.
- Local workspace; no external service or production environment used.

## Commands and results

| Command | Result |
| --- | --- |
| `npm test` | PASS — 55 Node tests, 0 failures. Includes all five built-in layouts, custom registered adapter discovery/bootstrap, ownership retry, conflicts, CLI and MCP paths, module scaffold/decline, package update protection, dry-run behavior, project-owned context protection and context snapshot update protection. |
| `node --test tests/node/context-discovery.test.mjs` | Covered by the full suite; focused cases include shared validator fallback, module roots, generic scaffold, persistent decline, `csd modules`, `csd update --dry-run`, `csd update --context` and local-edit conflicts. |
| `npm run check` | PASS — TypeScript compilation, asset build, registry generation and catalog generation. |
| `python3 -m unittest discover -s tests` | PASS — 83 Python tests. Fixture tests intentionally print diagnostics while asserting invalid sample repositories. |
| `python3 scripts/validate_context.py --strict --examples` | PASS — Context validation passed. |
| `git diff --exit-code -- registry catalog` | Expected diff only in generated `registry/skills.json`: the packaged skill changed and its hash/byte count was regenerated. No unexpected catalog change. |
| `git diff --check` | PASS — no whitespace errors. |

`npm run check` includes the project TypeScript compiler. No standalone lint command is configured in this repository.

## Review evidence

- Existing valid context is selected before bootstrap; multi-layout conflicts remain explicit unless configured precedence applies.
- Discovery and bootstrap preview are read-only. Apply requires explicit confirmation and the exact current preview token.
- Bootstrap ownership records support pending-write retry and hash conflict detection; AGENTS.md changes preserve text outside the CSD managed block.
- Config, marker, adapter, and target paths are bounded and checked as repository-relative paths; symlink components are rejected.
- MCP work items, bootstrap references and artifact writes use selected adapter paths, including the .agents nested-routing fallback; protected paths reject writes. The five built-ins retain native .context behavior.
- Optional framework observers can add warnings/protected paths but do not select layouts or write files.
- Module discovery inspects bounded `.context`/`.ai` documentation roots, reports existing files without rewriting them, and creates only a generic README/template after explicit confirmation. Decline persists under the selected layout.
- `csd update` protects locally edited harness files through lockfile hashes and supports read-only `--dry-run`. `csd update --context` protects project context through `.csd-bootstrap.json`, creates new protocol files, updates unchanged CSD-owned files, merges only `kit_version` in config and preserves local/unknown changes as conflicts.
- Manual CLI smoke check: `node dist/cli.js discover --root .` returns `resolved`, layout `.context`, validator `scripts/validate_context.py` and module status `missing` without writing.

## Changed areas

Implementation: src/context.ts, src/installer.ts, src/cli.ts, src/mcp/repository.ts, src/mcp/server.ts and src/mcp/tools.ts.
Tests: tests/node/context-discovery.test.mjs and tests/node/mcp-server.test.mjs.
Docs: README.md, docs/context-discovery.md, docs/context-migration.md, docs/examples/ai-context-layout.md, docs/agent-compatibility.md, docs/customization.md, docs/getting-started.md, docs/quickstart.pt-BR.md, docs/upgrading.md and docs/mcp.md.
Project onboarding and FEAT-9015 delivery artifacts are recorded under .context/project/ and .context/work/FEAT-9015/.

## Limits and unresolved items

- Stock CLI and MCP processes register the five built-in adapters. Additional adapters must be registered by code in the host process; repository configuration does not load code.
- No production release or deployment was requested or performed.
- Git finalization preference remains unresolved, so no commit or push was performed.
- Final review findings were corrected: MCP now reuses the bounded ID-pattern validator after its config read, and MCP bootstrap/reference paths now use normalized adapter routing paths without trailing-slash duplication. Module and update flows are covered by focused tests. No known implementation findings remain.
