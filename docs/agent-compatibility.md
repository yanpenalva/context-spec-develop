# Agent Compatibility

For a new repository, .context/ is the default canonical layout. Before bootstrap, CSD discovers valid .context/, .ai/, .agents/, docs/context/, and context/ layouts and uses the selected one. Tool-specific files should only explain how an agent discovers and loads that source.

For new projects, the npm package installs the `csd` skill and native activation files. Use `npx @owlcodium/context-spec-develop install`; run `csd update` when a newer package is available. Hosts with custom command files receive `/csd`; Codex receives `$csd`; Copilot receives the `csd` custom agent. Harnesses outside this matrix can load the standard `.agents/skills/csd/SKILL.md` directly.

| Agent family                          | Adapter                                    |
| ------------------------------------- | ------------------------------------------ |
| Codex and other AGENTS.md-aware tools | root `AGENTS.md`                           |
| Codex explicit adapter                | `adapters/codex/AGENTS.md`                 |
| Claude Code                           | `adapters/claude/CLAUDE.md`                |
| GitHub Copilot                        | `adapters/copilot/copilot-instructions.md` |
| Gemini                                | `adapters/gemini/GEMINI.md`                |
| OpenCode                              | `adapters/opencode/AGENTS.md`              |
| Cursor                                | `adapters/cursor/AGENTS.md`                |

When an adapter cannot express a capability, the canonical workflow still wins. Do not maintain separate copies of the methodology.

All agents follow the same startup route: read AGENTS.md; inspect and select the repository's context layout; if project context is not initialized, use that layout's onboarding sources (no work item), inspect configured module-documentation roots and ask once about the generic scaffold when no structure exists; otherwise select a conversation profile, classify Product/Support during intake, derive routing depth, build the context manifest and load only required domains, apply the interaction protocol to questions and escalations, open the work item under the normalized work root, decompose the plan into waves and follow the current phase contract.

See [context discovery](context-discovery.md) for layout markers, precedence and bootstrap confirmation.
