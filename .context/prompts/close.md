# Prompt Contract: Observe and Close

## Inputs

Release record, production evidence, declared signals and observation window.

## Produce

`outcome.md` with deployment result, smoke checks, observed signals, rollback/escalation decisions, residual risk and learning. Support incidents also require `postmortem.md` when applicable.

Before closure, produce the Git finalization record in `release.md`: validation evidence, changed-file summary, proposed Conventional Commit message and the two separate human decisions for commit and push. Ask for commit approval first; after a successful commit, ask for push approval. Never use force push or destructive reset/clean commands.

## Constraints

Do not close an item while required evidence, approvals or preventive actions remain unowned. A denied push is not a failed implementation; record it and provide the manual command without retrying automatically.
