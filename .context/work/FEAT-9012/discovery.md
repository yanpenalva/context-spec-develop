# Discovery: FEAT-9012

Owner request (2026-09-20): two residual references still treated `git_finalization_mode` as a mandatory startup decision. Confirmed canonical just-in-time semantics in `AGENTS.md`, `start-conversation.md`, `close.md` (all correct, untouched). Contradictions found by grep: `review-release.md` line 11 ("may explicitly select `automatic` at conversation startup") and `README.md` Git delivery ("within the startup authorization"; "At conversation start, choose Git finalization").
