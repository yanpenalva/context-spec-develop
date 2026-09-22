# Review — FEAT-9014

## Inputs

- Request: add an MCP adapter to the package (transport/interface only, no canonical-contract duplication).
- Spec: `.context/work/FEAT-9014/spec.md`.
- Plan: `.context/work/FEAT-9014/plan.md`.
- Diff: new `src/mcp/` (4 files), hardened `src/fs.ts`, `csd mcp` in `src/cli.ts`, additive `--json` in `scripts/validate_context.py`, 2 new test files, `docs/mcp.md`, README section, `package.json` (+`@modelcontextprotocol/sdk`, +`zod`).
- Verification: `.context/work/FEAT-9014/verification.md` (28/28 tests, validator pass, check exit 0, 2026-09-21).
- Applicable policies: core security-privacy (filesystem boundary), testing (evidence), ai-governance.
- Exceptions: none.

## Correct

- MCP stays a transport/access boundary: no classification, routing, interaction or workflow logic in TypeScript; canonical contracts untouched.
- Durable state remains `.context/work/<id>/`; the server holds no state; cross-agent handoff covered by an automated test.
- Security wave verified by snapshot (read-only tools), traversal, symlink-escape, allowlist and gate tests; validator honesty (`VALIDATION_NOT_RUN`) is explicit.
- Bootstrap contract preserved via stateless preview/apply token pair; silent single-call materialization impossible.
- Existing adapters untouched: `Adapter`, registry, catalog unchanged; `cli-contract` suite green.

## Problems and risks

- Priority: low
- Location: `package.json`
- Evidence: first runtime dependency (`@modelcontextprotocol/sdk` with transitive deps) added to a zero-dependency package.
- Impact: supply-chain surface grows; install size grows.
- Recommendation: pin `^1.30.0`, monitor advisories; acceptable — the plan explicitly approved the official SDK.

- Priority: low
- Location: `src/mcp/repository.ts` (`validateWorkItemShape`)
- Evidence: structural mirror of the work-item schema (required + enums + conditionals), not full JSON-Schema evaluation.
- Impact: exotic schema edge (e.g. unknown-key rejection) deferred to `csd_validate`, which runs the canonical validator.
- Recommendation: acceptable; canonical validation remains the single authority.

## Baseline checklist

- [x] No new critical reliability or security issue.
- [x] No unexplained complexity or duplication regression.
- [x] Tests and actual command evidence are present.
- [x] Each material check records command, scope, exit code, date and limitations.
- [x] Compatibility, data and rollback risks are addressed (revert = remove new files + two additive edits; no data migration).
- [x] Sensitive data and AI-use controls are addressed (no secrets read or exposed; error bodies bounded).
- [x] Subtask boundaries, wave dependencies and integration ownership are evidenced.

## Verdict

`APPROVED`
