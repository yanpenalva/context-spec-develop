# Specification: Automatic finalization and pull-request options

## Objective

Make the two delivery finalization paths explicit and safe: automatic commit+push (existing `finalization_mode: automatic`) and pull-request opening (new `pull_request` block), both platform-neutral and guarded by the validator.

## Scope

- `pull_request` object in `.context/orchestration/config.json`: `mode` (never, manual, automatic), optional `command`, optional `draft_default`, mandatory `merge_requires_human_approval: true`.
- `orchestration.schema.json`: optional `pull_request` definition.
- Validator guardrails: mode enum; merge always requires human; `automatic` PR requires `finalization_mode: automatic` and a configured, non-merging command.
- Policy sentence in `policies/core/review-release.md`; docs in orchestration README, agent-orchestration, customization, README, upgrading, CHANGELOG and `prompts/close.md`.
- Internal implementation report for external model review.

## Out of scope

- Shipping or recommending any specific forge CLI in the core kit.
- Automatic merge, auto-tag or deployment automation.
- Per-work-item PR fields (PR evidence lives in `release.md`).

## Evidence

- Discovery record above; FEAT-9001 established the classification/interaction contracts this change integrates with.

## Rules and contracts

- `automatic` finalization behavior is unchanged: commit and push execute only after all gates pass, for the recorded work item, branch and remote.
- `pull_request.mode`: `never` (default, current behavior), `manual` (agent drafts title/body; human opens), `automatic` (agent runs the project-configured PR command after push).
- The PR command MUST NOT merge, force or administratively override; the validator rejects such commands.
- Opening a PR never approves it: review and merge remain human decisions.
- Security impact: relevant — this touches the authorization boundary around automated Git/forge operations; guardrails are the mitigation and are validator-enforced.

## Tests

- Merge approval flag flipped to false fails validation.
- `automatic` PR without `automatic` finalization fails; without configured command fails.
- PR command containing merge/administrative flags fails.
- Default config (never, no command) validates.

## Acceptance criteria

1. Validator enforces all guardrails; existing configs validate unchanged.
2. Both options documented; `AGENTS.md` unchanged in size beyond nothing (no pointer needed — orchestration README covers it).
3. Implementation report exists for external review.
