import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { absoluteRoot, atomicWriteInside, exists, listFiles, readInside, readJson, realInside, sha256 } from '../fs.js'
import { PACKAGE_VERSION } from '../installer.js'
import { bootstrapApply as applyContextBootstrap, bootstrapPreview as createContextBootstrapPreview, discoverContext, inspectContextPath, readContextFile, writeContextFile, validateWorkItemPattern, type DiscoveryResult } from '../context.js'
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
  discovery: DiscoveryResult
  contextLayout?: string
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
  const discovery = await discoverContext(root)
  if (discovery.status !== 'resolved' || !discovery.paths) return /^[A-Z]+-[0-9]+$/
  const info = await inspectContextPath(root, discovery.paths.config)
  if (info.unsafe) throw new CsdToolError(Codes.PathEscape, info.unsafe)
  if (!info.exists) return /^[A-Z]+-[0-9]+$/
  if (info.kind !== 'file') throw new CsdToolError(Codes.ContentInvalid, 'Selected adapter config is not a regular file')
  const config = JSON.parse(await readContextFile(root, discovery.paths.config)) as { work_item_id_pattern?: string }
  return validateWorkItemPattern(config.work_item_id_pattern)
}

function matchesWorkItemId(pattern: RegExp, id: string): boolean {
  if (id.length === 0 || id.length > 64) return false
  return pattern.exec(id)?.[0] === id
}

async function workItemsRoot(root: string): Promise<{ path: string; relativePath: string } | undefined> {
  const discovery = await discoverContext(root)
  if (discovery.status !== 'resolved' || !discovery.paths) return undefined
  const relativePath = discovery.paths.work.replace(/\/$/, '')
  const info = await inspectContextPath(root, relativePath)
  if (info.unsafe) throw new CsdToolError(Codes.PathEscape, info.unsafe)
  return { path: join(root, relativePath), relativePath }
}

export async function inspectRepository(root: string): Promise<RepositoryInspection> {
  const resolved = absoluteRoot(root, process.cwd())
  if (!(await exists(resolved))) throw repositoryNotFound(resolved)
  const real = await realInside(resolved, '.')
  const discovery = await discoverContext(real)
  const hasAgentsMd = await exists(join(real, 'AGENTS.md'))
  const hasContext = discovery.status === 'resolved'
  const hasIndex = discovery.status === 'resolved' && discovery.capabilities.index
  const hasConfig = discovery.status === 'resolved'
  const needsBootstrap = discovery.status !== 'resolved'

  const lock = await readJson<{ version?: string; files?: { path: string; sha256: string }[] }>(join(real, '.agents', '.csd-lock.json'))
  const installationProblems: string[] = []
  if (lock) {
    for (const file of lock.files ?? []) {
      const target = join(real, file.path)
      if (!(await exists(target))) {
        installationProblems.push('missing: ' + file.path)
        continue
      }
      if ((await sha256(await readFile(target))) !== file.sha256) installationProblems.push('modified: ' + file.path)
    }
  }

  return {
    root: real,
    discovery,
    ...(discovery.layout ? { contextLayout: discovery.layout } : {}),
    exists: true,
    hasAgentsMd,
    hasContext,
    hasIndex,
    csdInstalled: lock !== undefined,
    installationProblems,
    needsBootstrap,
    needsOnboarding: discovery.onboarding_required,
    workItems: await listWorkItems(real),
    csdVersion: lock?.version,
  }
}

async function readInsideOrNull(root: string, relative: string): Promise<string | null> {
  try {
    return await readContextFile(root, relative)
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
  const work = await workItemsRoot(root)
  if (!work) return []
  const pattern = await workItemIdPattern(root)
  const entries = await readdir(work.path, { withFileTypes: true }).catch(() => [])
  const summaries: WorkItemSummary[] = []
  for (const entry of entries) {
    if (!entry.isDirectory() || !matchesWorkItemId(pattern, entry.name)) continue
    const directoryRelative = work.relativePath + '/' + entry.name
    const directoryInfo = await inspectContextPath(root, directoryRelative)
    if (!directoryInfo.exists || directoryInfo.kind !== 'directory' || directoryInfo.unsafe) continue
    let metadata: Record<string, unknown> | undefined
    try { metadata = JSON.parse(await readContextFile(root, directoryRelative + '/work-item.json')) as Record<string, unknown> } catch { metadata = undefined }
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
  const discovery = await discoverContext(resolved)
  if (discovery.status !== 'resolved' || !discovery.paths) throw new CsdToolError(Codes.NotACsdRepository, 'No valid context layout is selected')
  const pattern = await workItemIdPattern(resolved)
  if (!matchesWorkItemId(pattern, id)) throw new CsdToolError(Codes.WorkItemInvalid, 'Work item id does not match ' + pattern.source + ': ' + id)
  const directoryRelative = discovery.paths.work.replace(/\/$/, '') + '/' + id
  const directoryInfo = await inspectContextPath(resolved, directoryRelative)
  if (directoryInfo.unsafe) throw new CsdToolError(Codes.PathEscape, directoryInfo.unsafe)
  if (!directoryInfo.exists || directoryInfo.kind !== 'directory') throw new CsdToolError(Codes.WorkItemNotFound, 'Work item does not exist: ' + id)
  const directory = join(resolved, directoryRelative)
  const metadataPath = directoryRelative + '/work-item.json'
  let metadata: Record<string, unknown> | undefined
  try { metadata = JSON.parse(await readContextFile(resolved, metadataPath)) as Record<string, unknown> } catch { metadata = undefined }
  const metadataInfo = await inspectContextPath(resolved, metadataPath)
  if (metadataInfo.unsafe) throw new CsdToolError(Codes.PathEscape, metadataInfo.unsafe)
  const validationErrors = metadata === undefined
    ? [metadataInfo.exists ? 'work-item.json is not valid JSON' : 'work-item.json is missing or unreadable']
    : validateWorkItemShape(id, metadata)
  const artifactFiles = (await listFiles(directory)).map((file) => file.slice(directory.length + sep.length))
  return {
    id,
    path: directoryRelative,
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
  const discovery = await discoverContext(resolved)
  if (discovery.status !== 'resolved' || !discovery.paths) throw new CsdToolError(Codes.NotACsdRepository, 'No valid context layout is selected')
  const workRoot = discovery.paths.work.replace(/\/$/, '')
  const workInfo = await inspectContextPath(resolved, workRoot)
  if (workInfo.unsafe) throw new CsdToolError(Codes.PathEscape, workInfo.unsafe)
  if (!workInfo.exists || workInfo.kind !== 'directory') {
    throw new CsdToolError(Codes.NotACsdRepository, 'This repository has no selected work-item directory; run onboarding or bootstrap first')
  }
  if (!ARTIFACT_ALLOWLIST.includes(artifact)) {
    throw new CsdToolError(Codes.ArtifactNotAllowed, 'Artifact is not allowlisted: ' + artifact, { allowed: ARTIFACT_ALLOWLIST })
  }
  if (typeof content !== 'string' || content.length === 0) throw new CsdToolError(Codes.ContentInvalid, 'Content must be a non-empty string')
  if (content.length > 512 * 1024) throw new CsdToolError(Codes.ContentInvalid, 'Content exceeds the 512 KiB artifact limit')
  const pattern = await workItemIdPattern(resolved)
  if (!matchesWorkItemId(pattern, workItemId)) throw new CsdToolError(Codes.WorkItemInvalid, 'Work item id does not match ' + pattern.source + ': ' + workItemId)
  if (artifact === 'work-item.json') {
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(content) as Record<string, unknown> } catch { throw new CsdToolError(Codes.ContentInvalid, 'work-item.json content is not valid JSON') }
    const shapeErrors = validateWorkItemShape(workItemId, parsed)
    if (shapeErrors.length > 0) throw new CsdToolError(Codes.WorkItemInvalid, 'work-item.json failed structural validation', { errors: shapeErrors })
  } else {
    const detail = await readWorkItem(resolved, workItemId)
    if (!detail.artifacts.includes('work-item.json')) throw new CsdToolError(Codes.WorkItemNotFound, 'Work item has no work-item.json; create it before writing ' + artifact)
  }
  const relativePath = workRoot + '/' + workItemId + '/' + artifact
  await writeContextFile(resolved, relativePath, content)
  return {
    path: relativePath,
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
  const discovery = inspection.discovery
  if (discovery.status !== 'resolved' || !discovery.paths) {
    throw new CsdToolError(Codes.NotACsdRepository, 'Repository has no uniquely selected CSD context layout', {
      discovery: discovery.status,
      conflicts: discovery.conflicts,
    })
  }
  const base = discovery.paths.root
  const bootstrapPaths = [
    'AGENTS.md',
    discovery.paths.index,
    discovery.paths.workflow,
    discovery.paths.config,
    discovery.paths.routing + '/README.md',
    discovery.paths.routing + '/catalog.md',
    base + '/classification/README.md',
    base + '/interaction/README.md',
    base + '/policies/README.md',
    ...discovery.paths.onboardingSources,
  ]
  const bootstrap: { path: string; content: string }[] = []
  for (const relativePath of [...new Set(bootstrapPaths)]) {
    const content = await readInsideOrNull(resolved, relativePath)
    if (content !== null) bootstrap.push({ path: relativePath, content })
  }
  const references = [...REFERENCES]
  if (discovery.mode !== 'native') {
    const compatibilityReferences: typeof REFERENCES[number][] = []
    for (const reference of REFERENCES) {
      if (reference.path.startsWith('.context/prompts/')) continue
      let target = reference.path.replaceAll('.context', base)
      if (reference.path === '.context/INDEX.md') target = discovery.paths.index
      else if (reference.path === '.context/config.json') target = discovery.paths.config
      else if (reference.path.startsWith('.context/context-routing/')) target = discovery.paths.routing + reference.path.slice('.context/context-routing'.length)
      else if (reference.path.startsWith('.context/routing/')) target = discovery.paths.routing + reference.path.slice('.context/routing'.length)
      else if (reference.path === '.context/workflows/core.md') target = discovery.paths.workflow
      else if (reference.path.startsWith('.context/work/')) target = discovery.paths.work + reference.path.slice('.context/work'.length)
      else if (reference.path.startsWith('.context/templates/')) target = discovery.paths.templates + reference.path.slice('.context/templates'.length)
      else if (reference.path.startsWith('.context/scripts/')) target = discovery.paths.scripts + reference.path.slice('.context/scripts'.length)
      const info = await inspectContextPath(resolved, target)
      if (info.exists && info.kind === 'file' && !info.unsafe) compatibilityReferences.push({ ...reference, path: target })
    }
    for (const onboardingPath of discovery.paths.onboardingSources) {
      if (!compatibilityReferences.some((reference) => reference.path === onboardingPath)) compatibilityReferences.push({ path: onboardingPath, purpose: 'Selected adapter workflow and onboarding source' })
    }
    for (const routingPath of [discovery.paths.routing + '/README.md', discovery.paths.routing + '/catalog.md']) {
      const info = await inspectContextPath(resolved, routingPath)
      if (info.exists && info.kind === 'file' && !info.unsafe && !compatibilityReferences.some((reference) => reference.path === routingPath)) compatibilityReferences.push({ path: routingPath, purpose: 'Selected adapter routing guidance' })
    }
    references.splice(0, references.length, ...compatibilityReferences)
  }
  const additional: { path: string; content: string }[] = []
  if (paths && paths.length > 0) {
    if (paths.length > MAX_EXPLICIT_PATHS) throw new CsdToolError(Codes.ContentInvalid, 'At most ' + MAX_EXPLICIT_PATHS + ' explicit paths per call')
    for (const requested of paths) {
      const normalized = requested.replaceAll('\\', '/')
      if (normalized.startsWith('/') || normalized.split('/').some((part) => part === '.' || part === '..' || part === '')) {
        throw new CsdToolError(Codes.PathEscape, 'Requested path must stay under ' + base + '/: ' + requested)
      }
      const relativePath = base + '/' + normalized
      const info = await inspectContextPath(resolved, relativePath)
      if (info.unsafe) throw new CsdToolError(Codes.PathEscape, info.unsafe)
      if (!info.exists || info.kind !== 'file') throw new CsdToolError(Codes.ContentInvalid, 'Requested path does not exist under ' + base + '/: ' + requested)
      const content = await readContextFile(resolved, relativePath)
      additional.push({ path: relativePath, content })
    }
  }
  return {
    root: resolved,
    bootstrap,
    references,
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
  discovery: DiscoveryResult
  files: { path: string; action: 'create' | 'merge' | 'skip' | 'conflict' | 'protected'; owner?: string | undefined; sha256?: string | undefined; reason?: string | undefined }[]
  conflicts: string[]
  token: string
  summary: string
}

export async function bootstrapPreview(root: string): Promise<BootstrapPlan> {
  const resolved = absoluteRoot(root, process.cwd())
  if (!(await exists(resolved))) throw repositoryNotFound(resolved)
  return createContextBootstrapPreview(resolved)
}

export async function bootstrapApply(root: string, token: string, confirmed = true): Promise<{ created: string[]; skipped: string[]; conflicts: string[] }> {
  const resolved = absoluteRoot(root, process.cwd())
  if (!(await exists(resolved))) throw repositoryNotFound(resolved)
  try {
    return await applyContextBootstrap(resolved, token, confirmed)
  } catch (error) {
    throw new CsdToolError(Codes.BootstrapGate, error instanceof Error ? error.message : String(error))
  }
}

export const CSD_VERSION = PACKAGE_VERSION
