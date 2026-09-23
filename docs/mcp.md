# CSD MCP Adapter

The MCP adapter lets any Model Context Protocol client — ChatGPT, Claude, Codex, OpenCode, Gemini, custom hosts — drive the CSD workflow over a local repository through a stdio transport.

**MCP is an interface to the CSD protocol, not an alternative workflow.** The selected context adapter remains the source of truth. Work items and artifacts use that layout's normalized work root, while classification, routing, interaction and workflow decisions remain governed by its Markdown contracts interpreted by the agent. The server adds no domain logic: it provides discovery, canonical context, persistence, validation and state retrieval only.

## Architecture

```text
ChatGPT
   │
   │ MCP (stdio)
   ▼
CSD MCP Server  (src/mcp/, transport + access boundary only)
   │
   ▼
repository filesystem
   │
    ├── AGENTS.md
    ├── selected context index
    ├── selected context/*  canonical protocol (read)
    └── selected work root/
          └── FEAT-1234     durable state (read/write, allowlisted)
                ▲
                │
             Codex ($csd), Claude (/csd), any adapter
```

The agent owns reasoning and the conversation with the human. Because all state lives in the repository, a task started in one client continues in another with no reconstruction: the next agent's front door (`AGENTS.md` → selected context index → the work item) reads exactly what MCP wrote.

## Installation

`csd mcp` ships inside the main package — no extra binary or package:

```bash
npm install -g @owlcodium/context-spec-develop
```

## Running the server

```bash
# pinned to one repository (recommended for desktop integrations)
csd mcp --root /home/user/project

# unpinned: every tool call must carry an absolute "root"
csd mcp
```

When `--root` is supplied the server refuses any tool call naming a different root (`ROOT_MISMATCH`). Without it, calls missing an absolute `root` fail with `ROOT_REQUIRED`.

## Client configuration (stdio)

```json
{
  "mcpServers": {
    "csd": {
      "command": "csd",
      "args": ["mcp", "--root", "/absolute/path/to/repository"]
    }
  }
}
```

## Tools

| Tool | Writes | Purpose |
| --- | --- | --- |
| `csd_inspect` | no | Repository status: AGENTS.md, detected context layout, installation health, whether bootstrap/onboarding is needed, work items |
| `csd_context` | no | Canonical bootstrap (front door, classification, interaction, routing catalog) + references + open work items; optionally reads up to 20 explicit paths under the selected context root |
| `csd_work_item` | no | Durable state of one work item (`id`) or all work items; never invents missing state |
| `csd_write_artifact` | yes | Persists one allowlisted artifact inside the selected adapter's work-item root |
| `csd_validate` | no | Runs the canonical validator (`scripts/validate_context.py`) and returns a structured result; reports an error when validation could not run |
| `csd_bootstrap_preview` | no | Previews exactly what bootstrap would create/merge and returns a gate token |
| `csd_bootstrap_apply` | yes | Materializes the configured layout, requiring the exact current preview token and confirmed: true |

### What the agent still owns

`csd_context` deliberately does not compute routing or classify requests: it returns the canonical bootstrap and pointers, and the agent classifies, routes and asks the human per `.context/classification/`, `.context/context-routing/` and `.context/interaction/`. There are no `csd_start`/`csd_answer`-style conversation tools — the conversation belongs to the client's agent.

## Security model

- Absolute repository roots only; relative roots are rejected.
- Discovery and context operations inspect every path component with lstat and reject symlinks, including symlinks that point back inside the repository.
- `../` traversal cannot leave the repository root.
- Artifact writes are limited to the selected work root and <id>/<artifact> where `<artifact>` is a closed allowlist (`work-item.json`, `spec.md`, `plan.md`, `progress.md`, `preflight.md`, `verification.md`, `review.md`, `release.md`, `discovery.md`, `triage.md`, `reproduction.md`, `postmortem.md`, `outcome.md`, `handoff.md`).
- Writes are atomic (temporary file + rename); no partial artifacts.
- `work-item.json` content is structurally validated (required fields, enums, track/type conditionals) before persistence; malformed state is flagged, never repaired or invented.
- No shell execution, no terminal-equivalent or generic filesystem tools. The only subprocess is the fixed-argv validator invocation.
- Errors are structured: `{ code, message, details? }` with stable codes (`REPOSITORY_NOT_FOUND`, `NOT_A_CSD_REPOSITORY`, `ROOT_REQUIRED`, `ROOT_MISMATCH`, `PATH_ESCAPE`, `WORK_ITEM_NOT_FOUND`, `WORK_ITEM_INVALID`, `ARTIFACT_NOT_ALLOWED`, `CONTENT_INVALID`, `BOOTSTRAP_GATE`, `VALIDATION_NOT_RUN`, `VALIDATION_FAILED`).

## Bootstrap gate

The bootstrap contract (inspect → preview → explicit approval → materialize) holds over MCP: `csd_bootstrap_apply` fails with `BOOTSTRAP_GATE` unless it receives the token returned by `csd_bootstrap_preview` for the *current* repository state. Any change between preview and apply invalidates the token, and no single call can materialize anything silently.

## Interaction with `.context/work`

Durable state is never held by the server. A ChatGPT session can create a work item (`csd_write_artifact` with `work-item.json`), record specification, plan, progress and verification evidence artifact by artifact, and then disappear; the next session — ChatGPT or any other adapter — resumes from the filesystem. When validation matters, `csd_validate` returns the same structured verdicts the canonical validator produces (`ok`, `errors`, `warnings`).

## Cross-agent handoff

```text
1. ChatGPT connects to the CSD MCP server.
2. ChatGPT calls csd_inspect, then csd_context: it receives the canonical
   bootstrap, references and open work items.
    3. The agent classifies the request and asks the user what the selected
       context/
   interaction contract requires — the human conversation stays in the client.
4. Decisions are persisted: csd_write_artifact with work-item.json, spec.md,
   plan.md, progress.md, …
5. The ChatGPT session ends. No state was held by the server.
    6. Codex opens the same repository and runs $csd; the canonical front door
       reads AGENTS.md, the selected context index and its work root and continues
   without reconstructing any decision already recorded.
```

This scenario is covered by an automated test in `tests/node/mcp-server.test.mjs` (work item created over MCP, then read with plain filesystem reads, no MCP involved).

## Layout selection and bootstrap gate

CSD supports .context/, .ai/, .agents/, docs/context/, and context/. csd_inspect returns the discovery status, marker evidence and normalized paths. csd_context, work-item operations and artifact writes route through those paths.

Bootstrap preview is read-only and includes create, merge, skip, conflict, protected-path and ownership-manifest actions. The apply token binds the repository state and file plan. MCP callers must pass confirmed: true; see context-discovery.md for marker rules, configuration and CLI confirmation.

MCP does not expose module scaffold or package update as tools. Agents may use the CLI commands `csd modules` and `csd update` after the normal human confirmation flow; MCP remains limited to repository context and work-item access.
