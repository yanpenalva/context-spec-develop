# Discovery: CSD package distribution

## Evidence

- The kit already contains the canonical `.context/` contracts, adapters and Python validator.
- The repository had no npm package, Node CLI, install lockfile, skill registry, catalog or release workflow.
- The public request requires portable installation plus native aliases while preserving the canonical context as the sole workflow source.

## Decisions

- Package: `@owlcodium/context-spec-develop`.
- Runtime: TypeScript compiled for Node 22 or newer.
- Distribution: npm and GitHub catalog/release workflows.
- Activation: `/csd` where custom commands exist, `$csd` in Codex, and a `csd` custom agent in Copilot.
- MCP: out of scope for v1.
- Bootstrap: preview and one confirmation before materialization.
