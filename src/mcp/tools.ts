import { z } from 'zod'
import { PathEscapeError } from '../fs.js'
import { CsdToolError } from './errors.js'
import {
  bootstrapApply,
  bootstrapPreview,
  collectContext,
  inspectRepository,
  listWorkItems,
  readWorkItem,
  resolveRoot,
  runValidation,
  writeArtifact,
} from './repository.js'

export interface ToolContext {
  pinnedRoot?: string
}

const rootSchema = z.string().describe('Absolute path to the repository root')

export const toolSchemas = {
  csd_inspect: {
    title: 'Inspect CSD repository',
    description: 'Inspect a repository for CSD readiness: AGENTS.md, .context/, installation health, whether bootstrap or onboarding is needed, and existing work items. Read-only.',
    inputSchema: { root: rootSchema.optional() },
  },
  csd_context: {
    title: 'Load canonical CSD context',
    description: 'Return the canonical CSD bootstrap (front door, classification, interaction, routing catalog) plus references and open work items. Classification and routing remain the agent\'s job per the .context/ contracts. Optionally read up to 20 explicit paths under .context/. Read-only.',
    inputSchema: {
      root: rootSchema.optional(),
      request: z.string().max(4000).optional().describe('The user request this context is for (recorded in the response, not interpreted)'),
      paths: z.array(z.string().max(512)).max(20).optional().describe('Explicit additional paths to read, relative to .context/'),
    },
  },
  csd_work_item: {
    title: 'Read CSD work item',
    description: 'Return the durable state of one work item (metadata, artifacts) or, without an id, all work items. Never invents missing state. Read-only.',
    inputSchema: {
      root: rootSchema.optional(),
      id: z.string().max(64).optional().describe('Work item id (e.g. FEAT-1234); omit to list work items'),
    },
  },
  csd_write_artifact: {
    title: 'Persist CSD work item artifact',
    description: 'Persist one allowlisted artifact (e.g. spec.md, plan.md, progress.md, verification.md, work-item.json) inside .context/work/<workItem>/. Writes outside the work item are impossible; work-item.json content is structurally validated.',
    inputSchema: {
      root: rootSchema.optional(),
      workItem: z.string().min(1).max(64).describe('Work item id (e.g. FEAT-1234)'),
      artifact: z.string().min(1).max(128).describe('Allowlisted artifact file name (e.g. spec.md or work-item.json)'),
      content: z.string().min(1).max(524288).describe('Full file content to persist'),
    },
  },
  csd_validate: {
    title: 'Run CSD validator',
    description: 'Run the canonical CSD validator (scripts/validate_context.py) against the repository and return a structured result. Reports an error when validation could not run; never claims success without running.',
    inputSchema: {
      root: rootSchema.optional(),
      strict: z.boolean().optional().describe('Fail on unresolved placeholders (default true)'),
    },
  },
  csd_bootstrap_preview: {
    title: 'Preview CSD bootstrap',
    description: 'Preview exactly what CSD bootstrap would create or merge in a repository, without writing anything. Returns a token required by csd_bootstrap_apply. Read-only.',
    inputSchema: { root: rootSchema.optional() },
  },
  csd_bootstrap_apply: {
    title: 'Apply CSD bootstrap',
    description: 'Materialize the CSD canonical context in a repository. Requires the exact token returned by csd_bootstrap_preview for the current repository state; a silent one-call bootstrap is intentionally impossible.',
    inputSchema: {
      root: rootSchema.optional(),
      token: z.string().min(16).max(128).describe('Token returned by csd_bootstrap_preview'),
    },
  },
} as const

export type ToolName = keyof typeof toolSchemas

export type ToolResult = {
  content: { type: 'text'; text: string }[]
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

function payload(result: unknown): ToolResult {
  const text = JSON.stringify(result, null, 2)
  return { content: [{ type: 'text', text }], structuredContent: result as Record<string, unknown> }
}

function failure(error: unknown): ToolResult {
  const body = error instanceof CsdToolError
    ? error.toJSON()
    : error instanceof PathEscapeError
      ? { code: 'PATH_ESCAPE', message: error.message }
      : { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : String(error) }
  return { content: [{ type: 'text', text: JSON.stringify(body, null, 2) }], structuredContent: body, isError: true }
}

export async function dispatchTool(name: ToolName, args: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  try {
    return payload(await handleTool(name, args, context))
  } catch (error) {
    return failure(error)
  }
}

async function handleTool(name: ToolName, args: Record<string, unknown>, context: ToolContext): Promise<unknown> {
  const root = resolveRoot(typeof args['root'] === 'string' ? args['root'] as string : undefined, context.pinnedRoot)
  switch (name) {
    case 'csd_inspect':
      return inspectRepository(root)
    case 'csd_context':
      return collectContext(
        root,
        typeof args['request'] === 'string' ? args['request'] as string : undefined,
        Array.isArray(args['paths']) ? args['paths'] as string[] : undefined,
      )
    case 'csd_work_item': {
      const id = typeof args['id'] === 'string' ? (args['id'] as string).trim() : ''
      if (id === '') {
        return { root, workItems: await listWorkItems(root) }
      }
      return readWorkItem(root, id)
    }
    case 'csd_write_artifact':
      return writeArtifact(
        root,
        String(args['workItem'] ?? ''),
        String(args['artifact'] ?? ''),
        String(args['content'] ?? ''),
      )
    case 'csd_validate':
      return runValidation(root, args['strict'] !== false)
    case 'csd_bootstrap_preview':
      return bootstrapPreview(root)
    case 'csd_bootstrap_apply':
      return bootstrapApply(root, String(args['token'] ?? ''))
  }
}
