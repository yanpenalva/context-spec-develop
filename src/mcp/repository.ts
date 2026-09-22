import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { absoluteRoot, atomicWriteInside, exists, listFiles, readInside, readJson, realInside, sha256 } from '../fs.js'
import { bootstrap, PACKAGE_VERSION, templateRoot } from '../installer.js'
import { CsdToolError, Codes, repositoryNotFound } from './errors.js'

/** Artifacts a client may persist inside `.context/work/<id>/`. Closed allowlist. */
export const ARTIFACT_ALLOWLIST = Object.freeze([
  'work-item.json',
  'discovery.md',
  'triage.md',
  'reproduction.md',
  'spec.md',
  'plan.md',
  'preflight.md',
  'progress.md',
  'verification.md',
  'review.md',
  'release.md',
  'postmortem.md',
  'outcome.md',
  'handoff.md',
])

export const OPEN_STATUSES = ['draft', 'ready', 'active', 'blocked'] as const

const WORK_ITEM_SCHEMA_REQUIRED = ['schema_version', 'id', 'title', 'track', 'type', 'phase', 'status', 'risk', 'owner', 'conversation_profile', 'last_updated'] as const

const ENUMS = {
  track: ['product', 'support'],
  type: ['feature', 'bug', 'incident', 'hotfix'],
  phase: ['discover', 'triage', 'contain', 'specify', 'plan', 'preflight', 'execute', 'verify', 'release', 'observe', 'learn', 'close'],
  status: ['draft', 'ready', 'active', 'blocked', 'completed', 'cancelled'],
  risk: ['low', 'medium', 'high', 'critical'],
  severity: ['sev1', 'sev2', 'sev3', 'sev4'],
  git_finalization_mode: ['confirm_each', 'automatic'],
  complexity: ['low', 'medium', 'high'],
  impact: ['local', 'module', 'cross-module', 'system'],
  security: ['none', 'relevant', 'sensitive'],
  confidence: ['low', 'medium', 'high'],
  routing_depth: ['minimal', 'standard', 'extended'],
} as const

/** Canonical bootstrap pointers per `.context/context-routing/README.md`. */
const BOOTSTRAP_FILES = Object.freeze([
  'AGENTS.md',
  '.context/INDEX.md',
  '.context/config.json',
  '.context/classification/README.md',
  '.context/interaction/README.md',
  '.context/context-routing/README.md',
  '.context/context-routing/catalog.md',
  '.context/policies/README.md',
])

const MAX_EXPLICIT_PATHS = 20

function packageRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
}

function validatorScript(): string {
  return join(packageRoot(), 'scripts', 'validate_context.py')
}

export function resolveRoot(root: string | undefined, pinnedRoot: string | undefined): string {
  if (pinnedRoot) {
    if (!root) return absoluteRoot(pinnedRoot, process.cwd())
    const requested = absoluteRoot(root, process.cwd())
    const pinned = absoluteRoot(pinnedRoot, process.cwd())
    if (requested !== pinned) {
      throw new CsdToolError(Codes.RootMismatch, `This server is pinned to ${pinned}; refusing to operate on ${requested}`)
    }
    return pinned
  }
  if (!root || !root.startsWith('/')) {
    throw new CsdToolError(Codes.RootRequired, 'An absolute repository root is required (no --root was pinned at startup)')
  }
  return absoluteRoot(root, process.cwd())
}

export interface RepositoryInspection {
  root: string
  exists: boolean
  hasAgentsMd: boolean
  hasContext: boolean
  hasIndex: boolean
  csdInstalled: boolean
  installationProblems: string[]
  needsBootstrap: boolean
  needsOnboarding: boolean
  workItems: WorkItemSummary[]
  csdVersion: string | undefined
}

export interface WorkItemSummary {
  id: string
  title: string
  phase: string
  status: string
  open: boolean
  valid: boolean
}

export interface WorkItemDetail {
  id: string
  path: string
  valid: boolean
  validationErrors: string[]
  metadata: Record<string, unknown> | undefined
  artifacts: string[]
}

async function workItemIdPattern(root: string): Promise<RegExp> {
  const config = await readJson<{ work_item_id_pattern?: string }>(join(root, '.context', 'config.json'))
  return new RegExp(config?.work_item_id_pattern ?? '^[A-Z]+-[0-9]+$')
}

async function workItemsRoot(root: string): Promise<string> {
  return realInside(root, join('.context', 'work'))
}

export async function inspectRepository(root: string): Promise<RepositoryInspection> {
  const resolved = absoluteRoot(root, process.cwd())
  if (!(await exists(resolved))) throw repositoryNotFound(resolved)
  const real = await realInside(resolved, '.')

  const hasAgentsMd = await exists(join(real, 'AGENTS.md'))
  const hasContext = await exists(join(real, '.context'))
  const hasIndex = await exists(join(real, '.context', 'INDEX.md'))
  const hasConfig = await exists(join(real, '.context', 'config.json'))
  const needsBootstrap = !(hasContext && hasIndex && hasConfig)

  const lock = await readJson<{ version?: string; files?: { path: string; sha256: string }[] }>(join(real, '.agents', '.csd-lock.json'))
  const installationProblems: string[] = []
  if (lock) {
    for (const file of lock.files ?? []) {
      const target = join(real, file.path)
      if (!(await exists(target))) {
        installationProblems.push(`missing: ${file.path}`)
        continue
      }
      if ((await sha256(await readFile(target))) !== file.sha256) installationProblems.push(`modified: ${file.path}`)
    }
  }

  let needsOnboarding = false
  if (!needsBootstrap) {
    const config = await readJson<{ project?: { name?: string; repository?: string } }>(join(real, '.context', 'config.json'))
    const overview = await readInsideOrNull(real, join('.context', 'project', 'overview.md'))
    needsOnboarding = config?.project?.name === 'Adopting project'
      || overview === null
      || overview.includes('NOT FOUND')
  }

  return {
    root: real,
    exists: true,
    hasAgentsMd,
    hasContext,
    hasIndex,
    csdInstalled: lock !== undefined,
    installationProblems,
    needsBootstrap,
    needsOnboarding,
    workItems: await listWorkItems(real),
    csdVersion: lock?.version,
  }
}

async function readInsideOrNull(root: string, relative: string): Promise<string | null> {
  try {
    return await readInside(root, relative)
  } catch {
    return null
  }
}

async function readJsonOrNull<T>(path: string): Promise<T | undefined> {
  try {
    return await readJson<T>(path)
  } catch {
    return undefined
  }
}

export async function listWorkItems(root: string): Promise<WorkItemSummary[]> {
  const workRoot = await workItemsRoot(root)
  const pattern = await workItemIdPattern(root)
  const entries = await readdir(workRoot, { withFileTypes: true }).catch(() => [])
  const summaries: WorkItemSummary[] = []
  for (const entry of entries) {
    if (!entry.isDirectory() || !pattern.test(entry.name)) continue
    const metadata = await readJsonOrNull<Record<string, unknown>>(join(workRoot, entry.name, 'work-item.json'))
    summaries.push({
      id: entry.name,
      title: typeof metadata?.['title'] === 'string' ? metadata['title'] as string : entry.name,
      phase: typeof metadata?.['phase'] === 'string' ? metadata['phase'] as string : 'unknown',
      status: typeof metadata?.['status'] === 'string' ? metadata['status'] as string : 'unknown',
      open: typeof metadata?.['status'] === 'string' ? (OPEN_STATUSES as readonly string[]).includes(metadata['status'] as string) : true,
      valid: metadata !== undefined,
    })
  }
  return summaries.sort((a, b) => a.id.localeCompare(b.id))
}

export async function readWorkItem(root: string, id: string): Promise<WorkItemDetail> {
  const resolved = absoluteRoot(root, process.cwd())
  if (!(await exists(resolved))) throw repositoryNotFound(resolved)
  const pattern = await workItemIdPattern(resolved)
  if (!pattern.test(id)) throw new CsdToolError(Codes.WorkItemInvalid, `Work item id does not match ${pattern.source}: ${id}`)
  const directory = await realInside(resolved, join('.context', 'work', id))
  if (!(await exists(directory))) {
    throw new CsdToolError(Codes.WorkItemNotFound, `Work item does not exist: ${id}`)
  }
  const metadataPath = join(directory, 'work-item.json')
  const metadata = await readJsonOrNull<Record<string, unknown>>(metadataPath)
  const validationErrors = metadata === undefined
    ? [await exists(metadataPath) ? 'work-item.json is not valid JSON' : 'work-item.json is missing or unreadable']
    : validateWorkItemShape(id, metadata)
  const artifactFiles = (await listFiles(directory)).map((file) => file.slice(directory.length + sep.length))
  return {
    id,
    path: join('.context', 'work', id),
    valid: validationErrors.length === 0,
    validationErrors,
    metadata,
    artifacts: artifactFiles,
  }
}

/** Structural mirror of `.context/schemas/work-item.schema.json` (required, enums, conditionals). */
export function validateWorkItemShape(expectedId: string, value: Record<string, unknown>): string[] {
  const errors: string[] = []
  for (const key of WORK_ITEM_SCHEMA_REQUIRED) {
    if (value[key] === undefined) errors.push(`missing required field: ${key}`)
  }
  if (value['schema_version'] !== undefined && value['schema_version'] !== '1.0') errors.push('schema_version must be "1.0"')
  if (value['id'] !== undefined && value['id'] !== expectedId) errors.push(`id must match the work item directory (${expectedId})`)
  for (const [key, allowed] of Object.entries(ENUMS)) {
    const field = key === 'routing_depth' ? null : key
    if (field && value[field] !== undefined && !(allowed as readonly string[]).includes(value[field] as string)) {
      errors.push(`${field} must be one of ${(allowed as readonly string[]).join(', ')}`)
    }
  }
  const classification = value['classification']
  if (classification !== undefined) {
    if (typeof classification !== 'object' || classification === null) {
      errors.push('classification must be an object')
    } else {
      const record = classification as Record<string, unknown>
      for (const key of ['complexity', 'impact', 'security', 'confidence'] as const) {
        if (record[key] === undefined) errors.push(`classification missing required field: ${key}`)
        else if (!(ENUMS[key as 'complexity' | 'impact' | 'security' | 'confidence'] as readonly string[]).includes(record[key] as string)) {
          errors.push(`classification.${key} has an invalid value`)
        }
      }
    }
  }
  const type = value['type']
  if (type === 'incident' || type === 'hotfix') {
    if (value['severity'] === undefined) errors.push('severity is required for incident and hotfix work items')
    if (value['track'] !== undefined && value['track'] !== 'support') errors.push('incident and hotfix work items must use the support track')
  }
  if (value['track'] === 'product' && type !== undefined && type !== 'feature') errors.push('product track work items must use type feature')
  return errors
}

export interface ArtifactWriteResult {
  path: string
  bytes: number
  sha256: string
  workItem: string
  artifact: string
}

export async function writeArtifact(root: string, workItemId: string, artifact: string, content: string): Promise<ArtifactWriteResult> {
  const resolved = absoluteRoot(root, process.cwd())
  if (!(await exists(resolved))) throw repositoryNotFound(resolved)
  if (!(await exists(join(resolved, '.context', 'work')))) {
    throw new CsdToolError(Codes.NotACsdRepository, 'This repository has no `.context/work/`; run onboarding or bootstrap first')
  }
  if (!ARTIFACT_ALLOWLIST.includes(artifact)) {
    throw new CsdToolError(Codes.ArtifactNotAllowed, `Artifact is not allowlisted: ${artifact}`, { allowed: ARTIFACT_ALLOWLIST })
  }
  if (typeof content !== 'string' || content.length === 0) {
    throw new CsdToolError(Codes.ContentInvalid, 'Content must be a non-empty string')
  }
  if (content.length > 512 * 1024) {
    throw new CsdToolError(Codes.ContentInvalid, 'Content exceeds the 512 KiB artifact limit')
  }
  const pattern = await workItemIdPattern(resolved)
  if (!pattern.test(workItemId)) {
    throw new CsdToolError(Codes.WorkItemInvalid, `Work item id does not match ${pattern.source}: ${workItemId}`)
  }

  if (artifact === 'work-item.json') {
    // Creating or replacing work-item.json is the allowlisted way to open a work
    // item, so existence is not required here — but structure is.
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(content) as Record<string, unknown>
    } catch {
      throw new CsdToolError(Codes.ContentInvalid, 'work-item.json content is not valid JSON')
    }
    const shapeErrors = validateWorkItemShape(workItemId, parsed)
    if (shapeErrors.length > 0) {
      throw new CsdToolError(Codes.WorkItemInvalid, 'work-item.json failed structural validation', { errors: shapeErrors })
    }
  } else {
    const detail = await readWorkItem(resolved, workItemId)
    if (!detail.artifacts.includes('work-item.json')) {
      throw new CsdToolError(Codes.WorkItemNotFound, `Work item has no work-item.json; create it before writing ${artifact}`)
    }
  }

  const target = join(resolved, '.context', 'work', workItemId, artifact)
  const written = await atomicWriteInside(resolved, target, content)
  const relative = join('.context', 'work', workItemId, artifact)
  return {
    path: relative,
    bytes: Buffer.byteLength(content, 'utf8'),
    sha256: await sha256(content),
    workItem: workItemId,
    artifact,
  }
}

export interface ContextResult {
  root: string
  bootstrap: { path: string; content: string }[]
  references: { path: string; purpose: string }[]
  openWorkItems: WorkItemSummary[]
  additional: { path: string; content: string }[]
  request: string | undefined
}

const REFERENCES: readonly { path: string; purpose: string }[] = Object.freeze([
  { path: '.context/classification/routing.md', purpose: 'Derive routing depth from classification' },
  { path: '.context/classification/complexity.md', purpose: 'Classify complexity' },
  { path: '.context/classification/impact.md', purpose: 'Classify impact' },
  { path: '.context/classification/security.md', purpose: 'Classify security relevance' },
  { path: '.context/interaction/decision-policy.md', purpose: 'Decision categories and authority' },
  { path: '.context/interaction/questioning.md', purpose: 'When and how to ask the human' },
  { path: '.context/interaction/uncertainty.md', purpose: 'Known / inferred / unknown / NOT FOUND' },
  { path: '.context/interaction/escalation.md', purpose: 'Escalation triggers and report' },
  { path: '.context/workflows/core.md', purpose: 'Shared delivery lifecycle and gates' },
  { path: '.context/workflows/product.md', purpose: 'Product feature overlay' },
  { path: '.context/workflows/support.md', purpose: 'Support overlay' },
  { path: '.context/prompts/intake.md', purpose: 'Intake questions' },
  { path: '.context/prompts/start-conversation.md', purpose: 'Conversation startup contract' },
  { path: '.context/prompts/initialize-project.md', purpose: 'Project onboarding contract' },
  { path: '.context/prompts/specify.md', purpose: 'Specify phase contract' },
  { path: '.context/prompts/plan.md', purpose: 'Plan phase contract' },
  { path: '.context/prompts/preflight.md', purpose: 'Preflight phase contract' },
  { path: '.context/prompts/execute-and-test.md', purpose: 'Execute phase contract' },
  { path: '.context/prompts/verify.md', purpose: 'Verify phase contract' },
  { path: '.context/prompts/release.md', purpose: 'Release phase contract' },
  { path: '.context/prompts/close.md', purpose: 'Close phase contract' },
  { path: '.context/context-routing/budgets.md', purpose: 'Context budgets per routing depth' },
  { path: '.context/context-routing/triggers.md', purpose: 'Domain promotion triggers' },
  { path: '.context/templates/common/work-item.json', purpose: 'Work item template' },
  { path: 'scripts/validate_context.py', purpose: 'Repository validator (run with python3)' },
])

export async function collectContext(root: string, request?: string, paths?: string[]): Promise<ContextResult> {
  const resolved = absoluteRoot(root, process.cwd())
  if (!(await exists(resolved))) throw repositoryNotFound(resolved)
  const inspection = await inspectRepository(resolved)
  if (inspection.needsBootstrap) {
    throw new CsdToolError(Codes.NotACsdRepository, 'Repository is not initialized for CSD; bootstrap is required first', {
      needsBootstrap: true,
    })
  }

  const bootstrap: { path: string; content: string }[] = []
  for (const relative of BOOTSTRAP_FILES) {
    const content = await readInsideOrNull(resolved, relative)
    if (content !== null) bootstrap.push({ path: relative, content })
  }

  const additional: { path: string; content: string }[] = []
  if (paths && paths.length > 0) {
    if (paths.length > MAX_EXPLICIT_PATHS) {
      throw new CsdToolError(Codes.ContentInvalid, `At most ${MAX_EXPLICIT_PATHS} explicit paths per call`)
    }
    const contextRoot = await realInside(resolved, '.context')
    for (const requested of paths) {
      const target = resolve(contextRoot, requested)
      if (!target.startsWith(`${contextRoot}${sep}`)) {
        throw new CsdToolError(Codes.PathEscape, `Path escapes .context/: ${requested}`)
      }
      const content = await readInsideOrNull(resolved, join('.context', requested))
      if (content === null) {
        throw new CsdToolError(Codes.ContentInvalid, `Requested path does not exist under .context/: ${requested}`)
      }
      additional.push({ path: join('.context', requested), content })
    }
  }

  return {
    root: resolved,
    bootstrap,
    references: [...REFERENCES],
    openWorkItems: inspection.workItems.filter((item) => item.open),
    additional,
    request,
  }
}

export interface ValidationOutcome {
  ran: boolean
  ok: boolean
  exitCode: number
  errors: string[]
  warnings: string[]
  command: string
}

export async function runValidation(root: string, strict = true): Promise<ValidationOutcome> {
  const resolved = absoluteRoot(root, process.cwd())
  if (!(await exists(resolved))) throw repositoryNotFound(resolved)
  const script = validatorScript()
  if (!(await exists(script))) {
    throw new CsdToolError(Codes.ValidationNotRun, 'CSD validator script is not available in this installation')
  }
  const args = [script, '--root', resolved, '--json']
  if (strict) args.push('--strict')
  const command = `python3 ${args.map((argument) => JSON.stringify(argument)).join(' ')}`
  let stdout = ''
  let stderr = ''
  let exitCode: number
  try {
    exitCode = await new Promise<number>((resolvePromise, rejectPromise) => {
      const child = spawn('python3', args, { stdio: ['ignore', 'pipe', 'pipe'] })
      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8')
      })
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8')
      })
      child.on('error', rejectPromise)
      child.on('close', (code) => resolvePromise(code ?? 1))
    })
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      throw new CsdToolError(Codes.ValidationNotRun, 'python3 is not available on PATH; validation did not run', { stderr })
    }
    throw new CsdToolError(Codes.ValidationNotRun, `Validation could not be executed: ${error instanceof Error ? error.message : String(error)}`)
  }
  const parsed = parseValidatorJson(stdout)
  if (!parsed) {
    throw new CsdToolError(Codes.ValidationNotRun, `Validator produced no structured report (exit ${exitCode})`, { stderr: stderr.slice(0, 2000) })
  }
  return {
    ran: true,
    ok: parsed.ok === true && exitCode === 0,
    exitCode,
    errors: parsed.errors ?? [],
    warnings: parsed.warnings ?? [],
    command,
  }
}

function parseValidatorJson(stdout: string): { ok?: boolean; errors?: string[]; warnings?: string[] } | undefined {
  const lines = stdout.split('\n').map((line) => line.trim()).filter(Boolean)
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line: string | undefined = lines[index]
    if (line === undefined) continue
    if (line.startsWith('{')) {
      try {
        return JSON.parse(line) as { ok?: boolean; errors?: string[]; warnings?: string[] }
      } catch {
        return undefined
      }
    }
  }
  return undefined
}

export interface BootstrapPlan {
  root: string
  files: { path: string; action: 'create' | 'overwrite' | 'skip' | 'merge' }[]
  token: string
  summary: string
}

/** Read-only mirror of `installer.bootstrap()` used to build the gate token. */
export async function bootstrapPreview(root: string): Promise<BootstrapPlan> {
  const resolved = absoluteRoot(root, process.cwd())
  if (!(await exists(resolved))) throw repositoryNotFound(resolved)
  const source = await templateRoot()
  const contextSource = join(source, '.context')
  const sourceFiles = (await listFiles(contextSource)).filter(
    (file) => !file.slice(contextSource.length + 1).startsWith(`work${sep}`) && file.slice(contextSource.length + 1) !== 'work',
  )
  const files: BootstrapPlan['files'] = []
  const digest = createHash('sha256')
  for (const file of sourceFiles) {
    const relativePath = file.slice(contextSource.length + 1)
    const target = join(resolved, '.context', relativePath)
    const action = (await exists(target)) ? 'skip' : 'create'
    files.push({ path: join('.context', relativePath), action })
    digest.update(`${relativePath}:${await sha256(await readFile(file, 'utf8'))}:${action}`)
  }
  const agentTarget = join(resolved, 'AGENTS.md')
  if (!(await exists(agentTarget))) {
    files.push({ path: 'AGENTS.md', action: 'create' })
    digest.update('AGENTS.md:create')
  } else {
    const current = await readFile(agentTarget, 'utf8')
    const action = current.includes('<!-- CSD:BEGIN -->') ? 'skip' : 'merge'
    files.push({ path: 'AGENTS.md', action })
    digest.update(`AGENTS.md:${action}:${await sha256(current)}`)
  }
  const token = digest.digest('hex')
  const creates = files.filter((file) => file.action !== 'skip').length
  return {
    root: resolved,
    files,
    token,
    summary: `${creates} file(s) to create or merge, ${files.length - creates} already present. Nothing was written. Call csd_bootstrap_apply with this token to materialize.`,
  }
}

export async function bootstrapApply(root: string, token: string): Promise<{ created: string[]; skipped: string[] }> {
  const preview = await bootstrapPreview(root)
  if (!token || token !== preview.token) {
    throw new CsdToolError(Codes.BootstrapGate, 'Bootstrap apply requires the exact token returned by csd_bootstrap_preview for the current repository state', {
      expectedState: preview.summary,
    })
  }
  return bootstrap(absoluteRoot(root, process.cwd()), false)
}

export const CSD_VERSION = PACKAGE_VERSION
