# Specification: FEAT-9011

Single-sentence change in `AGENTS.md` closure paragraph: closure presents validation evidence plus the proposed Conventional Commit message and then follows the resolved `git_finalization_mode` — `confirm_each` asks separately before commit and push; `automatic` performs only the Git actions already authorized by the resolved mode within the existing guardrails; unresolved authorizes nothing. Keep "never force-push or infer approval from an earlier answer".

Acceptance: `AGENTS.md` no longer implies unconditional per-step confirmation; no other file needs changing; validator and unit suite pass.
