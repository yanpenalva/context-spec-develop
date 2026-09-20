# Discovery: Automatic finalization and pull-request options

## Problem

The kit already supports `automatic` Git finalization, but teams that deliver through pull requests have no canonical option: PR opening is undocumented, so every harness improvises, and nothing prevents an automated PR command from merging.

## Evidence

- `orchestration/config.json` has `git.finalization_mode` with `confirm_each` and `automatic`, but no pull-request block.
- `policies/core/review-release.md` regulates commit, push and deployment but never mentions pull requests.
- Request from the repository owner after FEAT-9001: expose automatic commit+push clearly and add a PR-opening option.

## Affected audience

Teams adopting the kit that deliver through pull requests, and any harness following `AGENTS.md`.

## Constraints

- Platform-neutral: the kit ships no forge CLI; the PR command is project-owned configuration, like deployment.
- Human boundaries hold: push approval rules unchanged; merging MUST remain human.
- Backward compatible: existing orchestration configs without a PR block stay valid.

## Hypothesis

A `pull_request` block in the orchestration contract, with validator guardrails, gives teams the missing option without platform coupling.

## Expected value

Documented, validated automatic finalization and PR paths; consistent behavior across harnesses.

## Success signal

Validator enforces the new guardrails; docs explain both options; existing configs validate unchanged.
