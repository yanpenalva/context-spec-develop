# Discovery: FEAT-9011

Owner request (2026-09-20): fix residual ambiguity — `AGENTS.md:25` reads "Ask separately before commit and before push" unconditionally, suggesting closure always requires per-step confirmation even when `git_finalization_mode = automatic` was validly resolved.

Inspection: canonical semantics are mode-driven (`.context/prompts/close.md`, `start-conversation.md`, `orchestration/README.md`, README, quickstart). Grep for eager/absolute phrasings found exactly one direct contradiction: the `AGENTS.md` closure sentence. No other architecture, schema, validator or policy change is needed.

Note: `git_finalization_mode` left unresolved on this item per the lazy rule; recorded only when Git finalization becomes relevant.
