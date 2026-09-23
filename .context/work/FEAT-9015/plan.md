# Plan — FEAT-9015 Make CSD context discovery idempotent and framework-agnostic

## Approved approach

Create a compact shared src/context.ts module with strict configuration validation, lstat-based discovery, normalized paths and read-only bootstrap/update planners. Preserve .context/ as the default canonical layout. Built-in and code-registered layouts implement ContextAdapter: id, root, mode, markerRules, resolve, mapBootstrapPath and transformTemplate. Root config may enable registered IDs but never imports code. Use one normalized result for installer and MCP paths. Keep existing direct API signatures callable; put the human confirmation control at CLI user-facing entrypoints. Framework integrations are observer-only and are never loaded dynamically from config. Add bounded module-context discovery with generic scaffold and persistent decision record; it must never mirror `.context` and `.ai` or invent module boundaries.

## Confirmed touchpoints

- Implementation: src/context.ts, src/installer.ts, src/cli.ts, src/mcp/repository.ts and src/mcp/tools.ts.
- Update flow: installer `update` for harness files, context `contextUpdatePreview/contextUpdateApply` for CSD-owned context snapshot, and CLI `csd update --context`.
- Tests: tests/node/context-discovery.test.mjs plus existing CLI and MCP tests, retaining native .context/ cases and exercising a registered custom adapter through discovery and bootstrap.
- Docs: README, MCP reference and docs/context-discovery.md.
- Docs: README, MCP reference, context discovery, onboarding, upgrade and Portuguese quickstart guidance.
- Dependencies: no new runtime dependency; current Node filesystem APIs, TypeScript and Python validator.

## Resolution and safety algorithm

1. Resolve the repository root to a real absolute directory.
2. Load optional root `csd.config.json` only if it is a regular non-symlink file no larger than 64 KiB; validate schema, known layout IDs, marker syntax and repository-relative protected paths. Invalid input returns `invalid` without probing writes or falling back.
3. Probe every enabled registered adapter in stable order. Marker checks use `lstat`, require regular files/directories and reject symlink components. Record marker evidence, invalid reasons and deterministic resolved paths for every configured candidate. Any unsafe candidate/path-chain finding returns `invalid` immediately; do not treat it as an empty repository or bootstrap.
4. With no safety failure, select by candidate count: zero valid → `bootstrap_required`; one → `resolved`; multiple → `conflict`, unless `resolveMultipleCandidatesSilently=true` and precedence ranks every valid candidate, then select the first configured valid rank and report precedence. Never select by filesystem iteration order. Return an unresolved multi-candidate conflict before reading candidate-specific work-item patterns.
5. After a unique or precedence-based selection, resolve only that adapter's optional `config.json`. Validate `work_item_id_pattern` as an anchored <=128-character safe token regex using allowlisted ASCII literal/character-class atoms, no groups, alternation, dot wildcard, backreferences, lookarounds or nested quantifiers, disjoint character sets between adjacent variable quantifiers; when a required literal separates them, it must be outside both neighboring quantified character sets, and numeric bounds <=64. Cap IDs at 64 characters. Construct `RegExp` only after validation; an invalid selected pattern returns `invalid` with no writes. No adapter pattern is read for `bootstrap_required`.
6. Run optional integration observers after selection. Collect warnings/protected paths only; their return values cannot change selected adapter or trigger writes.
7. Build preview by comparing packaged source paths with the selected/bootstrap target. Check every path component and protected overlap. Existing valid context produces an empty write set. On no valid context, classify each target as create/merge/skip/conflict/protected and include the ownership manifest action.
8. Before each write, atomically persist a pending ownership entry in `.csd-bootstrap.json`, recheck the path chain, write atomically, then mark complete. On retry, validate owner/hash/status: recreate an absent pending target and mark complete; if a pending target already matches its expected hash, mark complete without rewriting; reject a mismatching pending target; skip a matching complete target. Stop before any batch write if an unowned collision, malformed ownership record, edited owned file, symlink or protected target exists.
9. CLI applies only after typed interactive `yes` or `--yes`; `--dry-run` always stops after preview. MCP apply requires unchanged root/config/plan token and `confirmed: true`. No automatic migration or onboarding execution.
10. Module discovery inspects only configured bounded Markdown roots. Existing files are reported and preserved; missing structure produces a read-only generic scaffold preview. Apply or decline writes only after explicit confirmation; decline is persisted under the selected layout and suppresses future prompts.
11. `csd update` compares installed lock hashes and refuses modified harness files by default. `csd update --context` compares `.csd-bootstrap.json` ownership hashes, updates only unchanged CSD-owned files, creates new packaged files, and preserves or reports local/unknown changes. `--force` never bypasses protected paths or symlink safety.

## Normalized paths and workflows

- Native `.context/`: resolve index and optional layout fields from `.context`; workflow prefers `workflow.md`, then existing `workflows/core.md`; validator may be repository-root `scripts/validate_context.py`.
- `.ai/`: exact compatibility mapping from the request: README index, workflow document, context-routing, tasks as work, tasks/templates, scripts; onboarding may use workflow and prompts-base sources.
- `.agents/`, `docs/context/`, `context/`: use deterministic adapter-specific fallback paths listed in `spec.md`; missing expected components remain reported, not fabricated.
- `inspectRepository`, work-item ID config is read only from the adapter-resolved `config.json` and validated before regex compilation; work-item listing/read, artifact writes, context collection and validator lookup resolve the selected adapter first and use its fields. Native `.context/` remains byte/path compatible.

## Subtasks and waves

Planning context loaded for this work: core, project, testing, architecture, and security. The table uses none in the optional domain column because the validator checks it against mutable fixture catalogs.

| Subtask ID | Owner | Dependencies | Acceptance evidence | Wave | Context domains |
| --- | --- | --- | --- | --- | --- |
| FEAT-9015-A | Codex | none | Config validation plus five marker adapters, invalid markers, deterministic results, configured precedence and conflicts (criteria 1,3-11) | 1 | none |
| FEAT-9015-B | Codex | FEAT-9015-A | Read-only preview; confirmation; manifest ownership; no-op, partial retry, edited/unowned conflict and protected paths (2,12-14,19-24) | 2 | none |
| FEAT-9015-C | Codex | FEAT-9015-A | Normalized MCP/CLI path resolution including .agents fallback routing; .ai mapping; onboarding state; protected writes; no-framework and optional observer behavior; existing APIs retained (15-18,23-29) | 3 | none |
| FEAT-9015-D | Codex | FEAT-9015-B, FEAT-9015-C | Docs and examples cover layouts, config, markers, integration, ownership, confirmation and no-migration | 4 | none |
| FEAT-9015-E | Codex | FEAT-9015-A,FEAT-9015-B,FEAT-9015-C,FEAT-9015-D | All requested command evidence, diff review and unresolved issues in verification/review | 5 | none |

Wave integration owner: Codex. Subtasks run sequentially because they change shared adapter and repository contracts; no parallel file edits.

## Test plan

- MCP selected-layout fallback routing and reference paths; configured protected paths reject artifact-style writes.
- Custom registered adapter: marker selection, normalized paths, bootstrap target mapping, confirmed materialization, and no second .context tree.
- 1-10: empty, each valid adapter, each invalid/no-marker candidate, multiple conflict, explicit precedence, malformed/configured markers, unsafe symlink candidates and safe/unsafe ID pattern configs, including a separator that overlaps adjacent quantified character sets.
- 11: deep equality of repeated discovery, including candidates and paths.
- 12-14: apply twice, simulate pending manifest/partial failure, user edit and unknown non-empty collision; confirm no overwrite.
- 15-18: all `.ai` paths; missing optional onboarding; native placeholder state; completion marker prevents automatic rerun.
- 19: preview exact action list and dry-run snapshot unchanged.
- 20-22: migration flags false, destructive operations absent/gated, no symlink creation and symlink inputs invalid.
- 23-24: configured/default dependency/generated protected paths remain byte-identical; malformed ID regex cannot stall matching; separator-overlap patterns such as `^[ab]*a[ab]*z$` are rejected.
- 25-28: generic unknown-framework repo, observer warnings, observer cannot change adapter, external tooling files unchanged.
- 29-30: old installer/bootstrap signatures and CLI/MCP native contracts; full package suite.
- Commands: `node --test tests/node/context-discovery.test.mjs`; `npm test`; `npm run check`; `python3 -m unittest discover -s tests`; `python3 scripts/validate_context.py --strict --examples`. No separate lint command; `npm run build` includes `tsc`.

## Risks and rollback

- Risk: Broad path indirection can regress public `.context/` behavior; bootstrap can damage user files if ownership or path checks are weak.
- Mitigation: adapter-only path mapping, strict bounded config, marker evidence, precomputed conflict scan, per-path ownership hashes, symlink/protected-path rejection, explicit CLI/MCP gates and native regression tests.
- Rollback: revert code/docs changes. No migration occurs and no existing valid layout is modified. Files created after confirmed bootstrap are inventoried; this feature does not delete them automatically.

## Required approvals

- User supplied implementation scope; user confirmation is required by CLI/MCP before bootstrap materialization, overwrite or merge.
- No production/release action is included.
