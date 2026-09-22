# Verification — FEAT-9014

## Commands and results (2026-09-21)

```text
npx tsc --noEmit                          → clean (strict, exactOptionalPropertyTypes)
npm test                                  → 27 tests, 27 pass, 0 fail
  tests/node/cli-contract.test.mjs        → existing adapters unchanged
  tests/node/registry-contract.test.mjs   → pass
  tests/node/mcp-server.test.mjs          → 9 pass (discovery, inspect, context, work item, atomic write, schema validation, validate, bootstrap gate, cross-agent handoff)
  tests/node/mcp-security.test.mjs        → 8 pass (pinned root, ROOT_REQUIRED, nonexistent/bare repos, read-only snapshots, traversal/symlink escapes, malformed work item, stdio spawn e2e, pinned stdio rejection)
python3 scripts/validate_context.py --strict --examples → Context validation passed.
npm run check (build + registry + catalog) → exit 0
```

## Security evidence

- Traversal: `artifact: '../../evil.md'` → `ARTIFACT_NOT_ALLOWED`; `workItem: '../outside'` → `WORK_ITEM_INVALID`.
- Symlink escape: work-item directory symlinked outside the repository → write rejected with `PATH_ESCAPE`; nothing created at the target.
- Read-only tools verified by full filesystem snapshot before/after (inspect, context, work-item reads, validate): zero mutations.
- Bootstrap gate: apply without preview token → `BOOTSTRAP_GATE`; preview creates nothing (asserted); correct token materializes; changed state invalidates token (hash over planned files + AGENTS.md action + current content).
- Validator honesty: missing `python3`/script or non-JSON output → `VALIDATION_NOT_RUN`; a bare directory returns `ran: true, ok: false` with errors — never silent success.

## Acceptance criteria check

1. `csd mcp` starts stdio server; `--root` pins — verified by spawned-binary e2e tests. ✔
2. Client lists 7 tools and calls each successfully against fixture repos. ✔
3. Writes land only in allowlisted `.context/work/<id>/` artifacts; traversal/symlink rejected with structured errors. ✔
4. Bootstrap requires preview token; single silent call impossible. ✔
5. `csd_validate` structured; error when validation cannot run. ✔
6. All tests pass (27/27); validator passes on this repository. ✔
7. Existing adapters untouched (`cli-contract` suite green; `Adapter`/registry/catalog unmodified); handoff test proves MCP-written state is readable with plain filesystem reads. ✔
