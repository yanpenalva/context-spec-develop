# Review — FEAT-9015

## Scope and correctness

The change follows the request and approved plan: discovery precedes materialization; five built-in layouts use explicit marker rules; custom code-registered adapters use the same normalized discovery/bootstrap contract; existing valid layouts produce no-op bootstrap; migration is never implicit. CLI and MCP retain the confirmation boundary, while existing installer bootstrap signatures remain callable.

## Security and compatibility

- Root configuration is strict and size-limited. Work-item patterns use a bounded grammar before RegExp construction.
- Path reads and writes check repository-relative paths and lstat each path component. Symlinked candidates and targets fail safely.
- Bootstrap inventories actions before writes, protects configured/default paths, records ownership and hashes, and rejects changed or unowned collisions.
- Existing AGENTS.md content outside the single CSD managed block is preserved.
- MCP work-item and artifact operations use normalized adapter paths. Tests preserve native .context behavior and verify .ai routing.
- Optional observers are code-supplied and may report only observations; configuration does not load modules or commands.

## Regressions, scope drift and risks

The final review caught and corrected three issues: direct MCP bootstrapApply calls remain source-compatible, while the user-facing MCP tool still requires confirmed: true; MCP had a second work-item regex compilation site, and selected-layout fallback routing paths could be assembled with hard-coded or doubled separators. The corrected code uses the shared bounded validator and normalized paths; the final Node suite passes. No remaining regression or scope drift was found. No runtime dependency was added. Generated registry/catalog files remain unchanged. Additional adapters are code-registered in the host process; the stock CLI/MCP entrypoints expose built-ins unless their host startup registers an extension. This is documented and avoids loading executable repository configuration.

## Verdict

READY for human handoff. Validation evidence is in verification.md. No release, commit or push was performed.
