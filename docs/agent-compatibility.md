# Agent Compatibility

The canonical contract is Markdown and JSON in `.context/`. Tool-specific files should only explain how an agent discovers and loads that source.

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

All agents follow the same startup route: read `AGENTS.md`, select a conversation profile, classify Product/Support during intake, classify the work and derive routing depth per `.context/classification/`, apply the interaction protocol from `.context/interaction/` to every question and escalation, open the work item, decompose the plan into waves and then follow the current phase contract. None of these steps requires harness-specific rules; an adapter only teaches where the entrypoint lives.
