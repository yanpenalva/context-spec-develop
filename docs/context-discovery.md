# Context discovery and compatibility layouts

CSD first inspects the repository, then routes context reads and work-item operations through one normalized adapter. Discovery is read-only. A valid layout is selected without creating or migrating another layout.

## Supported layouts

| Layout | Default validity markers | Normalized work root |
| --- | --- | --- |
| .context/ | INDEX.md and one of workflow.md, context-routing/, or work/ | work/ |
| .ai/ | README.md and one of workflow.md, context-routing/, or tasks/ | tasks/ |
| .agents/ | INDEX.md, context/, or context.json | work/, then supported fallbacks |
| docs/context/ | INDEX.md and one of workflow.md, routing/, context-routing/, or work/ | work/ |
| context/ | INDEX.md or README.md, and one workflow, routing, or work marker | work/ |

The .agents/skills/ directory alone does not make .agents/ a CSD context layout. For .ai/, CSD maps the index to README.md, templates to tasks/templates/, and workflow or prompts-base.md files to onboarding sources when present.

Run discovery without changing files:

    csd discover --root /absolute/path/to/repository

Discovery returns resolved, bootstrap_required, conflict, or invalid, with marker evidence, candidate layouts, normalized paths, missing capabilities and protected paths. Paths in the discovery result are repository-relative and use / separators. Multiple valid layouts remain a conflict unless the repository explicitly enables precedence resolution.

## Adding a context adapter

Core layouts and code-registered layouts share the exported `ContextAdapter` contract from `dist/context.js`. An adapter provides a stable `id`, repository-relative `root`, `mode`, explicit `markerRules`, a `resolve(repositoryRoot)` function returning normalized paths and missing components, plus `mapBootstrapPath(sourcePath)` and `transformTemplate(content)` for confirmed bootstrap. Context paths must stay under the adapter root; a validator may live at a repository-level tooling path. Registration rejects duplicate IDs, unsafe roots and unsafe marker paths.

Register code before calling discovery or bootstrap, then list its ID in `enabledAdapters` and set `canonicalLayout` to that ID only if it should be the bootstrap target. The registration function returns an unregister callback. Configuration never imports adapter code. Applications that need an adapter in a CLI or MCP process must register it in that process's startup code; the stock CLI and server include the five built-in adapters.

A minimal adapter has this shape:

    import { registerContextAdapter } from '@owlcodium/context-spec-develop/dist/context.js'

    const unregister = registerContextAdapter({
      id: 'team-context',
      root: 'docs/team-context',
      mode: 'compatibility',
      markerRules: { allOf: ['README.md'], anyOf: [['workflow.md']] },
      async resolve(root) {
        return {
          paths: {
            root: 'docs/team-context',
            index: 'docs/team-context/README.md',
            workflow: 'docs/team-context/workflow.md',
            routing: 'docs/team-context/routing',
            work: 'docs/team-context/work',
            templates: 'docs/team-context/templates',
            scripts: 'docs/team-context/scripts',
            onboarding: undefined,
            onboardingSources: ['docs/team-context/workflow.md'],
            config: 'docs/team-context/config.json',
            validator: 'scripts/validate_context.py'
          },
          missing: ['routing', 'work', 'templates', 'scripts']
        }
      },
      mapBootstrapPath(path) { return 'docs/team-context/' + path },
      transformTemplate(content) { return content.replaceAll('.context', 'docs/team-context') }
    })

Keep marker detection and path resolution in the adapter. Add tests for marker failures, normalized path routing, bootstrap mapping, idempotence and path safety before enabling a new adapter by default.

## Optional repository configuration

csd.config.json is read before an adapter is selected. If absent, all built-in adapters are enabled and .context/ is the canonical layout used only when bootstrapping an uninitialized repository.

    {
      "contextDiscovery": {
        "enabledAdapters": [".context", ".ai", ".agents", "docs/context", "context"],
        "adapterPrecedence": [".context", ".ai", ".agents", "docs/context", "context"],
        "resolveMultipleCandidatesSilently": false,
        "canonicalLayout": ".context",
        "markerRules": {
          ".context": {
            "allOf": ["INDEX.md"],
            "anyOf": [["workflow.md", "context-routing/", "work/"]]
          }
        },
        "protectedPaths": [".git", "node_modules", "vendor", "dist", "build", "coverage", "generated", "registry", "catalog"],
        "optionalFrameworkIntegrations": [],
        "onboardingPolicy": "placeholder-only",
        "migrationPolicy": "explicit-only",
         "dryRun": true,
         "moduleContext": {
           "enabled": true,
           "decision": "pending",
           "prompt_policy": "once",
           "search_roots": [".context/project/modules", ".ai/modules"]
         }
      }
    }

Marker paths and protected paths are repository-relative and validated. Absolute paths, traversal, wildcard syntax and symlink traversal are rejected. Root configuration is strict JSON, limited to 64 KiB, and an invalid value blocks discovery without falling back to defaults. Work-item ID patterns stay in the selected adapter's config.json; CSD validates the bounded pattern before using it.

## Optional module documentation

On first onboarding, CSD inspects only the configured module-context roots. It recognizes Markdown indexes, templates and module files, including compatible `.ai/modules/` documentation. Existing documentation is reported and preserved; `.ai/` is not copied into `.context/` and `.context/` is not mirrored into `.ai/`.

When no module structure is found, use the read-only inspection command:

    csd modules --root /absolute/path/to/repository --preview

Apply the generic scaffold only after review:

    csd modules --root /absolute/path/to/repository --yes

The scaffold creates a framework-neutral `README.md`, `_module-template.md` and a decision record in the selected context layout. It does not create module-specific documents or infer boundaries. To permanently decline the prompt without creating files, use `--decline`; the decision is stored as `<selected-layout>/.csd-module-context.json`.

## Bootstrap and ownership

The CLI displays a read-only preview by default. In an interactive terminal, type yes to apply it. For a reviewed non-interactive invocation, use csd bootstrap --root <path> --yes. The --dry-run option always keeps the operation read-only.

MCP clients call csd_bootstrap_preview, review the file actions, and then call csd_bootstrap_apply with the returned token and confirmed: true. Apply recalculates the preview and rejects a stale token.

A valid existing context layout makes bootstrap a no-op. When no layout is valid, bootstrap targets only the configured canonical layout. It does not migrate, rename, delete or symlink existing context. CSD records owned files in .csd-bootstrap.json; matching pending writes are completed on retry, while changed or unowned collisions are surfaced as conflicts. Identical unowned files are skipped without being claimed. Existing AGENTS.md text is preserved around one managed CSD marker block.

## MCP routing

csd_inspect, csd_context, work-item reads and writes, and artifact writes use the selected layout's normalized paths. Tool names remain stable across layouts. Framework integrations are registered in code as observers; repository configuration never loads modules or commands.

## Updating an installed project

`csd update` updates installed harness skill/command files from the package version recorded in the lockfile. It refuses locally modified files unless `--force` is explicitly supplied:

    csd update --scope project --root /absolute/path/to/repository

The project context snapshot is updated separately, so local `.context/project/`, module documentation and work items are not overwritten accidentally:

    csd update --scope project --root /absolute/path/to/repository --context --dry-run
    csd update --scope project --root /absolute/path/to/repository --context --yes

`--context` requires a uniquely selected layout and uses `.csd-bootstrap.json` ownership hashes. New packaged protocol files are created; unchanged CSD-owned protocol files are updated; project-owned files under `project/`, module roots and the work root are protected and skipped. `config.json` receives only a controlled `kit_version` merge, preserving project facts. Locally edited or unknown protocol files become conflicts. `--force` never bypasses protected paths or symlink checks. The update does not delete, rename, migrate or create a second context layout.
