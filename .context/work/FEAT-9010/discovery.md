# Discovery: FEAT-9010

Owner request (2026-09-20): refine the startup interaction flow so the intrinsic front door (classification → routing → context routing) precedes optional configuration (conversation_profile, git_finalization_mode, agent-role overrides). "Classify first. Ask/configure only when the result or current phase makes the decision materially necessary."

## Evidence (inspection 2026-09-20)

Eager asks are all repository-controlled: `AGENTS.md` steps 3/6; `start-conversation.md` ask-list + "at the beginning of every conversation" Git paragraph; `intake.md` questions 1/4; `profiles/README.md` startup step 1; `workflows/core.md` ("select one conversation profile, then run intake"); `INDEX.md` conversation routing; `orchestration/README.md` Git-at-startup; `docs/agent-orchestration.md` sequence; `delivery-orchestrator.md` question list; `README.md` work-with-an-agent; `quickstart.pt-BR.md` §3/§5.

Safe defaults already canonical: `config.agent_profiles.default = senior-software-engineer` (validator-checked, profiles/README already allows default use); `confirm_each` (start-conversation "safe default"; orchestration `git.finalization_mode`); orchestration assignment defaults. Schema: `conversation_profile` required (any available profile satisfies it — a default resolves it without asking); `git_finalization_mode` already optional → unresolved-by-absence is schema-valid. `check_orchestration` requires `startup.questions` to include `git_finalization_mode` — the list is kept and redefined as decisions the orchestrator ensures *resolved* (not necessarily asked at t=0), so no config or validator structural change is needed.

Benchmark: `scenarios.json` already carries observational `questions_expected` metadata (0/1 per scenario); no scoring change required or made.

Session decisions reused instead of re-asked (first live application of the principle): profile `senior-software-engineer`, git `confirm_each` — both explicitly chosen by the owner earlier in this session.
