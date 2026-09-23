# Specification — FEAT-9015 Make CSD context discovery idempotent and framework-agnostic

## Request

- Source: User-provided task attachment, “Make CSD Idempotent and Framework-Agnostic”.
- Requester: hiyan (inferred from repository task-owner convention; no display name provided).
- Date: 2026-09-23.

## Objective

Discover and validate repository context before bootstrap, then continue through a normalized adapter using any valid existing layout. Materialize the configured canonical layout only when no valid candidate exists and the user confirms the preview. Never migrate or overwrite user content implicitly.

## Scope

- Support explicit adapters for `.context/`, `.ai/`, `.agents/`, `docs/context/`, and `context/`; allow additional adapters through the same code-level adapter contract.
- Resolve all configured candidates, validate explicit marker rules, and return deterministic machine-readable results.
- Route bootstrap, MCP inspection/context/work-item/artifact paths through normalized adapter output.
- Preview exact creates/modifications/skips/conflicts and protected paths; require explicit apply confirmation for materialization or modification.
- Track CSD-owned files; support partial retry without overwriting user-edited, dependency, generated, or unknown files.
- Keep onboarding layout-aware and migration opt-in; keep framework/tool integrations optional observers.
- During onboarding, inspect configured module-documentation roots. Preserve existing `.context`/`.ai` structures, ask once before creating a generic framework-neutral scaffold when none exists, and persist an explicit decline.
- Provide a separate `csd update` path for installed harness files and `csd update --context` for the owned context snapshot; never overwrite local changes without explicit force.
- Preserve existing APIs and commands as callable entry points, and preserve native `.context/` behavior for valid native repositories.

## Supported layouts and default markers

Marker paths are relative to the candidate root. A file marker must be a regular file; a directory marker must be a directory. A symlink in a candidate or marker path invalidates that candidate for safe access.

| Layout | Required marker rule | Default normalized paths |
| --- | --- | --- |
| `.context/` | `INDEX.md` AND at least one of `workflow.md`, `context-routing/`, `work/` | index `INDEX.md`; workflow `workflow.md` if present, else `workflows/core.md`; routing `context-routing/` (fallback `routing/`); work `work/`; templates `templates/`; scripts `scripts/` (fallback repository `scripts/validate_context.py`); onboarding `prompts/initialize-project.md` when present |
| `.ai/` | `README.md` AND at least one of `workflow.md`, `context-routing/`, `tasks/` | index `README.md`; workflow `workflow.md`; routing `context-routing/`; work `tasks/`; templates `tasks/templates/`; scripts `scripts/`; onboarding optional; workflow onboarding sources may include `workflow.md` and `prompts-base.md`; config `config.json` |
| `.agents/` | at least one of `INDEX.md`, `context/`, `context.json` (or configured adapter marker) | root `.agents/`; prefer existing `INDEX.md`, then `context/INDEX.md`, then `context.json`; workflow `workflow.md` (fallback `context/workflow.md`); routing `context-routing/` (fallback `context/context-routing/`); work `work/` (fallback `tasks/`, then `context/work/`); templates `templates/` (fallback under work); scripts `scripts/`; onboarding optional; config `config.json` |
| `docs/context/` | `INDEX.md` AND at least one of `workflow.md`, `routing/`, `context-routing/`, `work/` | index `INDEX.md`; workflow `workflow.md`; routing `routing/` (fallback `context-routing/`); work `work/`; templates `templates/`; scripts `scripts/`; onboarding optional; config `config.json` |
| `context/` | `INDEX.md` or `README.md` AND at least one of `workflow.md`, `routing/`, `context-routing/`, `work/` | index `INDEX.md` if present, else `README.md`; workflow `workflow.md`; routing `routing/` (fallback `context-routing/`); work `work/`; templates `templates/`; scripts `scripts/`; onboarding optional; config `config.json` |

When optional expected components are absent, the adapter still resolves deterministic expected paths and reports logical component names in `missing`. `.agents/` may not validate merely because CSD installation creates `.agents/skills/`.

## Discovery and configuration contract

- Optional settings live in repository-root `csd.config.json`, so they can be read before any context tree exists. Missing config uses defaults.
- Root `csd.config.json` is limited to 64 KiB and a strict JSON object. Malformed JSON, unknown enum/layout values, unsafe paths or invalid field types return `status: invalid`; discovery does not fall back to defaults and performs no writes.
- Configured marker paths are non-empty, repository-relative paths under their adapter root; reject absolute paths, `.`/`..` components, drive/URL syntax, wildcards, control characters, symlink traversal, and paths over 512 characters. `markerRules` uses `allOf` plus `anyOf` groups; an adapter must satisfy every `allOf` marker and at least one marker in each `anyOf` group.
- Work-item ID patterns are loaded only after one context adapter is selected (a unique candidate, or an explicitly precedence-selected candidate). Read only that adapter’s resolved `config.json`; if `work_item_id_pattern` exists it must be a string <=128 characters, anchored with `^` and `$`, and use only safe ASCII literals or allowlisted character classes with `+`, `*`, `?` or numeric `{m,n}` quantifiers capped at 64. Reject groups, alternation, dot wildcard, backreferences, lookarounds, nested quantifiers, and adjacent variable quantifiers with overlapping character sets; if a required literal separates them, that literal must be outside both neighboring quantified character sets. IDs are capped at 64 characters. Validate before constructing `RegExp`; an invalid selected-adapter pattern returns `invalid` and performs no writes. A multi-candidate conflict without precedence is returned before reading any candidate’s work-item pattern; `bootstrap_required` likewise does not read an adapter pattern because no adapter was selected.
- Configuration covers `enabledAdapters`, `adapterPrecedence`, `resolveMultipleCandidatesSilently`, `markerRules`, `canonicalLayout`, `protectedPaths`, `optionalFrameworkIntegrations`, `onboardingPolicy`, `migrationPolicy`, `dryRun`, and optional `moduleContext` settings (`enabled`, `decision`, `prompt_policy`, `search_roots`).
- Safe defaults: all built-in adapters enabled; precedence order `.context`, `.ai`, `.agents`, `docs/context`, `context`; `resolveMultipleCandidatesSilently=false`; canonical layout `.context`; automatic migration/overwrite/delete/rename/symlink/onboarding disabled; dry-run enabled. `protectedPaths` defaults to `.git`, `node_modules`, `vendor`, `dist`, `build`, `coverage`, `generated`, `registry`, and `catalog`.
- Protected paths and marker paths are repository-relative and validated as above. No globbing, dynamic module imports, shell commands or framework detection are allowed from config.
- Invalid root config or any unsafe candidate/path-chain finding takes precedence and returns `invalid`, even if another candidate is valid; an unsafe repository is never bootstrap-eligible. Otherwise, no valid candidates returns `bootstrap_required`, including directories that fail marker rules. One valid candidate selects that adapter; multiple valid candidates return `conflict` with all candidates unless precedence resolution is explicitly enabled and every valid candidate has a configured rank, then the first ranked candidate is selected and `precedence_applied=true`. Only after a unique/precedence selection is made is that adapter’s work-item pattern validated; an invalid selected pattern changes the result to `invalid`. A conflict with no selection and a bootstrap-required result do not inspect adapter-specific ID patterns.
- Candidates are ordered by stable layout ID/path and marker evidence; output paths always use `/` separators and contain no machine-specific absolute repository path.
- The normalized result includes status, layout/mode, context root, index/workflow/routing/work/templates/scripts/onboarding/validator paths, capabilities, marker evidence, all candidates, selected candidate, missing components, conflicts, protected paths, created/modified preview lists, `migration_required`, and `onboarding_required`.

## Bootstrap, ownership and confirmation

- Discovery and preview are read-only. A valid selected context makes bootstrap return a resolved no-op, regardless of missing optional components; it must not create `.context/`, copy files, rerun onboarding, add symlinks, or migrate.
- A preview enumerates each source target and its exact action (`create`, `merge`, `skip`, `conflict`, `protected`), plus ownership metadata, marker evidence and resulting conflicts. No files are created by preview.
- CLI default: show the preview; in an interactive terminal require an affirmative typed response, and in non-interactive mode require `--yes` after an agent/user confirmation or remain a no-op. `--dry-run` always prevents writes. MCP preview token binds repository real root, validated config, adapter candidates and file plan; apply requires that token plus `confirmed: true`, and recalculates the preview before writing.
- The direct `bootstrap(root, force?)` API remains callable for compatibility and represents an explicit materialization invocation; callers requiring a user gate must first preview and obtain approval. The existing repository `bootstrapApply(root, token)` call remains source-compatible for direct API callers; the MCP tool itself requires the explicit `confirmed: true` field. `force` never bypasses dependency/generated protection or symlink/path checks.
- Bootstrap-owned metadata is `.csd-bootstrap.json`, with schema version, owner identifier, and per-path ownership/hash/status. The manifest identifies itself with reserved metadata. Before each create/merge, record a pending owned path/hash atomically; after writing, mark complete. On retry, a pending entry with an absent target is recreated from the same packaged content and marked complete; a pending entry whose target hash already matches is marked complete without rewriting; a pending entry with a mismatching hash is a conflict. Complete entries are skipped only while their managed content still matches. A hash mismatch, malformed manifest or unowned non-empty collision is reported and never overwritten by default.
- Existing identical unowned files are skipped without being claimed. New files are created only when absent. Existing CSD-owned files are not rewritten unless unchanged and explicitly authorized. Existing `AGENTS.md` is never replaced: preview reports a managed-marker merge; apply inserts one well-formed `<!-- CSD:BEGIN -->`/`<!-- CSD:END -->` block while preserving outside bytes. Duplicate, partial or modified managed blocks conflict; outside text changes do not invalidate an unchanged managed block.
- Every existing path component from the resolved repository root to a candidate, target, marker, protected file or manifest is checked with `lstat`; symlinks (including internal symlinks) are rejected for discovery writes/reads. Writes use repository-contained atomic writes and recheck path components before each operation. Bootstrap never deletes, renames, moves or creates symlinks.
- A target overlapping a default or configured protected path is listed as protected and is never modified. Dependency/generated paths remain protected even with `--force`.
- No migration implementation runs automatically. Existing compatibility layouts report `migration_required=false`; any future migration action must be separately requested, previewed and explicitly confirmed.

## Onboarding and optional integrations

- Native onboarding points to `.context/prompts/initialize-project.md` when present. It is recommended only when project context is mostly placeholder and no completion marker exists. Completion is detected from explicit `.context/.onboarding-complete` or `config.onboarding.completed=true`, then from a conservative overview/config/stack completeness heuristic; unknown fields alone do not trigger reruns.
- Compatibility onboarding is optional. Missing prompt capability is reported; it never creates native `.context/` or forces migration.
- `FrameworkIntegration` is an observer supplied/registered by code, never dynamically loaded from config. It may report detection, protected paths, compatibility warnings, validation results and onboarding hints. It cannot select/replace adapters, write files or alter layout. Core discovery succeeds without integrations; integration errors become warnings.
- Module discovery returns bounded roots, existing index/module files, scaffold target, prompt state and the selected-layout decision record. It only reads Markdown metadata and never invents module boundaries.

## Out of scope

- Implicit migration, copying, rename, delete, symlink creation, framework-specific discovery, dependency installation, package alias changes, or edits to external tool paths.
- A runtime framework integration; the core exposes only an optional observer contract.
- Automatic migration or mirroring between `.context` and `.ai`; module-specific documentation generation.

## Evidence and context

- Repository evidence: `src/installer.ts` materializes only `.context/`; `src/mcp/repository.ts` directly accesses `.context/` for readiness, context, work items and artifacts; current tests use native layout.
- Product evidence: the user supplied the requested use cases and 30 acceptance criteria; no adoption metrics were supplied.
- Relevant context: `.context/project/{architecture,stack,testing,quality,security}.md` and the canonical security/testing/interaction policies.
- Unknowns (`NOT FOUND`): Adoption frequency, owner for independent production decisions, standalone lint/typecheck commands, and any external framework integration package.

## Tests and acceptance criteria

The numbered requirements in the user request map to tests as follows: 1-10 marker/status/precedence discovery; 11 deterministic repeated discovery; 12-14 bootstrap no-op/retry/conflict ownership; 15-18 compatibility paths and onboarding; 19 exact preview; 20-22 migration/delete/rename/symlink defaults; 23-24 protected dependency/generated paths; 25-28 generic mode and optional integration/external tooling behavior; 29 CLI/API/MCP backward compatibility; 30 all existing package tests; 31-34 module-root discovery, existing `.ai` preservation, generic scaffold preview/apply, persistent decline and package/context update conflict handling. Verification records actual commands, environment, files changed, risks and unresolved issues.

## Open decisions

- No blocking scope decision remains. Root config is optional `csd.config.json`; defaults are recorded above.
