import { homedir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, rm } from 'node:fs/promises'
import { ADAPTERS, getAdapter } from './adapters.js'
import { bootstrapApply as applyContextBootstrap, bootstrapPreview as createContextBootstrapPreview, discoverContext } from './context.js'
import { absoluteRoot, atomicWrite, exists, readJson, sha256, writeJson } from './fs.js'
import type { Adapter, AgentId, InstallOptions, InstalledFile, LockFile, OperationReport, PlannedFile, Scope } from './types.js'

export const PACKAGE_NAME = '@owlcodium/context-spec-develop'
export const PACKAGE_VERSION = '1.2.1'

function packageRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..')
}

export function installRoot(scope: Scope, requestedRoot?: string): string {
  return absoluteRoot(requestedRoot, scope === 'global' ? homedir() : process.cwd())
}

export function lockPath(scope: Scope, root: string): string {
  return join(root, '.agents', '.csd-lock.json')
}

function ownedPath(root: string, relativePath: string): string {
  const absolute = resolve(root, relativePath)
  const prefix = `${resolve(root)}${sep}`
  if (absolute !== resolve(root) && !absolute.startsWith(prefix)) {
    throw new Error(`Lockfile path escapes installation root: ${relativePath}`)
  }
  return absolute
}

async function skillContent(): Promise<string> {
  const candidates = [
    join(packageRoot(), 'skill', 'csd', 'SKILL.md'),
    join(packageRoot(), 'assets', 'template', 'skill', 'csd', 'SKILL.md'),
    join(process.cwd(), 'skill', 'csd', 'SKILL.md'),
  ]
  for (const candidate of candidates) if (await exists(candidate)) return readFile(candidate, 'utf8')
  throw new Error('CSD skill asset is missing from the package')
}

export async function templateRoot(): Promise<string> {
  const candidates = [join(packageRoot(), 'assets', 'template'), join(process.cwd(), 'assets', 'template'), packageRoot()]
  for (const candidate of candidates) if (await exists(join(candidate, '.context'))) return candidate
  throw new Error('CSD template assets are missing from the package')
}

function commandMarkdown(adapter: Adapter): string {
  return `# CSD\n\n${adapter.activation}\n\nApply the installed \`csd\` skill. Follow its CSD bootstrap protocol exactly: inspect first, show a preview before materializing missing context, wait for the user's confirmation, then run onboarding and the requested workflow.\n\nUser request: $ARGUMENTS\n`
}

function commandToml(adapter: Adapter): string {
  return `description = "Start the Context Spec Develop workflow"\nprompt = """\n${adapter.activation}\n\nApply the installed csd skill. Follow the CSD bootstrap protocol exactly: inspect first, show a preview before materializing missing context, wait for the user's confirmation, then run onboarding and the requested workflow.\n\nUser request: {{args}}\n"""\n`
}

export async function plannedFiles(agents: AgentId[], scope: Scope): Promise<PlannedFile[]> {
  const skill = await skillContent()
  const files = new Map<string, PlannedFile>()
  for (const id of agents) {
    const adapter = getAdapter(id)
    const skillPath = scope === 'global' && adapter.globalSkillPath ? adapter.globalSkillPath : adapter.skillPath
    const commandPath = scope === 'global' && adapter.globalCommandPath ? adapter.globalCommandPath : adapter.commandPath
    files.set(skillPath, { relativePath: skillPath, content: skill })
    if (commandPath && adapter.commandFormat === 'toml') {
      files.set(commandPath, { relativePath: commandPath, content: commandToml(adapter) })
    } else if (commandPath) {
      files.set(commandPath, { relativePath: commandPath, content: commandMarkdown(adapter) })
    }
  }
  return [...files.values()]
}

async function loadLock(scope: Scope, root: string): Promise<LockFile | undefined> {
  const lock = await readJson<LockFile>(lockPath(scope, root))
  if (!lock) return undefined
  if (lock.schemaVersion !== 1 || lock.package !== PACKAGE_NAME || lock.scope !== scope || !Array.isArray(lock.files)) {
    throw new Error(`Invalid CSD lockfile: ${lockPath(scope, root)}`)
  }
  for (const file of lock.files) {
    if (!file || typeof file.path !== 'string' || typeof file.sha256 !== 'string') throw new Error(`Invalid CSD lockfile entry: ${lockPath(scope, root)}`)
    ownedPath(root, file.path)
  }
  return lock
}

function mergeFiles(existing: InstalledFile[], additions: InstalledFile[]): InstalledFile[] {
  const byPath = new Map(existing.map((file) => [file.path, file]))
  for (const file of additions) byPath.set(file.path, file)
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path))
}

export async function install(options: InstallOptions): Promise<OperationReport> {
  const root = installRoot(options.scope, options.root)
  const agents = options.agents.length > 0 ? options.agents : ADAPTERS.map((adapter) => adapter.id)
  const plans = await plannedFiles(agents, options.scope)
  const skipped: string[] = []
  const warnings: string[] = []
  const installed: InstalledFile[] = []

  // Validate every collision before the first write so a rejected install cannot
  // leave a partially installed set of adapters behind.
  if (!options.force) {
    for (const plan of plans) {
      const target = ownedPath(root, plan.relativePath)
      if (await exists(target) && (await readFile(target, 'utf8')) !== plan.content) {
        throw new Error(`Refusing to overwrite existing file: ${target}. Use --force after reviewing it.`)
      }
    }
  }

  for (const plan of plans) {
    const target = ownedPath(root, plan.relativePath)
    const digest = await sha256(plan.content)
    if (await exists(target)) {
      const current = await readFile(target, 'utf8')
      if (current === plan.content) {
        skipped.push(plan.relativePath)
        installed.push({ path: plan.relativePath, sha256: digest })
        continue
      }
      if (!options.force) throw new Error(`Refusing to overwrite existing file: ${target}. Use --force after reviewing it.`)
      warnings.push(`Overwrote existing file: ${plan.relativePath}`)
    }
    await atomicWrite(target, plan.content)
    installed.push({ path: plan.relativePath, sha256: digest })
  }

  const previous = await loadLock(options.scope, root)
  const lock: LockFile = {
    schemaVersion: 1,
    package: PACKAGE_NAME,
    version: PACKAGE_VERSION,
    scope: options.scope,
    installedAt: new Date().toISOString(),
    agents: [...new Set([...(previous?.agents ?? []), ...agents])].sort(),
    files: mergeFiles(previous?.files ?? [], installed),
  }
  await writeJson(lockPath(options.scope, root), lock)
  return { scope: options.scope, root, agents, files: installed, skipped, warnings }
}

export interface UpdatePlan {
  scope: Scope
  root: string
  agents: AgentId[]
  files: { path: string; action: 'create' | 'update' | 'skip' | 'conflict' | 'preserved'; reason?: string }[]
  conflicts: string[]
  warnings: string[]
  summary: string
}

export async function updatePreview(scope: Scope, requestedRoot?: string, force = false): Promise<UpdatePlan> {
  const root = installRoot(scope, requestedRoot)
  const previous = await loadLock(scope, root)
  if (!previous) throw new Error('CSD is not installed in this scope')
  const plans = await plannedFiles(previous.agents, scope)
  const previousFiles = new Map(previous.files.map((file) => [file.path, file]))
  const files: UpdatePlan['files'] = []
  const conflicts: string[] = []
  const warnings: string[] = []
  for (const plan of plans) {
    const target = ownedPath(root, plan.relativePath)
    const old = previousFiles.get(plan.relativePath)
    if (!(await exists(target))) {
      files.push({ path: plan.relativePath, action: 'create', reason: 'installed file is missing' })
      continue
    }
    const currentHash = await sha256(await readFile(target))
    const digest = await sha256(plan.content)
    if (currentHash === digest) {
      files.push({ path: plan.relativePath, action: 'skip', reason: 'already matches package content' })
      continue
    }
    if (old && currentHash === old.sha256) {
      files.push({ path: plan.relativePath, action: 'update', reason: 'CSD-owned file has a package update' })
      continue
    }
    if (force) {
      files.push({ path: plan.relativePath, action: 'update', reason: 'force explicitly allows local overwrite' })
      warnings.push(`Would overwrite locally modified file: ${plan.relativePath}`)
      continue
    }
    files.push({ path: plan.relativePath, action: 'conflict', reason: 'file was modified after installation' })
    conflicts.push(plan.relativePath)
  }
  const stale = previous.files.filter((file) => !plans.some((plan) => plan.relativePath === file.path)).map((file) => file.path)
  if (stale.length > 0) {
    warnings.push(`Preserved files no longer packaged: ${stale.join(', ')}`)
    for (const path of stale) files.push({ path, action: 'preserved', reason: 'file is no longer packaged; update never deletes it' })
  }
  const writes = files.filter((file) => file.action === 'create' || file.action === 'update').length
  return {
    scope,
    root,
    agents: previous.agents,
    files,
    conflicts,
    warnings,
    summary: writes + ' file(s) to create or update, ' + (files.length - writes) + ' skipped/preserved/conflicting. Nothing was written.',
  }
}

export async function update(scope: Scope, requestedRoot?: string, force = false): Promise<OperationReport> {
  const preview = await updatePreview(scope, requestedRoot, force)
  const root = preview.root
  const previous = await loadLock(scope, root)
  if (!previous) throw new Error('CSD is not installed in this scope')
  const plans = await plannedFiles(previous.agents, scope)
  const skipped = preview.files.filter((file) => file.action === 'skip').map((file) => file.path)
  const warnings = [...preview.warnings]
  const installed: InstalledFile[] = []
  if (preview.conflicts.length > 0) throw new Error(`Refusing to update locally modified files: ${preview.conflicts.join(', ')}. Use --force after reviewing them.`)

  for (const plan of plans) {
    const target = ownedPath(root, plan.relativePath)
    const digest = await sha256(plan.content)
    const current = await exists(target) ? await readFile(target, 'utf8') : undefined
    if (current === plan.content) continue
    await atomicWrite(target, plan.content)
    if (!installed.some((file) => file.path === plan.relativePath)) installed.push({ path: plan.relativePath, sha256: digest })
  }

  const lock: LockFile = {
    schemaVersion: 1,
    package: PACKAGE_NAME,
    version: PACKAGE_VERSION,
    scope,
    installedAt: new Date().toISOString(),
    agents: previous.agents,
    files: mergeFiles(previous.files, installed),
  }
  await writeJson(lockPath(scope, root), lock)
  return { scope, root, agents: previous.agents, files: installed, skipped, warnings }
}

export async function inspect(scope: Scope, requestedRoot?: string): Promise<{ lock?: LockFile; problems: string[] }> {
  const root = installRoot(scope, requestedRoot)
  const lock = await loadLock(scope, root)
  if (!lock) return { problems: ['CSD is not installed in this scope'] }
  const problems: string[] = []
  for (const file of lock.files) {
    const target = ownedPath(root, file.path)
    if (!(await exists(target))) {
      problems.push(`missing: ${file.path}`)
      continue
    }
    const digest = await sha256(await readFile(target))
    if (digest !== file.sha256) problems.push(`modified: ${file.path}`)
  }
  return { lock, problems }
}

export async function remove(scope: Scope, requestedRoot?: string, force = false): Promise<string[]> {
  const root = installRoot(scope, requestedRoot)
  const lock = await loadLock(scope, root)
  if (!lock) throw new Error('CSD is not installed in this scope')
  const modified: string[] = []
  for (const file of lock.files) {
    const target = ownedPath(root, file.path)
    if (!(await exists(target))) continue
    const digest = await sha256(await readFile(target))
    if (!force && digest !== file.sha256) modified.push(file.path)
  }
  if (modified.length > 0) throw new Error(`Refusing to remove modified files: ${modified.join(', ')}. Use --force after reviewing them.`)
  const removed: string[] = []
  for (const file of lock.files) {
    const target = ownedPath(root, file.path)
    if (!(await exists(target))) continue
    await rm(target)
    removed.push(file.path)
  }
  await rm(lockPath(scope, root), { force: true })
  return removed
}

export async function bootstrap(targetRoot: string, force = false): Promise<{ created: string[]; skipped: string[] }> {
  void force
  const preview = await createContextBootstrapPreview(targetRoot)
  if (preview.discovery.status === 'resolved') return { created: [], skipped: ['AGENTS.md'] }
  if (preview.discovery.status !== 'bootstrap_required' || preview.conflicts.length > 0) {
    throw new Error('Bootstrap is blocked: ' + preview.conflicts.join('; '))
  }
  const result = await applyContextBootstrap(targetRoot, preview.token, true)
  const agentPlan = preview.files.find((file) => file.path === 'AGENTS.md')
  const created = result.created.map((path) => path === 'AGENTS.md' && agentPlan?.action === 'merge' ? 'AGENTS.md (CSD integration)' : path)
  return { created, skipped: result.skipped }
}

export { discoverContext }
