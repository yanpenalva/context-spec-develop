# Release and Deployment — FEAT-9014

## Readiness

- [x] Verification and review approved (`review.md`: APPROVED).
- [x] Required tests and smoke checks have evidence: `npm test` 28/28 pass; `npm run check` exit 0; validator `--strict --examples` pass (2026-09-21, see `verification.md`).
- [x] Migration and data compatibility assessed: none — additive files plus two additive edits; no schema or lockfile change.
- [x] Feature flags/configuration documented: `csd mcp [--root <path>]`; client config in `docs/mcp.md`.
- [x] Rollback trigger and procedure tested or justified: revert the new files + two additive edits (`src/cli.ts` command, validator `--json`); no data migration.
- [x] Communication and support coverage arranged: README + `docs/mcp.md` published with the change.
- [x] Observability signals and thresholds named: validator errors/warnings are the health signal; `VALIDATION_NOT_RUN` codes surface broken environments.

## Authorization

- Release owner: hiyan
- Production approver: hiyan
- Target: repository default branch
- Planned time: 2026-09-21 (immediately after approval)

## Rollback

- Trigger: regression in existing adapter flows or security finding in the MCP boundary.
- Procedure: `git revert` of the release commit; no data cleanup required.
- Decision owner: hiyan

## Observation

- Smoke check: `csd mcp --root <repo>` + stdio initialize/tools-list (covered by e2e test).
- Window: immediate.
- Healthy signals: 7 tools listed; `csd_inspect` returns `needsBootstrap` for bare repos.
- Escalation path: open issue on github.com/yanpenalva/context-spec-develop.

## Git finalization

- Finalization mode: `confirm_each`
- Startup authorization recorded in work item: resolved just-in-time before the first Git action per canonical contract.
- Validation summary and exact commands: `npm test` (28 pass, 0 fail); `python3 scripts/validate_context.py --strict --examples` (pass); `npm run check` (exit 0) — 2026-09-21.
- Proposed commit message: `feat(mcp): add stdio MCP adapter exposing the CSD workflow to MCP clients`
- Commit approval: `APPROVED`
- Commit hash: recorded after execution.
- Push target: origin default branch
- Push approval: `APPROVED`
- Push result: recorded after execution.
- Tag approval/result (if applicable): none.
