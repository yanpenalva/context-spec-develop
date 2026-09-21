# Review: FEAT-9010

Diff checked against spec (2026-09-20):

- Front door precedes optional configuration in every canonical instruction (AGENTS.md, start-conversation, intake, profiles, workflows, INDEX, orchestration README, agent-orchestration docs). ✔
- Profile: explicit > recorded > configured default (stated briefly); ask only material; never derived from routing; `PROFILE != CLASSIFICATION != ROUTING != AUTHORIZATION` documented in profiles README + glossary; profiles capability untouched. ✔
- Git: phase-relevant resolution in close.md/start-conversation/orchestration README; `DEFERRED DECISION != GRANTED AUTHORIZATION`; confirm_each fallback; all protections intact (test-enforced). ✔
- Roles: defaults, override only on request/invalidity; delivery-orchestrator opening questions no longer open with profile/roles. ✔
- Ordering invariant SHOULD-strength in classification/README; "interaction is a cost too" priority order in interaction/README; no new policy files (§20 respected); no new concepts (§38). ✔
- Schema untouched; validator untouched; classifier architecture untouched. ✔
- One writing error during execution (glossary edit dropped Policy/Convention/stack-profile definitions) was caught and restored immediately.
- Findings: none blocking.
